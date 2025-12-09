<template>
  <view class="search-page">
    <!-- 搜索栏 -->
    <view class="search-header safe-area-top">
      <wd-search
        v-model="keyword"
        placeholder="搜索"
        show-action
        focus
        @search="doSearch"
        @cancel="goBack"
        @clear="clearKeyword"
      />
    </view>

    <!-- 搜索历史 -->
    <view v-if="!keyword && history.length > 0" class="history-section">
      <view class="section-header">
        <text class="title">搜索历史</text>
        <text class="clear" @click="clearHistory">清空</text>
      </view>
      <view class="history-tags">
        <wd-tag
          v-for="(item, index) in history"
          :key="index"
          round
          @click="searchHistory(item)"
        >
          {{ item }}
        </wd-tag>
      </view>
    </view>

    <!-- 搜索结果 -->
    <view v-if="keyword" class="results-section">
      <view v-if="loading" class="loading-state">
        <wd-loading />
        <text>搜索中...</text>
      </view>

      <wd-status-tip v-else-if="results.length === 0 && searched" tip="未找到相关结果" />

      <template v-else-if="results.length > 0">
        <wd-cell
          v-for="item in results"
          :key="item.id"
          :title="item.name"
          :label="item.desc"
          is-link
          @click="goDetail(item)"
        >
          <template #icon>
            <wd-img
              v-if="item.avatar"
              :src="item.avatar"
              width="80rpx"
              height="80rpx"
              radius="8rpx"
              custom-style="margin-right: 24rpx;"
            />
            <view v-else class="avatar-placeholder" :style="{ background: generateColor(item.name || '') }">
              {{ item.name?.charAt(0) || '?' }}
            </view>
          </template>
        </wd-cell>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import * as contactApi from '@/api/modules/contact'
import { generateColor } from '@/utils/format'
import type { User } from '@/types/api'

const keyword = ref('')
const loading = ref(false)
const searched = ref(false)
const results = ref<User[]>([])
const history = ref<string[]>([])

// 加载搜索历史
const savedHistory = uni.getStorageSync('search_history')
if (savedHistory) {
  try {
    history.value = JSON.parse(savedHistory)
  } catch {
    history.value = []
  }
}

// 监听关键词变化
let searchTimer: number
watch(keyword, (val) => {
  clearTimeout(searchTimer)
  if (val.trim()) {
    searchTimer = setTimeout(() => {
      doSearch()
    }, 500) as unknown as number
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
    // 保存搜索历史
    saveHistory(keyword.value.trim())
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    loading.value = false
  }
}

function saveHistory(word: string) {
  const index = history.value.indexOf(word)
  if (index > -1) {
    history.value.splice(index, 1)
  }
  history.value.unshift(word)
  if (history.value.length > 10) {
    history.value = history.value.slice(0, 10)
  }
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

function goBack() {
  uni.navigateBack()
}

function goDetail(item: User) {
  uni.navigateTo({ url: `/pages/contact/detail?id=${item.id}` })
}
</script>

<style lang="scss" scoped>
.search-page {
  min-height: 100vh;
  background: var(--bg-page);
}

.search-header {
  background: var(--bg-content);
}

.safe-area-top {
  padding-top: var(--status-bar-height, 0);
}

.history-section {
  background: var(--bg-content);
  margin-top: 20rpx;
  padding: 30rpx;

  .section-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 24rpx;

    .title {
      font-size: 28rpx;
      color: var(--text-tertiary);
    }

    .clear {
      font-size: 28rpx;
      color: var(--text-tertiary);
    }
  }

  .history-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
  }
}

.results-section {
  background: var(--bg-content);
  margin-top: 20rpx;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx;
  color: var(--text-tertiary);
  gap: 20rpx;
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
</style>
