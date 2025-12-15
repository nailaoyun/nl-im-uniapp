<script setup lang="ts">
import { useTheme } from './composables/useTheme'
import GlobalCallProvider from './components/call/GlobalCallProvider.vue'

const { theme } = useTheme()
</script>

<template>
  <wd-config-provider :theme="theme">
    <!-- #ifdef MP-WEIXIN -->
    <view class="mp-safe-container">
      <KuRootView />
    </view>
    <!-- #endif -->
    <!-- #ifndef MP-WEIXIN -->
    <KuRootView />
    <!-- #endif -->
    <!-- 全局通话组件（单聊 + 群通话） -->
    <global-call-provider />
  </wd-config-provider>
</template>

<style scoped>
</style>
