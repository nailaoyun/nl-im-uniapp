<template>
  <wd-config-provider :theme="isDark ? 'dark' : 'light'">
    <!-- 根容器：绑定暗黑模式类名 -->
    <view class="add-friend-page" :class="{ dark: isDark }">

      <!-- ================= 顶部背景区域 (Header Background) ================= -->
      <view class="header-bg-container">
        <!-- 1. 背景渐变：日间蓝紫 vs 夜间暖橙 -->
        <view class="bg-gradient"></view>
        <!-- 2. 梦幻光影 Blobs -->
        <view class="blob blob-1"></view>
        <view class="blob blob-2"></view>
        <!-- 3. 装饰线条 -->
        <view class="decoration-ring"></view>
      </view>

      <!-- ================= 顶部内容层 (Foreground) ================= -->
      <view class="header-content">
        <!-- 导航栏 -->
        <view class="nav-bar">
          <view class="nav-btn" @click="goBack">
            <!-- #ifdef H5 -->
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-7 h-7">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <!-- #endif -->
            <!-- #ifdef MP-WEIXIN -->
            <wd-icon name="arrow-left" size="44rpx" color="#fff" />
            <!-- #endif -->
          </view>
          <text class="nav-title">添加好友</text>
          <view class="nav-btn">
            <!-- #ifdef H5 -->
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
            <!-- #endif -->
            <!-- #ifdef MP-WEIXIN -->
            <wd-icon name="more" size="44rpx" color="#fff" />
            <!-- #endif -->
          </view>
        </view>

        <!-- 大标题 -->
        <view class="hero-section">
          <text class="hero-title">发现新朋友</text>
          <text class="hero-subtitle">EXPANDING YOUR CIRCLE</text>
        </view>

        <!-- 搜索框 -->
        <view class="search-wrapper">
          <view class="search-box" @click="focusSearch">
            <view class="search-icon-wrapper">
              <!-- #ifdef H5 -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <!-- #endif -->
              <!-- #ifdef MP-WEIXIN -->
              <wd-icon name="search" size="40rpx" />
              <!-- #endif -->
            </view>
            <input
                ref="searchInput"
                v-model="searchKeyword"
                class="search-input"
                type="text"
                placeholder="请输入账号/手机号"
                placeholder-class="placeholder-style"
                @input="onSearchInput"
                @confirm="doSearch"
            />
            <view v-if="searchKeyword" class="clear-btn" @click.stop="clearSearch">
              <!-- #ifdef H5 -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              <!-- #endif -->
              <!-- #ifdef MP-WEIXIN -->
              <wd-icon name="close" size="32rpx" />
              <!-- #endif -->
            </view>
          </view>
        </view>
      </view>

      <!-- ================= 内容滚动区域 ================= -->
      <scroll-view class="content-area custom-scrollbar" scroll-y enable-back-to-top>

        <!-- 初始状态 -->
        <template v-if="viewState === 'initial'">
          <!-- 扫一扫卡片 -->
          <view class="scan-card animate-fade-in-up" @click="handleScan">
            <view class="scan-icon-box">
              <!-- #ifdef H5 -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-white">
                <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
                <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
                <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
                <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
              </svg>
              <!-- #endif -->
              <!-- #ifdef MP-WEIXIN -->
              <wd-icon name="scan" size="48rpx" color="#fff" />
              <!-- #endif -->
            </view>
            <view class="scan-info">
              <text class="scan-title">扫一扫</text>
              <text class="scan-desc">扫描二维码名片</text>
            </view>
            <view class="scan-arrow">
              <!-- #ifdef H5 -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-white">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              <!-- #endif -->
              <!-- #ifdef MP-WEIXIN -->
              <wd-icon name="arrow-right" size="40rpx" color="#fff" />
              <!-- #endif -->
            </view>
          </view>

          <!-- 推荐列表 -->
          <view class="list-section">
            <text class="list-title">为您推荐</text>
            <view class="user-list">
              <view
                  v-for="(user, index) in recommendUsers"
                  :key="user.id"
                  class="user-card animate-fade-in-up"
                  :style="{ animationDelay: `${index * 50}ms` }"
              >
                <!-- 头像容器 -->
                <view class="avatar-wrapper">
                  <app-avatar :src="user.avatar" :name="user.name" :size="96" radius="50%" />
                </view>

                <view class="user-info">
                  <text class="user-name">{{ user.name }}</text>
                  <text class="user-id">ID: {{ user.id }}</text>
                </view>

                <view
                    class="action-btn"
                    :class="{ 'btn-added': addedIds.includes(user.id), 'btn-add': !addedIds.includes(user.id) }"
                    @click="handleAdd(user)"
                >
                  <text>{{ addedIds.includes(user.id) ? '已发送' : '添加' }}</text>
                </view>
              </view>
            </view>
          </view>
        </template>

        <!-- 加载状态 -->
        <template v-else-if="viewState === 'loading'">
          <view class="state-card animate-fade-in-up">
            <view class="loading-spinner"></view>
            <text class="state-text">正在搜索...</text>
          </view>
        </template>

        <!-- 空结果状态 -->
        <template v-else-if="viewState === 'empty'">
          <view class="state-card animate-fade-in-up">
            <view class="empty-icon-box">
              <!-- #ifdef H5 -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <!-- #endif -->
              <!-- #ifdef MP-WEIXIN -->
              <wd-icon name="search" size="48rpx" />
              <!-- #endif -->
            </view>
            <text class="state-text">未找到该用户</text>
          </view>
        </template>

        <!-- 搜索结果 -->
        <template v-else-if="viewState === 'results'">
          <view class="list-section animate-fade-in-up">
            <text class="list-title">搜索结果</text>
            <view class="user-list">
              <view
                  v-for="(user, index) in searchResults"
                  :key="user.id"
                  class="user-card animate-fade-in-up"
                  :style="{ animationDelay: `${(index + 1) * 50}ms` }"
                  @click="goUserDetail(user)"
              >
                <view class="avatar-wrapper">
                  <app-avatar :src="user.avatar" :name="user.name" :size="96" radius="50%" />
                </view>
                <view class="user-info">
                  <text class="user-name">{{ user.name }}</text>
                  <text class="user-id">ID: {{ user.id }}</text>
                </view>
                <view
                    class="action-btn"
                    :class="{ 'btn-added': addedIds.includes(user.id), 'btn-add': !addedIds.includes(user.id) }"
                    @click.stop="handleAdd(user)"
                >
                  <text>{{ addedIds.includes(user.id) ? '已发送' : '添加' }}</text>
                </view>
              </view>
            </view>
          </view>
        </template>

        <view class="safe-area-spacer"></view>
      </scroll-view>

      <wd-toast />
    </view>
  </wd-config-provider>
