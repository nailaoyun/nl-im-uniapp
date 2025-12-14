<template>
  <!-- ========== H5/App 单聊通话组件 ========== -->
  <!-- #ifdef H5 || APP-PLUS -->
  <call-window
    v-if="h5CallActive"
    :call="h5CallState"
    :local-stream="h5LocalStream"
    :remote-stream="h5RemoteStream"
    :format-duration="h5FormatDuration"
    @accept="h5AcceptCall"
    @reject="h5RejectCall"
    @end="h5EndCall"
    @toggle-mute="h5ToggleMute"
    @toggle-camera="h5ToggleCamera"
    @toggle-minimize="h5ToggleMinimize"
  />
  <!-- #endif -->

  <!-- ========== 微信小程序单聊通话组件 ========== -->
  <!-- #ifdef MP-WEIXIN -->
  <mini-program-call-window />
  <!-- #endif -->

  <!-- ========== 群通话组件（所有平台共用） ========== -->
  <!-- 全局群通话来电覆盖层 -->
  <group-call-incoming />

  <!-- 全局群通话窗口 -->
  <group-call-window />

  <!-- 群聊通话横幅 (有正在进行的通话但用户未加入) -->
  <group-call-banner />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useGroupWebRTC } from '@/composables/useGroupWebRTC'
import GroupCallIncoming from './GroupCallIncoming.vue'
import GroupCallWindow from './GroupCallWindow.vue'
import GroupCallBanner from './GroupCallBanner.vue'

// #ifdef H5 || APP-PLUS
import { useWebRTC } from '@/composables/useWebRTC'
import CallWindow from './CallWindow.vue'

const webrtc = useWebRTC()
const h5CallActive = computed(() => webrtc.call.active)
const h5CallState = computed(() => webrtc.call)
const h5LocalStream = computed(() => webrtc.localStream.value)
const h5RemoteStream = computed(() => webrtc.remoteStream.value)
const h5FormatDuration = (seconds: number) => webrtc.formatDuration(seconds)
const h5AcceptCall = () => webrtc.acceptCall()
const h5RejectCall = () => webrtc.rejectCall()
const h5EndCall = () => webrtc.endCall()
const h5ToggleMute = () => webrtc.toggleMute()
const h5ToggleCamera = () => webrtc.toggleCamera()
const h5ToggleMinimize = () => webrtc.toggleMinimize()
// #endif

// #ifdef MP-WEIXIN
import { useMiniProgramCall } from '@/composables/useMiniProgramCall'
import MiniProgramCallWindow from './MiniProgramCallWindow.vue'

const mpCall = useMiniProgramCall()
// #endif

// 群通话
const { initListener: initGroupListener } = useGroupWebRTC()

onMounted(() => {
  // #ifdef H5 || APP-PLUS
  // 初始化单聊通话信令监听器 (H5/App)
  webrtc.initListener()
  console.log('✅ [GlobalCallProvider] H5/App WebRTC 信令监听器已初始化')
  // #endif

  // #ifdef MP-WEIXIN
  // 初始化小程序通话信令监听器
  mpCall.initListener()
  mpCall.initPusherContext()
  console.log('✅ [GlobalCallProvider] 微信小程序通话监听器已初始化')
  // #endif

  // 初始化群通话信令监听器（所有平台）
  initGroupListener()
  console.log('✅ [GlobalCallProvider] 群通话信令监听器已初始化')
})
</script>
