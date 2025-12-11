<template>
  <view v-if="callState.incoming" class="incoming-call-overlay">
    <!-- 动态呼吸背景 -->
    <view class="bg-effects">
      <view class="glow glow-1"></view>
      <view class="glow glow-2"></view>
    </view>
    <view class="bg-overlay"></view>

    <!-- 主要内容 -->
    <view class="content">
      <!-- 头像区域 -->
      <view class="avatar-section">
        <view class="avatar-ripple ripple-1"></view>
        <view class="avatar-ripple ripple-2"></view>
        <app-avatar
          :src="callState.inviterAvatar"
          :name="callState.inviterName"
          :size="280"
          round
          class="main-avatar"
        />
        <view class="call-type-badge">
          <svg v-if="callState.type === 'video'" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
        </view>
      </view>

      <!-- 文本信息 -->
      <text class="inviter-name">{{ callState.inviterName }}</text>
      <view class="invite-text">
        <text>邀请你加入群{{ callState.type === 'video' ? '视频' : '语音' }}通话</text>
        <view class="typing-dots">
          <view class="dot"></view>
          <view class="dot"></view>
          <view class="dot"></view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="actions">
        <!-- 拒绝 -->
        <view class="action-item" @click="handleReject">
          <view class="action-btn reject-btn">
            <!-- phone-off icon -->
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
              <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          </view>
          <text class="action-label">拒绝</text>
        </view>

        <!-- 接听 -->
        <view class="action-item" @click="handleAccept">
          <view class="action-btn accept-btn">
            <!-- phone icon filled style -->
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </view>
          <text class="action-label">接听</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useGroupWebRTC } from '@/composables/useGroupWebRTC'
import AppAvatar from '@/components/common/AppAvatar.vue'

const groupWebRTC = useGroupWebRTC()
const { callState } = groupWebRTC

function handleAccept() {
  groupWebRTC.acceptInvite()
}

function handleReject() {
  groupWebRTC.rejectInvite()
}
</script>

<style lang="scss" scoped>
.incoming-call-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: #0f172a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.5s ease-out;
}

.bg-effects {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;

  .glow {
    position: absolute;
    width: 1000rpx;
    height: 1000rpx;
    border-radius: 50%;
    filter: blur(160rpx);
    opacity: 0.4;
    animation: blob 8s infinite ease-in-out;
  }

  .glow-1 {
    top: -20%;
    left: -20%;
    background: #8b5cf6;
  }

  .glow-2 {
    bottom: -20%;
    right: -20%;
    background: #3b82f6;
    animation-direction: reverse;
  }
}

.bg-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(120rpx);
}

@keyframes blob {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(60rpx, -100rpx) scale(1.1); }
  66% { transform: translate(-40rpx, 40rpx) scale(0.9); }
}

.content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: -160rpx;
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.avatar-section {
  position: relative;
  margin-bottom: 64rpx;

  .avatar-ripple {
    position: absolute;
    border: 2rpx solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    inset: -20rpx;
    animation: ripple 2s infinite linear;

    &.ripple-2 {
      animation-delay: 0.5s;
    }
  }

  .main-avatar {
    border: 12rpx solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 40rpx 100rpx rgba(0, 0, 0, 0.4);
    border-radius: 50%;
    position: relative;
    z-index: 10;
  }

  .call-type-badge {
    position: absolute;
    bottom: 4rpx;
    right: 4rpx;
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    background: #10b981;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 8rpx solid #0f172a;
    box-shadow: 0 8rpx 24rpx rgba(16, 185, 129, 0.4);
    z-index: 20;

    svg {
      width: 32rpx;
      height: 32rpx;
    }
  }
}

.inviter-name {
  font-size: 60rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 16rpx;
  letter-spacing: -1rpx;
}

.invite-text {
  display: flex;
  align-items: center;
  gap: 16rpx;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 128rpx;
}

.typing-dots {
  display: flex;
  gap: 8rpx;

  .dot {
    width: 8rpx;
    height: 8rpx;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    animation: bounce 1.4s infinite;

    &:nth-child(2) { animation-delay: 0.15s; }
    &:nth-child(3) { animation-delay: 0.3s; }
  }
}

.actions {
  display: flex;
  align-items: center;
  gap: 128rpx;
  width: 100%;
  justify-content: center;
  padding: 0 80rpx;
  padding-bottom: env(safe-area-inset-bottom);
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.action-btn {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;

  svg {
    width: 56rpx;
    height: 56rpx;
  }

  &:active { transform: scale(0.95); }
}

.reject-btn {
  width: 128rpx;
  height: 128rpx;
  background: rgba(255, 255, 255, 0.1);
  border: 2rpx solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);

  &:hover {
    background: rgba(239, 68, 68, 0.2);
  }

  &:active { 
    background: #ef4444; 
  }
}

.accept-btn {
  width: 160rpx;
  height: 160rpx;
  background: #10b981;
  box-shadow: 0 0 80rpx rgba(16, 185, 129, 0.4);
  color: #fff;

  svg {
    width: 72rpx;
    height: 72rpx;
    animation: pulse 2s infinite;
  }

  &:hover {
    background: #10b981;
    transform: scale(1.05);
  }

  &:active { 
    background: #059669; 
    transform: scale(0.95);
  }
}

.action-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes ripple {
  0% { transform: scale(1); opacity: 0.4; }
  100% { transform: scale(2.5); opacity: 0; }
}

@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-8rpx); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
