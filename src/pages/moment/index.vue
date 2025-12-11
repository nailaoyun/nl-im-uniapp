<template>
  <wd-config-provider :theme="isDark ? 'dark' : 'light'">
    <view class="moments-page" :class="{ dark: isDark }">
      <!-- 1. 沉浸式渐变导航栏 -->
      <view class="nav-header" :style="{ background: `rgba(var(--bg-nav-rgb), ${navOpacity})`, borderBottom: navOpacity > 0.8 ? '1rpx solid var(--border-color)' : 'none' }">
        <view class="nav-content">
          <text class="nav-title" :style="{ opacity: navOpacity }">发现</text>

          <view class="nav-right">
            <view class="nav-icon-btn" @click="goNotifications">
              <svg class="icon" :style="{ color: iconColor }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <view v-if="unreadCount > 0" class="badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</view>
            </view>
          </view>
        </view>
      </view>

      <!-- 2. 内容滚动区 -->
      <scroll-view
          scroll-y
          class="scroll-container custom-scrollbar"
          :refresher-enabled="true"
          :refresher-triggered="refreshing"
          @scroll="onPageScroll"
          @refresherrefresh="onRefresh"
          @scrolltolower="loadMore"
      >
        <!-- 封面图区域 -->
        <view class="cover-area">
          <image src="https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&q=80" mode="aspectFill" class="cover-img" />
          <view class="cover-gradient"></view>
          <view class="user-entry">
            <text class="username">{{ user?.name || '我' }}</text>
            <view class="avatar-box">
              <app-avatar :src="user?.avatar" :name="user?.name" :size="160" radius="24rpx" />
            </view>
          </view>
        </view>

        <!-- 列表内容 -->
        <view class="feed-list">
          <view v-if="loading && moments.length === 0" class="loading-state">
            <wd-loading :color="isDark ? '#f97316' : '#4F46E5'" />
            <text>加载中...</text>
          </view>

          <view v-else-if="moments.length === 0" class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
            <text class="empty-text">暂无动态，快去发布吧</text>
          </view>

          <template v-else>
            <view v-for="(moment, index) in moments" :key="moment.id" class="feed-item animate-fade-in-up" :style="{ animationDelay: `${index * 50}ms` }">
              <view class="feed-avatar">
                <app-avatar :src="moment.user?.avatar" :name="moment.user?.name" :size="84" radius="24rpx" />
              </view>

              <view class="feed-content">
                <text class="nickname">{{ moment.user?.name || '未知' }}</text>

                <text v-if="moment.content" class="text-body">{{ moment.content }}</text>

                <!-- 图片九宫格 -->
                <view v-if="moment.media_type === 1" class="media-grid" :class="`grid-${getImageCount(moment)}`">
                  <view
                      v-for="(url, imgIndex) in parseMediaUrls(moment.media_urls)"
                      :key="imgIndex"
                      class="grid-img-wrap"
                      :style="{ width: getImageSize(moment), height: getImageSize(moment) }"
                  >
                    <wd-img
                        :src="resolveImageUrl(url)"
                        width="100%"
                        height="100%"
                        mode="aspectFill"
                        radius="12rpx"
                        enable-preview
                        :preview-src-list="parseMediaUrls(moment.media_urls).map(resolveImageUrl)"
                    />
                  </view>
                </view>

                <!-- 视频 -->
                <view v-if="moment.media_type === 2" class="video-wrap">
                  <video
                      :src="resolveImageUrl(parseMediaUrls(moment.media_urls)[0])"
                      class="video-player"
                      object-fit="cover"
                      :show-fullscreen-btn="true"
                      :show-play-btn="true"
                  />
                </view>

                <!-- 底部操作栏 -->
                <view class="feed-footer">
                  <text class="time">{{ formatTime(moment.created_at) }}</text>
                  <view class="action-btn" @click="showActionMenu(moment)">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                    </svg>
                  </view>
                </view>

                <!-- 点赞评论区 -->
                <view v-if="(moment.likes && moment.likes.length > 0) || (moment.comments && moment.comments.length > 0)" class="interaction-area">
                  <view class="triangle"></view>

                  <!-- 点赞列表 -->
                  <view v-if="moment.likes && moment.likes.length > 0" class="likes-list">
                    <svg class="heart-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <text class="names">{{ moment.likes.map(l => l.user?.name || '').join('、') }}</text>
                  </view>

                  <view v-if="moment.likes?.length && moment.comments?.length" class="divider"></view>

                  <!-- 评论列表 -->
                  <view v-if="moment.comments?.length" class="comments-list">
                    <view
                        v-for="comment in moment.comments"
                        :key="comment.id"
                        class="comment-row"
                        @click="goComment"
                    >
                      <text class="user-link">{{ comment.user?.name || '未知' }}</text>
                      <text v-if="comment.reply_to_user"> 回复 <text class="user-link">{{ comment.reply_to_user.name }}</text></text>
                      <text class="content">: {{ comment.content }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>

            <wd-loadmore :state="loadState" @loadmore="loadMore" />
          </template>
        </view>
      </scroll-view>

      <!-- 悬浮发布按钮 -->
      <view class="fab-btn" @click="goPublish">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </view>

      <!-- 操作菜单 -->
      <wd-action-sheet
          v-model="showActions"
          :actions="actionItems"
          @select="onActionSelect"
          cancel-text="取消"
      />

      <wd-toast />
      <wd-message-box />

      <app-tab-bar current="moments" />
    </view>
  </wd-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAuthStore, useMomentStore } from '@/stores'
