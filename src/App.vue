<script setup lang="ts">
import { onLaunch, onShow } from '@dcloudio/uni-app'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore, useConversationStore } from '@/stores'
import { wsManager } from '@/api/websocket'
import type { ChatMessage } from '@/types/api'

const { initTheme } = useTheme()
const authStore = useAuthStore()
const conversationStore = useConversationStore()

// 全局消息处理器
function handleGlobalMessage(message: ChatMessage) {
  // 忽略信令消息
  if (message.message_type === 6) return

  // 更新会话列表
  const isSelf = message.sender_user_id === authStore.user?.id
  conversationStore.handleMessageUpdate(message, isSelf, false)
}

// 初始化 WebSocket 连接
async function initWebSocket() {
  const userId = authStore.user?.id
  if (!userId) return

  try {
    await wsManager.connect(userId)
    // 注册全局消息处理器
    wsManager.onMessage(handleGlobalMessage)
    // 群通话信令监听器已移至 App.ku.vue 初始化
    console.log('✅ WebSocket 全局初始化成功')
  } catch (error) {
    console.error('WebSocket 初始化失败:', error)
  }
}

onLaunch(() => {
  console.log('App Launch')
  // 初始化主题
  initTheme()
})

onShow(async () => {
  console.log('App Show')
  // 检查登录状态
  const isAuth = await authStore.checkAuth()

  // 如果已登录，初始化 WebSocket
  if (isAuth && authStore.user?.id) {
    initWebSocket()
  }
})
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/common.scss';

/* 移除全局硬编码 padding，交由各页面 nav-bar 处理 */
#app {
  /* padding-top: calc(var(--status-bar-height) + 40rpx); REMOVED */
}

/* 全局样式 */
page {
  background-color: var(--bg-page);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 28rpx;
  line-height: 1.5;

  // wot-design-uni 主题色覆盖 (使用 CSS 变量)
  --wot-color-theme: var(--color-primary);
  --wot-color-success: var(--color-success);
  --wot-color-danger: var(--color-danger);
  --wot-color-warning: var(--color-warning);
}

/* 暗色模式下的 wot-design-uni 组件适配 */
page.dark,
.dark,
html.dark,
body.dark {
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
