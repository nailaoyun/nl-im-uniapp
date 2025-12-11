<template>
  <wd-config-provider :theme="isDark ? 'dark' : 'light'">
    <view class="chat-page-container" :class="{ 'theme-dark': isDark }">

      <!-- 1. 导航栏 -->
      <view class="glass-navbar">
        <view class="navbar-bg"></view>
        <view class="navbar-content">
          <view class="nav-left" @click="goBack">
            <view class="back-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </view>
            <view class="nav-info">
              <text class="nav-name">{{ displayName }}</text>
              <view class="status-row">
                <view v-if="!isGroupChat" class="status-dot"></view>
                <text class="status-text">{{ isGroupChat ? `${groupMembers.length}人` : '手机在线' }}</text>
              </view>
            </view>
          </view>

          <view class="nav-actions">
            <view class="icon-btn" @click="startAudioCall"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></view>
            <view class="icon-btn" @click="startVideoCall"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg></view>
            <view class="icon-btn" @click="showChatInfo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></view>
          </view>
        </view>
      </view>

      <!-- 2. 消息列表区 -->
      <scroll-view
          class="chat-scroll-area custom-scrollbar"
          scroll-y
          :scroll-into-view="scrollToId"
          :scroll-top="scrollTop"
          :scroll-with-animation="scrollWithAnimation"
          :upper-threshold="100"
          @scrolltoupper="onScrollToUpper"
          @click="onScrollClick"
      >
        <view class="message-feed" id="message-feed-content">
          <view class="feed-status">
            <wd-loading v-if="loadingMore" size="24rpx" color="#9ca3af" />
            <text v-else-if="hasMore" class="link-text" @click="loadMoreMessages">查看历史消息</text>
          </view>

          <!-- 消息渲染 -->
          <view
              v-for="(msg, index) in messages"
              :key="msg.id"
              :id="`msg-${msg.id}`"
              class="message-wrapper"
          >
            <view v-if="shouldShowTime(msg, index)" class="timestamp">
              <text>{{ formatMessageTime(msg.created_at) }}</text>
            </view>

            <view v-if="isSystemMessage(msg.message_type)" class="system-notice">
              <text>{{ msg.content }}</text>
            </view>

            <message-bubble
                v-else
                :msg="msg"
                :is-self="msg.isSelf"
                :sender-name="isGroupChat && !msg.isSelf ? getMessageSenderName(msg) : ''"
                :avatar="msg.isSelf ? currentUser?.avatar : getMessageSenderAvatar(msg)"
                :playing-audio-id="playingAudioId"
                @avatar-click="onAvatarClick"
                @play-audio="playAudio"
                @preview-image="previewImage"
                @play-video="playVideo"
                @open-file="openFile"
                @long-press="handleMessageLongPress"
            />
          </view>

          <!-- 底部占位锚点 (用于强制滚动) -->
          <view id="msg-bottom" class="bottom-spacer" style="height: 1px; width: 100%;"></view>
        </view>
      </scroll-view>

      <!-- 3. 底部输入组件 -->
      <message-input
          v-model="inputText"
          :is-group="isGroupChat"
          :members="groupMembers"
          @send="sendTextMessage"
          @send-voice="handleSendVoice"
          @send-image="chooseImage"
          @send-file="chooseFile"
          @send-camera="shootCamera"
          @focus="scrollToBottom(true)"
      />

      <wd-action-sheet v-model="showMsgActions" :actions="msgActionItems" @select="onMsgActionSelect" cancel-text="取消" />

      <!-- 文件确认弹窗 -->
      <wd-popup v-model="showFileConfirm" position="center" custom-style="border-radius: 32rpx; width: 600rpx; background: var(--bg-card);">
        <view class="confirm-dialog">
          <view class="dialog-header">确认发送</view>
          <view class="file-preview-box">
            <view class="preview-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
            </view>
            <view class="f-info">
              <text class="f-name">{{ pendingFile.name }}</text>
              <text class="f-size">{{ formatSize(pendingFile.size) }}</text>
            </view>
          </view>
          <view class="dialog-footer">
            <wd-button plain size="medium" @click="cancelFileSend" custom-style="flex:1; border:none; background: var(--bg-base); color: var(--text-secondary);">取消</wd-button>
            <wd-button size="medium" @click="confirmFileSend" :loading="uploading" custom-style="flex:1; background: var(--color-primary); border-color: var(--color-primary);">发送</wd-button>
          </view>
        </view>
      </wd-popup>

      <wd-toast />
    </view>
  </wd-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, getCurrentInstance } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useAuthStore, useChatStore, useConversationStore } from '@/stores'
