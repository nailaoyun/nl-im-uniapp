<template>
  <view class="page-container" :class="{ dark: isDark }">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-content">
        <!-- 左侧头像 -->
        <view class="navbar-left" @click="openDrawer">
          <app-avatar
            :src="user?.avatar"
            :name="user?.name"
            :size="64"
            round
          />
        </view>

        <!-- 标题 -->
        <view class="navbar-title">{{ user?.name || '消息' }}</view>

        <!-- 右侧加号 -->
        <view class="navbar-right">
          <wd-icon name="add" size="48rpx" @click="showPlusMenu = true" />
        </view>
      </view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <wd-search
        v-model="searchKeyword"
        placeholder="搜索"
        disabled
        hide-cancel
        @click="goSearch"
      />
    </view>

    <!-- 会话列表 -->
    <scroll-view
      class="conversation-list"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-if="loading && conversations.length === 0" class="loading-state">
        <wd-loading />
        <text>加载中...</text>
      </view>

      <wd-status-tip v-else-if="conversations.length === 0" tip="暂无消息" />

      <template v-else>
        <wd-swipe-action
          v-for="item in conversations"
          :key="item.id"
        >
          <view 
            class="conversation-item" 
            :class="{ 'is-top': item.is_top, 'is-special': item.is_special_care }"
            @click="goChat(item)"
            @longpress="handleLongPress(item)"
          >
            <!-- 头像 -->
            <view class="avatar-wrap">
              <app-avatar
                :src="item.avatar"
                :name="item.name"
                :size="96"
                radius="8rpx"
                :badge="item.is_muted ? 0 : item.unread_count"
                :dot="item.is_muted && item.unread_count > 0"
              />
              <!-- 特别关心标识 -->
              <view v-if="item.is_special_care" class="special-badge">
                <wd-icon name="heart-fill" size="20rpx" color="#fff" />
              </view>
            </view>

            <!-- 内容 -->
            <view class="conversation-content">
              <view class="conversation-header">
                <view class="name-wrap">
                  <wd-icon v-if="item.is_top" name="pin" size="24rpx" class="pin-icon" />
                  <text class="conversation-name text-ellipsis" :class="{ 'special-name': item.is_special_care }">{{ item.name || '未知' }}</text>
                </view>
                <text class="conversation-time">{{ formatMessageTime(item.last_time) }}</text>
              </view>
              <view class="conversation-footer">
                <text class="conversation-msg text-ellipsis">{{ item.last_message || '' }}</text>
                <wd-icon v-if="item.is_muted" name="volume-mute" size="28rpx" class="mute-icon" />
              </view>
            </view>
          </view>

          <!-- 右滑操作 -->
          <template #right>
            <view class="swipe-actions">
              <view class="swipe-action action-top" @click="toggleTop(item)">
                {{ item.is_top ? '取消置顶' : '置顶' }}
              </view>
              <view class="swipe-action action-delete" @click="deleteConversation(item)">
                删除
              </view>
            </view>
          </template>
        </wd-swipe-action>
      </template>
    </scroll-view>

    <!-- 加号菜单 -->
    <wd-action-sheet
      v-model="showPlusMenu"
      :actions="plusMenuActions"
      @select="onPlusMenuSelect"
    />

    <!-- 会话操作菜单 -->
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
      custom-style="width: 70%; height: 100%; z-index: 1000;"
      :z-index="1000"
    >
      <view class="drawer-content">
        <!-- 用户信息 -->
        <view class="drawer-header">
          <app-avatar
            :src="user?.avatar"
            :name="user?.name"
            :size="120"
            round
          />
          <text class="drawer-name">{{ user?.name || '未登录' }}</text>
          <text class="drawer-desc">{{ user?.desc || '这个人很懒，什么都没写' }}</text>
        </view>

        <!-- 菜单列表 -->
        <view class="drawer-menu">
          <wd-cell title="个人资料" icon="user" is-link @click="goProfile" />
          <wd-cell title="设置" icon="setting" is-link @click="goSettings" />
          <wd-cell title="深色模式" icon="picture" :value="themeText" is-link @click="goTheme" />
        </view>

        <!-- 退出登录 -->
        <view class="drawer-footer">
          <wd-button type="error" block plain @click="logout">退出登录</wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- Toast 组件 -->
    <wd-toast />
    <wd-message-box />
    
    <!-- 自定义 TabBar -->
    <app-tab-bar current="messages" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAuthStore, useConversationStore } from '@/stores'
import { useTheme } from '@/composables/useTheme'
import { formatMessageTime, generateColor } from '@/utils/format'
import { resolveImageUrl } from '@/utils/image'
import { useToast, useMessage } from 'wot-design-uni'
import * as conversationApi from '@/api/modules/conversation'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppTabBar from '@/components/common/AppTabBar.vue'
import type { Conversation } from '@/types/conversation'

const authStore = useAuthStore()
const conversationStore = useConversationStore()
const { isDark } = useTheme()

