<template>
  <wd-config-provider :theme="isDark ? 'dark' : 'light'">
    <view class="chat-page-container" :class="{ 'theme-dark': isDark }">
      <!-- 沉浸式导航栏 -->
      <view class="glass-navbar">
        <view class="navbar-bg"></view>
        <view class="navbar-content">
          <view class="nav-left" @click="goBack">
            <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            <view class="nav-info">
              <text class="nav-name">{{ displayName }}</text>
              <view v-if="isGroupChat" class="member-count">{{ groupMembers.length }}人</view>
              <view v-else class="online-status">在线</view>
            </view>
          </view>

          <view class="nav-actions">
            <view class="icon-btn" @click="startAudioCall">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </view>
            <view class="icon-btn" @click="startVideoCall">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            </view>
            <view class="icon-btn" @click="showChatInfo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
              </svg>
            </view>
          </view>
        </view>
      </view>

      <!-- 消息列表 -->
      <scroll-view
          class="chat-scroll-area custom-scrollbar"
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

            <!-- 普通消息区域 -->
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
                  <view v-else-if="msg.message_type === 1" class="image-bubble">
                    <image
                        :src="getMediaUrl(msg)"
                        mode="widthFix"
                        class="msg-image"
                        @click="previewImage(msg)"
                    />
                  </view>

                  <!-- 语音 -->
                  <view v-else-if="msg.message_type === 2" class="audio-capsule" @click="playAudio(msg)">
                    <view class="play-btn">
                      <svg v-if="playingAudioId !== msg.id" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                      <svg v-else viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                      </svg>
                    </view>
                    <view class="wave-visualizer">
                      <view class="wave-bar" :class="{ animating: playingAudioId === msg.id }"></view>
                      <view class="wave-bar" :class="{ animating: playingAudioId === msg.id }"></view>
                      <view class="wave-bar" :class="{ animating: playingAudioId === msg.id }"></view>
                      <view class="wave-bar" :class="{ animating: playingAudioId === msg.id }"></view>
                    </view>
                    <text class="duration-tag">{{ msg.duration || 0 }}"</text>
                  </view>

                  <!-- 视频 -->
                  <view v-else-if="msg.message_type === 3" class="video-preview">
                    <video :src="getMediaUrl(msg)" class="video-player" object-fit="cover" />
                  </view>

                  <!-- 文件 -->
                  <view v-else-if="msg.message_type === 8" class="file-card" @click="openFile(msg)">
                    <view class="file-icon-box">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
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

      <!-- 录音浮层 -->
      <view v-if="isRecording" class="recording-overlay">
        <view class="recording-content" :class="{ 'cancel-mode': isCancelRecording }">
          <view class="recording-icon">
            <svg v-if="!isCancelRecording" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" stroke-width="2"/>
              <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" stroke-width="2"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </view>
          <view class="wave-bars">
            <view class="wave-bar" v-for="i in 5" :key="i" :style="{ animationDelay: `${i * 0.1}s` }"></view>
          </view>
          <text class="recording-duration">{{ formatRecordDuration(recordDuration) }}</text>
          <text class="recording-tip">{{ isCancelRecording ? '松开取消' : '上滑取消发送' }}</text>
        </view>
      </view>

      <!-- 悬浮输入面板 -->
      <view class="input-floater">
        <mention-picker
            v-if="isGroupChat"
            :show="showMentionPicker"
            :users="mentionUsers"
            @select="handleMentionSelect"
            @close="showMentionPicker = false"
        />

        <!-- 表情选择器 -->
        <emoji-picker
            :show="showEmoji"
            @select="handleEmojiSelect"
            @close="showEmoji = false"
        />

        <view class="input-bar-capsule">
          <!-- 左侧: 语音按钮 -->
          <view
            class="action-trigger voice-btn"
            @touchstart="startRecording"
            @touchmove="onRecordingMove"
            @touchend="stopRecording"
            @touchcancel="cancelRecording"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </view>

          <!-- 中间: 输入框 -->
          <view class="input-field-wrap">
            <textarea
                v-model="inputText"
                class="text-input"
                :auto-height="true"
                :maxlength="-1"
                placeholder="发送消息..."
                placeholder-class="input-placeholder"
                :adjust-position="true"
                @confirm="sendTextMessage"
                @input="onInputChange"
            />
          </view>

          <!-- 右侧: 表情 + 加号/发送 -->
          <view class="right-triggers">
            <view class="action-trigger" @click="showEmoji = !showEmoji">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </view>
            <template v-if="inputText.trim()">
              <view class="send-btn" @click="sendTextMessage">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </view>
            </template>
            <template v-else>
              <view class="action-trigger" @click="showMore = true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </view>
            </template>
          </view>
        </view>
      </view>

      <!-- 更多功能面板 -->
      <wd-popup v-model="showMore" position="bottom" safe-area-inset-bottom :z-index="10000" custom-style="background: var(--bg-card); border-radius: 32rpx 32rpx 0 0;">
        <view class="tools-grid">
          <view class="tool-item" @click="chooseImage">
            <view class="tool-icon album">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </view>
            <text>相册</text>
          </view>
          <view class="tool-item" @click="shootCamera">
            <view class="tool-icon camera">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </view>
            <text>拍摄</text>
          </view>
          <view class="tool-item" @click="onMoreVideoCall">
            <view class="tool-icon video">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            </view>
            <text>视频</text>
          </view>
          <view class="tool-item" @click="onMoreAudioCall">
            <view class="tool-icon call">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/>
              </svg>
            </view>
            <text>语音</text>
          </view>
          <view class="tool-item" @click="chooseFile">
            <view class="tool-icon file">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </view>
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
            <view class="preview-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </view>
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
import MentionPicker from '@/components/chat/MentionPicker.vue'
import EmojiPicker from '@/components/chat/EmojiPicker.vue'
import type { MentionUser } from '@/components/chat/MentionPicker.vue'
import * as roomApi from '@/api/modules/room'
import type { ChatMessage, Attachment, GroupMember } from '@/types/api'

