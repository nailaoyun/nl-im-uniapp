<template>
  <view class="notify-page">
    <!-- 导航栏 -->
    <app-nav-bar title="群通知" />
    
    <view v-if="loading" class="loading-state">
      <wd-loading />
      <text>加载中...</text>
    </view>

    <wd-status-tip v-else-if="notifications.length === 0" tip="暂无群通知" />

    <template v-else>
      <view
        v-for="item in notifications"
        :key="item.id"
        class="notify-item"
        :class="{ unread: !item.is_read }"
      >
        <!-- 事件图标 -->
        <view class="notify-icon" :class="getNotificationIconClass(item)">
          <wd-icon :name="getNotificationIcon(item)" size="36rpx" color="#fff" />
        </view>
        <!-- 通知内容 -->
        <view class="notify-body">
          <view class="notify-content">{{ getNotificationContent(item) }}</view>
          <view v-if="getEventDetails(item)" class="notify-detail">{{ getEventDetails(item) }}</view>
          <view class="notify-time">{{ formatTime(item.created_at) }}</view>
        </view>
      </view>

      <wd-loadmore :state="loadState" @loadmore="loadMore" />
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as roomApi from '@/api/modules/room'
import { formatTime } from '@/utils/format'

interface GroupNotification {
  id: number
  room_id: string
  content: string
  message_type?: number
  extra?: string | object
  is_read?: boolean
  created_at: string
}

const loading = ref(true)
const notifications = ref<GroupNotification[]>([])
const loadState = ref<'loading' | 'finished' | 'error'>('loading')
const page = ref(1)
const hasMore = ref(true)

// 获取通知图标
function getNotificationIcon(notification: GroupNotification): string {
  const extra = parseExtra(notification.extra)
  const event = extra.event
  switch (event) {
    case 'member_join':
      return 'add-circle'
    case 'member_leave':
      return 'arrow-left'
    case 'member_remove':
      return 'delete'
    case 'group_dissolve':
      return 'close-circle'
    case 'group_update':
      return 'edit'
    case 'role_change':
      return 'user'
    default:
      return 'bell'
  }
}

// 获取通知图标样式类
function getNotificationIconClass(notification: GroupNotification): string {
  const extra = parseExtra(notification.extra)
  const event = extra.event
  switch (event) {
    case 'member_join':
      return 'icon-green'
    case 'member_leave':
    case 'member_remove':
      return 'icon-red'
    case 'group_dissolve':
      return 'icon-red'
    case 'group_update':
      return 'icon-blue'
    case 'role_change':
      return 'icon-purple'
    default:
      return 'icon-primary'
  }
}

// 获取通知内容
function getNotificationContent(notification: GroupNotification): string {
  // 优先使用原有 content
  if (notification.content) {
    return notification.content
  }
  
  // 根据 extra 解析内容
  const extra = parseExtra(notification.extra)
  const event = extra.event
  switch (event) {
    case 'member_join':
      return '新成员加入了群聊'
    case 'member_leave':
      return '成员退出了群聊'
    case 'member_remove':
      return '成员被移出群聊'
    case 'group_dissolve':
      return '群聊已解散'
    case 'group_update':
      return '群信息已更新'
    case 'role_change':
      return '成员角色已变更'
    default:
      return '群通知'
  }
}

// 获取事件详情
function getEventDetails(notification: GroupNotification): string | null {
  const extra = parseExtra(notification.extra)
  const event = extra.event
  
  if (['member_join', 'member_leave', 'member_remove', 'role_change'].includes(event)) {
    const parts: string[] = []
    if (extra.operator_name) {
      parts.push(`操作者: ${extra.operator_name}`)
    }
    if (extra.target_name) {
      parts.push(`目标: ${extra.target_name}`)
    }
    if (parts.length > 0) {
      return parts.join('  ')
    }
  }
  return null
}

// 解析 extra 字段
function parseExtra(extra: string | object | undefined): Record<string, any> {
  if (!extra) return {}
  if (typeof extra === 'string') {
    try {
      return JSON.parse(extra)
    } catch {
      return {}
    }
  }
  return extra
}

onMounted(async () => {
  await loadNotifications()
})

async function loadNotifications() {
  loading.value = true
  try {
    const res = await roomApi.getGroupNotifications({ page: 1, page_size: 20 })
    notifications.value = res.data || []
    hasMore.value = notifications.value.length < res.total
    loadState.value = hasMore.value ? 'loading' : 'finished'
  } catch (error) {
    console.error('加载群通知失败:', error)
    loadState.value = 'error'
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (!hasMore.value || loading.value) return

  page.value++
  try {
    const res = await roomApi.getGroupNotifications({ page: page.value, page_size: 20 })
    notifications.value = [...notifications.value, ...(res.data || [])]
    hasMore.value = notifications.value.length < res.total
    loadState.value = hasMore.value ? 'loading' : 'finished'
  } catch {
    page.value--
    loadState.value = 'error'
  }
}
</script>

<style lang="scss" scoped>
.notify-page {
  min-height: 100vh;
  background: var(--bg-page);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx;
  color: var(--text-tertiary);
  gap: 20rpx;
}

.notify-item {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
  padding: 24rpx 30rpx;
  background: var(--bg-content);
  border-bottom: 1rpx solid var(--divider-color);

  &.unread {
    background: var(--bg-hover);
  }
}

.notify-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  &.icon-primary {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  }
  &.icon-green {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  }
  &.icon-red {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  }
  &.icon-blue {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  }
  &.icon-purple {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  }
}

.notify-body {
  flex: 1;
  min-width: 0;
}

.notify-content {
  font-size: 30rpx;
  color: var(--text-primary);
  margin-bottom: 8rpx;
  line-height: 1.4;
}

.notify-detail {
  font-size: 24rpx;
  color: var(--text-secondary);
  background: var(--bg-hover);
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  margin-bottom: 8rpx;
}

.notify-time {
  font-size: 24rpx;
  color: var(--text-tertiary);
}
</style>