import { wsManager } from '@/api/websocket'
import * as messageApi from '@/api/modules/message'
import * as attachmentApi from '@/api/modules/attachment'
import { formatMessageTime, formatSize } from '@/utils/format'
import { isSystemOrNotifyMessage as checkSystemMessage } from '@/utils/message'
import { resolveImageUrl } from '@/utils/image'
import { useToast } from 'wot-design-uni'
import { useTheme } from '@/composables/useTheme'
import { useWebRTC } from '@/composables/useWebRTC'
import * as roomApi from '@/api/modules/room'
import type { ChatMessage, GroupMember } from '@/types/api'

import MessageBubble from '@/components/chat/MessageBubble.vue'
import MessageInput from '@/components/chat/MessageInput.vue'

const authStore = useAuthStore()
const chatStore = useChatStore()
const conversationStore = useConversationStore()
const toast = useToast()
const { isDark } = useTheme()
const webrtc = useWebRTC()
// 获取当前组件实例，用于 SelectorQuery
const instance = getCurrentInstance()

// 状态定义
const roomId = ref(''); const targetId = ref(''); const chatName = ref(''); const targetAvatar = ref('');
const inputText = ref(''); const messages = ref<ChatMessage[]>([]); const scrollToId = ref('');
const scrollTop = ref(0); // 增加 scrollTop 控制
const scrollWithAnimation = ref(false); const loadingMore = ref(false); const hasMore = ref(true);
const playingAudioId = ref<number | null>(null); const page = ref(1);
const showFileConfirm = ref(false); const uploading = ref(false); const pendingFile = ref<{ path: string; name: string; size: number; type: 'image' | 'video' | 'file'; messageType: number }>({ path: '', name: '', size: 0, type: 'file', messageType: 8 });
const showMsgActions = ref(false); const selectedMessage = ref<ChatMessage | null>(null);
const groupMembers = ref<GroupMember[]>([]); const isGroupChat = ref(false);
const userCache = ref<Map<string, { name: string; avatar: string }>>(new Map());

const currentUser = computed(() => authStore.user);
const msgActionItems = computed(() => { if (!selectedMessage.value) return []; const msg = selectedMessage.value; const items: any[] = []; if (msg.message_type === 0) { items.push({ name: '复制', value: 'copy' }) } if (msg.isSelf) { const sendTime = new Date(msg.created_at).getTime(); const now = Date.now(); if (now - sendTime < 2 * 60 * 1000) { items.push({ name: '撤回', value: 'recall' }) } } items.push({ name: '删除', value: 'delete', color: '#ef4444' }); return items });
const displayName = computed(() => targetUser.value?.name || chatName.value || '聊天');
const targetUser = computed(() => { const contact = chatStore.contacts.find(c => c.contact_user_id === targetId.value); if (contact?.user) { return contact.user } const conv = conversationStore.conversations.find(c => c.target_id === targetId.value || c.room_id === roomId.value); if (conv) { return { id: conv.target_id, name: conv.name || chatName.value, avatar: conv.avatar || targetAvatar.value } } return { id: targetId.value, name: chatName.value, avatar: targetAvatar.value } });