</template>

<script setup lang="ts">
/**
 * 逻辑部分完全保留，仅修正样式相关的逻辑或引用
 */
import { ref, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useToast } from 'wot-design-uni'
import * as contactApi from '@/api/modules/contact'
import AppAvatar from '@/components/common/AppAvatar.vue'
import type { User } from '@/types/api'

const { isDark } = useTheme()
const toast = useToast()

const searchKeyword = ref('')
const viewState = ref<'initial' | 'loading' | 'empty' | 'results'>('initial')
const addedIds = ref<string[]>([])
const recommendUsers = ref<User[]>([])
const searchResults = ref<User[]>([])
let searchTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  loadRecommendUsers()
})

async function loadRecommendUsers() {
  try {
    // 加载推荐用户，这里可以调用实际的API
    const users = await contactApi.searchUsers('')
    recommendUsers.value = users.slice(0, 6)
  } catch (e) {
    console.error('加载推荐用户失败:', e)
  }
}

function goBack() {
  uni.navigateBack()
}

function focusSearch() {
  // Focus is handled by clicking
}

function onSearchInput() {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  if (searchKeyword.value.trim()) {
    viewState.value = 'loading'
    searchTimer = setTimeout(() => {
      doSearch()
    }, 800)
  } else {
    viewState.value = 'initial'
  }
}

