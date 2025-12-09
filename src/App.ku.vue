<script setup lang="ts">
import { useTheme } from './composables/useTheme'

const { theme } = useTheme()
</script>

<template>
  <wd-config-provider :theme="theme">
    <KuRootView />
  </wd-config-provider>
</template>

