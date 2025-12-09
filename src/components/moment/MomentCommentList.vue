<template>
  <view class="comment-list" :class="{ dark: isDark }">
    <view
      v-for="comment in comments"
      :key="comment.id"
      class="comment-item"
    >
      <!-- 头像 -->
      <app-avatar
        :src="comment.user?.avatar"
        :name="comment.user?.name || ''"
        :size="72"
        radius="50%"
      />

      <!-- 评论内容 -->
      <view class="comment-content">
        <view class="comment-header">
          <view class="user-info">
            <text class="user-name">{{ comment.user?.name }}</text>
            <view v-if="comment.reply_to_user" class="reply-info">
              <text class="reply-text">回复</text>
              <text class="reply-name">{{ comment.reply_to_user.name }}</text>
            </view>
          </view>
          <!-- 删除按钮 -->
          <view
            v-if="canDelete(comment)"
            class="delete-btn"
            @click="$emit('delete', comment.id)"
          >
            <wd-icon name="delete" size="28rpx" color="var(--text-tertiary)" />
          </view>
        </view>

        <!-- 评论文本 -->
        <text class="comment-text">{{ comment.content }}</text>

        <!-- 底部操作 -->
        <view class="comment-footer">
          <text class="comment-time">{{ formatTime(comment.created_at) }}</text>
          <text class="reply-btn" @click="$emit('reply', comment)">回复</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'
import { formatTime } from '@/utils/format'
import AppAvatar from '@/components/common/AppAvatar.vue'
import type { MomentComment } from '@/types/moment'

const props = defineProps<{
  comments: MomentComment[]
  momentUserId: string
}>()

defineEmits<{
  reply: [comment: MomentComment]
  delete: [commentId: number]
}>()

const { isDark } = useTheme()
const authStore = useAuthStore()

function canDelete(comment: MomentComment): boolean {
  const userId = authStore.user?.id
  return userId === comment.user_id || userId === props.momentUserId
}
</script>

<style lang="scss" scoped>
.comment-list {
  padding: 0 24rpx;
}

.comment-item {
  display: flex;
  gap: 20rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--divider-color);

  &:last-child {
    border-bottom: none;
  }
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.user-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8rpx;
}

.user-name {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--text-primary);
}

.reply-info {
  display: flex;
  align-items: center;
  gap: 6rpx;

  .reply-text {
    font-size: 26rpx;
    color: var(--text-tertiary);
  }

  .reply-name {
    font-size: 26rpx;
    color: var(--text-secondary);
  }
}

.delete-btn {
  padding: 8rpx;
  margin: -8rpx;

  &:active {
    opacity: 0.7;
  }
}

.comment-text {
  font-size: 28rpx;
  color: var(--text-secondary);
  line-height: 1.6;
  display: block;
}

.comment-footer {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-top: 12rpx;
}

.comment-time {
  font-size: 24rpx;
  color: var(--text-tertiary);
}

.reply-btn {
  font-size: 24rpx;
  color: var(--text-link);

  &:active {
    opacity: 0.7;
  }
}
</style>