onLoad((options: any) => {
  roomId.value = options?.roomId || '';
  targetId.value = options?.targetId || '';
  chatName.value = decodeURIComponent(options?.name || '聊天');
  targetAvatar.value = decodeURIComponent(options?.avatar || '');
  isGroupChat.value = !targetId.value && !!roomId.value;

  loadMessages();
  setupWebSocket();

  if (isGroupChat.value && roomId.value) { loadGroupMembers() }
});

onUnmounted(() => { wsManager.offMessage(handleNewMessage); stopAudio(); });

// ----------------------------------------------------------------------
// 1. 终极滚动修复：组合 scroll-into-view 和 scrollTop
// ----------------------------------------------------------------------
function scrollToBottom(animated = true) {
  scrollWithAnimation.value = animated

  // 第一招：使用 scroll-into-view 锚点
  // 先清空，确保下次设置能触发变化
  scrollToId.value = ''

  nextTick(() => {
    setTimeout(() => {
      // 尝试1：滚动到最后一条消息
      if (messages.value.length > 0) {
        scrollToId.value = `msg-${messages.value[messages.value.length - 1].id}`
      } else {
        scrollToId.value = 'msg-bottom'
      }

      console.log('🚀 触发滚动 ID:', scrollToId.value)

      // 第二招：双保险，直接设置 scrollTop 到一个巨大值
      // 某些情况下 view 没渲染出来 id 找不到，scrollTop 更可靠
      uni.createSelectorQuery().in(instance).select('.message-feed').boundingClientRect((res) => {
        if (res && res.height) {
          console.log('📏 计算高度滚动:', res.height)
          scrollTop.value = res.height + 1000 // 加个 buffer 确保滚到底
        }
      }).exec()

    }, 150) // 延时稍微加大一点，等待渲染完全
  })
}

// ----------------------------------------------------------------------
// 2. 语音发送逻辑
// ----------------------------------------------------------------------
async function handleSendVoice(data: { path: string; duration: number }) {
  await uploadAndSend(data.path, 2, 'voice.m4a', { duration: data.duration })
}

// 通用上传发送逻辑
async function uploadAndSend(filePath: string, messageType: number, fileName?: string, customExtra: any = {}) {
  toast.loading('发送中...');
  try {
    // 上传
    const uploadType = messageType === 1 ? 'image' : messageType === 3 ? 'video' : 'file';
    const attachment = await attachmentApi.uploadAttachment(filePath, uploadType);
    toast.close();

    // 构建 extra
    const fileInfo = await getFileInfo(filePath);
    const extra: any = {
      url: attachment.file_url,
      name: fileName || attachment.file_name || fileInfo.name,
      size: attachment.file_size || fileInfo.size,
      attachment_id: attachment.id,
      ...customExtra
    };
    if(attachment.width) extra.width = attachment.width;
    if(attachment.height) extra.height = attachment.height;
    if(attachment.duration) extra.duration = attachment.duration;

    // UI 立即上屏
    const message: ChatMessage = {
      id: Date.now(),
      room_id: roomId.value,
      sender_user_id: currentUser.value!.id,
      receiver_user_id: targetId.value || '',
      message_type: messageType,
      content: attachment.file_url,
      duration: extra.duration || 0,
      extra,
      created_at: new Date().toISOString(),
      isSelf: true
    };

    messages.value.push(message);
    chatStore.addMessage(roomId.value, message);
    conversationStore.handleMessageUpdate(message, true, true);

    scrollToBottom(true);

    // API 发送
    await messageApi.sendMessage({
      sender_client_id: wsManager.getClientId() || '',
      receiver_user_id: targetId.value || '',
      room_id: roomId.value,
      message_type: messageType,
      content: attachment.file_url,
      duration: extra.duration || 0,
      extra: JSON.stringify(extra)
    });

    toast.success('发送成功')
  } catch (error: any) {
    toast.close();
    console.error('发送失败:', error);
    toast.error(error.message || '发送失败')
  }
}

