<template>
  <wd-popup
    v-model="modelValue"
    position="bottom"
    :safe-area-inset-bottom="true"
    custom-style="border-radius: 24rpx 24rpx 0 0;"
    @close="handleClose"
  >
    <view class="visibility-selector" :class="{ dark: isDark }">
      <!-- 头部 -->
      <view class="selector-header">
        <text class="header-title">谁可以看</text>
        <wd-icon name="close" size="40rpx" color="var(--text-secondary)" @click="handleClose" />
      </view>

      <!-- 选项列表 -->
      <view class="options-list">
        <view
          v-for="option in options"
          :key="option.value"
          class="option-item"
          :class="{ selected: visibility === option.value }"
          @click="handleSelect(option.value)"
        >
          <!-- 图标 -->
          <view class="option-icon" :class="`icon-${option.value}`">
            <wd-icon :name="option.icon" size="40rpx" :color="visibility === option.value ? '#fff' : 'var(--text-secondary)'" />
          </view>

          <!-- 文本 -->
          <view class="option-content">
            <text class="option-label">{{ option.label }}</text>
            <text class="option-desc">{{ option.desc }}</text>
          </view>

          <!-- 选中标记 -->
          <view v-if="visibility === option.value" class="check-mark">
            <wd-icon name="check" size="32rpx" color="var(--color-primary)" />
          </view>
        </view>
      </view>
    </view>
  </wd-popup>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const props = defineProps<{
  modelValue: boolean
  visibility: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'select': [visibility: number, userIds?: string[]]
}>()

const { isDark } = useTheme()

const options = [
  { value: 0, label: '公开', desc: '所有人可见', icon: 'globe' },
  { value: 1, label: '仅好友可见', desc: '只有你的好友可以看到', icon: 'group' },
  { value: 2, label: '部分好友可见', desc: '选择的好友可以看到', icon: 'check-circle' },
  { value: 3, label: '部分好友不可见', desc: '选择的好友看不到', icon: 'close-circle' },
]

function handleSelect(value: number) {
  // TODO: 对于部分可见/不可见，需要弹出好友选择器
  emit('select', value)
  handleClose()
}

function handleClose() {
  emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
.visibility-selector {
  background: var(--bg-content);
}

.selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid var(--divider-color);

  .header-title {
    font-size: 32rpx;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.options-list {
  padding: 16rpx 0;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 28rpx 32rpx;
  gap: 24rpx;
  transition: background 0.2s;

  &:active {
    background: var(--bg-hover);
  }

  &.selected {
    background: rgba(var(--color-primary-rgb), 0.05);
  }
}

.option-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: var(--bg-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;

  .selected & {
    background: var(--color-primary);
  }

  &.icon-0 { .selected & { background: #10b981; } }
  &.icon-1 { .selected & { background: #3b82f6; } }
  &.icon-2 { .selected & { background: #8b5cf6; } }
  &.icon-3 { .selected & { background: #f97316; } }
}

.option-content {
  flex: 1;
  min-width: 0;
}

.option-label {
  font-size: 30rpx;
  font-weight: 500;
  color: var(--text-primary);
  display: block;
  margin-bottom: 6rpx;
}

.option-desc {
  font-size: 24rpx;
  color: var(--text-tertiary);
  display: block;
}

.check-mark {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

