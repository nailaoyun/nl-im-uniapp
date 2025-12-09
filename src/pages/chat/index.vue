<template>
  <view class="chat-page" :class="{ dark: isDark }">
    <!-- 导航栏 -->
    <wd-navbar
      :title="displayName"
      left-arrow
      fixed
      placeholder
      @click-left="goBack"
    >
      <template #right>
        <view class="navbar-actions">
          <wd-icon name="phone" size="44rpx" @click="startAudioCall" />
          <wd-icon name="video" size="44rpx" @click="startVideoCall" />
          <wd-icon name="more" size="44rpx" @click="showChatInfo" />
        </view>
      </template>
    </wd-navbar>

    <!-- 通话窗口 -->
    <call-window
      :call="webrtc.call"
      :local-stream="webrtc.localStream.value"
      :remote-stream="webrtc.remoteStream.value"
      :format-duration="webrtc.formatDuration"
      @accept="webrtc.acceptCall()"
      @reject="webrtc.rejectCall()"
      @end="webrtc.endCall()"
      @toggle-mute="webrtc.toggleMute()"
      @toggle-camera="webrtc.toggleCamera()"
      @toggle-minimize="webrtc.toggleMinimize()"
    />

    <!-- 消息列表 -->
    <scroll-view
      class="message-list"
      scroll-y
      :scroll-into-view="scrollToId"
      :scroll-top="scrollTop"
      :scroll-with-animation="scrollWithAnimation"
      :upper-threshold="100"
      @scrolltoupper="onScrollToUpper"
    >
      <!-- 加载提示 -->
      <view v-if="hasMore" class="load-more" @click="loadMoreMessages">
        <wd-loading v-if="loadingMore" />
        <text v-else>点击或滑到顶部加载更多</text>
      </view>
      <view v-else-if="messages.length > 0" class="load-more">
        <text>没有更多消息了</text>
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
          <view v-if="!msg.isSelf" class="message-avatar" @click="onAvatarClick(msg)">
            <app-avatar
              :src="getMessageSenderAvatar(msg)"
              :name="getMessageSenderName(msg)"
              :size="72"
              radius="8rpx"
            />
          </view>

          <!-- 消息内容 -->
          <view class="message-bubble" :class="getBubbleClass(msg)" @longpress="handleMessageLongPress(msg)">
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
            <app-avatar
              :src="currentUser?.avatar"
              :name="currentUser?.name || '我'"
              :size="72"
              radius="8rpx"
              bg-color="#10aeff"
            />
          </view>
        </view>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-placeholder" />
    </scroll-view>

    <!-- 输入区域 -->
    <view class="input-area">
      <!-- @ 提及选择器 -->
      <mention-picker
        v-if="isGroupChat"
        :show="showMentionPicker"
        :users="mentionUsers"
        @select="handleMentionSelect"
        @close="showMentionPicker = false"
      />

      <!-- 工具栏 -->
      <view class="toolbar">
        <wd-icon name="emotion" size="48rpx" class="tool-icon" @click="showEmoji = true" />
        <wd-icon name="picture" size="48rpx" class="tool-icon" @click="chooseImage" />
        <wd-icon name="folder" size="48rpx" class="tool-icon" @click="chooseFile" />
        <wd-icon v-if="isGroupChat" name="at" size="48rpx" class="tool-icon" @click="triggerMention" />
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
          @input="onInputChange"
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
        <view class="more-item" @click="chooseVideo">
          <view class="more-icon"><wd-icon name="video" size="48rpx" /></view>
          <text>视频</text>
        </view>
        <view class="more-item" @click="shootCamera">
          <view class="more-icon"><wd-icon name="camera" size="48rpx" /></view>
          <text>拍摄</text>
        </view>
        <view class="more-item" @click="chooseFile">
          <view class="more-icon"><wd-icon name="folder" size="48rpx" /></view>
          <text>文件</text>
        </view>
        <view class="more-item" @click="onMoreAudioCall">
          <view class="more-icon"><wd-icon name="phone" size="48rpx" /></view>
          <text>语音通话</text>
        </view>
        <view class="more-item" @click="onMoreVideoCall">
          <view class="more-icon"><wd-icon name="video-camera" size="48rpx" /></view>
          <text>视频通话</text>
        </view>
      </view>
    </wd-popup>

    <!-- 消息操作菜单 -->
    <wd-action-sheet
      v-model="showMsgActions"
      :actions="msgActionItems"
      @select="onMsgActionSelect"
      cancel-text="取消"
    />

    <!-- 文件确认弹窗 -->
    <wd-popup v-model="showFileConfirm" position="center" custom-style="border-radius: 24rpx; width: 85%;">
      <view class="file-confirm-modal">
        <view class="modal-header">
          <text class="modal-title">发送{{ pendingFile.type === 'image' ? '图片' : pendingFile.type === 'video' ? '视频' : '文件' }}</text>
        </view>
        
        <!-- 图片预览 -->
        <view v-if="pendingFile.type === 'image'" class="preview-area">
          <image 
            :src="pendingFile.path" 
            mode="aspectFit" 
            class="preview-image"
          />
        </view>
        
        <!-- 视频预览 -->
        <view v-else-if="pendingFile.type === 'video'" class="preview-area">
          <video 
            :src="pendingFile.path" 
            class="preview-video"
            object-fit="contain"
            :autoplay="false"
            :show-center-play-btn="true"
          />
        </view>
        
        <!-- 文件预览 -->
        <view v-else class="preview-area file-preview">
          <view class="file-icon">
            <wd-icon name="file" size="80rpx" color="var(--color-primary)" />
          </view>
          <view class="file-details">
            <text class="file-name-preview">{{ pendingFile.name }}</text>
            <text class="file-size-preview">{{ formatSize(pendingFile.size) }}</text>
          </view>
        </view>
        
        <!-- 文件信息 -->
        <view v-if="pendingFile.type !== 'file'" class="file-info-bar">
          <text class="info-name">{{ pendingFile.name }}</text>
          <text v-if="pendingFile.size" class="info-size">{{ formatSize(pendingFile.size) }}</text>
        </view>
        
        <view class="modal-footer">
          <wd-button plain @click="cancelFileSend">取消</wd-button>
          <wd-button type="primary" :loading="uploading" @click="confirmFileSend">发送</wd-button>
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
import * as attachmentApi from '@/api/modules/attachment'
import { formatMessageTime, formatSize, generateColor } from '@/utils/format'
import { isSystemOrNotifyMessage as checkSystemMessage } from '@/utils/message'
import { resolveImageUrl } from '@/utils/image'
import { useToast } from 'wot-design-uni'
import { useTheme } from '@/composables/useTheme'
import { useWebRTC } from '@/composables/useWebRTC'
import AppAvatar from '@/components/common/AppAvatar.vue'
import CallWindow from '@/components/call/CallWindow.vue'
import MentionPicker from '@/components/chat/MentionPicker.vue'
import type { MentionUser } from '@/components/chat/MentionPicker.vue'
import * as roomApi from '@/api/modules/room'
import type { ChatMessage, Attachment, GroupMember } from '@/types/api'

