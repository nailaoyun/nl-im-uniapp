<template>
  <wd-config-provider :theme="isDark ? 'dark' : 'light'">
    <view class="chat-page-container" :class="{ 'theme-dark': isDark }">
      <!-- 沉浸式导航栏 -->
      <wd-navbar
          fixed
          placeholder
          left-arrow
          custom-class="glass-navbar"
          @click-left="goBack"
      >
        <template #title>
          <view class="nav-center">
            <text class="nav-name">{{ displayName }}</text>
            <view v-if="isGroupChat" class="nav-badge">{{ groupMembers.length }}</view>
          </view>
        </template>
        <template #right>
          <view class="nav-actions">
            <view class="icon-btn" @click="startAudioCall"><wd-icon name="phone" size="40rpx" /></view>
            <view class="icon-btn" @click="startVideoCall"><wd-icon name="video" size="40rpx" /></view>
            <view class="icon-btn" @click="showChatInfo"><wd-icon name="more" size="40rpx" /></view>
          </view>
        </template>
      </wd-navbar>

      <!-- WebRTC 通话窗口 -->
      <call-window
          v-if="webrtc"
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
          class="chat-scroll-area"
          scroll-y
          :scroll-into-view="scrollToId"
          :scroll-top="scrollTop"
          :scroll-with-animation="scrollWithAnimation"
          :upper-threshold="100"
          @scrolltoupper="onScrollToUpper"
      >
        <view class="message-feed">
          <view class="feed-status">
            <wd-loading v-if="loadingMore" size="24rpx" />
            <text v-else-if="hasMore" class="link-text" @click="loadMoreMessages">查看历史消息</text>
            <text v-else class="end-text">没有更多消息了</text>
          </view>

          <view
              v-for="(msg, index) in messages"
              :key="msg.id"
              :id="`msg-${msg.id}`"
              class="message-item"
              :class="{ 'self': msg.isSelf, 'system': isSystemMessage(msg.message_type) }"
          >
            <!-- 时间戳 -->
            <view v-if="shouldShowTime(msg, index)" class="timestamp">
              <text>{{ formatMessageTime(msg.created_at) }}</text>
            </view>

            <!-- 系统消息 -->
            <view v-if="isSystemMessage(msg.message_type)" class="system-notice">
              <text>{{ msg.content }}</text>
            </view>

            <!-- 普通消息区域 (修正布局逻辑) -->
            <view v-else class="bubble-group" :class="{ 'is-me': msg.isSelf }">

              <!-- 左侧头像 (对方) -->
              <view class="avatar-box left" v-if="!msg.isSelf" @click="onAvatarClick(msg)">
                <app-avatar
                    :src="getMessageSenderAvatar(msg)"
                    :name="getMessageSenderName(msg)"
                    :size="80"
                    radius="24rpx"
                />
              </view>

              <!-- 中间内容区 -->
              <view class="content-box">
                <text v-if="isGroupChat && !msg.isSelf" class="sender-label">{{ getMessageSenderName(msg) }}</text>

                <view
                    class="bubble-card"
                    :class="[getBubbleClass(msg), getMediaTypeClass(msg.message_type)]"
                    @longpress="handleMessageLongPress(msg)"
                >
                  <!-- 文本 -->
                  <text v-if="msg.message_type === 0" class="plain-text" selectable>{{ msg.content }}</text>

                  <!-- 图片 -->
                  <wd-img
                      v-else-if="msg.message_type === 1"
                      :src="getMediaUrl(msg)"
                      width="auto"
                      custom-style="max-width: 400rpx; max-height: 400rpx; border-radius: 16rpx; display: block;"
                      mode="heightFix"
                      enable-preview
                      :preview-src-list="[getMediaUrl(msg)]"
                  />

                  <!-- 语音 -->
                  <view v-else-if="msg.message_type === 2" class="audio-capsule" @click="playAudio(msg)">
                    <wd-icon :name="playingAudioId === msg.id ? 'pause-circle' : 'play-circle'" size="44rpx" />
                    <view class="visualizer">
                      <view class="bar" v-for="i in 4" :key="i" :class="{ animating: playingAudioId === msg.id }"></view>
                    </view>
                    <text class="duration-tag">{{ msg.duration || 0 }}"</text>
                  </view>

                  <!-- 视频 -->
                  <view v-else-if="msg.message_type === 3" class="video-preview">
                    <video :src="getMediaUrl(msg)" class="video-player" object-fit="cover" />
                  </view>

                  <!-- 文件 -->
                  <view v-else-if="msg.message_type === 8" class="file-card" @click="openFile(msg)">
                    <view class="icon-sq">
                      <wd-icon name="file" size="48rpx" color="#fff" />
                    </view>
                    <view class="file-meta">
                      <text class="fname text-ellipsis">{{ getFileName(msg) }}</text>
                      <text class="fsize">{{ formatSize(getFileSize(msg)) }}</text>
                    </view>
                  </view>

                  <text v-else class="plain-text">[不支持的消息]</text>
                </view>
              </view>

              <!-- 右侧头像 (自己) -->
              <view class="avatar-box right" v-if="msg.isSelf">
                <app-avatar
                    :src="currentUser?.avatar"
                    :name="currentUser?.name"
                    :size="80"
                    radius="24rpx"
                />
              </view>

            </view>
          </view>
        </view>

        <view class="bottom-spacer"></view>
      </scroll-view>

      <!-- 悬浮输入面板 -->
      <view class="input-floater">
        <mention-picker
            v-if="isGroupChat"
            :show="showMentionPicker"
            :users="mentionUsers"
            @select="handleMentionSelect"
            @close="showMentionPicker = false"
        />

        <view class="input-bar-capsule">
          <view class="action-trigger" @click="showEmoji = !showEmoji">
            <wd-icon name="emotion" size="52rpx" />
          </view>

          <view class="input-field-wrap">
            <wd-input
                v-model="inputText"
                type="textarea"
                :auto-height="true"
                :max-height="120"
                :rows="1"
                placeholder="发送消息..."
                no-border
                custom-class="clean-input"
                @confirm="sendTextMessage"
                @input="onInputChange"
            />
          </view>

          <view class="right-triggers">
            <template v-if="inputText.trim()">
              <view class="send-btn" @click="sendTextMessage">
                <wd-icon name="check" size="40rpx" />
              </view>
            </template>
            <template v-else>
              <view class="action-trigger" @click="showMore = true">
                <wd-icon name="add-circle" size="52rpx" />
              </view>
            </template>
          </view>
        </view>
      </view>

      <!-- 更多功能面板 -->
      <wd-popup v-model="showMore" position="bottom" safe-area-inset-bottom custom-style="background: var(--bg-card); border-radius: 32rpx 32rpx 0 0;">
        <view class="tools-grid">
          <view class="tool-item" @click="chooseImage">
            <view class="tool-icon album"><wd-icon name="picture" size="52rpx" color="#fff" /></view>
            <text>相册</text>
          </view>
          <view class="tool-item" @click="shootCamera">
            <view class="tool-icon camera"><wd-icon name="camera" size="52rpx" color="#fff" /></view>
            <text>拍摄</text>
          </view>
          <view class="tool-item" @click="onMoreVideoCall">
            <view class="tool-icon video"><wd-icon name="video" size="52rpx" color="#fff" /></view>
            <text>视频</text>
          </view>
          <view class="tool-item" @click="onMoreAudioCall">
            <view class="tool-icon call"><wd-icon name="phone" size="52rpx" color="#fff" /></view>
            <text>语音</text>
          </view>
          <view class="tool-item" @click="chooseFile">
            <view class="tool-icon file"><wd-icon name="folder" size="52rpx" color="#fff" /></view>
            <text>文件</text>
          </view>
        </view>
      </wd-popup>

      <wd-action-sheet v-model="showMsgActions" :actions="msgActionItems" @select="onMsgActionSelect" cancel-text="取消" />

      <!-- 文件确认 -->
      <wd-popup v-model="showFileConfirm" position="center" custom-style="border-radius: 32rpx; width: 600rpx; background: var(--bg-card);">
        <view class="confirm-dialog">
          <view class="dialog-header">确认发送</view>
          <view class="file-preview-box">
            <wd-icon name="file" size="80rpx" color="var(--primary)" />
            <view class="f-info">
              <text class="f-name">{{ pendingFile.name }}</text>
              <text class="f-size">{{ formatSize(pendingFile.size) }}</text>
            </view>
          </view>
          <view class="dialog-footer">
            <wd-button plain size="medium" @click="cancelFileSend" custom-style="flex:1; border:none; background: var(--bg-base);">取消</wd-button>
            <wd-button size="medium" @click="confirmFileSend" :loading="uploading" custom-style="flex:1;">发送</wd-button>
          </view>
        </view>
      </wd-popup>

      <wd-toast />
    </view>
  </wd-config-provider>
