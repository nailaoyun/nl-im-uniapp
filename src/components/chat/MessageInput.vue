<template>
  <view class="message-input">
    <!-- @ 提及弹窗 -->
    <wd-popup v-model="showMentionPicker" position="bottom" safe-area-inset-bottom>
      <view class="mention-picker">
        <view class="mention-header">
          <text class="title">选择要 @ 的成员</text>
          <wd-icon name="close" size="40rpx" @click="showMentionPicker = false" />
        </view>
        <scroll-view scroll-y class="mention-list">
          <view
            v-for="member in members"
            :key="member.user_id"
            class="mention-item"
            @click="selectMention(member)"
          >
            <app-avatar
              :src="member.user?.avatar"
              :name="member.nickname || member.user?.name"
              :size="72"
              radius="8rpx"
            />
            <text class="mention-name">{{ member.nickname || member.user?.name || '未知' }}</text>
          </view>
        </scroll-view>
      </view>
    </wd-popup>

    <!-- 工具栏 -->
    <view class="input-toolbar">
      <wd-icon name="emotion" size="48rpx" class="tool-icon" @click="$emit('emoji')" />
      <wd-icon name="picture" size="48rpx" class="tool-icon" @click="$emit('image')" />
      <wd-icon name="folder" size="48rpx" class="tool-icon" @click="$emit('file')" />
      <wd-icon v-if="isGroup" name="at-sign" size="48rpx" class="tool-icon" @click="openMentionPicker" />
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
        @input="onInput"
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
import AppAvatar from '@/components/common/AppAvatar.vue'
import type { GroupMember } from '@/types/api'

interface Props {
  modelValue?: string
  isGroup?: boolean
  members?: GroupMember[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  isGroup: false,
  members: () => []
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'send', value: string): void
  (e: 'emoji'): void
  (e: 'image'): void
  (e: 'file'): void
  (e: 'more'): void
  (e: 'mention', member: GroupMember): void
}>()

const inputValue = ref(props.modelValue)
const showMentionPicker = ref(false)

watch(() => props.modelValue, (val) => {
  inputValue.value = val
})

watch(inputValue, (val) => {
  emit('update:modelValue', val)
})

function onInput(e: any) {
  const value = e.detail?.value || e.value || inputValue.value
  // 检测 @ 符号
  if (props.isGroup && value.endsWith('@')) {
    showMentionPicker.value = true
  }
}

function openMentionPicker() {
  showMentionPicker.value = true
}

function selectMention(member: GroupMember) {
  const name = member.nickname || member.user?.name || ''
  // 如果已经输入了 @，就替换；否则追加 @名字
  if (inputValue.value.endsWith('@')) {
    inputValue.value = inputValue.value + name + ' '
  } else {
    inputValue.value = inputValue.value + '@' + name + ' '
  }
  showMentionPicker.value = false
  emit('mention', member)
}

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

// @ 提及选择器
.mention-picker {
  max-height: 60vh;
  background: var(--bg-content);
  
  .mention-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 30rpx;
    border-bottom: 1rpx solid var(--divider-color);
    
    .title {
      font-size: 32rpx;
      font-weight: 600;
      color: var(--text-primary);
    }
  }
  
  .mention-list {
    max-height: 50vh;
  }
  
  .mention-item {
    display: flex;
    align-items: center;
    padding: 20rpx 30rpx;
    gap: 20rpx;
    
    &:active {
      background: var(--bg-hover);
    }
    
    .mention-name {
      font-size: 30rpx;
      color: var(--text-primary);
    }
  }
}
</style>