// 主题显示文本
const themeText = computed(() => {
  const mode = uni.getStorageSync('nl_im_theme_mode') || 'system'
  const texts: Record<string, string> = {
    system: '跟随系统',
    light: '浅色模式',
    dark: '深色模式'
  }
  return texts[mode] || '跟随系统'
})
const toast = useToast()
const messageBox = useMessage()

// 状态
const searchKeyword = ref('')
const showPlusMenu = ref(false)
const showDrawer = ref(false)
const refreshing = ref(false)
const showConvActions = ref(false)
const selectedConv = ref<Conversation | null>(null)

// 计算属性
const user = computed(() => authStore.user)
const conversations = computed(() => conversationStore.conversations)
const loading = computed(() => conversationStore.loading)

// 加号菜单选项
const plusMenuActions = [
  { name: '创建群聊', value: 'createGroup' },
  { name: '添加好友', value: 'addFriend' },
  { name: '扫一扫', value: 'scan' }
]

// 会话操作菜单项
const convActionItems = computed(() => {
  if (!selectedConv.value) return []
  const conv = selectedConv.value
  const isGroup = conv.is_group || conv.type === 2
  
  const items: any[] = [
    { name: conv.is_top ? '取消置顶' : '置顶会话', value: 'toggleTop' },
    { name: conv.is_muted ? '开启提醒' : '消息免打扰', value: 'toggleMute' }
  ]
  
  // 私聊才显示特别关心
  if (!isGroup) {
    items.push({ name: conv.is_special_care ? '取消特别关心' : '特别关心', value: 'toggleSpecial' })
  }
  
  // 有未读消息时显示标记已读
  if (conv.unread_count && conv.unread_count > 0) {
    items.push({ name: '标记已读', value: 'markRead' })
  }
  
  items.push({ name: '删除会话', value: 'delete', color: '#fa5151' })
  
  return items
})

// 生命周期
onMounted(() => {
  loadData()
})

onShow(() => {
  loadData()
})

// 方法
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

function goSearch() {
  uni.navigateTo({ url: '/pages/search/index' })
}

function goChat(item: Conversation) {
  conversationStore.clearUnread(item.target_id)
  uni.navigateTo({
    url: `/pages/chat/index?roomId=${item.room_id || ''}&targetId=${item.target_id}&name=${encodeURIComponent(item.name || '')}&avatar=${encodeURIComponent(item.avatar || '')}`
  })
}

// 长按会话
function handleLongPress(item: Conversation) {
  selectedConv.value = item
  showConvActions.value = true
}

// 会话操作菜单选择
async function onConvActionSelect(action: { value: string }) {
  if (!selectedConv.value) return
  const conv = selectedConv.value
  
  switch (action.value) {
    case 'toggleTop':
      await toggleTop(conv)
      break
    case 'toggleMute':
      await toggleMute(conv)
      break
    case 'toggleSpecial':
      await toggleSpecialCare(conv)
      break
    case 'markRead':
      await markAsRead(conv)
      break
    case 'delete':
      await deleteConversation(conv)
      break
  }
  showConvActions.value = false
}

// 置顶/取消置顶
async function toggleTop(item: Conversation) {
  try {
    const newValue = !item.is_top
    await conversationApi.updateConversation({
      target_id: item.target_id,
      is_top: newValue
    })
    item.is_top = newValue
    conversationStore.sortConversations()
    toast.success(newValue ? '已置顶' : '已取消置顶')
  } catch (e) {
    toast.error('操作失败')
  }
}

// 免打扰
async function toggleMute(item: Conversation) {
  try {
    const newValue = !item.is_muted
    await conversationApi.updateConversation({
      target_id: item.target_id,
      is_muted: newValue
    })
    item.is_muted = newValue
    toast.success(newValue ? '已开启免打扰' : '已开启提醒')
  } catch (e) {
    toast.error('操作失败')
  }
}

// 特别关心
async function toggleSpecialCare(item: Conversation) {
  try {
    const newValue = !item.is_special_care
    await conversationApi.updateConversation({
      target_id: item.target_id,
      is_special_care: newValue
    })
    item.is_special_care = newValue
    toast.success(newValue ? '已设为特别关心' : '已取消特别关心')
  } catch (e) {
    toast.error('操作失败')
  }
}

// 标记已读
async function markAsRead(item: Conversation) {
  try {
    await conversationStore.clearUnread(item.target_id)
    toast.success('已标记为已读')
  } catch (e) {
    toast.error('操作失败')
  }
}

// 删除会话
async function deleteConversation(item: Conversation) {
  try {
    await messageBox.confirm({
      title: '提示',
      msg: '确定删除该会话吗？'
    })
    await conversationApi.deleteConversation(item.target_id)
    // 从本地列表移除
    const index = conversationStore.conversations.findIndex(c => c.id === item.id)
    if (index > -1) {
      conversationStore.conversations.splice(index, 1)
    }
    toast.success('已删除')
  } catch (e: any) {
    if (e !== 'cancel') {
      toast.error('删除失败')
    }
  }
}