// ... (其余业务逻辑) ...

async function loadMessages() {
  if (!roomId.value) return;
  try {
    const cached = chatStore.getRoomMessages(roomId.value);
    if (cached.length > 0) {
      messages.value = mapMessages(cached);
      scrollToBottom(false); // 初始无动画
    }

    const res = await messageApi.getMessages(roomId.value, 1, 50);
    const newMsgs = mapMessages((res.data || []).reverse());

    if (newMsgs.length > cached.length || cached.length === 0) {
      messages.value = newMsgs;
      chatStore.setRoomMessages(roomId.value, messages.value);
      scrollToBottom(false);
    }
    hasMore.value = res.data.length >= 50;
  } catch (error) { console.error('加载消息失败:', error) }
}

function mapMessages(msgs: any[]) {
  return msgs.map((m) => ({
    ...m,
    isSelf: m.sender_user_id === currentUser.value?.id,
    extra: typeof m.extra === 'string' ? JSON.parse(m.extra || '{}') : m.extra
  }));
}

async function sendTextMessage(content: string) {
  if (!content || !roomId.value) return;
  const message: ChatMessage = { id: Date.now(), room_id: roomId.value, sender_user_id: currentUser.value!.id, receiver_user_id: targetId.value || '', message_type: 0, content, duration: 0, extra: {}, created_at: new Date().toISOString(), isSelf: true };
  messages.value.push(message);
  chatStore.addMessage(roomId.value, message);
  conversationStore.handleMessageUpdate(message, true, true);

  scrollToBottom(true); // 发送滚动

  try {
    await messageApi.sendMessage({ sender_client_id: wsManager.getClientId() || '', receiver_user_id: targetId.value || '', room_id: roomId.value, message_type: 0, content, extra: JSON.stringify({}) })
  } catch {
    const index = messages.value.findIndex((m) => m.id === message.id); if (index > -1) { messages.value.splice(index, 1) } toast.error('发送失败'); inputText.value = content
  }
}

function handleNewMessage(msg: ChatMessage) {
  if (msg.message_type === 6) return;
  const parsedExtra = typeof msg.extra === 'string' ? JSON.parse(msg.extra || '{}') : msg.extra;
  const newMsg: ChatMessage = { ...msg, isSelf: msg.sender_user_id === currentUser.value?.id, extra: parsedExtra };
  const isCurrentChat = msg.room_id === roomId.value;

  conversationStore.handleMessageUpdate(newMsg, newMsg.isSelf || false, isCurrentChat);

  if (!isCurrentChat) return;
  const exists = messages.value.some((m) => m.id === newMsg.id);
  if (!exists) {
    messages.value.push(newMsg);
    chatStore.addMessage(roomId.value, newMsg);
    scrollToBottom(true); // 接收滚动
  }
}

