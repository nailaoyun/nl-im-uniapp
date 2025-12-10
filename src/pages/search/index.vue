<template>
  <view class="search-page" :class="{ dark: isDark }">
    <!-- 搜索栏 (增加 safe-area-top) -->
    <view class="search-header safe-area-top">
      <wd-search
          v-model="keyword"
          placeholder="搜索"
          show-action
          focus
          @search="doSearch"
          @cancel="goBack"
          @clear="clearKeyword"
          custom-style="background: transparent;"
      />
    </view>

    <!-- 搜索历史 -->
    <view v-if="!keyword && history.length > 0" class="history-section">
      <view class="section-header">
        <text class="title">搜索历史</text>
        <text class="clear" @click="clearHistory">清空</text>
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
        <wd-loading />
        <text>搜索中...</text>
      </view>

      <wd-status-tip v-else-if="results.length === 0 && searched" tip="未找到相关结果" />

      <template v-else-if="results.length > 0">
        <view class="result-list">
          <view
              v-for="item in results"
              :key="item.id"
              class="result-item"
              @click="goDetail(item)"
          >
            <app-avatar
                :src="item.avatar"
                :name="item.name"
                :size="88"
                radius="12rpx"
            />
            <view class="result-info">
              <text class="name">{{ item.name }}</text>
              <text class="desc">{{ item.desc || '暂无签名' }}</text>
            </view>
            <wd-icon name="arrow-right" size="32rpx" color="var(--text-tertiary)" />
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
  display: flex;
  flex-direction: column;
}

.search-header {
  background: var(--bg-content);
  padding: 10rpx 20rpx;
  position: sticky;
  top: 0;
  z-index: 100;
}

.safe-area-top {
  padding-top: var(--status-bar-height);
}

.history-section {
  padding: 30rpx;
  .section-header {
    display: flex; justify-content: space-between; margin-bottom: 24rpx;
    .title { font-size: 28rpx; font-weight: 600; color: var(--text-primary); }
    .clear { font-size: 26rpx; color: var(--text-tertiary); }
  }
  .history-tags {
    display: flex; flex-wrap: wrap; gap: 20rpx;
    .history-tag {
      background: var(--bg-content); padding: 10rpx 24rpx; border-radius: 30rpx;
      font-size: 26rpx; color: var(--text-secondary);
      &:active { opacity: 0.7; }
    }
  }
}

.results-section {
  flex: 1;
  background: var(--bg-page);
}

.loading-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding-top: 100rpx; color: var(--text-tertiary); gap: 20rpx;
}

.result-list {
  padding: 20rpx;
}

.result-item {
  display: flex; align-items: center;
  background: var(--bg-content);
  padding: 24rpx;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  transition: opacity 0.2s;

  &:active { opacity: 0.8; }

  .result-info {
    flex: 1; margin-left: 24rpx; display: flex; flex-direction: column;
    .name { font-size: 32rpx; font-weight: 600; color: var(--text-primary); }
    .desc { font-size: 24rpx; color: var(--text-tertiary); margin-top: 6rpx; }
  }
}
</style>
