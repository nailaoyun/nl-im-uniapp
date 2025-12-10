<template>
  <wd-config-provider :theme="isDark ? 'dark' : 'light'">
    <view class="moments-page" :class="{ dark: isDark }">
      <!-- 1. 沉浸式渐变导航栏 -->
      <!-- 使用动态背景色实现滚动渐变 -->
      <view class="nav-header" :style="{ background: `rgba(var(--bg-nav-rgb), ${navOpacity})`, borderBottom: navOpacity > 0.8 ? '1rpx solid var(--border-color)' : 'none' }">
        <view class="nav-content">
          <text class="nav-title" :style="{ opacity: navOpacity }">朋友圈</text>

          <!-- 保留原有的消息通知逻辑：铃铛图标 + 红点 -->
          <view class="nav-right">
            <wd-badge :value="unreadCount" :max="99" v-if="unreadCount > 0">
              <!-- 根据背景透明度自动切换图标颜色 -->
              <wd-icon name="bell" size="44rpx" :color="iconColor" @click="goNotifications" />
            </wd-badge>
            <wd-icon v-else name="bell" size="44rpx" :color="iconColor" @click="goNotifications" />
          </view>
        </view>
      </view>

      <!-- 2. 内容滚动区 -->
      <scroll-view
          scroll-y
          class="scroll-container"
          :refresher-enabled="true"
          :refresher-triggered="refreshing"
          @scroll="onPageScroll"
          @refresherrefresh="onRefresh"
          @scrolltolower="loadMore"
      >
        <!-- 封面图区域 -->
        <view class="cover-area">
          <image src="/static/images/moment-cover.jpg" mode="aspectFill" class="cover-img" />
          <view class="cover-gradient"></view>
          <view class="user-entry">
            <text class="username">{{ user?.name || '我' }}</text>
            <view class="avatar-box">
              <app-avatar :src="user?.avatar" :name="user?.name" :size="140" radius="20rpx" />
            </view>
          </view>
        </view>

        <!-- 列表内容 -->
        <view class="feed-list">
          <view v-if="loading && moments.length === 0" class="loading-state">
            <wd-loading />
            <text>加载中...</text>
          </view>

          <wd-status-tip v-else-if="moments.length === 0" tip="暂无动态" />

          <template v-else>
            <!-- 循环变量名恢复为 moment，匹配原有逻辑 -->
            <view v-for="moment in moments" :key="moment.id" class="feed-item">
              <!-- 头像 (移除原代码中不存在的点击事件) -->
              <view class="feed-avatar">
                <app-avatar :src="moment.user?.avatar" :name="moment.user?.name" :size="88" radius="12rpx" />
              </view>

              <view class="feed-content">
                <text class="nickname">{{ moment.user?.name || '未知' }}</text>

                <text v-if="moment.content" class="text-body">{{ moment.content }}</text>

                <!-- 图片九宫格 -->
                <view v-if="moment.media_type === 1" class="media-grid" :class="`grid-${getImageCount(moment)}`">
                  <view
                      v-for="(url, index) in parseMediaUrls(moment.media_urls)"
                      :key="index"
                      class="grid-img-wrap"
                      :style="{ width: getImageSize(moment), height: getImageSize(moment) }"
                  >
                    <wd-img
                        :src="resolveImageUrl(url)"
                        width="100%"
                        height="100%"
                        mode="aspectFill"
                        radius="8rpx"
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
                    <wd-icon name="more" size="32rpx" color="var(--color-primary)" />
                  </view>
                </view>

                <!-- 点赞评论区 -->
                <!-- 使用原有的判断逻辑 -->
                <view v-if="(moment.likes && moment.likes.length > 0) || (moment.comments && moment.comments.length > 0)" class="interaction-area">
                  <view class="triangle"></view>

                  <!-- 点赞列表 -->
                  <view v-if="moment.likes && moment.likes.length > 0" class="likes-list">
                    <wd-icon name="heart-fill" size="26rpx" color="var(--color-primary)" />
                    <text class="names">{{ moment.likes.map(l => l.user?.name || '').join('、') }}</text>
                  </view>

                  <!-- 分割线 -->
                  <view v-if="moment.likes?.length && moment.comments?.length" class="divider"></view>

                  <!-- 评论列表 (保留原有点击跳转逻辑，不新增回复方法) -->
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

            <!-- 加载更多 -->
            <wd-loadmore :state="loadState" @loadmore="loadMore" />
          </template>
        </view>
      </scroll-view>

      <!-- 悬浮发布按钮 -->
      <view class="fab-btn" @click="goPublish">
        <wd-icon name="camera" size="52rpx" color="#fff" />
      </view>

      <!-- 操作菜单 -->
      <wd-action-sheet
          v-model="showActions"
          :actions="actionItems"
          @select="onActionSelect"
      />

      <wd-toast />
      <wd-message-box />

      <!-- TabBar (保留) -->
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
import type { Moment } from '@/types/moment'

