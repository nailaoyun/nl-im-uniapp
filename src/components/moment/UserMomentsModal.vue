<template>
  <wd-popup
    v-model="modelValue"
    position="bottom"
    :safe-area-inset-bottom="true"
    custom-style="border-radius: 32rpx 32rpx 0 0; max-height: 85vh;"
    @close="handleClose"
  >
    <view class="moments-modal" :class="{ dark: isDark }">
      <!-- 头部 -->
      <view class="modal-header">
        <view class="header-info">
          <app-avatar
            v-if="user"
            :src="user.avatar"
            :name="user.name || ''"
            :size="64"
            radius="50%"
          />
          <view class="header-text">
            <text class="header-title">{{ user?.name || '用户' }}的朋友圈</text>
            <text class="header-subtitle">共 {{ totalCount }} 条动态</text>
          </view>
        </view>
        <wd-icon
          name="close"
          size="40rpx"
          color="var(--text-secondary)"
          @click="handleClose"
        />
      </view>

      <!-- 加载中 -->
      <view v-if="loading && moments.length === 0" class="loading-state">
        <wd-loading />
        <text>加载中...</text>
      </view>

      <!-- 空状态 -->
      <view v-else-if="moments.length === 0" class="empty-state">
        <wd-icon name="camera" size="80rpx" color="var(--text-tertiary)" />
        <text>暂无朋友圈动态</text>
      </view>

      <!-- 动态列表 -->
      <scroll-view
        v-else
        class="moments-list"
        scroll-y
        @scrolltolower="loadMore"
      >
        <view
          v-for="moment in moments"
          :key="moment.id"
          class="moment-item"
        >
          <!-- 时间 -->
          <text class="moment-time">{{ formatTime(moment.created_at) }}</text>

          <!-- 文字内容 -->
          <view v-if="moment.content" class="moment-text">
            <text>{{ moment.content }}</text>
          </view>

          <!-- 图片 -->
          <view v-if="moment.media_type === 1" class="moment-images" :class="`images-${getImageCount(moment)}`">
            <wd-img
              v-for="(url, index) in parseMediaUrls(moment.media_urls)"
              :key="index"
              :src="resolveImageUrl(url)"
              :width="getImageSize(moment)"
              :height="getImageSize(moment)"
              mode="aspectFill"
              radius="12rpx"
              enable-preview
              :preview-src-list="parseMediaUrls(moment.media_urls).map(resolveImageUrl)"
            />
          </view>

          <!-- 视频 -->
          <view v-if="moment.media_type === 2" class="moment-video">
            <video
              :src="resolveImageUrl(parseMediaUrls(moment.media_urls)[0])"
              class="video-player"
              object-fit="cover"
              :show-fullscreen-btn="true"
              :show-play-btn="true"
            />
          </view>

          <!-- 位置 -->
          <view v-if="moment.location" class="moment-location">
            <wd-icon name="location" size="24rpx" color="var(--color-primary)" />
            <text>{{ moment.location }}</text>
          </view>

          <!-- 互动数据 -->
          <view class="moment-stats">
            <view class="stat-item">
              <wd-icon name="heart" size="24rpx" :color="moment.is_liked ? '#ef4444' : 'var(--text-tertiary)'" />
              <text>{{ moment.like_count || 0 }}</text>
            </view>
            <view class="stat-item">
              <wd-icon name="chat" size="24rpx" color="var(--text-tertiary)" />
              <text>{{ moment.comment_count || 0 }}</text>
            </view>
          </view>
        </view>

        <!-- 加载更多 -->
        <wd-loadmore :state="loadState" @loadmore="loadMore" />
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { resolveImageUrl } from '@/utils/image'
import { formatTime } from '@/utils/format'
import * as momentApi from '@/api/modules/moment'
import { parseMediaUrls } from '@/types/moment'
import AppAvatar from '@/components/common/AppAvatar.vue'
import type { Moment } from '@/types/moment'
import type { User } from '@/types/api'

const props = defineProps<{
  modelValue: boolean
  user: User | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { isDark } = useTheme()

// 状态
const moments = ref<Moment[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = 20
const totalCount = ref(0)
const hasMore = ref(true)
const loadState = ref<'loading' | 'finished' | 'error'>('loading')

// 监听显示状态和用户变化
watch(() => [props.modelValue, props.user], async ([show, user]) => {
  if (show && user && (user as User).id) {
    await loadMoments(true)
  } else {
    moments.value = []
    page.value = 1
    hasMore.value = true
    totalCount.value = 0
  }
}, { immediate: true })

// 加载用户朋友圈
async function loadMoments(refresh = false) {
  if (!props.user?.id) return
  if (loading.value) return

  if (refresh) {
    page.value = 1
    hasMore.value = true
  }

  if (!hasMore.value) return

  loading.value = true
  loadState.value = 'loading'

  try {
    const response = await momentApi.getUserMoments(props.user.id, page.value, pageSize)
    const newMoments = response.data || []

    if (refresh) {
      moments.value = newMoments
    } else {
      moments.value = [...moments.value, ...newMoments]
    }

    totalCount.value = response.total || moments.value.length
    hasMore.value = moments.value.length < totalCount.value
    loadState.value = hasMore.value ? 'loading' : 'finished'

    if (!refresh && newMoments.length > 0) {
      page.value++
    }
  } catch (e) {
    console.error('Failed to load user moments:', e)
    loadState.value = 'error'
  } finally {
    loading.value = false
  }
}

// 加载更多
function loadMore() {
  if (!loading.value && hasMore.value) {
    page.value++
    loadMoments()
  }
}

// 获取图片数量
function getImageCount(moment: Moment): number {
  const urls = parseMediaUrls(moment.media_urls)
  return Math.min(urls.length, 9)
}

// 获取图片尺寸
function getImageSize(moment: Moment): string {
  const count = getImageCount(moment)
  if (count === 1) return '300rpx'
  if (count <= 4) return '200rpx'
  return '150rpx'
}

function handleClose() {
  emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
.moments-modal {
  display: flex;
  flex-direction: column;
  background: var(--bg-content);
  max-height: 85vh;
}

.modal-header {
  padding: 32rpx;
  border-bottom: 1rpx solid var(--divider-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(90deg, rgba(var(--color-primary-rgb), 0.1) 0%, transparent 100%);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.header-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.header-subtitle {
  font-size: 22rpx;
  color: var(--text-tertiary);
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  gap: 20rpx;
  color: var(--text-tertiary);
  font-size: 26rpx;
}

.moments-list {
  flex: 1;
  max-height: calc(85vh - 150rpx);
}

.moment-item {
  padding: 30rpx;
  border-bottom: 1rpx solid var(--divider-color);
}

.moment-time {
  font-size: 22rpx;
  color: var(--text-tertiary);
  margin-bottom: 16rpx;
  display: block;
}

.moment-text {
  font-size: 28rpx;
  color: var(--text-primary);
  line-height: 1.6;
  margin-bottom: 16rpx;
}

.moment-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.moment-video {
  margin-bottom: 16rpx;

  .video-player {
    width: 100%;
    max-width: 500rpx;
    height: 400rpx;
    border-radius: 12rpx;
  }
}

.moment-location {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 22rpx;
  color: var(--text-tertiary);
  margin-bottom: 16rpx;
}

.moment-stats {
  display: flex;
  gap: 32rpx;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 22rpx;
  color: var(--text-tertiary);
}
</style>

