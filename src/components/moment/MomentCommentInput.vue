<template>
  <wd-popup
    v-model="modelValue"
    position="bottom"
    :safe-area-inset-bottom="true"
    custom-style="border-radius: 24rpx 24rpx 0 0;"
    @close="handleClose"
  >
    <view class="comment-input" :class="{ dark: isDark }">
      <!-- 头部 -->
      <view class="input-header">
        <text class="header-title">{{ replyTo ? `回复 ${replyTo.user?.name}` : '写评论' }}</text>
        <wd-icon name="close" size="40rpx" color="var(--text-secondary)" @click="handleClose" />
      </view>

      <!-- 输入区 -->
      <view class="input-body">
        <textarea
          v-model="content"
          class="comment-textarea"
          :placeholder="replyTo ? `回复 ${replyTo.user?.name}...` : '写评论...'"
          :maxlength="500"
          :focus="true"
          auto-height
        />

        <view class="input-footer">
          <text class="char-count">{{ content.length }}/500</text>
          <wd-button
            type="primary"
            size="small"
            :disabled="!content.trim() || submitting"
            :loading="submitting"
            @click="handleSubmit"
          >
            发送
          </wd-button>
        </view>
      </view>
    </view>

    <wd-toast />
  </wd-popup>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useMomentStore } from '@/stores/moment'
import { useToast } from 'wot-design-uni'
import type { MomentComment } from '@/types/moment'

const props = defineProps<{
  modelValue: boolean
  momentId: number
  replyTo?: MomentComment | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'commented': []
}>()

const { isDark } = useTheme()
const momentStore = useMomentStore()
const toast = useToast()

const content = ref('')
const submitting = ref(false)

// 打开时重置
watch(() => props.modelValue, (val) => {
  if (val) {
    content.value = ''
  }
})

async function handleSubmit() {
  if (!content.value.trim() || submitting.value) return

  submitting.value = true

  try {
    await momentStore.addComment(props.momentId, {
      content: content.value.trim(),
      reply_to_comment_id: props.replyTo?.id,
    })
    toast.success('评论成功')
    emit('commented')
    handleClose()
  } catch (error) {
    toast.error('评论失败')
  } finally {
    submitting.value = false
  }
}

function handleClose() {
  emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
.comment-input {
  background: var(--bg-content);
}

.input-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid var(--divider-color);

  .header-title {
    font-size: 30rpx;
    color: var(--text-secondary);
  }
}

.input-body {
  padding: 24rpx;
}

.comment-textarea {
  width: 100%;
  min-height: 200rpx;
  padding: 20rpx;
  background: var(--bg-hover);
  border: 1rpx solid var(--border-color);
  border-radius: 16rpx;
  font-size: 28rpx;
  color: var(--text-primary);
  line-height: 1.6;
}

.input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20rpx;

  .char-count {
    font-size: 24rpx;
    color: var(--text-tertiary);
  }
}
</style>

