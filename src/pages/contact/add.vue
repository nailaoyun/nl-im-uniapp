<template>
  <view class="page-container" :class="{ 'theme-dark': isDark }">
    <!-- 渐变弧形头部 -->
    <view class="curved-header">
      <view class="header-bg"></view>
      <view class="decoration-orb orb-1"></view>
      <view class="decoration-orb orb-2"></view>

      <!-- 返回按钮 -->
      <view class="nav-back" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </view>

      <!-- 大标题 -->
      <view class="header-content">
        <text class="main-title">发现新朋友</text>
        <text class="sub-title">EXPANDING YOUR CIRCLE</text>
      </view>
    </view>

    <!-- 悬浮搜索框 -->
    <view class="search-floater">
      <view class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
            class="search-input"
            type="text"
            v-model="keyword"
            placeholder="搜索账号 / 手机号"
            @confirm="doSearch"
        />
        <view v-if="keyword" class="clear-btn" @click="keyword = ''">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
          </svg>
        </view>
        <view v-else class="search-btn" @click="doSearch">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </view>
      </view>
    </view>

    <!-- 主内容 -->
    <scroll-view scroll-y class="main-content custom-scrollbar">
      <!-- 搜索结果 -->
      <view v-if="searched" class="result-section animate-fade-in-up">
        <view class="section-header">
          <text class="section-title">搜索结果</text>
        </view>

        <!-- Loading -->
        <view v-if="loading" class="loading-box">
          <wd-loading size="50rpx" :color="isDark ? '#f97316' : '#4F46E5'" />
          <text>正在寻找...</text>
        </view>

        <!-- Empty -->
        <view v-else-if="results.length === 0" class="empty-box">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <text class="empty-text">未找到匹配的用户</text>
        </view>

        <!-- List -->
        <view v-else class="user-list">
          <view
              v-for="(item, index) in results"
              :key="item.id"
              class="user-card animate-fade-in-up"
              :style="{ animationDelay: `${index * 50}ms` }"
          >
            <app-avatar
                :src="item.avatar"
                :name="item.name"
                :size="100"
                radius="28rpx"
            />
            <view class="card-info">
              <text class="user-name">{{ item.name }}</text>
              <text class="user-id">ID: {{ item.id }}</text>
            </view>
            <view class="action-wrap" :class="{ added: addedIds.includes(item.id) }" @click.stop="addFriend(item)">
              <svg v-if="!addedIds.includes(item.id)" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </view>
          </view>
        </view>
      </view>

      <!-- 初始态：扫一扫卡片 + 推荐用户 -->
      <view v-else class="initial-content">
        <view class="feature-card scan-card" @click="scanQrCode">
          <view class="card-content">
            <view class="icon-bubble">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                <line x1="7" y1="12" x2="17" y2="12"/>
              </svg>
            </view>
            <view class="text-group">
              <text class="card-title">扫一扫</text>
              <text class="card-desc">扫描二维码名片</text>
            </view>
          </view>
          <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </view>

        <!-- 推荐用户列表 -->
        <view v-if="recommendUsers.length > 0" class="recommend-section animate-fade-in-up">
          <view class="section-header">
            <text class="section-title">为您推荐</text>
          </view>
          <view class="user-list">
            <view
                v-for="(item, index) in recommendUsers"
                :key="item.id"
                class="user-card animate-fade-in-up"
                :style="{ animationDelay: `${index * 50}ms` }"
            >
              <app-avatar
                  :src="item.avatar"
                  :name="item.name"
                  :size="100"
                  radius="28rpx"
              />
              <view class="card-info">
                <text class="user-name">{{ item.name }}</text>
                <text class="user-id">ID: {{ item.id }}</text>
              </view>
              <view class="action-wrap" :class="{ added: addedIds.includes(item.id) }" @click.stop="addFriend(item)">
                <svg v-if="!addedIds.includes(item.id)" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </view>
            </view>
          </view>
        </view>

        <!-- 加载推荐用户中 -->
        <view v-else-if="loadingRecommend" class="loading-box">
          <wd-loading size="50rpx" :color="isDark ? '#f97316' : '#4F46E5'" />
          <text>获取推荐...</text>
        </view>
      </view>
    </scroll-view>

    <wd-toast />
    <wd-message-box />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as contactApi from '@/api/modules/contact'
import { useToast, useMessage } from 'wot-design-uni'
import { useTheme } from '@/composables/useTheme'
import AppAvatar from '@/components/common/AppAvatar.vue'
import type { User } from '@/types/api'

