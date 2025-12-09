<template>
  <view
    v-if="callState.joined && !callState.incoming"
    class="call-window"
    :class="{ minimized: callState.minimized }"
  >
    <!-- 顶部功能栏 -->
    <view class="window-header" @click="handleMinimize">
      <view class="header-left">
        <view class="status-dot"></view>
        <text class="header-title">群聊通话</text>
        <text class="duration">{{ formatDuration(callState.duration) }}</text>
      </view>
      <view class="header-right" @click.stop>
        <view class="minimize-btn" @click="toggleMinimize">
          <wd-icon :name="callState.minimized ? 'expand' : 'collapse'" size="32rpx" color="#fff" />
        </view>
      </view>
    </view>

    <!-- 最小化模式 -->
    <view v-if="callState.minimized" class="minimized-content" @click="toggleMinimize">
      <wd-icon name="phone" size="48rpx" color="#10b981" />
      <text class="mini-duration">{{ formatDuration(callState.duration) }}</text>
    </view>

    <!-- 正常模式 -->
    <template v-else>
      <!-- 视频网格 -->
      <scroll-view class="video-grid" scroll-y>
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
          
          <!-- 摄像头关闭时显示头像 -->
          <view v-if="callState.isSelfCamOff" class="cam-off-placeholder">
            <app-avatar
              :name="'我'"
              :size="120"
              radius="50%"
            />
            <text class="cam-off-text">摄像头已关闭</text>
          </view>

          <view class="video-label">
            <text class="label-name">我</text>
            <wd-icon
              v-if="callState.isSelfMuted"
              name="volume-mute"
              size="24rpx"
              color="#ef4444"
            />
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

          <!-- 无视频流或摄像头关闭 -->
          <view v-if="!user.stream || user.isCamOff" class="cam-off-placeholder">
            <view class="avatar-wrap">
              <app-avatar
                :src="user.avatar"
                :name="user.name"
                :size="120"
                radius="50%"
              />
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
            <wd-icon
              v-if="user.isMuted"
              name="volume-mute"
              size="24rpx"
              color="#ef4444"
            />
          </view>

          <!-- 说话指示 -->
          <view
            v-if="!user.isMuted && user.volume && user.volume > 0.05"
            class="speaking-indicator"
          ></view>
        </view>
      </scroll-view>

      <!-- 底部控制栏 -->
      <view class="control-bar">
        <!-- 静音 -->
        <view class="control-item" @click="webRTC.toggleSelfMute()">
          <view class="control-btn" :class="{ active: callState.isSelfMuted }">
            <wd-icon
              :name="callState.isSelfMuted ? 'volume-mute' : 'volume'"
              size="40rpx"
              color="#fff"
            />
          </view>
          <text class="control-label">{{ callState.isSelfMuted ? '已静音' : '静音' }}</text>
        </view>

        <!-- 挂断 -->
        <view class="control-item" @click="webRTC.leaveCall()">
          <view class="control-btn hangup-btn">
            <wd-icon name="phone-off" size="48rpx" color="#fff" />
          </view>
          <text class="control-label">挂断</text>
        </view>

        <!-- 摄像头 -->
        <view class="control-item" @click="webRTC.toggleSelfCamera()">
          <view class="control-btn" :class="{ active: callState.isSelfCamOff }">
            <wd-icon
              :name="callState.isSelfCamOff ? 'video-off' : 'video'"
              size="40rpx"
              color="#fff"
            />
          </view>
          <text class="control-label">{{ callState.isSelfCamOff ? '已关闭' : '摄像头' }}</text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useGroupWebRTC } from '@/composables/useGroupWebRTC'
import AppAvatar from '@/components/common/AppAvatar.vue'

const webRTC = useGroupWebRTC()
const { callState, participants, formatDuration, localStream } = webRTC

const localVideoRef = ref<HTMLVideoElement | null>(null)

// 绑定本地视频流
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

function handleMinimize() {
  if (callState.minimized) {
    toggleMinimize()
  }
}
</script>

<style lang="scss" scoped>
.call-window {
  position: fixed;
  z-index: 9999;
  background: #1e1e1e;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;

  // 正常模式
  &:not(.minimized) {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 0;
  }

  // 最小化模式
  &.minimized {
    top: calc(var(--status-bar-height, 0) + 160rpx);
    right: 24rpx;
    width: 200rpx;
    height: 280rpx;
    border-radius: 24rpx;
    border: 2rpx solid rgba(255, 255, 255, 0.1);
  }
}

.window-header {
  height: 88rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;

  .minimized & {
    background: transparent;
    height: 60rpx;
    padding: 0 16rpx;
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.status-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #10b981;
  animation: pulse 2s infinite;
}

.header-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #fff;

  .minimized & {
    display: none;
  }
}

.duration {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  font-family: monospace;
  padding-left: 12rpx;
  border-left: 2rpx solid rgba(255, 255, 255, 0.2);
  margin-left: 4rpx;

  .minimized & {
    display: none;
  }
}

.minimize-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    background: rgba(255, 255, 255, 0.2);
  }
}

.minimized-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  background: #252525;
}

.mini-duration {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.7);
  font-family: monospace;
}

.video-grid {
  flex: 1;
  padding: 100rpx 16rpx 16rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  align-content: flex-start;
}

.video-item {
  position: relative;
  width: calc(50% - 8rpx);
  aspect-ratio: 4 / 3;
  background: #252525;
  border-radius: 16rpx;
  overflow: hidden;
  border: 2rpx solid rgba(255, 255, 255, 0.05);
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: cover;

  &.mirror {
    transform: scaleX(-1);
  }
}

.cam-off-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  background: #252525;
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

.cam-off-text,
.participant-name {
  font-size: 24rpx;
  color: #fff;
}

.participant-status {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.5);
}

.video-label {
  position: absolute;
  bottom: 12rpx;
  left: 12rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8rpx;
  backdrop-filter: blur(4px);

  .label-name {
    font-size: 22rpx;
    color: #fff;
    font-weight: 500;
    max-width: 120rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.speaking-indicator {
  position: absolute;
  inset: 0;
  border: 4rpx solid rgba(16, 185, 129, 0.6);
  border-radius: 16rpx;
  pointer-events: none;
  animation: speakPulse 0.5s ease-in-out;
}

.control-bar {
  height: 180rpx;
  padding: 24rpx 0 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 80rpx;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
}

.control-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.control-btn {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;

  &:active {
    transform: scale(0.95);
  }

  &.active {
    background: #fff;

    :deep(.wd-icon) {
      color: #000 !important;
    }
  }
}

.hangup-btn {
  width: 120rpx;
  height: 120rpx;
  border-radius: 32rpx;
  background: #ef4444;
  box-shadow: 0 10rpx 40rpx rgba(239, 68, 68, 0.4);

  &:active {
    background: #dc2626;
  }
}

.control-label {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.6);
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

