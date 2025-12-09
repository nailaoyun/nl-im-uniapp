<script setup lang="ts">
import { onLaunch, onShow } from '@dcloudio/uni-app'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores'

const { initTheme } = useTheme()
const authStore = useAuthStore()

onLaunch(() => {
  console.log('App Launch')
  // 初始化主题
  initTheme()
})

onShow(() => {
  console.log('App Show')
  // 检查登录状态
  authStore.checkAuth()
})
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/common.scss';

/* 全局样式 */
page {
  background-color: var(--bg-page);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 28rpx;
  line-height: 1.5;

  // wot-design-uni 主题色覆盖
  --wot-color-theme: #07c160;
  --wot-color-success: #07c160;
  --wot-color-danger: #fa5151;
  --wot-color-warning: #ffc300;
}

/* 暗色模式下的 wot-design-uni 组件适配 */
page.dark {
  // Cell
  --wot-cell-bg-color: var(--bg-content);
  --wot-cell-title-color: var(--text-primary);
  --wot-cell-label-color: var(--text-secondary);
  --wot-cell-value-color: var(--text-tertiary);
  --wot-cell-border-color: var(--border-color);

  // Input
  --wot-input-bg-color: var(--bg-content);
  --wot-input-color: var(--text-primary);
  --wot-input-placeholder-color: var(--text-placeholder);

  // Search
  --wot-search-bg-color: var(--search-bg);

  // Button
  --wot-button-normal-bg-color: var(--bg-content);
  --wot-button-normal-color: var(--text-primary);

  // Popup
  --wot-popup-bg-color: var(--bg-content);

  // ActionSheet
  --wot-action-sheet-bg-color: var(--bg-content);

  // Navbar
  --wot-navbar-bg-color: var(--nav-bg);
  --wot-navbar-title-color: var(--text-primary);
}

/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
</style>