// --- 保持逻辑完全不变 ---
const toast = useToast(); const message = useMessage(); const { isDark } = useTheme();
const keyword = ref(''); const loading = ref(false); const searched = ref(false); const results = ref<User[]>([]); const addedIds = ref<string[]>([]);

// 推荐用户相关
const recommendUsers = ref<User[]>([]); const loadingRecommend = ref(false);

function goBack() { uni.navigateBack() }
async function doSearch() { if (!keyword.value.trim()) { toast.show('请输入搜索内容'); return } loading.value = true; searched.value = true; try { results.value = await contactApi.searchUsers(keyword.value.trim()) } catch (error) { console.error('搜索失败:', error); toast.error('搜索失败') } finally { loading.value = false } }
async function addFriend(user: User) {
  if (addedIds.value.includes(user.id)) { toast.show('已发送申请'); return }
  try { const { value } = await message.prompt({ title: '添加好友', inputPlaceholder: '请输入验证消息', inputValue: '你好，我是...' }); await contactApi.addFriend({ to_user_id: user.id, message: value || '' }); addedIds.value.push(user.id); toast.success('申请已发送') } catch (e: any) { if (e !== 'cancel') { toast.error('发送失败') } }
}
function scanQrCode() { uni.scanCode({ onlyFromCamera: false, success: (res) => { console.log('扫码结果:', res.result); toast.show('扫码功能开发中') }, fail: () => { toast.error('扫码失败') } }) }

// 加载推荐用户
async function loadRecommendUsers() {
  loadingRecommend.value = true;
  try {
    // 尝试获取推荐用户，如果 API 不存在则使用空列表
    if (typeof contactApi.getRecommendUsers === 'function') {
      recommendUsers.value = await contactApi.getRecommendUsers();
    } else {
      // API 不存在时使用默认数据
      recommendUsers.value = [];
    }
  } catch (error) {
    console.error('获取推荐用户失败:', error);
    recommendUsers.value = [];
  } finally {
    loadingRecommend.value = false;
  }
}

onMounted(() => {
  loadRecommendUsers();
});
</script>

<style lang="scss" scoped>
// 页面容器 - 浅色模式
.page-container {
  --bg-base: #f7f8fa;
  --bg-card: #ffffff;
  --text-main: #1d1d1f;
  --text-sub: #6b7280;
  --color-brand: #4F46E5;
  --gradient-start: #4b6cb7;
  --gradient-end: #8E9EFE;

  min-height: 100vh;
  background: var(--bg-base);
  position: relative;
  overflow: hidden;

  // 深色模式 - Warm Stone
  &.theme-dark {
    --bg-base: #1c1917;
    --bg-card: #292524;
    --text-main: #f5f5f4;
    --text-sub: #78716c;
    --color-brand: #f97316;
    --gradient-start: #7c2d12;
    --gradient-end: #b45309;
  }
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

// 渐变弧形头部
.curved-header {
  position: relative;
  height: 720rpx;
  overflow: hidden;

  .header-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
    clip-path: ellipse(150% 100% at 50% 0%);
  }

  .decoration-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(70rpx);
    pointer-events: none;

    &.orb-1 {
      width: 300rpx;
      height: 300rpx;
      background: rgba(255, 255, 255, 0.2);
      top: 100rpx;
      left: -50rpx;
    }

    &.orb-2 {
      width: 250rpx;
      height: 250rpx;
      background: rgba(255, 255, 255, 0.15);
      top: 200rpx;
      right: -80rpx;
      filter: blur(80rpx);
    }
  }

  .nav-back {
    position: absolute;
    top: calc(var(--status-bar-height) + 16rpx);
    left: 24rpx;
    width: 72rpx;
    height: 72rpx;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    z-index: 10;
    transition: all 0.15s;

    svg {
      width: 40rpx;
      height: 40rpx;
    }

    &:active {
      transform: scale(0.95);
      background: rgba(255, 255, 255, 0.3);
    }
  }

  .header-content {
    position: absolute;
    bottom: 200rpx;
    left: 48rpx;
    z-index: 2;
  }

  .main-title {
    display: block;
    font-size: 72rpx;
    font-weight: 900;
    font-style: italic;
    color: #fff;
    letter-spacing: -2rpx;
    text-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.2);
  }

  .sub-title {
    display: block;
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 4rpx;
    margin-top: 12rpx;
  }
}

