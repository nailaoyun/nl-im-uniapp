<template>
  <!-- ========== 单聊通话组件 ========== -->
  <call-window
    v-if="callActive"
    :call="callState"
    :local-stream="localStreamValue"
    :remote-stream="remoteStreamValue"
    :format-duration="webrtc.formatDuration"
    @accept="webrtc.acceptCall()"
    @reject="webrtc.rejectCall()"
    @end="webrtc.endCall()"
    @toggle-mute="webrtc.toggleMute()"
    @toggle-camera="webrtc.toggleCamera()"
    @toggle-minimize="webrtc.toggleMinimize()"
  />

  <!-- ========== 群通话组件 ========== -->
  <!-- 全局群通话来电覆盖层 -->
  <group-call-incoming />

  <!-- 全局群通话窗口 -->
  <group-call-window />

  <!-- 群聊通话横幅 (有正在进行的通话但用户未加入) -->
  <group-call-banner />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useWebRTC } from '@/composables/useWebRTC'
import { useGroupWebRTC } from '@/composables/useGroupWebRTC'
import CallWindow from './CallWindow.vue'
import GroupCallIncoming from './GroupCallIncoming.vue'
import GroupCallWindow from './GroupCallWindow.vue'
import GroupCallBanner from './GroupCallBanner.vue'

// 单聊通话
const webrtc = useWebRTC()

// 使用计算属性确保响应式
const callActive = computed(() => webrtc.call.active)
const callState = computed(() => webrtc.call)
const localStreamValue = computed(() => webrtc.localStream.value)
const remoteStreamValue = computed(() => webrtc.remoteStream.value)

// 群通话
const { initListener: initGroupListener } = useGroupWebRTC()

onMounted(() => {
  // 初始化单聊通话信令监听器
  webrtc.initListener()
  // 初始化群通话信令监听器
  initGroupListener()
})
</script>