// ... (Helper Functions 保持不变) ...
async function loadGroupMembers() { if (!roomId.value) return; try { const members = await roomApi.getGroupMembers(roomId.value); groupMembers.value = members; members.forEach(member => { if (member.user_id) { const userData = { name: member.nickname || member.user?.name || (member as any).name || '', avatar: member.user?.avatar || (member as any).avatar || (member as any).user_avatar || '' }; if (userData.name || userData.avatar) { userCache.value.set(member.user_id, userData) } } }) } catch (e) { console.error('加载群成员失败:', e) } }
async function loadMoreMessages() { if (loadingMore.value || !hasMore.value) { return } loadingMore.value = true; page.value++; const firstMsgId = messages.value.length > 0 ? messages.value[0].id : null; try { const res = await messageApi.getMessages(roomId.value, page.value, 50); const newMessages = mapMessages((res.data || []).reverse()); messages.value = [...newMessages, ...messages.value]; hasMore.value = res.data.length >= 50; if (firstMsgId) { nextTick(() => { scrollWithAnimation.value = false; scrollToId.value = `msg-${firstMsgId}` }) } } catch { page.value-- } finally { loadingMore.value = false } }
function setupWebSocket() { wsManager.onMessage(handleNewMessage) }
function onScrollToUpper() { if (!loadingMore.value && hasMore.value) { loadMoreMessages() } }
function onScrollClick() { /* 点击空白处收起键盘 */ }
function getMessageSenderAvatar(msg: ChatMessage): string { const msgAny = msg as any; const senderId = msg.sender_user_id; if (msgAny.sender?.avatar) return resolveImageUrl(msgAny.sender.avatar); if (msgAny.sender_avatar) return resolveImageUrl(msgAny.sender_avatar); if (msgAny.from_user?.avatar) return resolveImageUrl(msgAny.from_user.avatar); if (isGroupChat.value && senderId) { const cachedUser = userCache.value.get(senderId); if (cachedUser?.avatar) return resolveImageUrl(cachedUser.avatar); const member = groupMembers.value.find(m => m.user_id === senderId); if (member) { const avatar = member.user?.avatar || (member as any).avatar || (member as any).user_avatar; if (avatar) return resolveImageUrl(avatar) } const contact = chatStore.contacts.find(c => c.contact_user_id === senderId); if (contact?.user?.avatar) return resolveImageUrl(contact.user.avatar); return '' } return resolveImageUrl(targetUser.value?.avatar || '') }
function getMessageSenderName(msg: ChatMessage): string { const msgAny = msg as any; const senderId = msg.sender_user_id; if (msgAny.sender?.name) return msgAny.sender.name; if (msgAny.sender_name) return msgAny.sender_name; if (msgAny.from_user?.name) return msgAny.from_user.name; if (isGroupChat.value && senderId) { const cachedUser = userCache.value.get(senderId); if (cachedUser?.name) return cachedUser.name; const member = groupMembers.value.find(m => m.user_id === senderId); if (member) { const name = member.nickname || member.user?.name || (member as any).name || (member as any).user_name; if (name) return name } const contact = chatStore.contacts.find(c => c.contact_user_id === senderId); if (contact?.user?.name) return contact.remark_name || contact.user.name; return `用户${senderId.slice(-4)}` } return targetUser.value?.name || chatName.value || '未知' }
function onAvatarClick(userId?: string) { if (userId) uni.navigateTo({ url: `/pages/contact/detail?userId=${userId}` }) }
function handleMessageLongPress(msg: ChatMessage) { selectedMessage.value = msg; showMsgActions.value = true }
function previewImage(url: string) { if (url) uni.previewImage({ urls: [url], current: url }) }
function playVideo(url: string) { if (url) { /* #ifdef H5 */ window.open(url, '_blank'); /* #endif */ /* #ifndef H5 */ uni.navigateTo({ url: `/pages/common/video-player?url=${encodeURIComponent(url)}` }); /* #endif */ } }
function openFile(url: string) { if (!url) return; /* #ifdef H5 */ window.open(url, '_blank'); /* #endif */ /* #ifndef H5 */ toast.loading('正在打开文件...'); uni.downloadFile({ url: url, success: (res) => { toast.close(); if (res.statusCode === 200) { uni.openDocument({ filePath: res.tempFilePath, showMenu: true }) } }, fail: () => { toast.close(); toast.error('下载失败') } }); /* #endif */ }
let audioContext: UniApp.InnerAudioContext | null = null; function playAudio(msg: ChatMessage) { const audioUrl = typeof msg.extra === 'string' ? JSON.parse(msg.extra).url : msg.extra?.url || msg.content; const url = resolveImageUrl(audioUrl); if (!url) return; if (playingAudioId.value === msg.id) { stopAudio(); return } stopAudio(); audioContext = uni.createInnerAudioContext(); audioContext.src = url; audioContext.autoplay = true; playingAudioId.value = msg.id; audioContext.onEnded(() => { playingAudioId.value = null }); audioContext.onError(() => { playingAudioId.value = null; toast.error('播放失败') }) }
function stopAudio() { if (audioContext) { audioContext.stop(); audioContext.destroy(); audioContext = null } playingAudioId.value = null }
function startAudioCall() { if (!targetId.value) return; webrtc.startCall('audio', targetId.value, roomId.value, targetUser.value?.name, targetUser.value?.avatar) }
function startVideoCall() { if (!targetId.value) return; webrtc.startCall('video', targetId.value, roomId.value, targetUser.value?.name, targetUser.value?.avatar) }
function chooseImage() { uni.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album'], success: handleFileSelect('image', 1) }) }
function shootCamera() { uni.chooseImage({ count: 1, sourceType: ['camera'], success: handleFileSelect('image', 1) }) }
function chooseFile() { /* #ifdef MP-WEIXIN */ wx.chooseMessageFile({ count: 1, type: 'file', success: (res: any) => handleFileSelect('file', 8)({ tempFilePaths: [res.tempFiles[0].path], tempFiles: res.tempFiles }) }); /* #endif */ /* #ifdef APP-PLUS */ uni.chooseFile({ count: 1, success: handleFileSelect('file', 8) }); /* #endif */ /* #ifdef H5 */ const input = document.createElement('input'); input.type = 'file'; input.onchange = (e: any) => { const file = e.target.files[0]; if(file) { pendingFile.value = { path: URL.createObjectURL(file), name: file.name, size: file.size, type: 'file', messageType: 8 }; showFileConfirm.value = true } }; input.click(); /* #endif */ }
const handleFileSelect = (type: 'image'|'video'|'file', msgType: number) => async (res: any) => { const filePath = res.tempFilePaths[0]; const file = res.tempFiles ? res.tempFiles[0] : {}; const fileInfo = await getFileInfo(filePath); pendingFile.value = { path: filePath, name: file.name || fileInfo.name || (type==='image'?'图片':'文件'), size: file.size || fileInfo.size, type: type, messageType: msgType }; showFileConfirm.value = true }
async function confirmFileSend() { uploading.value = true; try { await uploadAndSend(pendingFile.value.path, pendingFile.value.messageType, pendingFile.value.name); showFileConfirm.value = false } finally { uploading.value = false } }
function cancelFileSend() { showFileConfirm.value = false }
function getFileInfo(filePath: string): Promise<{ name: string; size: number }> { return new Promise((resolve) => { const name = filePath.split('/').pop() || 'file'; /* #ifdef H5 */ resolve({ name, size: 0 }); /* #endif */ /* #ifndef H5 */ uni.getFileInfo({ filePath, success: (res) => resolve({ name, size: res.size }), fail: () => resolve({ name, size: 0 }) }); /* #endif */ }) }
async function onMsgActionSelect(action: { value: string }) { if (!selectedMessage.value) return; const msg = selectedMessage.value; showMsgActions.value = false; switch (action.value) { case 'copy': uni.setClipboardData({ data: msg.content }); break; case 'recall': await messageApi.recallMessage(msg.id); msg.message_type = 5; msg.content = '你撤回了一条消息'; break; case 'delete': messages.value = messages.value.filter(m => m.id !== msg.id); chatStore.removeMessage(roomId.value, msg.id); break; } }
function goBack() { uni.navigateBack() }
function showChatInfo() { if (roomId.value) { uni.navigateTo({ url: `/pages/group/info?roomId=${roomId.value}` }) } }
function shouldShowTime(msg: ChatMessage, index: number): boolean { if (index === 0) return true; const prevMsg = messages.value[index - 1]; const currentTime = new Date(msg.created_at).getTime(); const prevTime = new Date(prevMsg.created_at).getTime(); return currentTime - prevTime > 5 * 60 * 1000 }
function isSystemMessage(type: number): boolean { return checkSystemMessage(type) }
function formatRecordDuration(seconds: number): string { const m = Math.floor(seconds / 60).toString().padStart(2, '0'); const s = (seconds % 60).toString().padStart(2, '0'); return `${m}:${s}` }
async function checkRecordPermission(): Promise<boolean> { return new Promise((resolve) => { /* #ifdef APP-PLUS */ const permission = (plus as any).android?.checkPermission('android.permission.RECORD_AUDIO'); if (permission === (plus as any).android?.PERMISSION_GRANTED) { resolve(true) } else { (plus as any).android?.requestPermission('android.permission.RECORD_AUDIO', (status: any) => { resolve(status === (plus as any).android?.PERMISSION_GRANTED) }, () => resolve(false)) } /* #endif */ /* #ifdef MP-WEIXIN */ uni.authorize({ scope: 'scope.record', success: () => resolve(true), fail: () => { uni.showModal({ title: '提示', content: '需要麦克风权限才能录音，请在设置中开启', confirmText: '去设置', success: (res) => { if (res.confirm) { uni.openSetting({}) } } }); resolve(false) } }); /* #endif */ /* #ifdef H5 */ if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) { navigator.mediaDevices.getUserMedia({ audio: true }).then(() => resolve(true)).catch(() => { toast.error('请允许使用麦克风'); resolve(false) }) } else { toast.error('当前浏览器不支持录音'); resolve(false) } /* #endif */ }) }
function initRecorderManager() { if (recorderManager) return recorderManager; /* #ifdef H5 */ toast.error('当前平台不支持录音'); return null; /* #endif */ /* #ifndef H5 */ const manager = uni.getRecorderManager(); if (!manager) { toast.error('录音功能不可用'); return null } manager.onStart(() => { isRecording.value = true; recordDuration.value = 0; recordTimer = setInterval(() => { recordDuration.value++; if (recordDuration.value >= 60) { stopRecording() } }, 1000) }); manager.onStop((res) => { clearRecordTimer(); isRecording.value = false; if (!isCancelRecording.value && res.tempFilePath && recordDuration.value >= 1) { handleSendVoice({ path: res.tempFilePath, duration: recordDuration.value }) } isCancelRecording.value = false; recordDuration.value = 0 }); manager.onError((err) => { clearRecordTimer(); isRecording.value = false; isCancelRecording.value = false; toast.error('录音失败：' + (err.errMsg || '未知错误')) }); recorderManager = manager; return recorderManager; /* #endif */ }
function clearRecordTimer() { if (recordTimer) { clearInterval(recordTimer); recordTimer = null } }
async function startRecording(e: TouchEvent) { recordStartY = e.touches[0].clientY; isCancelRecording.value = false; const hasPermission = await checkRecordPermission(); if (!hasPermission) { toast.error('无录音权限'); return } const recorder = initRecorderManager(); if (!recorder) { return } recorder.start({ duration: 60000, sampleRate: 16000, numberOfChannels: 1, encodeBitRate: 48000, format: 'aac' }) }
function onRecordingMove(e: TouchEvent) { if (!isRecording.value) return; const currentY = e.touches[0].clientY; const diff = recordStartY - currentY; isCancelRecording.value = diff > 80 }
function stopRecording() { if (!isRecording.value) return; if (recorderManager) { recorderManager.stop() } }
function cancelRecording() { isCancelRecording.value = true; stopRecording() }
</script>

