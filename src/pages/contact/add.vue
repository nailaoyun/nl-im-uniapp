<template>
  <wd-config-provider :theme="isDark ? 'dark' : 'light'">
    <view class="add-friend-page" :class="{ dark: isDark }">
      <!-- 顶部渐变背景区域 -->
      <view class="header-bg">
        <view class="gradient-layer"></view>
        <view class="blob-1"></view>
        <view class="blob-2"></view>
        <view class="decoration-ring"></view>
      </view>
      
      <!-- 顶部内容层 -->
      <view class="header-content">
        <!-- 导航栏 -->
        <view class="nav-bar">
          <view class="nav-back" @click="goBack">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </view>
          <text class="nav-title">添加好友</text>
          <view class="nav-placeholder"></view>
        </view>
        
        <!-- 大标题 -->
        <view class="hero-section">
          <text class="hero-title">发现新朋友</text>
          <text class="hero-subtitle">EXPANDING YOUR CIRCLE</text>
        </view>
        
        <!-- 搜索框 -->
        <view class="search-wrapper">
          <view class="search-box" @click="focusSearch">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              ref="searchInput"
              v-model="searchKeyword" 
              class="search-input" 
              type="text" 
              placeholder="请输入账号/手机号"
              @input="onSearchInput"
              @confirm="doSearch"
            />
            <view v-if="searchKeyword" class="clear-btn" @click.stop="clearSearch">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
              </svg>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 内容区域 -->
      <scroll-view class="content-area custom-scrollbar" scroll-y>
        <!-- 初始状态 -->
        <template v-if="viewState === 'initial'">
          <!-- 扫一扫卡片 -->
          <view class="scan-card animate-fade-in-up" @click="handleScan">
            <view class="scan-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                <line x1="7" y1="12" x2="17" y2="12"/>
              </svg>
            </view>
            <view class="scan-info">
              <text class="scan-title">扫一扫</text>
              <text class="scan-desc">扫描二维码名片</text>
            </view>
            <svg class="scan-arrow" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
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
                <app-avatar :src="user.avatar" :name="user.name" :size="96" radius="50%" />
                <view class="user-info">
                  <text class="user-name">{{ user.name }}</text>
                  <text class="user-id">ID: {{ user.id }}</text>
                </view>
                <view 
                  class="add-btn" 
                  :class="{ added: addedIds.includes(user.id) }"
                  @click="handleAdd(user)"
                >
                  {{ addedIds.includes(user.id) ? '已发送' : '添加' }}
                </view>
              </view>
            </view>
          </view>
        </template>
        
        <!-- 加载状态 -->
        <template v-else-if="viewState === 'loading'">
          <view class="state-card animate-fade-in-up">
            <wd-loading :color="isDark ? '#f97316' : '#5B7FFF'" />
            <text class="state-text">正在搜索...</text>
          </view>
        </template>
        
        <!-- 空结果状态 -->
        <template v-else-if="viewState === 'empty'">
          <view class="state-card animate-fade-in-up">
            <view class="empty-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
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
                <app-avatar :src="user.avatar" :name="user.name" :size="96" radius="50%" />
                <view class="user-info">
                  <text class="user-name">{{ user.name }}</text>
                  <text class="user-id">ID: {{ user.id }}</text>
                </view>
                <view 
                  class="add-btn" 
                  :class="{ added: addedIds.includes(user.id) }"
                  @click.stop="handleAdd(user)"
                >
                  {{ addedIds.includes(user.id) ? '已发送' : '添加' }}
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
// 页面容器 - 浅色模式
.add-friend-page {
  --bg-page: #ffffff;
  --bg-card: #ffffff;
  --text-main: #1f2937;
  --text-sub: #9ca3af;
  --gradient-from: #4b6cb7;
  --gradient-to: #8E9EFE;
  --btn-gradient-from: #5B7FFF;
  --btn-gradient-to: #748EFF;
  --search-bg: #ffffff;
  --search-border: #f9fafb;
  
  min-height: 100vh;
  background: var(--bg-page);
  position: relative;
  overflow: hidden;
}