const authStore = useAuthStore()
const chatStore = useChatStore()
const conversationStore = useConversationStore()
const toast = useToast()
const { isDark } = useTheme()

// 使用全局单例 webrtc
const webrtc = useWebRTC()

const roomId = ref(''); const targetId = ref(''); const chatName = ref(''); const targetAvatar = ref('');
const inputText = ref(''); const messages = ref<ChatMessage[]>([]); const scrollToId = ref(''); const scrollTop = ref(0); const scrollWithAnimation = ref(false); const loadingMore = ref(false); const hasMore = ref(true); const showMore = ref(false); const showEmoji = ref(false); const playingAudioId = ref<number | null>(null); const page = ref(1);
// 语音录制相关
const isRecording = ref(false); const isCancelRecording = ref(false); const recordDuration = ref(0); let recordTimer: ReturnType<typeof setInterval> | null = null; let recorderManager: UniApp.RecorderManager | null = null; let recordStartY = 0;
const showFileConfirm = ref(false); const uploading = ref(false); const pendingFile = ref<{ path: string; name: string; size: number; type: 'image' | 'video' | 'file'; messageType: number }>({ path: '', name: '', size: 0, type: 'file', messageType: 8 });
const showMsgActions = ref(false); const selectedMessage = ref<ChatMessage | null>(null);
const showMentionPicker = ref(false); const groupMembers = ref<GroupMember[]>([]); const isGroupChat = ref(false);
const mentionUsers = computed<MentionUser[]>(() => { return groupMembers.value.filter(m => m.user_id !== currentUser.value?.id).map(m => ({ id: m.user_id, name: m.nickname || m.user?.name || '未知', avatar: m.user?.avatar })) });
const currentUser = computed(() => authStore.user);
const msgActionItems = computed(() => { if (!selectedMessage.value) return []; const msg = selectedMessage.value; const items: any[] = []; if (msg.message_type === 0) { items.push({ name: '复制', value: 'copy' }) } if (msg.isSelf) { const sendTime = new Date(msg.created_at).getTime(); const now = Date.now(); if (now - sendTime < 2 * 60 * 1000) { items.push({ name: '撤回', value: 'recall' }) } } items.push({ name: '删除', value: 'delete', color: '#ef4444' }); return items });
const displayName = computed(() => targetUser.value?.name || chatName.value || '聊天');
const targetUser = computed(() => { const contact = chatStore.contacts.find(c => c.contact_user_id === targetId.value); if (contact?.user) { return contact.user } const conv = conversationStore.conversations.find(c => c.target_id === targetId.value || c.room_id === roomId.value); if (conv) { return { id: conv.target_id, name: conv.name || chatName.value, avatar: conv.avatar || targetAvatar.value } } return { id: targetId.value, name: chatName.value, avatar: targetAvatar.value } });