async function doSearch() {
  if (!searchKeyword.value.trim()) {
    viewState.value = 'initial'
    return
  }

  try {
    const results = await contactApi.searchUsers(searchKeyword.value.trim())
    searchResults.value = results
    viewState.value = results.length > 0 ? 'results' : 'empty'
  } catch (e) {
    console.error('搜索失败:', e)
    viewState.value = 'empty'
  }
}

function clearSearch() {
  searchKeyword.value = ''
  viewState.value = 'initial'
}

function handleScan() {
  uni.scanCode({
    success: (res) => {
      toast.success('扫码成功')
      // 处理扫码结果
      if (res.result) {
        searchKeyword.value = res.result
        doSearch()
      }
    },
    fail: () => {
      toast.error('扫码失败')
    }
  })
}

async function handleAdd(user: User) {
  if (addedIds.value.includes(user.id)) return

  try {
    await contactApi.sendFriendRequest(user.id, '我想加你为好友')
    addedIds.value.push(user.id)
    toast.success('已发送好友请求')
  } catch (e: any) {
    toast.error(e.message || '发送失败')
  }
}

function goUserDetail(user: User) {
  uni.navigateTo({ url: `/pages/contact/detail?userId=${user.id}` })
}
</script>

<style lang="scss" scoped>
/* * UI 设计移植 - Warm Stone Theme
 * 将 Tailwind 样式迁移为 SCSS 变量系统
 */

.add-friend-page {
  /* --- Light Theme (Default) --- */
  --bg-page: #f2f2f2;
  --bg-card: #ffffff;

  /* Header Gradients */
  --gradient-from: #4b6cb7;
  --gradient-to: #8E9EFE;

  /* Blobs */
  --blob-1-bg: #3B4FA8;
  --blob-2-bg: #82E1FF;

  /* Text */
  --text-main: #1f2937;
  --text-sub: #9ca3af;
  --text-header: #ffffff;
  --text-header-sub: rgba(239, 246, 255, 0.8); /* blue-50 opacity */

  /* Search Box */
  --search-bg: #ffffff;
  --search-border: #f9fafb;
  --search-text: #374151;
  --search-placeholder: #9ca3af;
  --search-shadow: rgba(30, 58, 138, 0.1);

  /* Scan Card */
  --scan-bg-from: #5B7FFF;
  --scan-bg-to: #8C9EFF;
  --scan-shadow: rgba(59, 130, 246, 0.2);
  --scan-icon-bg: rgba(255, 255, 255, 0.2);

  /* Buttons */
  --btn-add-from: #5B7FFF;
  --btn-add-to: #748EFF;
  --btn-add-shadow: rgba(59, 130, 246, 0.3);
  --btn-disabled-bg: #f3f4f6;
  --btn-disabled-text: #9ca3af;

  /* Loading */
  --loading-spinner: #5B7FFF;

  min-height: 100vh;
  background: var(--bg-page);
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* --- Dark Mode (Warm Stone) --- */
.add-friend-page.dark {
  --bg-page: #1c1917; /* warm-900 */
  --bg-card: #292524; /* warm-800 */

  /* Header Gradients - Warm Ember */
  --gradient-from: #7c2d12;
  --gradient-to: #b45309;

  /* Blobs */
  --blob-1-bg: #451a03;
  --blob-2-bg: #fdba74;

  /* Text */
  --text-main: #e7e5e4; /* warm-200 */
  --text-sub: #a8a29e;  /* warm-400 */
  --text-header: #ffffff;
  --text-header-sub: #ffedd5; /* orange-100 */

  /* Search Box */
  --search-bg: #292524; /* warm-800 */
  --search-border: #44403c; /* warm-700 */
  --search-text: #e7e5e4;
  --search-placeholder: #78716c; /* warm-500 */
  --search-shadow: rgba(0, 0, 0, 0.2);

  /* Scan Card */
  --scan-bg-from: #ea580c;
  --scan-bg-to: #f97316;
  --scan-shadow: rgba(124, 45, 18, 0.3);
  --scan-icon-bg: rgba(0, 0, 0, 0.2);

  /* Buttons */
  --btn-add-from: #c2410c;
  --btn-add-to: #ea580c;
  --btn-add-shadow: rgba(124, 45, 18, 0.4);
  --btn-disabled-bg: #44403c; /* warm-700 */
  --btn-disabled-text: #a8a29e; /* warm-400 */

  /* Loading */
  --loading-spinner: #f97316;
}

/* Common Utilities */
.w-4 { width: 32rpx; }
.h-4 { height: 32rpx; }
.w-5 { width: 40rpx; }
.h-5 { height: 40rpx; }
.w-6 { width: 48rpx; }
.h-6 { height: 48rpx; }
.w-7 { width: 56rpx; }
.h-7 { height: 56rpx; }

/* 1. Header Background & Blobs */
.header-bg-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 720rpx;
  border-bottom-left-radius: 120rpx;
  border-bottom-right-radius: 560rpx;
  overflow: hidden;
  z-index: 0;
  transition: all 0.5s ease;

  .bg-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--gradient-from) 0%, var(--gradient-to) 100%);
    opacity: 0.95;
    transition: background 0.5s ease;
  }

  .blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(140rpx);
    transition: all 0.5s ease;
  }

  .blob-1 {
    top: -100rpx;
    left: -100rpx;
    width: 700rpx;
    height: 700rpx;
    background: var(--blob-1-bg);
    opacity: 0.8;
    mix-blend-mode: multiply;
  }

  .blob-2 {
    top: 40rpx;
    right: -120rpx;
    width: 600rpx;
    height: 600rpx;
    background: var(--blob-2-bg);
    opacity: 0.4;
    mix-blend-mode: overlay;
  }

  .decoration-ring {
    position: absolute;
    top: 40rpx;
    right: -40rpx;
    width: 300rpx;
    height: 300rpx;
    border: 2rpx solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
  }
}

