<template>
  <!-- #ifdef H5 -->
  <view v-if="call.active" class="call-window" :class="{ minimized: call.minimized }">
    <!-- 最小化悬浮窗 -->
    <view v-if="call.minimized" class="minimized-bar" @click="$emit('toggleMinimize')">
      <view class="pulse-dot"></view>
      <svg class="mini-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path v-if="call.type === 'video'" d="M23 7l-7 5 7 5V7z M16 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/>
        <path v-else d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
      <text class="mini-duration">{{ formatDuration(call.duration) }}</text>
    </view>

    <!-- 完整窗口 -->
    <view v-else class="full-window">
      <!-- 模糊背景 -->
      <view class="blur-bg">
        <image v-if="call.callerAvatar" :src="resolveImageUrl(call.callerAvatar)" class="blur-img" mode="aspectFill" />
        <view class="blur-overlay"></view>
      </view>

      <!-- 最小化按钮 (右上角) -->
      <view class="minimize-btn" @click="$emit('toggleMinimize')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="4 14 10 14 10 20"/>
          <polyline points="20 10 14 10 14 4"/>
          <line x1="14" y1="10" x2="21" y2="3"/>
          <line x1="3" y1="21" x2="10" y2="14"/>
        </svg>
      </view>

      <!-- 视频区域 -->
      <view v-if="call.type === 'video'" class="video-area">
        <!-- 远端视频 - 使用原生 video 元素以支持 srcObject -->
        <video
          v-if="remoteStream"
          ref="remoteVideoRef"
          class="remote-video"
          autoplay
          playsinline
          :srcObject="remoteStream"
        ></video>
        <view v-else class="video-placeholder">
          <view class="avatar-section">
            <view class="avatar-ring ring-1"></view>
            <view class="avatar-ring ring-2"></view>
            <app-avatar :src="call.callerAvatar" :name="call.callerName" :size="240" round />
          </view>
          <text class="caller-name">{{ call.callerName || '对方' }}</text>
        </view>

        <!-- 本地视频 - 使用原生 video 元素以支持 srcObject -->
        <video
          v-if="localStream && !call.camOff"
          ref="localVideoRef"
          class="local-video"
          autoplay
          muted
          playsinline
          :srcObject="localStream"
        ></video>
      </view>

      <!-- 语音通话 / 视频占位 -->
      <view v-else class="audio-area">
        <view class="avatar-section">
          <view class="avatar-ring ring-ping"></view>
          <view class="avatar-container">
            <app-avatar :src="call.callerAvatar" :name="call.callerName" :size="256" round />
          </view>
        </view>
        <text class="caller-name">{{ call.callerName || '对方' }}</text>
        <text class="call-status-text">{{ call.statusText }}</text>
        <text v-if="call.status === 'connected'" class="call-duration">{{ formatDuration(call.duration) }}</text>
      </view>

      <!-- 底部控制按钮 -->
      <view class="controls">
        <!-- 来电状态 - 接听/拒绝 -->
        <template v-if="call.status === 'incoming'">
          <view class="action-item" @click="$emit('reject')">
            <view class="control-btn decline">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                <path d="M23 7l-7 5 7 5V7z M16 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/>
              </svg>
            </view>
            <text class="action-label">拒绝</text>
          </view>
          <view class="action-item" @click="$emit('accept')">
            <view class="control-btn accept">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </view>
            <text class="action-label">接听</text>
          </view>
        </template>

        <!-- 通话中状态 -->
        <template v-else-if="call.status === 'connected'">
          <view class="action-item" @click="$emit('toggleMute')">
            <view class="control-btn" :class="{ active: call.muted }">
              <svg v-if="call.muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="1" y1="1" x2="23" y2="23"/>
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </view>
            <text class="action-label">{{ call.muted ? '已静音' : '静音' }}</text>
          </view>
          <view v-if="call.type === 'video'" class="action-item" @click="$emit('toggleCamera')">
            <view class="control-btn" :class="{ active: call.camOff }">
              <svg v-if="call.camOff" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            </view>
            <text class="action-label">{{ call.camOff ? '已关闭' : '摄像头' }}</text>
          </view>
          <view class="action-item" @click="$emit('end')">
            <view class="control-btn hangup">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                <path d="M23 7l-7 5 7 5V7z M16 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/>
              </svg>
            </view>
            <text class="action-label">挂断</text>
          </view>
        </template>

        <!-- 呼叫中状态 -->
        <template v-else-if="call.status === 'outgoing'">
          <view class="action-item" @click="$emit('end')">
            <view class="control-btn hangup">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                <path d="M23 7l-7 5 7 5V7z M16 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/>
              </svg>
            </view>
            <text class="action-label">挂断</text>
          </view>
        </template>
      </view>
    </view>
  </view>
  <!-- #endif -->

  <!-- #ifndef H5 -->
  <view v-if="call.active" class="call-unsupported">
    <text>当前平台暂不支持音视频通话</text>
    <wd-button type="primary" @click="$emit('end')">关闭</wd-button>
  </view>
  <!-- #endif -->
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import { resolveImageUrl } from '@/utils/image'
import type { CallState } from '@/composables/useWebRTC'

