<template>
  <view class="video-player" :class="{ fullscreen: isFullscreen, dark: isDark }">
    <!-- 原生视频 -->
    <video
      :id="videoId"
      ref="videoRef"
      class="video-element"
      :src="src"
      :poster="poster"
      :loop="isLoop"
      :controls="false"
      :show-center-play-btn="false"
      :enable-progress-gesture="true"
      object-fit="contain"
      @play="onPlay"
      @pause="onPause"
      @ended="onEnded"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @waiting="isBuffering = true"
      @error="onError"
    />

    <!-- 加载中 -->
    <view v-if="isBuffering" class="loading-overlay">
      <wd-loading color="#fff" size="48rpx" />
    </view>

    <!-- 播放按钮（暂停时显示） -->
    <view v-if="!isPlaying && !isBuffering" class="play-overlay" @click="togglePlay">
      <view class="play-btn">
        <wd-icon name="play" size="60rpx" color="#fff" />
      </view>
    </view>

    <!-- 控制栏 -->
    <view
      v-show="showControls || !isPlaying"
      class="controls-bar"
      @click.stop
    >
      <!-- 进度条 -->
      <view class="progress-bar" @click="seekTo">
        <view class="progress-bg">
          <view class="progress-buffered" :style="{ width: bufferedPercent + '%' }"></view>
          <view class="progress-played" :style="{ width: progressPercent + '%' }"></view>
        </view>
        <view class="progress-thumb" :style="{ left: progressPercent + '%' }"></view>
      </view>

      <!-- 控制按钮 -->
      <view class="controls-row">
        <!-- 左侧 -->
        <view class="controls-left">
          <!-- 播放/暂停 -->
          <view class="control-btn" @click="togglePlay">
            <wd-icon :name="isPlaying ? 'pause' : 'play'" size="36rpx" color="#fff" />
          </view>

          <!-- 时间 -->
          <text class="time-text">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</text>
        </view>

        <!-- 右侧 -->
        <view class="controls-right">
          <!-- 倍速 -->
          <view class="control-btn speed-btn" @click="showSpeedSheet = true">
            <text class="speed-text">{{ playbackRate }}x</text>
          </view>

          <!-- 循环 -->
          <view class="control-btn" :class="{ active: isLoop }" @click="isLoop = !isLoop">
            <wd-icon name="refresh" size="32rpx" />
          </view>

          <!-- 全屏 -->
          <view class="control-btn" @click="toggleFullscreen">
            <wd-icon :name="isFullscreen ? 'compress' : 'expand'" size="32rpx" />
          </view>
        </view>
      </view>
    </view>

    <!-- 点击显示/隐藏控制栏 -->
    <view class="touch-area" @click="toggleControls" />

    <!-- 倍速选择 -->
    <wd-action-sheet
      v-model="showSpeedSheet"
      :actions="speedOptions"
      @select="onSpeedSelect"
      cancel-text="取消"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTheme } from '@/composables/useTheme'

const props = withDefaults(defineProps<{
  src: string
  poster?: string
  autoplay?: boolean
}>(), {
  autoplay: false
})

const emit = defineEmits<{
  ended: []
  error: [error: any]
}>()

const { isDark } = useTheme()

// 生成唯一 ID
const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
const videoRef = ref<any>(null)
const videoContext = ref<UniApp.VideoContext | null>(null)

// 状态
const isPlaying = ref(false)
const isBuffering = ref(false)
const isFullscreen = ref(false)
const isLoop = ref(false)
const showControls = ref(true)
const showSpeedSheet = ref(false)

const currentTime = ref(0)
const duration = ref(0)
const buffered = ref(0)
const playbackRate = ref(1)

// 定时器
let controlsTimer: ReturnType<typeof setTimeout> | null = null

// 倍速选项
const speedOptions = [
  { name: '0.5x', value: 0.5 },
  { name: '0.75x', value: 0.75 },
  { name: '1.0x (正常)', value: 1 },
  { name: '1.25x', value: 1.25 },
  { name: '1.5x', value: 1.5 },
  { name: '2.0x', value: 2 },
]

// 计算属性
const progressPercent = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

const bufferedPercent = computed(() => {
  if (duration.value === 0) return 0
  return (buffered.value / duration.value) * 100
})