function onPlusMenuSelect(item: { name: string; value: string }) {
  showPlusMenu.value = false
  switch (item.value) {
    case 'createGroup':
      uni.navigateTo({ url: '/pages/group/create' })
      break
    case 'addFriend':
      uni.navigateTo({ url: '/pages/contact/add' })
      break
    case 'scan':
      uni.scanCode({
        success: (res) => {
          console.log('扫码结果:', res.result)
          toast.show('扫码成功')
        },
        fail: () => {
          toast.error('扫码失败')
        }
      })
      break
  }
}

function openDrawer() {
  showDrawer.value = true
}

function goProfile() {
  showDrawer.value = false
  uni.navigateTo({ url: '/pages/profile/index' })
}

function goSettings() {
  showDrawer.value = false
  uni.navigateTo({ url: '/pages/settings/index' })
}

function goTheme() {
  showDrawer.value = false
  uni.navigateTo({ url: '/pages/settings/theme' })
}

async function logout() {
  try {
    await messageBox.confirm({
      title: '提示',
      msg: '确定要退出登录吗？'
    })
    showDrawer.value = false
    authStore.logout()
  } catch {
    // 取消
  }
}
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: var(--bg-page);
}

// 自定义导航栏
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--nav-bg);
  padding-top: var(--status-bar-height, 0);

  .navbar-content {
    display: flex;
    align-items: center;
    height: 88rpx;
    padding: 0 30rpx;
  }

  .navbar-left {
    margin-right: 20rpx;
  }

  .navbar-title {
    flex: 1;
    font-size: 36rpx;
    font-weight: 600;
    color: var(--text-primary);
  }

  .navbar-right {
    color: var(--text-primary);
  }
}

// 搜索栏
.search-bar {
  position: fixed;
  top: calc(88rpx + var(--status-bar-height, 0));
  left: 0;
  right: 0;
  z-index: 99;
  padding: 10rpx 20rpx;
  background: var(--nav-bg);
}

// 会话列表
.conversation-list {
  position: fixed;
  top: calc(88rpx + 80rpx + var(--status-bar-height, 0));
  left: 0;
  right: 0;
  bottom: calc(100rpx + env(safe-area-inset-bottom));
  background: var(--bg-content);
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 24rpx 30rpx;
  background: var(--bg-content);
  border-bottom: 1rpx solid var(--divider-color);

  &:active {
    background: var(--bg-hover);
  }

  &.is-top {
    background: rgba(var(--color-primary-rgb, 99, 102, 241), 0.05);
  }

  &.is-special {
    .conversation-name {
      color: #ec4899;
    }
  }
}

.avatar-wrap {
  position: relative;
  margin-right: 24rpx;

  .special-badge {
    position: absolute;
    bottom: -4rpx;
    right: -4rpx;
    width: 32rpx;
    height: 32rpx;
    background: #ec4899;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2rpx solid var(--bg-content);
  }
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;

  &.avatar-sm {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    font-size: 28rpx;
  }

  &.avatar-md {
    width: 96rpx;
    height: 96rpx;
    border-radius: 8rpx;
    font-size: 36rpx;
  }

  &.avatar-lg {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    font-size: 48rpx;
  }
}

.unread-badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
}

.unread-dot {
  position: absolute;
  top: 0;
  right: 0;
  width: 16rpx;
  height: 16rpx;
  background: var(--color-primary);
  border-radius: 50%;
}

.conversation-content {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.name-wrap {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;

  .pin-icon {
    color: var(--color-primary);
    margin-right: 8rpx;
    flex-shrink: 0;
  }
}

.conversation-name {
  flex: 1;
  font-size: 32rpx;
  color: var(--text-primary);
  font-weight: 500;

  &.special-name {
    color: #ec4899;
  }
}

.conversation-time {
  font-size: 24rpx;
  color: var(--text-tertiary);
  margin-left: 16rpx;
}

.conversation-footer {
  display: flex;
  align-items: center;
}

.conversation-msg {
  flex: 1;
  font-size: 28rpx;
  color: var(--text-secondary);
}

.mute-icon {
  color: var(--text-tertiary);
  margin-left: 8rpx;
}

// 滑动操作
.swipe-actions {
  display: flex;
  height: 100%;
}

.swipe-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 150rpx;
  height: 100%;
  color: #fff;
  font-size: 28rpx;

  &.action-top {
    background: #c8c8c8;
  }

  &.action-delete {
    background: var(--color-danger);
  }
}

// 抽屉
.drawer-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
  padding-bottom: env(safe-area-inset-bottom);
}

.drawer-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 30rpx 40rpx;
  padding-top: calc(40rpx + var(--status-bar-height, 44px));
  background: var(--bg-content);
}

.drawer-name {
  margin-top: 20rpx;
  font-size: 36rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.drawer-desc {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: var(--text-secondary);
}

.drawer-menu {
  flex: 1;
  margin-top: 20rpx;
  background: var(--bg-content);
}

.drawer-footer {
  padding: 30rpx;
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
}

// 加载和空状态
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx;
  color: var(--text-tertiary);
  gap: 20rpx;
}
</style>
