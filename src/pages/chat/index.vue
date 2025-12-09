<template>
  <view class="chat-page">
    <!-- 导航栏 -->
    <wd-navbar
      :title="chatName"
      left-arrow
      fixed
      placeholder
      @click-left="goBack"
    >
      <template #right>
        <wd-icon name="more" size="44rpx" @click="showChatInfo" />
      </template>
    </wd-navbar>

    <!-- 消息列表 -->
    <scroll-view
      class="message-list"
      scroll-y
      :scroll-into-view="scrollToId"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="loadMoreMessages"
    >
      <!-- 加载提示 -->
      <view v-if="hasMore" class="load-more">
        <wd-loading v-if="loadingMore" />
        <text v-else>下拉加载更多消息</text>
      </view>

      <!-- 消息列表 -->
      <view
        v-for="(msg, index) in messages"
        :key="msg.id"
        :id="`msg-${msg.id}`"
        class="message-item"
      >
        <!-- 时间分割线 -->
        <view v-if="shouldShowTime(msg, index)" class="time-divider">
          <text>{{ formatMessageTime(msg.created_at) }}</text>
        </view>

        <!-- 系统消息 -->
        <view v-if="isSystemMessage(msg.message_type)" class="system-message">
          <text>{{ msg.content }}</text>
        </view>

        <!-- 普通消息 -->
        <view v-else class="message-bubble-wrap" :class="{ 'is-self': msg.isSelf }">
          <!-- 头像 -->
          <view v-if="!msg.isSelf" class="message-avatar">
            <wd-img
              v-if="targetUser?.avatar"
              :src="targetUser.avatar"
              width="72rpx"
              height="72rpx"
              radius="8rpx"
            />
            <view v-else class="avatar-placeholder">
              {{ targetUser?.name?.charAt(0) || '?' }}
            </view>
          </view>

          <!-- 消息内容 -->
          <view class="message-bubble" :class="getBubbleClass(msg)">
            <!-- 文本消息 -->
            <text v-if="msg.message_type === 0" class="text-content">{{ msg.content }}</text>

            <!-- 图片消息 -->
            <wd-img
              v-else-if="msg.message_type === 1"
              :src="getMediaUrl(msg)"
              width="300rpx"
              mode="widthFix"
              radius="8rpx"
              enable-preview
              :preview-src-list="[getMediaUrl(msg)]"
            />

            <!-- 语音消息 -->
            <view v-else-if="msg.message_type === 2" class="audio-message" @click="playAudio(msg)">
              <wd-icon :name="playingAudioId === msg.id ? 'pause' : 'play'" size="36rpx" />
              <text class="audio-duration">{{ msg.duration || 0 }}"</text>
            </view>

            <!-- 视频消息 -->
            <video
              v-else-if="msg.message_type === 3"
              :src="getMediaUrl(msg)"
              class="video-message"
              object-fit="cover"
              :show-fullscreen-btn="true"
            />

            <!-- 文件消息 -->
            <view v-else-if="msg.message_type === 8" class="file-message" @click="openFile(msg)">
              <wd-icon name="file" size="48rpx" />
              <view class="file-info">
                <text class="file-name text-ellipsis">{{ getFileName(msg) }}</text>
                <text class="file-size">{{ formatSize(getFileSize(msg)) }}</text>
              </view>
            </view>

            <!-- 未知消息 -->
            <text v-else class="text-content">[未知消息类型]</text>
          </view>

          <!-- 自己的头像 -->
          <view v-if="msg.isSelf" class="message-avatar">
            <wd-img
              v-if="currentUser?.avatar"
              :src="currentUser.avatar"
              width="72rpx"
              height="72rpx"
              radius="8rpx"
            />
            <view v-else class="avatar-placeholder avatar-self">
              {{ currentUser?.name?.charAt(0) || '我' }}
            </view>
          </view>
        </view>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-placeholder" />
    </scroll-view>

    <!-- 输入区域 -->
    <view class="input-area">
      <!-- 工具栏 -->
      <view class="toolbar">
        <wd-icon name="emotion" size="48rpx" class="tool-icon" @click="showEmoji = true" />
        <wd-icon name="picture" size="48rpx" class="tool-icon" @click="chooseImage" />
        <wd-icon name="folder" size="48rpx" class="tool-icon" @click="chooseFile" />
      </view>

      <!-- 输入框 -->
      <view class="input-wrap">
        <wd-input
          v-model="inputText"
          type="textarea"
          :auto-height="true"
          :rows="1"
          placeholder="输入消息..."
          no-border
          @confirm="sendTextMessage"
        />
      </view>

      <!-- 发送按钮 -->
      <wd-button
        v-if="inputText.trim()"
        type="primary"
        size="small"
        @click="sendTextMessage"
      >
        发送
      </wd-button>
      <wd-icon v-else name="add-circle" size="48rpx" class="tool-icon" @click="showMore = true" />
    </view>

    <!-- 更多面板 -->
    <wd-popup v-model="showMore" position="bottom" safe-area-inset-bottom>
      <view class="more-panel">
        <view class="more-item" @click="chooseImage">
          <view class="more-icon"><wd-icon name="picture" size="48rpx" /></view>
          <text>图片</text>
        </view>
        <view class="more-item" @click="shootCamera">
          <view class="more-icon"><wd-icon name="camera" size="48rpx" /></view>
          <text>拍摄</text>
        </view>
        <view class="more-item" @click="chooseFile">
          <view class="more-icon"><wd-icon name="folder" size="48rpx" /></view>
          <text>文件</text>
        </view>
      </view>
    </wd-popup>

    <wd-toast />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useAuthStore, useChatStore, useConversationStore } from '@/stores'