// 方法
function togglePlay() {
  if (!videoContext.value) return
  if (isPlaying.value) {
    videoContext.value.pause()
  } else {
    videoContext.value.play()
  }
}

function toggleFullscreen() {
  if (!videoContext.value) return
  if (isFullscreen.value) {
    videoContext.value.exitFullScreen()
  } else {
    videoContext.value.requestFullScreen({ direction: 0 })
  }
  isFullscreen.value = !isFullscreen.value
}

function toggleControls() {
  showControls.value = !showControls.value
  if (showControls.value && isPlaying.value) {
    hideControlsDelayed()
  }
}

function hideControlsDelayed() {
  if (controlsTimer) clearTimeout(controlsTimer)
  controlsTimer = setTimeout(() => {
    if (isPlaying.value) {
      showControls.value = false
    }
  }, 3000)
}

function seekTo(e: any) {
  if (!videoContext.value || !duration.value) return
  
  // 获取点击位置
  const rect = e.currentTarget
  const touch = e.detail || e.touches?.[0] || e
  const x = touch.x || touch.clientX || 0
  const width = rect.offsetWidth || 300
  const percent = Math.max(0, Math.min(1, x / width))
  const seekTime = percent * duration.value
  
  videoContext.value.seek(seekTime)
  currentTime.value = seekTime
}

function onSpeedSelect(item: { value: number }) {
  playbackRate.value = item.value
  if (videoContext.value) {
    videoContext.value.playbackRate(item.value)
  }
  showSpeedSheet.value = false
}

// 事件处理
function onPlay() {
  isPlaying.value = true
  isBuffering.value = false
  hideControlsDelayed()
}

function onPause() {
  isPlaying.value = false
  showControls.value = true
}

function onEnded() {
  isPlaying.value = false
  showControls.value = true
  emit('ended')
}

function onTimeUpdate(e: any) {
  currentTime.value = e.detail.currentTime || 0
}

function onLoadedMetadata(e: any) {
  duration.value = e.detail.duration || 0
  if (props.autoplay && videoContext.value) {
    videoContext.value.play()
  }
}

function onError(e: any) {
  isBuffering.value = false
  emit('error', e)
}

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

onMounted(() => {
  videoContext.value = uni.createVideoContext(videoId)
})

onUnmounted(() => {
  if (controlsTimer) clearTimeout(controlsTimer)
})
</script>

<style lang="scss" scoped>
.video-player {
  position: relative;
  width: 100%;
  background: #000;
  border-radius: 16rpx;
  overflow: hidden;

  &.fullscreen {
    position: fixed;
    inset: 0;
    z-index: 9999;
    border-radius: 0;
  }
}

.video-element {
  width: 100%;
  height: 100%;
}

.loading-overlay,
.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-overlay {
  background: rgba(0, 0, 0, 0.3);
}

.play-btn {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 8rpx;
  backdrop-filter: blur(8px);
  transition: transform 0.2s;

  &:active {
    transform: scale(0.95);
  }
}

.touch-area {
  position: absolute;
  inset: 0;
  z-index: 5;
}

.controls-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
  z-index: 20;
}

.progress-bar {
  position: relative;
  height: 40rpx;
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.progress-bg {
  position: absolute;
  left: 0;
  right: 0;
  height: 6rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3rpx;
  overflow: hidden;
}

.progress-buffered {
  position: absolute;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3rpx;
}

.progress-played {
  position: absolute;
  height: 100%;
  background: var(--color-primary);
  border-radius: 3rpx;
}

.progress-thumb {
  position: absolute;
  width: 24rpx;
  height: 24rpx;
  background: #fff;
  border-radius: 50%;
  transform: translateX(-50%);
  box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.2s;

  .controls-bar:hover &,
  .controls-bar:active & {
    opacity: 1;
  }
}

.controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.controls-left,
.controls-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.control-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.2s;

  &:active {
    background: rgba(255, 255, 255, 0.1);
  }

  &.active {
    color: var(--color-primary);
  }
}

.speed-btn {
  width: auto;
  padding: 0 16rpx;
}

.speed-text {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
  font-family: monospace;
}

.time-text {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
  font-family: monospace;
  margin-left: 8rpx;
}
</style>

