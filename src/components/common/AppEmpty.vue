<template>
  <view class="app-empty">
    <wd-status-tip :image="image" :tip="description" />
      <slot />
  </view>
</template>

<script setup lang="ts">
interface Props {
  image?: string
  description?: string
}

withDefaults(defineProps<Props>(), {
  image: 'content',
  description: '暂无数据'
})
</script>

<style lang="scss" scoped>
.app-empty {
  padding: 80rpx 0;
}
</style>