import { wsManager } from '@/api/websocket'
import * as messageApi from '@/api/modules/message'
import { formatMessageTime, formatSize } from '@/utils/format'
import { isSystemMessage as checkSystemMessage } from '@/utils/message'
import { useToast } from 'wot-design-uni'
import type { ChatMessage } from '@/types/api'

const authStore = useAuthStore()
const chatStore = useChatStore()
const conversationStore = useConversationStore()
const toast = useToast()

// 路由参数
const roomId = ref('')
const targetId = ref('')
const chatName = ref('')

// 状态
const inputText = ref('')
const messages = ref<ChatMessage[]>([])
const scrollToId = ref('')
const refreshing = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const showMore = ref(false)
const showEmoji = ref(false)
const playingAudioId = ref<number | null>(null)
const page = ref(1)

// 计算属性
const currentUser = computed(() => authStore.user)
const targetUser = computed(() => {
  // 从联系人中获取目标用户信息
  const contact = chatStore.contacts.find(c => c.contact_user_id === targetId.value)
  return contact?.user
})

// 生命周期
onLoad((options: any) => {
  roomId.value = options?.roomId || ''
  targetId.value = options?.targetId || ''
  chatName.value = decodeURIComponent(options?.name || '聊天')
  
  loadMessages()
  setupWebSocket()
})

onMounted(() => {
  // 清除未读
  if (targetId.value) {
    conversationStore.clearUnread(targetId.value)
  }
})

onUnmounted(() => {
  wsManager.offMessage(handleNewMessage)
})

// 方法
async function loadMessages() {
  if (!roomId.value) return

  try {
    const cached = chatStore.getRoomMessages(roomId.value)
    if (cached.length > 0) {
      messages.value = cached.map(m => ({
        ...m,
        isSelf: m.sender_user_id === currentUser.value?.id
      }))
      scrollToBottom()
      return
    }

    const res = await messageApi.getMessages(roomId.value, 1, 50)
    messages.value = (res.data || []).reverse().map((m: ChatMessage) => ({
      ...m,
      isSelf: m.sender_user_id === currentUser.value?.id
    }))
    chatStore.setRoomMessages(roomId.value, messages.value)
    hasMore.value = res.data.length >= 50
    scrollToBottom()
  } catch (error) {
    console.error('加载消息失败:', error)
  }
}