const authStore = useAuthStore()
const chatStore = useChatStore()
const conversationStore = useConversationStore()
const toast = useToast()
const { isDark } = useTheme()

// WebRTC 通话
const webrtc = useWebRTC(
  authStore.user?.id || '',
  (senderUserId) => {
    // 来电回调 - 可以在这里添加额外处理
    console.log('来电:', senderUserId)
  },
  (receiverUserId) => {
    // 获取 roomId 回调
    if (roomId.value) return roomId.value
    const contact = chatStore.contacts.find(c => c.contact_user_id === receiverUserId)
    return contact?.room_id || ''
  }
)

// 路由参数
const roomId = ref('')
const targetId = ref('')
const chatName = ref('')
const targetAvatar = ref('')

// 状态
const inputText = ref('')
const messages = ref<ChatMessage[]>([])
const scrollToId = ref('')
const scrollTop = ref(0)
const scrollWithAnimation = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const showMore = ref(false)
const showEmoji = ref(false)
const playingAudioId = ref<number | null>(null)
const page = ref(1)

// 文件确认弹窗
const showFileConfirm = ref(false)
const uploading = ref(false)
const pendingFile = ref<{
  path: string
  name: string
  size: number
  type: 'image' | 'video' | 'file'
  messageType: number
}>({
  path: '',
  name: '',
  size: 0,
  type: 'file',
  messageType: 8
})