onLoad((options: any) => { roomId.value = options?.roomId || ''; targetId.value = options?.targetId || ''; chatName.value = decodeURIComponent(options?.name || '聊天'); targetAvatar.value = decodeURIComponent(options?.avatar || ''); isGroupChat.value = !targetId.value && !!roomId.value; loadMessages(); setupWebSocket(); if (isGroupChat.value && roomId.value) { loadGroupMembers() } const callType = options?.callType; if (callType && targetId.value) { setTimeout(() => { if (callType === 'audio') { startAudioCall() } else if (callType === 'video') { startVideoCall() } }, 500) } });
onMounted(() => { if (targetId.value) { conversationStore.clearUnread(targetId.value) } setTimeout(() => { scrollToBottom(false) }, 300) });
onUnmounted(() => { wsManager.offMessage(handleNewMessage); stopAudio(); });

async function loadGroupMembers() { if (!roomId.value) return; try { groupMembers.value = await roomApi.getGroupMembers(roomId.value) } catch (e) { console.error('加载群成员失败:', e) } }
async function loadMessages() { if (!roomId.value) return; try { const cached = chatStore.getRoomMessages(roomId.value); if (cached.length > 0) { messages.value = cached.map((m) => ({ ...m, isSelf: m.sender_user_id === currentUser.value?.id, extra: typeof m.extra === 'string' ? JSON.parse(m.extra || '{}') : m.extra })); scrollToBottom(false); return } const res = await messageApi.getMessages(roomId.value, 1, 50); messages.value = (res.data || []).reverse().map((m: ChatMessage) => ({ ...m, isSelf: m.sender_user_id === currentUser.value?.id, extra: typeof m.extra === 'string' ? JSON.parse(m.extra || '{}') : m.extra })); chatStore.setRoomMessages(roomId.value, messages.value); hasMore.value = res.data.length >= 50; scrollToBottom(false) } catch (error) { console.error('加载消息失败:', error) } }
function onScrollToUpper() { if (!loadingMore.value && hasMore.value) { loadMoreMessages() } }
async function loadMoreMessages() { if (loadingMore.value || !hasMore.value) { return } loadingMore.value = true; page.value++; const firstMsgId = messages.value.length > 0 ? messages.value[0].id : null; try { const res = await messageApi.getMessages(roomId.value, page.value, 50); const newMessages = (res.data || []).reverse().map((m: ChatMessage) => ({ ...m, isSelf: m.sender_user_id === currentUser.value?.id, extra: typeof m.extra === 'string' ? JSON.parse(m.extra || '{}') : m.extra })); messages.value = [...newMessages, ...messages.value]; hasMore.value = res.data.length >= 50; if (firstMsgId) { nextTick(() => { scrollWithAnimation.value = false; scrollToId.value = `msg-${firstMsgId}` }) } } catch { page.value-- } finally { loadingMore.value = false } }
function setupWebSocket() { wsManager.onMessage(handleNewMessage) }
function startAudioCall() { if (!targetId.value) { toast.show('无法发起通话'); return } webrtc.startCall('audio', targetId.value, roomId.value, targetUser.value?.name, targetUser.value?.avatar) }
function startVideoCall() { if (!targetId.value) { toast.show('无法发起通话'); return } webrtc.startCall('video', targetId.value, roomId.value, targetUser.value?.name, targetUser.value?.avatar) }
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
function getMessageSenderAvatar(msg: ChatMessage): string {
  // 群聊时从群成员列表获取头像
  if (isGroupChat.value && msg.sender_user_id) {
    const member = groupMembers.value.find(m => m.user_id === msg.sender_user_id)
    if (member?.user?.avatar) return member.user.avatar
  }
  // 单聊时使用对方头像
  return targetUser.value?.avatar || ''
}
function getMessageSenderName(msg: ChatMessage): string {
  // 群聊时从群成员列表获取名称
  if (isGroupChat.value && msg.sender_user_id) {
    const member = groupMembers.value.find(m => m.user_id === msg.sender_user_id)
    if (member) return member.nickname || member.user?.name || '群成员'
  }
  // 单聊时使用对方名称
  return targetUser.value?.name || chatName.value || '未知'
}
function onAvatarClick(msg: ChatMessage) { const userId = msg.sender_user_id; if (!userId) return; uni.navigateTo({ url: `/pages/contact/detail?userId=${userId}` }) }
function handleMessageLongPress(msg: ChatMessage) { selectedMessage.value = msg; showMsgActions.value = true }
async function onMsgActionSelect(action: { value: string }) { if (!selectedMessage.value) return; const msg = selectedMessage.value; showMsgActions.value = false; switch (action.value) { case 'copy': copyMessage(msg); break; case 'recall': await recallMessage(msg); break; case 'delete': deleteMessage(msg); break } }
function copyMessage(msg: ChatMessage) { if (msg.message_type !== 0) return; uni.setClipboardData({ data: msg.content || '', success: () => { toast.success('已复制') }, fail: () => { toast.error('复制失败') } }) }
async function recallMessage(msg: ChatMessage) { try { await messageApi.recallMessage(msg.id); const index = messages.value.findIndex(m => m.id === msg.id); if (index > -1) { messages.value[index] = { ...messages.value[index], message_type: 5, content: '你撤回了一条消息' } } toast.success('已撤回') } catch (e: any) { toast.error(e.message || '撤回失败') } }
function deleteMessage(msg: ChatMessage) { const index = messages.value.findIndex(m => m.id === msg.id); if (index > -1) { messages.value.splice(index, 1); chatStore.removeMessage(roomId.value, msg.id); toast.success('已删除') } }
function onInputChange(e: any) { const value = e.detail?.value || inputText.value; if (value.endsWith('@') && isGroupChat.value) { showMentionPicker.value = true } }
function triggerMention() { inputText.value += '@'; showMentionPicker.value = true }
function handleMentionSelect(user: MentionUser) { if (inputText.value.endsWith('@')) { inputText.value = inputText.value.slice(0, -1) + `@${user.name} ` } else { inputText.value += `@${user.name} ` } showMentionPicker.value = false }
function handleEmojiSelect(emoji: string) { inputText.value += emoji }
function previewImage(msg: ChatMessage) { const url = getMediaUrl(msg); if (url) { uni.previewImage({ urls: [url], current: url }) } }

