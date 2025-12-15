<template>
  <!-- #ifdef H5 || APP-PLUS -->
  <view v-if="call.active" class="call-window" :class="{ minimized: call.minimized }">
    <!-- 最小化悬浮窗 -->
    <view v-if="call.minimized" class="minimized-bar" @click="$emit('toggleMinimize')">
      <view class="pulse-dot"></view>
      <!-- 替换 SVG 为 wd-icon -->
      <view class="mini-icon-wrap">
        <wd-icon
            :name="call.type === 'video' ? 'video' : 'phone'"
            size="48rpx"
            color="#10b981"
        />
      </view>
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
        <wd-icon name="arrow-down" size="48rpx" color="#fff" />
      </view>

      <!-- 视频区域 -->
      <view v-if="call.type === 'video'" class="video-area">
        <!-- 远端视频 -->
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

        <!-- 本地视频 -->
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
              <wd-icon name="close" size="56rpx" color="#fff" />
            </view>
            <text class="action-label">拒绝</text>
          </view>
          <view class="action-item" @click="$emit('accept')">
            <view class="control-btn accept">
              <wd-icon name="phone" size="64rpx" color="#fff" />
            </view>
            <text class="action-label">接听</text>
          </view>
        </template>

        <!-- 通话中状态 -->
        <template v-else-if="call.status === 'connected'">
          <!-- 静音 -->
          <view class="action-item" @click="$emit('toggleMute')">
            <view class="control-btn" :class="{ active: call.muted }">
              <wd-icon
                  :name="call.muted ? 'mute' : 'sound'"
                  size="56rpx"
                  :color="call.muted ? '#000' : '#fff'"
              />
            </view>
            <text class="action-label">{{ call.muted ? '已静音' : '静音' }}</text>
          </view>

          <!-- 摄像头 (仅视频通话) -->
          <view v-if="call.type === 'video'" class="action-item" @click="$emit('toggleCamera')">
            <view class="control-btn" :class="{ active: call.camOff }">
              <wd-icon
                  name="video"
                  size="56rpx"
                  :color="call.camOff ? '#000' : '#fff'"
              />
            </view>
            <text class="action-label">{{ call.camOff ? '已关闭' : '摄像头' }}</text>
          </view>

          <!-- 挂断 -->
          <view class="action-item" @click="$emit('end')">
            <view class="control-btn hangup">
              <wd-icon name="phone" size="64rpx" color="#fff" custom-style="transform: rotate(135deg);" />
            </view>
            <text class="action-label">挂断</text>
          </view>
        </template>

        <!-- 呼叫中状态 -->
        <template v-else-if="call.status === 'outgoing'">
          <view class="action-item" @click="$emit('end')">
            <view class="control-btn hangup">
              <wd-icon name="phone" size="64rpx" color="#fff" custom-style="transform: rotate(135deg);" />
            </view>
            <text class="action-label">挂断</text>
          </view>
        </template>
      </view>
    </view>
  </view>
  <!-- #endif -->

  <!-- #ifndef H5 || APP-PLUS -->
  <view v-if="call.active" class="call-unsupported">
    <view class="unsupported-content">
      <view class="icon-box">
        <wd-icon name="video" size="80rpx" color="#f97316" />
      </view>
      <text class="unsupported-title">暂不支持音视频通话</text>
      <text class="unsupported-desc">当前平台暂不支持音视频通话功能</text>
      <text class="unsupported-desc">请使用网页版体验完整功能</text>

      <view class="unsupported-actions">
        <wd-button type="info" plain @click="copyWebUrl" custom-style="margin-right: 20rpx;">
          复制网页链接
        </wd-button>
        <wd-button type="primary" @click="$emit('end')">
          关闭
        </wd-button>
      </view>
    </view>
    <wd-toast />
  </view>
  <!-- #endif -->
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import { resolveImageUrl } from '@/utils/image'
import { useToast } from 'wot-design-uni'
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
const toast = useToast()

function copyWebUrl() {
  const webUrl = 'https://your-web-domain.com/chat'
  uni.setClipboardData({
    data: webUrl,
    success: () => {
      toast.success('链接已复制，请在浏览器中打开')
    },
    fail: () => {
      toast.error('复制失败')
    }
  })
}

watch(() => props.localStream, (stream) => {
  // #ifdef H5 || APP-PLUS
  nextTick(() => {
    if (localVideoRef.value && stream) {
      localVideoRef.value.srcObject = stream
    }
  })
  // #endif
}, { immediate: true })

watch(() => props.remoteStream, (stream) => {
  // #ifdef H5 || APP-PLUS
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
    right: 32rpx;
    left: auto;
    bottom: auto;
    width: 200rpx;
    height: 280rpx;
    border-radius: 32rpx;
    border: 2rpx solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.4);
    overflow: hidden;

    /* #ifdef MP-WEIXIN */
    top: calc(var(--status-bar-height, 44px) + 88rpx + 240rpx);
    /* #endif */

    /* #ifndef MP-WEIXIN */
    top: calc(var(--status-bar-height, 0) + 240rpx);
    /* #endif */
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

  .mini-icon-wrap {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
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
  background: #0f172a;

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
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(48px);
    -webkit-backdrop-filter: blur(48px);
  }

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
    background: #9333ea;
    animation-delay: 0s;
  }

  &::after {
    bottom: 10%;
    right: -100rpx;
    background: #2563eb;
    animation-delay: 4s;
  }
}

.minimize-btn {
  position: absolute;
  right: 40rpx;
  z-index: 20;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  display: flex;

  /* #ifdef MP-WEIXIN */
  top: calc(28rpx + var(--status-bar-height, 44px) + 88rpx);
  /* #endif */

  /* #ifndef MP-WEIXIN */
  top: calc(28rpx + var(--status-bar-height, 0));
  /* #endif */
  align-items: center;
  justify-content: center;
  transition: all 0.15s;

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

  .avatar-ring {
    position: absolute;
    inset: -20rpx;
    border-radius: 50%;
    border: 2rpx solid rgba(255, 255, 255, 0.3);

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
  background: linear-gradient(180deg, #1c1917 0%, #0c0a09 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
}

.unsupported-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 600rpx;
}

.icon-box {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: rgba(249, 115, 22, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 48rpx;
}

.unsupported-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #f5f5f4;
  margin-bottom: 24rpx;
}

.unsupported-desc {
  font-size: 28rpx;
  color: #a8a29e;
  line-height: 1.6;
  margin-bottom: 8rpx;
}

.unsupported-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 48rpx;
  gap: 24rpx;
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

@keyframes glow-breathe {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.2); opacity: 0.5; }
}

@keyframes ripple {
  0% { transform: scale(1); opacity: 0.4; }
  100% { transform: scale(2.5); opacity: 0; }
}
</style>
