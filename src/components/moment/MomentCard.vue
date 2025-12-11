<template>
  <view class="moment-card" @click="onClick">
    <!-- 头像 -->
    <view class="card-avatar">
      <app-avatar
        :src="moment.user?.avatar"
        :name="moment.user?.name"
        :size="80"
        radius="8rpx"
      />
    </view>

    <!-- 内容 -->
    <view class="card-content">
      <!-- 用户名 -->
      <text class="card-username">{{ moment.user?.name || '未知' }}</text>

      <!-- 文本 -->
      <view v-if="moment.content" class="card-text">
        <text>{{ moment.content }}</text>
      </view>

      <!-- 图片 -->
      <view v-if="moment.media_type === 1" class="card-images">
        <wd-img
          v-for="(url, index) in mediaUrls"
          :key="index"
          :src="resolveImageUrl(url)"
          :width="imageSize"
          :height="imageSize"
          mode="aspectFill"
          radius="8rpx"
          enable-preview
          :preview-src-list="mediaUrls.map(resolveImageUrl)"
        />
      </view>

      <!-- 视频 -->
      <view v-if="moment.media_type === 2" class="card-video">
        <video
          :src="resolveImageUrl(mediaUrls[0])"
          class="video-player"
          object-fit="cover"
          :show-fullscreen-btn="true"
        />
      </view>

      <!-- 底部 -->
      <view class="card-footer">
        <text class="card-time">{{ formatTime(moment.created_at) }}</text>
        <view class="card-actions">
          <view class="action-item" @click.stop="onAction">
            <wd-icon name="more" size="32rpx" />
          </view>
        </view>
      </view>

      <!-- 互动区域 -->
      <view v-if="hasInteractions" class="card-interactions">
        <!-- 点赞 -->
        <view v-if="moment.likes?.length" class="likes-row">
          <wd-icon name="heart-fill" size="28rpx" color="#fa5151" />
          <text class="likes-text">
            {{ moment.likes.map(l => l.user?.name || '').join('、') }}
          </text>
        </view>
        <!-- 评论 -->
        <view
          v-for="comment in moment.comments"
          :key="comment.id"
          class="comment-row"
        >
          <text class="comment-user">{{ comment.user?.name || '未知' }}</text>
          <text v-if="comment.reply_to_user">
            回复 <text class="comment-user">{{ comment.reply_to_user.name }}</text>
          </text>
          <text>: {{ comment.content }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import { formatTime } from '@/utils/format'
import { resolveImageUrl } from '@/utils/image'
import { parseMediaUrls } from '@/types/moment'
import type { Moment } from '@/types/moment'

interface Props {
  moment: Moment
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'action'): void
}>()

const mediaUrls = computed(() => parseMediaUrls(props.moment.media_urls))

const imageSize = computed(() => {
  const count = mediaUrls.value.length
  if (count === 1) return '400rpx'
  if (count <= 4) return '200rpx'
  return '150rpx'
})

const hasInteractions = computed(() => {
  return (props.moment.likes?.length || 0) > 0 || (props.moment.comments?.length || 0) > 0
})

function onClick() {
  emit('click')
}

function onAction() {
  emit('action')
}
</script>

<style lang="scss" scoped>
.moment-card {
  display: flex;
  padding: 30rpx;
  border-bottom: 1rpx solid var(--divider-color);
}

.card-avatar {
  margin-right: 24rpx;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-username {
  display: block;
  font-size: 30rpx;
  font-weight: 500;
  color: var(--text-link);
  margin-bottom: 12rpx;
}

.card-text {
  font-size: 30rpx;
  color: var(--text-primary);
  line-height: 1.6;
  margin-bottom: 16rpx;
}

.card-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.card-video {
  margin-bottom: 16rpx;

  .video-player {
    width: 100%;
    height: 400rpx;
    border-radius: 8rpx;
  }
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;

  .card-time {
    font-size: 24rpx;
    color: var(--text-tertiary);
  }

  .card-actions {
    .action-item {
      padding: 8rpx;
      color: var(--text-tertiary);
    }
  }
}

.card-interactions {
  background: var(--bg-hover);
  border-radius: 8rpx;
  padding: 16rpx;
  position: relative;
  
  // 三角指示器
  &::before {
    content: '';
    position: absolute;
    top: -12rpx;
    left: 24rpx;
    width: 0;
    height: 0;
    border-left: 12rpx solid transparent;
    border-right: 12rpx solid transparent;
    border-bottom: 12rpx solid var(--bg-hover);
  }

  .likes-row {
    display: flex;
    align-items: center;
    gap: 8rpx;
    font-size: 26rpx;
    color: var(--text-link);
    margin-bottom: 8rpx;

    .likes-text {
      flex: 1;
    }
  }

  .comment-row {
    font-size: 26rpx;
    color: var(--text-primary);
    line-height: 1.8;

    .comment-user {
      color: var(--text-link);
    }
  }
}
</style>







