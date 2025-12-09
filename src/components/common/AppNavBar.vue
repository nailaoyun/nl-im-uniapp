<template>
  <wd-navbar
    :title="title"
    :left-arrow="leftArrow"
    :fixed="fixed"
    :placeholder="placeholder"
    :bordered="bordered"
    :safe-area-inset-top="safeAreaInsetTop"
    :z-index="zIndex"
    custom-class="app-navbar"
    @click-left="onClickLeft"
    @click-right="onClickRight"
  >
    <template v-if="$slots.left" #left>
      <slot name="left" />
    </template>
    <template v-if="$slots.title" #title>
      <slot name="title" />
    </template>
    <template v-if="$slots.right" #right>
      <slot name="right" />
    </template>
  </wd-navbar>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  leftArrow?: boolean
  fixed?: boolean
  placeholder?: boolean
  bordered?: boolean
  safeAreaInsetTop?: boolean
  zIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  leftArrow: true,
  fixed: true,
  placeholder: true,
  bordered: true,
  safeAreaInsetTop: true,
  zIndex: 100
})

const emit = defineEmits<{
  (e: 'click-left'): void
  (e: 'click-right'): void
}>()

function onClickLeft() {
  emit('click-left')
  // 默认返回上一页
  if (props.leftArrow) {
    uni.navigateBack({
      fail: () => {
        // 如果没有上一页，则跳转到首页
        uni.reLaunch({ url: '/pages/index/index' })
      }
    })
  }
}

function onClickRight() {
  emit('click-right')
}
</script>

<style lang="scss">
.app-navbar {
  --wot-navbar-bg-color: var(--nav-bg, #ededed);
  --wot-navbar-title-color: var(--text-primary, #333);
  --wot-navbar-icon-color: var(--text-primary, #333);
}
</style>
