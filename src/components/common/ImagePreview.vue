<template>
  <view v-if="show" class="image-preview" @touchmove.stop.prevent>
    <!-- 背景遮罩 -->
    <view class="preview-backdrop" @click="handleClose" />

    <!-- 主图区域 -->
    <swiper
      class="preview-swiper"
      :current="currentIndex"
      :indicator-dots="false"
      @change="onSwiperChange"
    >
      <swiper-item v-for="(image, index) in images" :key="index" class="swiper-item">
        <movable-area class="movable-area">
          <movable-view
            class="movable-view"
            direction="all"
            :scale="true"
            :scale-min="1"
            :scale-max="4"
            :scale-value="scale"
            @scale="onScale"
          >
            <image
              class="preview-image"
              :src="image"
              mode="aspectFit"
              @error="onImageError"
            />
          </movable-view>
        </movable-area>
      </swiper-item>
    </swiper>

    <!-- 顶部工具栏 -->
    <view class="top-bar">
      <view class="close-btn" @click="handleClose">
        <wd-icon name="close" size="40rpx" color="#fff" />
      </view>
      <view class="page-indicator">
        <text>{{ currentIndex + 1 }} / {{ images.length }}</text>
      </view>
      <view class="actions">
        <view class="action-btn" @click="saveImage">
          <wd-icon name="download" size="36rpx" color="#fff" />
        </view>
      </view>
    </view>

    <!-- 底部缩略图 -->
    <view v-if="images.length > 1" class="thumbnail-bar">
      <scroll-view class="thumbnail-scroll" scroll-x>
        <view
          v-for="(image, index) in images"
          :key="index"
          class="thumbnail-item"
          :class="{ active: index === currentIndex }"
          @click="goToImage(index)"
        >
          <image :src="image" mode="aspectFill" class="thumbnail-image" />
        </view>
      </scroll-view>
    </view>

    <!-- 底部控制栏 -->
    <view class="bottom-bar">
      <!-- 缩放按钮 -->
      <view class="zoom-controls">
        <view class="zoom-btn" @click="zoomOut">
          <wd-icon name="remove" size="36rpx" color="#fff" />
        </view>
        <text class="zoom-text">{{ Math.round(scale * 100) }}%</text>
        <view class="zoom-btn" @click="zoomIn">
          <wd-icon name="add" size="36rpx" color="#fff" />
        </view>
      </view>

      <!-- 旋转按钮 -->
      <view class="rotate-btn" @click="rotate">
        <wd-icon name="refresh" size="36rpx" color="#fff" />
      </view>
    </view>

    <wd-toast />
  </view>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useToast } from 'wot-design-uni'

const props = defineProps<{
  show: boolean
  images: string[]
  initialIndex?: number
}>()

const emit = defineEmits<{
  close: []
  'update:show': [value: boolean]
}>()

const toast = useToast()

const currentIndex = ref(0)
const scale = ref(1)
const rotation = ref(0)

// 监听打开
watch(() => props.show, (val) => {
  if (val) {
    currentIndex.value = props.initialIndex || 0
    scale.value = 1
    rotation.value = 0
  }
})

// swiper 切换
function onSwiperChange(e: any) {
  currentIndex.value = e.detail.current
  scale.value = 1 // 切换后重置缩放
}

// 跳转到指定图片
function goToImage(index: number) {
  currentIndex.value = index
  scale.value = 1
}

// 缩放回调
function onScale(e: any) {
  scale.value = e.detail.scale
}

// 放大
function zoomIn() {
  scale.value = Math.min(4, scale.value + 0.5)
}

// 缩小
function zoomOut() {
  scale.value = Math.max(1, scale.value - 0.5)
}

// 旋转 (仅显示提示，Uniapp 原生组件不支持旋转)
function rotate() {
  toast.show('长按图片可保存')
}

// 保存图片
async function saveImage() {
  const currentImage = props.images[currentIndex.value]
  if (!currentImage) return

  try {
    // 先下载图片
    const downloadResult = await new Promise<{ tempFilePath: string }>((resolve, reject) => {
      uni.downloadFile({
        url: currentImage,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res)
          } else {
            reject(new Error('下载失败'))
          }
        },
        fail: reject
      })
    })

    // 保存到相册
    await new Promise<void>((resolve, reject) => {
      uni.saveImageToPhotosAlbum({
        filePath: downloadResult.tempFilePath,
        success: () => resolve(),
        fail: reject
      })
    })

    toast.success('已保存到相册')
  } catch (e: any) {
    if (e?.errMsg?.includes('auth deny')) {
      toast.error('请授权访问相册')
      // 可以打开设置页面
      uni.openSetting({})
    } else {
      toast.error('保存失败')
    }
  }
}

// 图片加载错误
function onImageError() {
  toast.error('图片加载失败')
}

function handleClose() {
  emit('close')
  emit('update:show', false)
}
</script>

<style lang="scss" scoped>
.image-preview {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: #000;
}

.preview-backdrop {
  position: absolute;
  inset: 0;
}

.preview-swiper {
  width: 100%;
  height: 100%;
}

.swiper-item {
  display: flex;
  align-items: center;
  justify-content: center;
}

.movable-area {
  width: 100%;
  height: 100%;
}

.movable-view {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: calc(88rpx + var(--status-bar-height, 0));
  padding-top: var(--status-bar-height, 0);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 24rpx;
  padding-right: 24rpx;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, transparent 100%);
  z-index: 10;
}

.close-btn,
.action-btn {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);

  &:active {
    background: rgba(255, 255, 255, 0.2);
  }
}

.page-indicator {
  font-size: 28rpx;
  color: #fff;
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 16rpx;
}

.thumbnail-bar {
  position: absolute;
  bottom: 200rpx;
  left: 0;
  right: 0;
  padding: 16rpx 0;
  z-index: 10;
}

.thumbnail-scroll {
  white-space: nowrap;
  padding: 0 24rpx;
}

.thumbnail-item {
  display: inline-block;
  width: 100rpx;
  height: 100rpx;
  margin-right: 16rpx;
  border-radius: 12rpx;
  overflow: hidden;
  border: 4rpx solid transparent;
  opacity: 0.6;
  transition: all 0.2s;

  &.active {
    border-color: #fff;
    opacity: 1;
    transform: scale(1.1);
  }

  .thumbnail-image {
    width: 100%;
    height: 100%;
  }
}

.bottom-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(120rpx + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 60rpx;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.6) 0%, transparent 100%);
  z-index: 10;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 24rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 40rpx;
  padding: 8rpx 24rpx;
  backdrop-filter: blur(8px);
}

.zoom-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    opacity: 0.7;
  }
}

.zoom-text {
  font-size: 24rpx;
  color: #fff;
  min-width: 80rpx;
  text-align: center;
  font-family: monospace;
}

.rotate-btn {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);

  &:active {
    background: rgba(255, 255, 255, 0.2);
  }
}
</style>

