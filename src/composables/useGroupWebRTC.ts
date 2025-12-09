import { reactive, shallowRef, ref, computed } from 'vue'
import * as messageApi from '@/api/modules/message'
import { wsManager } from '@/api/websocket'
import { useAuthStore } from '@/stores/auth'
import type { ChatMessage } from '@/types/api'

// --- 类型定义 ---
export interface CallParticipant {
  userId: string
  name: string
  avatar: string
  stream?: MediaStream
  isMuted: boolean
  isCamOff: boolean
  status: 'connecting' | 'connected' | 'failed' | 'rejected'
  volume?: number
}

export interface GroupCallState {
  incoming: boolean
  joined: boolean
  minimized: boolean
  roomId: string
  groupId: string
  initiatorId: string
  inviterName: string
  inviterAvatar?: string
  type: 'audio' | 'video'
  duration: number
  startTime: number | null
  isSelfMuted: boolean
  isSelfCamOff: boolean
}

interface SignalPayload {
  action: 'invite' | 'join' | 'offer' | 'answer' | 'candidate' | 'leave' | 'sync_state' | 'reject'
  callRoomId: string
  senderId: string
  senderName?: string
  senderAvatar?: string
  targetId?: string
  data?: any
  state?: { muted: boolean; camOff: boolean }
  participantIds?: string[]
  type?: 'audio' | 'video'
}

// --- 全局单例状态 ---
const callState = reactive<GroupCallState>({
  incoming: false,
  joined: false,
  minimized: false,
  roomId: '',
  groupId: '',
  initiatorId: '',
  inviterName: '',
  type: 'video',
  duration: 0,
  startTime: null,
  isSelfMuted: false,
  isSelfCamOff: false
})

const localStream = shallowRef<MediaStream | null>(null)
const participants = ref<CallParticipant[]>([])
const peerConnections = new Map<string, RTCPeerConnection>()

// Perfect Negotiation 状态控制
const makingOffer = new Map<string, boolean>()
const ignoreOffer = new Map<string, boolean>()
const pendingCandidates = new Map<string, RTCIceCandidateInit[]>()

let durationTimer: ReturnType<typeof setInterval> | null = null

const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ]
}

