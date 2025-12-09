<template>
  <!--
    WotUI 最佳实践：
    使用 wd-config-provider 包裹页面以确保组件级暗黑模式生效
    custom-style 用于注入我们定义的 CSS 变量
  -->
  <wd-config-provider :theme="isDark ? 'dark' : 'light'">
    <view class="page-container" :class="{ dark: isDark }">

      <!-- 沉浸式导航栏 -->
      <view class="custom-navbar">
        <view class="navbar-bg"></view> <!-- 独立背景层用于做高斯模糊 -->
        <view class="navbar-content">
          <view class="navbar-left" @click="openDrawer">
            <app-avatar
                :src="user?.avatar"
                :name="user?.name"
                :size="72"
                round
                custom-style="border: 2rpx solid var(--border-subtle);"
            />
          </view>
          <view class="navbar-title">
            <text class="title-text">{{ user?.name || '消息' }}</text>
            <view class="online-status" v-if="!loading"></view>
          </view>
          <view class="navbar-right">
            <view class="icon-btn" @click="showPlusMenu = true">
              <wd-icon name="add" size="44rpx" />
            </view>
          </view>
        </view>
      </view>

      <!-- 搜索区域 (模拟 iOS 风格) -->
      <view class="search-wrapper">
        <view class="search-inner" @click="goSearch">
          <wd-icon name="search" size="32rpx" color="var(--text-tertiary)" />
          <text class="search-placeholder">搜索</text>
        </view>
      </view>

      <!-- 会话列表 -->
      <scroll-view
          class="conversation-list"
          scroll-y
          :refresher-enabled="true"
          :refresher-triggered="refreshing"
          @refresherrefresh="onRefresh"
      >
        <!-- 骨架屏/加载态 (优化体验) -->
        <view v-if="loading && conversations.length === 0" class="loading-state">
          <wd-loading size="60rpx" color="var(--color-primary)" />
          <text>同步消息中...</text>
        </view>

        <wd-status-tip
            v-else-if="conversations.length === 0"
            image="message"
            tip="暂无消息，开始聊天吧"
        />

        <template v-else>
          <!-- 列表渲染 -->
          <wd-swipe-action
              v-for="item in conversations"
              :key="item.id"
              :disabled="false"
          >
            <view
                class="conversation-item"
                :class="{ 'is-top': item.is_top }"
                @click="goChat(item)"
                @longpress="handleLongPress(item)"
            >
              <!-- 头像区域 -->
              <view class="avatar-wrap">
                <app-avatar
                    :src="item.avatar"
                    :name="item.name"
                    :size="104"
                    radius="16rpx"
                    :badge="item.is_muted ? 0 : item.unread_count"
                    :dot="item.is_muted && item.unread_count > 0"
                />
                <!-- 特别关心采用更现代的角标 -->
                <view v-if="item.is_special_care" class="special-badge-wrap">
                  <wd-icon name="heart-fill" size="20rpx" color="#fff" />
                </view>
              </view>

              <!-- 内容区域 -->
              <view class="content-wrap">
                <view class="row-top">
                  <view class="title-box">
                    <wd-icon v-if="item.is_top" name="pin" size="24rpx" class="pin-icon" />
                    <text class="name text-ellipsis" :class="{ 'special-text': item.is_special_care }">
                      {{ item.name || '未知' }}
                    </text>
                  </view>
                  <text class="time">{{ formatMessageTime(item.last_time) }}</text>
                </view>

                <view class="row-bottom">
                  <text class="msg-preview text-ellipsis">{{ item.last_message || '暂无消息' }}</text>
                  <wd-icon v-if="item.is_muted" name="volume-mute" size="28rpx" class="mute-icon" />
                </view>
              </view>
            </view>

            <!-- 右滑菜单 -->
            <template #right>
              <view class="swipe-actions">
                <view class="action-btn top" @click.stop="toggleTop(item)">
                  <wd-icon name="pin" size="36rpx" />
                </view>
                <view class="action-btn delete" @click.stop="deleteConversation(item)">
                  <wd-icon name="delete" size="36rpx" />
                </view>
              </view>
            </template>
          </wd-swipe-action>
        </template>

        <!-- 底部垫片 -->
        <view class="safe-area-spacer"></view>
      </scroll-view>

      <!-- 弹窗组件保持原有逻辑 -->
      <wd-action-sheet
          v-model="showPlusMenu"
          :actions="plusMenuActions"
          @select="onPlusMenuSelect"
      />

      <wd-action-sheet
          v-model="showConvActions"
          :actions="convActionItems"
          @select="onConvActionSelect"
          cancel-text="取消"
      />

      <!-- 侧边抽屉 -->
      <wd-popup
          v-model="showDrawer"
          position="left"
          custom-style="width: 75%; height: 100%; background: var(--bg-surface);"
      >
        <view class="drawer-container">
          <view class="drawer-header-bg"></view>
          <view class="drawer-info">
            <app-avatar :src="user?.avatar" :name="user?.name" :size="140" round custom-style="border: 4rpx solid var(--bg-surface);" />
            <text class="drawer-username">{{ user?.name || '请登录' }}</text>
            <text class="drawer-bio">{{ user?.desc || '编辑个签，展示你的独特个性' }}</text>
          </view>

          <view class="drawer-menu-list">
            <wd-cell-group border>
              <wd-cell title="个人资料" icon="user" is-link size="large" @click="goProfile" />
              <wd-cell title="设置" icon="setting" is-link size="large" @click="goSettings" />
              <wd-cell title="深色模式" icon="picture" :value="themeText" is-link size="large" @click="goTheme" />
            </wd-cell-group>
          </view>

          <view class="drawer-footer-btn">
            <wd-button type="info" plain block @click="logout">退出登录</wd-button>
          </view>
        </view>
      </wd-popup>

      <wd-toast />
      <wd-message-box />
      <app-tab-bar current="messages" />
    </view>
  </wd-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAuthStore, useConversationStore } from '@/stores'
