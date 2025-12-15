<template>
  <wd-config-provider :theme="isDark ? 'dark' : 'light'">
    <view class="page-container" :class="{ dark: isDark }">

      <!-- 1. 顶部导航栏 (与设计稿完全一致) -->
      <view class="custom-navbar">
        <view class="navbar-bg"></view>
        <view class="navbar-content">
          <!-- 左侧: 头像 + 标题 -->
          <view class="nav-left" @click="openDrawer">
            <view class="avatar-container">
              <app-avatar
                :src="user?.avatar"
                :name="user?.name"
                :size="72"
                radius="16rpx"
              />
              <view class="online-dot" v-if="!loading"></view>
            </view>
            <text class="nav-title">消息</text>
          </view>

          <!-- 右侧: 加号按钮 -->
          <view class="nav-right">
            <view class="icon-btn-circle" @click="showPlusMenu = true">
              <!-- #ifdef H5 -->
              <svg class="plus-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <!-- #endif -->
              <!-- #ifdef MP-WEIXIN -->
              <wd-icon name="add" size="44rpx" />
              <!-- #endif -->
            </view>
          </view>
        </view>
      </view>

      <!-- 3. 会话列表 -->
      <scroll-view
          class="conversation-list custom-scrollbar"
          scroll-y
          :refresher-enabled="true"
          :refresher-triggered="refreshing"
          @refresherrefresh="onRefresh"
      >

        <!-- 2. 搜索栏 (扁平化设计) -->
        <view class="search-wrapper">
          <view class="search-bar" @click="goSearch">
            <!-- #ifdef H5 -->
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <!-- #endif -->
            <!-- #ifdef MP-WEIXIN -->
            <wd-icon name="search" size="32rpx" custom-class="search-icon-mp" />
            <!-- #endif -->
            <input
                type="text"
                class="search-input"
                placeholder="搜索"
                disabled
            />
          </view>
        </view>
        <view v-if="loading && conversations.length === 0" class="loading-state">
          <wd-loading size="50rpx" color="var(--color-primary)" />
          <text>连接中...</text>
        </view>

        <view v-else-if="conversations.length === 0" class="empty-state">
          <!-- #ifdef H5 -->
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <line x1="9" y1="10" x2="15" y2="10"/>
          </svg>
          <!-- #endif -->
          <!-- #ifdef MP-WEIXIN -->
          <wd-icon name="chat" size="120rpx" color="#9ca3af" custom-class="empty-icon-mp" />
          <!-- #endif -->
          <text class="empty-text">暂无消息</text>
        </view>

        <template v-else>
          <wd-swipe-action
              v-for="(item, index) in conversations"
              :key="item.id"
              :disabled="false"
          >
            <view
                class="conversation-item"
                :class="{ 'is-top': item.is_top }"
                :style="{ animationDelay: `${index * 30}ms` }"
                @click="goChat(item)"
                @longpress="handleLongPress(item)"
            >
              <!-- 头像 -->
              <view class="avatar-wrap">
                <app-avatar
                  :src="item.avatar"
                  :name="item.name"
                  :size="100"
                  radius="20rpx"
                />
                <!-- 在线状态点 (单聊时显示) -->
                <view v-if="item.is_online && !item.is_group" class="online-indicator"></view>
                <!-- 未读红点/数字 -->
                <view v-if="!item.is_muted && item.unread_count > 0" class="unread-badge">
                  {{ item.unread_count > 99 ? '99+' : item.unread_count }}
                </view>
                <view v-else-if="item.is_muted && item.unread_count > 0" class="unread-dot"></view>
              </view>

              <!-- 内容区 -->
              <view class="content-wrap">
                <view class="row-top">
                  <text class="name text-ellipsis" :class="{ 'special-name': item.is_special_care }">
                    {{ item.name || '未知' }}
                  </text>
                  <text class="time">{{ formatMessageTime(item.last_time) }}</text>
                </view>
                <view class="row-bottom">
                  <text class="msg-preview text-ellipsis">{{ item.last_message || '暂无消息' }}</text>
                  <!-- #ifdef H5 -->
                  <svg v-if="item.is_muted" class="mute-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                    <line x1="23" y1="9" x2="17" y2="15"/>
                    <line x1="17" y1="9" x2="23" y2="15"/>
                  </svg>
                  <!-- #endif -->
                  <!-- #ifdef MP-WEIXIN -->
                  <wd-icon v-if="item.is_muted" name="mute" size="28rpx" color="#9ca3af" />
                  <!-- #endif -->
                </view>
              </view>
            </view>

            <template #right>
              <view class="swipe-actions">
                <view class="action-btn top" @click.stop="toggleTop(item)">
                  <!-- #ifdef H5 -->
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
                  </svg>
                  <!-- #endif -->
                  <!-- #ifdef MP-WEIXIN -->
                  <wd-icon name="top" size="40rpx" color="#fff" />
                  <!-- #endif -->
                </view>
                <view class="action-btn delete" @click.stop="deleteConversation(item)">
                  <!-- #ifdef H5 -->
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  <!-- #endif -->
                  <!-- #ifdef MP-WEIXIN -->
                  <wd-icon name="delete" size="40rpx" color="#fff" />
                  <!-- #endif -->
                </view>
              </view>
            </template>
          </wd-swipe-action>
        </template>

        <view class="safe-area-spacer"></view>
      </scroll-view>

      <!-- 加号菜单 -->
      <plus-menu
          v-model="showPlusMenu"
          @select="onPlusMenuSelect"
      />

      <!-- 长按操作菜单 -->
      <wd-action-sheet
          v-model="showConvActions"
          :actions="convActionItems"
          @select="onConvActionSelect"
          cancel-text="取消"
          :z-index="9999"
      />

      <!-- 侧边抽屉 -->
      <app-drawer
          v-model="showDrawer"
          @logout="logout"
      />

      <wd-toast />
      <wd-message-box :z-index="11000" />
      <app-tab-bar current="messages" />
      
      <!-- 全局通话组件 -->
      <global-call-provider />
    </view>
  </wd-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAuthStore, useConversationStore } from '@/stores'
