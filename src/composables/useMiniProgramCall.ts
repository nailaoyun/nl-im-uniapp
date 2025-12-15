/**
 * 小程序音视频通话组合式函数
 * 使用 live-pusher/live-player 组件
 * * 适用平台：微信小程序
 */
import { reactive, ref, computed, nextTick } from 'vue'
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

// 推流状态标记
let isPushingSucceeded = false  // autopush 是否已成功（收到 1009）
let isStartingPush = false      // 是否正在启动推流（防止并发调用）

export function useMiniProgramCall() {
  const authStore = useAuthStore()
  const chatStore = useChatStore()

  const userId = computed(() => authStore.user?.id || '')
  const isActive = computed(() => call.active)

  /**
   * 初始化 live-pusher 上下文
   * 修复：接收组件实例，并绑定具体的 ID 'local-pusher'
   * @param componentInstance Vue组件实例 (getCurrentInstance())
   */
  function initPusherContext(componentInstance?: any) {
    // #ifdef MP-WEIXIN
    // 关键修复：必须指定 id="local-pusher" 和 组件实例
    // 如果不传 componentInstance，在自定义组件中会找不到 live-pusher
    if (!componentInstance) {
      console.warn('[MiniProgramCall] initPusherContext: 缺少组件实例，推流可能失败')
    }

    // 这里的 'local-pusher' 必须与 template 中的 <live-pusher id="local-pusher"> 一致
    pusherContext = uni.createLivePusherContext('local-pusher', componentInstance)
    console.log('[MiniProgramCall] Pusher Context Initialized', !!pusherContext)
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
          const exists = remoteStreams.value.some(s => s.userId === content.user_id)
          if (!exists) {
            remoteStreams.value.push({
              userId: content.user_id,
              pullUrl: content.pull_url,
              flvUrl: content.flv_url,
              userName: content.user_name,
              userAvatar: content.user_avatar,
            })
          }
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
   * 验证 RTMP URL 格式
   */
  function validateRtmpUrl(url: string): { valid: boolean; error?: string } {
    if (!url) {
      return { valid: false, error: '推流地址为空' }
    }
    // 检查是否为 RTMP 协议
    if (!url.startsWith('rtmp://')) {
      return { valid: false, error: `推流地址格式错误，期望 rtmp://` }
    }
    return { valid: true }
  }

  /**
   * 加入通话房间
   */
  async function joinCallRoom() {
    if (!call.roomId || !userId.value) {
      console.error('[MiniProgramCall] 缺少 roomId 或 userId')
      return
    }

    console.log('[MiniProgramCall] 加入房间:', {
      roomId: call.roomId,
      userId: userId.value,
      platform: 'miniprogram'
    })

    try {
      const response = await callApi.joinCallRoom({
        room_id: call.roomId,
        user_id: userId.value,
        platform: 'miniprogram'
      })

      console.log('[MiniProgramCall] 加入房间响应:', JSON.stringify(response, null, 2))

      // 验证并设置推流地址
      if (response.push_url) {
        const validation = validateRtmpUrl(response.push_url)
        if (validation.valid) {
          pushUrl.value = response.push_url
          console.log('[MiniProgramCall] ✅ 推流地址:', response.push_url)
        } else {
          console.error('[MiniProgramCall] ❌ 推流地址验证失败:', validation.error)
          uni.showToast({ title: validation.error || '推流地址无效', icon: 'none' })
          pushUrl.value = response.push_url
        }
      } else {
        console.error('[MiniProgramCall] ❌ 服务器未返回推流地址')
        uni.showToast({ title: '服务器未返回推流地址', icon: 'none' })
      }

      // 设置拉流地址 (包括 Web/H5 用户的 RTMP 流)
      if (response.pull_urls && response.pull_urls.length > 0) {
        remoteStreams.value = response.pull_urls.map(p => ({
          userId: p.user_id,
          pullUrl: p.url,
          flvUrl: p.flv_url,
        }))
        console.log('[MiniProgramCall] 拉流地址:', remoteStreams.value)
        
        // 检测 Web 用户的流并提示
        const webStreams = remoteStreams.value.filter(s => s.pullUrl && !s.pullUrl.includes('miniprogram'))
        if (webStreams.length > 0) {
          console.log('[MiniProgramCall] 检测到 Web 用户流:', webStreams.length)
        }
      }

      // 参与者信息
      if (response.participants) {
        console.log('[MiniProgramCall] 房间参与者:', response.participants)
      }

      // 重置推流状态标记
      isPushingSucceeded = false
      isStartingPush = false

      // autopush=true 模式下，live-pusher 会在 URL 设置后自动推流
      // 时序说明：
      // 1. pushUrl 设置后，MiniProgramCallWindow.vue 中的 watch 会触发
      // 2. watch 中会延迟 500ms 后调用 initPusherContext()
      // 3. autopush 会自动开始推流
      // 4. 当收到状态码 1009 (Send first video frame) 时，标记推流成功
      // 5. 备用推流只在 autopush 未成功时触发
      nextTick(() => {
        checkAndLogPushStatus()
        
        // 延迟后检查是否需要手动启动推流（仅作为 autopush 失败的备用方案）
        setTimeout(() => {
          // 关键检查：如果 autopush 已经成功，不再调用手动推流
          if (isPushingSucceeded) {
            console.log('[MiniProgramCall] ✅ autopush 已成功，跳过备用推流')
            return
          }
          
          if (call.active && pushUrl.value && pusherContext) {
            console.log('[MiniProgramCall] 🔄 autopush 未成功，尝试手动启动推流')
            startPushing()
          } else if (call.active && pushUrl.value && !pusherContext) {
            console.warn('[MiniProgramCall] ⚠️ pusherContext 未初始化，等待后重试')
            setTimeout(() => {
              if (!isPushingSucceeded && call.active && pushUrl.value && pusherContext) {
                console.log('[MiniProgramCall] 🔄 重试手动启动推流')
                startPushing()
              }
            }, 500)
          }
        }, 3000) // 延长到 3 秒，给 autopush 更多时间
      })

      // 开始计时
      startCallTimer()
      call.status = 'connected'
      call.statusText = '通话中'

    } catch (error: any) {
      console.error('[MiniProgramCall] 加入房间失败:', error)
      uni.showToast({ title: error?.message || '加入房间失败', icon: 'none' })
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
    
    // 重置推流状态标记
    isPushingSucceeded = false
    isStartingPush = false
  }

  /**
   * 检查并请求摄像头和麦克风权限
   */
  async function checkAndRequestPermissions(): Promise<boolean> {
    // #ifdef MP-WEIXIN
    try {
      // 检查摄像头权限
      const cameraRes = await uni.getSetting({})
      const cameraAuth = (cameraRes as any).authSetting?.['scope.camera']
      const recordAuth = (cameraRes as any).authSetting?.['scope.record']

      if (cameraAuth === false || recordAuth === false) {
        // 权限被拒绝，引导用户到设置页
        uni.showModal({
          title: '权限提示',
          content: '需要摄像头和麦克风权限才能进行视频通话，请在设置中开启',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              uni.openSetting({})
            }
          }
        })
        return false
      }

      if (cameraAuth === undefined) {
        // 未授权，请求授权
        await uni.authorize({ scope: 'scope.camera' })
      }
      if (recordAuth === undefined) {
        await uni.authorize({ scope: 'scope.record' })
      }

      return true
    } catch (err) {
      console.error('[MiniProgramCall] 权限请求失败:', err)
      return false
    }
    // #endif
    return true
  }

  /**
   * 检查推流状态并记录日志（autopush 模式下使用）
   */
  async function checkAndLogPushStatus() {
    // #ifdef MP-WEIXIN
    const systemInfo = uni.getSystemInfoSync()
    const isDevtools = systemInfo.platform === 'devtools'
    
    if (isDevtools) {
      console.warn('[MiniProgramCall] ⚠️ 开发者工具不支持 live-pusher')
      console.warn('[MiniProgramCall] 请使用手机扫码在「真机调试」或「预览」模式测试')
      uni.showToast({ 
        title: '开发者工具不支持视频通话，请真机测试', 
        icon: 'none', 
        duration: 4000 
      })
      return
    }

    // 检查权限
    const hasPermission = await checkAndRequestPermissions()
    if (!hasPermission) {
      console.error('[MiniProgramCall] ❌ 未获得必要权限')
      uni.showToast({ 
        title: '请授权摄像头和麦克风权限', 
        icon: 'none', 
        duration: 3000 
      })
      return
    }

    console.log('[MiniProgramCall] 🎬 autopush 模式，推流地址已设置')
    console.log('[MiniProgramCall] 推流地址:', pushUrl.value)
    console.log('[MiniProgramCall] 设备信息:', {
      platform: systemInfo.platform,
      model: systemInfo.model,
      system: systemInfo.system,
      brand: systemInfo.brand,
      SDKVersion: systemInfo.SDKVersion
    })
    
    // 检查基础库版本是否支持 live-pusher
    const sdkVersion = systemInfo.SDKVersion || ''
    const versionParts = sdkVersion.split('.').map(Number)
    if (versionParts[0] < 2 || (versionParts[0] === 2 && versionParts[1] < 9)) {
      console.warn('[MiniProgramCall] ⚠️ 基础库版本过低，建议升级到 2.9.0+')
      uni.showToast({ 
        title: '微信版本过低，请更新微信', 
        icon: 'none', 
        duration: 3000 
      })
    }
    // #endif
  }

  /**
   * 手动开始推流
   * 关键：在 RTC 模式下，需要先调用 enterRoom() 再调用 start()
   * 参考网友方案：enterRoom() 后调用 start()，设置 setTimeout 延迟
   */
  async function startPushing() {
    // #ifdef MP-WEIXIN
    const systemInfo = uni.getSystemInfoSync()
    const isDevtools = systemInfo.platform === 'devtools'
    
    if (isDevtools) {
      console.warn('[MiniProgramCall] ⚠️ 开发者工具不支持 live-pusher')
      return
    }

    // 防止并发调用
    if (isStartingPush) {
      console.log('[MiniProgramCall] ⏳ 推流正在启动中，跳过重复调用')
      return
    }

    // 如果已经推流成功，不再重复启动
    if (isPushingSucceeded) {
      console.log('[MiniProgramCall] ✅ 推流已成功，跳过重复启动')
      return
    }

    if (!pusherContext) {
      console.error('[MiniProgramCall] ❌ Pusher Context 未初始化')
      return
    }

    if (!pushUrl.value) {
      console.error('[MiniProgramCall] ❌ 推流地址为空')
      return
    }

    isStartingPush = true
    console.log('[MiniProgramCall] 🎬 手动启动推流 - 使用 enterRoom + start 模式')

    // 关键修复：先调用 enterRoom() 进入 RTC 房间
    // 这是解决 operateXWebLivePusher:fail:internal error 的关键步骤
    try {
      // @ts-ignore - enterRoom 是较新的 API，类型定义可能缺失
      const ctx = pusherContext as any
      if (typeof ctx.enterRoom === 'function') {
        ctx.enterRoom({
          success: () => {
            console.log('[MiniProgramCall] ✅ enterRoom 成功')
            // 延迟后调用 start()，确保房间准备就绪
            setTimeout(() => {
              doStartPushing()
            }, 500)
          },
          fail: (err: any) => {
            console.warn('[MiniProgramCall] ⚠️ enterRoom 失败，直接尝试 start:', err)
            // enterRoom 失败时直接尝试 start
            doStartPushing()
          }
        })
      } else {
        // 如果 enterRoom 不可用，直接调用 start
        console.log('[MiniProgramCall] enterRoom 不可用，直接调用 start')
        doStartPushing()
      }
    } catch (e) {
      console.warn('[MiniProgramCall] enterRoom 调用异常，直接尝试 start:', e)
      doStartPushing()
    }
    // #endif
  }

  /**
   * 实际执行推流启动
   */
  function doStartPushing() {
    // #ifdef MP-WEIXIN
    if (!pusherContext) {
      isStartingPush = false
      return
    }

    pusherContext.start({
      success: () => {
        console.log('[MiniProgramCall] ✅ 推流启动成功（start回调）')
        isStartingPush = false
        // 注意：真正的推流成功标志是收到状态码 1009
      },
      fail: (err: any) => {
        console.error('[MiniProgramCall] ❌ 推流启动失败:', err)
        isStartingPush = false
        
        let errorMsg = '推流失败'
        const errMsg = err.errMsg || ''
        const errno = err.errno

        if (errMsg.includes('internal error') || errno === 4) {
          // internal error 通常是因为推流器已经在运行，或者状态冲突
          // 如果 autopush 已经在工作，这个错误可以忽略
          if (isPushingSucceeded) {
            console.log('[MiniProgramCall] ℹ️ internal error，但 autopush 已成功，忽略')
            return
          }
          errorMsg = '推流服务异常'
          console.log('[MiniProgramCall] 🔄 internal error，2秒后重试...')
          setTimeout(() => {
            if (!isPushingSucceeded && call.active && pusherContext) {
              isStartingPush = true
              pusherContext.start({
                success: () => {
                  console.log('[MiniProgramCall] ✅ 重试推流成功')
                  isStartingPush = false
                },
                fail: (e: any) => {
                  console.error('[MiniProgramCall] ❌ 重试推流仍失败:', e)
                  isStartingPush = false
                }
              })
            }
          }, 2000)
        } else if (errMsg.includes('permission') || errno === 10001) {
          errorMsg = '请授权摄像头和麦克风权限'
          uni.showToast({ title: errorMsg, icon: 'none', duration: 3000 })
        }
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
    // 依赖 template 中的 :enable-mic="!call.muted"
    // 或者可以使用 API: pusherContext?.setMicVolume({ volume: call.muted ? 0 : 1 })
    // #endif
  }

  /**
   * 切换摄像头
   */
  function toggleCamera() {
    call.camOff = !call.camOff
    // #ifdef MP-WEIXIN
    // 依赖 template 中的 :enable-camera="!call.camOff"
    // 也可以手动控制 pause/resume
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
   * 状态码参考：https://developers.weixin.qq.com/miniprogram/dev/component/live-pusher.html
   */
  function onPusherStateChange(e: any) {
    const code = e.detail?.code
    const message = e.detail?.message || ''
    console.log('[MiniProgramCall] 推流状态:', code, message)

    switch (code) {
      // 成功状态
      case 1001: // 已连接到云端推流服务器
        console.log('[MiniProgramCall] ✅ 已连接到推流服务器')
        break
      case 1002: // 已与云端推流服务器握手完毕
        console.log('[MiniProgramCall] ✅ 握手完成，开始推流')
        call.statusText = '通话中'
        break
      case 1003: // 已成功打开摄像头
        console.log('[MiniProgramCall] ✅ 摄像头已打开')
        break
      case 1004: // 自动调整分辨率
        break
      case 1005: // 推流动态调整分辨率
        break
      case 1006: // 推流动态调整码率
        break
      case 1007: // 首帧画面采集完成
        console.log('[MiniProgramCall] ✅ 首帧画面采集完成')
        break
      case 1008: // 编码器启动
        console.log('[MiniProgramCall] ✅ 编码器启动')
        break
      case 1009: // 已发送首帧视频 - 这是推流真正成功的标志！
        console.log('[MiniProgramCall] ✅✅ 推流成功！已发送首帧视频')
        isPushingSucceeded = true  // 关键：标记推流成功
        isStartingPush = false
        call.statusText = '通话中'
        break

      // 警告/网络状态
      case 1101: // 网络状况不佳：上行带宽不足
        console.warn('[MiniProgramCall] ⚠️ 网络不佳，上行带宽不足')
        call.statusText = '网络不佳...'
        break
      case 1102: // 网络断连，已启动自动重连（不是编码器失败！）
        console.log('[MiniProgramCall] ℹ️ 网络断连，正在自动重连...')
        call.statusText = '重连中...'
        // 重要：1102 是自动重连，不需要手动干预！
        // 微信会自动处理重连，我们只需要等待
        break
      case 1103: // 摄像头被占用
        console.error('[MiniProgramCall] ❌ 摄像头被占用')
        uni.showToast({ title: '摄像头被占用', icon: 'none' })
        break

      // 麦克风状态
      case 2027: // 麦克风启动成功
        console.log('[MiniProgramCall] ✅ 麦克风已打开')
        break

      // RTMP 错误
      case 3001: // RTMP 服务器建立连接失败
        console.error('[MiniProgramCall] ❌ RTMP 服务器连接失败')
        call.statusText = '服务器连接失败'
        uni.showToast({ title: 'RTMP服务器连接失败', icon: 'none' })
        break
      case 3002: // RTMP 服务器握手失败
        console.error('[MiniProgramCall] ❌ RTMP 服务器握手失败')
        uni.showToast({ title: 'RTMP服务器握手失败', icon: 'none' })
        break
      case 3003: // RTMP 服务器连接已断开
        console.warn('[MiniProgramCall] ⚠️ RTMP 连接断开')
        call.statusText = '连接已断开'
        break
      case 3004: // RTMP 推流地址格式不正确
        console.error('[MiniProgramCall] ❌ RTMP 推流地址格式错误:', pushUrl.value)
        uni.showToast({ title: '推流地址格式错误', icon: 'none' })
        break
      case 3005: // RTMP 服务器连接异常断开
        console.error('[MiniProgramCall] ❌ RTMP 连接异常断开')
        call.statusText = '连接异常断开'
        // 连接异常断开时，重置推流状态，允许重试
        isPushingSucceeded = false
        break

      // 错误状态
      case -1301: // 打开摄像头失败
        console.error('[MiniProgramCall] ❌ 摄像头打开失败')
        uni.showToast({ title: '摄像头打开失败，请检查权限', icon: 'none' })
        break
      case -1302: // 打开麦克风失败
        console.error('[MiniProgramCall] ❌ 麦克风打开失败')
        uni.showToast({ title: '麦克风打开失败，请检查权限', icon: 'none' })
        break
      case -1303: // 视频编码失败
        console.error('[MiniProgramCall] ❌ 视频编码失败')
        break
      case -1304: // 音频编码失败
        console.error('[MiniProgramCall] ❌ 音频编码失败')
        break
      case -1307: // 推流连接断开
        console.error('[MiniProgramCall] ❌ 推流连接断开')
        call.statusText = '连接已断开'
        isPushingSucceeded = false
        break

      default:
        if (code < 0) {
          console.error('[MiniProgramCall] ❌ 未知错误:', code, message)
        }
    }
  }

  /**
   * 处理拉流状态变化
   */
  function onPlayerStateChange(e: any, userId: string) {
    const code = e.detail?.code
    console.log(`[MiniProgramCall] 拉流状态 [${userId}]:`, code)

    // 状态码参考微信文档
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