import { useTheme } from '@/composables/useTheme'
import { formatMessageTime } from '@/utils/format'
import { useToast, useMessage } from 'wot-design-uni'
import * as conversationApi from '@/api/modules/conversation'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppTabBar from '@/components/common/AppTabBar.vue'
import type { Conversation } from '@/types/conversation'

const authStore = useAuthStore()
const conversationStore = useConversationStore()
const { isDark } = useTheme()

// --- 保持原有逻辑代码不变 ---
const toast = useToast()
const messageBox = useMessage()
const searchKeyword = ref('')
const showPlusMenu = ref(false)
const showDrawer = ref(false)
const refreshing = ref(false)
const showConvActions = ref(false)
const selectedConv = ref<Conversation | null>(null)

const user = computed(() => authStore.user)
const conversations = computed(() => conversationStore.conversations)
const loading = computed(() => conversationStore.loading)

const themeText = computed(() => {
  const mode = uni.getStorageSync('nl_im_theme_mode') || 'system'
  const texts: Record<string, string> = { system: '跟随系统', light: '浅色模式', dark: '深色模式' }
  return texts[mode] || '跟随系统'
})

const plusMenuActions = [
  { name: '创建群聊', value: 'createGroup' },
  { name: '添加好友', value: 'addFriend' },
  { name: '扫一扫', value: 'scan' }
]

const convActionItems = computed(() => {
  if (!selectedConv.value) return []
  const conv = selectedConv.value
  const isGroup = conv.is_group || conv.type === 2
  const items: any[] = [
    { name: conv.is_top ? '取消置顶' : '置顶会话', value: 'toggleTop' },
    { name: conv.is_muted ? '开启提醒' : '消息免打扰', value: 'toggleMute' }
  ]
  if (!isGroup) items.push({ name: conv.is_special_care ? '取消特别关心' : '特别关心', value: 'toggleSpecial' })
  if (conv.unread_count && conv.unread_count > 0) items.push({ name: '标记已读', value: 'markRead' })
  items.push({ name: '删除会话', value: 'delete', color: '#fa5151' })
  return items
})

onMounted(() => loadData())
onShow(() => loadData())

async function loadData() {
  if (!authStore.isAuthenticated) {
    uni.reLaunch({ url: '/pages/login/index' })
    return
  }
  await conversationStore.loadConversations()
}

async function onRefresh() {
  refreshing.value = true
  await conversationStore.loadConversations()
  refreshing.value = false
}

