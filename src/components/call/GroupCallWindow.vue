<template>
  <view
    v-if="callState.joined && !callState.incoming"
    class="call-window"
    :class="{ minimized: callState.minimized }"
  >
    <!-- 最小化内容 -->
    <view v-if="callState.minimized" class="minimized-content" @click="toggleMinimize">
      <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
        <polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
      <text class="mini-duration">{{ formatDuration(callState.duration) }}</text>
      <view class="mini-pulse"></view>
    </view>

    <!-- 顶部功能栏 (渐变遮罩) -->
    <view v-if="!callState.minimized" class="window-header">
      <view class="header-left">
        <view class="status-dot"></view>
        <text class="header-title">群聊通话</text>
        <text class="duration">{{ formatDuration(callState.duration) }}</text>
      </view>
      <view class="minimize-btn" @click="toggleMinimize">
        <!-- minimize-2 icon -->
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
          <polyline points="4 14 10 14 10 20"/>
          <polyline points="20 10 14 10 14 4"/>
          <line x1="14" y1="10" x2="21" y2="3"/>
          <line x1="3" y1="21" x2="10" y2="14"/>
        </svg>
      </view>
    </view>

    <!-- 视频网格 -->
    <scroll-view v-if="!callState.minimized" class="video-grid" scroll-y>
      <!-- 自己的画面 -->
      <view class="video-item self-video">
        <!-- #ifdef H5 -->
        <video
          v-if="localStream && !callState.isSelfCamOff"
          ref="localVideoRef"
          class="video-element mirror"
          autoplay
          muted
          playsinline
          :srcObject="localStream"
        ></video>
        <!-- #endif -->
        
        <view v-if="callState.isSelfCamOff" class="cam-off-placeholder">
          <app-avatar :name="'我'" :size="160" round />
          <text class="cam-off-text">摄像头已关闭</text>
        </view>

        <view class="video-label">
          <text class="label-name">我</text>
          <svg v-if="callState.isSelfMuted" class="mute-icon" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
          </svg>
        </view>
      </view>

      <!-- 其他成员 -->
      <view
        v-for="user in participants"
        :key="user.userId"
        class="video-item"
      >
        <!-- #ifdef H5 -->
        <video
          v-if="user.stream && !user.isCamOff"
          class="video-element"
          autoplay
          playsinline
          :srcObject="user.stream"
        ></video>
        <!-- #endif -->

        <view v-if="!user.stream || user.isCamOff" class="cam-off-placeholder">
          <view class="avatar-wrap">
            <app-avatar :src="user.avatar" :name="user.name" :size="160" round />
            <view v-if="user.status === 'connecting'" class="connecting-overlay">
              <wd-loading color="#fff" size="32rpx" />
            </view>
          </view>
          <text class="participant-name">{{ user.name }}</text>
          <text class="participant-status">
            {{ user.status === 'connecting' ? '连接中...' : user.status === 'rejected' ? '已拒绝' : '摄像头关闭' }}
          </text>
        </view>

        <view class="video-label">
          <text class="label-name">{{ user.name }}</text>
          <svg v-if="user.isMuted" class="mute-icon" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
          </svg>
        </view>

        <!-- 说话指示 -->
        <view
          v-if="!user.isMuted && user.volume && user.volume > 0.05"
          class="speaking-indicator"
        ></view>
      </view>
    </scroll-view>

    <!-- 底部控制栏 -->
    <view v-if="!callState.minimized" class="control-bar">
      <view class="control-item" @click="webRTC.toggleSelfMute()">
        <view class="control-btn" :class="{ active: callState.isSelfMuted }">
          <svg v-if="callState.isSelfMuted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
        <text class="control-label">{{ callState.isSelfMuted ? '已静音' : '静音' }}</text>
      </view>

      <view class="control-item" @click="webRTC.leaveCall()">
        <view class="control-btn hangup-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5">
            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        </view>
        <text class="control-label">挂断</text>
      </view>

      <view class="control-item" @click="webRTC.toggleSelfCamera()">
        <view class="control-btn" :class="{ active: callState.isSelfCamOff }">
          <svg v-if="callState.isSelfCamOff" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </view>
        <text class="control-label">{{ callState.isSelfCamOff ? '已关闭' : '摄像头' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useGroupWebRTC } from '@/composables/useGroupWebRTC'
import AppAvatar from '@/components/common/AppAvatar.vue'

const webRTC = useGroupWebRTC()
const { callState, participants, formatDuration, localStream } = webRTC

const localVideoRef = ref<HTMLVideoElement | null>(null)

watchEffect(() => {
  const stream = localStream.value
  const videoEl = localVideoRef.value
  if (videoEl && stream) {
    videoEl.muted = true
    if ((videoEl as any).srcObject !== stream) {
      (videoEl as any).srcObject = stream
      videoEl.play().catch(e => console.error(e))
    }
  }
})

function toggleMinimize() {
  callState.minimized = !callState.minimized
}
</script>

<style lang="scss" scoped>
.call-window {
  position: fixed;
  z-index: 9999;
  background: #1c1c1e;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.5);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:not(.minimized) {
    inset: 0;
  }

  &.minimized {
    top: calc(var(--status-bar-height, 0) + 240rpx);
    right: 32rpx;
    width: 200rpx;
    height: 280rpx;
    border-radius: 32rpx;
    border: 2rpx solid rgba(255, 255, 255, 0.15);
  }
}