/* 2. Header Content */
.header-content {
  position: relative;
  z-index: 10;
  padding-top: var(--status-bar-height);
  padding-bottom: 40rpx;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;

  .nav-btn {
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: #fff;

    &:active {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .nav-title {
    font-size: 36rpx;
    font-weight: 700;
    color: var(--text-header);
    letter-spacing: 2rpx;
  }
}

.hero-section {
  padding: 40rpx 48rpx 40rpx;

  .hero-title {
    font-size: 72rpx;
    font-weight: 900;
    font-style: italic;
    color: var(--text-header);
    display: block;
    text-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.2);
    letter-spacing: 2rpx;
    margin-bottom: 8rpx;
  }

  .hero-subtitle {
    font-size: 24rpx;
    font-weight: 700;
    color: var(--text-header-sub);
    letter-spacing: 6rpx;
    text-transform: uppercase;
    display: block;
  }
}

/* 3. Search Box */
.search-wrapper {
  padding: 0 48rpx 20rpx;
}

.search-box {
  display: flex;
  align-items: center;
  height: 100rpx;
  background: var(--search-bg);
  border: 2rpx solid var(--search-border);
  border-radius: 50rpx;
  padding: 0 20rpx;
  box-shadow: 0 20rpx 50rpx var(--search-shadow);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.99);
  }

  .search-icon-wrapper {
    width: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--search-placeholder);
  }

  .search-input {
    flex: 1;
    height: 100%;
    font-size: 32rpx;
    font-weight: 500;
    color: var(--search-text);
    background: transparent;
    border: none;
  }

  .placeholder-style {
    color: var(--search-placeholder);
  }

  .clear-btn {
    width: 60rpx;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--search-placeholder);
  }
}

/* 4. Scroll Content Area */
.content-area {
  position: relative;
  z-index: 5;
  /* 调整 margin-top 以向上覆盖 header */
  margin-top: -30rpx;
  height: calc(100vh - 600rpx); /* 根据实际 Header 高度调整 */
  padding: 20rpx 32rpx 0;
  box-sizing: border-box;
}

