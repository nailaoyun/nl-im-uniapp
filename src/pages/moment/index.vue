<template>
  <view class="page-container" :class="{ dark: isDark }">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-content">
        <view class="navbar-title">朋友圈</view>
        <view class="navbar-right">
          <wd-badge :value="unreadCount" :max="99" v-if="unreadCount > 0">
            <wd-icon name="bell" size="44rpx" @click="goNotifications" />
          </wd-badge>
          <wd-icon v-else name="bell" size="44rpx" @click="goNotifications" />
        </view>
      </view>
    </view>

    <!-- 内容区域 -->
    <scroll-view
      class="content-scroll"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
    >
      <!-- 封面区域 -->
      <view class="cover-section">
        <image class="cover-bg" src="/static/images/moment-cover.jpg" mode="aspectFill" />
        <view class="user-info">
          <wd-img
            v-if="user?.avatar"
            :src="user.avatar"
            width="120rpx"
            height="120rpx"
            radius="8rpx"
          />
          <view v-else class="avatar-placeholder avatar-lg">
            {{ user?.name?.charAt(0) || '?' }}
          </view>
          <text class="user-name">{{ user?.name || '未知' }}</text>
        </view>
      </view>

      <!-- 动态列表 -->
      <view class="moments-list">
        <view v-if="loading && moments.length === 0" class="loading-state">
          <wd-loading />
          <text>加载中...</text>
        </view>

        <wd-status-tip v-else-if="moments.length === 0" tip="暂无动态" />

        <template v-else>
          <view
            v-for="moment in moments"
            :key="moment.id"
            class="moment-card"
          >
            <!-- 用户头像 -->
            <view class="moment-avatar">
              <wd-img
                v-if="moment.user?.avatar"
                :src="moment.user.avatar"
                width="80rpx"
                height="80rpx"
                radius="8rpx"
              />
              <view v-else class="avatar-placeholder" :style="{ background: generateColor(moment.user?.name || '') }">
                {{ moment.user?.name?.charAt(0) || '?' }}
              </view>
            </view>

            <!-- 动态内容 -->
            <view class="moment-content">
              <!-- 用户名 -->
              <text class="moment-username">{{ moment.user?.name || '未知' }}</text>

              <!-- 文本内容 -->
              <view v-if="moment.content" class="moment-text">
                <text>{{ moment.content }}</text>
              </view>

              <!-- 图片 -->
              <view v-if="moment.media_type === 1" class="moment-images" :class="`images-${getImageCount(moment)}`">
                <wd-img
                  v-for="(url, index) in parseMediaUrls(moment.media_urls)"
                  :key="index"
                  :src="url"
                  :width="getImageSize(moment)"
                  :height="getImageSize(moment)"
                  mode="aspectFill"
                  radius="8rpx"
                  enable-preview
                  :preview-src-list="parseMediaUrls(moment.media_urls)"
                />
              </view>

              <!-- 视频 -->
              <view v-if="moment.media_type === 2" class="moment-video">
                <video
                  :src="parseMediaUrls(moment.media_urls)[0]"
                  class="video-player"
                  object-fit="cover"
                  :show-fullscreen-btn="true"
                  :show-play-btn="true"
                />
              </view>

              <!-- 时间和操作 -->
              <view class="moment-footer">
                <text class="moment-time">{{ formatTime(moment.created_at) }}</text>
                <view class="moment-actions">
                  <view class="action-item" @click="showActionMenu(moment)">
                    <wd-icon name="more" size="32rpx" />
                  </view>
                </view>
              </view>

              <!-- 点赞和评论 -->
              <view v-if="(moment.likes && moment.likes.length > 0) || (moment.comments && moment.comments.length > 0)" class="moment-interactions">
                <!-- 点赞 -->
                <view v-if="moment.likes && moment.likes.length > 0" class="likes-row">
                  <wd-icon name="heart-fill" size="28rpx" color="#fa5151" />
                  <text class="likes-text">
                    {{ moment.likes.map(l => l.user?.name || '').join('、') }}
                  </text>
                </view>
                <!-- 评论 -->
                <view
                  v-for="comment in moment.comments"
                  :key="comment.id"
                  class="comment-row"
                >
                  <text class="comment-user">{{ comment.user?.name || '未知' }}</text>
                  <text v-if="comment.reply_to_user">
                    回复 <text class="comment-user">{{ comment.reply_to_user.name }}</text>
                  </text>
                  <text>: {{ comment.content }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 加载更多 -->
          <wd-loadmore :state="loadState" @loadmore="loadMore" />
        </template>
      </view>
    </scroll-view>

    <!-- 发布按钮 -->
    <view class="fab" @click="goPublish">
      <wd-icon name="camera" size="48rpx" color="#fff" />
    </view>

    <!-- 操作菜单 -->
    <wd-action-sheet
      v-model="showActions"
      :actions="actionItems"
      @select="onActionSelect"
    />

    <wd-toast />
    <wd-message-box />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAuthStore, useMomentStore } from '@/stores'
