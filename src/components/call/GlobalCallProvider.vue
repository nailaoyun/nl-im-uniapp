<template>
  <!-- 全局群通话来电覆盖层 -->
  <group-call-incoming />

  <!-- 全局群通话窗口 -->
  <group-call-window />

  <!-- 群聊通话横幅 (有正在进行的通话但用户未加入) -->
  <group-call-banner />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useGroupWebRTC } from '@/composables/useGroupWebRTC'
import GroupCallIncoming from './GroupCallIncoming.vue'
import GroupCallWindow from './GroupCallWindow.vue'
import GroupCallBanner from './GroupCallBanner.vue'

const { initListener } = useGroupWebRTC()

onMounted(() => {
  // 初始化信令监听器
  initListener()
})
</script>
