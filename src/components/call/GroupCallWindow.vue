<template>
  <view v-if="showBanner" class="banner-wrapper" :class="{ 'banner-hide': !showBanner }">
    <view class="glass-capsule" @click="handleJoin">
      <view class="left-section">
        <view class="icon-container">
          <view class="pulse-ring"></view>
          <view class="icon-box">
            <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </view>
        </view>

        <view class="info-box">
          <view class="title-row">
            <text class="title">通话进行中</text>
            <view class="count-badge">
              <text>{{ participantsCount }}人</text>
            </view>
          </view>

          <view class="avatar-stack">
            <view
                v-for="(user, index) in previewParticipants"
                :key="user.userId"
                class="stack-item"
                :style="{ zIndex: 10 - index, marginLeft: index === 0 ? '0' : '-16rpx' }"
            >
              <app-avatar :src="user.avatar" :name="user.name" :size="32" round />
            </view>
            <view v-if="participantsCount > 3" class="more-badge" :style="{ zIndex: 0 }">
              <text>+{{ participantsCount - 3 }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="join-btn">
        <text>加入</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
// ... 保持原有 script 逻辑不变 ...
import { computed } from 'vue'
import { useGroupWebRTC } from '@/composables/useGroupWebRTC'
import AppAvatar from '@/components/common/AppAvatar.vue'

const props = defineProps<{ roomId: string }>()
const groupWebRTC = useGroupWebRTC()
const { callState, participants } = groupWebRTC

const showBanner = computed(() => {
  return callState.groupId === props.roomId && !callState.joined && !callState.incoming && callState.roomId !== ''
})
const participantsCount = computed(() => participants.value.length)
const previewParticipants = computed(() => participants.value.slice(0, 3)) // 只显示前3个
function handleJoin() { groupWebRTC.joinCurrentCall() }
</script>

<style lang="scss" scoped>
.banner-wrapper {
  padding: 24rpx 32rpx;
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-capsule {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background: #fff;
  border-radius: 32rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.06), 0 0 0 1rpx rgba(0,0,0,0.05);
  transition: all 0.2s;

  .dark & {
    background: #292524;
    border-color: rgba(255, 255, 255, 0.1);
  }
}

.left-section {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.icon-container {
  position: relative;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  .pulse-ring {
    position: absolute;
    inset: 0;
    background: rgba(16, 185, 129, 0.2);
    border-radius: 50%;
    animation: pulse-ring 2s infinite;
  }

  .icon-box {
    position: relative;
    width: 100%;
    height: 100%;
    background: #10b981;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8rpx 16rpx rgba(16, 185, 129, 0.3);
    z-index: 10;
  }

  .icon-svg {
    width: 40rpx;
    height: 40rpx;
    color: #fff;
  }
}

.info-box {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;

  .title {
    font-size: 28rpx;
    font-weight: 700;
    color: #1f2937;
    .dark & { color: #f5f5f4; }
  }

  .count-badge {
    padding: 2rpx 10rpx;
    background: rgba(16, 185, 129, 0.1);
    border: 1rpx solid rgba(16, 185, 129, 0.2);
    border-radius: 8rpx;

    text {
      font-size: 20rpx;
      font-weight: 600;
      color: #10b981;
    }
  }
}

.avatar-stack {
  display: flex;
  align-items: center;
  padding-left: 8rpx;

  .stack-item {
    position: relative;
    border: 4rpx solid #fff;
    border-radius: 50%;
    .dark & { border-color: #292524; }
  }

  .more-badge {
    margin-left: -16rpx;
    width: 36rpx;
    height: 36rpx;
    background: #f3f4f6;
    border: 4rpx solid #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    .dark & {
      background: #44403c;
      border-color: #292524;
    }

    text {
      font-size: 16rpx;
      font-weight: 700;
      color: #6b7280;
      .dark & { color: #d6d3d1; }
    }
  }
}

.join-btn {
  background: #10b981;
  padding: 16rpx 32rpx;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 20rpx rgba(16, 185, 129, 0.25);

  text {
    color: #fff;
    font-size: 24rpx;
    font-weight: 700;
  }
}

@keyframes pulse-ring {
  0% { transform: scale(0.8); opacity: 0.5; }
  100% { transform: scale(1.4); opacity: 0; }
}

@keyframes slideUp {
  from { transform: translateY(20rpx); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
