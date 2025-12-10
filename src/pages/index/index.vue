<template>
  <wd-config-provider :theme="isDark ? 'dark' : 'light'">
    <view class="page-container" :class="{ dark: isDark }">

      <!-- 1. 沉浸式导航栏 -->
      <view class="custom-navbar">
        <view class="navbar-bg"></view>
        <view class="navbar-content">
          <view class="nav-left-group" @click="openDrawer">
            <app-avatar
                :src="user?.avatar"
                :name="user?.name"
                :size="76"
                round
                custom-style="border: 2rpx solid var(--border-subtle);"
            />
            <view class="nav-info">
              <text class="nav-title">{{ user?.name || '消息' }}</text>
              <view class="online-tag" v-if="!loading">
                <view class="dot"></view>在线
              </view>
            </view>
          </view>

          <view class="nav-right">
            <view class="icon-btn" @click="showPlusMenu = true">
              <wd-icon name="add" size="52rpx" color="var(--text-primary)" />
            </view>
          </view>
        </view>
      </view>

      <!-- 2. 搜索栏 -->
      <view class="search-wrapper">
        <view class="search-inner" @click="goSearch">
          <wd-icon name="search" size="32rpx" color="var(--text-tertiary)" />
          <text class="search-placeholder">搜索</text>
        </view>
      </view>

      <!-- 3. 会话列表 -->
      <scroll-view
          class="conversation-list"
          scroll-y
          :refresher-enabled="true"
          :refresher-triggered="refreshing"
          @refresherrefresh="onRefresh"
      >
        <view v-if="loading && conversations.length === 0" class="loading-state">
          <wd-loading size="50rpx" color="var(--color-primary)" />
          <text>连接中...</text>
        </view>

        <wd-status-tip
            v-else-if="conversations.length === 0"
            image="message"
            tip="暂无消息，开始聊天吧"
        />

        <template v-else>
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
              <view class="avatar-wrap">
                <app-avatar
                    :src="item.avatar"
                    :name="item.name"
                    :size="104"
                    radius="20rpx"
                    :badge="item.is_muted ? 0 : item.unread_count"
                    :dot="item.is_muted && item.unread_count > 0"
                />
                <view v-if="item.is_special_care" class="special-badge-wrap">
                  <wd-icon name="heart-fill" size="20rpx" color="#fff" />
                </view>
              </view>

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

            <template #right>
              <view class="swipe-actions">
                <view class="action-btn top" @click.stop="toggleTop(item)">
                  <wd-icon name="pin" size="40rpx" />
                </view>
                <view class="action-btn delete" @click.stop="deleteConversation(item)">
                  <wd-icon name="delete" size="40rpx" />
                </view>
              </view>
            </template>
          </wd-swipe-action>
        </template>

        <view class="safe-area-spacer"></view>
      </scroll-view>

      <!-- 弹窗组件 -->
      <wd-action-sheet
          v-model="showPlusMenu"
          :actions="plusMenuActions"
          @select="onPlusMenuSelect"
          :z-index="9999"
      />

      <wd-action-sheet
          v-model="showConvActions"
          :actions="convActionItems"
          @select="onConvActionSelect"
          cancel-text="取消"
          :z-index="9999"
      />

      <!-- 侧边抽屉 -->
      <wd-popup
          v-model="showDrawer"
          position="left"
          custom-style="width: 75%; height: 100%; background: var(--bg-surface);"
          :z-index="10000"
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
      <wd-message-box :z-index="11000" />
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
  { name: '添加好友.html', value: 'addFriend' },
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
async function onConvActionSelect(event: any) {
  // Wot-UI设计 select 事件通常返回 { item, index }，或者直接是 detail 对象
  // 防御性获取 item
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

// 修复：正确处理 select 事件参数
function onPlusMenuSelect(event: any) {
  showPlusMenu.value = false
  // WotUI 的 ActionSheet select 事件参数结构可能是 { item: {...} }
  // 我们兼容直接传 item 和传 event.item 的情况
  const item = event.item || event

  console.log('Selected menu item:', item) // 调试日志

  if (item && item.value === 'createGroup') {
    uni.navigateTo({ url: '/pages/group/create' })
  } else if (item && item.value === 'addFriend') {
    uni.navigateTo({ url: '/pages/contact/add' })
  } else if (item && item.value === 'scan') {
    uni.scanCode({ success: () => toast.show('扫码成功'), fail: () => toast.error('扫码失败') })
  }
}

function openDrawer() { showDrawer.value = true }
function goProfile() { showDrawer.value = false; uni.navigateTo({ url: '/pages/profile/index' }) }
function goSettings() { showDrawer.value = false; uni.navigateTo({ url: '/pages/settings/index' }) }
function goTheme() { showDrawer.value = false; uni.navigateTo({ url: '/pages/settings/theme' }) }
async function logout() {
  try { await messageBox.confirm({ title: '提示', msg: '确定退出?' }); showDrawer.value = false; authStore.logout() } catch {}
}
</script>

<style lang="scss" scoped>
.page-container {
  --bg-page: #f7f8fa;
  --bg-surface: #ffffff;
  --bg-hover: #f5f5f5;
  --text-primary: #1d1d1f;
  --text-secondary: #86868b;
  --text-tertiary: #a1a1a6;
  --border-subtle: rgba(0,0,0,0.05);
  --nav-bg: rgba(255, 255, 255, 0.85);
  --color-brand: #4f46e5;

  min-height: 100vh;
  background: var(--bg-page);
  color: var(--text-primary);
}

.page-container.dark {
  --bg-page: #1c1c1e;
  --bg-surface: #2c2c2e;
  --bg-hover: #3a3a3c;
  --text-primary: #f2f2f7;
  --text-secondary: #aeaeb2;
  --text-tertiary: #636366;
  --border-subtle: rgba(255,255,255,0.1);
  --nav-bg: rgba(28, 28, 30, 0.85);
}

.custom-navbar {
  position: sticky; top: 0; z-index: 100;
  padding-top: var(--status-bar-height);

  .navbar-bg {
    position: absolute; inset: 0;
    background: var(--nav-bg); backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border-subtle);
  }

  .navbar-content {
    position: relative; height: 44px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 32rpx;
  }

  .nav-left-group {
    display: flex; align-items: center;
    &:active { opacity: 0.7; }

    .nav-info {
      display: flex; flex-direction: column; justify-content: center;
      margin-left: 16rpx;
      .nav-title { font-size: 34rpx; font-weight: 700; color: var(--text-primary); line-height: 1.2; }
      .online-tag {
        display: flex; align-items: center; margin-top: 4rpx; font-size: 22rpx; color: #34c759;
        .dot { width: 10rpx; height: 10rpx; background: #34c759; border-radius: 50%; margin-right: 6rpx; }
      }
    }
  }

  .icon-btn {
    width: 72rpx; height: 72rpx; display: flex; align-items: center; justify-content: center; border-radius: 50%;
    &:active { background: var(--bg-hover); }
  }
}

.search-wrapper {
  background: var(--bg-page); padding: 16rpx 32rpx;
  position: sticky; top: calc(44px + var(--status-bar-height)); z-index: 99;
}
.search-inner {
  height: 72rpx; background: var(--bg-surface); border-radius: 16rpx;
  display: flex; align-items: center; justify-content: center; gap: 12rpx;
  .search-placeholder { font-size: 28rpx; color: var(--text-tertiary); }
}

.conversation-list { height: calc(100vh - 44px - var(--status-bar-height) - 104rpx); }
.conversation-item {
  display: flex; padding: 24rpx 32rpx; background: var(--bg-surface);
  transition: background-color 0.2s;
  &:active { background: var(--bg-hover); }
  &.is-top { background: var(--bg-page); }
  .content-wrap { border-bottom: 1rpx solid var(--border-subtle); }
  &:last-child .content-wrap { border-bottom: none; }
}

.avatar-wrap {
  position: relative; margin-right: 24rpx; flex-shrink: 0;
  .special-badge-wrap {
    position: absolute; bottom: -6rpx; right: -6rpx;
    background: #ec4899; border: 4rpx solid var(--bg-surface); border-radius: 50%;
    width: 36rpx; height: 36rpx; display: flex; align-items: center; justify-content: center;
  }
}

.content-wrap { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; padding-right: 4rpx; }
.row-top, .row-bottom { display: flex; align-items: center; justify-content: space-between; }
.row-top { margin-bottom: 8rpx; }
.title-box {
  display: flex; align-items: center; flex: 1;
  .pin-icon { color: var(--color-brand); margin-right: 8rpx; transform: rotate(45deg); }
  .name { font-size: 32rpx; font-weight: 600; color: var(--text-primary); &.special-text { color: #ec4899; } }
}
.time { font-size: 24rpx; color: var(--text-tertiary); margin-left: 16rpx; font-feature-settings: "tnum"; }
.msg-preview { font-size: 28rpx; color: var(--text-secondary); flex: 1; }

.swipe-actions { display: flex; height: 100%; }
.action-btn {
  width: 140rpx; height: 100%; display: flex; align-items: center; justify-content: center; color: #fff;
  &.top { background: #4f46e5; } &.delete { background: #ef4444; }
}

.drawer-container { height: 100%; display: flex; flex-direction: column; position: relative; overflow: hidden; background: var(--bg-surface); }
.drawer-header-bg {
  position: absolute; top: 0; left: 0; width: 100%; height: 300rpx;
  background: linear-gradient(135deg, var(--color-brand), rgba(79, 70, 229, 0.2)); opacity: 0.1; z-index: 0;
}
.drawer-info {
  position: relative; z-index: 1; padding: 100rpx 40rpx 60rpx; display: flex; flex-direction: column;
  .drawer-username { font-size: 40rpx; font-weight: 700; margin-top: 24rpx; color: var(--text-primary); }
  .drawer-bio { font-size: 26rpx; color: var(--text-secondary); margin-top: 12rpx; }
}
.drawer-menu-list { flex: 1; background: var(--bg-surface); }
.drawer-footer-btn { padding: 40rpx; padding-bottom: calc(40rpx + env(safe-area-inset-bottom)); }
.safe-area-spacer { height: 150rpx; }
.loading-state { padding-top: 200rpx; display: flex; flex-direction: column; align-items: center; color: var(--text-tertiary); gap: 20rpx; font-size: 26rpx; }
</style>