async function loadMoreMessages() {
  if (loadingMore.value || !hasMore.value) {
    refreshing.value = false
    return
  }

  loadingMore.value = true
  page.value++

  try {
    const res = await messageApi.getMessages(roomId.value, page.value, 50)
    const newMessages = (res.data || []).reverse().map((m: ChatMessage) => ({
      ...m,
      isSelf: m.sender_user_id === currentUser.value?.id
    }))
    messages.value = [...newMessages, ...messages.value]
    hasMore.value = res.data.length >= 50
  } catch {
    page.value--
  } finally {
    loadingMore.value = false
    refreshing.value = false
  }
}

function setupWebSocket() {
  wsManager.onMessage(handleNewMessage)
}

function handleNewMessage(msg: ChatMessage) {
  if (msg.room_id !== roomId.value) return

  const newMsg = {
    ...msg,
    isSelf: msg.sender_user_id === currentUser.value?.id
  }
  messages.value.push(newMsg)
  chatStore.addMessage(roomId.value, newMsg)
  scrollToBottom()
}

function scrollToBottom() {
  nextTick(() => {
    if (messages.value.length > 0) {
      scrollToId.value = `msg-${messages.value[messages.value.length - 1].id}`
    }
  })
}

async function sendTextMessage() {
  if (!inputText.value.trim() || !roomId.value) return

  const content = inputText.value.trim()
  inputText.value = ''

  try {
    await messageApi.sendMessage({
      room_id: roomId.value,
      message_type: 0,
      content
    })
  } catch {
    toast.error('发送失败')
    inputText.value = content
  }
}

function chooseImage() {
  showMore.value = false
  uni.chooseImage({
    count: 9,
    sizeType: ['compressed'],
    sourceType: ['album'],
    success: async (res) => {
      for (const path of res.tempFilePaths) {
        await uploadAndSend(path, 1)
      }
    }
  })
}

function shootCamera() {
  showMore.value = false
  uni.chooseImage({
    count: 1,
    sourceType: ['camera'],
    success: async (res) => {
      await uploadAndSend(res.tempFilePaths[0], 1)
    }
  })
}

function chooseFile() {
  showMore.value = false
  // #ifdef MP-WEIXIN
  wx.chooseMessageFile({
    count: 1,
    type: 'file',
    success: async (res: any) => {
      await uploadAndSend(res.tempFiles[0].path, 8)
    }
  })
  // #endif

  // #ifdef APP-PLUS
  uni.chooseFile({
    count: 1,
    success: async (res: any) => {
      await uploadAndSend(res.tempFilePaths[0], 8)
    }
  })
  // #endif
}

async function uploadAndSend(filePath: string, messageType: number) {
  toast.loading('上传中...')
  try {
    // TODO: 实现文件上传
    toast.close()
    toast.show('文件上传功能开发中')
  } catch {
    toast.close()
    toast.error('上传失败')
  }
}

function playAudio(msg: ChatMessage) {
  // TODO: 播放语音
  toast.show('语音播放功能开发中')
}

function openFile(msg: ChatMessage) {
  // TODO: 打开文件
  toast.show('文件预览功能开发中')
}

function goBack() {
  uni.navigateBack()
}

function showChatInfo() {
  if (roomId.value) {
    uni.navigateTo({ url: `/pages/group/info?roomId=${roomId.value}` })
  }
}

// 辅助函数
function shouldShowTime(msg: ChatMessage, index: number): boolean {
  if (index === 0) return true
  const prevMsg = messages.value[index - 1]
  const currentTime = new Date(msg.created_at).getTime()
  const prevTime = new Date(prevMsg.created_at).getTime()
  return currentTime - prevTime > 5 * 60 * 1000 // 5分钟
}

function isSystemMessage(type: number): boolean {
  return checkSystemMessage(type)
}

function getBubbleClass(msg: ChatMessage): string {
  const classes = []
  if (msg.isSelf) classes.push('bubble-self')
  else classes.push('bubble-other')
  return classes.join(' ')
}

