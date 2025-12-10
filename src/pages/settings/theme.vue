<template>
  <wd-config-provider :theme="isDark ? 'dark' : 'light'">
    <view class="theme-page" :class="{ dark: isDark }">
      <app-nav-bar title="主题设置" custom-style="background: transparent;" />

      <view class="content-body">
        <view class="option-list">
          <!-- 浅色 -->
          <view class="option-card" :class="{ active: currentTheme === 'light' }" @click="selectTheme('light')">
            <view class="preview light-prev">
              <view class="p-nav"></view><view class="p-body"></view>
            </view>
            <text class="label">浅色模式</text>
            <wd-icon v-if="currentTheme === 'light'" name="check" color="#4f46e5" class="check-icon" />
          </view>

          <!-- 深色 -->
          <view class="option-card" :class="{ active: currentTheme === 'dark' }" @click="selectTheme('dark')">
            <view class="preview dark-prev">
              <view class="p-nav"></view><view class="p-body"></view>
            </view>
            <text class="label">深色模式</text>
            <wd-icon v-if="currentTheme === 'dark'" name="check" color="#4f46e5" class="check-icon" />
          </view>

          <!-- 跟随系统 -->
          <view class="option-card system" :class="{ active: currentTheme === 'system' }" @click="selectTheme('system')">
            <view class="system-icon"><wd-icon name="setting" size="48rpx" /></view>
            <text class="label">跟随系统</text>
            <wd-icon v-if="currentTheme === 'system'" name="check" color="#4f46e5" class="check-icon" />
          </view>
        </view>

        <view class="tips">
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

// --- 逻辑不变 ---
const { isDark, setTheme: applyTheme } = useTheme(); const toast = useToast(); const currentTheme = ref<'system' | 'light' | 'dark'>('system');
onMounted(() => { const saved = uni.getStorageSync('nl_im_theme_mode'); if (saved === 'light' || saved === 'dark' || saved === 'system') { currentTheme.value = saved } });
function selectTheme(mode: 'system' | 'light' | 'dark') {
  currentTheme.value = mode; uni.setStorageSync('nl_im_theme_mode', mode);
  if (mode === 'system') { uni.removeStorageSync('nl_im_theme'); let systemDark = false; try { systemDark = uni.getSystemInfoSync().theme === 'dark' } catch (e) {} applyTheme(systemDark, false) }
  else { applyTheme(mode === 'dark', true) }
  const tips = { system: '已设置为跟随系统', light: '已切换为浅色模式', dark: '已切换为深色模式' }; toast.success(tips[mode])
}
</script>

<style lang="scss" scoped>
.theme-page {
  --bg-page: #f5f7fa;
  --bg-surface: #ffffff;
  --text-primary: #1d1d1f;

  min-height: 100vh;
  background: var(--bg-page);
}
.theme-page.dark {
  --bg-page: #1c1c1e;
  --bg-surface: #2c2c2e;
  --text-primary: #f2f2f7;
}

.content-body { padding: 40rpx; }

.option-list {
  display: grid; grid-template-columns: 1fr 1fr; gap: 30rpx; margin-bottom: 40rpx;
}

.option-card {
  background: var(--bg-surface); border-radius: 24rpx; padding: 30rpx;
  display: flex; flex-direction: column; align-items: center; gap: 20rpx;
  border: 4rpx solid transparent; position: relative;

  &.active { border-color: #4f46e5; background: rgba(79, 70, 229, 0.05); }

  .label { font-size: 28rpx; font-weight: 600; color: var(--text-primary); }
  .check-icon { position: absolute; top: 20rpx; right: 20rpx; }

  &.system { grid-column: span 2; flex-direction: row; padding: 40rpx; }
}

/* 简单的 CSS 预览图 */
.preview {
  width: 120rpx; height: 160rpx; border-radius: 12rpx; border: 2rpx solid rgba(0,0,0,0.1); overflow: hidden; display: flex; flex-direction: column;
  .p-nav { height: 30rpx; border-bottom: 1rpx solid rgba(0,0,0,0.05); }
  .p-body { flex: 1; margin: 10rpx; border-radius: 8rpx; }
}
.light-prev {
  background: #fff;
  .p-nav { background: #f7f7f7; } .p-body { background: #eee; }
}
.dark-prev {
  background: #1c1c1e; border-color: #333;
  .p-nav { background: #2c2c2e; border-color: #333; } .p-body { background: #333; }
}

.system-icon {
  width: 80rpx; height: 80rpx; background: rgba(0,0,0,0.05); border-radius: 50%;
  display: flex; align-items: center; justify-content: center; color: var(--text-primary); margin-right: 20rpx;
}

.tips { padding: 0 10rpx; font-size: 24rpx; color: #999; line-height: 1.5; }
</style>