import { useTheme } from '@/composables/useTheme'
import { formatTime, generateColor } from '@/utils/format'
import { parseMediaUrls } from '@/types/moment'
import { useToast, useMessage } from 'wot-design-uni'
import type { Moment } from '@/types/moment'

const authStore = useAuthStore()
const momentStore = useMomentStore()
const { isDark } = useTheme()
const toast = useToast()
const messageBox = useMessage()

// 状态
const refreshing = ref(false)
const showActions = ref(false)
const currentMoment = ref<Moment | null>(null)
const loadState = ref<'loading' | 'finished' | 'error'>('loading')

// 计算属性
const user = computed(() => authStore.user)
const moments = computed(() => momentStore.moments)
const loading = computed(() => momentStore.loading)
const unreadCount = computed(() => momentStore.unreadCount)

// 操作菜单
const actionItems = computed(() => {
  const items = []
  if (currentMoment.value) {
    items.push({
      name: currentMoment.value.is_liked ? '取消赞' : '赞',
      value: 'like'
    })
    items.push({ name: '评论', value: 'comment' })
    if (currentMoment.value.user_id === user.value?.id) {
      items.push({ name: '删除', value: 'delete', color: '#fa5151' })
    }
  }
  return items
})

// 生命周期
onMounted(() => {
  loadData()
})

onShow(() => {
  loadUnreadCount()
})

// 方法
async function loadData() {
  try {
    await momentStore.fetchMoments()
    loadState.value = momentStore.pagination.hasMore ? 'loading' : 'finished'
  } catch {
    loadState.value = 'error'
  }
}

async function loadUnreadCount() {
  try {
    await momentStore.fetchUnreadCount()
  } catch {
    // ignore
  }
}

async function onRefresh() {
  refreshing.value = true
  momentStore.pagination.page = 1
  await loadData()
  refreshing.value = false
}

async function loadMore() {
  if (!momentStore.pagination.hasMore || loading.value) return
  momentStore.pagination.page++
  await momentStore.fetchMoreMoments()
  loadState.value = momentStore.pagination.hasMore ? 'loading' : 'finished'
}

function goNotifications() {
  uni.navigateTo({ url: '/pages/moment/notify' })
}

function goPublish() {
  uni.navigateTo({ url: '/pages/moment/publish' })
}

function showActionMenu(moment: Moment) {
  currentMoment.value = moment
  showActions.value = true
}

async function onActionSelect(item: { value: string }) {
  if (!currentMoment.value) return

  switch (item.value) {
    case 'like':
      await toggleLike()
      break
    case 'comment':
      goComment()
      break
    case 'delete':
      await deleteMoment()
      break
  }
  showActions.value = false
}

async function toggleLike() {
  if (!currentMoment.value) return
  try {
    await momentStore.toggleLike(currentMoment.value.id)
  } catch {
    toast.error('操作失败')
  }
}