// ========== 语音录制处理 ==========
function formatRecordDuration(seconds: number): string { const m = Math.floor(seconds / 60).toString().padStart(2, '0'); const s = (seconds % 60).toString().padStart(2, '0'); return `${m}:${s}` }
function initRecorderManager() { if (recorderManager) return recorderManager; recorderManager = uni.getRecorderManager(); recorderManager.onStart(() => { console.log('录音开始'); isRecording.value = true; recordDuration.value = 0; recordTimer = setInterval(() => { recordDuration.value++; if (recordDuration.value >= 60) { stopRecording() } }, 1000) }); recorderManager.onStop((res) => { console.log('录音结束', res); clearRecordTimer(); isRecording.value = false; if (!isCancelRecording.value && res.tempFilePath && recordDuration.value >= 1) { sendVoiceMessage(res.tempFilePath, recordDuration.value) } isCancelRecording.value = false; recordDuration.value = 0 }); recorderManager.onError((err) => { console.error('录音错误', err); clearRecordTimer(); isRecording.value = false; isCancelRecording.value = false; toast.error('录音失败') }); return recorderManager }
function clearRecordTimer() { if (recordTimer) { clearInterval(recordTimer); recordTimer = null } }
function startRecording(e: TouchEvent) { recordStartY = e.touches[0].clientY; isCancelRecording.value = false; const recorder = initRecorderManager(); recorder.start({ duration: 60000, sampleRate: 16000, numberOfChannels: 1, encodeBitRate: 48000, format: 'mp3' }) }
function onRecordingMove(e: TouchEvent) { if (!isRecording.value) return; const currentY = e.touches[0].clientY; const diff = recordStartY - currentY; isCancelRecording.value = diff > 80 }
function stopRecording() { if (!isRecording.value) return; if (recorderManager) { recorderManager.stop() } }
function cancelRecording() { isCancelRecording.value = true; stopRecording() }
async function sendVoiceMessage(filePath: string, duration: number) { toast.loading('发送中...'); try { const attachment = await attachmentApi.uploadAttachment(filePath, 'audio'); toast.close(); const extra: Record<string, any> = { url: attachment.file_url, name: attachment.file_name || 'voice.mp3', size: attachment.file_size || 0, duration: duration, attachment_id: attachment.id }; const message: ChatMessage = { id: Date.now(), room_id: roomId.value, sender_user_id: currentUser.value!.id, receiver_user_id: targetId.value || '', message_type: 2, content: attachment.file_url, duration: duration, extra, created_at: new Date().toISOString(), isSelf: true }; messages.value.push(message); chatStore.addMessage(roomId.value, message); conversationStore.handleMessageUpdate(message, true, true); scrollToBottom(true); await messageApi.sendMessage({ sender_client_id: wsManager.getClientId() || '', receiver_user_id: targetId.value || '', room_id: roomId.value, message_type: 2, content: attachment.file_url, duration: duration, extra: JSON.stringify(extra) }); toast.success('发送成功') } catch (error: any) { toast.close(); toast.error(error.message || '发送失败') } }
</script>

