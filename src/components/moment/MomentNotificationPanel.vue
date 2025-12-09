<template>
  <wd-popup
    v-model="modelValue"
    position="bottom"
    :safe-area-inset-bottom="true"
    custom-style="border-radius: 32rpx 32rpx 0 0; max-height: 80vh;"
    @close="handleClose"
  >
    <view class="notification-panel" :class="{ dark: isDark }">
      <!-- 头部 -->
      <view class="panel-header">
        <text class="header-title">消息通知</text>
        <view class="header-actions">
          <text
            v-if="momentStore.hasUnread"
            class="mark-read-btn"
            @click="markAllRead"
          >
            全部已读
          </text>
          <wd-icon name="close" size="40rpx" color="var(--text-secondary)" @click="handleClose" />
        </view>
      </view>

      <!-- 通知列表 -->
      <scroll-view
        class="notification-list"
        scroll-y
        @scrolltolower="loadMore"
      >
        <!-- 加载中 -->
        <view v-if="loading && notifications.length === 0" class="loading-state">
          <wd-loading />
          <text>加载中...</text>
        </view>

        <!-- 空状态 -->
        <view v-else-if="notifications.length === 0" class="empty-state">
          <wd-icon name="bell" size="80rpx" color="var(--text-tertiary)" />
          <text>暂无消息通知</text>
        </view>

        <!-- 通知列表 -->
        <view v-else class="notifications">
          <view
            v-for="notification in notifications"
            :key="notification.id"
            class="notification-item"
            :class="{ unread: !notification.is_read }"
            @click="handleNotificationClick(notification)"
          >
            <!-- 头像 -->
            <app-avatar
              :src="notification.from_user?.avatar"
              :name="notification.from_user?.name || ''"
              :size="80"
              radius="50%"
            />

            <!-- 内容 -->
            <view class="notification-content">
              <view class="notification-header">
                <text class="from-name">{{ notification.from_user?.name }}</text>
                <text class="notification-type">{{ getNotificationText(notification.type) }}</text>
              </view>

              <!-- 评论内容 -->
              <text v-if="notification.comment" class="comment-preview">
                {{ notification.comment.content }}
              </text>

              <!-- 动态预览 -->
              <view v-if="notification.moment" class="moment-preview">
                <text>{{ notification.moment.content || '[图片/视频]' }}</text>
              </view>

              <!-- 时间 -->
              <text class="notification-time">{{ formatTime(notification.created_at) }}</text>
            </view>

            <!-- 未读标记 -->
            <view v-if="!notification.is_read" class="unread-dot" />
          </view>
        </view>

        <!-- 加载更多 -->
        <wd-loadmore v-if="notifications.length > 0" :state="loadState" @loadmore="loadMore" />
      </scroll-view>
    </view>

    <wd-toast />
  </wd-popup>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useMomentStore } from '@/stores/moment'
import { useToast } from 'wot-design-uni'
import { formatTime } from '@/utils/format'
import AppAvatar from '@/components/common/AppAvatar.vue'
import type { MomentNotification } from '@/types/moment'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { isDark } = useTheme()
const momentStore = useMomentStore()
const toast = useToast()

const loading = ref(false)
const loadState = ref<'loading' | 'finished' | 'error'>('loading')

const notifications = computed(() => momentStore.notifications)

// 通知类型文本
const NotificationTypeText: Record<number, string> = {
  1: '赞了你',
  2: '评论了你',
  3: '回复了你',
}

// 监听打开
watch(() => props.modelValue, async (val) => {
  if (val) {
    await fetchNotifications(true)
  }
})

async function fetchNotifications(refresh = false) {
  loading.value = true
  loadState.value = 'loading'

  try {
    await momentStore.fetchNotifications(refresh)
    loadState.value = momentStore.notifPagination.hasMore ? 'loading' : 'finished'
  } catch (e) {
    loadState.value = 'error'
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (!loading.value && momentStore.notifPagination.hasMore) {
    await momentStore.fetchMoreNotifications()
    loadState.value = momentStore.notifPagination.hasMore ? 'loading' : 'finished'
  }
}

function getNotificationText(type: number): string {
  return NotificationTypeText[type] || ''
}

async function handleNotificationClick(notification: MomentNotification) {
  // 标记已读
  if (!notification.is_read) {
    await momentStore.markAsRead([notification.id])
  }
  handleClose()
}

async function markAllRead() {
  try {
    await momentStore.markAllAsRead()
    toast.success('已全部标记为已读')
  } catch (e) {
    toast.error('操作失败')
  }
}

function handleClose() {
  emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
.notification-panel {
  display: flex;
  flex-direction: column;
  background: var(--bg-content);
  max-height: 80vh;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid var(--divider-color);
}

.header-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.mark-read-btn {
  font-size: 26rpx;
  color: var(--color-primary);

  &:active {
    opacity: 0.7;
  }
}

.notification-list {
  flex: 1;
  max-height: calc(80vh - 120rpx);
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  gap: 20rpx;
  color: var(--text-tertiary);
  font-size: 26rpx;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  padding: 24rpx;
  border-bottom: 1rpx solid var(--divider-color);
  transition: background 0.2s;

  &:active {
    background: var(--bg-hover);
  }

  &.unread {
    background: rgba(var(--color-primary-rgb), 0.05);
  }
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
  margin-bottom: 8rpx;
}

.from-name {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--text-primary);
}

.notification-type {
  font-size: 26rpx;
  color: var(--text-tertiary);
}

.comment-preview {
  font-size: 26rpx;
  color: var(--text-secondary);
  margin-bottom: 12rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.moment-preview {
  padding: 12rpx 16rpx;
  background: var(--bg-hover);
  border-radius: 8rpx;
  margin-bottom: 12rpx;

  text {
    font-size: 24rpx;
    color: var(--text-tertiary);
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.notification-time {
  font-size: 22rpx;
  color: var(--text-tertiary);
}

.unread-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: var(--color-primary);
  flex-shrink: 0;
  margin-top: 12rpx;
}
</style>

