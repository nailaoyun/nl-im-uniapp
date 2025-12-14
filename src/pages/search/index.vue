<template>
  <view class="search-page" :class="{ dark: isDark }">
    <!-- 搜索栏 -->
    <view class="search-header">
      <view class="search-box">
        <!-- #ifdef H5 -->
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <!-- #endif -->
        <!-- #ifdef MP-WEIXIN -->
        <wd-icon name="search" size="36rpx" custom-class="search-icon-mp" />
        <!-- #endif -->
        <input
            class="search-input"
            type="text"
            v-model="keyword"
            placeholder="搜索"
            focus
            @confirm="doSearch"
        />
        <view v-if="keyword" class="clear-btn" @click="clearKeyword">
          <!-- #ifdef H5 -->
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
          </svg>
          <!-- #endif -->
          <!-- #ifdef MP-WEIXIN -->
          <wd-icon name="close-circle" size="36rpx" />
          <!-- #endif -->
        </view>
      </view>
      <text class="cancel-btn" @click="goBack">取消</text>
    </view>

    <!-- 搜索历史 -->
    <view v-if="!keyword && history.length > 0" class="history-section animate-fade-in-up">
      <view class="section-header">
        <text class="title">搜索历史</text>
        <view class="clear" @click="clearHistory">
          <!-- #ifdef H5 -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          <!-- #endif -->
          <!-- #ifdef MP-WEIXIN -->
          <wd-icon name="delete" size="36rpx" />
          <!-- #endif -->
        </view>
      </view>
      <view class="history-tags">
        <view
            v-for="(item, index) in history"
            :key="index"
            class="history-tag"
            @click="searchHistory(item)"
        >
          {{ item }}
        </view>
      </view>
    </view>

    <!-- 搜索结果区域 -->
    <view v-if="keyword && searched" class="results-section">
      <!-- 分类Tab -->
      <view class="search-tabs">
        <view
            v-for="tab in tabs"
            :key="tab.key"
            class="tab-item"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
        >
          <text>{{ tab.label }}</text>
          <view v-if="getResultCount(tab.key) > 0" class="tab-badge">
            {{ getResultCount(tab.key) }}
          </view>
        </view>
      </view>

      <!-- 加载中 -->
      <view v-if="loading" class="loading-state">
        <wd-loading :color="isDark ? '#f97316' : '#4F46E5'" />
        <text>搜索中...</text>
      </view>

      <!-- 空结果 -->
      <view v-else-if="getCurrentResults.length === 0" class="empty-state">
        <!-- #ifdef H5 -->
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <!-- #endif -->
        <!-- #ifdef MP-WEIXIN -->
        <wd-icon name="search" size="120rpx" color="#9ca3af" custom-class="empty-icon-mp" />
        <!-- #endif -->
        <text class="empty-text">未找到相关结果</text>
      </view>

      <!-- 联系人结果 -->
      <template v-else-if="activeTab === 'contacts'">
        <view class="result-list">
          <view
              v-for="(item, index) in searchResults.contacts"
              :key="item.room_id"
              class="result-item animate-fade-in-up"
              :style="{ animationDelay: `${index * 50}ms` }"
              @click="goContactDetail(item)"
          >
            <app-avatar
                :src="item.user?.avatar"
                :name="item.user?.name || item.remark_name"
                :size="88"
                radius="20rpx"
            />
            <view class="result-info">
              <text class="name" v-html="highlightKeyword(item.remark_name || item.user?.name || '')"></text>
              <text class="desc">{{ item.user?.desc || '暂无签名' }}</text>
            </view>
            <!-- #ifdef H5 -->
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <!-- #endif -->
            <!-- #ifdef MP-WEIXIN -->
            <wd-icon name="arrow-right" size="32rpx" custom-class="chevron-mp" />
            <!-- #endif -->
          </view>
        </view>
      </template>

      <!-- 群聊结果 -->
      <template v-else-if="activeTab === 'groups'">
        <view class="result-list">
          <view
              v-for="(item, index) in searchResults.groups"
              :key="item.room_id"
              class="result-item animate-fade-in-up"
              :style="{ animationDelay: `${index * 50}ms` }"
              @click="goGroupChat(item)"
          >
            <app-avatar
                :src="item.room_avatar"
                :name="item.room_name"
                :size="88"
                radius="20rpx"
            />
            <view class="result-info">
              <text class="name" v-html="highlightKeyword(item.room_name)"></text>
              <text class="desc">{{ item.member_count }}人</text>
            </view>
            <view class="group-badge">
              <!-- #ifdef H5 -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <!-- #endif -->
              <!-- #ifdef MP-WEIXIN -->
              <wd-icon name="user" size="28rpx" />
              <!-- #endif -->
            </view>
            <!-- #ifdef H5 -->
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <!-- #endif -->
            <!-- #ifdef MP-WEIXIN -->
            <wd-icon name="arrow-right" size="32rpx" custom-class="chevron-mp" />
            <!-- #endif -->
          </view>
        </view>
      </template>

      <!-- 聊天记录结果 -->
      <template v-else-if="activeTab === 'messages'">
        <view class="result-list">
          <view
              v-for="(item, index) in searchResults.messages"
              :key="item.id"
              class="result-item message-item animate-fade-in-up"
              :style="{ animationDelay: `${index * 50}ms` }"
              @click="goMessage(item)"
          >
            <app-avatar
                :src="item.sender?.avatar"
                :name="item.sender?.name || item.room_name"
                :size="88"
                radius="20rpx"
            />
            <view class="result-info">
              <view class="message-header">
                <text class="name">{{ item.room_name }}</text>
                <text class="time">{{ formatTime(item.created_at) }}</text>
              </view>
              <text class="message-sender">{{ item.sender?.name }}:</text>
              <text class="message-content" v-html="highlightKeyword(item.match_content || item.content)"></text>
            </view>
          </view>
        </view>
      </template>
    </view>

    <!-- 未搜索时显示的搜索提示 -->
    <view v-else-if="keyword && !searched" class="search-hint">
      <text>按回车键搜索 "{{ keyword }}"</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import * as searchApi from '@/api/modules/search'