</template>

<script setup lang="ts">
// ==========================================
// 逻辑代码保持不变
// ==========================================
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

const webrtc = useWebRTC(
    authStore.user?.id || '',
    (senderUserId) => { console.log('来电:', senderUserId) },
    (receiverUserId) => {
      if (roomId.value) return roomId.value
      const contact = chatStore.contacts.find(c => c.contact_user_id === receiverUserId)
      return contact?.room_id || ''
    }
)

const roomId = ref(''); const targetId = ref(''); const chatName = ref(''); const targetAvatar = ref('');
const inputText = ref(''); const messages = ref<ChatMessage[]>([]); const scrollToId = ref(''); const scrollTop = ref(0); const scrollWithAnimation = ref(false); const loadingMore = ref(false); const hasMore = ref(true); const showMore = ref(false); const showEmoji = ref(false); const playingAudioId = ref<number | null>(null); const page = ref(1);
const showFileConfirm = ref(false); const uploading = ref(false); const pendingFile = ref<{ path: string; name: string; size: number; type: 'image' | 'video' | 'file'; messageType: number }>({ path: '', name: '', size: 0, type: 'file', messageType: 8 });
const showMsgActions = ref(false); const selectedMessage = ref<ChatMessage | null>(null);
const showMentionPicker = ref(false); const groupMembers = ref<GroupMember[]>([]); const isGroupChat = ref(false);
const mentionUsers = computed<MentionUser[]>(() => { return groupMembers.value.filter(m => m.user_id !== currentUser.value?.id).map(m => ({ id: m.user_id, name: m.nickname || m.user?.name || '未知', avatar: m.user?.avatar })) });
const currentUser = computed(() => authStore.user);
const msgActionItems = computed(() => { if (!selectedMessage.value) return []; const msg = selectedMessage.value; const items: any[] = []; if (msg.message_type === 0) { items.push({ name: '复制', value: 'copy' }) } if (msg.isSelf) { const sendTime = new Date(msg.created_at).getTime(); const now = Date.now(); if (now - sendTime < 2 * 60 * 1000) { items.push({ name: '撤回', value: 'recall' }) } } items.push({ name: '删除', value: 'delete', color: '#fa5151' }); return items });
const displayName = computed(() => targetUser.value?.name || chatName.value || '聊天');
const targetUser = computed(() => { const contact = chatStore.contacts.find(c => c.contact_user_id === targetId.value); if (contact?.user) { return contact.user } const conv = conversationStore.conversations.find(c => c.target_id === targetId.value || c.room_id === roomId.value); if (conv) { return { id: conv.target_id, name: conv.name || chatName.value, avatar: conv.avatar || targetAvatar.value } } return { id: targetId.value, name: chatName.value, avatar: targetAvatar.value } });

