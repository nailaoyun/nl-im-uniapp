<template>
  <wd-config-provider :theme="isDark ? 'dark' : 'light'">
    <view class="page-container" :class="{ 'theme-dark': isDark }">
      <!-- 顶部背景装饰 -->
      <view class="page-bg-decoration" />

      <!-- 导航栏 -->
      <app-nav-bar title="添加好友" custom-style="background: transparent;" />

      <view class="content-body">
        <!-- 头部标题区 -->
        <view class="header-area">
          <text class="main-title">发现新朋友</text>
          <text class="sub-title">Expanding your circle</text>
        </view>

        <!-- 搜索区域 -->
        <view class="search-section">
          <wd-search
              v-model="keyword"
              placeholder="搜索账号 / 手机号"
              hide-cancel
              placeholder-left
              custom-class="glass-search"
              @search="doSearch"
              @clear="keyword = ''"
          >
            <template #suffix>
              <view class="search-btn" @click="doSearch">
                <wd-icon name="search" size="36rpx" />
              </view>
            </template>
          </wd-search>
        </view>

        <!-- 搜索结果 -->
        <view v-if="searched" class="result-section">
          <view class="section-header">
            <text class="section-title">搜索结果</text>
          </view>

          <!-- Loading -->
          <view v-if="loading" class="loading-box">
            <wd-loading size="50rpx" color="#4f46e5" />
            <text>正在寻找...</text>
          </view>

          <!-- Empty -->
          <view v-else-if="results.length === 0" class="empty-box">
            <text class="empty-icon">🔍</text>
            <text class="empty-text">未找到匹配的用户</text>
          </view>

          <!-- List -->
          <view v-else class="user-list">
            <view
                v-for="item in results"
                :key="item.id"
                class="user-card"
            >
              <app-avatar
                  :src="item.avatar"
                  :name="item.name"
                  :size="110"
                  radius="36rpx"
              />
              <view class="card-info">
                <text class="user-name">{{ item.name }}</text>
                <text class="user-id">ID: {{ item.id }}</text>
              </view>
              <view class="action-wrap" @click.stop="addFriend(item)">
                <wd-icon name="add" size="36rpx" color="#fff" />
              </view>
            </view>
          </view>
        </view>

        <!-- 扫码入口 (无搜索结果时显示) -->
        <view v-if="!searched" class="feature-cards">
          <view class="feature-card scan-card" @click="scanQrCode">
            <view class="card-content">
              <view class="icon-bubble">
                <wd-icon name="scan" size="48rpx" color="#fff" />
              </view>
              <view class="text-group">
                <text class="card-title">扫一扫</text>
                <text class="card-desc">扫描二维码名片</text>
              </view>
            </view>
            <wd-icon name="arrow-right" size="32rpx" color="rgba(255,255,255,0.6)" />
          </view>
        </view>

      </view>

      <wd-toast />
      <wd-message-box />
    </view>
  </wd-config-provider>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import * as contactApi from '@/api/modules/contact'
import { useToast, useMessage } from 'wot-design-uni'
import { useTheme } from '@/composables/useTheme'
import AppAvatar from '@/components/common/AppAvatar.vue'
import type { User } from '@/types/api'

// --- 保持逻辑完全不变 ---
const toast = useToast(); const message = useMessage(); const { isDark } = useTheme();
const keyword = ref(''); const loading = ref(false); const searched = ref(false); const results = ref<User[]>([]);
async function doSearch() { if (!keyword.value.trim()) { toast.show('请输入搜索内容'); return } loading.value = true; searched.value = true; try { results.value = await contactApi.searchUsers(keyword.value.trim()) } catch (error) { console.error('搜索失败:', error); toast.error('搜索失败') } finally { loading.value = false } }
async function addFriend(user: User) { try { const { value } = await message.prompt({ title: '添加好友.html', inputPlaceholder: '请输入验证消息', inputValue: '你好，我是...' }); await contactApi.addFriend({ to_user_id: user.id, message: value || '' }); toast.success('申请已发送') } catch (e: any) { if (e !== 'cancel') { toast.error('发送失败') } } }
function scanQrCode() { uni.scanCode({ onlyFromCamera: false, success: (res) => { console.log('扫码结果:', res.result); toast.show('扫码功能开发中') }, fail: () => { toast.error('扫码失败') } }) }
</script>