// 消息操作
const showMsgActions = ref(false)
const selectedMessage = ref<ChatMessage | null>(null)

// @ 提及
const showMentionPicker = ref(false)
const groupMembers = ref<GroupMember[]>([])
const isGroupChat = ref(false)
const mentionUsers = computed<MentionUser[]>(() => {
  return groupMembers.value
    .filter(m => m.user_id !== currentUser.value?.id)
    .map(m => ({
      id: m.user_id,
      name: m.nickname || m.user?.name || '未知',
      avatar: m.user?.avatar
    }))
})

// 计算属性
const currentUser = computed(() => authStore.user)

// 消息操作菜单项
const msgActionItems = computed(() => {
  if (!selectedMessage.value) return []
  const msg = selectedMessage.value
  const items: any[] = []

  // 文本消息可以复制
  if (msg.message_type === 0) {
    items.push({ name: '复制', value: 'copy' })
  }

  // 自己发送的消息在2分钟内可撤回
  if (msg.isSelf) {
    const sendTime = new Date(msg.created_at).getTime()
    const now = Date.now()
    if (now - sendTime < 2 * 60 * 1000) {
      items.push({ name: '撤回', value: 'recall' })
    }
  }

  // 删除消息（本地删除）
  items.push({ name: '删除', value: 'delete', color: '#fa5151' })

  return items
})
const displayName = computed(() => targetUser.value?.name || chatName.value || '聊天')
const targetUser = computed(() => {
  // 优先从联系人中获取目标用户信息
  const contact = chatStore.contacts.find(c => c.contact_user_id === targetId.value)
  if (contact?.user) {
    return contact.user
  }
  // 如果联系人中没有，从会话列表中获取
  const conv = conversationStore.conversations.find(
    c => c.target_id === targetId.value || c.room_id === roomId.value
  )
  if (conv) {
    return {
      id: conv.target_id,
      name: conv.name || chatName.value,
      avatar: conv.avatar || targetAvatar.value
    }
  }
  // 最后使用 URL 参数
  return {
    id: targetId.value,
    name: chatName.value,
    avatar: targetAvatar.value
  }
})

// 生命周期
onLoad((options: any) => {
  roomId.value = options?.roomId || ''
  targetId.value = options?.targetId || ''
  chatName.value = decodeURIComponent(options?.name || '聊天')
  targetAvatar.value = decodeURIComponent(options?.avatar || '')
  
  // 检查是否是群聊
  isGroupChat.value = !targetId.value && !!roomId.value
  
  loadMessages()
  setupWebSocket()
  
  // 群聊加载成员列表
  if (isGroupChat.value && roomId.value) {
    loadGroupMembers()
  }
  
  // 如果带有 callType 参数，自动发起通话
  const callType = options?.callType
  if (callType && targetId.value) {
    setTimeout(() => {
      if (callType === 'audio') {
        startAudioCall()
      } else if (callType === 'video') {
        startVideoCall()
      }
    }, 500)
  }
})

onMounted(() => {
  // 清除未读
  if (targetId.value) {
    conversationStore.clearUnread(targetId.value)
  }
  // 确保滚动到底部
  setTimeout(() => {
    scrollToBottom(false)
  }, 300)
})

