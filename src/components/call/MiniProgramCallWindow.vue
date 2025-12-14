<!--
  小程序音视频通话窗口组件
  使用 live-pusher/live-player 实现
  适用平台：微信小程序
-->
<template>
  <!-- #ifdef MP-WEIXIN -->
  <view v-if="call.active" class="call-window" :class="{ minimized: call.minimized }">
    <!-- 最小化状态 -->
    <view v-if="call.minimized" class="minimized-view" @click="toggleMinimize">
      <view class="mini-avatar">
        <image v-if="call.callerAvatar" :src="call.callerAvatar" mode="aspectFill" />
        <text v-else class="avatar-text">{{ call.callerName?.charAt(0) || '?' }}</text>
      </view>
      <view class="mini-info">
        <text class="mini-duration">{{ formatDuration(call.duration) }}</text>
        <text class="mini-status">{{ call.statusText }}</text>
      </view>
    </view>

    <!-- 全屏状态 -->
    <view v-else class="fullscreen-view">
      <!-- 视频区域 -->
      <view class="video-container">
        <!-- 远端视频 -->
        <view class="remote-videos">
          <live-player
            v-for="stream in remoteStreams"
            :key="stream.userId"
            class="remote-video"
            :src="stream.pullUrl"
            mode="RTC"
            autoplay
            muted="{{false}}"
            :object-fit="'contain'"
            @statechange="(e: any) => onPlayerStateChange(e, stream.userId)"
          >
            <view class="video-overlay">
              <text class="user-name">{{ stream.userName || '对方' }}</text>
            </view>
          </live-player>
          
          <!-- 无远端视频时的占位 -->
          <view v-if="remoteStreams.length === 0" class="remote-placeholder">
            <view class="caller-avatar-large">
              <image v-if="call.callerAvatar" :src="call.callerAvatar" mode="aspectFill" />
              <text v-else class="avatar-text">{{ call.callerName?.charAt(0) || '?' }}</text>
            </view>
            <text class="caller-name">{{ call.callerName || '未知' }}</text>
            <text class="call-status">{{ call.statusText }}</text>
          </view>
        </view>

        <!-- 本地视频（小窗） -->
        <view v-if="call.type === 'video' && !call.camOff" class="local-video-container">
          <live-pusher
            class="local-video"
            :url="pushUrl"
            mode="RTC"
            autopush
            :muted="call.muted"
            :enable-camera="!call.camOff"
            aspect="9:16"
            beauty="5"
            whiteness="3"
            @statechange="onPusherStateChange"
          />
        </view>
      </view>

      <!-- 通话信息 -->
      <view class="call-info">
        <text class="duration">{{ formatDuration(call.duration) }}</text>
        <text class="status-text">{{ call.statusText }}</text>
      </view>

      <!-- 控制按钮 -->
      <view class="controls">
        <!-- 来电状态 -->
        <view v-if="call.status === 'incoming'" class="incoming-controls">
          <view class="control-btn reject" @click="rejectCall">
            <wd-icon name="close" size="60rpx" color="#fff" />
            <text>拒绝</text>
          </view>
          <view class="control-btn accept" @click="acceptCall">
            <wd-icon name="phone" size="60rpx" color="#fff" />
            <text>接听</text>
          </view>
        </view>

        <!-- 呼叫/通话中状态 -->
        <view v-else class="call-controls">
          <!-- 静音 -->
          <view class="control-btn" :class="{ active: call.muted }" @click="toggleMute">
            <wd-icon :name="call.muted ? 'mute' : 'sound'" size="48rpx" />
            <text>{{ call.muted ? '取消静音' : '静音' }}</text>
          </view>

          <!-- 摄像头 -->
          <view v-if="call.type === 'video'" class="control-btn" :class="{ active: call.camOff }" @click="toggleCamera">
            <wd-icon :name="call.camOff ? 'camera-off' : 'camera'" size="48rpx" />
            <text>{{ call.camOff ? '开启摄像头' : '关闭摄像头' }}</text>
          </view>

          <!-- 切换摄像头 -->
          <view v-if="call.type === 'video' && !call.camOff" class="control-btn" @click="switchCamera">
            <wd-icon name="refresh" size="48rpx" />
            <text>翻转</text>
          </view>

          <!-- 挂断 -->
          <view class="control-btn hangup" @click="endCall">
            <wd-icon name="phone" size="48rpx" color="#fff" />
            <text>挂断</text>
          </view>
        </view>
      </view>

      <!-- 最小化按钮 -->
      <view class="minimize-btn" @click="toggleMinimize">
        <wd-icon name="arrow-down" size="40rpx" />
      </view>
    </view>
  </view>
  <!-- #endif -->

  <!-- 非小程序平台提示 -->
  <!-- #ifndef MP-WEIXIN -->
  <view v-if="showUnsupportedTip" class="unsupported-tip">
    <text>当前平台请使用 WebRTC 通话</text>
  </view>
  <!-- #endif -->
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
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
  switchCamera,
  toggleMinimize,
  formatDuration,
  onPusherStateChange,
  onPlayerStateChange,
} = useMiniProgramCall()

