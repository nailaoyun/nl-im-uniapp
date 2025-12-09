<template>
  <view class="app-avatar" :style="avatarStyle" @click="onClick">
    <wd-img
      v-if="resolvedSrc"
      :src="resolvedSrc"
      :width="sizeRpx"
      :height="sizeRpx"
      :round="round"
      :radius="round ? '50%' : radius"
      mode="aspectFill"
    />
    <view
      v-else
      class="avatar-placeholder"
      :style="placeholderStyle"
    >
      {{ displayText }}
    </view>
    
    <!-- 徽标 -->
    <wd-badge
      v-if="badge && badge > 0"
      :value="badge"
      :max="99"
      class="avatar-badge"
    />
    <view v-else-if="dot" class="avatar-dot" />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { generateColor } from '@/utils/format'
import { resolveImageUrl } from '@/utils/image'

interface Props {
  src?: string
  name?: string
  size?: number
  round?: boolean
  radius?: string
  badge?: number
  dot?: boolean
  bgColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  name: '',
  size: 80,
  round: false,
  radius: '8rpx',
  badge: 0,
  dot: false,
  bgColor: ''
})

// 判断是否为有效图片 URL
function isValidImageUrl(url?: string): boolean {
  if (!url) return false
  // 有效 URL: http/https/data URI 或以 /uploads/ 开头
  return url.startsWith('http://') || 
         url.startsWith('https://') || 
         url.startsWith('data:') || 
         url.startsWith('/uploads/')
}

// 处理图片 URL，添加域名前缀，并验证是否为有效图片 URL
const resolvedSrc = computed(() => {
  // 先检查原始 src 是否为有效图片路径
  if (!isValidImageUrl(props.src)) return ''
  return resolveImageUrl(props.src)
})

const emit = defineEmits<{
  (e: 'click'): void
}>()

const sizeRpx = computed(() => `${props.size}rpx`)

const avatarStyle = computed(() => ({
  width: sizeRpx.value,
  height: sizeRpx.value
}))

const placeholderStyle = computed(() => ({
  width: sizeRpx.value,
  height: sizeRpx.value,
  borderRadius: props.round ? '50%' : props.radius,
  background: props.bgColor || generateColor(props.name),
  fontSize: `${props.size * 0.4}rpx`
}))

const displayText = computed(() => {
  return props.name?.charAt(0) || '?'
})

function onClick() {
  emit('click')
}
</script>

<style lang="scss" scoped>
.app-avatar {
  position: relative;
  display: inline-block;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
}

.avatar-badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
}

.avatar-dot {
  position: absolute;
  top: 0;
  right: 0;
  width: 16rpx;
  height: 16rpx;
  background: var(--color-danger);
  border-radius: 50%;
  border: 2rpx solid var(--bg-content);
}
</style>