<style lang="scss" scoped>
// ==========================================
// 系统变量 - 浅色模式 (与设计稿一致)
// ==========================================
.chat-page-container {
  --bg-base: #F5F7FA;
  --bg-card: #ffffff;
  --bg-surface: #ffffff;
  --text-main: #1f2937;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;
  --text-msg-other: #1f2937;
  --text-msg-self: #ffffff;
  --bubble-other-bg: #ffffff;
  --bubble-other-border: rgba(0, 0, 0, 0.05);
  --bubble-self-gradient: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
  --bubble-shadow: rgba(79, 70, 229, 0.2);
  --input-bg: #f1f1f1;
  --nav-bg: rgba(255, 255, 255, 0.90);
  --color-primary: #4F46E5;
  --border-subtle: rgba(0, 0, 0, 0.05);

  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-base);

  // ==========================================
  // 深色模式 - Warm Stone (与设计稿一致)
  // ==========================================
  &.theme-dark {
    --bg-base: #121212;
    --bg-card: #292524;
    --bg-surface: #1c1917;
    --text-main: #f5f5f4;
    --text-secondary: #e7e5e4;
    --text-tertiary: #78716c;
    --text-msg-other: #e7e5e4;
    --bubble-other-bg: #262626;
    --bubble-other-border: #44403c;
    --input-bg: #292524;
    --nav-bg: rgba(28, 25, 23, 0.90);
    --color-primary: #f97316;
    --border-subtle: #44403c;
  }
}

// 自定义滚动条
.custom-scrollbar {
  &::-webkit-scrollbar { display: none; }
  -ms-overflow-style: none;
  scrollbar-width: none;
}