import { useTheme } from '@/composables/useTheme'
import { formatTime, generateColor } from '@/utils/format'
import { resolveImageUrl } from '@/utils/image'
import { parseMediaUrls } from '@/types/moment'
import { useToast, useMessage } from 'wot-design-uni'
import AppTabBar from '@/components/common/AppTabBar.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import type { Moment } from '@/types/moment'

const authStore = useAuthStore()
const momentStore = useMomentStore()
const { isDark } = useTheme()
const toast = useToast()
const messageBox = useMessage()

// UI 状态
const navOpacity = ref(0)
const iconColor = computed(() => {
  if (navOpacity.value > 0.6) return 'var(--text-main)'
  return '#ffffff'
})

// 原有状态保留
const refreshing = ref(false)
const showActions = ref(false)
const currentMoment = ref<Moment | null>(null)
const loadState = ref<'loading' | 'finished' | 'error'>('loading')

// 原有计算属性保留
const user = computed(() => authStore.user)
const moments = computed(() => momentStore.moments)
const loading = computed(() => momentStore.loading)
const unreadCount = computed(() => momentStore.unreadCount)

// 原有菜单逻辑保留
const actionItems = computed(() => {
  const items = []
  if (currentMoment.value) {
    items.push({
      name: currentMoment.value.is_liked ? '取消赞' : '赞',
      value: 'like'
    })
    items.push({ name: '评论', value: 'comment' })
    if (currentMoment.value.user_id === user.value?.id) {
      items.push({ name: '删除', value: 'delete', color: '#ef4444' })
    }
  }
  return items
})

// 生命周期
onMounted(() => { loadData() })
onShow(() => { loadUnreadCount() })

// 滚动监听
function onPageScroll(e: any) {
  const scrollTop = e.detail.scrollTop
  navOpacity.value = Math.min(scrollTop / 200, 1)
}

// 原有方法保留
async function loadData() {
  try {
    await momentStore.fetchMoments()
    loadState.value = momentStore.pagination.hasMore ? 'loading' : 'finished'
  } catch {
    loadState.value = 'error'
  }
}