function goSearch() { uni.navigateTo({ url: '/pages/search/index' }) }
function goChat(item: Conversation) {
  conversationStore.clearUnread(item.target_id)
  uni.navigateTo({ url: `/pages/chat/index?roomId=${item.room_id || ''}&targetId=${item.target_id}&name=${encodeURIComponent(item.name || '')}&avatar=${encodeURIComponent(item.avatar || '')}` })
}
function handleLongPress(item: Conversation) { selectedConv.value = item; showConvActions.value = true }
async function onConvActionSelect(action: { value: string }) {
  if (!selectedConv.value) return
  const conv = selectedConv.value
  showConvActions.value = false
  try {
    if (action.value === 'toggleTop') {
      await conversationApi.updateConversation({ target_id: conv.target_id, is_top: !conv.is_top })
      conv.is_top = !conv.is_top
      conversationStore.sortConversations()
    } else if (action.value === 'toggleMute') {
      await conversationApi.updateConversation({ target_id: conv.target_id, is_muted: !conv.is_muted })
      conv.is_muted = !conv.is_muted
    } else if (action.value === 'toggleSpecial') {
      await conversationApi.updateConversation({ target_id: conv.target_id, is_special_care: !conv.is_special_care })
      conv.is_special_care = !conv.is_special_care
    } else if (action.value === 'markRead') {
      await conversationStore.clearUnread(conv.target_id)
    } else if (action.value === 'delete') {
      await deleteConversation(conv)
    }
  } catch(e) { toast.error('操作失败') }
}

// 提取删除逻辑
async function deleteConversation(item: Conversation) {
  try {
    await messageBox.confirm({ title: '提示', msg: '确定删除该会话吗？' })
    await conversationApi.deleteConversation(item.target_id)
    const index = conversationStore.conversations.findIndex(c => c.id === item.id)
    if (index > -1) conversationStore.conversations.splice(index, 1)
    toast.success('已删除')
  } catch (e: any) { if(e !== 'cancel') toast.error('删除失败') }
}

function onPlusMenuSelect(item: { value: string }) {
  showPlusMenu.value = false
  if(item.value === 'createGroup') uni.navigateTo({ url: '/pages/group/create' })
  else if(item.value === 'addFriend') uni.navigateTo({ url: '/pages/contact/add' })
  else if(item.value === 'scan') uni.scanCode({ success: () => toast.show('扫码成功'), fail: () => toast.error('扫码失败') })
}
function openDrawer() { showDrawer.value = true }
function goProfile() { showDrawer.value = false; uni.navigateTo({ url: '/pages/profile/index' }) }
function goSettings() { showDrawer.value = false; uni.navigateTo({ url: '/pages/settings/index' }) }
function goTheme() { showDrawer.value = false; uni.navigateTo({ url: '/pages/settings/theme' }) }
async function logout() {
  try { await messageBox.confirm({ title: '提示', msg: '确定退出?' }); showDrawer.value = false; authStore.logout() } catch {}
}
// --- 保持逻辑代码结束 ---
</script>

<style lang="scss" scoped>
/* ----- 语义化 CSS 变量定义 ----- */
.page-container {
  /* 亮色模式默认值 */
  --bg-page: #f7f8fa;
  --bg-surface: #ffffff;
  --bg-hover: #f5f5f5;
  --text-primary: #1d1d1f;
  --text-secondary: #86868b;
  --text-tertiary: #a1a1a6;
  --border-subtle: #ebedf0;
  --nav-bg: rgba(255, 255, 255, 0.85);
  --color-brand: #4f46e5;
  --color-danger: #ef4444;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);

  min-height: 100vh;
  background: var(--bg-page);
  color: var(--text-primary);
  transition: background-color 0.3s, color 0.3s;
}

/* 暗色模式覆盖 */
.page-container.dark {
  --bg-page: #000000;
  --bg-surface: #1c1c1e;
  --bg-hover: #2c2c2e;
  --text-primary: #ffffff;
  --text-secondary: #98989d;
  --text-tertiary: #636366;
  --border-subtle: #38383a;
  --nav-bg: rgba(28, 28, 30, 0.85);
  --shadow-sm: none;
}

/* ----- UI 样式重构 ----- */