const showUnsupportedTip = ref(false)

// 注意：信令监听器在 GlobalCallProvider 中已初始化
// 这里不需要再次调用 initListener 和 initPusherContext

onMounted(() => {
  // #ifndef MP-WEIXIN
  showUnsupportedTip.value = true
  // #endif
})

onUnmounted(() => {
  // 清理资源
})
</script>

<style lang="scss" scoped>
.call-window {
  position: fixed;
  z-index: 9999;
  
  &.minimized {
    top: 100rpx;
    right: 20rpx;
    width: 240rpx;
    height: 80rpx;
    border-radius: 40rpx;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(20rpx);
  }
  
  &:not(.minimized) {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #000;
  }
}

.minimized-view {
  display: flex;
  align-items: center;
  padding: 10rpx 20rpx;
  height: 100%;
  
  .mini-avatar {
    width: 60rpx;
    height: 60rpx;
    border-radius: 50%;
    overflow: hidden;
    background: var(--wd-color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    
    image {
      width: 100%;
      height: 100%;
    }
    
    .avatar-text {
      color: #fff;
      font-size: 28rpx;
      font-weight: bold;
    }
  }
  
  .mini-info {
    margin-left: 16rpx;
    flex: 1;
    
    .mini-duration {
      color: #fff;
      font-size: 28rpx;
      font-weight: bold;
    }
    
    .mini-status {
      color: rgba(255, 255, 255, 0.7);
      font-size: 22rpx;
      display: block;
    }
  }
}

.fullscreen-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.video-container {
  flex: 1;
  position: relative;
  background: #1a1a1a;
}

.remote-videos {
  width: 100%;
  height: 100%;
  
  .remote-video {
    width: 100%;
    height: 100%;
  }
  
  .video-overlay {
    position: absolute;
    bottom: 20rpx;
    left: 20rpx;
    
    .user-name {
      color: #fff;
      font-size: 28rpx;
      text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.5);
    }
  }
}

.remote-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
  .caller-avatar-large {
    width: 200rpx;
    height: 200rpx;
    border-radius: 50%;
    overflow: hidden;
    background: var(--wd-color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 40rpx;
    
    image {
      width: 100%;
      height: 100%;
    }
    
    .avatar-text {
      color: #fff;
      font-size: 80rpx;
      font-weight: bold;
    }
  }
  
  .caller-name {
    color: #fff;
    font-size: 40rpx;
    font-weight: bold;
    margin-bottom: 20rpx;
  }
  
  .call-status {
    color: rgba(255, 255, 255, 0.7);
    font-size: 28rpx;
  }
}

.local-video-container {
  position: absolute;
  top: 100rpx;
  right: 20rpx;
  width: 200rpx;
  height: 280rpx;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.3);
  
  .local-video {
    width: 100%;
    height: 100%;
  }
}

.call-info {
  position: absolute;
  top: 40rpx;
  left: 0;
  right: 0;
  text-align: center;
  padding-top: env(safe-area-inset-top);
  
  .duration {
    color: #fff;
    font-size: 48rpx;
    font-weight: bold;
    display: block;
  }
  
  .status-text {
    color: rgba(255, 255, 255, 0.7);
    font-size: 28rpx;
    margin-top: 10rpx;
    display: block;
  }
}

.controls {
  padding: 40rpx 40rpx calc(40rpx + env(safe-area-inset-bottom));
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
}

.incoming-controls {
  display: flex;
  justify-content: space-around;
  
  .control-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30rpx;
    border-radius: 50%;
    
    &.reject {
      background: #ff4d4f;
    }
    
    &.accept {
      background: #52c41a;
    }
    
    text {
      color: #fff;
      font-size: 24rpx;
      margin-top: 10rpx;
    }
  }
}

.call-controls {
  display: flex;
  justify-content: space-around;
  align-items: center;
  
  .control-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20rpx;
    border-radius: 20rpx;
    color: #fff;
    
    &.active {
      background: rgba(255, 255, 255, 0.2);
    }
    
    &.hangup {
      background: #ff4d4f;
      padding: 24rpx 40rpx;
      border-radius: 50rpx;
    }
    
    text {
      font-size: 22rpx;
      margin-top: 8rpx;
      opacity: 0.9;
    }
  }
}

.minimize-btn {
  position: absolute;
  top: 40rpx;
  left: 40rpx;
  padding: 16rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  padding-top: calc(16rpx + env(safe-area-inset-top));
}

.unsupported-tip {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 40rpx;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 20rpx;
  
  text {
    color: #fff;
    font-size: 28rpx;
  }
}
</style>

