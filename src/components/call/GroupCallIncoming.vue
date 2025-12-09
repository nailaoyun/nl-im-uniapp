<template>
  <view v-if="callState.incoming" class="incoming-call-overlay">
    <!-- 动态背景 -->
    <view class="bg-effects">
      <view class="glow glow-1"></view>
      <view class="glow glow-2"></view>
    </view>

    <!-- 主要内容 -->
    <view class="content">
      <!-- 头像区域 -->
      <view class="avatar-section">
        <view class="avatar-ring ring-1"></view>
        <view class="avatar-ring ring-2"></view>
        <app-avatar
          :src="callState.inviterAvatar"
          :name="callState.inviterName"
          :size="200"
          radius="50%"
          class="main-avatar"
        />
        <view class="call-type-badge">
          <wd-icon
            :name="callState.type === 'video' ? 'video' : 'phone'"
            size="32rpx"
            color="#fff"
          />
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
            <wd-icon name="close" size="48rpx" color="#fff" />
          </view>
          <text class="action-label">拒绝</text>
        </view>

        <!-- 接听 -->
        <view class="action-item" @click="handleAccept">
          <view class="action-btn accept-btn">
            <wd-icon
              :name="callState.type === 'video' ? 'video' : 'phone'"
              size="48rpx"
              color="#fff"
            />
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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  background: rgba(15, 23, 42, 0.95);
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
    width: 600rpx;
    height: 600rpx;
    border-radius: 50%;
    filter: blur(100px);
    animation: pulse 6s ease-in-out infinite;
  }

  .glow-1 {
    top: 20%;
    left: 20%;
    background: rgba(139, 92, 246, 0.2);
  }

  .glow-2 {
    bottom: 20%;
    right: 20%;
    background: rgba(59, 130, 246, 0.2);
    animation-delay: 1s;
  }
}

.content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.avatar-section {
  position: relative;
  margin-bottom: 48rpx;

  .avatar-ring {
    position: absolute;
    border-radius: 50%;
    border: 2rpx solid rgba(255, 255, 255, 0.1);
    animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;

    &.ring-1 {
      inset: -20rpx;
    }

    &.ring-2 {
      inset: -40rpx;
      animation-delay: 0.5s;
    }
  }

  .main-avatar {
    border: 8rpx solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
  }

  .call-type-badge {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 6rpx solid rgba(15, 23, 42, 0.95);
    box-shadow: 0 8rpx 20rpx rgba(16, 185, 129, 0.4);
  }
}

.inviter-name {
  font-size: 48rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 16rpx;
  letter-spacing: -1rpx;
}

.invite-text {
  display: flex;
  align-items: center;
  gap: 16rpx;
  font-size: 30rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 80rpx;
}

.typing-dots {
  display: flex;
  gap: 8rpx;

  .dot {
    width: 8rpx;
    height: 8rpx;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 50%;
    animation: bounce 1.4s infinite;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

.actions {
  display: flex;
  align-items: center;
  gap: 120rpx;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.action-btn {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;

  &:active {
    transform: scale(0.95);
  }
}

.reject-btn {
  background: rgba(239, 68, 68, 0.2);
  border: 2rpx solid rgba(239, 68, 68, 0.3);

  &:active {
    background: #ef4444;
  }
}

.accept-btn {
  width: 140rpx;
  height: 140rpx;
  background: #10b981;
  box-shadow: 0 10rpx 40rpx rgba(16, 185, 129, 0.4);
  animation: pulse-glow 2s infinite;

  &:active {
    background: #059669;
  }
}

.action-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(40rpx); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes ping {
  0% { transform: scale(1); opacity: 0.3; }
  75%, 100% { transform: scale(1.3); opacity: 0; }
}

@keyframes pulse {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.5; }
}

@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10rpx); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 10rpx 40rpx rgba(16, 185, 129, 0.4); }
  50% { box-shadow: 0 10rpx 60rpx rgba(16, 185, 129, 0.6); }
}
</style>