onUnmounted(() => {
  wsManager.offMessage(handleNewMessage)
  wsManager.offSignal(handleSignal)
  // 清理音频播放
  stopAudio()
  // 结束通话
  if (webrtc.call.active) {
    webrtc.endCall()
  }
})

// 加载群成员（用于 @ 功能）
async function loadGroupMembers() {
  if (!roomId.value) return
  try {
    groupMembers.value = await roomApi.getGroupMembers(roomId.value)
  } catch (e) {
    console.error('加载群成员失败:', e)
  }
}

// 方法
async function loadMessages() {
  if (!roomId.value) return

  try {
    const cached = chatStore.getRoomMessages(roomId.value)
    if (cached.length > 0) {
      messages.value = cached.map((m) => ({
        ...m,
        isSelf: m.sender_user_id === currentUser.value?.id,
        extra: typeof m.extra === 'string' ? JSON.parse(m.extra || '{}') : m.extra
      }))
      scrollToBottom(false)
      return
    }

    const res = await messageApi.getMessages(roomId.value, 1, 50)
    messages.value = (res.data || []).reverse().map((m: ChatMessage) => ({
      ...m,
      isSelf: m.sender_user_id === currentUser.value?.id,
      extra: typeof m.extra === 'string' ? JSON.parse(m.extra || '{}') : m.extra
    }))
    chatStore.setRoomMessages(roomId.value, messages.value)
    hasMore.value = res.data.length >= 50
    scrollToBottom(false)
  } catch (error) {
    console.error('加载消息失败:', error)
  }
}

// 滚动到顶部时加载更多消息
function onScrollToUpper() {
  if (!loadingMore.value && hasMore.value) {
    loadMoreMessages()
  }
}

async function loadMoreMessages() {
  if (loadingMore.value || !hasMore.value) {
    return
  }

  loadingMore.value = true
  page.value++

  // 记录第一条消息的 ID，用于保持滚动位置
  const firstMsgId = messages.value.length > 0 ? messages.value[0].id : null

  try {
    const res = await messageApi.getMessages(roomId.value, page.value, 50)
    const newMessages = (res.data || []).reverse().map((m: ChatMessage) => ({
      ...m,
      isSelf: m.sender_user_id === currentUser.value?.id,
      extra: typeof m.extra === 'string' ? JSON.parse(m.extra || '{}') : m.extra
    }))
    messages.value = [...newMessages, ...messages.value]
    hasMore.value = res.data.length >= 50

    // 保持滚动位置 - 滚动到之前的第一条消息
    if (firstMsgId) {
      nextTick(() => {
        scrollWithAnimation.value = false
        scrollToId.value = `msg-${firstMsgId}`
      })
    }
  } catch {
    page.value--
  } finally {
    loadingMore.value = false
  }
}

function setupWebSocket() {
  wsManager.onMessage(handleNewMessage)
  wsManager.onSignal(handleSignal)
}

// 处理 WebRTC 信令
function handleSignal(message: ChatMessage) {
  webrtc.handleSignaling(message)
}

// 发起语音通话
function startAudioCall() {
  if (!targetId.value) {
    toast.show('无法发起通话')
    return
  }
  webrtc.startCall('audio', targetId.value, roomId.value)
}

// 发起视频通话
function startVideoCall() {
  if (!targetId.value) {
    toast.show('无法发起通话')
    return
  }
  webrtc.startCall('video', targetId.value, roomId.value)
}

// 从更多面板发起语音通话
function onMoreAudioCall() {
  showMore.value = false
  startAudioCall()
}

// 从更多面板发起视频通话
function onMoreVideoCall() {
  showMore.value = false
  startVideoCall()
}

