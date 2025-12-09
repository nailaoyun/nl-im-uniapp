<template>
  <view class="notify-page">
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
        <view class="notify-content">{{ item.content }}</view>
        <view class="notify-time">{{ formatTime(item.created_at) }}</view>
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
  is_read?: boolean
  created_at: string
}

const loading = ref(true)
const notifications = ref<GroupNotification[]>([])
const loadState = ref<'loading' | 'finished' | 'error'>('loading')
const page = ref(1)
const hasMore = ref(true)

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
  padding: 24rpx 30rpx;
  background: var(--bg-content);
  border-bottom: 1rpx solid var(--divider-color);

  &.unread {
    background: var(--bg-hover);
  }

  .notify-content {
    font-size: 30rpx;
    color: var(--text-primary);
    margin-bottom: 12rpx;
  }

  .notify-time {
    font-size: 24rpx;
    color: var(--text-tertiary);
  }
}
</style>
