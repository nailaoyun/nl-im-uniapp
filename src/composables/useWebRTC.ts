/**
 * WebRTC 通话组合式函数 - 全局单例模式
 * 支持在任意页面接听来电
 * 支持 SFU 模式和 P2P 模式
 */
import { reactive, shallowRef, ref, computed } from 'vue'
import * as messageApi from '@/api/modules/message'
import * as callApi from '@/api/modules/call'
import { wsManager } from '@/api/websocket'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useConversationStore } from '@/stores/conversation'
import type { ChatMessage, Contact } from '@/types/api'
import type { CallStatus } from '@/types/message'

// 连接模式
type ConnectionMode = 'p2p' | 'sfu'

export interface CallState {
  active: boolean
  minimized: boolean
  type: 'audio' | 'video'
  status: 'idle' | 'outgoing' | 'incoming' | 'connected'
  statusText: string
  id: string | null
  muted: boolean
  remoteMuted: boolean
  camOff: boolean
  remoteCamOff: boolean
  duration: number
  startTime: number | null
  callerName?: string
  callerAvatar?: string
  callerId?: string
}

// --- 全局单例状态 ---
const call = reactive<CallState>({
  active: false,
  minimized: false,
  type: 'video',
  status: 'idle',
  statusText: '',
  id: null,
  muted: false,
  remoteMuted: false,
  camOff: false,
  remoteCamOff: false,
  duration: 0,
  startTime: null,
})

const isCaller = ref(false)
const localStream = shallowRef<MediaStream | null>(null)
const remoteStream = shallowRef<MediaStream | null>(null)
let durationTimer: ReturnType<typeof setInterval> | null = null
let pc: RTCPeerConnection | null = null
const pendingCandidates: RTCIceCandidate[] = []
let currentReceiverUserId = ''
let currentRoomId = ''
let audioContext: UniApp.InnerAudioContext | null = null

// SFU 模式配置
let connectionMode: ConnectionMode = 'p2p'
let sfuIceServers: RTCIceServer[] = []

