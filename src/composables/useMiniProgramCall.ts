/**
 * 小程序音视频通话组合式函数
 * 使用 live-pusher/live-player 组件
 * 
 * 适用平台：微信小程序
 */
import { reactive, ref, computed } from 'vue'
import * as callApi from '@/api/modules/call'
import * as messageApi from '@/api/modules/message'
import { wsManager } from '@/api/websocket'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import type { ChatMessage, Contact } from '@/types/api'

export interface MiniProgramCallState {
  active: boolean
  minimized: boolean
  type: 'audio' | 'video'
  status: 'idle' | 'outgoing' | 'incoming' | 'connected'
  statusText: string
  roomId: string | null
  callId: string | null
  muted: boolean
  camOff: boolean
  duration: number
  startTime: number | null
  // 来电信息
  callerName?: string
  callerAvatar?: string
  callerId?: string
}

export interface RemoteStream {
  userId: string
  pullUrl: string
  flvUrl?: string
  userName?: string
  userAvatar?: string
}

// --- 全局单例状态 ---
const call = reactive<MiniProgramCallState>({
  active: false,
  minimized: false,
  type: 'video',
  status: 'idle',
  statusText: '',
  roomId: null,
  callId: null,
  muted: false,
  camOff: false,
  duration: 0,
  startTime: null,
})

const pushUrl = ref<string>('')
const remoteStreams = ref<RemoteStream[]>([])
let durationTimer: ReturnType<typeof setInterval> | null = null
let currentReceiverUserId = ''

// live-pusher 组件上下文
let pusherContext: UniApp.LivePusherContext | null = null