import type { GlobalSearchResult, ContactSearchResult, GroupSearchResult, MessageSearchResult } from '@/api/modules/search'
import { useTheme } from '@/composables/useTheme'
import AppAvatar from '@/components/common/AppAvatar.vue'

const { isDark } = useTheme()
const keyword = ref('')
const loading = ref(false)
const searched = ref(false)
const activeTab = ref<'contacts' | 'groups' | 'messages'>('contacts')
const history = ref<string[]>([])

// 搜索结果
const searchResults = ref<GlobalSearchResult>({
  contacts: [],
  groups: [],
  messages: []
})

// Tab配置
const tabs = [
  { key: 'contacts' as const, label: '联系人' },
  { key: 'groups' as const, label: '群聊' },
  { key: 'messages' as const, label: '聊天记录' }
]

// 加载搜索历史
const savedHistory = uni.getStorageSync('search_history')
if (savedHistory) {
  try { history.value = JSON.parse(savedHistory) } catch { history.value = [] }
}

// 获取各分类结果数量
function getResultCount(key: string): number {
  switch (key) {
    case 'contacts': return searchResults.value.contacts?.length || 0
    case 'groups': return searchResults.value.groups?.length || 0
    case 'messages': return searchResults.value.messages?.length || 0
    default: return 0
  }
}

// 获取当前Tab的结果
const getCurrentResults = computed(() => {
  switch (activeTab.value) {
    case 'contacts': return searchResults.value.contacts || []
    case 'groups': return searchResults.value.groups || []
    case 'messages': return searchResults.value.messages || []
    default: return []
  }
})

// 监听关键词变化 - 防抖搜索
let searchTimer: number
watch(keyword, (val) => {
  clearTimeout(searchTimer)
  if (val.trim()) {
    searchTimer = setTimeout(() => { doSearch() }, 500) as unknown as number
  } else {
    searchResults.value = { contacts: [], groups: [], messages: [] }
    searched.value = false
  }
})