onLoad((options: any) => { roomId.value = options?.roomId || ''; targetId.value = options?.targetId || ''; chatName.value = decodeURIComponent(options?.name || '聊天'); targetAvatar.value = decodeURIComponent(options?.avatar || ''); isGroupChat.value = !targetId.value && !!roomId.value; loadMessages(); setupWebSocket(); if (isGroupChat.value && roomId.value) { loadGroupMembers() } const callType = options?.callType; if (callType && targetId.value) { setTimeout(() => { if (callType === 'audio') { startAudioCall() } else if (callType === 'video') { startVideoCall() } }, 500) } });
onMounted(() => { if (targetId.value) { conversationStore.clearUnread(targetId.value) } setTimeout(() => { scrollToBottom(false) }, 300) });
onUnmounted(() => { wsManager.offMessage(handleNewMessage); wsManager.offSignal(handleSignal); stopAudio(); if (webrtc.call.active) { webrtc.endCall() } });

async function loadGroupMembers() { if (!roomId.value) return; try { groupMembers.value = await roomApi.getGroupMembers(roomId.value) } catch (e) { console.error('加载群成员失败:', e) } }
async function loadMessages() { if (!roomId.value) return; try { const cached = chatStore.getRoomMessages(roomId.value); if (cached.length > 0) { messages.value = cached.map((m) => ({ ...m, isSelf: m.sender_user_id === currentUser.value?.id, extra: typeof m.extra === 'string' ? JSON.parse(m.extra || '{}') : m.extra })); scrollToBottom(false); return } const res = await messageApi.getMessages(roomId.value, 1, 50); messages.value = (res.data || []).reverse().map((m: ChatMessage) => ({ ...m, isSelf: m.sender_user_id === currentUser.value?.id, extra: typeof m.extra === 'string' ? JSON.parse(m.extra || '{}') : m.extra })); chatStore.setRoomMessages(roomId.value, messages.value); hasMore.value = res.data.length >= 50; scrollToBottom(false) } catch (error) { console.error('加载消息失败:', error) } }
function onScrollToUpper() { if (!loadingMore.value && hasMore.value) { loadMoreMessages() } }
async function loadMoreMessages() { if (loadingMore.value || !hasMore.value) { return } loadingMore.value = true; page.value++; const firstMsgId = messages.value.length > 0 ? messages.value[0].id : null; try { const res = await messageApi.getMessages(roomId.value, page.value, 50); const newMessages = (res.data || []).reverse().map((m: ChatMessage) => ({ ...m, isSelf: m.sender_user_id === currentUser.value?.id, extra: typeof m.extra === 'string' ? JSON.parse(m.extra || '{}') : m.extra })); messages.value = [...newMessages, ...messages.value]; hasMore.value = res.data.length >= 50; if (firstMsgId) { nextTick(() => { scrollWithAnimation.value = false; scrollToId.value = `msg-${firstMsgId}` }) } } catch { page.value-- } finally { loadingMore.value = false } }
function setupWebSocket() { wsManager.onMessage(handleNewMessage); wsManager.onSignal(handleSignal) }
function handleSignal(message: ChatMessage) { webrtc.handleSignaling(message) }
function startAudioCall() { if (!targetId.value) { toast.show('无法发起通话'); return } webrtc.startCall('audio', targetId.value, roomId.value) }
function startVideoCall() { if (!targetId.value) { toast.show('无法发起通话'); return } webrtc.startCall('video', targetId.value, roomId.value) }
function onMoreAudioCall() { showMore.value = false; startAudioCall() }
function onMoreVideoCall() { showMore.value = false; startVideoCall() }
function handleNewMessage(msg: ChatMessage) { if (msg.message_type === 6) return; const parsedExtra = typeof msg.extra === 'string' ? JSON.parse(msg.extra || '{}') : msg.extra; const newMsg: ChatMessage = { ...msg, isSelf: msg.sender_user_id === currentUser.value?.id, extra: parsedExtra }; const isCurrentChat = msg.room_id === roomId.value; conversationStore.handleMessageUpdate(newMsg, newMsg.isSelf || false, isCurrentChat); if (!isCurrentChat) return; const exists = messages.value.some( (m) => m.id === newMsg.id || (m.isSelf && m.content === newMsg.content && Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 2000) ); if (!exists) { messages.value.push(newMsg); chatStore.addMessage(roomId.value, newMsg); scrollToBottom(true) } }
function scrollToBottom(smooth = true) { nextTick(() => { if (messages.value.length > 0) { scrollWithAnimation.value = smooth; scrollToId.value = `msg-${messages.value[messages.value.length - 1].id}` } }) }
async function sendTextMessage() { if (!inputText.value.trim() || !roomId.value) return; const content = inputText.value.trim(); inputText.value = ''; const message: ChatMessage = { id: Date.now(), room_id: roomId.value, sender_user_id: currentUser.value!.id, receiver_user_id: targetId.value || '', message_type: 0, content, duration: 0, extra: {}, created_at: new Date().toISOString(), isSelf: true }; messages.value.push(message); chatStore.addMessage(roomId.value, message); conversationStore.handleMessageUpdate(message, true, true); scrollToBottom(); try { await messageApi.sendMessage({ sender_client_id: wsManager.getClientId() || '', receiver_user_id: targetId.value || '', room_id: roomId.value, message_type: 0, content, extra: JSON.stringify({}) }) } catch { const index = messages.value.findIndex((m) => m.id === message.id); if (index > -1) { messages.value.splice(index, 1) } toast.error('发送失败'); inputText.value = content } }
function chooseImage() { showMore.value = false; uni.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album'], success: async (res) => { const filePath = res.tempFilePaths[0]; const fileInfo = await getFileInfo(filePath); pendingFile.value = { path: filePath, name: fileInfo.name || '图片', size: fileInfo.size, type: 'image', messageType: 1 }; showFileConfirm.value = true } }) }
function shootCamera() { showMore.value = false; uni.chooseImage({ count: 1, sourceType: ['camera'], success: async (res) => { const filePath = res.tempFilePaths[0]; const fileInfo = await getFileInfo(filePath); pendingFile.value = { path: filePath, name: '拍摄图片', size: fileInfo.size, type: 'image', messageType: 1 }; showFileConfirm.value = true } }) }
function chooseFile() { showMore.value = false; /* #ifdef MP-WEIXIN */ wx.chooseMessageFile({ count: 1, type: 'file', success: async (res: any) => { const file = res.tempFiles[0]; pendingFile.value = { path: file.path, name: file.name || '文件', size: file.size || 0, type: 'file', messageType: 8 }; showFileConfirm.value = true } }); /* #endif */ /* #ifdef APP-PLUS */ uni.chooseFile({ count: 1, success: async (res: any) => { const filePath = res.tempFilePaths[0]; const fileInfo = await getFileInfo(filePath); pendingFile.value = { path: filePath, name: fileInfo.name, size: fileInfo.size, type: 'file', messageType: 8 }; showFileConfirm.value = true } }); /* #endif */ /* #ifdef H5 */ const input = document.createElement('input'); input.type = 'file'; input.accept = '*/*'; input.onchange = async (e: Event) => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) { const blobUrl = URL.createObjectURL(file); pendingFile.value = { path: blobUrl, name: file.name, size: file.size, type: 'file', messageType: 8 }; showFileConfirm.value = true } }; input.click(); /* #endif */ }
async function uploadAndSend(filePath: string, messageType: number, fileName?: string) { toast.loading('上传中...'); try { const uploadType = messageType === 1 ? 'image' : messageType === 3 ? 'video' : 'file'; const attachment = await attachmentApi.uploadAttachment(filePath, uploadType); toast.close(); const fileInfo = await getFileInfo(filePath); const extra: Record<string, any> = { url: attachment.file_url, name: fileName || attachment.file_name || fileInfo.name, size: attachment.file_size || fileInfo.size, attachment_id: attachment.id }; if (attachment.width) extra.width = attachment.width; if (attachment.height) extra.height = attachment.height; if (attachment.duration) extra.duration = attachment.duration; const message: ChatMessage = { id: Date.now(), room_id: roomId.value, sender_user_id: currentUser.value!.id, receiver_user_id: targetId.value || '', message_type: messageType, content: attachment.file_url, duration: attachment.duration || 0, extra, created_at: new Date().toISOString(), isSelf: true }; messages.value.push(message); chatStore.addMessage(roomId.value, message); conversationStore.handleMessageUpdate(message, true, true); scrollToBottom(true); await messageApi.sendMessage({ sender_client_id: wsManager.getClientId() || '', receiver_user_id: targetId.value || '', room_id: roomId.value, message_type: messageType, content: attachment.file_url, duration: attachment.duration || 0, extra: JSON.stringify(extra) }); toast.success('发送成功') } catch (error: any) { toast.close(); toast.error(error.message || '发送失败') } }
function getFileInfo(filePath: string): Promise<{ name: string; size: number }> { return new Promise((resolve) => { const pathParts = filePath.split('/'); const name = pathParts[pathParts.length - 1] || '未知文件'; /* #ifdef H5 */ resolve({ name, size: 0 }); /* #endif */ /* #ifndef H5 */ uni.getFileInfo({ filePath, success: (res) => { resolve({ name, size: res.size || 0 }) }, fail: () => { resolve({ name, size: 0 }) } }); /* #endif */ }) }
let audioContext: UniApp.InnerAudioContext | null = null; function playAudio(msg: ChatMessage) { const audioUrl = getMediaUrl(msg); if (!audioUrl) { toast.error('无法获取音频地址'); return } if (playingAudioId.value === msg.id) { stopAudio(); return } stopAudio(); audioContext = uni.createInnerAudioContext(); audioContext.src = audioUrl; audioContext.autoplay = true; playingAudioId.value = msg.id; audioContext.onEnded(() => { playingAudioId.value = null }); audioContext.onError((err) => { console.error('Audio play error:', err); toast.error('播放失败'); playingAudioId.value = null }) }
function stopAudio() { if (audioContext) { audioContext.stop(); audioContext.destroy(); audioContext = null } playingAudioId.value = null }
function openFile(msg: ChatMessage) { const fileUrl = getMediaUrl(msg); const fileName = getFileName(msg); if (!fileUrl) { toast.error('无法获取文件地址'); return } /* #ifdef H5 */ window.open(fileUrl, '_blank'); return; /* #endif */ /* #ifndef H5 */ toast.loading('正在打开文件...'); uni.downloadFile({ url: fileUrl, success: (res) => { toast.close(); if (res.statusCode === 200) { uni.openDocument({ filePath: res.tempFilePath, showMenu: true, success: () => {}, fail: (err) => { console.error('Open document failed:', err); toast.error('无法打开此类型文件') } }) } else { toast.error('下载文件失败') } }, fail: (err) => { toast.close(); console.error('Download file failed:', err); toast.error('下载文件失败') } }); /* #endif */ }
function chooseVideo() { showMore.value = false; uni.chooseVideo({ sourceType: ['album', 'camera'], maxDuration: 60, success: async (res) => { const fileInfo = await getFileInfo(res.tempFilePath); pendingFile.value = { path: res.tempFilePath, name: res.name || fileInfo.name || '视频', size: res.size || fileInfo.size, type: 'video', messageType: 3 }; showFileConfirm.value = true } }) }
function cancelFileSend() { showFileConfirm.value = false; pendingFile.value = { path: '', name: '', size: 0, type: 'file', messageType: 8 } }
async function confirmFileSend() { uploading.value = true; try { await uploadAndSend(pendingFile.value.path, pendingFile.value.messageType, pendingFile.value.name); showFileConfirm.value = false; pendingFile.value = { path: '', name: '', size: 0, type: 'file', messageType: 8 } } finally { uploading.value = false } }
function goBack() { uni.navigateBack() }
function showChatInfo() { if (roomId.value) { uni.navigateTo({ url: `/pages/group/info?roomId=${roomId.value}` }) } }
function shouldShowTime(msg: ChatMessage, index: number): boolean { if (index === 0) return true; const prevMsg = messages.value[index - 1]; const currentTime = new Date(msg.created_at).getTime(); const prevTime = new Date(prevMsg.created_at).getTime(); return currentTime - prevTime > 5 * 60 * 1000 }
function isSystemMessage(type: number): boolean { return checkSystemMessage(type) }
function getBubbleClass(msg: ChatMessage): string { const classes = []; if (msg.isSelf) classes.push('bubble-self'); else classes.push('bubble-other'); return classes.join(' ') }
function getMediaTypeClass(type: number) { if (type === 1) return 'media-bubble image'; if (type === 2) return 'media-bubble audio'; if (type === 3) return 'media-bubble video'; if (type === 8) return 'media-bubble file'; return '' }
function getMediaUrl(msg: ChatMessage): string { let url = ''; if (typeof msg.extra === 'string') { try { const extra = JSON.parse(msg.extra); url = extra.url || msg.content } catch { url = msg.content } } else { url = msg.extra?.url || msg.content } return resolveImageUrl(url) }
function getFileName(msg: ChatMessage): string { if (typeof msg.extra === 'string') { try { const extra = JSON.parse(msg.extra); return extra.name || '未知文件' } catch { return '未知文件' } } return msg.extra?.name || '未知文件' }
function getFileSize(msg: ChatMessage): number { if (typeof msg.extra === 'string') { try { const extra = JSON.parse(msg.extra); return extra.size || 0 } catch { return 0 } } return msg.extra?.size || 0 }
function getMessageSenderAvatar(msg: ChatMessage): string { return targetUser.value?.avatar || '' }
function getMessageSenderName(msg: ChatMessage): string { return targetUser.value?.name || chatName.value || '未知' }
function onAvatarClick(msg: ChatMessage) { const userId = msg.sender_user_id; if (!userId) return; uni.navigateTo({ url: `/pages/contact/detail?userId=${userId}` }) }
function handleMessageLongPress(msg: ChatMessage) { selectedMessage.value = msg; showMsgActions.value = true }
async function onMsgActionSelect(action: { value: string }) { if (!selectedMessage.value) return; const msg = selectedMessage.value; showMsgActions.value = false; switch (action.value) { case 'copy': copyMessage(msg); break; case 'recall': await recallMessage(msg); break; case 'delete': deleteMessage(msg); break } }
function copyMessage(msg: ChatMessage) { if (msg.message_type !== 0) return; uni.setClipboardData({ data: msg.content || '', success: () => { toast.success('已复制') }, fail: () => { toast.error('复制失败') } }) }
async function recallMessage(msg: ChatMessage) { try { await messageApi.recallMessage(msg.id); const index = messages.value.findIndex(m => m.id === msg.id); if (index > -1) { messages.value[index] = { ...messages.value[index], message_type: 5, content: '你撤回了一条消息' } } toast.success('已撤回') } catch (e: any) { toast.error(e.message || '撤回失败') } }
function deleteMessage(msg: ChatMessage) { const index = messages.value.findIndex(m => m.id === msg.id); if (index > -1) { messages.value.splice(index, 1); chatStore.removeMessage(roomId.value, msg.id); toast.success('已删除') } }
function onInputChange(e: any) { const value = e.detail?.value || inputText.value; if (value.endsWith('@') && isGroupChat.value) { showMentionPicker.value = true } }
function triggerMention() { inputText.value += '@'; showMentionPicker.value = true }
function handleMentionSelect(user: MentionUser) { if (inputText.value.endsWith('@')) { inputText.value = inputText.value.slice(0, -1) + `@${user.name} ` } else { inputText.value += `@${user.name} ` } showMentionPicker.value = false }
</script>