function handleNewMessage(msg: ChatMessage) {
  // 忽略信令消息
  if (msg.message_type === 6) return

  // 解析 extra 字段（与 nl-im-vue-ts 对齐）
  const parsedExtra = typeof msg.extra === 'string' ? JSON.parse(msg.extra || '{}') : msg.extra

  const newMsg: ChatMessage = {
    ...msg,
    isSelf: msg.sender_user_id === currentUser.value?.id,
    extra: parsedExtra
  }

  // 更新会话列表（无论是否当前房间的消息都要更新）
  const isCurrentChat = msg.room_id === roomId.value
  conversationStore.handleMessageUpdate(newMsg, newMsg.isSelf || false, isCurrentChat)
  
  // 不是当前房间的消息，不添加到消息列表
  if (!isCurrentChat) return
  
  // 避免重复添加（本地已发送的消息）
  const exists = messages.value.some(
    (m) => m.id === newMsg.id || (m.isSelf && m.content === newMsg.content && Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 2000)
  )
  
  if (!exists) {
    messages.value.push(newMsg)
    chatStore.addMessage(roomId.value, newMsg)
    scrollToBottom(true)
  }
}

function scrollToBottom(smooth = true) {
  nextTick(() => {
    if (messages.value.length > 0) {
      scrollWithAnimation.value = smooth
      scrollToId.value = `msg-${messages.value[messages.value.length - 1].id}`
    }
  })
}

async function sendTextMessage() {
  if (!inputText.value.trim() || !roomId.value) return

  const content = inputText.value.trim()
  inputText.value = ''

  // 构建消息结构（与 nl-im-vue-ts 对齐）
  const message: ChatMessage = {
    id: Date.now(),
    room_id: roomId.value,
    sender_user_id: currentUser.value!.id,
    receiver_user_id: targetId.value || '',
    message_type: 0,
    content,
    duration: 0,
    extra: {},
    created_at: new Date().toISOString(),
    isSelf: true
  }

  // 先添加到本地列表
  messages.value.push(message)
  chatStore.addMessage(roomId.value, message)
  // 更新会话列表最后一条消息
  conversationStore.handleMessageUpdate(message, true, true)
  scrollToBottom()

  try {
    await messageApi.sendMessage({
      sender_client_id: wsManager.getClientId() || '',
      receiver_user_id: targetId.value || '',
      room_id: roomId.value,
      message_type: 0,
      content,
      extra: JSON.stringify({})
    })
  } catch {
    // 发送失败，移除本地消息
    const index = messages.value.findIndex((m) => m.id === message.id)
    if (index > -1) {
      messages.value.splice(index, 1)
    }
    toast.error('发送失败')
    inputText.value = content
  }
}

function chooseImage() {
  showMore.value = false
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album'],
    success: async (res) => {
      const filePath = res.tempFilePaths[0]
      const fileInfo = await getFileInfo(filePath)
      pendingFile.value = {
        path: filePath,
        name: fileInfo.name || '图片',
        size: fileInfo.size,
        type: 'image',
        messageType: 1
      }
      showFileConfirm.value = true
    }
  })
}

function shootCamera() {
  showMore.value = false
  uni.chooseImage({
    count: 1,
    sourceType: ['camera'],
    success: async (res) => {
      const filePath = res.tempFilePaths[0]
      const fileInfo = await getFileInfo(filePath)
      pendingFile.value = {
        path: filePath,
        name: '拍摄图片',
        size: fileInfo.size,
        type: 'image',
        messageType: 1
      }
      showFileConfirm.value = true
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
      const file = res.tempFiles[0]
      pendingFile.value = {
        path: file.path,
        name: file.name || '文件',
        size: file.size || 0,
        type: 'file',
        messageType: 8
      }
      showFileConfirm.value = true
    }
  })
  // #endif

  // #ifdef APP-PLUS
  uni.chooseFile({
    count: 1,
    success: async (res: any) => {
      const filePath = res.tempFilePaths[0]
      const fileInfo = await getFileInfo(filePath)
      pendingFile.value = {
        path: filePath,
        name: fileInfo.name,
        size: fileInfo.size,
        type: 'file',
        messageType: 8
      }
      showFileConfirm.value = true
    }
  })
  // #endif

  // #ifdef H5
  // H5 端使用 input[type=file]
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '*/*'
  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      // 创建一个临时 blob URL
      const blobUrl = URL.createObjectURL(file)
      pendingFile.value = {
        path: blobUrl,
        name: file.name,
        size: file.size,
        type: 'file',
        messageType: 8
      }
      showFileConfirm.value = true
    }
  }
  input.click()
  // #endif
}