<style lang="scss" scoped>
/* 样式保留，注意 message-feed 的 padding-bottom */
.chat-page-container {
  --bg-base: #F5F7FA;
  --bg-card: #ffffff;
  --text-main: #1f2937;
  --text-tertiary: #9ca3af;
  --color-primary: #4F46E5;
  --nav-bg: rgba(255, 255, 255, 0.9);
  --nav-border: transparent;

  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-base);

  &.theme-dark {
    --bg-base: #0c0a09;
    --bg-card: #1c1917;
    --text-main: #e7e5e4;
    --text-tertiary: #78716c;
    --color-primary: #f97316;
    --nav-bg: rgba(28, 25, 23, 0.9);
    --nav-border: rgba(68, 64, 60, 0.5);
  }
}

.custom-scrollbar {
  &::-webkit-scrollbar { display: none; }
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 导航栏 */
.glass-navbar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  padding-top: var(--status-bar-height);
  .navbar-bg {
    position: absolute; inset: 0; background: var(--nav-bg);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border-bottom: 2rpx solid var(--nav-border);
  }
  .navbar-content {
    position: relative; height: 88rpx; display: flex; align-items: center; justify-content: space-between; padding: 0 24rpx;
  }
}
.nav-left {
  display: flex; align-items: center; gap: 16rpx; max-width: 60%;
  .back-btn { width: 64rpx; height: 64rpx; display: flex; align-items: center; justify-content: center; color: var(--text-main); svg { width: 52rpx; height: 52rpx; } }
  .nav-info {
    display: flex; flex-direction: column;
    .nav-name { font-size: 34rpx; font-weight: 700; color: var(--text-main); line-height: 1.2; }
    .status-row {
      display: flex; align-items: center; gap: 8rpx; margin-top: 4rpx;
      .status-dot { width: 12rpx; height: 12rpx; border-radius: 50%; background: #22c55e; }
      .status-text { font-size: 20rpx; color: var(--text-tertiary); font-weight: 500; }
    }
  }
}
.nav-actions {
  display: flex; gap: 32rpx;
  .icon-btn {
    width: 48rpx; height: 48rpx; color: var(--text-tertiary); display: flex; align-items: center; justify-content: center;
    svg { width: 48rpx; height: 48rpx; }
  }
}

/* 消息列表 */
.chat-scroll-area {
  flex: 1;
  background: var(--bg-base);
  transition: background-color 0.5s ease;
}
.message-feed {
  padding: 32rpx;
  padding-top: calc(88rpx + var(--status-bar-height) + 32rpx);
  /* 增加底部 Padding 以防输入框遮挡 */
  padding-bottom: 240rpx;
}
.feed-status { text-align: center; padding: 24rpx; margin-bottom: 24rpx; .link-text { color: var(--color-primary); font-size: 24rpx; } }

.message-wrapper { margin-bottom: 40rpx; }
.timestamp {
  display: flex; justify-content: center; margin-bottom: 32rpx;
  text { background: rgba(0,0,0,0.05); .theme-dark & { background: rgba(255,255,255,0.05); } color: var(--text-tertiary); font-size: 22rpx; padding: 6rpx 16rpx; border-radius: 8rpx; }
}
.system-notice { text-align: center; margin: 24rpx 0; text { font-size: 24rpx; color: var(--text-tertiary); } }

/* 底部占位符 */
.bottom-spacer { height: 20rpx; }

/* 弹窗 */
.confirm-dialog {
  padding: 40rpx;
  .dialog-header { font-size: 32rpx; font-weight: 600; text-align: center; margin-bottom: 32rpx; color: var(--text-main); }
  .file-preview-box {
    background: var(--bg-base); padding: 24rpx; border-radius: 24rpx; display: flex; align-items: center; gap: 24rpx; margin-bottom: 40rpx;
    .preview-icon { width: 80rpx; height: 80rpx; display: flex; align-items: center; justify-content: center; svg { width: 48rpx; height: 48rpx; } }
    .f-info { flex: 1; overflow: hidden; display: flex; flex-direction: column; .f-name { font-size: 28rpx; color: var(--text-main); } .f-size { font-size: 22rpx; color: var(--text-tertiary); } }
  }
  .dialog-footer { display: flex; gap: 24rpx; }
}
</style>
