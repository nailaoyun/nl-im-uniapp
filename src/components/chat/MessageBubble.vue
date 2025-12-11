<template>
  <view class="msg-row" :class="{ 'is-self': isSelf }">
    <!-- 头像 -->
    <view class="avatar-wrap" @click="$emit('avatar-click', msg.sender_user_id)">
      <app-avatar
          :src="avatar"
          :name="avatarName"
          :size="80"
          radius="24rpx"
      />
    </view>

    <!-- 内容列 -->
    <view class="content-col" :class="{ 'items-end': isSelf }">
      <!-- 群聊昵称 -->
      <text v-if="senderName" class="sender-name">{{ senderName }}</text>

      <!-- 气泡实体 -->
      <view
          class="bubble"
          :class="[
            isSelf ? 'bubble-self' : 'bubble-other',
            mediaTypeClass
          ]"
          @longpress="$emit('long-press', msg)"
      >
        <!-- 0. 纯文本 -->
        <text v-if="msg.message_type === 0" class="msg-text" selectable>{{ msg.content }}</text>

        <!-- 1. 图片 -->
        <view v-else-if="msg.message_type === 1" class="image-bubble">
          <image
              :src="getMediaUrl(msg)"
              mode="widthFix"
              class="msg-image"
              @click="$emit('preview-image', getMediaUrl(msg))"
          />
        </view>

        <!-- 2. 语音 -->
        <view v-else-if="msg.message_type === 2" class="audio-capsule" @click="$emit('play-audio', msg)">
          <view class="play-icon-box">
            <svg v-if="playingAudioId !== msg.id" viewBox="0 0 24 24" fill="currentColor" class="play-icon"><path d="M12 2a10 10 0 0 0-10 10 10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor" class="play-icon"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          </view>
          <view class="wave-visualizer">
            <view class="wave-bar" :class="{ animating: playingAudioId === msg.id }"></view>
            <view class="wave-bar" :class="{ animating: playingAudioId === msg.id }"></view>
            <view class="wave-bar" :class="{ animating: playingAudioId === msg.id }"></view>
            <view class="wave-bar" :class="{ animating: playingAudioId === msg.id }"></view>
          </view>
          <text class="duration-tag">{{ msg.duration || 0 }}"</text>
        </view>

        <!-- 3. 视频 -->
        <view v-else-if="msg.message_type === 3" class="video-preview" @click="$emit('play-video', getMediaUrl(msg))">
          <image :src="getVideoThumb(msg)" mode="aspectFill" class="video-thumb" />
          <view class="play-overlay">
            <view class="play-btn-circle">
              <svg viewBox="0 0 24 24" fill="currentColor" class="icon-play"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </view>
          </view>
        </view>

        <!-- 8. 文件 -->
        <view v-else-if="msg.message_type === 8" class="file-card" :class="{ 'file-self': isSelf }" @click="$emit('open-file', getMediaUrl(msg))">
          <view class="file-icon-box" :class="{ 'icon-self': isSelf }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </view>
          <view class="file-meta">
            <text class="fname text-ellipsis">{{ getFileName(msg) }}</text>
            <text class="fsize">{{ formatSize(getFileSize(msg)) }}</text>
          </view>
        </view>

        <text v-else class="msg-text">[不支持的消息类型]</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import { resolveImageUrl } from '@/utils/image'
import { formatSize } from '@/utils/format'
import type { ChatMessage } from '@/types/api'

const props = defineProps<{
  msg: ChatMessage
  isSelf: boolean
  senderName?: string
  avatar?: string
  playingAudioId?: number | null
}>()

defineEmits<{
  (e: 'avatar-click', id?: string): void
  (e: 'play-audio', msg: ChatMessage): void
  (e: 'preview-image', url: string): void
  (e: 'play-video', url: string): void
  (e: 'open-file', url: string): void
  (e: 'long-press', msg: ChatMessage): void
}>()

const avatarName = computed(() => props.senderName || 'U')

const mediaTypeClass = computed(() => {
  const type = props.msg.message_type
  if (type === 1) return 'media-bubble image'
  if (type === 2) return 'media-bubble audio'
  if (type === 3) return 'media-bubble video'
  if (type === 8) return 'media-bubble file'
  return ''
})

// Helpers (复用原 index.vue 逻辑)
function getMediaUrl(msg: ChatMessage): string {
  let url = ''
  if (typeof msg.extra === 'string') {
    try { const extra = JSON.parse(msg.extra); url = extra.url || msg.content } catch { url = msg.content }
  } else { url = msg.extra?.url || msg.content }
  return resolveImageUrl(url)
}

function getFileName(msg: ChatMessage) {
  const extra = typeof msg.extra === 'string' ? JSON.parse(msg.extra || '{}') : msg.extra
  return extra?.name || '未知文件'
}

function getFileSize(msg: ChatMessage) {
  const extra = typeof msg.extra === 'string' ? JSON.parse(msg.extra || '{}') : msg.extra
  return extra?.size || 0
}

function getVideoThumb(msg: ChatMessage) {
  const extra = typeof msg.extra === 'string' ? JSON.parse(msg.extra || '{}') : msg.extra
  if (extra?.thumb || extra?.cover) return resolveImageUrl(extra.thumb || extra.cover)
  return getMediaUrl(msg)
}
</script>