const authStore = useAuthStore()
const momentStore = useMomentStore()
const { isDark } = useTheme()
const toast = useToast()
const messageBox = useMessage()

// --- UI设计 状态 (新增) ---
const navOpacity = ref(0)
const iconColor = computed(() => {
  // 当导航栏变白时，图标变黑；否则为白色
  if (navOpacity.value > 0.6) return 'var(--text-main)'
  return '#ffffff'
})

// --- 原有状态保留 ---
const refreshing = ref(false)
const showActions = ref(false)
const currentMoment = ref<Moment | null>(null)
const loadState = ref<'loading' | 'finished' | 'error'>('loading')

// --- 原有计算属性保留 ---
const user = computed(() => authStore.user)
const moments = computed(() => momentStore.moments)
const loading = computed(() => momentStore.loading)
const unreadCount = computed(() => momentStore.unreadCount)

// --- 原有菜单逻辑保留 ---
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

// --- 生命周期 ---
onMounted(() => {
  loadData()
})

onShow(() => {
  loadUnreadCount()
})

// --- 新增滚动监听 (UI逻辑) ---
function onPageScroll(e: any) {
  const scrollTop = e.detail.scrollTop
  // 滚动 200px 后导航栏完全不透明
  navOpacity.value = Math.min(scrollTop / 200, 1)
}

// --- 原有方法保留 ---
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

// --- 原有辅助函数保留 ---
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
.moments-page {
  /* 定义 CSS 变量以便暗黑模式切换 */
  --bg-page: #ffffff;
  --bg-nav-rgb: 255, 255, 255;
  --bg-detail: #f7f7f7;
  --text-main: #1d1d1f;
  --text-blue: #576b95;
  --color-primary: #576b95;
  --border-color: rgba(0,0,0,0.05);

  height: 100vh;
  background: var(--bg-page);
  position: relative;
}

.moments-page.dark {
  /* 调整深色模式颜色：
    使用 #1c1c1e (iOS 深色背景) 替代纯黑 #000000
    提升质感，减少 OLED 拖影
  */
  --bg-page: #1c1c1e;
  --bg-nav-rgb: 28, 28, 30; /* 对应 #1c1c1e 的 RGB 值 */
  --bg-detail: #2c2c2e;    /* 稍微亮一点的二级背景，用于评论区 */
  --text-main: #f2f2f7;    /* 柔和的白色文字 */
  --text-blue: #7e95c5;
  --border-color: rgba(255,255,255,0.1);
}

/* 1. 沉浸式 Header */
.nav-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: calc(44px + var(--status-bar-height));
  z-index: 100;
  display: flex;
  align-items: flex-end; /* 内容底部对齐 */
  padding-bottom: 20rpx;
  justify-content: center;
  transition: background 0.3s;
}

