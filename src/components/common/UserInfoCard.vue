<template>
  <wd-popup
    v-model="modelValue"
    position="bottom"
    :safe-area-inset-bottom="true"
    custom-style="border-radius: 32rpx 32rpx 0 0; max-height: 85vh;"
    @close="handleClose"
  >
    <view class="user-info-card" :class="{ dark: isDark }">
      <!-- 背景装饰 -->
      <view class="bg-decoration"></view>

      <!-- 关闭按钮 -->
      <view class="close-btn" @click="handleClose">
        <wd-icon name="close" size="32rpx" color="rgba(255,255,255,0.6)" />
      </view>

      <!-- 滚动内容 -->
      <scroll-view class="card-content" scroll-y>
        <!-- 头部信息 -->
        <view class="header-section">
          <!-- 头像 -->
          <view class="avatar-wrap" @click="viewAvatar">
            <app-avatar
              :src="user?.avatar"
              :name="user?.name || '未知'"
              :size="160"
              radius="50%"
              class="main-avatar"
            />
            <view v-if="user?.is_online" class="online-dot"></view>
          </view>

          <!-- 名称和签名 -->
          <view class="name-wrap">
            <text class="user-name">{{ user?.name || '未知' }}</text>
            <view v-if="user?.gender" class="gender-badge" :class="user.gender === 1 ? 'male' : 'female'">
              <wd-icon :name="user.gender === 1 ? 'male' : 'female'" size="20rpx" />
            </view>
          </view>
          <text class="user-desc">{{ user?.desc || '暂无签名' }}</text>

          <!-- ID标签 -->
          <view class="info-tags">
            <text class="info-tag" @click="copyText(user?.id)">ID: {{ user?.id || '未知' }}</text>
            <text v-if="user?.region" class="info-tag">{{ user.region }}</text>
          </view>
        </view>

        <!-- 详细信息 -->
        <view class="info-section">
          <wd-cell-group>
            <wd-cell
              v-if="user?.phone"
              title="手机号"
              :value="user.phone"
              is-link
              @click="copyText(user.phone)"
            >
              <template #icon>
                <view class="cell-icon"><wd-icon name="phone" size="32rpx" /></view>
              </template>
            </wd-cell>
            <wd-cell
              v-if="user?.email"
              title="邮箱"
              :value="user.email"
              is-link
              @click="copyText(user.email)"
            >
              <template #icon>
                <view class="cell-icon"><wd-icon name="mail" size="32rpx" /></view>
              </template>
            </wd-cell>
            <wd-cell
              v-if="user?.region"
              title="地区"
              :value="user.region"
            >
              <template #icon>
                <view class="cell-icon"><wd-icon name="location" size="32rpx" /></view>
              </template>
            </wd-cell>
          </wd-cell-group>
        </view>

        <!-- 朋友圈预览 -->
        <view class="moments-section">
          <view class="section-header" @click="$emit('view-moments')">
            <view class="header-left">
              <view class="cell-icon"><wd-icon name="picture" size="32rpx" /></view>
              <text class="section-title">朋友圈</text>
            </view>
            <view class="header-right">
              <text class="view-more">查看更多</text>
              <wd-icon name="arrow-right" size="28rpx" color="var(--color-primary)" />
            </view>
          </view>

          <!-- 加载中 -->
          <view v-if="loadingMoments" class="moments-loading">
            <wd-loading />
          </view>

          <!-- 朋友圈内容 -->
          <view v-else-if="userMoments.length > 0" class="moments-content">
            <view class="moments-grid">
              <view
                v-for="(moment, index) in userMoments.slice(0, 3)"
                :key="moment.id"
                class="moment-item"
                @click="openMomentPreview(index)"
              >
                <wd-img
                  v-if="getMomentImage(moment)"
                  :src="resolveImageUrl(getMomentImage(moment) || '')"
                  width="100%"
                  height="100%"
                  mode="aspectFill"
                  radius="16rpx"
                />
                <view v-else class="text-placeholder">
                  <wd-icon name="file" size="40rpx" color="var(--text-tertiary)" />
                </view>
              </view>
            </view>
            <text v-if="userMoments[0]?.content" class="latest-text">
              {{ userMoments[0].content }}
            </text>
          </view>

          <!-- 空状态 -->
          <view v-else class="moments-empty">
            <wd-icon name="camera" size="60rpx" color="var(--text-tertiary)" />
            <text>暂无朋友圈动态</text>
          </view>
        </view>
      </scroll-view>

      <!-- 底部操作栏 -->
      <view class="action-bar">
        <view class="action-btn primary" @click="$emit('send-message')">
          <wd-icon name="chat" size="40rpx" color="#fff" />
          <text>发消息</text>
        </view>
        <view class="action-btn" @click="$emit('audio-call')">
          <wd-icon name="phone" size="40rpx" />
          <text>语音</text>
        </view>
        <view class="action-btn" @click="$emit('video-call')">
          <wd-icon name="video" size="40rpx" />
          <text>视频</text>
        </view>
      </view>
    </view>

    <wd-toast />
  </wd-popup>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useToast } from 'wot-design-uni'
import { resolveImageUrl } from '@/utils/image'
import * as momentApi from '@/api/modules/moment'
import { parseMediaUrls } from '@/types/moment'
import AppAvatar from '@/components/common/AppAvatar.vue'
import type { User } from '@/types/api'
import type { Moment } from '@/types/moment'

const props = defineProps<{
  modelValue: boolean
  user: User | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'send-message': []
  'audio-call': []
  'video-call': []
  'view-moments': []
}>()