// 执行搜索
async function doSearch() {
  if (!keyword.value.trim()) return
  loading.value = true
  searched.value = true
  try {
    const result = await searchApi.globalSearch(keyword.value.trim(), 'all', 50)
    searchResults.value = result || { contacts: [], groups: [], messages: [] }
    
    // 自动切换到有结果的Tab
    if (result) {
      if (result.contacts?.length > 0) {
        activeTab.value = 'contacts'
      } else if (result.groups?.length > 0) {
        activeTab.value = 'groups'
      } else if (result.messages?.length > 0) {
        activeTab.value = 'messages'
      }
    }
    
    saveHistory(keyword.value.trim())
  } catch (error) {
    console.error('搜索失败:', error)
    searchResults.value = { contacts: [], groups: [], messages: [] }
  } finally {
    loading.value = false
  }
}

// 保存搜索历史
function saveHistory(word: string) {
  const index = history.value.indexOf(word)
  if (index > -1) { history.value.splice(index, 1) }
  history.value.unshift(word)
  if (history.value.length > 10) { history.value = history.value.slice(0, 10) }
  uni.setStorageSync('search_history', JSON.stringify(history.value))
}

// 点击历史记录搜索
function searchHistory(word: string) {
  keyword.value = word
  doSearch()
}

// 清空关键词
function clearKeyword() {
  keyword.value = ''
  searchResults.value = { contacts: [], groups: [], messages: [] }
  searched.value = false
}

// 清空历史
function clearHistory() {
  history.value = []
  uni.removeStorageSync('search_history')
}

// 返回
function goBack() { uni.navigateBack() }

// 跳转联系人详情
function goContactDetail(item: ContactSearchResult) {
  uni.navigateTo({ url: `/pages/contact/detail?userId=${item.user?.id || ''}` })
}

// 跳转群聊
function goGroupChat(item: GroupSearchResult) {
  uni.navigateTo({ 
    url: `/pages/chat/index?roomId=${item.room_id}&name=${encodeURIComponent(item.room_name)}&isGroup=true` 
  })
}

// 跳转到消息位置
function goMessage(item: MessageSearchResult) {
  uni.navigateTo({ 
    url: `/pages/chat/index?roomId=${item.room_id}&name=${encodeURIComponent(item.room_name)}&isGroup=${item.is_group_chat}&messageId=${item.id}` 
  })
}

// 高亮匹配文字
function highlightKeyword(text: string): string {
  if (!keyword.value || !text) return text
  const regex = new RegExp(`(${keyword.value})`, 'gi')
  return text.replace(regex, '<span class="highlight">$1</span>')
}

// 格式化时间
function formatTime(time: string): string {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  
  if (isToday) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}
</script>

<style lang="scss" scoped>
// 页面容器 - 浅色模式
.search-page {
  --bg-page: #f7f8fa;
  --bg-surface: #ffffff;
  --text-primary: #1d1d1f;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;
  --search-bg: #f1f1f1;
  --color-brand: #4F46E5;
  --border-color: #e5e7eb;

  min-height: 100vh;
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
}

// 深色模式 - Warm Stone
.search-page.dark {
  --bg-page: #1c1917;
  --bg-surface: #292524;
  --text-primary: #f5f5f4;
  --text-secondary: #e7e5e4;
  --text-tertiary: #78716c;
  --search-bg: #292524;
  --color-brand: #f97316;
  --border-color: #44403c;
}

// 动画
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

.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out forwards;
  opacity: 0;
}

// 搜索头部
.search-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: calc(var(--status-bar-height) + 16rpx) 24rpx 16rpx;
  background: var(--bg-page);
  position: sticky;
  top: 0;
  z-index: 100;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--search-bg);
  padding: 0 24rpx;
  border-radius: 24rpx;
  height: 80rpx;

  .search-icon {
    width: 36rpx;
    height: 36rpx;
    color: var(--text-tertiary);
    margin-right: 12rpx;
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    height: 100%;
    font-size: 30rpx;
    color: var(--text-primary);
    background: transparent;
    border: none;

    &::placeholder {
      color: var(--text-tertiary);
    }
  }

  .clear-btn {
    width: 40rpx;
    height: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-tertiary);

    svg {
      width: 32rpx;
      height: 32rpx;
    }

    &:active { opacity: 0.7; }
  }
}

