<template>
  <view class="detail-page">
    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <template v-else-if="moment">
      <view class="moment-content">
        <!-- 用户信息 -->
        <view class="header">
          <image
            v-if="moment.user?.avatar"
            class="avatar"
            :src="moment.user.avatar"
            mode="aspectFill"
          />
          <view v-else class="avatar avatar-placeholder">
            {{ moment.user?.name?.charAt(0) || '?' }}
          </view>
          <view class="user-info">
            <text class="name">{{ moment.user?.name || '未知' }}</text>
            <text class="time">{{ formatTime(moment.created_at) }}</text>
          </view>
        </view>

        <!-- 内容 -->
        <view class="content">
          <text>{{ moment.content }}</text>
        </view>

        <!-- 图片 -->
        <view v-if="moment.media_type === 1" class="images">
          <image
            v-for="(url, index) in parseMediaUrls(moment.media_urls)"
            :key="index"
            class="image"
            :src="url"
            mode="aspectFill"
            @click="previewImages(parseMediaUrls(moment.media_urls), index)"
          />
        </view>

        <!-- 视频 -->
        <view v-if="moment.media_type === 2" class="video">
          <video
            :src="parseMediaUrls(moment.media_urls)[0]"
            class="video-player"
            object-fit="cover"
          />
        </view>

        <!-- 操作栏 -->
        <view class="actions">
          <view class="action-item" @click="toggleLike">
            <text :class="{ liked: moment.is_liked }">{{ moment.is_liked ? '❤️' : '🤍' }}</text>
            <text>{{ moment.like_count || 0 }}</text>
          </view>
          <view class="action-item">
            <text>💬</text>
            <text>{{ moment.comment_count || 0 }}</text>
          </view>
        </view>
      </view>

      <!-- 评论列表 -->
      <view class="comments-section">
        <view class="section-title">评论 ({{ moment.comment_count || 0 }})</view>

        <view v-if="moment.comments?.length === 0" class="empty-comments">
          <text>暂无评论</text>
        </view>

        <view v-else class="comments-list">
          <view
            v-for="comment in moment.comments"
            :key="comment.id"
            class="comment-item"
          >
            <image
              v-if="comment.user?.avatar"
              class="avatar"
              :src="comment.user.avatar"
              mode="aspectFill"
            />
            <view v-else class="avatar avatar-placeholder">
              {{ comment.user?.name?.charAt(0) || '?' }}
            </view>
            <view class="comment-content">
              <view class="comment-header">
                <text class="name">{{ comment.user?.name || '未知' }}</text>
                <text class="time">{{ formatTime(comment.created_at) }}</text>
              </view>
              <view class="comment-text">
                <text v-if="comment.reply_to_user" class="reply-to">
                  回复 {{ comment.reply_to_user.name }}：
                </text>
                <text>{{ comment.content }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 评论输入框 -->
      <view class="comment-input-bar">
        <input
          v-model="commentText"
          class="input"
          type="text"
          placeholder="发表评论..."
          confirm-type="send"
          @confirm="sendComment"
        />
        <button class="send-btn" @click="sendComment">发送</button>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMomentStore } from '@/stores'
import { formatTime } from '@/utils/format'
import { parseMediaUrls } from '@/types/moment'
import type { Moment } from '@/types/moment'

const momentStore = useMomentStore()

const loading = ref(true)
const moment = ref<Moment | null>(null)
const commentText = ref('')
const momentId = ref(0)

onMounted(async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = (currentPage as any).$page?.options || {}
  momentId.value = parseInt(options.id || '0')

  if (momentId.value) {
    await loadDetail()
  }
})

async function loadDetail() {
  loading.value = true
  try {
    await momentStore.fetchMomentDetail(momentId.value)
    moment.value = momentStore.currentMoment
  } catch (error) {
    console.error('加载动态详情失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function previewImages(urls: string[], current: number) {
  uni.previewImage({ urls, current })
}

async function toggleLike() {
  if (!moment.value) return
  try {
    await momentStore.toggleLike(moment.value.id)
  } catch {
    // 忽略错误
  }
}

async function sendComment() {
  if (!commentText.value.trim() || !moment.value) return

  try {
    await momentStore.addComment(moment.value.id, { content: commentText.value.trim() })
    commentText.value = ''
    // 刷新评论
    await momentStore.refreshComments(moment.value.id)
  } catch {
    uni.showToast({ title: '评论失败', icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background: #ededed;
  padding-bottom: 120rpx;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60rpx;
  color: #999;
}

.moment-content {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;

  .header {
    display: flex;
    margin-bottom: 20rpx;

    .avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 8rpx;
      margin-right: 20rpx;
    }

    .avatar-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #07c160;
      color: #fff;
      font-size: 32rpx;
    }

    .user-info {
      .name {
        display: block;
        font-size: 32rpx;
        color: #576b95;
        font-weight: 500;
      }

      .time {
        display: block;
        font-size: 24rpx;
        color: #999;
        margin-top: 8rpx;
      }
    }
  }

  .content {
    font-size: 32rpx;
    color: #333;
    line-height: 1.6;
    margin-bottom: 20rpx;
  }

  .images {
    display: flex;
    flex-wrap: wrap;
    gap: 8rpx;
    margin-bottom: 20rpx;

    .image {
      width: 200rpx;
      height: 200rpx;
      border-radius: 8rpx;
    }
  }

  .video {
    margin-bottom: 20rpx;

    .video-player {
      width: 100%;
      height: 400rpx;
      border-radius: 8rpx;
    }
  }

  .actions {
    display: flex;
    gap: 48rpx;

    .action-item {
      display: flex;
      align-items: center;
      gap: 8rpx;

      text {
        font-size: 28rpx;
        color: #666;

        &.liked {
          color: #fa5151;
        }
      }
    }
  }
}

.comments-section {
  background: #fff;
  padding: 30rpx;

  .section-title {
    font-size: 28rpx;
    color: #999;
    margin-bottom: 24rpx;
  }

  .empty-comments {
    text-align: center;
    padding: 40rpx;
    color: #999;
  }
}

.comment-item {
  display: flex;
  margin-bottom: 24rpx;

  .avatar {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    margin-right: 16rpx;
  }

  .avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #07c160;
    color: #fff;
    font-size: 24rpx;
  }

  .comment-content {
    flex: 1;

    .comment-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8rpx;

      .name {
        font-size: 28rpx;
        color: #576b95;
      }

      .time {
        font-size: 24rpx;
        color: #999;
      }
    }

    .comment-text {
      font-size: 28rpx;
      color: #333;

      .reply-to {
        color: #576b95;
      }
    }
  }
}

.comment-input-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 16rpx 20rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);

  .input {
    flex: 1;
    height: 72rpx;
    padding: 0 24rpx;
    background: #f5f5f5;
    border-radius: 36rpx;
    font-size: 28rpx;
  }

  .send-btn {
    margin-left: 16rpx;
    padding: 0 32rpx;
    height: 72rpx;
    line-height: 72rpx;
    background: #07c160;
    color: #fff;
    font-size: 28rpx;
    border-radius: 36rpx;

    &::after {
      border: none;
    }
  }
}
</style>
