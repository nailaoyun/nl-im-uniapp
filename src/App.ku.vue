<script setup lang="ts">
import { useTheme } from './composables/useTheme'
import GlobalCallProvider from './components/call/GlobalCallProvider.vue'

const { theme } = useTheme()
</script>

<template>
  <wd-config-provider :theme="theme">
    <KuRootView />
    <!-- 全局通话组件（单聊 + 群通话） -->
    <global-call-provider />
  </wd-config-provider>
</template>