function getMediaUrl(msg: ChatMessage): string {
  if (typeof msg.extra === 'string') {
    try {
      const extra = JSON.parse(msg.extra)
      return extra.url || msg.content
    } catch {
      return msg.content
    }
  }
  return msg.extra?.url || msg.content
}

function getFileName(msg: ChatMessage): string {
  if (typeof msg.extra === 'string') {
    try {
      const extra = JSON.parse(msg.extra)
      return extra.name || '未知文件'
    } catch {
      return '未知文件'
    }
  }
  return msg.extra?.name || '未知文件'
}

function getFileSize(msg: ChatMessage): number {
  if (typeof msg.extra === 'string') {
    try {
      const extra = JSON.parse(msg.extra)
      return extra.size || 0
    } catch {
      return 0
    }
  }
  return msg.extra?.size || 0
}
</script>

<style lang="scss" scoped>
.chat-page {
  min-height: 100vh;
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
}

// 消息列表
.message-list {
  flex: 1;
  padding: 20rpx;
}

.load-more {
  text-align: center;
  padding: 20rpx;
  color: var(--text-tertiary);
  font-size: 24rpx;
}

.time-divider {
  text-align: center;
  padding: 20rpx 0;

  text {
    padding: 8rpx 20rpx;
    background: var(--bubble-system);
    border-radius: 8rpx;
    font-size: 24rpx;
    color: var(--text-tertiary);
  }
}

.system-message {
  text-align: center;
  padding: 16rpx 0;

  text {
    padding: 8rpx 24rpx;
    background: var(--bubble-system);
    border-radius: 8rpx;
    font-size: 26rpx;
    color: var(--text-tertiary);
  }
}

.message-bubble-wrap {
  display: flex;
  align-items: flex-start;
  margin-bottom: 24rpx;

  &.is-self {
    flex-direction: row-reverse;
  }
}

.message-avatar {
  margin: 0 16rpx;

  .avatar-placeholder {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8rpx;
    background: var(--color-primary);
    color: #fff;
    font-size: 28rpx;
    font-weight: 600;

    &.avatar-self {
      background: #10aeff;
    }
  }
}

.message-bubble {
  max-width: 60%;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  word-break: break-all;

  &.bubble-self {
    background: var(--bubble-self);
    border-top-right-radius: 4rpx;
  }

  &.bubble-other {
    background: var(--bubble-other);
    border-top-left-radius: 4rpx;
  }

  .text-content {
    font-size: 30rpx;
    color: var(--text-primary);
    line-height: 1.6;
  }
}

.audio-message {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-width: 120rpx;

  .audio-duration {
    font-size: 26rpx;
    color: var(--text-secondary);
  }
}

.video-message {
  width: 400rpx;
  height: 300rpx;
  border-radius: 8rpx;
}

.file-message {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx;
  background: var(--bg-hover);
  border-radius: 8rpx;
  min-width: 300rpx;

  .file-info {
    flex: 1;
    min-width: 0;

    .file-name {
      display: block;
      font-size: 28rpx;
      color: var(--text-primary);
    }

    .file-size {
      display: block;
      font-size: 24rpx;
      color: var(--text-tertiary);
      margin-top: 4rpx;
    }
  }
}

.bottom-placeholder {
  height: 200rpx;
}

// 输入区域
.input-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: flex-end;
  padding: 16rpx 20rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: var(--bg-content);
  border-top: 1rpx solid var(--divider-color);
  gap: 16rpx;
}

.toolbar {
  display: flex;
  gap: 16rpx;
  padding-bottom: 8rpx;
}

.tool-icon {
  color: var(--text-secondary);
}

.input-wrap {
  flex: 1;
  background: var(--search-bg);
  border-radius: 16rpx;
  padding: 8rpx 16rpx;
}

// 更多面板
.more-panel {
  display: flex;
  flex-wrap: wrap;
  padding: 40rpx;
  gap: 40rpx;
}

.more-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  width: 120rpx;

  .more-icon {
    width: 100rpx;
    height: 100rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-hover);
    border-radius: 16rpx;
  }

  text {
    font-size: 24rpx;
    color: var(--text-secondary);
  }
}
</style>