async function uploadAndSend(filePath: string, messageType: number, fileName?: string) {
  toast.loading('上传中...')
  try {
    // 确定上传类型
    const uploadType = messageType === 1 ? 'image' : messageType === 3 ? 'video' : 'file'
    
    // 上传文件
    const attachment = await attachmentApi.uploadAttachment(filePath, uploadType)
    toast.close()

    // 获取文件信息
    const fileInfo = await getFileInfo(filePath)
    
    // 构建 extra 数据
    const extra: Record<string, any> = {
      url: attachment.file_url,
      name: fileName || attachment.file_name || fileInfo.name,
      size: attachment.file_size || fileInfo.size,
      attachment_id: attachment.id
    }
    
    // 图片/视频可能有宽高
    if (attachment.width) extra.width = attachment.width
    if (attachment.height) extra.height = attachment.height
    if (attachment.duration) extra.duration = attachment.duration

    // 构建消息
    const message: ChatMessage = {
      id: Date.now(),
      room_id: roomId.value,
      sender_user_id: currentUser.value!.id,
      receiver_user_id: targetId.value || '',
      message_type: messageType,
      content: attachment.file_url,
      duration: attachment.duration || 0,
      extra,
      created_at: new Date().toISOString(),
      isSelf: true
    }

    // 先添加到本地列表
    messages.value.push(message)
    chatStore.addMessage(roomId.value, message)
    // 更新会话列表最后一条消息
    conversationStore.handleMessageUpdate(message, true, true)
    scrollToBottom(true)

    // 发送消息
    await messageApi.sendMessage({
      sender_client_id: wsManager.getClientId() || '',
      receiver_user_id: targetId.value || '',
      room_id: roomId.value,
      message_type: messageType,
      content: attachment.file_url,
      duration: attachment.duration || 0,
      extra: JSON.stringify(extra)
    })

    toast.success('发送成功')
  } catch (error: any) {
    toast.close()
    toast.error(error.message || '发送失败')
  }
}

// 获取本地文件信息
function getFileInfo(filePath: string): Promise<{ name: string; size: number }> {
  return new Promise((resolve) => {
    // 从路径提取文件名
    const pathParts = filePath.split('/')
    const name = pathParts[pathParts.length - 1] || '未知文件'

    // #ifdef H5
    resolve({ name, size: 0 })
    // #endif

    // #ifndef H5
    uni.getFileInfo({
      filePath,
      success: (res) => {
        resolve({ name, size: res.size || 0 })
      },
      fail: () => {
        resolve({ name, size: 0 })
      }
    })
    // #endif
  })
}

// 音频播放实例
let audioContext: UniApp.InnerAudioContext | null = null

function playAudio(msg: ChatMessage) {
  const audioUrl = getMediaUrl(msg)
  if (!audioUrl) {
    toast.error('无法获取音频地址')
    return
  }

  // 如果正在播放同一条消息，则停止
  if (playingAudioId.value === msg.id) {
    stopAudio()
    return
  }

  // 停止之前播放的音频
  stopAudio()

  // 创建音频实例
  audioContext = uni.createInnerAudioContext()
  audioContext.src = audioUrl
  audioContext.autoplay = true
  
  playingAudioId.value = msg.id

  audioContext.onEnded(() => {
    playingAudioId.value = null
  })

  audioContext.onError((err) => {
    console.error('Audio play error:', err)
    toast.error('播放失败')
    playingAudioId.value = null
  })
}

