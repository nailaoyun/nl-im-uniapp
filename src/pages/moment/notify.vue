<template>
  <view class="notify-page" :class="{ dark: isDark }">
    <!-- 导航栏 -->
    <app-nav-bar title="消息通知" />
    
    <view v-if="loading && notifications.length === 0" class="loading-state">
      <wd-loading />
      <text>加载中...</text>
    </view>

    <wd-status-tip v-else-if="notifications.length === 0" tip="暂无消息通知" />

    <template v-else>
      <!-- 标记全部已读 -->
      <view v-if="hasUnread" class="mark-all" @click="markAllRead">
        <text>全部标为已读</text>
      </view>

      <view
        v-for="item in notifications"
        :key="item.id"
        class="notify-item"
        :class="{ unread: !item.is_read }"
        @click="goMomentDetail(item)"
      >
        <wd-img
          v-if="item.from_user?.avatar"
          :src="resolveImageUrl(item.from_user.avatar)"
          width="80rpx"
          height="80rpx"
          radius="8rpx"
        />
        <view v-else class="avatar-placeholder" :style="{ background: generateColor(item.from_user?.name || '') }">
          {{ item.from_user?.name?.charAt(0) || '?' }}
        </view>

        <view class="notify-content">
          <view class="notify-header">
            <text class="name">{{ item.from_user?.name || '未知用户' }}</text>
            <text class="action">{{ getActionText(item.type) }}</text>
          </view>
          <text class="time">{{ formatTime(item.created_at) }}</text>
        </view>

        <!-- 动态缩略图 -->
        <view v-if="item.moment" class="moment-thumb">
          <wd-img
            v-if="item.moment.media_urls"
            :src="resolveImageUrl(parseMediaUrls(item.moment.media_urls)[0])"
            width="80rpx"
            height="80rpx"
            mode="aspectFill"
            radius="8rpx"
          />
          <text v-else class="moment-text">{{ item.moment.content?.slice(0, 20) }}</text>
        </view>
      </view>

      <!-- 加载更多 -->
      <wd-loadmore :state="loadState" @loadmore="loadMore" />
    </template>

    <wd-toast />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMomentStore } from '@/stores'
import { formatTime, generateColor } from '@/utils/format'
import { resolveImageUrl } from '@/utils/image'
import { parseMediaUrls } from '@/types/moment'
import { useToast } from 'wot-design-uni'
import { useTheme } from '@/composables/useTheme'
import AppAvatar from '@/components/common/AppAvatar.vue'
import type { MomentNotification } from '@/types/moment'

const momentStore = useMomentStore()
const toast = useToast()
const { isDark } = useTheme()

const loadState = ref<'loading' | 'finished' | 'error'>('loading')

const loading = computed(() => momentStore.loading)
const notifications = computed(() => momentStore.notifications)
const hasUnread = computed(() => notifications.value.some(n => !n.is_read))

onMounted(async () => {
  await loadNotifications()
})

async function loadNotifications() {
  try {
    await momentStore.fetchNotifications(true)
    loadState.value = momentStore.notifPagination.hasMore ? 'loading' : 'finished'
  } catch {
    loadState.value = 'error'
  }
}

async function loadMore() {
  if (!momentStore.notifPagination.hasMore || loading.value) return
  await momentStore.fetchMoreNotifications()
  loadState.value = momentStore.notifPagination.hasMore ? 'loading' : 'finished'
}

async function markAllRead() {
  await momentStore.markAllAsRead()
  toast.success('已全部标为已读')
}

function getActionText(type: number): string {
  switch (type) {
    case 1: return '赞了你的动态'
    case 2: return '评论了你的动态'
    case 3: return '回复了你的评论'
    case 4: return '在动态中@了你'
    default: return '与你互动'
  }
}

function goMomentDetail(item: MomentNotification) {
  // 标记已读
  if (!item.is_read) {
    momentStore.markAsRead([item.id])
  }
  // 跳转详情
  uni.navigateTo({ url: `/pages/moment/detail?id=${item.moment_id}` })
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

.mark-all {
  padding: 20rpx 30rpx;
  text-align: right;

  text {
    font-size: 28rpx;
    color: var(--color-primary);
  }
}

.notify-item {
  display: flex;
  align-items: center;
  padding: 24rpx 30rpx;
  background: var(--bg-content);
  border-bottom: 1rpx solid var(--divider-color);

  &.unread {
    background: var(--bg-hover);
  }

  .avatar-placeholder {
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8rpx;
    color: #fff;
    font-size: 32rpx;
    font-weight: 600;
  }
}

.notify-content {
  flex: 1;
  margin-left: 24rpx;
  min-width: 0;

  .notify-header {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-bottom: 8rpx;

    .name {
      font-size: 30rpx;
      color: var(--text-link);
      font-weight: 500;
    }

    .action {
      font-size: 28rpx;
      color: var(--text-primary);
    }
  }

  .time {
    font-size: 24rpx;
    color: var(--text-tertiary);
  }
}

.moment-thumb {
  margin-left: 20rpx;

  .moment-text {
    display: block;
    width: 80rpx;
    font-size: 24rpx;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