async function loadUnreadCount() {
  try { await momentStore.fetchUnreadCount() } catch {}
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

function goNotifications() { uni.navigateTo({ url: '/pages/moment/notify' }) }
function goPublish() { uni.navigateTo({ url: '/pages/moment/publish' }) }
function showActionMenu(moment: Moment) { currentMoment.value = moment; showActions.value = true }

async function onActionSelect(item: { value: string }) {
  if (!currentMoment.value) return
  switch (item.value) {
    case 'like': await toggleLike(); break
    case 'comment': goComment(); break
    case 'delete': await deleteMoment(); break
  }
  showActions.value = false
}

async function toggleLike() {
  if (!currentMoment.value) return
  try { await momentStore.toggleLike(currentMoment.value.id) } catch { toast.error('操作失败') }
}

function goComment() {
  if (!currentMoment.value) return
  uni.navigateTo({ url: `/pages/moment/detail?id=${currentMoment.value.id}` })
}

async function deleteMoment() {
  if (!currentMoment.value) return
  try {
    await messageBox.confirm({ title: '提示', msg: '确定要删除这条动态吗？' })
    await momentStore.deleteMoment(currentMoment.value.id)
    toast.success('已删除')
  } catch {}
}

function getImageCount(moment: Moment): number {
  const urls = parseMediaUrls(moment.media_urls)
  return Math.min(urls.length, 9)
}

function getImageSize(moment: Moment): string {
  const count = getImageCount(moment)
  if (count === 1) return '400rpx'
  if (count === 4) return '200rpx'
  return '180rpx'
}
</script>

<style lang="scss" scoped>
// 页面容器 - 浅色模式 (与设计稿完全一致)
.moments-page {
  --bg-page: #ffffff;                    // 页面背景
  --bg-nav-rgb: 255, 255, 255;           // 导航栏背景 RGB
  --bg-detail: #f3f4f6;                  // gray-100 (评论区背景)
  --text-main: #1f2937;                  // gray-900 (动态内容)
  --text-secondary: #9ca3af;             // gray-400 (时间)
  --text-blue: #576b95;                  // 链接色 (作者名、点赞、评论)
  --color-brand: #4F46E5;                // indigo-600
  --border-color: #f3f4f6;               // gray-100

  height: 100vh;
  background: var(--bg-page);
  position: relative;
}

// 深色模式 - Warm Stone (与设计稿完全一致)
.moments-page.dark {
  --bg-page: #1c1917;                    // warm-900
  --bg-nav-rgb: 28, 25, 23;              // warm-900 RGB
  --bg-detail: rgba(41, 37, 36, 0.6);    // warm-800/60 (评论区背景)
  --text-main: #f5f5f4;                  // warm-100 (动态内容)
  --text-secondary: #78716c;             // warm-500 (时间)
  --text-blue: #7e95c5;                  // blue-400 (链接色)
  --color-brand: #f97316;                // orange-500
  --border-color: #44403c;               // warm-700
}

// 动画
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out forwards;
  opacity: 0;
}

.custom-scrollbar {
  &::-webkit-scrollbar { display: none; }
  -ms-overflow-style: none;
  scrollbar-width: none;
}

// 沉浸式 Header
.nav-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: calc(88rpx + var(--status-bar-height));
  z-index: 100;
  display: flex;
  align-items: flex-end;
  padding-bottom: 16rpx;
  justify-content: center;
  transition: background 0.3s;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.nav-content {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 32rpx;
}

.nav-title {
  font-weight: 700;
  font-size: 34rpx;
  color: var(--text-main);
}

.nav-right {
  position: absolute;
  right: 32rpx;
  display: flex;
  align-items: center;
}

.nav-icon-btn {
  position: relative;
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.15s;

  &:active {
    background: rgba(0, 0, 0, 0.05);
  }

  .icon {
    width: 44rpx;
    height: 44rpx;
  }

  .badge {
    position: absolute;
    top: 4rpx;
    right: 4rpx;
    min-width: 32rpx;
    height: 32rpx;
    padding: 0 8rpx;
    background: #ef4444;
    color: #fff;
    font-size: 20rpx;
    font-weight: 600;
    line-height: 32rpx;
    text-align: center;
    border-radius: 32rpx;
    box-sizing: border-box;
  }
}

.scroll-container {
  height: 100%;
}