function stopAudio() {
  if (audioContext) {
    audioContext.stop()
    audioContext.destroy()
    audioContext = null
  }
  playingAudioId.value = null
}

function openFile(msg: ChatMessage) {
  const fileUrl = getMediaUrl(msg)
  const fileName = getFileName(msg)
  
  if (!fileUrl) {
    toast.error('无法获取文件地址')
    return
  }

  // 在H5端直接打开新标签页
  // #ifdef H5
  window.open(fileUrl, '_blank')
  return
  // #endif

  // 在APP/小程序端尝试下载并预览
  // #ifndef H5
  toast.loading('正在打开文件...')
  
  uni.downloadFile({
    url: fileUrl,
    success: (res) => {
      toast.close()
      if (res.statusCode === 200) {
        uni.openDocument({
          filePath: res.tempFilePath,
          showMenu: true,
          success: () => {},
          fail: (err) => {
            console.error('Open document failed:', err)
            toast.error('无法打开此类型文件')
          }
        })
      } else {
        toast.error('下载文件失败')
      }
    },
    fail: (err) => {
      toast.close()
      console.error('Download file failed:', err)
      toast.error('下载文件失败')
    }
  })
  // #endif
}

// 选择视频
function chooseVideo() {
  showMore.value = false
  uni.chooseVideo({
    sourceType: ['album', 'camera'],
    maxDuration: 60,
    success: async (res) => {
      const fileInfo = await getFileInfo(res.tempFilePath)
      pendingFile.value = {
        path: res.tempFilePath,
        name: res.name || fileInfo.name || '视频',
        size: res.size || fileInfo.size,
        type: 'video',
        messageType: 3
      }
      showFileConfirm.value = true
    }
  })
}

// 取消文件发送
function cancelFileSend() {
  showFileConfirm.value = false
  pendingFile.value = { path: '', name: '', size: 0, type: 'file', messageType: 8 }
}

