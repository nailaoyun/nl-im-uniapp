<template>
  <view :class="{ dark: isDark }">
    <wd-navbar
        :title="title"
        :left-text="leftText"
        :right-text="rightText"
        :left-arrow="leftArrow"
        :fixed="fixed"
        :placeholder="placeholder"
        :safe-area-inset-top="true"
        :bordered="bordered"
        custom-class="app-nav-bar"
        @click-left="handleClickLeft"
        @click-right="handleClickRight"
    >
      <!-- 插槽透传 -->
      <template #left v-if="$slots.left">
        <slot name="left" />
      </template>
      <template #title v-if="$slots.title">
        <slot name="title" />
      </template>
      <template #right v-if="$slots.right">
        <slot name="right" />
      </template>
    </wd-navbar>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { isDark } = useTheme()

interface Props {
  title?: string
  leftText?: string
  rightText?: string
  leftArrow?: boolean
  fixed?: boolean
  placeholder?: boolean
  safeAreaInsetTop?: boolean
  bordered?: boolean
  // 自定义点击左侧逻辑，如果不传则默认返回上一页
  customBack?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  leftText: '',
  rightText: '',
  leftArrow: true,
  fixed: true,
  placeholder: true,
  safeAreaInsetTop: true,
  bordered: false,
  customBack: false
})

const emit = defineEmits(['click-left', 'click-right'])

function handleClickLeft() {
  if (props.customBack) {
    emit('click-left')
  } else {
    // 默认行为：返回上一页，如果无法返回则去首页
    const pages = getCurrentPages()
    if (pages.length > 1) {
      uni.navigateBack()
    } else {
      uni.reLaunch({ url: '/pages/index/index' })
    }
  }
}

function handleClickRight() {
  emit('click-right')
}
</script>

<style lang="scss" scoped>
:deep(.app-nav-bar) {
  position: relative;
  // 适配暗黑模式的背景色和文字颜色
  // 假设 src/uni.scss 或 variables.scss 中定义了这些 CSS 变量
  background-color: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  .wd-navbar__title {
    color: var(--text-primary) !important;
    font-weight: 600;
  }

  .wd-navbar__text {
    color: var(--color-primary) !important;
  }

  .wd-icon {
    color: var(--text-primary) !important;
  }
}

/* #ifdef MP-WEIXIN */
:deep(.app-nav-bar) {
  top: 130rpx !important;
}
/* #endif */

/* #ifndef MP-WEIXIN */
:deep(.app-nav-bar) {
  top: 0 !important;
}
/* #endif */

// 暗黑模式下的特殊覆盖（如果 CSS 变量不够用）
.dark {
  :deep(.app-nav-bar) {
    background-color: rgba(28, 25, 23, 0.85) !important; // Warm Stone 900 with transparency
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);

    .wd-navbar__title {
      color: #f5f5f4 !important;
    }

    .wd-icon {
      color: #e7e5e4 !important;
    }
  }
}
</style>
