<template>
  <view class="publish-page" :class="{ dark: isDark }">
    <!-- 导航栏 -->
    <wd-navbar
      title="发布动态"
      left-arrow
      fixed
      placeholder
      @click-left="goBack"
    >
      <template #right>
        <wd-button
          type="primary"
          size="small"
          :loading="publishing"
          :disabled="!canPublish"
          @click="publish"
        >
          发布
        </wd-button>
      </template>
    </wd-navbar>

    <!-- 内容输入 -->
    <view class="content-section">
      <wd-textarea
        v-model="content"
        placeholder="分享新鲜事..."
        :maxlength="500"
        show-word-limit
        :rows="6"
        no-border
      />
    </view>

    <!-- 图片/视频选择 -->
    <view class="media-section">
      <view class="media-list">
        <view
          v-for="(item, index) in mediaList"
          :key="index"
          class="media-item"
        >
          <wd-img
            v-if="item.type === 'image'"
            :src="item.path"
            width="200rpx"
            height="200rpx"
            mode="aspectFill"
            radius="8rpx"
          />
          <video
            v-else
            :src="item.path"
            class="video-preview"
            object-fit="cover"
          />
          <view class="remove-btn" @click="removeMedia(index)">
            <wd-icon name="close" size="24rpx" color="#fff" />
          </view>
        </view>

        <!-- 添加按钮 -->
        <view v-if="mediaList.length < 9" class="add-media" @click="chooseMedia">
          <wd-icon name="add" size="48rpx" color="var(--text-tertiary)" />
        </view>
      </view>
    </view>

    <!-- 可见范围 -->
    <view class="options-section">
      <wd-cell title="谁可以看" :value="visibilityText" is-link @click="showVisibilityPicker = true" />
      <wd-cell title="所在位置" :value="location || '不显示位置'" is-link @click="chooseLocation" />
    </view>

    <!-- 可见范围选择器 -->
    <wd-action-sheet
      v-model="showVisibilityPicker"
      :actions="visibilityOptions"
      @select="onVisibilitySelect"
    />

    <wd-toast />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMomentStore } from '@/stores'
import { useToast } from 'wot-design-uni'
import { useTheme } from '@/composables/useTheme'

const momentStore = useMomentStore()
const toast = useToast()
const { isDark } = useTheme()

// 表单数据
const content = ref('')
const mediaList = ref<{ type: 'image' | 'video'; path: string }[]>([])
const visibility = ref(0) // 0=公开 1=仅好友 2=仅自己
const location = ref('')

// 状态
const publishing = ref(false)
const showVisibilityPicker = ref(false)

// 计算属性
const canPublish = computed(() => {
  return content.value.trim() || mediaList.value.length > 0
})

const visibilityText = computed(() => {
  switch (visibility.value) {
    case 0: return '公开'
    case 1: return '仅好友可见'
    case 2: return '仅自己可见'
    default: return '公开'
  }
})

const visibilityOptions = [
  { name: '公开', value: 0 },
  { name: '仅好友可见', value: 1 },
  { name: '仅自己可见', value: 2 }
]

// 方法
function goBack() {
  uni.navigateBack()
}

function chooseMedia() {
  uni.showActionSheet({
    itemList: ['拍照', '从相册选择', '拍视频'],
    success: (res) => {
      switch (res.tapIndex) {
        case 0:
          takePhoto()
          break
        case 1:
          chooseImage()
          break
        case 2:
          takeVideo()
          break
      }
    }
  })
}

function takePhoto() {
  uni.chooseImage({
    count: 1,
    sourceType: ['camera'],
    success: (res) => {
      mediaList.value.push({
        type: 'image',
        path: res.tempFilePaths[0]
      })
    }
  })
}

function chooseImage() {
  const remaining = 9 - mediaList.value.length
  if (remaining <= 0) return

  uni.chooseImage({
    count: remaining,
    sourceType: ['album'],
    success: (res) => {
      res.tempFilePaths.forEach(path => {
        mediaList.value.push({ type: 'image', path })
      })
    }
  })
}

function takeVideo() {
  // 视频只能选一个，清空之前的
  mediaList.value = []

  uni.chooseVideo({
    sourceType: ['camera', 'album'],
    maxDuration: 60,
    success: (res) => {
      mediaList.value.push({
        type: 'video',
        path: res.tempFilePath
      })
    }
  })
}

function removeMedia(index: number) {
  mediaList.value.splice(index, 1)
}

function onVisibilitySelect(item: { value: number }) {
  visibility.value = item.value
  showVisibilityPicker.value = false
}

function chooseLocation() {
  uni.chooseLocation({
    success: (res) => {
      location.value = res.name || res.address || ''
    },
    fail: () => {
      // 用户取消或权限问题
    }
  })
}

async function publish() {
  if (!canPublish.value) return

  publishing.value = true
  try {
    // 确定媒体类型
    let mediaType = 0 // 纯文字
    if (mediaList.value.length > 0) {
      mediaType = mediaList.value[0].type === 'image' ? 1 : 2
    }

    // TODO: 先上传媒体文件获取 URL
    const mediaUrls: string[] = []
    for (const item of mediaList.value) {
      // 这里应该调用上传接口
      mediaUrls.push(item.path) // 暂时使用本地路径
    }

    await momentStore.publishMoment({
      content: content.value.trim(),
      media_type: mediaType,
      media_urls: mediaUrls,
      visibility: visibility.value,
      location: location.value || undefined
    })

    setTimeout(() => {
      uni.navigateBack()
    }, 1000)
  } catch (error) {
    console.error('发布失败:', error)
  } finally {
    publishing.value = false
  }
}
</script>

<style lang="scss" scoped>
.publish-page {
  min-height: 100vh;
  background: var(--bg-page);
}

.content-section {
  background: var(--bg-content);
  padding: 20rpx;
}

.media-section {
  background: var(--bg-content);
  padding: 20rpx 30rpx;
  margin-top: 20rpx;
}

.media-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.media-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;

  .video-preview {
    width: 100%;
    height: 100%;
    border-radius: 8rpx;
  }

  .remove-btn {
    position: absolute;
    top: -12rpx;
    right: -12rpx;
    width: 40rpx;
    height: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
  }
}

.add-media {
  width: 200rpx;
  height: 200rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-hover);
  border-radius: 8rpx;
  border: 2rpx dashed var(--border-color);
}

.options-section {
  background: var(--bg-content);
  margin-top: 20rpx;
}
</style>