interface Props {
  call: CallState
  localStream?: MediaStream | null
  remoteStream?: MediaStream | null
  formatDuration: (seconds: number) => string
}

const props = defineProps<Props>()

defineEmits<{
  (e: 'accept'): void
  (e: 'reject'): void
  (e: 'end'): void
  (e: 'toggleMute'): void
  (e: 'toggleCamera'): void
  (e: 'toggleMinimize'): void
}>()

const localVideoRef = ref<HTMLVideoElement | null>(null)
const remoteVideoRef = ref<HTMLVideoElement | null>(null)

watch(() => props.localStream, (stream) => {
  // #ifdef H5
  nextTick(() => {
    if (localVideoRef.value && stream) {
      localVideoRef.value.srcObject = stream
    }
  })
  // #endif
}, { immediate: true })

watch(() => props.remoteStream, (stream) => {
  // #ifdef H5
  nextTick(() => {
    if (remoteVideoRef.value && stream) {
      remoteVideoRef.value.srcObject = stream
    }
  })
  // #endif
}, { immediate: true })
</script>

<style lang="scss" scoped>
.call-window {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: #111;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &.minimized {
    top: calc(var(--status-bar-height, 0) + 240rpx);
    right: 32rpx;
    left: auto;
    bottom: auto;
    width: 200rpx;
    height: 280rpx;
    border-radius: 32rpx;
    border: 2rpx solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.4);
    overflow: hidden;
  }
}

.minimized-bar {
  width: 100%;
  height: 100%;
  background: #2c2c2e;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  cursor: pointer;

  .pulse-dot {
    position: absolute;
    bottom: 16rpx;
    width: 8rpx;
    height: 8rpx;
    background: #10b981;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  .mini-icon {
    width: 64rpx;
    height: 64rpx;
    color: #10b981;
  }

  .mini-duration {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.9);
    font-family: monospace;
  }
}

.full-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.blur-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #0f172a; // 设计稿: 来电背景

  .blur-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.4;
    filter: blur(40rpx);
    transform: scale(1.1);
  }

  .blur-overlay {
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.8); // 设计稿: bg-[#0f172a]/80
    backdrop-filter: blur(48px);
    -webkit-backdrop-filter: blur(48px);
  }
  
  // 设计稿: 呼吸光球动画
  &::before, &::after {
    content: '';
    position: absolute;
    width: 600rpx;
    height: 600rpx;
    border-radius: 50%;
    filter: blur(160rpx);
    opacity: 0.4;
    animation: glow-breathe 8s ease-in-out infinite;
  }
  
  &::before {
    top: 10%;
    left: -100rpx;
    background: #9333ea; // purple-600
    animation-delay: 0s;
  }
  
  &::after {
    bottom: 10%;
    right: -100rpx;
    background: #2563eb; // blue-600
    animation-delay: 4s;
  }
}