.cancel-btn {
  font-size: 30rpx;
  color: var(--color-brand);
  padding: 10rpx;

  &:active { opacity: 0.7; }
}

// 历史记录
.history-section {
  padding: 32rpx;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;

    .title {
      font-size: 28rpx;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .clear {
      width: 48rpx;
      height: 48rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-tertiary);

      svg {
        width: 36rpx;
        height: 36rpx;
      }

      &:active { opacity: 0.7; }
    }
  }

  .history-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;

    .history-tag {
      background: var(--bg-surface);
      padding: 16rpx 28rpx;
      border-radius: 40rpx;
      font-size: 26rpx;
      color: var(--text-secondary);
      transition: all 0.15s;

      &:active {
        opacity: 0.7;
        transform: scale(0.98);
      }
    }
  }
}

// 搜索Tab
.search-tabs {
  display: flex;
  padding: 0 32rpx;
  gap: 48rpx;
  border-bottom: 1rpx solid var(--border-color);
  background: var(--bg-page);

  .tab-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 24rpx 0;
    font-size: 28rpx;
    color: var(--text-secondary);
    transition: all 0.2s;

    &.active {
      color: var(--color-brand);
      font-weight: 600;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 6rpx;
        background: var(--color-brand);
        border-radius: 3rpx;
      }
    }

    .tab-badge {
      min-width: 32rpx;
      height: 32rpx;
      padding: 0 8rpx;
      background: var(--color-brand);
      color: #fff;
      font-size: 20rpx;
      font-weight: 600;
      border-radius: 16rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

// 结果区
.results-section {
  flex: 1;
  background: var(--bg-page);
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 120rpx;
  color: var(--text-tertiary);
  gap: 24rpx;
}

.empty-icon {
  width: 100rpx;
  height: 100rpx;
  opacity: 0.4;
}

.empty-text {
  font-size: 28rpx;
}

// 搜索提示
.search-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 80rpx;
  color: var(--text-tertiary);
  font-size: 26rpx;
}

// 结果列表
.result-list {
  padding: 20rpx 32rpx;
}

.result-item {
  display: flex;
  align-items: center;
  background: var(--bg-surface);
  padding: 24rpx;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  transition: all 0.15s;

  &:active {
    transform: scale(0.99);
    opacity: 0.9;
  }

  .result-info {
    flex: 1;
    margin-left: 24rpx;
    display: flex;
    flex-direction: column;
    min-width: 0;

    .name {
      font-size: 32rpx;
      font-weight: 600;
      color: var(--text-primary);

      :deep(.highlight) {
        color: var(--color-brand);
        font-weight: 700;
      }
    }

    .desc {
      font-size: 24rpx;
      color: var(--text-tertiary);
      margin-top: 6rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .group-badge {
    width: 48rpx;
    height: 48rpx;
    border-radius: 24rpx;
    background: rgba(79, 70, 229, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16rpx;

    svg {
      width: 28rpx;
      height: 28rpx;
      color: var(--color-brand);
    }
  }

  .chevron {
    width: 32rpx;
    height: 32rpx;
    color: var(--text-tertiary);
  }
}

// 消息结果特殊样式
.message-item {
  .result-info {
    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8rpx;

      .name {
        font-size: 28rpx;
      }

      .time {
        font-size: 22rpx;
        color: var(--text-tertiary);
      }
    }

    .message-sender {
      font-size: 24rpx;
      color: var(--text-secondary);
      margin-bottom: 4rpx;
    }

    .message-content {
      font-size: 26rpx;
      color: var(--text-tertiary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      :deep(.highlight) {
        color: var(--color-brand);
        font-weight: 600;
      }
    }
  }
}

// 深色模式群聊图标颜色调整
.dark .group-badge {
  background: rgba(249, 115, 22, 0.15);
}
</style>