import { useTheme } from '@/composables/useTheme'
import { formatMessageTime } from '@/utils/format'
import { resolveImageUrl } from '@/utils/image'
import { useToast, useMessage } from 'wot-design-uni'
import * as conversationApi from '@/api/modules/conversation'
import AppTabBar from '@/components/common/AppTabBar.vue'
import AppDrawer from '@/components/common/AppDrawer.vue'
import PlusMenu from '@/components/common/PlusMenu.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import GlobalCallProvider from '@/components/call/GlobalCallProvider.vue'
import type { Conversation } from '@/types/conversation'

const authStore = useAuthStore()
const conversationStore = useConversationStore()
const { isDark } = useTheme()

const toast = useToast()
const messageBox = useMessage()
const showPlusMenu = ref(false)
const showDrawer = ref(false)
const refreshing = ref(false)
const showConvActions = ref(false)
const selectedConv = ref<Conversation | null>(null)

const user = computed(() => authStore.user)
const conversations = computed(() => conversationStore.conversations)
const loading = computed(() => conversationStore.loading)

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
  items.push({ name: '删除会话', value: 'delete', color: '#ef4444' })
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

async function toggleTop(item: Conversation) {
  try {
    await conversationApi.updateConversation({ target_id: item.target_id, is_top: !item.is_top })
    item.is_top = !item.is_top
    conversationStore.sortConversations()
    toast.success(item.is_top ? '已置顶' : '已取消置顶')
  } catch (e) {
    toast.error('操作失败')
  }
}