function goComment() {
  if (!currentMoment.value) return
  uni.navigateTo({ url: `/pages/moment/detail?id=${currentMoment.value.id}` })
}

async function deleteMoment() {
  if (!currentMoment.value) return
  try {
    await messageBox.confirm({
      title: '提示',
      msg: '确定要删除这条动态吗？'
    })
    await momentStore.deleteMoment(currentMoment.value.id)
    toast.success('已删除')
  } catch {
    // 取消或失败
  }
}

// 辅助函数
function getImageCount(moment: Moment): number {
  const urls = parseMediaUrls(moment.media_urls)
  return Math.min(urls.length, 9)
}

function getImageSize(moment: Moment): string {
  const count = getImageCount(moment)
  if (count === 1) return '400rpx'
  if (count <= 4) return '200rpx'
  return '150rpx'
}
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: var(--bg-page);
}

// 自定义导航栏
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: transparent;
  padding-top: var(--status-bar-height, 0);

  .navbar-content {
    display: flex;
    align-items: center;
    height: 88rpx;
    padding: 0 30rpx;
  }

  .navbar-title {
    flex: 1;
    font-size: 36rpx;
    font-weight: 600;
    color: #fff;
    text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
  }

  .navbar-right {
    color: #fff;
  }
}

// 内容滚动区域
.content-scroll {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

// 封面区域
.cover-section {
  position: relative;
  height: 500rpx;

  .cover-bg {
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .user-info {
    position: absolute;
    right: 30rpx;
    bottom: -40rpx;
    display: flex;
    align-items: flex-end;
    gap: 16rpx;

    .avatar-lg {
      width: 120rpx;
      height: 120rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8rpx;
      background: var(--color-primary);
      color: #fff;
      font-size: 48rpx;
      font-weight: 600;
      border: 4rpx solid #fff;
    }

    .user-name {
      font-size: 32rpx;
      font-weight: 600;
      color: #fff;
      text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.5);
      margin-bottom: 20rpx;
    }
  }
}

// 动态列表
.moments-list {
  padding-top: 60rpx;
  background: var(--bg-content);
  min-height: calc(100vh - 500rpx);
}

.moment-card {
  display: flex;
  padding: 30rpx;
  border-bottom: 1rpx solid var(--divider-color);
}

.moment-avatar {
  margin-right: 24rpx;

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

.moment-content {
  flex: 1;
  min-width: 0;
}

.moment-username {
  font-size: 30rpx;
  font-weight: 500;
  color: var(--text-link);
  margin-bottom: 12rpx;
  display: block;
}

.moment-text {
  font-size: 30rpx;
  color: var(--text-primary);
  line-height: 1.6;
  margin-bottom: 16rpx;
}

.moment-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.moment-video {
  margin-bottom: 16rpx;

  .video-player {
    width: 100%;
    height: 400rpx;
    border-radius: 8rpx;
  }
}

.moment-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;

  .moment-time {
    font-size: 24rpx;
    color: var(--text-tertiary);
  }

  .moment-actions {
    .action-item {
      padding: 8rpx;
      color: var(--text-tertiary);
    }
  }
}

.moment-interactions {
  background: var(--bg-hover);
  border-radius: 8rpx;
  padding: 16rpx;

  .likes-row {
    display: flex;
    align-items: center;
    gap: 8rpx;
    font-size: 26rpx;
    color: var(--text-link);
    margin-bottom: 8rpx;

    .likes-text {
      flex: 1;
    }
  }

  .comment-row {
    font-size: 26rpx;
    color: var(--text-primary);
    line-height: 1.8;

    .comment-user {
      color: var(--text-link);
    }
  }
}

// 发布按钮
.fab {
  position: fixed;
  right: 30rpx;
  bottom: calc(180rpx + env(safe-area-inset-bottom));
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 20rpx rgba(7, 193, 96, 0.4);
  z-index: 99;
}

// 加载状态
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx;
  color: var(--text-tertiary);
  gap: 20rpx;
}
</style>
