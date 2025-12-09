<template>
  <view class="message-input">
    <!-- 工具栏 -->
    <view class="input-toolbar">
      <wd-icon name="emotion" size="48rpx" class="tool-icon" @click="$emit('emoji')" />
      <wd-icon name="picture" size="48rpx" class="tool-icon" @click="$emit('image')" />
      <wd-icon name="folder" size="48rpx" class="tool-icon" @click="$emit('file')" />
    </view>

    <!-- 输入框 -->
    <view class="input-wrap">
      <wd-input
        v-model="inputValue"
        type="textarea"
        :auto-height="true"
        :rows="1"
        placeholder="输入消息..."
        no-border
        @confirm="onSend"
      />
    </view>

    <!-- 发送按钮 -->
    <wd-button
      v-if="inputValue.trim()"
      type="primary"
      size="small"
      @click="onSend"
    >
      发送
    </wd-button>
    <wd-icon
      v-else
      name="add-circle"
      size="48rpx"
      class="tool-icon"
      @click="$emit('more')"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'send', value: string): void
  (e: 'emoji'): void
  (e: 'image'): void
  (e: 'file'): void
  (e: 'more'): void
}>()

const inputValue = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  inputValue.value = val
})

watch(inputValue, (val) => {
  emit('update:modelValue', val)
})

function onSend() {
  if (!inputValue.value.trim()) return
  emit('send', inputValue.value.trim())
  inputValue.value = ''
}
</script>

<style lang="scss" scoped>
.message-input {
  display: flex;
  align-items: flex-end;
  padding: 16rpx 20rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: var(--bg-content);
  border-top: 1rpx solid var(--divider-color);
  gap: 16rpx;
}

.input-toolbar {
  display: flex;
  gap: 16rpx;
  padding-bottom: 8rpx;
}

.tool-icon {
  color: var(--text-secondary);
}

.input-wrap {
  flex: 1;
  background: var(--search-bg);
  border-radius: 16rpx;
  padding: 8rpx 16rpx;
}
</style>