<style lang="scss" scoped>
/* * 气泡组件样式
 * 完全复用原 index.vue 的 .msg-row, .bubble 及其子元素样式
 */

/* 布局 */
.msg-row {
  display: flex; align-items: flex-start; gap: 20rpx;
  &.is-self { flex-direction: row-reverse; }
}
.avatar-wrap { width: 80rpx; height: 80rpx; flex-shrink: 0; border-radius: 24rpx; box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.05); }
.content-col {
  max-width: 72%; display: flex; flex-direction: column;
  &.items-end { align-items: flex-end; }
  .sender-name { font-size: 20rpx; color: #9ca3af; margin-bottom: 8rpx; margin-left: 8rpx; .theme-dark & { color: #78716c; } }
}

/* 核心气泡 */
.bubble {
  padding: 24rpx; border-radius: 32rpx; font-size: 30rpx; line-height: 1.6; position: relative; word-break: break-all; transition: all 0.3s ease;

  /* 对方消息 */
  &.bubble-other {
    background: #ffffff; color: #1f2937; border-bottom-left-radius: 8rpx; box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.05);
    .theme-dark & { background: #262626; color: #e7e5e4; border: 2rpx solid #292524; box-shadow: none; }
  }

  /* 自己消息 */
  &.bubble-self {
    background: linear-gradient(135deg, #6366F1, #4F46E5); color: #ffffff; border-bottom-right-radius: 8rpx; box-shadow: 0 4rpx 16rpx rgba(79, 70, 229, 0.2);
    .theme-dark & { background: linear-gradient(135deg, #fb923c, #ea580c); box-shadow: 0 4rpx 16rpx rgba(234, 88, 12, 0.3); }
  }

  /* 媒体容器 */
  &.media-bubble { padding: 0; background: transparent !important; box-shadow: none !important; border: none !important; }
}

/* 媒体类型 */
.image-bubble .msg-image { width: 360rpx; border-radius: 32rpx; background: #f3f4f6; border: 2rpx solid #f3f4f6; .theme-dark & { background: #292524; border-color: #292524; } }

/* 语音胶囊 */
.audio-capsule {
  display: flex; align-items: center; gap: 20rpx; min-width: 180rpx; padding: 24rpx; background: #ffffff; border-radius: 32rpx;
  .theme-dark & { background: #262626; border: 2rpx solid #292524; }

  /* 自己的语音 */
  .is-self & { background: linear-gradient(135deg, #6366F1, #4F46E5) !important; border: none !important; .theme-dark & { background: linear-gradient(135deg, #fb923c, #ea580c) !important; } }

  .play-icon { width: 32rpx; height: 32rpx; color: #6b7280; .theme-dark & { color: #a8a29e; } .is-self & { color: rgba(255,255,255,0.9); } }

  .wave-visualizer {
    display: flex; align-items: flex-end; gap: 6rpx; height: 24rpx;
    .wave-bar {
      width: 6rpx; background: #9ca3af; border-radius: 4rpx; height: 8rpx;
      .theme-dark & { background: #78716c; } .is-self & { background: rgba(255,255,255,0.6); }
      &.animating { animation: wave 0.8s infinite ease-in-out; }
    }
  }
  .duration-tag { font-size: 26rpx; font-weight: 500; margin-left: auto; color: #6b7280; .theme-dark & { color: #a8a29e; } .is-self & { color: #fff; } }
}
@keyframes wave { 0%, 100% { height: 8rpx; } 50% { height: 24rpx; } }

/* 视频预览 */
.video-preview {
  position: relative; width: 360rpx; height: 200rpx; border-radius: 32rpx; overflow: hidden; background: #000;
  .video-thumb { width: 100%; height: 100%; opacity: 0.9; }
  .play-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
  .play-btn-circle { width: 80rpx; height: 80rpx; background: rgba(0,0,0,0.3); backdrop-filter: blur(4px); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2rpx solid rgba(255,255,255,0.3); color: #fff; svg { width: 32rpx; height: 32rpx; } }
}

/* 文件卡片 */
.file-card {
  background: #ffffff; padding: 24rpx; border-radius: 32rpx; display: flex; align-items: center; gap: 24rpx; min-width: 400rpx; border: 2rpx solid #f3f4f6;
  .theme-dark & { background: #262626; border-color: #292524; }

  &.file-self { background: linear-gradient(135deg, #6366F1, #4F46E5); border: none; .theme-dark & { background: linear-gradient(135deg, #fb923c, #ea580c); } .f-name { color: #fff; } .f-size { color: rgba(255,255,255,0.7); } }

  .file-icon-box {
    width: 80rpx; height: 80rpx; background: #ffedd5; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; color: #f97316;
    .theme-dark & { background: rgba(154, 52, 18, 0.3); }
    &.icon-self { background: rgba(255,255,255,0.2); color: #fff; }
    svg { width: 40rpx; height: 40rpx; }
  }
  .file-meta { flex: 1; display: flex; flex-direction: column; overflow: hidden; .f-name { font-size: 28rpx; font-weight: 500; color: #1f2937; .theme-dark & { color: #e7e5e4; } } .f-size { font-size: 22rpx; color: #9ca3af; .theme-dark & { color: #78716c; } } }
}
</style>