// ==========================================
// 沉浸式导航栏 (与设计稿完全一致)
// ==========================================
.glass-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding-top: var(--status-bar-height);

  .navbar-bg {
    position: absolute;
    inset: 0;
    background: var(--nav-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1rpx solid var(--border-subtle);
    transition: all 0.3s;
  }

  .navbar-content {
    position: relative;
    height: 96rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32rpx 12rpx;
  }

  .nav-left {
    display: flex;
    align-items: center;
    gap: 4rpx;
    cursor: pointer;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }

  .back-icon {
    width: 56rpx;
    height: 56rpx;
    color: var(--text-main);
  }

  .nav-info {
    display: flex;
    flex-direction: column;
  }

  .nav-name {
    font-size: 34rpx;
    font-weight: 700;
    color: var(--text-main);
    line-height: 1.3;
  }

  .member-count, .online-status {
    display: flex;
    align-items: center;
    gap: 6rpx;
    font-size: 20rpx;
    color: var(--text-tertiary);
    font-weight: 500;
    margin-top: 2rpx;
  }

  .online-status {
    &::before {
      content: '';
      width: 12rpx;
      height: 12rpx;
      background: #10b981;
      border-radius: 50%;
    }
  }

  .nav-actions {
    display: flex;
    gap: 20rpx;
    padding-right: 8rpx;
  }

  .icon-btn {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    cursor: pointer;

    svg {
      width: 48rpx;
      height: 48rpx;
      color: var(--text-secondary);
      transition: color 0.15s;
    }

    &:hover svg,
    &:active svg {
      color: var(--color-primary);
    }
  }
}

// 滚动区
.chat-scroll-area {
  flex: 1;
  overflow: hidden;
  box-sizing: border-box;
}

.message-feed {
  padding: 24rpx 32rpx;
  padding-top: calc(88rpx + var(--status-bar-height) + 20rpx);
}

.feed-status {
  text-align: center;
  padding: 20rpx;
  .link-text { color: var(--color-primary); font-size: 24rpx; }
  .end-text { color: var(--text-tertiary); font-size: 24rpx; }
}

// 消息项容器 - 与设计稿一致
.message-item {
  margin-bottom: 48rpx;

  .timestamp {
    display: flex;
    justify-content: center;
    margin-bottom: 32rpx;

    text {
      background: rgba(0, 0, 0, 0.04);
      padding: 8rpx 20rpx;
      border-radius: 20rpx;
      font-size: 24rpx;
      color: var(--text-tertiary);

      .theme-dark & { background: rgba(255, 255, 255, 0.08); }
    }
  }

  .system-notice {
    text-align: center;
    margin: 24rpx 0;
    text { font-size: 24rpx; color: var(--text-tertiary); }
  }
}

// 核心布局 - 与设计稿一致
.bubble-group {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;

  &.is-me {
    flex-direction: row-reverse;
  }
}

// 头像容器 - 与设计稿一致（40px=80rpx）
.avatar-box {
  width: 80rpx;
  height: 80rpx;
  flex-shrink: 0;

  :deep(.app-avatar) {
    border-radius: 24rpx;
  }
}

// 内容容器 - 与设计稿一致
.content-box {
  max-width: 75%;
  display: flex;
  flex-direction: column;

  .sender-label {
    font-size: 20rpx;
    color: var(--text-tertiary);
    margin-bottom: 8rpx;
    margin-left: 4rpx;
  }

  .is-me & {
    align-items: flex-end;
  }
}

