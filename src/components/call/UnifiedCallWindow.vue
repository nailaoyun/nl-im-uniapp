<!--
  统一音视频通话窗口组件
  自动根据平台选择合适的实现：
  - H5/App: 使用 WebRTC (CallWindow.vue)
  - 微信小程序: 使用 live-pusher/player (MiniProgramCallWindow.vue)
-->
<template>
  <!-- #ifdef H5 || APP-PLUS -->
  <CallWindow />
  <!-- #endif -->
  
  <!-- #ifdef MP-WEIXIN -->
  <MiniProgramCallWindow />
  <!-- #endif -->
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

// #ifdef H5 || APP-PLUS
import CallWindow from './CallWindow.vue'
import { useWebRTC } from '@/composables/useWebRTC'

const { initListener: initWebRTCListener } = useWebRTC()
// #endif

// #ifdef MP-WEIXIN
import MiniProgramCallWindow from './MiniProgramCallWindow.vue'
import { useMiniProgramCall } from '@/composables/useMiniProgramCall'

const { initListener: initMPListener, initPusherContext } = useMiniProgramCall()
// #endif

onMounted(() => {
  // #ifdef H5 || APP-PLUS
  initWebRTCListener()
  // #endif
  
  // #ifdef MP-WEIXIN
  initMPListener()
  initPusherContext()
  // #endif
})
</script>

