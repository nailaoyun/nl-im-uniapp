<template>
  <!-- #ifdef H5 -->
  <view v-if="call.active" class="call-window" :class="{ minimized: call.minimized }">
    <!-- 最小化状态 -->
    <view v-if="call.minimized" class="minimized-bar" @click="toggleMinimize">
      <wd-icon :name="call.type === 'video' ? 'video' : 'phone'" size="32rpx" />
      <text class="call-duration">{{ formatDuration(call.duration) }}</text>
      <wd-icon name="expand" size="32rpx" />
    </view>

    <!-- 完整窗口 -->
    <view v-else class="full-window">
      <!-- 顶部控制栏 -->
      <view class="header">
        <view class="status-text">{{ call.statusText }}</view>
        <view v-if="call.status === 'connected'" class="duration">
          {{ formatDuration(call.duration) }}
        </view>
        <wd-icon name="arrow-down" size="40rpx" class="minimize-btn" @click="toggleMinimize" />
      </view>

      <!-- 视频区域 -->
      <view v-if="call.type === 'video'" class="video-area">
        <!-- 远程视频 -->
        <video
          v-if="remoteStream"
          ref="remoteVideoRef"
          class="remote-video"
          autoplay
          playsinline
        />
        <view v-else class="video-placeholder">
          <app-avatar :src="call.callerAvatar" :name="call.callerName" :size="160" />
          <text class="name">{{ call.callerName || '对方' }}</text>
        </view>

        <!-- 本地视频（小窗口） -->
        <video
          v-if="localStream && !call.camOff"
          ref="localVideoRef"
          class="local-video"
          autoplay
          muted
          playsinline
        />
      </view>

      <!-- 语音通话 - 头像显示 -->
      <view v-else class="audio-area">
        <app-avatar :src="call.callerAvatar" :name="call.callerName" :size="200" />
        <text class="caller-name">{{ call.callerName || '对方' }}</text>
      </view>

      <!-- 底部控制按钮 -->
      <view class="controls">
        <!-- 来电状态 - 接听/拒绝 -->
        <template v-if="call.status === 'incoming'">
          <view class="control-btn decline" @click="$emit('reject')">
            <wd-icon name="phone" size="48rpx" color="#fff" />
          </view>
          <view class="control-btn accept" @click="$emit('accept')">
            <wd-icon name="phone" size="48rpx" color="#fff" />
          </view>
        </template>

        <!-- 通话中状态 -->
        <template v-else-if="call.status === 'connected'">
          <view class="control-btn" :class="{ active: call.muted }" @click="$emit('toggleMute')">
            <wd-icon :name="call.muted ? 'mute' : 'audio'" size="40rpx" />
          </view>
          <view v-if="call.type === 'video'" class="control-btn" :class="{ active: call.camOff }" @click="$emit('toggleCamera')">
            <wd-icon :name="call.camOff ? 'video-off' : 'video'" size="40rpx" />
          </view>
          <view class="control-btn hangup" @click="$emit('end')">
            <wd-icon name="phone" size="48rpx" color="#fff" />
          </view>
        </template>

        <!-- 呼叫中状态 -->
        <template v-else-if="call.status === 'outgoing'">
          <view class="control-btn hangup" @click="$emit('end')">
            <wd-icon name="phone" size="48rpx" color="#fff" />
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

// Video 元素引用
const localVideoRef = ref<HTMLVideoElement | null>(null)
const remoteVideoRef = ref<HTMLVideoElement | null>(null)

// 监听 localStream 变化，设置 srcObject
watch(() => props.localStream, (stream) => {
  // #ifdef H5
  nextTick(() => {
    if (localVideoRef.value && stream) {
      localVideoRef.value.srcObject = stream
    }
  })
  // #endif
}, { immediate: true })

// 监听 remoteStream 变化，设置 srcObject
watch(() => props.remoteStream, (stream) => {
  // #ifdef H5
  nextTick(() => {
    if (remoteVideoRef.value && stream) {
      remoteVideoRef.value.srcObject = stream
    }
  })
  // #endif
}, { immediate: true })

function toggleMinimize() {
  // 注意：这里需要通过 emit 触发，因为状态在父组件管理
}
</script>

<style lang="scss" scoped>
.call-window {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.95);

  &.minimized {
    top: auto;
    bottom: calc(120rpx + env(safe-area-inset-bottom));
    left: 20rpx;
    right: auto;
    width: 280rpx;
    height: 80rpx;
    border-radius: 40rpx;
    background: var(--color-primary);
  }
}

.minimized-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 24rpx;
  color: #fff;

  .call-duration {
    font-size: 28rpx;
  }
}

.full-window {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  padding-top: calc(40rpx + var(--status-bar-height, 0));
  position: relative;

  .status-text {
    font-size: 32rpx;
    color: #fff;
  }

  .duration {
    margin-left: 20rpx;
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.7);
  }

  .minimize-btn {
    position: absolute;
    right: 40rpx;
    color: #fff;
  }
}

.video-area {
  flex: 1;
  position: relative;

  .remote-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .video-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 30rpx;

    .name {
      font-size: 36rpx;
      color: #fff;
    }
  }

  .local-video {
    position: absolute;
    top: 40rpx;
    right: 40rpx;
    width: 200rpx;
    height: 280rpx;
    border-radius: 16rpx;
    object-fit: cover;
    border: 4rpx solid rgba(255, 255, 255, 0.3);
  }
}

.audio-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 30rpx;

  .caller-name {
    font-size: 40rpx;
    color: #fff;
    font-weight: 600;
  }
}

.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 60rpx;
  padding: 60rpx;
  padding-bottom: calc(60rpx + env(safe-area-inset-bottom));
}

.control-btn {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;

  &.active {
    background: rgba(255, 255, 255, 0.4);
  }

  &.accept {
    background: #07c160;
  }

  &.decline,
  &.hangup {
    background: #fa5151;
    transform: rotate(135deg);
  }
}

.call-unsupported {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
</style>

