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

      <!-- 底部操作栏 - 四宫格布局 -->
      <view class="action-bar">
        <view class="action-grid">
          <view class="action-item" @click="handleSendMessage">
            <view class="action-icon blue">
              <!-- #ifdef H5 -->
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <!-- #endif -->
              <!-- #ifdef MP-WEIXIN -->
              <wd-icon name="chat" size="48rpx" color="#fff" />
              <!-- #endif -->
            </view>
            <text>发消息</text>
          </view>

          <view class="action-item" @click="handleAudioCall">
            <view class="action-icon green">
              <!-- #ifdef H5 -->
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <!-- #endif -->
              <!-- #ifdef MP-WEIXIN -->
              <wd-icon name="phone" size="48rpx" color="#fff" />
              <!-- #endif -->
            </view>
            <text>语音</text>
          </view>

          <view class="action-item" @click="handleVideoCall">
            <view class="action-icon purple">
              <!-- #ifdef H5 -->
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
              <!-- #endif -->
              <!-- #ifdef MP-WEIXIN -->
              <wd-icon name="video" size="48rpx" color="#fff" />
              <!-- #endif -->
            </view>
            <text>视频</text>
          </view>
          
          <view class="action-item" @click="handleViewMoments">
            <view class="action-icon orange">
              <!-- #ifdef H5 -->
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
              <!-- #endif -->
              <!-- #ifdef MP-WEIXIN -->
              <wd-icon name="smile" size="48rpx" color="#fff" />
              <!-- #endif -->
            </view>
            <text>朋友圈</text>
          </view>
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

// 发送消息 - 跳转到聊天页
function handleSendMessage() {
  handleClose()
  if (props.user?.id) {
    uni.navigateTo({
      url: `/pages/chat/index?targetId=${props.user.id}&name=${encodeURIComponent(props.user.name || '')}&avatar=${encodeURIComponent(props.user.avatar || '')}`
    })
  }
  emit('send-message')
}

// 语音通话
function handleAudioCall() {
  handleClose()
  emit('audio-call')
}

// 视频通话
function handleVideoCall() {
  handleClose()
  emit('video-call')
}

// 查看朋友圈
function handleViewMoments() {
  handleClose()
  emit('view-moments')
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
  padding: 24rpx 40rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid var(--divider-color);
  background: var(--bg-content);
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24rpx;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  transition: all 0.2s;

  &:active {
    transform: scale(0.95);
  }

  text {
    font-size: 24rpx;
    color: var(--text-secondary);
  }
}

.action-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  svg {
    width: 44rpx;
    height: 44rpx;
  }

  &.blue {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    box-shadow: 0 8rpx 20rpx rgba(59, 130, 246, 0.3);
  }

  &.green {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    box-shadow: 0 8rpx 20rpx rgba(16, 185, 129, 0.3);
  }

  &.purple {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    box-shadow: 0 8rpx 20rpx rgba(139, 92, 246, 0.3);
  }

  &.orange {
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    box-shadow: 0 8rpx 20rpx rgba(249, 115, 22, 0.3);
  }
}
</style>