async function onConvActionSelect(event: any) {
  const action = event.item || event
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

async function deleteConversation(item: Conversation) {
  try {
    await messageBox.confirm({ title: '提示', msg: '确定删除该会话吗？' })
    await conversationApi.deleteConversation(item.target_id)
    const index = conversationStore.conversations.findIndex(c => c.id === item.id)
    if (index > -1) conversationStore.conversations.splice(index, 1)
    toast.success('已删除')
  } catch (e: any) { if(e !== 'cancel') toast.error('删除失败') }
}

function onPlusMenuSelect(key: string) {
  if (key === 'createGroup') {
    uni.navigateTo({ url: '/pages/group/create' })
  } else if (key === 'addFriend') {
    uni.navigateTo({ url: '/pages/contact/add' })
  } else if (key === 'scan') {
    uni.scanCode({ success: () => toast.show('扫码成功'), fail: () => toast.error('扫码失败') })
  }
}

function openDrawer() { showDrawer.value = true }

async function logout() {
  try {
    await messageBox.confirm({ title: '提示', msg: '确定退出?' })
    showDrawer.value = false
    authStore.logout()
  } catch {}
}
</script>

<style lang="scss" scoped>
// ==========================================
// 页面容器 - 浅色模式变量 (与设计稿完全一致)
// ==========================================
.page-container {
  --bg-page: #ffffff;           // 页面背景
  --bg-surface: #ffffff;        // 卡片背景
  --bg-hover: #f9fafb;          // gray-50 (设计稿: 会话项悬浮)
  --bg-top: rgba(249, 250, 251, 0.7); // gray-50/70 (设计稿: 会话置顶背景)
  --text-primary: #1f2937;      // gray-900 (设计稿: 会话名称)
  --text-secondary: #6b7280;    // gray-500 (设计稿: 会话消息)
  --text-tertiary: #9ca3af;     // gray-400 (设计稿: 会话时间)
  --text-placeholder: #9ca3af;  // gray-400 (设计稿: 搜索placeholder)
  --border-color: rgba(0, 0, 0, 0.05);
  --nav-bg: rgba(255, 255, 255, 0.9);
  --color-brand: #4F46E5;       // indigo-600
  --search-bg: #f1f1f1;         // gray-100
  --search-focus: rgba(79, 70, 229, 0.1);

  min-height: 100vh;
  background: var(--bg-page);
  color: var(--text-primary);
}

// ==========================================
// 深色模式 - Warm Stone 暖色调 (与设计稿完全一致)
// ==========================================
.page-container.dark {
  --bg-page: #1c1917;           // warm-900
  --bg-surface: #1c1917;        // warm-900
  --bg-hover: #292524;          // warm-800 (设计稿: 会话项悬浮)
  --bg-top: rgba(41, 37, 36, 0.3); // warm-800/30 (设计稿: 会话置顶背景)
  --text-primary: #f5f5f4;      // warm-100 (设计稿: 会话名称)
  --text-secondary: #a8a29e;    // warm-400 (设计稿: 会话消息)
  --text-tertiary: #78716c;     // warm-500 (设计稿: 会话时间)
  --text-placeholder: #57534e;  // warm-600 (设计稿: 搜索placeholder)
  --border-color: #44403c;      // warm-700
  --nav-bg: rgba(28, 25, 23, 0.9);
  --color-brand: #f97316;       // orange-500
  --search-bg: #292524;         // warm-800
  --search-focus: rgba(249, 115, 22, 0.1);
}

// ==========================================
// 动画
// ==========================================
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

.custom-scrollbar {
  &::-webkit-scrollbar { display: none; }
  -ms-overflow-style: none;
  scrollbar-width: none;
}

// ==========================================
// 导航栏 (与设计稿一致)
// ==========================================
.custom-navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  padding-top: calc(var(--status-bar-height, 0) + var(--mp-safe-top, 0px));
  // 确保没有任何边框
  border: none;

  .navbar-bg {
    position: absolute;
    inset: 0;
    background: var(--nav-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: none;
  }

  .navbar-content {
    position: relative;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 40rpx 16rpx;
  }
}

// 左侧: 头像 + 标题
.nav-left {
  display: flex;
  align-items: center;
  gap: 24rpx;
  cursor: pointer;
  transition: opacity 0.15s;

  &:active {
    opacity: 0.7;
  }
}

.avatar-container {
  position: relative;
  width: 72rpx;
  height: 72rpx;
}

.nav-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 16rpx;
  object-fit: cover;
  background: var(--search-bg);
  box-shadow: 0 0 0 2rpx rgba(0, 0, 0, 0.05);

  .dark & {
    box-shadow: 0 0 0 2rpx rgba(255, 255, 255, 0.1);
  }
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-brand);
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 600;
}

.online-dot {
  position: absolute;
  bottom: -4rpx;
  right: -4rpx;
  width: 24rpx;
  height: 24rpx;
  background: #10b981;
  border: 4rpx solid var(--bg-surface);
  border-radius: 50%;
}

.nav-title {
  font-size: 42rpx;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5rpx;
}

// 右侧: 加号按钮
.nav-right {
  display: flex;
  align-items: center;
}