const { isDark } = useTheme()
const toast = useToast()

// 朋友圈相关
const userMoments = ref<Moment[]>([])
const loadingMoments = ref(false)

// 监听显示和用户变化
watch(() => [props.modelValue, props.user], async ([show, user]) => {
  if (show && user && (user as User).id) {
    await loadUserMoments((user as User).id)
  } else {
    userMoments.value = []
  }
}, { immediate: true })

// 加载用户朋友圈
async function loadUserMoments(userId: string) {
  loadingMoments.value = true
  try {
    const response = await momentApi.getUserMoments(userId, 1, 3)
    userMoments.value = response.data || []
  } catch (e) {
    console.error('Failed to load user moments:', e)
    userMoments.value = []
  } finally {
    loadingMoments.value = false
  }
}

// 获取动态第一张图片
function getMomentImage(moment: Moment): string | null {
  if (moment.media_type === 1 && moment.media_urls) {
    const urls = parseMediaUrls(moment.media_urls)
    return urls[0] || null
  }
  return null
}

// 打开朋友圈预览
function openMomentPreview(index: number) {
  const images: string[] = []
  userMoments.value.slice(0, 3).forEach(moment => {
    if (moment.media_type === 1 && moment.media_urls) {
      const urls = parseMediaUrls(moment.media_urls)
      images.push(...urls.map(resolveImageUrl))
    }
  })

  if (images.length > 0) {
    uni.previewImage({
      urls: images,
      current: images[Math.min(index, images.length - 1)]
    })
  }
}

// 复制文本
function copyText(text?: string) {
  if (!text) return
  uni.setClipboardData({
    data: text,
    success: () => {
      toast.success('复制成功')
    },
    fail: () => {
      toast.error('复制失败')
    }
  })
}

// 查看头像
function viewAvatar() {
  if (props.user?.avatar) {
    uni.previewImage({
      urls: [resolveImageUrl(props.user.avatar)]
    })
  }
}

function handleClose() {
  emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
.user-info-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-content);
  max-height: 85vh;
  position: relative;
  overflow: hidden;
}

.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 300rpx;
  background: linear-gradient(180deg, rgba(var(--color-primary-rgb), 0.15) 0%, transparent 100%);
  pointer-events: none;
}

.close-btn {
  position: absolute;
  top: 32rpx;
  right: 32rpx;
  z-index: 50;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    background: rgba(0, 0, 0, 0.3);
  }
}

.card-content {
  flex: 1;
  max-height: calc(85vh - 180rpx);
}

.header-section {
  padding: 80rpx 40rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 10;
}

.avatar-wrap {
  position: relative;

  .main-avatar {
    border: 8rpx solid var(--bg-content);
    box-shadow: 0 10rpx 40rpx rgba(0, 0, 0, 0.2);
  }

  .online-dot {
    position: absolute;
    bottom: 10rpx;
    right: 10rpx;
    width: 32rpx;
    height: 32rpx;
    background: #10b981;
    border-radius: 50%;
    border: 6rpx solid var(--bg-content);
  }
}

.name-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 32rpx;
}

.user-name {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--text-primary);
}

.gender-badge {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  &.male {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
  }

  &.female {
    background: rgba(236, 72, 153, 0.2);
    color: #ec4899;
  }
}

.user-desc {
  font-size: 26rpx;
  color: var(--text-tertiary);
  margin-top: 12rpx;
  max-width: 80%;
  text-align: center;
}

.info-tags {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}

.info-tag {
  padding: 8rpx 20rpx;
  background: var(--bg-hover);
  border-radius: 8rpx;
  font-size: 22rpx;
  color: var(--text-tertiary);
  font-family: monospace;
}

.info-section {
  padding: 0 24rpx;
  margin-bottom: 24rpx;
}

.cell-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 12rpx;
  background: var(--bg-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  color: var(--text-secondary);
}

.moments-section {
  margin: 0 24rpx 24rpx;
  background: var(--bg-hover);
  border-radius: 24rpx;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  border-bottom: 1rpx solid var(--divider-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.section-title {
  font-size: 28rpx;
  color: var(--text-secondary);
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.view-more {
  font-size: 24rpx;
  color: var(--color-primary);
}

.moments-loading {
  padding: 60rpx;
  display: flex;
  justify-content: center;
}

.moments-content {
  padding: 24rpx;
}

.moments-grid {
  display: flex;
  gap: 12rpx;
}

.moment-item {
  flex: 1;
  aspect-ratio: 1;
  border-radius: 16rpx;
  overflow: hidden;
  background: var(--bg-content);

  .text-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-content);
  }
}

.latest-text {
  font-size: 24rpx;
  color: var(--text-tertiary);
  margin-top: 16rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.moments-empty {
  padding: 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  font-size: 24rpx;
  color: var(--text-tertiary);
}

.action-bar {
  display: flex;
  justify-content: center;
  gap: 32rpx;
  padding: 24rpx 40rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid var(--divider-color);
  background: var(--bg-content);
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 20rpx 32rpx;
  border-radius: 24rpx;
  background: var(--bg-hover);
  color: var(--text-secondary);
  min-width: 140rpx;
  transition: all 0.2s;

  &:active {
    transform: scale(0.95);
  }

  text {
    font-size: 22rpx;
  }

  &.primary {
    background: var(--color-primary);
    color: #fff;
    box-shadow: 0 8rpx 20rpx rgba(var(--color-primary-rgb), 0.3);
  }
}
</style>