export function useMiniProgramCall() {
  const authStore = useAuthStore()
  const chatStore = useChatStore()

  const userId = computed(() => authStore.user?.id || '')
  const isActive = computed(() => call.active)

  /**
   * 初始化 live-pusher 上下文
   */
  function initPusherContext() {
    // #ifdef MP-WEIXIN
    pusherContext = uni.createLivePusherContext()
    // #endif
  }

  /**
   * 初始化信令监听
   */
  function initListener() {
    wsManager.offSignal(handleSignaling)
    wsManager.onSignal(handleSignaling)
  }

  /**
   * 处理信令消息
   */
  async function handleSignaling(message: ChatMessage) {
    try {
      const content = message.content ? JSON.parse(message.content) : {}
      const signal = message.call_status as string
      const extra = message.extra ? (typeof message.extra === 'string' ? JSON.parse(message.extra) : message.extra) : {}

      if (extra.type) call.type = extra.type

      if (signal === 'invite') {
        // 收到来电
        if (call.active) return
        
        currentReceiverUserId = message.sender_user_id
        call.roomId = message.room_id
        call.callId = message.call_id
        call.active = true
        call.minimized = false
        call.status = 'incoming'
        call.statusText = `邀请你${call.type === 'video' ? '视频' : '语音'}通话`
        call.callerId = message.sender_user_id

        // 获取来电者信息
        const contact = chatStore.contacts.find(c => c.contact_user_id === message.sender_user_id)
        if (contact?.user) {
          call.callerName = contact.remark_name || contact.user.name
          call.callerAvatar = contact.user.avatar
        } else if (extra.senderName) {
          call.callerName = extra.senderName
          call.callerAvatar = extra.senderAvatar
        }

        // 播放来电铃声
        playRingtone()

      } else if (signal === 'accepted') {
        // 对方接听
        stopRingtone()
        call.status = 'connected'
        call.statusText = '正在连接...'
        await joinCallRoom()

      } else if (signal === 'participant_joined') {
        // 新参与者加入
        if (content.pull_url) {
          remoteStreams.value.push({
            userId: content.user_id,
            pullUrl: content.pull_url,
            flvUrl: content.flv_url,
            userName: content.user_name,
            userAvatar: content.user_avatar,
          })
        }

      } else if (signal === 'participant_left') {
        // 参与者离开
        remoteStreams.value = remoteStreams.value.filter(s => s.userId !== content.user_id)

      } else if (['hangup', 'ended', 'reject'].includes(signal)) {
        // 通话结束
        closeCall()
        if (signal === 'reject') {
          uni.showToast({ title: '对方已拒绝', icon: 'none' })
        } else {
          uni.showToast({ title: '通话已结束', icon: 'none' })
        }
      }
    } catch (error) {
      console.error('[MiniProgramCall] 处理信令失败:', error)
    }
  }

  /**
   * 发起通话
   */
  async function startCall(
    type: 'audio' | 'video',
    receiverUserId: string,
    roomId: string,
    contact?: Contact
  ): Promise<boolean> {
    if (call.active) {
      uni.showToast({ title: '当前有正在进行的通话', icon: 'none' })
      return false
    }

    currentReceiverUserId = receiverUserId
    call.type = type
    call.roomId = roomId
    call.callId = Date.now().toString()
    call.active = true
    call.minimized = false
    call.status = 'outgoing'
    call.statusText = '正在呼叫...'
    call.duration = 0
    call.camOff = type === 'audio'
    call.callerId = receiverUserId

    // 设置对方信息
    if (contact) {
      call.callerName = contact.remark_name || contact.user?.name
      call.callerAvatar = contact.user?.avatar
    }

    try {
      // 加入房间获取推流地址
      await joinCallRoom()

      // 发送邀请信令
      sendSignal('invite')
      playRingtone()

      return true
    } catch (error: any) {
      uni.showToast({ title: error.message || '发起通话失败', icon: 'none' })
      closeCall()
      return false
    }
  }

  /**
   * 加入通话房间
   */
  async function joinCallRoom() {
    if (!call.roomId || !userId.value) return

    try {
      const response = await callApi.joinCallRoom({
        room_id: call.roomId,
        user_id: userId.value,
        platform: 'miniprogram'
      })

      // 设置推流地址
      if (response.push_url) {
        pushUrl.value = response.push_url
      }

      // 设置拉流地址
      if (response.pull_urls) {
        remoteStreams.value = response.pull_urls.map(p => ({
          userId: p.user_id,
          pullUrl: p.url,
          flvUrl: p.flv_url,
        }))
      }

      // 开始推流
      startPushing()

      // 开始计时
      startCallTimer()
      call.status = 'connected'
      call.statusText = '通话中'

    } catch (error) {
      console.error('[MiniProgramCall] 加入房间失败:', error)
      throw error
    }
  }

  /**
   * 接听来电
   */
  async function acceptCall() {
    stopRingtone()
    call.status = 'connected'
    call.statusText = '正在连接...'

    try {
      await joinCallRoom()
      sendSignal('accepted')
    } catch (error: any) {
      uni.showToast({ title: error.message || '接听失败', icon: 'none' })
      endCall()
    }
  }

  /**
   * 拒绝来电
   */
  function rejectCall() {
    stopRingtone()
    sendSignal('reject')
    closeCall()
  }

  /**
   * 结束通话
   */
  function endCall() {
    stopRingtone()
    sendSignal('hangup')
    leaveRoom()
    closeCall()
  }

  /**
   * 离开房间
   */
  async function leaveRoom() {
    if (!call.roomId || !userId.value) return

    try {
      await callApi.leaveCallRoom({
        room_id: call.roomId,
        user_id: userId.value
      })
    } catch (error) {
      console.error('[MiniProgramCall] 离开房间失败:', error)
    }
  }

  /**
   * 关闭通话
   */
  function closeCall() {
    stopRingtone()
    stopPushing()
    stopCallTimer()

    call.active = false
    call.status = 'idle'
    call.statusText = ''
    call.roomId = null
    call.callId = null
    call.callerName = undefined
    call.callerAvatar = undefined
    call.callerId = undefined
    call.muted = false
    call.camOff = false
    call.duration = 0
    call.startTime = null

    pushUrl.value = ''
    remoteStreams.value = []
    currentReceiverUserId = ''
  }

  /**
   * 开始推流
   */
  function startPushing() {
    // #ifdef MP-WEIXIN
    if (!pusherContext) {
      initPusherContext()
    }
    pusherContext?.start({
      success: () => {
        console.log('[MiniProgramCall] 推流成功')
      },
      fail: (err: any) => {
        console.error('[MiniProgramCall] 推流失败:', err)
      }
    })
    // #endif
  }

  /**
   * 停止推流
   */
  function stopPushing() {
    // #ifdef MP-WEIXIN
    pusherContext?.stop({
      success: () => {
        console.log('[MiniProgramCall] 停止推流')
      }
    })
    // #endif
  }

  /**
   * 发送信令
   */
  function sendSignal(status: string, data?: any) {
    if (!call.callId) return

    const roomId = call.roomId
    if (!roomId) return

    const currentUser = authStore.user
    const payload = {
      sender_client_id: wsManager.getClientId() || '',
      receiver_user_id: currentReceiverUserId,
      room_id: roomId,
      message_type: 6,
      content: JSON.stringify(data || {}),
      call_id: call.callId,
      call_status: status,
      extra: JSON.stringify({
        type: call.type,
        senderName: currentUser?.name,
        senderAvatar: currentUser?.avatar,
        platform: 'miniprogram'
      }),
    }
    messageApi.sendMessage(payload).catch(console.error)
  }

  /**
   * 播放来电铃声
   */
  function playRingtone() {
    // #ifdef MP-WEIXIN
    uni.vibrateLong({})
    // #endif
  }

  /**
   * 停止来电铃声
   */
  function stopRingtone() {
    // 小程序没有持续振动 API，无需停止
  }

  /**
   * 开始通话计时
   */
  function startCallTimer() {
    stopCallTimer()
    call.startTime = Date.now()
    durationTimer = setInterval(() => {
      if (call.startTime) {
        call.duration = Math.floor((Date.now() - call.startTime) / 1000)
      }
    }, 1000)
  }

  /**
   * 停止通话计时
   */
  function stopCallTimer() {
    if (durationTimer) {
      clearInterval(durationTimer)
      durationTimer = null
    }
    call.startTime = null
    call.duration = 0
  }

  /**
   * 切换静音
   */
  function toggleMute() {
    call.muted = !call.muted
    // #ifdef MP-WEIXIN
    pusherContext?.mute(call.muted)
    // #endif
  }

  /**
   * 切换摄像头
   */
  function toggleCamera() {
    call.camOff = !call.camOff
    // #ifdef MP-WEIXIN
    if (call.camOff) {
      pusherContext?.pause()
    } else {
      pusherContext?.resume()
    }
    // #endif
  }

  /**
   * 切换前后摄像头
   */
  function switchCamera() {
    // #ifdef MP-WEIXIN
    pusherContext?.switchCamera({})
    // #endif
  }

  /**
   * 最小化/恢复窗口
   */
  function toggleMinimize() {
    call.minimized = !call.minimized
  }

  /**
   * 格式化通话时长
   */
  function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    const h = Math.floor(seconds / 3600)
    return h > 0 ? `${h.toString().padStart(2, '0')}:${m}:${s}` : `${m}:${s}`
  }

  /**
   * 处理推流状态变化
   */
  function onPusherStateChange(e: any) {
    const code = e.detail?.code
    console.log('[MiniProgramCall] 推流状态:', code)

    switch (code) {
      case 1002: // 已成功连接到服务器
        call.statusText = '通话中'
        break
      case 1003: // 已开始推流
        break
      case 1004: // 推流断开,正在重连
        call.statusText = '重新连接中...'
        break
      case -1301: // 打开摄像头失败
        uni.showToast({ title: '摄像头打开失败', icon: 'none' })
        break
      case -1302: // 打开麦克风失败
        uni.showToast({ title: '麦克风打开失败', icon: 'none' })
        break
      case -1303: // 视频编码失败
        break
      case -1304: // 音频编码失败
        break
      case -1307: // 推流连接断开
        call.statusText = '连接已断开'
        break
    }
  }

  /**
   * 处理拉流状态变化
   */
  function onPlayerStateChange(e: any, userId: string) {
    const code = e.detail?.code
    console.log(`[MiniProgramCall] 拉流状态 [${userId}]:`, code)

    switch (code) {
      case 2002: // 已连接到服务器
        break
      case 2003: // 收到首帧视频
        break
      case 2004: // 收到首帧音频
        break
      case -2301: // 网络断开，正在重连
        break
    }
  }

  return {
    call,
    pushUrl,
    remoteStreams,
    isActive,
    initListener,
    initPusherContext,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    switchCamera,
    toggleMinimize,
    formatDuration,
    onPusherStateChange,
    onPlayerStateChange,
  }
}

export default useMiniProgramCall

