<template>
  <view v-if="modelValue" class="modal-container" :class="{ dark: isDark }">
    <!-- 遮罩 -->
    <view 
      class="modal-mask" 
      :class="{ 'mask-active': showContent }"
      @click="handleClose"
    />
    
    <!-- 弹窗内容 -->
    <view class="call-modal" :class="{ 'modal-active': showContent }">
      <!-- 头部 -->
      <view class="modal-header">
        <view class="header-info">
          <text class="header-title">发起群通话</text>
          <text class="header-subtitle">选择成员加入通话</text>
        </view>
        <view class="close-btn" @click="handleClose">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </view>
      </view>

      <!-- 搜索 -->
      <view class="search-bar">
        <view class="search-input">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" v-model="searchQuery" placeholder="搜索成员" />
        </view>
      </view>

      <!-- 成员列表 -->
      <scroll-view class="member-list" scroll-y>
        <view v-if="filteredMembers.length === 0" class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <text class="empty-text">未找到成员</text>
        </view>

        <view v-else class="member-grid">
          <view
            v-for="member in filteredMembers"
            :key="member.id || member.user_id"
            class="member-item"
            @click="toggleSelection(member.id || member.user_id || '')"
          >
            <view class="avatar-wrap" :class="{ selected: selectedIds.has(member.id || member.user_id || '') }">
              <app-avatar
                :src="member.user?.avatar"
                :name="member.remark_name || member.user?.name || '?'"
                :size="112"
                round
              />
              <!-- 选中标记 -->
              <view
                v-if="selectedIds.has(member.id || member.user_id || '')"
                class="check-badge"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </view>
              <!-- 在线状态 -->
              <view
                v-else-if="member.user?.is_online"
                class="online-dot"
              ></view>
            </view>
            <text
              class="member-name"
              :class="{ 'name-selected': selectedIds.has(member.id || member.user_id || '') }"
            >
              {{ member.remark_name || member.user?.name || '未知成员' }}
            </text>
          </view>
        </view>
      </scroll-view>

      <!-- 底部操作栏 -->
      <view class="modal-footer">
        <view class="selected-info">
          <text>已选择</text>
          <text class="count-num">{{ selectedIds.size }}</text>
          <text>人</text>
        </view>
        <view class="action-buttons">
          <view class="action-btn audio-btn" :class="{ disabled: selectedIds.size === 0 }" @click="emitStartCall('audio')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </view>
          <view class="action-btn video-btn" :class="{ disabled: selectedIds.size === 0 }" @click="emitStartCall('video')">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            <text>开始</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useTheme } from '@/composables/useTheme'
import AppAvatar from '@/components/common/AppAvatar.vue'
import type { Contact } from '@/types/api'

const props = defineProps<{
  modelValue: boolean
  members: Contact[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'start-call': [type: 'audio' | 'video', selectedIds: string[]]
}>()

const { isDark } = useTheme()
const searchQuery = ref('')
const selectedIds = ref<Set<string>>(new Set())
const showContent = ref(false)

watch(() => props.modelValue, (val) => {
  if (val) {
    searchQuery.value = ''
    selectedIds.value = new Set()
    nextTick(() => {
      showContent.value = true
    })
  } else {
    showContent.value = false
  }
})

const filteredMembers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return props.members
  return props.members.filter(m => {
    const name = m.remark_name || m.user?.name || ''
    return name.toLowerCase().includes(query)
  })
})

function toggleSelection(id: string) {
  if (!id) return
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
  selectedIds.value = new Set(selectedIds.value)
}

function emitStartCall(type: 'audio' | 'video') {
  if (selectedIds.value.size === 0) return
  emit('start-call', type, Array.from(selectedIds.value))
  handleClose()
}

function handleClose() {
  showContent.value = false
  setTimeout(() => {
    emit('update:modelValue', false)
  }, 300)
}
</script>

<style lang="scss" scoped>
.modal-container {
  position: fixed;
  inset: 0;
  z-index: 1000;
  
  --bg-surface: #fff;
  --bg-hover: #f5f5f5;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;
  --border-color: rgba(0, 0, 0, 0.05);
  --color-brand: #4F46E5;

  &.dark {
    --bg-surface: #1c1917;
    --bg-hover: #292524;
    --text-primary: #f5f5f4;
    --text-secondary: #a8a29e;
    --text-tertiary: #78716c;
    --border-color: rgba(255, 255, 255, 0.08);
    --color-brand: #4F46E5;
  }
}

