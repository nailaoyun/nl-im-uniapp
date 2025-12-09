<template>
  <view class="theme-page" :class="{ dark: isDark }">
    <!-- 导航栏 -->
    <app-nav-bar title="深色模式" />
    
    <wd-cell-group title="选择主题模式">
      <wd-cell
        title="跟随系统"
        center
        clickable
        @click="selectTheme('system')"
      >
        <template #icon>
          <wd-icon name="setting" size="40rpx" class="cell-icon" />
        </template>
        <template #value>
          <wd-icon v-if="currentTheme === 'system'" name="check" size="40rpx" color="var(--color-primary)" />
        </template>
      </wd-cell>
      <wd-cell
        title="浅色模式"
        center
        clickable
        @click="selectTheme('light')"
      >
        <template #icon>
          <wd-icon name="sun" size="40rpx" class="cell-icon" />
        </template>
        <template #value>
          <wd-icon v-if="currentTheme === 'light'" name="check" size="40rpx" color="var(--color-primary)" />
        </template>
      </wd-cell>
      <wd-cell
        title="深色模式"
        center
        clickable
        @click="selectTheme('dark')"
      >
        <template #icon>
          <wd-icon name="moon" size="40rpx" class="cell-icon" />
        </template>
        <template #value>
          <wd-icon v-if="currentTheme === 'dark'" name="check" size="40rpx" color="var(--color-primary)" />
        </template>
      </wd-cell>
    </wd-cell-group>

    <view class="tips">
      <text>「跟随系统」会根据系统设置自动切换深色/浅色模式</text>
    </view>

    <wd-toast />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useToast } from 'wot-design-uni'

const { isDark, setTheme: applyTheme } = useTheme()
const toast = useToast()

// 当前选中的主题模式
const currentTheme = ref<'system' | 'light' | 'dark'>('system')

onMounted(() => {
  // 从本地存储读取当前主题设置
  const saved = uni.getStorageSync('nl_im_theme_mode')
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    currentTheme.value = saved
  }
})

function selectTheme(mode: 'system' | 'light' | 'dark') {
  console.log('selectTheme called:', mode)
  currentTheme.value = mode
  uni.setStorageSync('nl_im_theme_mode', mode)
  
  // 应用主题
  if (mode === 'system') {
    // 跟随系统 - 清除手动设置，不持久化
    uni.removeStorageSync('nl_im_theme')
    let systemDark = false
    try {
      systemDark = uni.getSystemInfoSync().theme === 'dark'
    } catch (e) {
      console.log('获取系统主题失败:', e)
    }
    console.log('系统深色模式:', systemDark)
    applyTheme(systemDark, false) // 不持久化
  } else {
    console.log('设置主题:', mode === 'dark' ? '深色' : '浅色')
    applyTheme(mode === 'dark', true) // 持久化
  }
  
  const tips = {
    system: '已设置为跟随系统',
    light: '已切换为浅色模式',
    dark: '已切换为深色模式'
  }
  toast.success(tips[mode])
}
</script>

<style lang="scss" scoped>
.theme-page {
  min-height: 100vh;
  background: var(--bg-page);
}

.cell-icon {
  margin-right: 16rpx;
  color: var(--text-secondary);
}

.tips {
  padding: 30rpx;
  
  text {
    font-size: 26rpx;
    color: var(--text-tertiary);
    line-height: 1.6;
  }
}
</style>