// 悬浮搜索框
.search-floater {
  position: relative;
  margin-top: -80rpx;
  padding: 0 32rpx;
  z-index: 10;
}

.search-box {
  display: flex;
  align-items: center;
  background: var(--bg-card);
  padding: 16rpx 24rpx;
  border-radius: 50rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);

  .search-icon {
    width: 40rpx;
    height: 40rpx;
    color: var(--text-sub);
    margin-right: 16rpx;
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    height: 72rpx;
    font-size: 30rpx;
    color: var(--text-main);
    background: transparent;
    border: none;
    outline: none;

    &::placeholder {
      color: var(--text-sub);
      opacity: 0.6;
    }
  }

  .clear-btn {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-sub);
    margin-right: 12rpx;

    svg {
      width: 36rpx;
      height: 36rpx;
    }

    &:active { opacity: 0.7; }
  }

  .search-btn {
    width: 72rpx;
    height: 72rpx;
    background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4rpx 16rpx rgba(79, 70, 229, 0.3);
    flex-shrink: 0;
    transition: all 0.15s;

    .theme-dark & {
      background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
      box-shadow: 0 4rpx 16rpx rgba(249, 115, 22, 0.3);
    }

    svg {
      width: 36rpx;
      height: 36rpx;
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

// 主内容
.main-content {
  height: calc(100vh - 720rpx + 80rpx);
  padding: 40rpx 32rpx;
}

// 结果区
.result-section {
  .section-header {
    margin-bottom: 24rpx;

    .section-title {
      font-size: 30rpx;
      font-weight: 700;
      color: var(--text-main);
    }
  }
}

.loading-box, .empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;
  gap: 24rpx;
  color: var(--text-sub);
  font-size: 26rpx;
}

.empty-icon {
  width: 100rpx;
  height: 100rpx;
  opacity: 0.4;
}

// 用户卡片
.user-card {
  background: var(--bg-card);
  padding: 24rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);

  .card-info {
    flex: 1;
    margin-left: 24rpx;

    .user-name {
      display: block;
      font-size: 32rpx;
      font-weight: 600;
      color: var(--text-main);
    }

    .user-id {
      display: block;
      margin-top: 6rpx;
      font-size: 24rpx;
      color: var(--text-sub);
      font-family: monospace;
    }
  }

  .action-wrap {
    width: 80rpx;
    height: 80rpx;
    border-radius: 24rpx;
    background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    box-shadow: 0 4rpx 12rpx rgba(79, 70, 229, 0.25);

    .theme-dark & {
      background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
      box-shadow: 0 4rpx 12rpx rgba(249, 115, 22, 0.25);
    }

    svg {
      width: 36rpx;
      height: 36rpx;
    }

    &.added {
      background: #10b981;
      box-shadow: 0 4rpx 12rpx rgba(16, 185, 129, 0.25);
    }

    &:active {
      transform: scale(0.92);
    }
  }
}

// 初始内容
.initial-content {
  padding-top: 20rpx;
}

// 推荐区
.recommend-section {
  margin-top: 48rpx;

  .section-header {
    margin-bottom: 24rpx;

    .section-title {
      font-size: 30rpx;
      font-weight: 700;
      color: var(--text-main);
    }
  }

  .user-list {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
  }
}

// 功能卡片
.feature-card {
  position: relative;
  border-radius: 40rpx;
  padding: 40rpx;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 12rpx 32rpx rgba(79, 70, 229, 0.2);

  .theme-dark & {
    box-shadow: 0 12rpx 32rpx rgba(249, 115, 22, 0.2);
  }

  &.scan-card {
    background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
    color: #fff;
  }

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -20%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 60%);
    pointer-events: none;
  }

  .card-content {
    display: flex;
    align-items: center;
    gap: 24rpx;
    z-index: 2;
  }

  .icon-bubble {
    width: 88rpx;
    height: 88rpx;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);

    svg {
      width: 44rpx;
      height: 44rpx;
    }
  }

  .text-group {
    display: flex;
    flex-direction: column;

    .card-title {
      font-size: 36rpx;
      font-weight: 700;
      margin-bottom: 6rpx;
    }

    .card-desc {
      font-size: 24rpx;
      opacity: 0.8;
    }
  }

  .arrow-icon {
    width: 40rpx;
    height: 40rpx;
    z-index: 2;
  }

  &:active {
    transform: scale(0.98);
  }
}
</style>