.minimized-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  background: #2c2c2e;
  position: relative;
  cursor: pointer;

  svg {
    width: 64rpx;
    height: 64rpx;
  }

  .mini-duration {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.9);
    font-family: monospace;
  }

  .mini-pulse {
    position: absolute;
    bottom: 16rpx;
    width: 8rpx;
    height: 8rpx;
    background: #10b981;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  &:active {
    opacity: 0.9;
  }
}

.window-header {
  height: 200rpx;
  padding: 0 40rpx;
  padding-top: calc(24rpx + var(--status-bar-height, 0));
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, transparent 100%);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  pointer-events: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24rpx;
  pointer-events: auto;
}

.status-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 20rpx #10b981;
  animation: pulse 2s infinite;
}

.header-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #fff;
  letter-spacing: 0.5rpx;
}

.duration {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
  font-family: monospace;
  padding-left: 24rpx;
  border-left: 2rpx solid rgba(255, 255, 255, 0.1);
}

.minimize-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  pointer-events: auto;

  svg {
    width: 32rpx;
    height: 32rpx;
  }

  &:active {
    transform: scale(0.9);
    background: rgba(255, 255, 255, 0.2);
  }
}

.video-grid {
  flex: 1;
  padding: calc(var(--status-bar-height, 0) + 200rpx) 24rpx 240rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  align-content: flex-start;
  overflow-y: auto;
}

.video-item {
  position: relative;
  width: calc(50% - 8rpx);
  aspect-ratio: 3 / 4;
  background: #2c2c2e;
  border-radius: 32rpx;
  overflow: hidden;
  border: 2rpx solid rgba(255, 255, 255, 0.05);
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: cover;

  &.mirror { transform: scaleX(-1); }
}

.cam-off-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  background: #2c2c2e;
}

.avatar-wrap {
  position: relative;
}

.connecting-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cam-off-text, .participant-name {
  font-size: 26rpx;
  color: #fff;
  font-weight: 500;
}

.participant-status {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.5);
}

.video-label {
  position: absolute;
  bottom: 24rpx;
  left: 24rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 8rpx 16rpx;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 16rpx;
  backdrop-filter: blur(16rpx);
  border: 1rpx solid rgba(255, 255, 255, 0.1);

  .label-name {
    font-size: 20rpx;
    color: #fff;
    font-weight: 500;
    max-width: 140rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mute-icon {
    width: 24rpx;
    height: 24rpx;
  }
}

.speaking-indicator {
  position: absolute;
  inset: 0;
  border: 4rpx solid #10b981;
  border-radius: 32rpx;
  pointer-events: none;
  animation: speakPulse 0.5s ease-in-out;
}

.control-bar {
  height: 320rpx;
  padding: 40rpx 0;
  padding-bottom: calc(64rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 80rpx;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.5) 50%, transparent 100%);
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
}

.control-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.control-btn {
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 2rpx solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: all 0.3s;
  backdrop-filter: blur(8rpx);

  svg {
    width: 48rpx;
    height: 48rpx;
  }

  &:active { transform: scale(0.95); }

  &.active {
    background: #fff;
    color: #000;
    border-color: #fff;
  }
}

.hangup-btn {
  width: 144rpx;
  height: 72rpx;
  border-radius: 56rpx;
  background: #ef4444;
  border: none;
  box-shadow: 0 8rpx 32rpx rgba(239, 68, 68, 0.3);
  padding: 0 32rpx;

  svg {
    width: 64rpx;
    height: 64rpx;
  }

  &:active { background: #dc2626; }
}

.control-label {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.5);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes speakPulse {
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}
</style>