// ==========================================
// 气泡样式 (与设计稿完全一致)
// ==========================================
.bubble-card {
  padding: 24rpx 28rpx;
  border-radius: 32rpx;
  font-size: 30rpx;
  line-height: 1.5;
  position: relative;
  word-break: break-all;
  max-width: 100%;

  // 对方气泡 - 白色背景
  &.bubble-other {
    background: var(--bubble-other-bg);
    color: var(--text-msg-other);
    border-bottom-left-radius: 8rpx;
    box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);

    .theme-dark & {
      border: 1rpx solid var(--bubble-other-border);
    }
  }

  // 自己气泡 - 渐变背景
  &.bubble-self {
    background: var(--bubble-self-gradient);
    color: var(--text-msg-self);
    border-bottom-right-radius: 8rpx;
    box-shadow: 0 4rpx 16rpx var(--bubble-shadow);
  }

  &.media-bubble {
    padding: 0;
    background: transparent !important;
    box-shadow: none !important;
    border: none !important;

    &.audio {
      padding: 24rpx 28rpx;
      background: var(--bubble-other-bg) !important;
      border-radius: 32rpx;
      box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05) !important;

      .theme-dark & {
        border: 1rpx solid var(--bubble-other-border) !important;
      }

      .is-me & {
        background: var(--bubble-self-gradient) !important;
        border: none !important;
        box-shadow: 0 4rpx 16rpx var(--bubble-shadow) !important;
      }
    }

    &.file {
      background: var(--bg-card) !important;
    }
  }
}

// 图片气泡
.image-bubble {
  .msg-image {
    max-width: 400rpx;
    max-height: 400rpx;
    border-radius: 16rpx;
    display: block;
  }
}

// 语音条
.audio-capsule {
  display: flex;
  align-items: center;
  gap: 16rpx;
  min-width: 180rpx;
  color: var(--text-main);

  .is-me & {
    color: #fff;
  }

  .play-btn {
    width: 44rpx;
    height: 44rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 32rpx;
      height: 32rpx;
    }
  }

  .wave-visualizer {
    display: flex;
    align-items: center;
    gap: 4rpx;
    height: 32rpx;

    .wave-bar {
      width: 4rpx;
      height: 8rpx;
      background: currentColor;
      border-radius: 4rpx;
      transition: height 0.1s;

      &.animating {
        animation: wave 0.8s infinite ease-in-out;

        &:nth-child(1) { animation-delay: 0s; }
        &:nth-child(2) { animation-delay: 0.1s; }
        &:nth-child(3) { animation-delay: 0.2s; }
        &:nth-child(4) { animation-delay: 0.3s; }
      }
    }
  }

  .duration-tag {
    font-size: 24rpx;
    margin-left: 8rpx;
  }
}

@keyframes wave {
  0%, 100% { height: 8rpx; }
  50% { height: 32rpx; }
}

// 文件卡片
.file-card {
  background: var(--bg-card);
  padding: 24rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  min-width: 400rpx;
  border: 1rpx solid var(--border-subtle);

  .file-icon-box {
    width: 80rpx;
    height: 80rpx;
    background: #FFB300;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 44rpx;
      height: 44rpx;
    }
  }

  .file-meta {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .fname {
      font-size: 28rpx;
      color: var(--text-main);
      margin-bottom: 4rpx;
    }

    .fsize {
      font-size: 22rpx;
      color: var(--text-tertiary);
    }
  }
}

// 视频预览
.video-preview {
  .video-player {
    width: 400rpx;
    height: 300rpx;
    border-radius: 16rpx;
  }
}

.bottom-spacer { height: 240rpx; }

// ==========================================
// 底部输入栏 (与设计稿完全一致)
// ==========================================
// ==========================================
// 录音浮层
// ==========================================
.recording-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.recording-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 32rpx;
  min-width: 300rpx;
  
  .theme-dark & {
    background: rgba(41, 37, 36, 0.95);
  }
  
  &.cancel-mode {
    .recording-icon {
      background: #ef4444;
    }
    
    .wave-bars .wave-bar {
      background: #ef4444;
      animation: none;
      height: 8rpx;
    }
  }
}

.recording-icon {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
  transition: background 0.2s;
  
  svg {
    width: 60rpx;
    height: 60rpx;
    color: #fff;
  }
}

.wave-bars {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  height: 64rpx;
  margin-bottom: 24rpx;
}

.wave-bar {
  width: 8rpx;
  height: 16rpx;
  background: #10b981;
  border-radius: 8rpx;
  animation: wave 0.8s infinite ease-in-out;
  
  @for $i from 1 through 5 {
    &:nth-child(#{$i}) {
      animation-delay: #{($i - 1) * 0.1}s;
    }
  }
}

