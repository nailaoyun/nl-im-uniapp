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

const { initListener: initMPListener } = useMiniProgramCall()
// #endif

onMounted(() => {
  // #ifdef H5 || APP-PLUS
  initWebRTCListener()
  // #endif
  
  // #ifdef MP-WEIXIN
  // 注意：initPusherContext 不在这里调用，因为此时 live-pusher 组件还未渲染
  // live-pusher 的 Context 初始化由 MiniProgramCallWindow.vue 在 pushUrl 设置后处理
  initMPListener()
  // #endif
})
</script>