/* 1. 沉浸式导航栏 */
.custom-navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  padding-top: var(--status-bar-height);

  .navbar-bg {
    position: absolute;
    inset: 0;
    background: var(--nav-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border-subtle);
  }

  .navbar-content {
    position: relative;
    height: 44px; /* iOS 标准导航高度 */
    display: flex;
    align-items: center;
    padding: 0 32rpx;
    display: flex;
    justify-content: space-between;
  }

  .navbar-title {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: 34rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8rpx;

    .online-status {
      width: 12rpx;
      height: 12rpx;
      background: #34c759;
      border-radius: 50%;
    }
  }

  .icon-btn {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    &:active { background: var(--bg-hover); }
  }
}

/* 2. 搜索框 (仿原生) */
.search-wrapper {
  background: var(--bg-page);
  padding: 16rpx 32rpx;
  position: sticky;
  top: calc(44px + var(--status-bar-height));
  z-index: 99;
}

.search-inner {
  height: 72rpx;
  background: var(--bg-surface);
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;

  .search-placeholder {
    font-size: 28rpx;
    color: var(--text-tertiary);
  }
}

/* 3. 列表区域 */
.conversation-list {
  /* 移除复杂的 calc，利用 Flex 布局或 padding */
  height: calc(100vh - 44px - var(--status-bar-height) - 104rpx); /* 减去 nav 和 search */
}

.conversation-item {
  display: flex;
  padding: 24rpx 32rpx;
  background: var(--bg-surface);
  transition: all 0.2s;

  &:active {
    background: var(--bg-hover);
  }

  &.is-top {
    background: var(--bg-page); /* 置顶颜色微调 */
  }

  /* 边框处理：只给内容区加底边框，头像不加，模仿 iOS */
  .content-wrap {
    border-bottom: 1px solid var(--border-subtle);
  }
  &:last-child .content-wrap {
    border-bottom: none;
  }
}

.avatar-wrap {
  position: relative;
  margin-right: 24rpx;
  flex-shrink: 0;

  .special-badge-wrap {
    position: absolute;
    bottom: -6rpx;
    right: -6rpx;
    background: #ec4899;
    border: 4rpx solid var(--bg-surface);
    border-radius: 50%;
    width: 36rpx;
    height: 36rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.content-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-right: 4rpx;
}

.row-top, .row-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.row-top { margin-bottom: 8rpx; }

.title-box {
  display: flex;
  align-items: center;
  flex: 1;

  .pin-icon {
    color: var(--color-brand);
    margin-right: 8rpx;
    transform: rotate(45deg); /* 让图钉更灵动 */
  }

  .name {
    font-size: 32rpx;
    font-weight: 600;
    color: var(--text-primary);

    &.special-text { color: #ec4899; }
  }
}

.time {
  font-size: 24rpx;
  color: var(--text-tertiary);
  margin-left: 16rpx;
  font-feature-settings: "tnum"; /* 等宽数字 */
}

.msg-preview {
  font-size: 28rpx;
  color: var(--text-secondary);
  flex: 1;
}

/* 4. 滑动菜单 */
.swipe-actions {
  display: flex;
  height: 100%;
}

.action-btn {
  width: 140rpx;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;

  &.top { background: #4f46e5; }
  &.delete { background: #ef4444; }
}

/* 5. 抽屉重构 */
.drawer-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.drawer-header-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 300rpx;
  background: linear-gradient(135deg, var(--color-brand), #818cf8);
  opacity: 0.1;
  z-index: 0;
}

.drawer-info {
  position: relative;
  z-index: 1;
  padding: 100rpx 40rpx 60rpx;
  display: flex;
  flex-direction: column;

  .drawer-username {
    font-size: 40rpx;
    font-weight: 700;
    margin-top: 24rpx;
    color: var(--text-primary);
  }

  .drawer-bio {
    font-size: 26rpx;
    color: var(--text-secondary);
    margin-top: 12rpx;
  }
}

.drawer-menu-list {
  flex: 1;
  background: var(--bg-surface);
}

.drawer-footer-btn {
  padding: 40rpx;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
}

.safe-area-spacer {
  height: 150rpx; /* 留出 Tabbar 空间 */
}

.loading-state {
  padding-top: 200rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--text-tertiary);
  gap: 20rpx;
  font-size: 26rpx;
}
</style>