.modal-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4rpx);
  opacity: 0;
  transition: opacity 0.3s;

  &.mask-active {
    opacity: 1;
  }
}

.call-modal {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  max-height: 85vh;
  border-radius: 64rpx 64rpx 0 0;
  box-shadow: 0 -20rpx 80rpx rgba(0, 0, 0, 0.1);
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);

  &.modal-active {
    transform: translateY(0);
  }
}

.modal-header {
  padding: 40rpx 40rpx 24rpx;
  border-bottom: 1rpx solid var(--border-color);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.header-title {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5rpx;
}

.header-subtitle {
  font-size: 24rpx;
  color: var(--text-tertiary);
}

.close-btn {
  width: 64rpx;
  height: 64rpx;
  background: var(--bg-hover);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;

  svg {
    width: 40rpx;
    height: 40rpx;
    color: var(--text-secondary);
  }

  &:active {
    transform: scale(0.95);
    background: var(--border-color);
  }
}

.search-bar {
  padding: 24rpx 40rpx;
  background: rgba(0, 0, 0, 0.02);
  
  .dark & {
    background: rgba(255, 255, 255, 0.02);
  }
}

.search-input {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: var(--bg-hover);
  padding: 0 24rpx;
  height: 72rpx;
  border-radius: 24rpx;

  svg {
    width: 32rpx;
    height: 32rpx;
    color: var(--text-tertiary);
    flex-shrink: 0;
  }

  input {
    flex: 1;
    height: 100%;
    font-size: 28rpx;
    color: var(--text-primary);
    background: transparent;
    border: none;

    &::placeholder { color: var(--text-tertiary); }
  }
}

.member-list {
  flex: 1;
  max-height: 50vh;
  padding: 32rpx 40rpx 160rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  gap: 24rpx;

  svg {
    width: 100rpx;
    height: 100rpx;
    color: var(--text-tertiary);
    opacity: 0.4;
  }

  .empty-text {
    font-size: 28rpx;
    color: var(--text-tertiary);
  }
}

.member-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 48rpx 16rpx;
}

.member-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.avatar-wrap {
  position: relative;
  transition: all 0.2s;

  &.selected {
    transform: scale(0.95);
    
    :deep(.app-avatar) {
      box-shadow: 0 0 0 8rpx var(--color-brand);
      border-radius: 32rpx;
    }
  }
}

.check-badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 40rpx;
  height: 40rpx;
  background: var(--color-brand);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid var(--bg-surface);
  box-shadow: 0 4rpx 12rpx rgba(79, 70, 229, 0.4);
  animation: bounceIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  svg {
    width: 24rpx;
    height: 24rpx;
  }
}

.online-dot {
  position: absolute;
  bottom: 4rpx;
  right: 4rpx;
  width: 24rpx;
  height: 24rpx;
  background: #10b981;
  border: 4rpx solid var(--bg-surface);
  border-radius: 50%;
}

.member-name {
  font-size: 22rpx;
  color: var(--text-secondary);
  text-align: center;
  max-width: 128rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s;
  font-weight: 500;

  &.name-selected {
    color: var(--color-brand);
    font-weight: 600;
  }
}

.modal-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(64rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-surface);
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.02);
  border-radius: 32rpx 32rpx 0 0;
}

.selected-info {
  font-size: 28rpx;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4rpx;

  .count-num {
    color: var(--color-brand);
    font-weight: 700;
    font-size: 36rpx;
    margin: 0 8rpx;
    transition: all 0.2s;
  }
}

.action-buttons {
  display: flex;
  gap: 24rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  border-radius: 32rpx;
  transition: all 0.15s;

  svg {
    width: 40rpx;
    height: 40rpx;
  }

  &.disabled {
    opacity: 0.4;
    pointer-events: none;
  }

  &:active {
    transform: scale(0.95);
  }
}

.audio-btn {
  width: 96rpx;
  height: 96rpx;
  background: var(--bg-hover);
  border: 1rpx solid var(--border-color);
  color: var(--text-secondary);
}

.video-btn {
  height: 96rpx;
  padding: 0 48rpx;
  background: var(--color-brand);
  box-shadow: 0 8rpx 24rpx rgba(79, 70, 229, 0.3);

  text {
    font-size: 28rpx;
    font-weight: 700;
    color: #fff;
  }
}

@keyframes bounceIn {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