@keyframes wave {
  0%, 100% { height: 16rpx; }
  50% { height: 48rpx; }
}

.recording-duration {
  font-size: 36rpx;
  font-weight: 600;
  color: var(--text-main);
  font-family: monospace;
  margin-bottom: 16rpx;
}

.recording-tip {
  font-size: 24rpx;
  color: var(--text-secondary);
}

.input-floater {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 200;
  background: var(--bg-card);
  border-top: 1rpx solid var(--border-subtle);
  padding: 24rpx 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  transition: background 0.3s;
}

.input-bar-capsule {
  display: flex;
  align-items: flex-end;
  gap: 16rpx;

  .action-trigger {
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    flex-shrink: 0;
    margin-bottom: 16rpx;
    transition: color 0.15s;
    cursor: pointer;

    svg {
      width: 56rpx;
      height: 56rpx;
    }

    &:hover,
    &:active {
      color: var(--color-primary);
    }
  }

  .voice-btn {
    &:active {
      color: var(--color-primary);
      transform: scale(1.1);
    }
  }

  .input-field-wrap {
    flex: 1;
    min-height: 88rpx;
    background: var(--input-bg);
    border-radius: 32rpx;
    display: flex;
    align-items: center;
    padding: 20rpx 28rpx;
    border: 1rpx solid transparent;
    transition: border-color 0.2s;

    .theme-dark & {
      border-color: var(--border-subtle);
    }

    .text-input {
      width: 100%;
      min-height: 40rpx;
      max-height: 200rpx;
      font-size: 28rpx;
      line-height: 1.5;
      color: var(--text-main);
      background: transparent;
    }

    .input-placeholder {
      color: var(--text-tertiary);
    }

    :deep(.wd-input) {
      padding: 0;
      font-size: 28rpx;
      width: 100%;
      color: var(--text-main);
      line-height: 1.5;
    }

    :deep(.wd-textarea) {
      padding: 0;
      font-size: 28rpx;
      width: 100%;
      color: var(--text-main);
      line-height: 1.5;
    }

    :deep(.wd-input__placeholder),
    :deep(.wd-textarea__placeholder) {
      color: var(--text-tertiary);
    }
  }

  .right-triggers {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-bottom: 16rpx;
  }

  .send-btn {
    width: 72rpx;
    height: 72rpx;
    background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow: 0 4rpx 16rpx rgba(79, 70, 229, 0.3);
    animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;

    .theme-dark & {
      background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
      box-shadow: 0 4rpx 16rpx rgba(249, 115, 22, 0.3);
    }

    &:active {
      transform: scale(0.95);
    }

    svg {
      width: 36rpx;
      height: 36rpx;
    }
  }
}

@keyframes popIn {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

// 更多面板Grid
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

      svg {
        width: 48rpx;
        height: 48rpx;
      }

      &.album { background: #10b981; }
      &.camera { background: #f97316; }
      &.video { background: #8b5cf6; }
      &.call { background: #0ea5e9; }
      &.file { background: #eab308; }
    }

    text {
      font-size: 24rpx;
      color: var(--text-secondary);
    }
  }
}

// 确认对话框
.confirm-dialog {
  padding: 40rpx;

  .dialog-header {
    font-size: 32rpx;
    font-weight: 600;
    text-align: center;
    margin-bottom: 30rpx;
    color: var(--text-main);
  }

  .file-preview-box {
    background: var(--bg-base);
    padding: 30rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin-bottom: 40rpx;

    .preview-icon {
      width: 80rpx;
      height: 80rpx;
      display: flex;
      align-items: center;
      justify-content: center;

      svg {
        width: 64rpx;
        height: 64rpx;
      }
    }

    .f-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .f-name {
      font-size: 28rpx;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .f-size {
      font-size: 24rpx;
      color: var(--text-tertiary);
    }
  }

  .dialog-footer {
    display: flex;
    gap: 24rpx;
  }
}

// 文字溢出
.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
