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
      <!-- autopush: URL 设置后自动推流，组件会自动判断何时准备好 -->
      <!-- 
        关键配置说明：
        - video-codec: 优先使用硬件编码，兼容性更好
        - min-bitrate/max-bitrate: 设置合理的码率范围，避免超出设备能力
        - video-width/video-height: 明确指定分辨率，避免自动选择不支持的分辨率
      -->
      <live-pusher
          v-if="pushUrl"
          id="local-pusher"
          class="local-pusher"
          :url="pushUrl"
          mode="RTC"
          :autopush="true"
          :enable-camera="!call.camOff"
          :enable-mic="!call.muted"
          aspect="9:16"
          :beauty="5"
          :whiteness="3"
          orientation="vertical"
          device-position="front"
          video-codec="hardware"
          :min-bitrate="200"
          :max-bitrate="1000"
          :video-width="360"
          :video-height="640"
          audio-quality="high"
          @statechange="onPusherStateChange"
          @netstatus="onPusherNetStatus"
          @error="onPusherError"
      />
    </view>

    <!-- 2. UI 交互层 (标准 View 层级) -->

    <!-- 顶部栏 -->
    <view class="ui-header">
      <view class="header-left">
        <view class="status-dot" :class="statusDotClass"></view>
        <text class="header-title">{{ headerTitle }}</text>
        <text class="header-time">{{ formatDuration(call.duration) }}</text>
      </view>
      <view class="minimize-btn" @click="toggleMinimize">
        <!-- 最小化图标 -->
        <wd-icon name="arrow-down" size="60rpx" color="rgba(255,255,255,0.8)" />
      </view>
    </view>

    <!-- 底部控制栏 -->
    <view class="ui-controls">
      <!-- 呼叫中状态 (接听/拒绝) -->
      <view v-if="call.status === 'incoming'" class="incoming-actions">
        <view class="action-btn reject" @click="rejectCall">
          <view class="btn-circle reject-bg">
            <wd-icon name="close" size="50rpx" color="#fff" />
          </view>
          <text class="action-text">拒绝</text>
        </view>
        <view class="action-btn accept" @click="acceptCall">
          <view class="btn-circle accept-bg">
            <wd-icon name="phone" size="56rpx" color="#fff" />
          </view>
          <text class="action-text">接听</text>
        </view>
      </view>

      <!-- 通话中状态 -->
      <view v-else class="active-actions">
        <!-- 静音 -->
        <view class="ctrl-btn-wrap" @click="toggleMute">
          <view class="ctrl-btn" :class="{ active: call.muted }">
            <wd-icon :name="call.muted ? 'mute' : 'sound'" size="50rpx" :color="call.muted ? '#000' : '#fff'" />
          </view>
          <text class="ctrl-text">静音</text>
        </view>

        <!-- 挂断 -->
        <view class="ctrl-btn-wrap" @click="endCall">
          <view class="ctrl-btn hangup">
            <wd-icon name="phone" size="50rpx" color="#fff" custom-style="transform: rotate(135deg);" />
          </view>
          <text class="ctrl-text">挂断</text>
        </view>

        <!-- 摄像头 -->
        <view class="ctrl-btn-wrap" @click="toggleCamera">
          <view class="ctrl-btn" :class="{ active: call.camOff }">
            <wd-icon name="video" size="50rpx" :color="call.camOff ? '#000' : '#fff'" />
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

// 顶部状态显示
const headerTitle = computed(() => {
  switch (call.status) {
    case 'outgoing':
      return '正在呼叫...'
    case 'incoming':
      return '来电...'
    case 'connected':
      return '通话中'
    default:
      return call.statusText || '通话'
  }
})

// 状态指示点样式
const statusDotClass = computed(() => {
  switch (call.status) {
    case 'connected':
      return 'status-connected'
    case 'outgoing':
    case 'incoming':
      return 'status-pending'
    default:
      return ''
  }
})

// 监听推流地址变化，在 live-pusher 渲染完成后初始化 Context
// 关键修复：之前监听 call.active，但此时 pushUrl 还是空的，live-pusher 未渲染
// 现在改为监听 pushUrl，确保 live-pusher 渲染后再初始化 Context
watch(() => pushUrl.value, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    // pushUrl 从空变为有值，live-pusher 即将渲染
    console.log('[MiniProgramCall] pushUrl 已设置，准备初始化 Context')
    nextTick(() => {
      // 等待 live-pusher 完全渲染后再初始化
      setTimeout(() => {
        console.log('[MiniProgramCall] 延迟后初始化 Pusher Context')
        initPusherContext(instance)
      }, 500)
    })
  }
})

const onPusherError = (e: any) => {
  console.error('[MiniProgramCall] Pusher Error:', e)
  const detail = e.detail || e
  if (detail.errCode === 10001) {
    uni.showToast({ title: '请授权摄像头和麦克风权限', icon: 'none' })
  } else {
    uni.showToast({ title: '推流失败，请检查权限设置', icon: 'none' })
  }
}

const onPusherNetStatus = (e: any) => {
  const info = e.detail?.info || e.detail
  if (info) {
    console.log('[MiniProgramCall] 推流网络状态:', info)
  }
}

const onPlayerError = (e: any, userId: string) => {
  console.error(`[MiniProgramCall] Player Error [${userId}]:`, e)
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
  height: calc(var(--status-bar-height, 44px) + var(--mp-navbar-height, 48px) + 20rpx);
  padding-top: calc(var(--status-bar-height, 44px) + 20rpx);
  display: flex;
  justify-content: space-between;
  padding-left: 30rpx;
  padding-right: 30rpx;
  background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%);
  z-index: 100; /* 高于视频层 */
  pointer-events: none; /* 让点击穿透到视频层(如果有交互) */
}
.header-left { display: flex; align-items: center; pointer-events: auto; }
.status-dot {
  width: 12rpx;
  height: 12rpx;
  background: #666;
  border-radius: 50%;
  margin-right: 16rpx;
}
.status-dot.status-connected { background: #10b981; } /* 绿色 = 已连接 */
.status-dot.status-pending { background: #f59e0b; animation: pulse 1.5s infinite; } /* 橙色 = 呼叫中 */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
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