.custom-scrollbar {
  &::-webkit-scrollbar { display: none; }
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Scan Card */
.scan-card {
  display: flex;
  align-items: center;
  padding: 0 48rpx;
  height: 200rpx;
  border-radius: 56rpx;
  margin-bottom: 48rpx;
  background: linear-gradient(90deg, var(--scan-bg-from), var(--scan-bg-to));
  box-shadow: 0 20rpx 40rpx var(--scan-shadow);
  border: 2rpx solid rgba(255,255,255,0.1);
  transition: all 0.15s;

  &:active {
    transform: scale(0.98);
  }

  .scan-icon-box {
    width: 96rpx;
    height: 96rpx;
    border-radius: 32rpx;
    background: var(--scan-icon-bg);
    border: 2rpx solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 32rpx;
  }

  .scan-info {
    flex: 1;

    .scan-title {
      font-size: 36rpx;
      font-weight: 700;
      color: #fff;
      display: block;
      letter-spacing: 1rpx;
    }

    .scan-desc {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 4rpx;
      font-weight: 500;
      display: block;
    }
  }

  .scan-arrow {
    transform: rotate(180deg);
    opacity: 0.8;
  }
}

/* Lists */
.list-section {
  .list-title {
    font-size: 24rpx;
    font-weight: 700;
    color: var(--text-sub);
    text-transform: uppercase;
    letter-spacing: 4rpx;
    margin-bottom: 24rpx;
    margin-left: 12rpx;
    display: block;
  }
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding-bottom: 40rpx;
}

.user-card {
  display: flex;
  align-items: center;
  padding: 32rpx;
  background: var(--bg-card);
  border-radius: 40rpx;
  transition: all 0.3s;

  /* Day mode shadow */
  box-shadow: 0 4rpx 30rpx rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0,0,0,0.02);

  .dark & {
    box-shadow: none;
    border: 1px solid var(--search-border);
  }

  &:active {
    transform: scale(0.98);
  }

  .avatar-wrapper {
    margin-right: 24rpx;
    border-radius: 50%;
    border: 2rpx solid var(--search-border);
  }

  .user-info {
    flex: 1;
    min-width: 0;

    .user-name {
      font-size: 32rpx;
      font-weight: 700;
      color: var(--text-main);
      display: block;
      margin-bottom: 4rpx;
    }

    .user-id {
      font-size: 24rpx;
      color: var(--text-sub);
      display: block;
      font-weight: 500;
    }
  }

  .action-btn {
    flex-shrink: 0;
    padding: 12rpx 36rpx;
    border-radius: 40rpx;
    font-size: 28rpx;
    font-weight: 700;
    transition: all 0.3s;

    /* Add State */
    &.btn-add {
      color: #fff;
      background: linear-gradient(90deg, var(--btn-add-from), var(--btn-add-to));
      box-shadow: 0 8rpx 20rpx var(--btn-add-shadow);

      &:active {
        transform: scale(0.95);
      }
    }

    /* Added State */
    &.btn-added {
      background: var(--btn-disabled-bg);
      color: var(--btn-disabled-text);
      cursor: default;
    }
  }
}

/* States (Loading/Empty) */
.state-card {
  margin-top: 64rpx;
  padding: 80rpx;
  background: var(--bg-card);
  border-radius: 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400rpx;
  border: 1px solid var(--search-border);
  box-shadow: 0 20rpx 50rpx rgba(0,0,0,0.02);

  .dark & {
    box-shadow: none;
  }

  .empty-icon-box {
    width: 128rpx;
    height: 128rpx;
    border-radius: 50%;
    background: var(--btn-disabled-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24rpx;
    color: var(--text-sub);
  }

  .loading-spinner {
    width: 80rpx;
    height: 80rpx;
    border: 8rpx solid rgba(0,0,0,0.1);
    border-top-color: var(--loading-spinner);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 24rpx;
  }

  .state-text {
    font-size: 28rpx;
    color: var(--text-sub);
    font-weight: 500;
  }
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
}

.safe-area-spacer {
  height: env(safe-area-inset-bottom);
  margin-bottom: 40rpx;
}
</style>