.nav-content {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 30rpx;
}

.nav-title {
  font-weight: 600;
  font-size: 34rpx;
  color: var(--text-main);
}

.nav-right {
  position: absolute;
  right: 30rpx;
  display: flex;
  align-items: center;
}

.scroll-container {
  height: 100%;
}

/* 2. 封面区域 */
.cover-area {
  position: relative;
  height: 600rpx;
  margin-bottom: 80rpx; /* 留出空间给头像 */

  .cover-img { width: 100%; height: 100%; }

  /* 底部渐变遮罩，保证文字清晰 */
  .cover-gradient {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 160rpx;
    background: linear-gradient(to top, var(--bg-page), transparent);
  }

  .user-entry {
    position: absolute;
    bottom: -40rpx;
    right: 30rpx;
    display: flex;
    align-items: flex-start;
    gap: 24rpx;

    .username {
      font-weight: 600;
      color: #fff;
      text-shadow: 0 2rpx 4rpx rgba(0,0,0,0.5);
      font-size: 36rpx;
      margin-top: 20rpx;
    }

    .avatar-box {
      border: 6rpx solid var(--bg-page);
      border-radius: 24rpx;
      background: var(--bg-page);
      box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
    }
  }
}

/* 3. 动态列表 */
.feed-list {
  padding: 0 30rpx;
}

.feed-item {
  display: flex;
  gap: 20rpx;
  margin-bottom: 60rpx;
  border-bottom: 1rpx solid var(--border-color);
  padding-bottom: 30rpx;

  &:last-child { border-bottom: none; }
}

.feed-avatar {
  flex-shrink: 0;
}

.feed-content {
  flex: 1;
  min-width: 0; /* 防止文本溢出 */

  .nickname {
    color: var(--text-blue);
    font-weight: 600;
    font-size: 32rpx;
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

.media-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 16rpx;

  .grid-img-wrap {
    overflow: hidden;
    border-radius: 8rpx;
  }
}

.video-wrap {
  margin-bottom: 16rpx;
  .video-player {
    width: 400rpx;
    height: 300rpx;
    border-radius: 8rpx;
  }
}

.feed-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10rpx;

  .time { font-size: 24rpx; color: #999; }

  .action-btn {
    background: var(--bg-detail);
    padding: 6rpx 16rpx;
    border-radius: 8rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    &:active { opacity: 0.6; }
  }
}

/* 4. 交互区 (点赞评论) */
.interaction-area {
  margin-top: 20rpx;
  background: var(--bg-detail);
  border-radius: 8rpx;
  padding: 16rpx 20rpx;
  position: relative;

  .triangle {
    position: absolute;
    top: -12rpx;
    left: 20rpx;
    width: 0; height: 0;
    border-left: 12rpx solid transparent;
    border-right: 12rpx solid transparent;
    border-bottom: 12rpx solid var(--bg-detail);
  }

  .likes-list {
    display: flex;
    align-items: flex-start;
    gap: 10rpx;
    font-size: 28rpx;
    color: var(--text-blue);
    font-weight: 500;
    line-height: 1.5;
  }

  .divider { height: 1rpx; background: rgba(0,0,0,0.05); margin: 12rpx 0; }

  .comment-row {
    font-size: 28rpx;
    color: var(--text-main);
    margin-bottom: 8rpx;
    line-height: 1.5;

    &:last-child { margin-bottom: 0; }
    .user-link { color: var(--text-blue); font-weight: 500; }
  }
}

/* 5. 悬浮按钮 */
.fab-btn {
  position: fixed;
  bottom: calc(150rpx + env(safe-area-inset-bottom));
  right: 40rpx;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: #07c160;
  box-shadow: 0 10rpx 30rpx rgba(7, 193, 96, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99;
  transition: transform 0.2s;

  &:active { transform: scale(0.95); }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx;
  color: #999;
  gap: 20rpx;
}
</style>
