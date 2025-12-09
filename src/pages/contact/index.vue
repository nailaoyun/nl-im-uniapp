<template>
  <view class="page-container" :class="{ dark: isDark }">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-content">
        <view class="navbar-title">联系人</view>
        <view class="navbar-right">
          <wd-icon name="add" size="48rpx" @click="goAddFriend" />
        </view>
      </view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <wd-search
        v-model="searchKeyword"
        placeholder="搜索联系人"
        disabled
        hide-cancel
        @click="goSearch"
      />
    </view>

    <!-- 功能入口行 -->
    <view class="function-row">
      <view class="function-item" @click="goFriendRequests">
        <view class="function-icon icon-friend">
          <wd-icon name="user-add" size="36rpx" color="#fff" />
        </view>
        <text class="function-text">新朋友</text>
        <wd-badge v-if="friendRequestCount > 0" :value="friendRequestCount" class="function-badge" />
      </view>
      <view class="function-item" @click="goGroupNotify">
        <view class="function-icon icon-notify">
          <wd-icon name="bell" size="36rpx" color="#fff" />
        </view>
        <text class="function-text">群通知</text>
      </view>
    </view>

    <!-- Tab 切换 -->
    <view class="tab-bar">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <text>{{ tab.label }}</text>
      </view>
    </view>

    <!-- 内容区域 -->
    <scroll-view
      class="content-scroll"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-state">
        <wd-loading />
        <text>加载中...</text>
      </view>

      <!-- 分组 Tab -->
      <template v-else-if="activeTab === 'groups'">
        <wd-status-tip v-if="contactGroups.length === 0 && ungroupedContacts.length === 0" tip="暂无联系人" />
        <template v-else>
          <!-- 未分组 -->
          <view v-if="ungroupedContacts.length > 0" class="contact-group">
            <view class="group-header" @click="toggleCollapse(0)">
              <wd-icon 
                :name="collapsedIds.includes(0) ? 'arrow-right' : 'arrow-down'" 
                size="28rpx" 
              />
              <text class="group-name">未分组</text>
              <text class="group-count">({{ ungroupedContacts.length }})</text>
            </view>
            <view v-if="!collapsedIds.includes(0)" class="group-contacts">
              <view
                v-for="contact in ungroupedContacts"
                :key="contact.id"
                class="contact-item"
                @click="goContactDetail(contact)"
              >
                <app-avatar
                  :src="contact.user?.avatar"
                  :name="contact.remark_name || contact.user?.name"
                  :size="80"
                  radius="8rpx"
                />
                <view class="contact-info">
                  <text class="contact-name">{{ contact.remark_name || contact.user?.name || '未知' }}</text>
                  <text class="contact-desc">{{ contact.user?.desc || '' }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 自定义分组 -->
          <view
            v-for="group in contactGroups"
            :key="group.id"
            class="contact-group"
          >
            <view class="group-header" @click="toggleCollapse(group.id)">
              <wd-icon 
                :name="collapsedIds.includes(group.id) ? 'arrow-right' : 'arrow-down'" 
                size="28rpx" 
              />
              <text class="group-name">{{ group.group_name }}</text>
              <text class="group-count">({{ getGroupContacts(group.id).length }})</text>
            </view>
            <view v-if="!collapsedIds.includes(group.id)" class="group-contacts">
              <view
                v-for="contact in getGroupContacts(group.id)"
                :key="contact.id"
                class="contact-item"
                @click="goContactDetail(contact)"
              >
                <app-avatar
                  :src="contact.user?.avatar"
                  :name="contact.remark_name || contact.user?.name"
                  :size="80"
                  radius="8rpx"
                />
                <view class="contact-info">
                  <text class="contact-name">{{ contact.remark_name || contact.user?.name || '未知' }}</text>
                  <text class="contact-desc">{{ contact.user?.desc || '' }}</text>
                </view>
              </view>
            </view>
          </view>
        </template>
      </template>

      <!-- 好友 Tab (按字母分组) -->
      <template v-else-if="activeTab === 'friends'">
        <wd-status-tip v-if="contacts.length === 0" tip="暂无联系人" />
        <template v-else>
          <view
            v-for="group in alphabetGroupedContacts"
            :key="group.letter"
            class="contact-group"
          >
            <view class="group-header letter-header">
              <text class="group-name">{{ group.letter }}</text>
            </view>
            <view class="group-contacts">
              <view
                v-for="contact in group.contacts"
                :key="contact.id"
                class="contact-item"
                @click="goContactDetail(contact)"
              >
                <app-avatar
                  :src="contact.user?.avatar"
                  :name="contact.remark_name || contact.user?.name"
                  :size="80"
                  radius="8rpx"
                />
                <view class="contact-info">
                  <text class="contact-name">{{ contact.remark_name || contact.user?.name || '未知' }}</text>
                  <text class="contact-desc">{{ contact.user?.desc || '' }}</text>
                </view>
              </view>
            </view>
          </view>
        </template>
      </template>

      <!-- 群聊 Tab -->
      <template v-else-if="activeTab === 'chats'">
        <wd-status-tip v-if="groupChats.length === 0" tip="暂无群聊" />
        <template v-else>
          <!-- 我创建的群 -->
          <view v-if="createdGroups.length > 0" class="contact-group">
            <view class="group-header" @click="toggleCollapse('created')">
              <wd-icon 
                :name="collapsedIds.includes('created') ? 'arrow-right' : 'arrow-down'" 
                size="28rpx" 
              />
              <text class="group-name">我创建的群</text>
              <text class="group-count">({{ createdGroups.length }})</text>
            </view>
            <view v-if="!collapsedIds.includes('created')" class="group-contacts">
              <view
                v-for="group in createdGroups"
                :key="group.room_id"
                class="contact-item"
                @click="goGroupChat(group)"
              >
                <app-avatar
                  :src="group.room_avatar"
                  :name="group.room_name || '群聊'"
                  :size="80"
                  radius="8rpx"
                />
                <view class="contact-info">
                  <text class="contact-name">{{ group.room_name || '未命名群聊' }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 我管理的群 -->
          <view v-if="managedGroups.length > 0" class="contact-group">
            <view class="group-header" @click="toggleCollapse('managed')">
              <wd-icon 
                :name="collapsedIds.includes('managed') ? 'arrow-right' : 'arrow-down'" 
                size="28rpx" 
              />
              <text class="group-name">我管理的群</text>
              <text class="group-count">({{ managedGroups.length }})</text>
            </view>
            <view v-if="!collapsedIds.includes('managed')" class="group-contacts">
              <view
                v-for="group in managedGroups"
                :key="group.room_id"
                class="contact-item"
                @click="goGroupChat(group)"
              >
                <app-avatar
                  :src="group.room_avatar"
                  :name="group.room_name || '群聊'"
                  :size="80"
                  radius="8rpx"
                />
                <view class="contact-info">
                  <text class="contact-name">{{ group.room_name || '未命名群聊' }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 我加入的群 -->
          <view v-if="joinedGroups.length > 0" class="contact-group">
            <view class="group-header" @click="toggleCollapse('joined')">
              <wd-icon 
                :name="collapsedIds.includes('joined') ? 'arrow-right' : 'arrow-down'" 
                size="28rpx" 
              />
              <text class="group-name">我加入的群</text>
              <text class="group-count">({{ joinedGroups.length }})</text>
            </view>
            <view v-if="!collapsedIds.includes('joined')" class="group-contacts">
              <view
                v-for="group in joinedGroups"
                :key="group.room_id"
                class="contact-item"
                @click="goGroupChat(group)"
              >
                <app-avatar
                  :src="group.room_avatar"
                  :name="group.room_name || '群聊'"
                  :size="80"
                  radius="8rpx"
                />
                <view class="contact-info">
                  <text class="contact-name">{{ group.room_name || '未命名群聊' }}</text>
                </view>
              </view>
            </view>
          </view>
        </template>
      </template>

      <!-- 底部安全区 -->
      <view class="bottom-safe-area" />
    </scroll-view>

    <!-- 右侧字母索引 (仅在好友 Tab 显示) -->
    <view v-if="activeTab === 'friends'" class="letter-index">
      <text
        v-for="letter in letters"
        :key="letter"
        class="letter-item"
        @click="scrollToLetter(letter)"
      >
        {{ letter }}
      </text>
    </view>

    <wd-toast />
    
    <!-- 自定义 TabBar -->
    <app-tab-bar current="contacts" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useContactStore, useChatStore } from '@/stores'
import { useTheme } from '@/composables/useTheme'
import { generateColor } from '@/utils/format'
import { resolveImageUrl } from '@/utils/image'
import * as contactApi from '@/api/modules/contact'
import * as roomApi from '@/api/modules/room'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppTabBar from '@/components/common/AppTabBar.vue'
import type { Contact, ContactGroup } from '@/types/api'

interface GroupChat {
  room_id: string
  room_type: string
  room_name: string
  room_avatar: string
  owner_id: string
  creator_id: string
  category: 'joined' | 'created' | 'managed'
  role: number
  last_message_time?: string
  last_message?: string
  created_at: string
  updated_at: string
}

const contactStore = useContactStore()
const chatStore = useChatStore()
const { isDark } = useTheme()

// Tab 配置
const tabs = [
  { key: 'groups', label: '分组' },
  { key: 'friends', label: '好友' },
  { key: 'chats', label: '群聊' }
]

// 状态
const activeTab = ref('groups')
const searchKeyword = ref('')
const refreshing = ref(false)
const loading = ref(false)
const collapsedIds = ref<(number | string)[]>([])
const contactGroups = ref<ContactGroup[]>([])
const groupChats = ref<GroupChat[]>([])

// 计算属性
const contacts = computed(() => chatStore.contacts)
const friendRequestCount = computed(() => contactStore.friendRequests.filter(r => r.status === 'pending').length)

// 未分组联系人
const ungroupedContacts = computed(() => {
  return contacts.value.filter(c => !c.group_id || c.group_id === 0)
})

// 获取指定分组的联系人
function getGroupContacts(groupId: number): Contact[] {
  return contacts.value.filter(c => c.group_id === groupId)
}

// 字母列表
const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#']

// 按字母分组的联系人
const alphabetGroupedContacts = computed(() => {
  const groups: Record<string, Contact[]> = {}
  
  contacts.value.forEach(contact => {
    const name = contact.remark_name || contact.user?.name || ''
    const firstChar = name.charAt(0).toUpperCase()
    const letter = /[A-Z]/.test(firstChar) ? firstChar : '#'
    
    if (!groups[letter]) {
      groups[letter] = []
    }
    groups[letter].push(contact)
  })

  return Object.keys(groups)
    .sort((a, b) => {
      if (a === '#') return 1
      if (b === '#') return -1
      return a.localeCompare(b)
    })
    .map(letter => ({
      letter,
      contacts: groups[letter]
    }))
})

// 群聊分组
const createdGroups = computed(() => groupChats.value.filter(g => g.category === 'created'))
const managedGroups = computed(() => groupChats.value.filter(g => g.category === 'managed'))
const joinedGroups = computed(() => groupChats.value.filter(g => g.category === 'joined'))

// 生命周期
onMounted(() => {
  loadData()
})

onShow(() => {
  loadFriendRequests()
})

// 方法
async function loadData() {
  loading.value = true
  try {
    // 并行加载联系人、分组和群聊
    const [contactList, groups, chats] = await Promise.all([
      contactApi.getContacts(),
      contactApi.getGroups(),
      roomApi.getUserGroups()
    ])
    
    chatStore.setContacts(contactList)
    contactGroups.value = groups
    groupChats.value = chats || []
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

async function loadFriendRequests() {
  try {
    const requests = await contactApi.getFriendRequests()
    contactStore.setFriendRequests(requests)
  } catch {
    // ignore
  }
}

async function onRefresh() {
  refreshing.value = true
  await loadData()
  await loadFriendRequests()
  refreshing.value = false
}

function toggleCollapse(id: number | string) {
  const idx = collapsedIds.value.indexOf(id)
  if (idx === -1) {
    collapsedIds.value.push(id)
  } else {
    collapsedIds.value.splice(idx, 1)
  }
}

function goSearch() {
  uni.navigateTo({ url: '/pages/search/index' })
}

function goAddFriend() {
  uni.navigateTo({ url: '/pages/contact/add' })
}

function goFriendRequests() {
  uni.navigateTo({ url: '/pages/contact/requests' })
}

function goGroupNotify() {
  uni.navigateTo({ url: '/pages/group/notify' })
}

function goContactDetail(contact: Contact) {
  uni.navigateTo({ url: `/pages/contact/detail?id=${contact.id}` })
}

function goGroupChat(group: GroupChat) {
  uni.navigateTo({
    url: `/pages/chat/index?roomId=${group.room_id}&name=${encodeURIComponent(group.room_name || '群聊')}`
  })
}

function scrollToLetter(letter: string) {
  // TODO: 实现滚动到指定字母
  console.log('Scroll to:', letter)
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

// 功能入口行
.function-row {
  position: fixed;
  top: calc(88rpx + 80rpx + var(--status-bar-height, 0));
  left: 0;
  right: 0;
  z-index: 98;
  display: flex;
  padding: 20rpx 30rpx;
  background: var(--bg-content);
  border-bottom: 1rpx solid var(--divider-color);
  gap: 40rpx;
}

.function-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  position: relative;
}

.function-icon {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8rpx;

  &.icon-friend {
    background: #fa9d3b;
  }

  &.icon-notify {
    background: #10aeff;
  }
}

.function-text {
  font-size: 28rpx;
  color: var(--text-primary);
}

.function-badge {
  position: absolute;
  top: -8rpx;
  left: 40rpx;
}

// Tab 切换
.tab-bar {
  position: fixed;
  top: calc(88rpx + 80rpx + 96rpx + var(--status-bar-height, 0));
  left: 0;
  right: 0;
  z-index: 97;
  display: flex;
  background: var(--bg-content);
  border-bottom: 1rpx solid var(--divider-color);
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80rpx;
  font-size: 28rpx;
  color: var(--text-secondary);
  position: relative;
  transition: all 0.2s;

  &.active {
    color: var(--color-primary);
    font-weight: 600;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60rpx;
      height: 4rpx;
      background: var(--color-primary);
      border-radius: 2rpx;
    }
  }
}

// 内容滚动区域
.content-scroll {
  position: fixed;
  top: calc(88rpx + 80rpx + 96rpx + 80rpx + 20rpx + var(--status-bar-height, 0));
  left: 0;
  right: 40rpx;
  bottom: calc(100rpx + env(safe-area-inset-bottom));
}

// 联系人分组
.contact-group {
  background: var(--bg-content);
  margin-bottom: 16rpx;
}

.group-header {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  gap: 12rpx;
  
  &.letter-header {
    background: var(--bg-page);
    padding: 12rpx 30rpx;
  }
}

.group-name {
  font-size: 26rpx;
  color: var(--text-secondary);
  font-weight: 500;
}

.group-count {
  font-size: 24rpx;
  color: var(--text-tertiary);
}

.group-contacts {
  padding-left: 16rpx;
}

// 联系人项
.contact-item {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  gap: 20rpx;

  &:active {
    background: var(--bg-hover);
  }
}

.avatar-placeholder {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8rpx;
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;

  &.avatar-group {
    background: var(--color-primary);
  }
}

.contact-info {
  flex: 1;
  min-width: 0;
}

.contact-name {
  display: block;
  font-size: 30rpx;
  color: var(--text-primary);
  margin-bottom: 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-desc {
  display: block;
  font-size: 24rpx;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 字母索引
.letter-index {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10rpx 8rpx;
  z-index: 100;

  .letter-item {
    font-size: 22rpx;
    color: var(--text-tertiary);
    padding: 4rpx 8rpx;

    &:active {
      color: var(--color-primary);
    }
  }
}

// 加载状态
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx;
  color: var(--text-tertiary);
  gap: 20rpx;
}

// 底部安全区
.bottom-safe-area {
  height: calc(40rpx + env(safe-area-inset-bottom));
}
</style>