.minimize-btn {
  position: absolute;
  top: calc(28rpx + var(--status-bar-height, 0));
  right: 40rpx;
  z-index: 20;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;

  svg {
    width: 40rpx;
    height: 40rpx;
    color: #fff;
  }

  &:active {
    transform: scale(0.9);
    background: rgba(255, 255, 255, 0.2);
  }
}

.video-area {
  flex: 1;
  position: relative;
  z-index: 5;

  .remote-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .local-video {
    position: absolute;
    top: 40rpx;
    right: 40rpx;
    width: 200rpx;
    height: 280rpx;
    border-radius: 24rpx;
    object-fit: cover;
    border: 4rpx solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.3);
    transform: scaleX(-1);
  }
}

.video-placeholder, .audio-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 5;
  padding-top: 200rpx;
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.avatar-section {
  position: relative;
  margin-bottom: 48rpx;

  // 设计稿: 头像波纹效果
  .avatar-ring {
    position: absolute;
    inset: -20rpx;
    border-radius: 50%;
    border: 2rpx solid rgba(255, 255, 255, 0.3); // 设计稿: border-white/30

    &.ring-1 {
      animation: ripple 2s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
    
    &.ring-2 {
      animation: ripple 2s cubic-bezier(0, 0, 0.2, 1) infinite;
      animation-delay: 1s;
    }

    &.ring-ping {
      inset: -4rpx;
      border: 2rpx solid rgba(255, 255, 255, 0.3);
      animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
  }

  .avatar-container {
    position: relative;
    border: 4rpx solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    padding: 4rpx;
    box-shadow: 0 40rpx 100rpx rgba(0, 0, 0, 0.4);
    z-index: 1;
  }
}

.caller-name {
  font-size: 60rpx;
  font-weight: 700;
  color: #fff;
  letter-spacing: -1rpx;
  margin-bottom: 16rpx;
}

.call-status-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  letter-spacing: 0.5rpx;
}

.call-duration {
  font-size: 40rpx;
  font-family: monospace;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 32rpx;
}

.controls {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 80rpx;
  padding: 60rpx;
  padding-bottom: calc(128rpx + env(safe-area-inset-bottom));
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.control-btn {
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  border: 2rpx solid rgba(255, 255, 255, 0.1);
  color: #fff;
  transition: all 0.3s;

  svg {
    width: 56rpx;
    height: 56rpx;
  }

  &:active { transform: scale(0.95); }

  &.active {
    background: #fff;
    color: #000;
    border-color: #fff;
  }

  &.accept {
    width: 160rpx;
    height: 160rpx;
    background: #10b981;
    border: none;
    box-shadow: 0 0 80rpx rgba(16, 185, 129, 0.4);

    svg {
      width: 72rpx;
      height: 72rpx;
    }

    &:active { background: #059669; }
  }

  &.decline {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.1);

    &:active { background: #ef4444; }
  }

  &.hangup {
    width: 160rpx;
    height: 160rpx;
    background: #ef4444;
    border: none;
    border-radius: 50%;
    box-shadow: 0 8rpx 40rpx rgba(239, 68, 68, 0.3);

    svg {
      width: 72rpx;
      height: 72rpx;
    }

    &:active { background: #dc2626; }
  }
}

.action-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
}

.call-unsupported {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 40rpx;

  text {
    font-size: 32rpx;
    color: var(--text-secondary);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes ping {
  0% { transform: scale(1); opacity: 0.3; }
  75%, 100% { transform: scale(1.3); opacity: 0; }
}

@keyframes fadeInUp {
  from { transform: translateY(40rpx); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

// 设计稿: 呼吸光球动画
@keyframes glow-breathe {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.2); opacity: 0.5; }
}

// 设计稿: 头像波纹动画
@keyframes ripple {
  0% { transform: scale(1); opacity: 0.4; }
  100% { transform: scale(2.5); opacity: 0; }
}
</style>