// 封面区域
.cover-area {
  position: relative;
  height: 680rpx;
  margin-bottom: 100rpx;

  .cover-img {
    width: 100%;
    height: 100%;
  }

  .cover-gradient {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 200rpx;
    background: linear-gradient(to top, var(--bg-page), transparent);
  }

  .user-entry {
    position: absolute;
    bottom: -60rpx;
    right: 32rpx;
    display: flex;
    align-items: flex-end;
    gap: 20rpx;

    .username {
      font-weight: 700;
      color: #fff;
      text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.5);
      font-size: 36rpx;
      margin-bottom: 20rpx;
    }

    .avatar-box {
      border: 8rpx solid var(--bg-page);
      border-radius: 28rpx;
      background: var(--bg-page);
      box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
    }
  }
}

// 动态列表
.feed-list {
  padding: 0 32rpx;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx;
  color: var(--text-blue);
  gap: 24rpx;
}

.empty-icon {
  width: 100rpx;
  height: 100rpx;
  opacity: 0.4;
}

.empty-text {
  font-size: 28rpx;
}

.feed-item {
  display: flex;
  gap: 20rpx;
  margin-bottom: 48rpx;
  padding-bottom: 32rpx;
  border-bottom: 1rpx solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }
}

.feed-avatar {
  flex-shrink: 0;
}

.feed-content {
  flex: 1;
  min-width: 0;

  .nickname {
    color: var(--text-blue);
    font-weight: 600;
    font-size: 30rpx;
    margin-bottom: 12rpx;
    display: block;
  }

  .text-body {
    font-size: 30rpx;
    color: var(--text-main);
    line-height: 1.6;
    margin-bottom: 16rpx;
    display: block;
    word-break: break-all;
  }
}

// 图片九宫格
.media-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 16rpx;

  .grid-img-wrap {
    overflow: hidden;
    border-radius: 12rpx;
  }
}

.video-wrap {
  margin-bottom: 16rpx;

  .video-player {
    width: 400rpx;
    height: 300rpx;
    border-radius: 12rpx;
  }
}

// 底部操作栏
.feed-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12rpx;

  .time {
    font-size: 24rpx;
    color: var(--text-secondary);
  }

  .action-btn {
    width: 60rpx;
    height: 44rpx;
    background: var(--bg-detail);
    border-radius: 8rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-blue);
    transition: all 0.15s;

    svg {
      width: 32rpx;
      height: 32rpx;
    }

    &:active {
      opacity: 0.6;
    }
  }
}

// 交互区 (点赞评论)
.interaction-area {
  margin-top: 16rpx;
  background: var(--bg-detail);
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  position: relative;

  .triangle {
    position: absolute;
    top: -12rpx;
    left: 24rpx;
    width: 0;
    height: 0;
    border-left: 12rpx solid transparent;
    border-right: 12rpx solid transparent;
    border-bottom: 12rpx solid #f3f4f6; // gray-100
    
    .dark & {
      border-bottom-color: #292524; // 设计稿: warm-800
    }
  }

  .likes-list {
    display: flex;
    align-items: flex-start;
    gap: 10rpx;
    font-size: 28rpx;
    color: var(--text-blue);
    font-weight: 500;
    line-height: 1.5;

    .heart-icon {
      width: 28rpx;
      height: 28rpx;
      flex-shrink: 0;
      margin-top: 4rpx;
    }
  }

  .divider {
    height: 1rpx;
    background: rgba(0, 0, 0, 0.05);
    margin: 12rpx 0;

    .dark & {
      background: rgba(255, 255, 255, 0.05);
    }
  }

  .comment-row {
    font-size: 28rpx;
    color: var(--text-main);
    margin-bottom: 8rpx;
    line-height: 1.5;

    &:last-child {
      margin-bottom: 0;
    }

    .user-link {
      color: var(--text-blue);
      font-weight: 500;
    }
  }
}

// 悬浮发布按钮
.fab-btn {
  position: fixed;
  bottom: calc(180rpx + env(safe-area-inset-bottom));
  right: 40rpx;
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 10rpx 30rpx rgba(16, 185, 129, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99;
  transition: transform 0.2s;

  svg {
    width: 52rpx;
    height: 52rpx;
  }

  &:active {
    transform: scale(0.95);
  }
}
</style>
