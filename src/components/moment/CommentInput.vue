<template>
  <view 
    class="comment-input-bar" 
    :class="{ show: visible, dark: isDark }"
  >
    <view class="input-wrapper">
      <input
        ref="inputRef"
        v-model="text"
        type="text"
        :placeholder="placeholder"
        :focus="visible"
        @confirm="handleSubmit"
      />
    </view>
    <wd-button 
      size="small" 
      type="primary"
      :disabled="!text.trim() || loading"
      :loading="loading"
      @click="handleSubmit"
    >
      发送
    </wd-button>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTheme } from '@/composables/useTheme'

const props = defineProps<{
  visible: boolean
  replyTo?: { id: number; name: string } | null
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: { content: string; replyToId?: number }]
  close: []
}>()

const { isDark } = useTheme()
const text = ref('')

const placeholder = computed(() => 
  props.replyTo ? `回复 ${props.replyTo.name}` : '写评论...'
)

// 显示时清空内容
watch(() => props.visible, (val) => {
  if (val) {
    text.value = ''
  }
})

function handleSubmit() {
  if (!text.value.trim()) return
  emit('submit', {
    content: text.value.trim(),
    replyToId: props.replyTo?.id
  })
  text.value = ''
}
</script>

<style lang="scss" scoped>
.comment-input-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: var(--bg-card);
  border-top: 1rpx solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 16rpx;
  transform: translateY(100%);
  transition: transform 0.3s ease;
  z-index: 100;

  &.show {
    transform: translateY(0);
  }

  &.dark {
    --bg-card: #1c1917;
    --bg-input: #292524;
    --border-color: #44403c;
    --text-primary: #f5f5f4;
  }

  .input-wrapper {
    flex: 1;
    background: var(--bg-input, #f3f4f6);
    border-radius: 36rpx;
    padding: 16rpx 24rpx;

    input {
      width: 100%;
      font-size: 28rpx;
      color: var(--text-primary, #1f2937);
      background: transparent;
      border: none;
    }
  }
}
</style>