export function useWebRTC() {
  const authStore = useAuthStore()
  const chatStore = useChatStore()
  const conversationStore = useConversationStore()

  const userId = computed(() => authStore.user?.id || '')
  const isActive = computed(() => call.active)

  function playRingtone() {
    stopRingtone()
    // #ifdef H5 || APP-PLUS
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioContext()
      const oscillator = ctx.createOscillator()
      oscillator.type = 'sine'
      oscillator.frequency.value = 440
      oscillator.connect(ctx.destination)
      oscillator.start()
      setTimeout(() => oscillator.stop(), 200)
    } catch (e) {}
    // #endif
  }

  function stopRingtone() {
    if (audioContext) {
      audioContext.stop()
      audioContext.destroy()
      audioContext = null
    }
  }

  function getSafeRoomId(targetUserId?: string): string | null {
    if (currentRoomId) return currentRoomId
    
    // 尝试从联系人获取房间ID
    if (targetUserId) {
      const contact = chatStore.contacts.find(c => c.contact_user_id === targetUserId)
      if (contact?.room_id) return contact.room_id
    }
    
    // 尝试从会话获取房间ID
    if (targetUserId) {
      const conv = conversationStore.conversations.find(c => c.target_id === targetUserId)
      if (conv?.room_id) return conv.room_id
    }
    
    // 生成临时房间ID
    if (targetUserId && userId.value) {
      return [userId.value, targetUserId].sort().join('_')
    }
    return null
  }

  // 初始化信令监听器
  function initListener() {
    wsManager.offSignal(handleSignaling)
    wsManager.onSignal(handleSignaling)
  }

  // 信令处理
  async function handleSignaling(message: ChatMessage) {
    try {
      const content = message.content ? JSON.parse(message.content) : {}

      // 忽略群聊信令（由 useGroupWebRTC 处理）
      if (content.callRoomId || content.participantIds) {
        return
      }

      const signal = message.call_status as any
      const extra = message.extra ? (typeof message.extra === 'string' ? JSON.parse(message.extra) : message.extra) : {}

      if (extra.type) call.type = extra.type

      if (signal === 'sync_state') {
        if (content.action === 'cam-toggle') call.remoteCamOff = content.value
        else if (content.action === 'mic-toggle') call.remoteMuted = content.value
        return
      }

      if (signal === 'invite') {
        if (call.active) return
        isCaller.value = false
        currentReceiverUserId = message.sender_user_id
        if (message.room_id) currentRoomId = message.room_id
        call.id = message.call_id
        call.active = true
        call.minimized = false
        call.status = 'incoming'
        call.statusText = `邀请你${call.type === 'video' ? '视频' : '语音'}通话`
        call.callerId = message.sender_user_id
        
        // 获取来电者信息 - 从联系人列表
        const contact = chatStore.contacts.find(c => c.contact_user_id === message.sender_user_id)
        if (contact?.user) {
          call.callerName = contact.remark_name || contact.user.name
          call.callerAvatar = contact.user.avatar
        } else {
          // 尝试从会话列表获取
          const conv = conversationStore.conversations.find(c => c.target_id === message.sender_user_id)
          if (conv) {
            call.callerName = conv.name
            call.callerAvatar = conv.avatar
          } else {
            // 最后尝试从消息中的额外信息获取
            if (extra.senderName) call.callerName = extra.senderName
            if (extra.senderAvatar) call.callerAvatar = extra.senderAvatar
          }
        }
        
        playRingtone()
        console.log('📞 来电:', call.callerName, call.callerAvatar)

      } else if (signal === 'accepted') {
        stopRingtone()
        call.status = 'connected'
        call.statusText = '通话中'
        startCallTimer()
        if (!pc) await createPC()
        const offer = await pc!.createOffer()
        await pc!.setLocalDescription(offer)
        sendSignal('offer', offer)

      } else if (signal === 'offer') {
        stopRingtone()
        if (!pc) {
          await initMedia(call.type === 'video')
          await createPC()
        }
        await pc!.setRemoteDescription(content)
        processPendingCandidates()
        const answer = await pc!.createAnswer()
        await pc!.setLocalDescription(answer)
        sendSignal('answer', answer, message.sender_user_id)
        call.status = 'connected'
        call.statusText = '通话中'
        startCallTimer()

      } else if (signal === 'answer') {
        if (pc) {
          await pc.setRemoteDescription(content)
          processPendingCandidates()
        }

      } else if (signal === 'candidate') {
        if (pc && pc.remoteDescription) await pc.addIceCandidate(content)
        else pendingCandidates.push(content)

      } else if (['hangup', 'ended', 'answered_elsewhere', 'reject'].includes(signal)) {
        closeCall()
        if (signal === 'answered_elsewhere') {
          uni.showToast({ title: '已在其他设备接听', icon: 'none' })
        } else if (signal === 'reject') {
          uni.showToast({ title: '对方已拒绝', icon: 'none' })
        } else if (signal === 'hangup' || signal === 'ended') {
          uni.showToast({ title: '通话已结束', icon: 'none' })
        }
      }
    } catch (error) {
      console.error('Error handling signaling:', error)
    }
  }

  // 初始化媒体设备
  async function initMedia(videoEnabled: boolean): Promise<void> {
    // #ifdef H5 || APP-PLUS
    try {
      if (localStream.value) {
        localStream.value.getTracks().forEach(t => t.stop())
        localStream.value = null
      }
      const constraints: MediaStreamConstraints = {
        video: videoEnabled ? { width: { ideal: 640 }, height: { ideal: 480 } } : false,
        audio: { echoCancellation: true, noiseSuppression: true },
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      localStream.value = stream
    } catch (error: any) {
      throw new Error('无法获取设备权限')
    }
    // #endif

    // #ifndef H5 || APP-PLUS
    throw new Error('当前平台暂不支持音视频通话')
    // #endif
  }

  // 设置连接模式
  function setConnectionMode(mode: ConnectionMode) {
    connectionMode = mode
    console.log(`📡 [WebRTC] 连接模式: ${mode}`)
  }

  // 获取 ICE 服务器配置
  async function fetchICEServers() {
    try {
      const response = await callApi.getICEServers(userId.value)
      if (response.ice_servers?.length) {
        sfuIceServers = response.ice_servers.map(s => ({
          urls: s.urls,
          username: s.username,
          credential: s.credential,
        }))
        console.log('📡 [WebRTC] 获取 ICE 服务器配置:', sfuIceServers.length)
      }
    } catch (error) {
      console.warn('⚠️ [WebRTC] 获取 ICE 服务器配置失败:', error)
    }
  }

  // 创建 RTCPeerConnection
  async function createPC(): Promise<void> {
    // #ifdef H5 || APP-PLUS
    // 优先使用服务器配置的 ICE 服务器
    let servers: RTCIceServer[] = sfuIceServers.length > 0 
      ? sfuIceServers 
      : [{ urls: 'stun:stun.l.google.com:19302' }]
    
    if (pc) { pc.close(); pc = null }
    pc = new RTCPeerConnection({ iceServers: servers })

    pc.oniceconnectionstatechange = () => {
      if (pc?.iceConnectionState === 'failed') {
        call.statusText = '连接失败'
        endCall()
      } else if (pc?.iceConnectionState === 'connected') {
        call.statusText = '通话中'
      }
    }

    if (localStream.value) {
      localStream.value.getTracks().forEach((track) => pc!.addTrack(track, localStream.value!))
    }

    pc.ontrack = (e) => {
      if (e.streams && e.streams[0]) {
        remoteStream.value = e.streams[0]
      }
    }

    pc.onicecandidate = async (e) => {
      if (e.candidate && call.id) {
        // SFU 模式下发送 ICE 候选到服务器
        if (connectionMode === 'sfu' && currentRoomId) {
          try {
            await callApi.sendICECandidate({
              room_id: currentRoomId,
              user_id: userId.value,
              candidate: JSON.stringify(e.candidate)
            })
          } catch (error) {
            console.warn('⚠️ [WebRTC] 发送 ICE 候选失败:', error)
          }
        } else {
          // P2P 模式下通过信令发送
          sendSignal('candidate', e.candidate)
        }
      }
    }
    // #endif
  }

  // SFU 模式：连接到 SFU 服务器
  async function connectToSFU(): Promise<void> {
    if (!currentRoomId || !userId.value) return

    try {
      // 获取 ICE 服务器配置
      await fetchICEServers()

      // 创建 PeerConnection
      await initMedia(call.type === 'video')
      await createPC()

      // 创建 Offer
      const offer = await pc!.createOffer()
      await pc!.setLocalDescription(offer)

      // 发送 Offer 到 SFU，获取 Answer
      const response = await callApi.sendOffer({
        room_id: currentRoomId,
        user_id: userId.value,
        sdp: offer.sdp!
      })

      // 设置远端描述
      await pc!.setRemoteDescription({
        type: 'answer',
        sdp: response.sdp
      })

      // 处理待定的 ICE 候选
      processPendingCandidates()

      console.log('✅ [WebRTC] 已连接到 SFU')
    } catch (error) {
      console.error('❌ [WebRTC] 连接 SFU 失败:', error)
      throw error
    }
  }

  // 发送信令
  function sendSignal(status: CallStatus, data?: any, receiverUserId?: string) {
    if (!call.id) return
    const targetUserId = receiverUserId || currentReceiverUserId
    const roomId = getSafeRoomId(targetUserId)
    if (!roomId) return
    
    // 获取当前用户信息用于传递给对方
    const currentUser = authStore.user
    const payload = {
      sender_client_id: wsManager.getClientId() || '',
      receiver_user_id: targetUserId,
      room_id: roomId,
      message_type: 6,
      content: JSON.stringify(data || {}),
      call_id: call.id,
      call_status: status,
      extra: JSON.stringify({ 
        type: call.type,
        senderName: currentUser?.name,
        senderAvatar: currentUser?.avatar
      }),
    }
    messageApi.sendMessage(payload).catch(console.error)
  }

  // 发送状态同步
  function sendSyncState(type: 'cam-toggle' | 'mic-toggle', value: boolean) {
    if (call.status !== 'connected') return
    const roomId = getSafeRoomId(currentReceiverUserId)
    if (!roomId) return
    const payload = {
      sender_client_id: wsManager.getClientId() || '',
      receiver_user_id: currentReceiverUserId,
      room_id: roomId,
      message_type: 6,
      content: JSON.stringify({ action: type, value }),
      call_id: call.id,
      call_status: 'sync_state' as any,
      extra: JSON.stringify({ type: call.type })
    }
    messageApi.sendMessage(payload).catch(console.error)
  }

  // 发起通话
  async function startCall(type: 'audio' | 'video', receiverUserId: string, roomId?: string, targetName?: string, targetAvatar?: string) {
    if (roomId) currentRoomId = roomId
    else {
      const foundRoomId = getSafeRoomId(receiverUserId)
      if (foundRoomId) currentRoomId = foundRoomId
    }

    if (!currentRoomId) {
      uni.showToast({ title: '无法建立通话连接', icon: 'none' })
      return false
    }

    isCaller.value = true
    currentReceiverUserId = receiverUserId
    call.type = type
    call.id = Date.now().toString()
    call.active = true
    call.minimized = false
    call.status = 'outgoing'
    call.statusText = '正在呼叫...'
    call.duration = 0
    call.camOff = false
    call.remoteCamOff = false
    call.remoteMuted = false
    call.callerId = receiverUserId
    
    // 设置对方信息
    if (targetName) call.callerName = targetName
    if (targetAvatar) call.callerAvatar = targetAvatar
    
    // 尝试从联系人/会话获取对方信息
    if (!call.callerName || !call.callerAvatar) {
      const contact = chatStore.contacts.find(c => c.contact_user_id === receiverUserId)
      if (contact?.user) {
        call.callerName = call.callerName || contact.remark_name || contact.user.name
        call.callerAvatar = call.callerAvatar || contact.user.avatar
      } else {
        const conv = conversationStore.conversations.find(c => c.target_id === receiverUserId)
        if (conv) {
          call.callerName = call.callerName || conv.name
          call.callerAvatar = call.callerAvatar || conv.avatar
        }
      }
    }
    
    remoteStream.value = null

    try {
      // 获取 ICE 服务器配置
      await fetchICEServers()
      
      await initMedia(type === 'video')
      await createPC()
      playRingtone()
      sendSignal('invite', undefined, receiverUserId)
      return true
    } catch (error: any) {
      uni.showToast({ title: error.message || '无法启动通话', icon: 'none' })
      closeCall()
      return false
    }
  }

  // SFU 模式发起通话
  async function startCallSFU(type: 'audio' | 'video', receiverUserId: string, roomId: string, targetName?: string, targetAvatar?: string) {
    setConnectionMode('sfu')
    currentRoomId = roomId
    currentReceiverUserId = receiverUserId
    
    call.type = type
    call.id = Date.now().toString()
    call.active = true
    call.minimized = false
    call.status = 'outgoing'
    call.statusText = '正在呼叫...'
    call.duration = 0
    call.camOff = false
    call.remoteCamOff = false
    call.remoteMuted = false
    call.callerId = receiverUserId

    if (targetName) call.callerName = targetName
    if (targetAvatar) call.callerAvatar = targetAvatar

    remoteStream.value = null

    try {
      // 连接到 SFU
      await connectToSFU()
      playRingtone()
      sendSignal('invite', undefined, receiverUserId)
      return true
    } catch (error: any) {
      uni.showToast({ title: error.message || '无法启动通话', icon: 'none' })
      closeCall()
      return false
    }
  }

  // 接听来电
  async function acceptCall(senderUserId?: string) {
    isCaller.value = false
    stopRingtone()
    if (senderUserId) currentReceiverUserId = senderUserId
    call.status = 'connected'
    call.statusText = '正在连接...'
    call.camOff = false
    call.remoteCamOff = false

    try {
      await initMedia(call.type === 'video')
      await createPC()
      sendSignal('accepted', undefined, currentReceiverUserId)
    } catch (error: any) {
      uni.showToast({ title: error.message || '接听失败', icon: 'none' })
      endCall()
    }
  }

  // 拒绝来电
  function rejectCall() {
    stopRingtone()
    sendSignal('reject')
    closeCall()
  }

  // 结束通话
  function endCall() {
    stopRingtone()
    sendSignal('hangup')
    closeCall()
  }

  // 关闭通话（清理资源）
  function closeCall() {
    stopRingtone()
    currentRoomId = ''
    currentReceiverUserId = ''
    call.active = false
    call.status = 'idle'
    call.statusText = ''
    call.id = null
    call.callerName = undefined
    call.callerAvatar = undefined
    call.callerId = undefined
    call.muted = false
    call.camOff = false
    call.remoteMuted = false
    call.remoteCamOff = false
    stopCallTimer()
    
    // #ifdef H5 || APP-PLUS
    if (pc) {
      pc.close()
      pc = null
    }
    if (localStream.value) {
      localStream.value.getTracks().forEach(t => t.stop())
      localStream.value = null
    }
    remoteStream.value = null
    // #endif
  }

  async function processPendingCandidates() {
    while (pendingCandidates.length > 0) {
      const c = pendingCandidates.shift()
      if (c && pc) await pc.addIceCandidate(c).catch(() => {})
    }
  }

  // 通话计时
  function startCallTimer() {
    stopCallTimer()
    call.startTime = Date.now()
    durationTimer = setInterval(() => {
      if (call.startTime) call.duration = Math.floor((Date.now() - call.startTime) / 1000)
    }, 1000)
  }

  function stopCallTimer() {
    if (durationTimer) { clearInterval(durationTimer); durationTimer = null }
    call.startTime = null
    call.duration = 0
  }

  // 格式化通话时长
  function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    const h = Math.floor(seconds / 3600)
    return h > 0 ? `${h.toString().padStart(2, '0')}:${m}:${s}` : `${m}:${s}`
  }

  // 切换静音
  function toggleMute() {
    call.muted = !call.muted
    sendSyncState('mic-toggle', call.muted)
    // #ifdef H5 || APP-PLUS
    if (localStream.value) localStream.value.getAudioTracks().forEach(t => t.enabled = !call.muted)
    // #endif
  }

  // 切换摄像头
  function toggleCamera() {
    call.camOff = !call.camOff
    sendSyncState('cam-toggle', call.camOff)
    // #ifdef H5 || APP-PLUS
    if (localStream.value) localStream.value.getVideoTracks().forEach(t => t.enabled = !call.camOff)
    // #endif
  }

  // 最小化/恢复窗口
  function toggleMinimize() {
    call.minimized = !call.minimized
  }

  return {
    call,
    localStream,
    remoteStream,
    isActive,
    initListener,
    startCall,
    startCallSFU,
    acceptCall,
    rejectCall,
    endCall,
    handleSignaling,
    toggleMute,
    toggleCamera,
    toggleMinimize,
    formatDuration,
    setConnectionMode,
    fetchICEServers,
  }
}

export default useWebRTC