// 深色模式 - Warm Stone
.add-friend-page.dark {
  --bg-page: #1c1917;
  --bg-card: #292524;
  --text-main: #e7e5e4;
  --text-sub: #a8a29e;
  --gradient-from: #7c2d12;
  --gradient-to: #b45309;
  --btn-gradient-from: #c2410c;
  --btn-gradient-to: #ea580c;
  --search-bg: #292524;
  --search-border: #44403c;
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

// 顶部渐变背景
.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 720rpx;
  border-bottom-left-radius: 120rpx;
  border-bottom-right-radius: 560rpx;
  overflow: hidden;
  z-index: 0;
  
  .gradient-layer {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--gradient-from) 0%, var(--gradient-to) 100%);
  }
  
  .blob-1 {
    position: absolute;
    top: -100rpx;
    left: -100rpx;
    width: 700rpx;
    height: 700rpx;
    background: rgba(59, 79, 168, 0.8);
    opacity: 0.8;
    filter: blur(140rpx);
    border-radius: 50%;
    
    .dark & {
      background: rgba(69, 26, 3, 0.8);
    }
  }
  
  .blob-2 {
    position: absolute;
    top: 40rpx;
    right: -120rpx;
    width: 600rpx;
    height: 600rpx;
    background: rgba(130, 225, 255, 0.4);
    filter: blur(120rpx);
    border-radius: 50%;
    
    .dark & {
      background: rgba(253, 186, 116, 0.3);
    }
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

// 顶部内容层
.header-content {
  position: relative;
  z-index: 10;
  padding-top: var(--status-bar-height);
}

// 导航栏
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  
  .nav-back {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.15s;
    
    svg {
      width: 48rpx;
      height: 48rpx;
      color: #fff;
    }
    
    &:active {
      background: rgba(255, 255, 255, 0.1);
    }
  }
  
  .nav-title {
    font-size: 36rpx;
    font-weight: 700;
    color: #fff;
    letter-spacing: 2rpx;
    opacity: 0.95;
  }
  
  .nav-placeholder {
    width: 72rpx;
  }
}

// 大标题区域
.hero-section {
  padding: 60rpx 48rpx 40rpx;
  
  .hero-title {
    font-size: 72rpx;
    font-weight: 900;
    font-style: italic;
    color: #fff;
    display: block;
    text-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.2);
    letter-spacing: 2rpx;
  }
  
  .hero-subtitle {
    font-size: 24rpx;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.8);
    letter-spacing: 6rpx;
    margin-top: 8rpx;
    display: block;
  }
}

// 搜索框
.search-wrapper {
  padding: 0 48rpx 56rpx;
}

.search-box {
  display: flex;
  align-items: center;
  height: 96rpx;
  background: var(--search-bg);
  border: 2rpx solid var(--search-border);
  border-radius: 48rpx;
  padding: 0 32rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.1);
  
  .search-icon {
    width: 40rpx;
    height: 40rpx;
    color: var(--text-sub);
    margin-right: 16rpx;
    flex-shrink: 0;
  }
  
  .search-input {
    flex: 1;
    height: 100%;
    font-size: 30rpx;
    color: var(--text-main);
    background: transparent;
    border: none;
    
    &::placeholder {
      color: var(--text-sub);
    }
  }
  
  .clear-btn {
    width: 40rpx;
    height: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-sub);
    flex-shrink: 0;
    
    svg {
      width: 32rpx;
      height: 32rpx;
    }
    
    &:active {
      opacity: 0.6;
    }
  }
}

// 内容区域
.content-area {
  position: relative;
  z-index: 5;
  margin-top: -80rpx;
  height: calc(100vh - 640rpx);
  padding: 0 32rpx;
}

