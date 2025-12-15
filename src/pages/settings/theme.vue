<template>
  <wd-config-provider :theme="isDark ? 'dark' : 'light'">
    <view class="theme-page" :class="{ dark: isDark }">
      <!-- 导航栏 -->
      <view class="nav-bar">
        <view class="nav-back" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </view>
        <text class="nav-title">主题设置</text>
        <view class="nav-placeholder"></view>
      </view>

      <view class="content-body">
        <!-- 主题选项网格 -->
        <view class="option-grid">
          <!-- 浅色模式 -->
          <view class="option-card animate-fade-in-up" :class="{ active: currentTheme === 'light' }" @click="selectTheme('light')">
            <view class="phone-preview light-preview">
              <view class="preview-nav"></view>
              <view class="preview-body">
                <view class="preview-card"></view>
                <view class="preview-card short"></view>
              </view>
            </view>
            <view class="option-info">
              <text class="option-label">浅色模式</text>
              <view v-if="currentTheme === 'light'" class="check-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </view>
            </view>
          </view>

          <!-- 深色模式 -->
          <view class="option-card animate-fade-in-up" style="animation-delay: 50ms;" :class="{ active: currentTheme === 'dark' }" @click="selectTheme('dark')">
            <view class="phone-preview dark-preview">
              <view class="preview-nav"></view>
              <view class="preview-body">
                <view class="preview-card"></view>
                <view class="preview-card short"></view>
              </view>
            </view>
            <view class="option-info">
              <text class="option-label">深色模式</text>
              <view v-if="currentTheme === 'dark'" class="check-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </view>
            </view>
          </view>
        </view>

        <!-- 跟随系统选项 -->
        <view class="system-option animate-fade-in-up" style="animation-delay: 100ms;" :class="{ active: currentTheme === 'system' }" @click="selectTheme('system')">
          <view class="system-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </view>
          <view class="system-info">
            <text class="system-label">跟随系统</text>
            <text class="system-desc">根据系统设置自动切换</text>
          </view>
          <view v-if="currentTheme === 'system'" class="check-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </view>
        </view>

        <!-- 提示 -->
        <view class="tips animate-fade-in-up" style="animation-delay: 150ms;">
          <text>「跟随系统」开启后，将根据系统显示设置自动切换深色或浅色模式。</text>
        </view>
      </view>

      <wd-toast />
    </view>
  </wd-config-provider>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useToast } from 'wot-design-uni'

const { isDark, setTheme: applyTheme } = useTheme()
const toast = useToast()
const currentTheme = ref<'system' | 'light' | 'dark'>('system')

function goBack() { uni.navigateBack() }

onMounted(() => {
  const saved = uni.getStorageSync('nl_im_theme_mode')
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    currentTheme.value = saved
  }
})

function selectTheme(mode: 'system' | 'light' | 'dark') {
  currentTheme.value = mode
  uni.setStorageSync('nl_im_theme_mode', mode)

  if (mode === 'system') {
    uni.removeStorageSync('nl_im_theme')
    let systemDark = false
    try { systemDark = uni.getSystemInfoSync().theme === 'dark' } catch (e) {}
    applyTheme(systemDark, false)
  } else {
    applyTheme(mode === 'dark', true)
  }

  const tips = { system: '已设置为跟随系统', light: '已切换为浅色模式', dark: '已切换为深色模式' }
  toast.success(tips[mode])
}
</script>

<style lang="scss" scoped>
// 页面容器 - 浅色模式
.theme-page {
  --bg-page: #f7f8fa;
  --bg-surface: #ffffff;
  --text-primary: #1d1d1f;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;
  --border-color: rgba(0, 0, 0, 0.05);
  --color-brand: #4F46E5;

  min-height: 100vh;
  background: var(--bg-page);
}

// 深色模式 - Warm Stone
.theme-page.dark {
  --bg-page: #1c1917;
  --bg-surface: #292524;
  --text-primary: #f5f5f4;
  --text-secondary: #e7e5e4;
  --text-tertiary: #78716c;
  --border-color: rgba(255, 255, 255, 0.1);
  --color-brand: #f97316;
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

// 导航栏
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-page);

  /* #ifdef MP-WEIXIN */
  padding: calc(var(--status-bar-height, 44px) + 88rpx + 16rpx) 24rpx 16rpx;
  /* #endif */

  /* #ifndef MP-WEIXIN */
  padding: calc(var(--status-bar-height, 0) + 16rpx) 24rpx 16rpx;
  /* #endif */

  .nav-back {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.15s;

    svg {
      width: 40rpx;
      height: 40rpx;
      color: var(--text-primary);
    }

    &:active {
      background: var(--border-color);
    }
  }

  .nav-title {
    font-size: 34rpx;
    font-weight: 600;
    color: var(--text-primary);
  }

  .nav-placeholder {
    width: 72rpx;
  }
}

// 内容
.content-body {
  padding: 32rpx;
}

// 选项网格
.option-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.option-card {
  background: var(--bg-surface);
  border-radius: 24rpx;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 4rpx solid transparent;
  transition: all 0.2s;

  &.active {
    border-color: var(--color-brand);
  }

  &:active {
    transform: scale(0.98);
  }
}

// 手机预览
.phone-preview {
  width: 160rpx;
  height: 220rpx;
  border-radius: 20rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 2rpx solid var(--border-color);
  margin-bottom: 20rpx;

  .preview-nav {
    height: 40rpx;
    border-bottom: 1rpx solid var(--border-color);
  }

  .preview-body {
    flex: 1;
    padding: 16rpx;
    display: flex;
    flex-direction: column;
    gap: 12rpx;
  }

  .preview-card {
    height: 50rpx;
    border-radius: 8rpx;

    &.short {
      width: 70%;
    }
  }
}

.light-preview {
  background: #fff;

  .preview-nav {
    background: #f7f7f7;
  }

  .preview-card {
    background: #e5e7eb;
  }
}

.dark-preview {
  background: #1c1917;
  border-color: #44403c;

  .preview-nav {
    background: #292524;
    border-color: #44403c;
  }

  .preview-card {
    background: #44403c;
  }
}

.option-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.option-label {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.check-mark {
  width: 40rpx;
  height: 40rpx;
  background: var(--color-brand);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 24rpx;
    height: 24rpx;
  }
}

// 跟随系统
.system-option {
  display: flex;
  align-items: center;
  background: var(--bg-surface);
  border-radius: 24rpx;
  padding: 32rpx;
  border: 4rpx solid transparent;
  transition: all 0.2s;

  &.active {
    border-color: var(--color-brand);
  }

  &:active {
    transform: scale(0.99);
  }
}

.system-icon {
  width: 80rpx;
  height: 80rpx;
  background: var(--border-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;

  svg {
    width: 40rpx;
    height: 40rpx;
    color: var(--text-primary);
  }
}

.system-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.system-label {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.system-desc {
  font-size: 24rpx;
  color: var(--text-tertiary);
  margin-top: 4rpx;
}

// 提示
.tips {
  padding: 32rpx 12rpx;
  font-size: 24rpx;
  color: var(--text-tertiary);
  line-height: 1.6;
}
</style>
