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

    <!-- 内容区域 -->
    <scroll-view
      class="content-scroll"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 功能入口 -->
      <view class="function-section">
        <wd-cell
          title="新朋友"
          is-link
          @click="goFriendRequests"
        >
          <template #icon>
            <view class="function-icon icon-friend">
              <wd-icon name="user-add" size="40rpx" color="#fff" />
            </view>
          </template>
          <template #value>
            <wd-badge v-if="friendRequestCount > 0" :value="friendRequestCount" />
          </template>
        </wd-cell>
        <wd-cell
          title="群聊"
          is-link
          @click="goGroups"
        >
          <template #icon>
            <view class="function-icon icon-group">
              <wd-icon name="people" size="40rpx" color="#fff" />
            </view>
          </template>
        </wd-cell>
        <wd-cell
          title="群通知"
          is-link
          @click="goGroupNotify"
        >
          <template #icon>
            <view class="function-icon icon-notify">
              <wd-icon name="bell" size="40rpx" color="#fff" />
            </view>
          </template>
        </wd-cell>
      </view>

      <!-- 联系人列表 -->
      <view class="contact-section">
        <view v-if="loading" class="loading-state">
          <wd-loading />
          <text>加载中...</text>
        </view>

        <wd-status-tip v-else-if="contacts.length === 0" tip="暂无联系人" />

        <template v-else>
          <!-- 按字母分组 -->
          <view
            v-for="group in groupedContacts"
            :key="group.letter"
            class="contact-group"
          >
            <view class="group-header">{{ group.letter }}</view>
            <wd-cell
              v-for="contact in group.contacts"
              :key="contact.id"
              :title="contact.remark_name || contact.user?.name || '未知'"
              :label="contact.user?.desc"
              is-link
              @click="goContactDetail(contact)"
            >
              <template #icon>
                <wd-img
                  v-if="contact.user?.avatar"
                  :src="contact.user.avatar"
                  width="80rpx"
                  height="80rpx"
                  radius="8rpx"
                  custom-style="margin-right: 24rpx;"
                />
                <view v-else class="avatar-placeholder" :style="{ background: generateColor(contact.user?.name || '') }">
                  {{ contact.user?.name?.charAt(0) || '?' }}
                </view>
              </template>
            </wd-cell>
          </view>
        </template>
      </view>
    </scroll-view>

    <!-- 右侧字母索引 -->
    <view class="letter-index">
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
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useContactStore, useChatStore } from '@/stores'
import { useTheme } from '@/composables/useTheme'
import { generateColor } from '@/utils/format'
import * as contactApi from '@/api/modules/contact'
import type { Contact } from '@/types/api'

const contactStore = useContactStore()
const chatStore = useChatStore()
const { isDark } = useTheme()

// 状态
const searchKeyword = ref('')
const refreshing = ref(false)
const loading = ref(false)

// 计算属性
const contacts = computed(() => chatStore.contacts)
const friendRequestCount = computed(() => contactStore.friendRequests.filter(r => r.status === 'pending').length)

// 字母列表
const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#']

// 按字母分组的联系人
const groupedContacts = computed(() => {
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
    const list = await contactApi.getContacts()
    chatStore.setContacts(list)
  } catch (error) {
    console.error('加载联系人失败:', error)
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

function goSearch() {
  uni.navigateTo({ url: '/pages/search/index' })
}

function goAddFriend() {
  uni.navigateTo({ url: '/pages/contact/add' })
}

function goFriendRequests() {
  uni.navigateTo({ url: '/pages/contact/requests' })
}

function goGroups() {
  uni.navigateTo({ url: '/pages/contact/groups' })
}

function goGroupNotify() {
  uni.navigateTo({ url: '/pages/group/notify' })
}

function goContactDetail(contact: Contact) {
  uni.navigateTo({ url: `/pages/contact/detail?id=${contact.id}` })
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

// 内容滚动区域
.content-scroll {
  position: fixed;
  top: calc(88rpx + 80rpx + var(--status-bar-height, 0));
  left: 0;
  right: 40rpx;
  bottom: 0;
}

// 功能入口
.function-section {
  background: var(--bg-content);
  margin-bottom: 20rpx;
}

.function-icon {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8rpx;
  margin-right: 24rpx;

  &.icon-friend {
    background: #fa9d3b;
  }

  &.icon-group {
    background: #07c160;
  }

  &.icon-notify {
    background: #10aeff;
  }
}

// 联系人列表
.contact-section {
  background: var(--bg-content);
}

.contact-group {
  .group-header {
    padding: 12rpx 30rpx;
    font-size: 26rpx;
    color: var(--text-tertiary);
    background: var(--bg-page);
  }
}

.avatar-placeholder {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8rpx;
  margin-right: 24rpx;
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
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
</style>
