<template>
  <view class="search-page" :class="{ dark: isDark }">
    <!-- 搜索栏 -->
    <view class="search-header">
      <view class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
            class="search-input"
            type="text"
            v-model="keyword"
            placeholder="搜索"
            focus
            @confirm="doSearch"
        />
        <view v-if="keyword" class="clear-btn" @click="clearKeyword">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
          </svg>
        </view>
      </view>
      <text class="cancel-btn" @click="goBack">取消</text>
    </view>

    <!-- 搜索历史 -->
    <view v-if="!keyword && history.length > 0" class="history-section animate-fade-in-up">
      <view class="section-header">
        <text class="title">搜索历史</text>
        <view class="clear" @click="clearHistory">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
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

    <!-- 搜索结果 -->
    <view v-if="keyword" class="results-section">
      <view v-if="loading" class="loading-state">
        <wd-loading :color="isDark ? '#f97316' : '#4F46E5'" />
        <text>搜索中...</text>
      </view>

      <view v-else-if="results.length === 0 && searched" class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <text class="empty-text">未找到相关结果</text>
      </view>

      <template v-else-if="results.length > 0">
        <view class="result-list">
          <view
              v-for="(item, index) in results"
              :key="item.id"
              class="result-item animate-fade-in-up"
              :style="{ animationDelay: `${index * 50}ms` }"
              @click="goDetail(item)"
          >
            <app-avatar
                :src="item.avatar"
                :name="item.name"
                :size="88"
                radius="20rpx"
            />
            <view class="result-info">
              <text class="name" v-html="highlightKeyword(item.name)"></text>
              <text class="desc">{{ item.desc || '暂无签名' }}</text>
            </view>
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </view>
        </view>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import * as contactApi from '@/api/modules/contact'
import { generateColor } from '@/utils/format'
import { useTheme } from '@/composables/useTheme'
import AppAvatar from '@/components/common/AppAvatar.vue'
import type { User } from '@/types/api'

const { isDark } = useTheme()
const keyword = ref('')
const loading = ref(false)
const searched = ref(false)
const results = ref<User[]>([])
const history = ref<string[]>([])

// 加载搜索历史
const savedHistory = uni.getStorageSync('search_history')
if (savedHistory) {
  try { history.value = JSON.parse(savedHistory) } catch { history.value = [] }
}

// 监听关键词变化
let searchTimer: number
watch(keyword, (val) => {
  clearTimeout(searchTimer)
  if (val.trim()) {
    searchTimer = setTimeout(() => { doSearch() }, 500) as unknown as number
  } else {
    results.value = []
    searched.value = false
  }
})

async function doSearch() {
  if (!keyword.value.trim()) return
  loading.value = true
  searched.value = true
  try {
    results.value = await contactApi.searchUsers(keyword.value.trim())
    saveHistory(keyword.value.trim())
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    loading.value = false
  }
}

function saveHistory(word: string) {
  const index = history.value.indexOf(word)
  if (index > -1) { history.value.splice(index, 1) }
  history.value.unshift(word)
  if (history.value.length > 10) { history.value = history.value.slice(0, 10) }
  uni.setStorageSync('search_history', JSON.stringify(history.value))
}

function searchHistory(word: string) {
  keyword.value = word
  doSearch()
}

function clearKeyword() {
  keyword.value = ''
  results.value = []
  searched.value = false
}

function clearHistory() {
  history.value = []
  uni.removeStorageSync('search_history')
}

function goBack() { uni.navigateBack() }

function goDetail(item: User) {
  uni.navigateTo({ url: `/pages/contact/detail?userId=${item.id}` })
}

// 高亮匹配文字
function highlightKeyword(text: string): string {
  if (!keyword.value || !text) return text
  const regex = new RegExp(`(${keyword.value})`, 'gi')
  return text.replace(regex, '<span class="highlight">$1</span>')
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
    }
  }

  .chevron {
    width: 32rpx;
    height: 32rpx;
    color: var(--text-tertiary);
  }
}
</style>
