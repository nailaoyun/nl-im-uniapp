<!--
  小程序音视频通话窗口组件 - 同层渲染 + wot-ui Icon 版
  适用平台：微信小程序 (需基础库 2.9.1+)
-->
<template>
  <!-- #ifdef MP-WEIXIN -->
  <view v-if="call.active" class="mp-call-container">

    <!-- 1. 视频层 -->
    <view class="video-layer">
      <!-- 远端视频流 -->
      <view class="remote-grid" :class="gridClass">
        <live-player
            v-for="stream in remoteStreams"
            :key="stream.userId"
            class="live-player-item"
            :src="stream.pullUrl"
            mode="RTC"
            autoplay
            :muted="false"
            object-fit="fillCrop"
            @statechange="(e) => onPlayerStateChange(e, stream.userId)"
            @error="(e) => onPlayerError(e, stream.userId)"
        >
          <!-- 名字标签 (同层渲染直接使用 view) -->
          <view class="player-tag">
            <text class="tag-text">{{ stream.userName || '连线中...' }}</text>
          </view>
        </live-player>

        <!-- 等待中的占位符 -->
        <view v-if="remoteStreams.length === 0" class="waiting-placeholder">
          <image :src="call.callerAvatar || '/static/default-avatar.png'" class="placeholder-avatar" mode="aspectFill" />
          <text class="placeholder-text">{{ call.statusText }}</text>
        </view>
      </view>

      <!-- 本地推流 -->
      <live-pusher
          id="local-pusher"
          class="local-pusher"
          :url="pushUrl"
          mode="RTC"
          :autopush="true"
          :enable-camera="!call.camOff"
          :enable-mic="!call.muted"
          aspect="9:16"
          beauty="5"
          whiteness="3"
          @statechange="onPusherStateChange"
          @error="onPusherError"
      />
    </view>

    <!-- 2. UI 交互层 (标准 View 层级) -->

    <!-- 顶部栏 -->
    <view class="ui-header">
      <view class="header-left">
        <view class="status-dot"></view>
        <text class="header-title">通话中</text>
        <text class="header-time">{{ formatDuration(call.duration) }}</text>
      </view>
      <view class="minimize-btn" @click="toggleMinimize">
        <!-- 最小化图标 -->
        <wd-icon name="arrow-down-circle" size="60rpx" color="rgba(255,255,255,0.8)" />
      </view>
    </view>

    <!-- 底部控制栏 -->
    <view class="ui-controls">
      <!-- 呼叫中状态 (接听/拒绝) -->
      <view v-if="call.status === 'incoming'" class="incoming-actions">
        <view class="action-btn reject" @click="rejectCall">
          <view class="btn-circle reject-bg">
            <wd-icon name="close-bold" size="50rpx" color="#fff" />
          </view>
          <text class="action-text">拒绝</text>
        </view>
        <view class="action-btn accept" @click="acceptCall">
          <view class="btn-circle accept-bg">
            <wd-icon name="phone-filled" size="56rpx" color="#fff" />
          </view>
          <text class="action-text">接听</text>
        </view>
      </view>

      <!-- 通话中状态 -->
      <view v-else class="active-actions">
        <!-- 静音 -->
        <view class="ctrl-btn-wrap" @click="toggleMute">
          <view class="ctrl-btn" :class="{ active: call.muted }">
            <wd-icon :name="call.muted ? 'mic-off' : 'mic-on'" size="50rpx" :color="call.muted ? '#000' : '#fff'" />
          </view>
          <text class="ctrl-text">静音</text>
        </view>

        <!-- 挂断 -->
        <view class="ctrl-btn-wrap" @click="endCall">
          <view class="ctrl-btn hangup">
            <wd-icon name="phone-off-filled" size="50rpx" color="#fff" />
          </view>
          <text class="ctrl-text">挂断</text>
        </view>

        <!-- 摄像头 -->
        <view class="ctrl-btn-wrap" @click="toggleCamera">
          <view class="ctrl-btn" :class="{ active: call.camOff }">
            <wd-icon :name="call.camOff ? 'video-off' : 'video'" size="50rpx" :color="call.camOff ? '#000' : '#fff'" />
          </view>
          <text class="ctrl-text">摄像头</text>
        </view>
      </view>
    </view>

    <!-- 最小化悬浮球 -->
    <view v-if="call.minimized" class="minimized-ball" @click="toggleMinimize">
      <image :src="call.callerAvatar || '/static/default-avatar.png'" class="ball-avatar" mode="aspectFill" />
      <text class="ball-time">{{ formatDuration(call.duration) }}</text>
    </view>

  </view>
  <!-- #endif -->
</template>

<script setup lang="ts">
import { computed, watch, nextTick, getCurrentInstance } from 'vue'
import { useMiniProgramCall } from '@/composables/useMiniProgramCall'

