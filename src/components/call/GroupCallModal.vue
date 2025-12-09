<template>
  <wd-popup
    v-model="modelValue"
    position="bottom"
    :safe-area-inset-bottom="true"
    custom-style="border-radius: 24rpx 24rpx 0 0; max-height: 80vh;"
    @close="handleClose"
  >
    <view class="call-modal" :class="{ dark: isDark }">
      <!-- 头部 -->
      <view class="modal-header">
        <view class="header-info">
          <text class="header-title">发起群通话</text>
          <text class="header-subtitle">选择成员加入通话 ({{ selectedIds.size }}/{{ members.length }})</text>
        </view>
        <wd-icon
          name="close"
          size="40rpx"
          color="var(--text-secondary)"
          @click="handleClose"
        />
      </view>

      <!-- 搜索与全选 -->
      <view class="search-bar">
        <wd-search
          v-model="searchQuery"
          placeholder="搜索成员..."
          hide-cancel
        />
        <wd-button
          size="small"
          :type="isAllSelected ? 'success' : 'default'"
          plain
          @click="toggleSelectAll"
        >
          {{ isAllSelected ? '取消全选' : '全选' }}
        </wd-button>
      </view>

      <!-- 成员列表 -->
      <scroll-view class="member-list" scroll-y>
        <view v-if="filteredMembers.length === 0" class="empty-state">
          <wd-icon name="search" size="80rpx" color="var(--text-tertiary)" />
          <text class="empty-text">未找到成员</text>
        </view>

        <view v-else class="member-grid">
          <view
            v-for="member in filteredMembers"
            :key="member.id || member.user_id"
            class="member-item"
            @click="toggleSelection(member.id || member.user_id || '')"
          >
            <!-- 头像 -->
            <view class="avatar-wrap">
              <app-avatar
                :src="member.user?.avatar"
                :name="member.remark_name || member.user?.name || '?'"
                :size="100"
                radius="50%"
                :class="{ 'avatar-selected': selectedIds.has(member.id || member.user_id || '') }"
              />
              <!-- 选中标记 -->
              <view
                v-if="selectedIds.has(member.id || member.user_id || '')"
                class="check-badge"
              >
                <wd-icon name="check" size="20rpx" color="#fff" />
              </view>
              <!-- 在线状态 -->
              <view
                v-else-if="member.user?.is_online"
                class="online-dot"
              ></view>
            </view>
            <!-- 名字 -->
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
        <text class="selected-count">
          已选择 <text class="count-num">{{ selectedIds.size }}</text> 人
        </text>
        <view class="action-buttons">
          <wd-button
            :disabled="selectedIds.size === 0"
            plain
            @click="emitStartCall('audio')"
          >
            <wd-icon name="phone" size="32rpx" />
            <text style="margin-left: 8rpx;">语音</text>
          </wd-button>
          <wd-button
            type="success"
            :disabled="selectedIds.size === 0"
            @click="emitStartCall('video')"
          >
            <wd-icon name="video" size="32rpx" />
            <text style="margin-left: 8rpx;">视频</text>
          </wd-button>
        </view>
      </view>
    </view>
  </wd-popup>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

// 监听打开/关闭重置状态
watch(() => props.modelValue, (val) => {
  if (val) {
    searchQuery.value = ''
    selectedIds.value = new Set()
  }
})

// 过滤后的成员
const filteredMembers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return props.members
  return props.members.filter(m => {
    const name = m.remark_name || m.user?.name || ''
    return name.toLowerCase().includes(query)
  })
})

const isAllSelected = computed(() => {
  return filteredMembers.value.length > 0 && selectedIds.value.size === filteredMembers.value.length
})

function toggleSelection(id: string) {
  if (!id) return
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
  // 触发响应式更新
  selectedIds.value = new Set(selectedIds.value)
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = new Set()
  } else {
    const ids = filteredMembers.value.map(m => m.id || m.user_id || '').filter(Boolean)
    selectedIds.value = new Set(ids)
  }
}

function emitStartCall(type: 'audio' | 'video') {
  if (selectedIds.value.size === 0) return
  emit('start-call', type, Array.from(selectedIds.value))
  handleClose()
}

function handleClose() {
  emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
.call-modal {
  display: flex;
  flex-direction: column;
  background: var(--bg-content);
  max-height: 80vh;
}

.modal-header {
  padding: 32rpx;
  border-bottom: 1rpx solid var(--divider-color);
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
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.header-subtitle {
  font-size: 24rpx;
  color: var(--text-tertiary);
}

.search-bar {
  padding: 24rpx 32rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: var(--bg-hover);
}

.member-list {
  flex: 1;
  max-height: 50vh;
  padding: 24rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
  gap: 16rpx;

  .empty-text {
    font-size: 26rpx;
    color: var(--text-tertiary);
  }
}

.member-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 32rpx;
}

.member-item {
  width: calc(20% - 26rpx);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.avatar-wrap {
  position: relative;

  .avatar-selected {
    opacity: 1;
    transform: scale(1.05);
    box-shadow: 0 0 0 4rpx #10b981;
    border-radius: 50%;
  }
}

.check-badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 36rpx;
  height: 36rpx;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 10rpx rgba(16, 185, 129, 0.4);
  animation: bounceIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.online-dot {
  position: absolute;
  bottom: 4rpx;
  right: 4rpx;
  width: 20rpx;
  height: 20rpx;
  background: #10b981;
  border: 4rpx solid var(--bg-content);
  border-radius: 50%;
}

.member-name {
  font-size: 22rpx;
  color: var(--text-secondary);
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.name-selected {
    color: #10b981;
    font-weight: 500;
  }
}

.modal-footer {
  padding: 24rpx 32rpx;
  border-top: 1rpx solid var(--divider-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-content);
}

.selected-count {
  font-size: 24rpx;
  color: var(--text-tertiary);

  .count-num {
    color: #10b981;
    font-weight: 600;
    font-size: 28rpx;
  }
}

.action-buttons {
  display: flex;
  gap: 16rpx;
}

@keyframes bounceIn {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
</style>