<style lang="scss" scoped>
.page-container {
  --bg-base: #F7F8FA;
  --bg-card: #FFFFFF;
  --text-main: #1D2129;
  --text-sub: #86909C;
  --primary: #4F46E5;
  --primary-gradient: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
  --shadow-sm: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 12rpx 32rpx rgba(79, 70, 229, 0.15);

  min-height: 100vh;
  background: var(--bg-base);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;

  &.theme-dark {
    --bg-base: #121212; /* 高级灰 */
    --bg-card: #1C1C1E; /* 卡片灰 */
    --text-main: #F2F3F5;
    --text-sub: #86909C;
    --shadow-sm: 0 4rpx 16rpx rgba(0, 0, 0, 0.2);
  }
}

/* 背景装饰球 */
.page-bg-decoration {
  position: absolute;
  top: -100rpx;
  right: -100rpx;
  width: 400rpx;
  height: 400rpx;
  background: radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, rgba(0,0,0,0) 70%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.content-body {
  position: relative;
  z-index: 1;
  padding: 20rpx 32rpx;
}

/* 头部 */
.header-area {
  margin: 20rpx 0 40rpx;
  .main-title {
    display: block;
    font-size: 48rpx;
    font-weight: 800;
    color: var(--text-main);
    letter-spacing: -1rpx;
  }
  .sub-title {
    font-size: 24rpx;
    color: var(--text-sub);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 2rpx;
    margin-top: 8rpx;
  }
}

/* 搜索栏定制 */
.search-section {
  margin-bottom: 40rpx;
}

:deep(.glass-search) {
  background: var(--bg-card) !important;
  padding: 16rpx 24rpx !important;
  border-radius: 32rpx !important;
  box-shadow: var(--shadow-sm);

  .wd-search__field {
    background: transparent !important;
    height: 60rpx;
  }

  .wd-icon-search { color: var(--text-sub); }
  .uni-input-placeholder { color: var(--text-sub); opacity: 0.6; }
}

.search-btn {
  width: 64rpx;
  height: 64rpx;
  background: var(--primary-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(79, 70, 229, 0.3);
  &:active { transform: scale(0.95); }
}

/* 结果列表 */
.section-header {
  margin-bottom: 24rpx;
  .section-title {
    font-size: 30rpx;
    font-weight: 700;
    color: var(--text-main);
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
.empty-icon { font-size: 60rpx; opacity: 0.5; }

.user-card {
  background: var(--bg-card);
  padding: 24rpx;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
  box-shadow: var(--shadow-sm);
  animation: slideUp 0.3s ease-out;

  .card-info {
    flex: 1;
    margin-left: 24rpx;
    .user-name {
      display: block;
      font-size: 34rpx;
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
    background: var(--text-main); /* 黑色/白色按钮 */
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    .theme-dark & { background: #333; }

    &:active { transform: scale(0.92); }
  }
}

/* 功能卡片 (扫一扫) */
.feature-cards {
  margin-top: 20rpx;
}

.feature-card {
  position: relative;
  border-radius: 40rpx;
  padding: 40rpx;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--shadow-lg);

  &.scan-card {
    background: var(--primary-gradient);
    color: #fff;
  }

  /* 卡片内部纹理 */
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -20%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
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
    background: rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 30rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
  }

  .text-group {
    display: flex;
    flex-direction: column;
    .card-title { font-size: 36rpx; font-weight: 700; margin-bottom: 6rpx; }
    .card-desc { font-size: 24rpx; opacity: 0.8; font-weight: 400; }
  }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20rpx); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