export function useGroupWebRTC() {
  const authStore = useAuthStore()

  const isActive = computed(() => callState.joined || callState.incoming)

  function initListener() {
    wsManager.offSignal(handleSignalMessage)
    wsManager.onSignal(handleSignalMessage)
  }

  // --- 状态重置 ---
  function resetState() {
    stopTimer()
    peerConnections.forEach(pc => pc.close())
    peerConnections.clear()
    makingOffer.clear()
    ignoreOffer.clear()
    pendingCandidates.clear()

    if (localStream.value) {
      localStream.value.getTracks().forEach(t => t.stop())
      localStream.value = null
    }
    participants.value = []

    callState.incoming = false
    callState.joined = false
    callState.minimized = false
    callState.roomId = ''
    callState.groupId = ''
    callState.duration = 0
    callState.initiatorId = ''
    callState.inviterName = ''
  }

  async function initLocalMedia(videoEnabled: boolean) {
    try {
      if (localStream.value) {
        localStream.value.getTracks().forEach(t => t.stop())
      }
      
      // #ifdef H5
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } : false,
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      })
      localStream.value = stream
      // #endif
      
      // #ifdef APP-PLUS
      // APP端需要使用原生插件或其他方式获取媒体流
      uni.showToast({ title: 'APP端群通话暂不支持', icon: 'none' })
      throw new Error('APP端暂不支持群通话')
      // #endif
      
      callState.isSelfMuted = false
      callState.isSelfCamOff = false
      return localStream.value
    } catch (error) {
      console.error('获取媒体失败', error)
      uni.showToast({ title: '无法获取摄像头或麦克风权限', icon: 'none' })
      throw error
    }
  }

  // --- 核心信令处理 ---
  async function handleSignalMessage(msg: ChatMessage) {
    const myId = authStore.user?.id
    if (!myId) return

    try {
      const content: SignalPayload = JSON.parse(msg.content || '{}')
      if (content.senderId === myId) return

      // 1. 处理邀请 (Invite)
      if (content.action === 'invite') {
        if (!content.participantIds || !content.callRoomId) return
        if (callState.joined) return // 忙线自动忽略

        callState.incoming = true
        callState.roomId = content.callRoomId
        callState.groupId = msg.room_id || ''
        callState.type = content.type || 'video'
        callState.initiatorId = content.senderId
        callState.inviterName = content.senderName || '群成员'
        callState.inviterAvatar = content.senderAvatar
        return
      }

      // 2. Banner 状态更新
      if (content.action === 'join' && msg.room_id) {
        if (callState.roomId && content.callRoomId !== callState.roomId) return
        if (!callState.joined && !callState.incoming) {
          callState.roomId = content.callRoomId
          callState.groupId = msg.room_id
        }
      }

      if (content.callRoomId !== callState.roomId) return

      switch (content.action) {
        case 'join':
          addParticipant(content.senderId, content.senderName || '成员', content.senderAvatar || '', 'connecting')
          if (callState.joined) {
            getPeerConnection(content.senderId)
          }
          break

        case 'offer':
          if (content.targetId === myId && callState.joined) {
            addParticipant(content.senderId, content.senderName || '成员', content.senderAvatar || '', 'connecting')
            await handleOffer(content.senderId, content.data)
          }
          break

        case 'answer':
          if (content.targetId === myId && callState.joined) {
            await handleAnswer(content.senderId, content.data)
          }
          break

        case 'candidate':
          if (content.targetId === myId && callState.joined) {
            await handleCandidate(content.senderId, content.data)
          }
          break

        case 'leave':
          removeParticipant(content.senderId)
          if (participants.value.length === 0 && !callState.joined) {
            callState.roomId = ''
          }
          break

        case 'reject':
          const pIndex = participants.value.findIndex(p => p.userId === content.senderId)
          if (pIndex !== -1) {
            participants.value[pIndex].status = 'rejected'
            uni.showToast({ title: `${content.senderName || '对方'} 拒绝了通话`, icon: 'none' })
            const pc = peerConnections.get(content.senderId)
            if (pc) { pc.close(); peerConnections.delete(content.senderId) }
          }
          break

        case 'sync_state':
          updateParticipantState(content.senderId, content.state)
          break
      }
    } catch (e) { console.error('Signal error', e) }
  }

  // --- WebRTC 连接管理 (Perfect Negotiation) ---
  function getPeerConnection(targetUserId: string): RTCPeerConnection {
    if (peerConnections.has(targetUserId)) return peerConnections.get(targetUserId)!

    const pc = new RTCPeerConnection(iceServers)
    makingOffer.set(targetUserId, false)
    ignoreOffer.set(targetUserId, false)

    if (localStream.value) {
      localStream.value.getTracks().forEach(t => pc.addTrack(t, localStream.value!))
    }

    pc.onnegotiationneeded = async () => {
      try {
        makingOffer.set(targetUserId, true)
        await pc.setLocalDescription()
        await sendSignal('offer', { targetId: targetUserId, data: pc.localDescription })
      } catch (err) {
        console.error('Negotiation failed:', err)
      } finally {
        makingOffer.set(targetUserId, false)
      }
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) sendSignal('candidate', { targetId: targetUserId, data: event.candidate })
    }

    pc.ontrack = (event) => {
      if (event.streams[0]) updateParticipantStream(targetUserId, event.streams[0])
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') updateParticipantStatus(targetUserId, 'connected')
      else if (pc.connectionState === 'failed') updateParticipantStatus(targetUserId, 'failed')
    }

    peerConnections.set(targetUserId, pc)
    return pc
  }

  async function handleOffer(senderId: string, offerSdp: RTCSessionDescriptionInit) {
    const pc = getPeerConnection(senderId)
    const myId = authStore.user?.id || ''
    const polite = myId < senderId
    const offerCollision = (makingOffer.get(senderId) || pc.signalingState !== 'stable')

    ignoreOffer.set(senderId, !polite && offerCollision)
    if (ignoreOffer.get(senderId)) return

    if (offerCollision) {
      await pc.setLocalDescription({ type: 'rollback' })
    }

    try {
      await pc.setRemoteDescription(offerSdp)
      await pc.setLocalDescription()
      await sendSignal('answer', { targetId: senderId, data: pc.localDescription })
      await flushPendingCandidates(senderId, pc)
    } catch (e) { console.error('Offer error', e) }
  }

  async function handleAnswer(senderId: string, answerSdp: RTCSessionDescriptionInit) {
    const pc = getPeerConnection(senderId)
    if (ignoreOffer.get(senderId)) return
    try {
      if (pc.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(answerSdp)
        await flushPendingCandidates(senderId, pc)
      }
    } catch (e) { console.error('Answer error', e) }
  }

  async function handleCandidate(senderId: string, candidate: RTCIceCandidateInit) {
    const pc = getPeerConnection(senderId)
    if (ignoreOffer.get(senderId)) return
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (e) {
      if (!pc.remoteDescription) {
        if (!pendingCandidates.has(senderId)) pendingCandidates.set(senderId, [])
        pendingCandidates.get(senderId)?.push(candidate)
      }
    }
  }

  async function flushPendingCandidates(userId: string, pc: RTCPeerConnection) {
    const candidates = pendingCandidates.get(userId) || []
    for (const c of candidates) await pc.addIceCandidate(c).catch(() => {})
    pendingCandidates.delete(userId)
  }

  async function sendSignal(action: SignalPayload['action'], payload: Partial<SignalPayload>) {
    const myId = authStore.user?.id
    if (!myId || !callState.groupId) return

    const fullPayload: SignalPayload = {
      action,
      callRoomId: callState.roomId,
      senderId: myId,
      senderName: authStore.user?.name || '我',
      senderAvatar: authStore.user?.avatar || '',
      ...payload
    }

    let receiverId = ''
    if (['offer', 'answer', 'candidate'].includes(action)) receiverId = payload.targetId || ''

    const message = {
      room_id: callState.groupId,
      receiver_user_id: receiverId,
      message_type: 6,
      content: JSON.stringify(fullPayload),
      call_status: action as any,
    }
    await messageApi.sendMessage(message)
  }

  // --- 操作方法 ---
  async function startGroupCall(groupId: string, selectedUserIds: string[], type: 'audio' | 'video') {
    resetState()

    callState.groupId = groupId
    callState.type = type
    callState.roomId = `group_call_${groupId}_${Date.now()}`
    callState.initiatorId = authStore.user?.id || ''
    callState.minimized = false
    callState.joined = true

    try {
      await initLocalMedia(type === 'video')
      initListener()
      startTimer()

      await sendSignal('invite', { participantIds: selectedUserIds, type })

      selectedUserIds.forEach(uid => {
        if (uid !== callState.initiatorId) addParticipant(uid, '呼叫中...', '', 'connecting')
      })
    } catch (e) {
      console.error('Start call error', e)
      if (e instanceof Error && (e.name === 'NotAllowedError' || e.name === 'NotFoundError')) {
        uni.showToast({ title: '无法启动通话：请检查权限', icon: 'none' })
        resetState()
      }
    }
  }

  async function acceptInvite() {
    callState.incoming = false
    callState.joined = true
    try {
      await initLocalMedia(callState.type === 'video')
      startTimer()
      await sendSignal('join', {})
    } catch (e) {
      console.error('Accept call error', e)
      resetState()
    }
  }

  function rejectInvite() {
    sendSignal('reject', {})
    resetState()
  }

  async function joinCurrentCall() {
    if (!callState.roomId) return
    await acceptInvite()
  }

  function leaveCall() {
    if (callState.joined) sendSignal('leave', {})
    resetState()
  }

  // --- 辅助函数 ---
  function addParticipant(userId: string, name: string, avatar: string, status: CallParticipant['status']) {
    const idx = participants.value.findIndex(p => p.userId === userId)
    if (idx === -1) participants.value.push({ userId, name, avatar, status, isMuted: false, isCamOff: false })
    else participants.value[idx].status = status
  }

  function removeParticipant(userId: string) {
    const idx = participants.value.findIndex(p => p.userId === userId)
    if (idx > -1) participants.value.splice(idx, 1)
    const pc = peerConnections.get(userId)
    if (pc) { pc.close(); peerConnections.delete(userId) }
  }

  function updateParticipantStream(userId: string, stream: MediaStream) {
    const p = participants.value.find(p => p.userId === userId)
    if (p) { p.stream = stream; p.status = 'connected' }
  }

  function updateParticipantStatus(userId: string, status: CallParticipant['status']) {
    const p = participants.value.find(p => p.userId === userId)
    if (p) p.status = status
  }

  function updateParticipantState(userId: string, state: any) {
    if (!state) return
    const p = participants.value.find(p => p.userId === userId)
    if (p) { p.isMuted = state.muted; p.isCamOff = state.camOff }
  }

  function toggleSelfMute() {
    callState.isSelfMuted = !callState.isSelfMuted
    if (localStream.value) localStream.value.getAudioTracks().forEach(t => t.enabled = !callState.isSelfMuted)
    sendSignal('sync_state', { state: { muted: callState.isSelfMuted, camOff: callState.isSelfCamOff } })
  }

  function toggleSelfCamera() {
    callState.isSelfCamOff = !callState.isSelfCamOff
    if (localStream.value) localStream.value.getVideoTracks().forEach(t => t.enabled = !callState.isSelfCamOff)
    sendSignal('sync_state', { state: { muted: callState.isSelfMuted, camOff: callState.isSelfCamOff } })
  }

  function startTimer() {
    callState.startTime = Date.now()
    durationTimer = setInterval(() => {
      if (callState.startTime) callState.duration = Math.floor((Date.now() - callState.startTime) / 1000)
    }, 1000)
  }

  function stopTimer() {
    if (durationTimer) clearInterval(durationTimer)
    durationTimer = null
  }

  function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return {
    callState,
    localStream,
    participants,
    isActive,
    startGroupCall,
    acceptInvite,
    rejectInvite,
    joinCurrentCall,
    leaveCall,
    toggleSelfMute,
    toggleSelfCamera,
    formatDuration,
    initListener
  }
}