// 确认文件发送
async function confirmFileSend() {
  uploading.value = true
  try {
    await uploadAndSend(pendingFile.value.path, pendingFile.value.messageType, pendingFile.value.name)
    showFileConfirm.value = false
    pendingFile.value = { path: '', name: '', size: 0, type: 'file', messageType: 8 }
  } finally {
    uploading.value = false
  }
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
  let url = ''
  if (typeof msg.extra === 'string') {
    try {
      const extra = JSON.parse(msg.extra)
      url = extra.url || msg.content
    } catch {
      url = msg.content
    }
  } else {
    url = msg.extra?.url || msg.content
  }
  return resolveImageUrl(url)
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

// 获取消息发送者头像
function getMessageSenderAvatar(msg: ChatMessage): string {
  // 单聊直接返回目标用户头像
  return targetUser.value?.avatar || ''
}

// 获取消息发送者名称
function getMessageSenderName(msg: ChatMessage): string {
  return targetUser.value?.name || chatName.value || '未知'
}

// 点击头像进入详情
function onAvatarClick(msg: ChatMessage) {
  const userId = msg.sender_user_id
  if (!userId) return
  
  // 跳转到用户详情页
  // 对于单聊，使用 targetId；对于群聊，使用消息发送者 ID
  uni.navigateTo({
    url: `/pages/contact/detail?userId=${userId}`
  })
}

// ========== 消息操作 ==========
function handleMessageLongPress(msg: ChatMessage) {
  selectedMessage.value = msg
  showMsgActions.value = true
}

async function onMsgActionSelect(action: { value: string }) {
  if (!selectedMessage.value) return
  const msg = selectedMessage.value
  showMsgActions.value = false

  switch (action.value) {
    case 'copy':
      copyMessage(msg)
      break
    case 'recall':
      await recallMessage(msg)
      break
    case 'delete':
      deleteMessage(msg)
      break
  }
}

// 复制消息
function copyMessage(msg: ChatMessage) {
  if (msg.message_type !== 0) return
  
  uni.setClipboardData({
    data: msg.content || '',
    success: () => {
      toast.success('已复制')
    },
    fail: () => {
      toast.error('复制失败')
    }
  })
}

// 撤回消息
async function recallMessage(msg: ChatMessage) {
  try {
    await messageApi.recallMessage(msg.id)
    // 将消息转为撤回消息
    const index = messages.value.findIndex(m => m.id === msg.id)
    if (index > -1) {
      messages.value[index] = {
        ...messages.value[index],
        message_type: 5, // 系统消息类型
        content: '你撤回了一条消息'
      }
    }
    toast.success('已撤回')
  } catch (e: any) {
    toast.error(e.message || '撤回失败')
  }
}

// 删除消息（本地删除）
function deleteMessage(msg: ChatMessage) {
  const index = messages.value.findIndex(m => m.id === msg.id)
  if (index > -1) {
    messages.value.splice(index, 1)
    chatStore.removeMessage(roomId.value, msg.id)
    toast.success('已删除')
  }
}

// ========== @ 提及功能 ==========
// 监听输入变化
function onInputChange(e: any) {
  const value = e.detail?.value || inputText.value
  // 检查最后输入的字符是否是 @
  if (value.endsWith('@') && isGroupChat.value) {
    showMentionPicker.value = true
  }
}

// 手动触发 @
function triggerMention() {
  inputText.value += '@'
  showMentionPicker.value = true
}

// 选择 @ 的用户
function handleMentionSelect(user: MentionUser) {
  // 将 @ 后面加上用户名和空格
  // 如果最后一个字符是 @，则不重复添加
  if (inputText.value.endsWith('@')) {
    inputText.value = inputText.value.slice(0, -1) + `@${user.name} `
  } else {
    inputText.value += `@${user.name} `
  }
  showMentionPicker.value = false
}
</script>

<style lang="scss" scoped>
.chat-page {
  min-height: 100vh;
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
}

// 导航栏操作按钮
.navbar-actions {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

// 消息列表
.message-list {
  position: fixed;
  top: calc(88rpx + var(--status-bar-height, 0));
  left: 0;
  right: 0;
  bottom: calc(120rpx + env(safe-area-inset-bottom));
  padding: 20rpx;
  background: var(--bg-page);
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

// 文件确认弹窗样式
.file-confirm-modal {
  padding: 32rpx;
  background: var(--bg-content);

  .modal-header {
    text-align: center;
    margin-bottom: 32rpx;

    .modal-title {
      font-size: 32rpx;
      font-weight: 600;
      color: var(--text-primary);
    }
  }

  .preview-area {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 24rpx;
    background: var(--bg-page);
    border-radius: 16rpx;
    overflow: hidden;

    .preview-image {
      max-width: 100%;
      max-height: 400rpx;
    }

    .preview-video {
      width: 100%;
      max-height: 400rpx;
    }

    &.file-preview {
      flex-direction: column;
      padding: 40rpx;
      gap: 20rpx;

      .file-icon {
        width: 120rpx;
        height: 120rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(var(--color-primary-rgb, 99, 102, 241), 0.1);
        border-radius: 24rpx;
      }

      .file-details {
        text-align: center;
      }

      .file-name-preview {
        display: block;
        font-size: 28rpx;
        color: var(--text-primary);
        word-break: break-all;
        margin-bottom: 8rpx;
      }

      .file-size-preview {
        display: block;
        font-size: 24rpx;
        color: var(--text-tertiary);
      }
    }
  }

  .file-info-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16rpx 20rpx;
    background: var(--bg-hover);
    border-radius: 12rpx;
    margin-bottom: 24rpx;

    .info-name {
      flex: 1;
      font-size: 26rpx;
      color: var(--text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .info-size {
      font-size: 24rpx;
      color: var(--text-tertiary);
      margin-left: 16rpx;
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 16rpx;
  }
}
</style>