.icon-btn-circle {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--search-bg);
  border-radius: 50%;
  transition: all 0.15s;

  &:active {
    background: var(--bg-hover);
    transform: scale(0.95);
  }

  .plus-icon {
    width: 40rpx;
    height: 40rpx;
    color: var(--text-secondary);
  }
}

// ==========================================
// 搜索栏 (扁平化设计)
// ==========================================
.search-wrapper {
  padding: 0 40rpx 16rpx;
  background: var(--bg-page);
}

.search-bar {
  position: relative;
  height: 80rpx;
  background: var(--search-bg);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
  transition: all 0.2s;

  &:active {
    background: var(--bg-hover);
  }
}

.search-icon {
  width: 32rpx;
  height: 32rpx;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 30rpx;
  color: var(--text-primary);
  margin-left: 16rpx;

  &::placeholder {
    color: var(--text-placeholder);
  }
}

// ==========================================
// 会话列表
// ==========================================
.conversation-list {
  height: calc(100vh - 88rpx - var(--status-bar-height, 0) - 96rpx - 168rpx);
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
  color: var(--text-tertiary);
  opacity: 0.6;

  .empty-icon {
    width: 96rpx;
    height: 96rpx;
    margin-bottom: 24rpx;
  }

  .empty-text {
    font-size: 28rpx;
  }
}

// 加载状态
.loading-state {
  padding-top: 200rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--text-tertiary);
  gap: 20rpx;
  font-size: 26rpx;
}

// ==========================================
// 会话条目 (与设计稿完全一致)
// ==========================================
.conversation-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 28rpx 40rpx;
  gap: 24rpx;
  background: var(--bg-surface);
  transition: background-color 0.15s;
  animation: fadeInUp 0.4s ease-out forwards;
  opacity: 0;

  &:active {
    background: var(--bg-hover);
  }

  &.is-top {
    background: var(--bg-top);
  }
}

// 头像区域
.avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.conv-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 20rpx;
  object-fit: cover;
  background: var(--search-bg);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

// 未读数字徽章
.unread-badge {
  position: absolute;
  top: -12rpx;
  right: -12rpx;
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 8rpx;
  background: #ef4444;
  color: #ffffff;
  font-size: 20rpx;
  font-weight: 700;
  line-height: 32rpx;
  text-align: center;
  border-radius: 32rpx;
  white-space: nowrap;
  box-shadow: 0 0 0 4rpx var(--bg-surface);
}

// 未读红点 (免打扰)
.unread-dot {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 20rpx;
  height: 20rpx;
  background: #ef4444;
  border-radius: 50%;
  box-shadow: 0 0 0 4rpx var(--bg-surface);
}

// 在线状态指示器
.online-indicator {
  position: absolute;
  bottom: 4rpx;
  right: 4rpx;
  width: 24rpx;
  height: 24rpx;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 0 4rpx var(--bg-surface);
}

// 内容区域
.content-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-bottom: 28rpx;
  margin-bottom: -28rpx;
  margin-left: 8rpx;

  .conversation-item:last-child & {
    border-bottom: none;
  }
}

.row-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.row-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.name {
  font-size: 32rpx;
  font-weight: 500;
  color: var(--text-primary);
  flex: 1;
  min-width: 0;

  &.special-name {
    color: #ec4899;

    .dark & {
      color: #f472b6;
    }
  }
}

.time {
  font-size: 22rpx;
  color: var(--text-tertiary);
  margin-left: 16rpx;
  flex-shrink: 0;
  font-feature-settings: "tnum";
  letter-spacing: -0.5rpx;
}

.msg-preview {
  font-size: 26rpx;
  color: var(--text-secondary);
  flex: 1;
  min-width: 0;
  padding-right: 16rpx;
}

.mute-icon {
  width: 28rpx;
  height: 28rpx;
  color: var(--text-tertiary);
  flex-shrink: 0;
  opacity: 0.6;
}

// ==========================================
// 滑动操作
// ==========================================
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

  svg {
    width: 44rpx;
    height: 44rpx;
  }

  &.top {
    background: #4F46E5;

    .dark & {
      background: #f97316;
    }
  }

  &.delete {
    background: #ef4444;
  }
}

// 底部安全区
.safe-area-spacer {
  height: 180rpx;
}

// 文本溢出省略
.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