<style lang="scss" scoped>
/* 系统变量 (高级灰体系) */
.chat-page-container {
  --bg-base: #F5F7FA;
  --bg-card: #FFFFFF;
  --text-main: #1D1D1F;
  --text-msg-other: #1D1D1F;
  --text-msg-self: #FFFFFF;
  --bubble-other-bg: #FFFFFF;
  --bubble-self-bg: #4F46E5;
  --bubble-self-gradient: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
  --input-bg: #F7F8FA;
  --primary: #4F46E5;

  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-base);

  &.theme-dark {
    --bg-base: #121212; /* 深邃灰，非纯黑 */
    --bg-card: #1C1C1E; /* 层级灰 */
    --text-main: #F2F2F7;
    --text-msg-other: #F2F2F7;
    --bubble-other-bg: #2C2C2E;
    --input-bg: #2C2C2E;
  }
}

/* 导航栏 */
:deep(.glass-navbar) {
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(20px);
  border-bottom: 0.5px solid rgba(0,0,0,0.05);

  .theme-dark & {
    background: rgba(28, 28, 30, 0.8) !important;
    border-bottom-color: rgba(255,255,255,0.08);
  }
}

.nav-center {
  display: flex;
  align-items: center;
  gap: 8rpx;
  .nav-name { font-weight: 600; font-size: 32rpx; color: var(--text-main); }
  .nav-badge { background: rgba(0,0,0,0.05); padding: 2rpx 10rpx; border-radius: 10rpx; font-size: 20rpx; color: #888; }
}

.nav-actions {
  display: flex;
  gap: 32rpx;
  .icon-btn { opacity: 0.7; transition: opacity 0.2s; &:active { opacity: 1; } }
}

/* 滚动区 */
.chat-scroll-area {
  flex: 1;
  overflow: hidden;
  box-sizing: border-box;
}

.message-feed {
  padding: 24rpx 32rpx;
  padding-top: calc(44px + var(--status-bar-height) + 20rpx);
}

.feed-status {
  text-align: center;
  padding: 20rpx;
  .link-text { color: #4F46E5; font-size: 24rpx; }
  .end-text { color: #999; font-size: 24rpx; }
}

/* 消息项容器 */
.message-item {
  margin-bottom: 40rpx;

  .timestamp {
    display: flex;
    justify-content: center;
    margin-bottom: 30rpx;
    text {
      background: rgba(0,0,0,0.04);
      padding: 6rpx 18rpx;
      border-radius: 20rpx;
      font-size: 22rpx;
      color: #9CA3AF;
      .theme-dark & { background: rgba(255,255,255,0.08); }
    }
  }

  .system-notice {
    text-align: center;
    margin: 20rpx 0;
    text { font-size: 24rpx; color: #9CA3AF; }
  }
}

/* 核心布局：使用 Flex 标准流 */
.bubble-group {
  display: flex;
  align-items: flex-start; /* 顶部对齐 */
  gap: 16rpx;

  /* 自己发的消息：内容靠右对齐 */
  &.is-me {
    justify-content: flex-end;
  }
}

/* 头像容器 */
.avatar-box {
  width: 80rpx;
  height: 80rpx;
  flex-shrink: 0;

  &.left { order: 1; }
  &.right { order: 3; }
}

/* 内容容器 */
.content-box {
  order: 2;
  max-width: 68%;
  display: flex;
  flex-direction: column;

  /* 对方消息：名字靠左 */
  .sender-label {
    font-size: 22rpx;
    color: #9CA3AF;
    margin-bottom: 8rpx;
    margin-left: 12rpx;
  }

  /* 自己消息：气泡靠右 */
  .is-me & {
    align-items: flex-end;
  }
}

/* 气泡样式 */
.bubble-card {
  padding: 20rpx 28rpx;
  border-radius: 36rpx;
  font-size: 30rpx;
  line-height: 1.5;
  position: relative;
  word-break: break-all;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.02);

  /* 他人样式 */
  &.bubble-other {
    background: var(--bubble-other-bg);
    color: var(--text-msg-other);
    border-bottom-left-radius: 8rpx;
  }

  /* 自己样式 */
  &.bubble-self {
    background: var(--bubble-self-gradient);
    color: var(--text-msg-self);
    border-bottom-right-radius: 8rpx;
    box-shadow: 0 4rpx 16rpx rgba(79, 70, 229, 0.25);
  }

  &.media-bubble {
    padding: 0;
    background: transparent !important;
    box-shadow: none !important;
  }
}

/* 语音条 */
.audio-capsule {
  display: flex;
  align-items: center;
  gap: 16rpx;
  min-width: 140rpx;
  padding: 16rpx 24rpx;

  .visualizer {
    display: flex;
    align-items: center;
    gap: 4rpx;
    height: 24rpx;

    .bar {
      width: 4rpx;
      height: 10rpx;
      background: currentColor;
      border-radius: 2rpx;

      &.animating { animation: wave 1s infinite ease-in-out; }
      &:nth-child(2) { animation-delay: 0.1s; }
      &:nth-child(3) { animation-delay: 0.2s; }
    }
  }
}
@keyframes wave { 0%,100%{height:8rpx} 50%{height:24rpx} }

/* 文件卡片 */
.file-card {
  background: var(--bg-card);
  padding: 24rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  min-width: 400rpx;

  .icon-sq {
    width: 80rpx;
    height: 80rpx;
    background: #FFB300;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .file-meta {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .fname { font-size: 28rpx; color: var(--text-main); margin-bottom: 4rpx; }
    .fsize { font-size: 22rpx; color: #9CA3AF; }
  }
}

.bottom-spacer { height: 180rpx; }

/* 悬浮输入栏 */
.input-floater {
  position: fixed;
  bottom: calc(20rpx + env(safe-area-inset-bottom));
  left: 32rpx;
  right: 32rpx;
  z-index: 99;
}

.input-bar-capsule {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(25px);
  border-radius: 48rpx;
  padding: 12rpx;
  display: flex;
  align-items: flex-end;
  box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.06);
  border: 1px solid rgba(255,255,255,0.3);

  .theme-dark & {
    background: rgba(30,30,30,0.85);
    border-color: rgba(255,255,255,0.08);
    box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.3);
  }

  .action-trigger {
    width: 88rpx;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-main);
    flex-shrink: 0;
  }

  .input-field-wrap {
    flex: 1;
    min-height: 88rpx;
    background: var(--input-bg);
    border-radius: 40rpx;
    display: flex;
    align-items: center;
    padding: 10rpx 24rpx;
    margin: 0 8rpx;

    :deep(.wd-textarea) { padding: 0; font-size: 32rpx; width: 100%; color: var(--text-main); line-height: 1.4; }
  }

  .send-btn {
    width: 88rpx;
    height: 88rpx;
    background: var(--primary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow: 0 4rpx 12rpx rgba(79, 70, 229, 0.4);
    animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
}

@keyframes popIn { from{transform:scale(0)} to{transform:scale(1)} }

/* 更多面板Grid */
.tools-grid {
  padding: 40rpx;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30rpx;

  .tool-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16rpx;

    .tool-icon {
      width: 100rpx;
      height: 100rpx;
      border-radius: 32rpx;
      display: flex;
      align-items: center;
      justify-content: center;

      &.album { background: #34C759; }
      &.camera { background: #FF9500; }
      &.video { background: #5856D6; }
      &.call { background: #007AFF; }
      &.file { background: #FFCC00; }
    }

    text { font-size: 24rpx; color: #888; }
  }
}

.confirm-dialog {
  padding: 40rpx;
  .dialog-header { font-size: 32rpx; font-weight: 600; text-align: center; margin-bottom: 30rpx; color: var(--text-main); }
  .file-preview-box {
    background: var(--bg-base);
    padding: 30rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin-bottom: 40rpx;
    .f-info { display: flex; flex-direction: column; overflow: hidden; }
    .f-name { font-size: 28rpx; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .f-size { font-size: 24rpx; color: #999; }
  }
  .dialog-footer { display: flex; gap: 24rpx; }
}
</style>