const {
  call,
  pushUrl,
  remoteStreams,
  acceptCall,
  rejectCall,
  endCall,
  toggleMute,
  toggleCamera,
  toggleMinimize,
  formatDuration,
  onPusherStateChange,
  onPlayerStateChange,
  initPusherContext
} = useMiniProgramCall()

// 获取当前组件实例，用于绑定 Context
const instance = getCurrentInstance()

const gridClass = computed(() => remoteStreams.value.length > 1 ? 'grid-multi' : 'grid-single')

// 监听通话激活，初始化 Context
watch(() => call.active, (newVal) => {
  if (newVal) {
    nextTick(() => {
      // 传入当前组件实例，确保 live-pusher 能被找到
      // 在同层渲染模式下，这点尤为重要
      initPusherContext(instance)
    })
  }
})

const onPusherError = (e: any) => {
  console.error('Pusher Error:', e)
  uni.showToast({ title: '推流失败，请检查摄像头权限', icon: 'none' })
}

const onPlayerError = (e: any, userId: string) => {
  console.error(`Player Error [${userId}]:`, e)
}
</script>

<style lang="scss" scoped>
.mp-call-container {
  position: fixed;
  inset: 0;
  background: #1c1c1e;
  z-index: 9999;
}

.video-layer {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1; /* 视频层在底层 */
}

.remote-grid {
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  &.grid-single .live-player-item { width: 100%; height: 100%; }
  &.grid-multi .live-player-item { width: 50%; height: 50%; }
}

.live-player-item { position: relative; }

.player-tag {
  position: absolute;
  bottom: 20rpx;
  left: 20rpx;
  background: rgba(0,0,0,0.5);
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  z-index: 10;
}
.tag-text { font-size: 24rpx; color: #fff; }

.local-pusher {
  position: absolute;
  right: 30rpx;
  top: 180rpx;
  width: 200rpx;
  height: 300rpx;
  border-radius: 16rpx;
  z-index: 10;
  border: 2rpx solid rgba(255,255,255,0.2);
  overflow: hidden;
}

.waiting-placeholder {
  position: absolute;
  inset: 0;
  background: #2c2c2e;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.placeholder-avatar { width: 160rpx; height: 160rpx; border-radius: 50%; margin-bottom: 20rpx; }
.placeholder-text { color: #aaa; font-size: 30rpx; }

/* 顶部栏 - 使用标准 view */
.ui-header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 160rpx;
  padding-top: 60rpx;
  display: flex;
  justify-content: space-between;
  padding-left: 30rpx;
  padding-right: 30rpx;
  background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%);
  z-index: 100; /* 高于视频层 */
  pointer-events: none; /* 让点击穿透到视频层(如果有交互) */
}
.header-left { display: flex; align-items: center; pointer-events: auto; }
.status-dot { width: 12rpx; height: 12rpx; background: #10b981; border-radius: 50%; margin-right: 16rpx; }
.header-title { color: #fff; font-size: 32rpx; font-weight: bold; }
.header-time { color: rgba(255,255,255,0.8); font-size: 26rpx; margin-left: 20rpx; }
.minimize-btn { pointer-events: auto; padding: 10rpx; }

/* 底部栏 */
.ui-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 240rpx;
  background: linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%);
  z-index: 100;
  display: flex;
  justify-content: center;
  padding-bottom: 40rpx;
  pointer-events: auto;
}

.active-actions, .incoming-actions {
  display: flex;
  width: 100%;
  justify-content: space-around;
  align-items: center;
}

.ctrl-btn-wrap { display: flex; flex-direction: column; align-items: center; }
.ctrl-btn {
  width: 110rpx;
  height: 110rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}
.ctrl-btn.active { background: #fff; }
.ctrl-btn.hangup { background: #ef4444; }

.ctrl-text { font-size: 24rpx; color: rgba(255,255,255,0.8); }

.action-btn { display: flex; flex-direction: column; align-items: center; gap: 20rpx; }
.btn-circle {
  width: 130rpx;
  height: 130rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.reject-bg { background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); }
.accept-bg { background: #10b981; box-shadow: 0 4rpx 20rpx rgba(16, 185, 129, 0.4); }
.action-text { color: #fff; font-size: 28rpx; }

/* 最小化球 */
.minimized-ball {
  position: absolute;
  top: 200rpx;
  right: 30rpx;
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: rgba(0,0,0,0.8);
  border: 2rpx solid rgba(255,255,255,0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 101;
}
.ball-avatar { width: 60rpx; height: 60rpx; border-radius: 50%; margin-bottom: 4rpx; }
.ball-time { color: #10b981; font-size: 20rpx; }
</style>