// 扫一扫卡片
.scan-card {
  display: flex;
  align-items: center;
  padding: 0 48rpx;
  height: 192rpx;
  border-radius: 56rpx;
  margin-bottom: 48rpx;
  background: linear-gradient(135deg, var(--btn-gradient-from) 0%, var(--btn-gradient-to) 100%);
  box-shadow: 0 16rpx 48rpx rgba(91, 127, 255, 0.2);
  transition: all 0.15s;
  
  .dark & {
    box-shadow: 0 16rpx 48rpx rgba(234, 88, 12, 0.3);
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  .scan-icon-box {
    width: 96rpx;
    height: 96rpx;
    border-radius: 32rpx;
    background: rgba(0, 0, 0, 0.2);
    border: 2rpx solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 32rpx;
    
    svg {
      width: 48rpx;
      height: 48rpx;
    }
  }
  
  .scan-info {
    flex: 1;
    
    .scan-title {
      font-size: 36rpx;
      font-weight: 700;
      color: #fff;
      display: block;
      letter-spacing: 2rpx;
    }
    
    .scan-desc {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 4rpx;
      display: block;
    }
  }
  
  .scan-arrow {
    width: 40rpx;
    height: 40rpx;
    opacity: 0.8;
  }
}

// 列表区域
.list-section {
  margin-top: 16rpx;
  
  .list-title {
    font-size: 24rpx;
    font-weight: 700;
    color: var(--text-sub);
    text-transform: uppercase;
    letter-spacing: 4rpx;
    margin-bottom: 24rpx;
    margin-left: 8rpx;
    display: block;
  }
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.user-card {
  display: flex;
  align-items: center;
  padding: 32rpx;
  background: var(--bg-card);
  border: 2rpx solid var(--search-border);
  border-radius: 40rpx;
  transition: all 0.15s;
  box-shadow: 0 4rpx 30rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
  
  .dark & {
    box-shadow: none;
  }
  
  &:active {
    transform: scale(0.99);
    
    .dark & {
      background: #44403c;
    }
  }
  
  .user-info {
    flex: 1;
    min-width: 0;
    margin-left: 24rpx;
    
    .user-name {
      font-size: 32rpx;
      font-weight: 700;
      color: var(--text-main);
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .user-id {
      font-size: 24rpx;
      color: var(--text-sub);
      margin-top: 4rpx;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
  
  .add-btn {
    flex-shrink: 0;
    padding: 16rpx 32rpx;
    border-radius: 40rpx;
    font-size: 28rpx;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(135deg, var(--btn-gradient-from) 0%, var(--btn-gradient-to) 100%);
    box-shadow: 0 8rpx 24rpx rgba(91, 127, 255, 0.3);
    transition: all 0.15s;
    
    .dark & {
      box-shadow: 0 8rpx 24rpx rgba(234, 88, 12, 0.4);
    }
    
    &:active {
      transform: scale(0.95);
    }
    
    &.added {
      background: #f3f4f6;
      color: #9ca3af;
      box-shadow: none;
      
      .dark & {
        background: #44403c;
        color: #a8a29e;
      }
    }
  }
}

// 状态卡片
.state-card {
  margin-top: 64rpx;
  padding: 80rpx;
  background: var(--bg-card);
  border: 2rpx solid var(--search-border);
  border-radius: 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400rpx;
  box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.05);
  
  .dark & {
    box-shadow: none;
  }
  
  .empty-icon-box {
    width: 128rpx;
    height: 128rpx;
    border-radius: 50%;
    background: #f9fafb;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24rpx;
    
    .dark & {
      background: #1c1917;
    }
    
    svg {
      width: 48rpx;
      height: 48rpx;
      color: var(--text-sub);
    }
  }
  
  .state-text {
    font-size: 28rpx;
    color: var(--text-sub);
    margin-top: 24rpx;
  }
}

.safe-area-spacer {
  height: 64rpx;
}
</style>

