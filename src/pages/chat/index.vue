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

            <!-- 普通消息区域 - 与设计稿一致: flex gap-3, 自己消息用 flex-row-reverse -->
            <view v-else class="msg-row" :class="{ 'is-self': msg.isSelf }">
              <!-- 头像 - 设计稿: w-10 h-10 rounded-xl shrink-0 -->
              <view class="avatar-wrap" @click="onAvatarClick(msg)">
                <image 
                  v-if="msg.isSelf ? currentUser?.avatar : getMessageSenderAvatar(msg)"
                  :src="msg.isSelf ? resolveImageUrl(currentUser?.avatar || '') : getMessageSenderAvatar(msg)"
                  class="avatar-img"
                  mode="aspectFill"
                />
                <view v-else class="avatar-placeholder">
                  {{ msg.isSelf ? (currentUser?.name?.charAt(0) || '?') : (getMessageSenderName(msg)?.charAt(0) || '?') }}
                </view>
              </view>

              <!-- 内容区 - 设计稿: flex flex-col max-w-[75%] -->
              <view class="content-col" :class="{ 'items-end': msg.isSelf }">
                <!-- 群聊显示昵称 - 设计稿: text-[10px] text-gray-400 mb-1 ml-1 -->
                <text v-if="isGroupChat && !msg.isSelf" class="sender-name">{{ getMessageSenderName(msg) }}</text>

                <view
                    class="bubble"
                    :class="[msg.isSelf ? 'bubble-self' : 'bubble-other', getMediaTypeClass(msg.message_type)]"
                    @longpress="handleMessageLongPress(msg)"
                >
                  <!-- 文本 -->
                  <text v-if="msg.message_type === 0" class="msg-text" selectable>{{ msg.content }}</text>

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
                  <view v-else-if="msg.message_type === 3" class="video-preview" @click="playVideo(msg)">
                    <image 
                      :src="getVideoThumb(msg)" 
                      mode="aspectFill" 
                      class="video-thumb"
                    />
                    <view class="play-overlay">
                      <view class="play-btn-circle">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                      </view>
                    </view>
                    <text v-if="getVideoDuration(msg)" class="video-duration">{{ getVideoDuration(msg) }}</text>
                  </view>

                  <!-- 文件 -->
                  <view v-else-if="msg.message_type === 8" class="file-card" :class="{ 'file-self': msg.isSelf }" @click="openFile(msg)">
                    <view class="file-icon-box" :class="{ 'icon-self': msg.isSelf }">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </view>
                    <view class="file-meta">
                      <text class="fname text-ellipsis">{{ getFileName(msg) }}</text>
                      <text class="fsize">{{ formatSize(getFileSize(msg)) }}</text>
                    </view>
                  </view>

                  <text v-else class="msg-text">[不支持的消息]</text>
                </view>
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
// 用户信息缓存 - 用于群聊中显示成员头像和昵称
const userCache = ref<Map<string, { name: string; avatar: string }>>(new Map());
const mentionUsers = computed<MentionUser[]>(() => { return groupMembers.value.filter(m => m.user_id !== currentUser.value?.id).map(m => ({ id: m.user_id, name: m.nickname || m.user?.name || userCache.value.get(m.user_id)?.name || '未知', avatar: m.user?.avatar || userCache.value.get(m.user_id)?.avatar })) });
const currentUser = computed(() => authStore.user);
const msgActionItems = computed(() => { if (!selectedMessage.value) return []; const msg = selectedMessage.value; const items: any[] = []; if (msg.message_type === 0) { items.push({ name: '复制', value: 'copy' }) } if (msg.isSelf) { const sendTime = new Date(msg.created_at).getTime(); const now = Date.now(); if (now - sendTime < 2 * 60 * 1000) { items.push({ name: '撤回', value: 'recall' }) } } items.push({ name: '删除', value: 'delete', color: '#ef4444' }); return items });
const displayName = computed(() => targetUser.value?.name || chatName.value || '聊天');
const targetUser = computed(() => { const contact = chatStore.contacts.find(c => c.contact_user_id === targetId.value); if (contact?.user) { return contact.user } const conv = conversationStore.conversations.find(c => c.target_id === targetId.value || c.room_id === roomId.value); if (conv) { return { id: conv.target_id, name: conv.name || chatName.value, avatar: conv.avatar || targetAvatar.value } } return { id: targetId.value, name: chatName.value, avatar: targetAvatar.value } });

onLoad((options: any) => { roomId.value = options?.roomId || ''; targetId.value = options?.targetId || ''; chatName.value = decodeURIComponent(options?.name || '聊天'); targetAvatar.value = decodeURIComponent(options?.avatar || ''); isGroupChat.value = !targetId.value && !!roomId.value; loadMessages(); setupWebSocket(); if (isGroupChat.value && roomId.value) { loadGroupMembers() } const callType = options?.callType; if (callType && targetId.value) { setTimeout(() => { if (callType === 'audio') { startAudioCall() } else if (callType === 'video') { startVideoCall() } }, 500) } });
onMounted(() => { if (targetId.value) { conversationStore.clearUnread(targetId.value) } setTimeout(() => { scrollToBottom(false) }, 300) });
onUnmounted(() => { wsManager.offMessage(handleNewMessage); stopAudio(); });

async function loadGroupMembers() { 
  if (!roomId.value) return
  try { 
    const members = await roomApi.getGroupMembers(roomId.value)
    groupMembers.value = members
    
    // 构建用户缓存
    members.forEach(member => {
      if (member.user_id) {
        const userData = {
          name: member.nickname || member.user?.name || (member as any).name || '',
          avatar: member.user?.avatar || (member as any).avatar || (member as any).user_avatar || ''
        }
        // 只有有效数据才缓存
        if (userData.name || userData.avatar) {
          userCache.value.set(member.user_id, userData)
        }
      }
    })
    
    console.log('📋 群成员数据:', members.length, '人，用户缓存:', userCache.value.size, '人')
  } catch (e) { 
    console.error('加载群成员失败:', e) 
  } 
}
async function loadMessages() { if (!roomId.value) return; try { const cached = chatStore.getRoomMessages(roomId.value); if (cached.length > 0) { messages.value = cached.map((m) => ({ ...m, isSelf: m.sender_user_id === currentUser.value?.id, extra: typeof m.extra === 'string' ? JSON.parse(m.extra || '{}') : m.extra })); scrollToBottom(false); return } const res = await messageApi.getMessages(roomId.value, 1, 50); messages.value = (res.data || []).reverse().map((m: ChatMessage) => ({ ...m, isSelf: m.sender_user_id === currentUser.value?.id, extra: typeof m.extra === 'string' ? JSON.parse(m.extra || '{}') : m.extra })); chatStore.setRoomMessages(roomId.value, messages.value); hasMore.value = res.data.length >= 50; scrollToBottom(false) } catch (error) { console.error('加载消息失败:', error) } }
function onScrollToUpper() { if (!loadingMore.value && hasMore.value) { loadMoreMessages() } }
async function loadMoreMessages() { if (loadingMore.value || !hasMore.value) { return } loadingMore.value = true; page.value++; const firstMsgId = messages.value.length > 0 ? messages.value[0].id : null; try { const res = await messageApi.getMessages(roomId.value, page.value, 50); const newMessages = (res.data || []).reverse().map((m: ChatMessage) => ({ ...m, isSelf: m.sender_user_id === currentUser.value?.id, extra: typeof m.extra === 'string' ? JSON.parse(m.extra || '{}') : m.extra })); messages.value = [...newMessages, ...messages.value]; hasMore.value = res.data.length >= 50; if (firstMsgId) { nextTick(() => { scrollWithAnimation.value = false; scrollToId.value = `msg-${firstMsgId}` }) } } catch { page.value-- } finally { loadingMore.value = false } }
function setupWebSocket() { wsManager.onMessage(handleNewMessage) }
function startAudioCall() { if (!targetId.value) { toast.show('无法发起通话'); return } webrtc.startCall('audio', targetId.value, roomId.value, targetUser.value?.name, targetUser.value?.avatar) }
function startVideoCall() { if (!targetId.value) { toast.show('无法发起通话'); return } webrtc.startCall('video', targetId.value, roomId.value, targetUser.value?.name, targetUser.value?.avatar) }
function onMoreAudioCall() { showMore.value = false; startAudioCall() }
function onMoreVideoCall() { showMore.value = false; startVideoCall() }
function handleNewMessage(msg: ChatMessage) { 
  if (msg.message_type === 6) return
  const parsedExtra = typeof msg.extra === 'string' ? JSON.parse(msg.extra || '{}') : msg.extra
  const newMsg: ChatMessage = { ...msg, isSelf: msg.sender_user_id === currentUser.value?.id, extra: parsedExtra }
  const isCurrentChat = msg.room_id === roomId.value
  
  // 尝试从消息中提取发送者信息并缓存
  const msgAny = msg as any
  if (msg.sender_user_id && !userCache.value.has(msg.sender_user_id)) {
    const senderName = msgAny.sender?.name || msgAny.sender_name || msgAny.from_user?.name || ''
    const senderAvatar = msgAny.sender?.avatar || msgAny.sender_avatar || msgAny.from_user?.avatar || ''
    if (senderName || senderAvatar) {
      userCache.value.set(msg.sender_user_id, { name: senderName, avatar: senderAvatar })
    }
  }
  
  conversationStore.handleMessageUpdate(newMsg, newMsg.isSelf || false, isCurrentChat)
  if (!isCurrentChat) return
  
  const exists = messages.value.some( 
    (m) => m.id === newMsg.id || (m.isSelf && m.content === newMsg.content && Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 2000) 
  )
  if (!exists) { 
    messages.value.push(newMsg)
    chatStore.addMessage(roomId.value, newMsg)
    scrollToBottom(true) 
  } 
}
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
  const msgAny = msg as any
  const senderId = msg.sender_user_id
  
  // 1. 尝试从消息本身获取发送者头像
  if (msgAny.sender?.avatar) return resolveImageUrl(msgAny.sender.avatar)
  if (msgAny.sender_avatar) return resolveImageUrl(msgAny.sender_avatar)
  if (msgAny.from_user?.avatar) return resolveImageUrl(msgAny.from_user.avatar)
  
  // 2. 群聊时获取头像
  if (isGroupChat.value && senderId) {
    // 优先从用户缓存获取
    const cachedUser = userCache.value.get(senderId)
    if (cachedUser?.avatar) return resolveImageUrl(cachedUser.avatar)
    
    // 从群成员列表获取
    const member = groupMembers.value.find(m => m.user_id === senderId)
    if (member) {
      const avatar = member.user?.avatar || (member as any).avatar || (member as any).user_avatar
      if (avatar) return resolveImageUrl(avatar)
    }
    
    // 从联系人列表中查找
    const contact = chatStore.contacts.find(c => c.contact_user_id === senderId)
    if (contact?.user?.avatar) return resolveImageUrl(contact.user.avatar)
    
    // 返回空字符串，让 AppAvatar 组件显示首字母头像
    return ''
  }
  
  // 3. 单聊时使用对方头像
  return resolveImageUrl(targetUser.value?.avatar || '')
}

function getMessageSenderName(msg: ChatMessage): string {
  const msgAny = msg as any
  const senderId = msg.sender_user_id
  
  // 1. 尝试从消息本身获取发送者名称
  if (msgAny.sender?.name) return msgAny.sender.name
  if (msgAny.sender_name) return msgAny.sender_name
  if (msgAny.from_user?.name) return msgAny.from_user.name
  
  // 2. 群聊时获取名称
  if (isGroupChat.value && senderId) {
    // 优先从用户缓存获取
    const cachedUser = userCache.value.get(senderId)
    if (cachedUser?.name) return cachedUser.name
    
    // 从群成员列表获取
    const member = groupMembers.value.find(m => m.user_id === senderId)
    if (member) {
      const name = member.nickname || member.user?.name || (member as any).name || (member as any).user_name
      if (name) return name
    }
    
    // 从联系人列表中查找
    const contact = chatStore.contacts.find(c => c.contact_user_id === senderId)
    if (contact?.user?.name) return contact.remark_name || contact.user.name
    
    // 返回用户 ID 的后 4 位作为备用名称
    return `用户${senderId.slice(-4)}`
  }
  
  // 3. 单聊时使用对方名称
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

// 视频相关函数
function getVideoThumb(msg: ChatMessage): string {
  // 尝试从 extra 获取封面图
  const extra = typeof msg.extra === 'string' ? JSON.parse(msg.extra || '{}') : msg.extra
  if (extra?.thumb || extra?.cover || extra?.thumbnail) {
    return resolveImageUrl(extra.thumb || extra.cover || extra.thumbnail)
  }
  // 如果没有封面，返回视频 URL（部分平台可以显示视频首帧）
  return getMediaUrl(msg)
}

function getVideoDuration(msg: ChatMessage): string {
  const extra = typeof msg.extra === 'string' ? JSON.parse(msg.extra || '{}') : msg.extra
  const duration = extra?.duration || msg.duration || 0
  if (!duration) return ''
  const mins = Math.floor(duration / 60)
  const secs = Math.floor(duration % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function playVideo(msg: ChatMessage) {
  const url = getMediaUrl(msg)
  if (!url) {
    toast.error('无法获取视频地址')
    return
  }
  // 使用 uni-app 的视频预览
  /* #ifdef H5 */
  window.open(url, '_blank')
  /* #endif */
  /* #ifndef H5 */
  uni.navigateTo({
    url: `/pages/common/video-player?url=${encodeURIComponent(url)}`
  })
  /* #endif */
}

// ========== 语音录制处理 ==========
function formatRecordDuration(seconds: number): string { const m = Math.floor(seconds / 60).toString().padStart(2, '0'); const s = (seconds % 60).toString().padStart(2, '0'); return `${m}:${s}` }

// 检查录音权限
async function checkRecordPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    /* #ifdef APP-PLUS */
    const permission = (plus as any).android?.checkPermission('android.permission.RECORD_AUDIO')
    if (permission === (plus as any).android?.PERMISSION_GRANTED) {
      resolve(true)
    } else {
      (plus as any).android?.requestPermission('android.permission.RECORD_AUDIO', (status: any) => {
        resolve(status === (plus as any).android?.PERMISSION_GRANTED)
      }, () => resolve(false))
    }
    /* #endif */
    /* #ifdef MP-WEIXIN */
    uni.authorize({
      scope: 'scope.record',
      success: () => resolve(true),
      fail: () => {
        uni.showModal({
          title: '提示',
          content: '需要麦克风权限才能录音，请在设置中开启',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              uni.openSetting({})
            }
          }
        })
        resolve(false)
      }
    })
    /* #endif */
    /* #ifdef H5 */
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => resolve(true))
        .catch(() => {
          toast.error('请允许使用麦克风')
          resolve(false)
        })
    } else {
      toast.error('当前浏览器不支持录音')
      resolve(false)
    }
    /* #endif */
  })
}

function initRecorderManager() { 
  if (recorderManager) return recorderManager
  
  // H5 平台不支持 uni.getRecorderManager
  /* #ifdef H5 */
  toast.error('当前平台不支持录音')
  return null
  /* #endif */
  
  /* #ifndef H5 */
  const manager = uni.getRecorderManager()
  
  if (!manager) {
    toast.error('录音功能不可用')
    return null
  }
  
  manager.onStart(() => { 
    console.log('录音开始')
    isRecording.value = true
    recordDuration.value = 0
    recordTimer = setInterval(() => { 
      recordDuration.value++
      if (recordDuration.value >= 60) { 
        stopRecording() 
      } 
    }, 1000) 
  })
  
  manager.onStop((res) => { 
    console.log('录音结束', res)
    clearRecordTimer()
    isRecording.value = false
    if (!isCancelRecording.value && res.tempFilePath && recordDuration.value >= 1) { 
      sendVoiceMessage(res.tempFilePath, recordDuration.value) 
    } 
    isCancelRecording.value = false
    recordDuration.value = 0 
  })
  
  manager.onError((err) => { 
    console.error('录音错误', err)
    clearRecordTimer()
    isRecording.value = false
    isCancelRecording.value = false
    toast.error('录音失败：' + (err.errMsg || '未知错误'))
  })
  
  recorderManager = manager
  return recorderManager
  /* #endif */
}

function clearRecordTimer() { if (recordTimer) { clearInterval(recordTimer); recordTimer = null } }

async function startRecording(e: TouchEvent) { 
  recordStartY = e.touches[0].clientY
  isCancelRecording.value = false
  
  // 先检查权限
  const hasPermission = await checkRecordPermission()
  if (!hasPermission) {
    toast.error('无录音权限')
    return
  }
  
  const recorder = initRecorderManager()
  if (!recorder) {
    return
  }
  
  recorder.start({ 
    duration: 60000, 
    sampleRate: 16000, 
    numberOfChannels: 1, 
    encodeBitRate: 48000, 
    format: 'aac' // 使用 aac 格式，跨平台兼容性更好
  }) 
}
function onRecordingMove(e: TouchEvent) { if (!isRecording.value) return; const currentY = e.touches[0].clientY; const diff = recordStartY - currentY; isCancelRecording.value = diff > 80 }
function stopRecording() { if (!isRecording.value) return; if (recorderManager) { recorderManager.stop() } }
function cancelRecording() { isCancelRecording.value = true; stopRecording() }
async function sendVoiceMessage(filePath: string, duration: number) { 
  toast.loading('发送中...')
  try { 
    const attachment = await attachmentApi.uploadAttachment(filePath, 'audio')
    toast.close()
    
    const extra: Record<string, any> = { 
      url: attachment.file_url, 
      name: attachment.file_name || 'voice.m4a', // 使用 m4a 扩展名（aac 格式）
      size: attachment.file_size || 0, 
      duration: duration, 
      attachment_id: attachment.id 
    }
    
    const message: ChatMessage = { 
      id: Date.now(), 
      room_id: roomId.value, 
      sender_user_id: currentUser.value!.id, 
      receiver_user_id: targetId.value || '', 
      message_type: 2, 
      content: attachment.file_url, 
      duration: duration, 
      extra, 
      created_at: new Date().toISOString(), 
      isSelf: true 
    }
    
    messages.value.push(message)
    chatStore.addMessage(roomId.value, message)
    conversationStore.handleMessageUpdate(message, true, true)
    scrollToBottom(true)
    
    await messageApi.sendMessage({ 
      sender_client_id: wsManager.getClientId() || '', 
      receiver_user_id: targetId.value || '', 
      room_id: roomId.value, 
      message_type: 2, 
      content: attachment.file_url, 
      duration: duration, 
      extra: JSON.stringify(extra) 
    })
    toast.success('发送成功') 
  } catch (error: any) { 
    toast.close()
    console.error('语音发送失败:', error)
    toast.error(error.message || '发送失败') 
  } 
}
</script>

<style lang="scss" scoped>
// ==========================================
// 与设计稿完全一致的系统变量
// ==========================================
.chat-page-container {
  // 浅色模式颜色
  --bg-base: #F5F7FA; // 设计稿 bg-[#F5F7FA]
  --bg-card: #ffffff;
  --text-main: #1f2937; // gray-800
  --text-secondary: #6b7280; // gray-500
  --text-tertiary: #9ca3af; // gray-400
  --color-primary: #4F46E5; // indigo-600

  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-base);

  // ==========================================
  // 深色模式 - Warm Stone 调色板
  // ==========================================
  &.theme-dark {
    --bg-base: #121212; // 设计稿 dark:bg-[#121212]
    --bg-card: #1c1917; // warm-900
    --text-main: #f5f5f4; // warm-100
    --text-secondary: #a8a29e; // warm-400
    --text-tertiary: #78716c; // warm-500
    --color-primary: #f97316; // orange-500
  }
}

// 自定义滚动条
.custom-scrollbar {
  &::-webkit-scrollbar { display: none; }
  -ms-overflow-style: none;
  scrollbar-width: none;
}

// ==========================================
// 沉浸式导航栏 - 与设计稿完全一致
// 设计稿: px-4 pt-12 pb-3, bg-white/90 dark:bg-warm-900/90
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
    background: rgba(255, 255, 255, 0.9); // 设计稿 bg-white/90
    backdrop-filter: blur(12px); // 设计稿 backdrop-blur-md
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 2rpx solid #f3f4f6; // 设计稿 border-gray-100
    transition: all 0.3s;
    
    .theme-dark & {
      background: rgba(28, 25, 23, 0.9); // 设计稿 dark:bg-warm-900/90
      border-color: #292524; // 设计稿 dark:border-warm-800
    }
  }

  .navbar-content {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 32rpx; // 设计稿 px-4 pb-3
    padding-top: 96rpx; // 设计稿 pt-12 = 48px = 96rpx
  }

  .nav-left {
    display: flex;
    align-items: center;
    gap: 8rpx; // 设计稿 gap-1 = 4px = 8rpx
    cursor: pointer;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }

  .back-icon {
    width: 56rpx; // 设计稿 w-7 = 28px = 56rpx
    height: 56rpx;
    color: #1f2937; // 设计稿 text-gray-800
    
    .theme-dark & {
      color: #f5f5f4; // 设计稿 dark:text-warm-100
    }
  }

  .nav-info {
    display: flex;
    flex-direction: column;
  }

  .nav-name {
    font-size: 34rpx; // 设计稿 text-[17px] = 17px ≈ 34rpx
    font-weight: 700; // 设计稿 font-bold
    color: #111827; // 设计稿 text-gray-900
    line-height: 1.2; // 设计稿 leading-tight
    
    .theme-dark & {
      color: #f5f5f4; // 设计稿 dark:text-warm-100
    }
  }

  .member-count, .online-status {
    display: flex;
    align-items: center;
    gap: 8rpx; // 设计稿 gap-1 = 4px = 8rpx
    font-size: 20rpx; // 设计稿 text-[10px] = 10px = 20rpx
    color: #9ca3af; // 设计稿 text-gray-400
    font-weight: 500; // 设计稿 font-medium
    margin-top: 2rpx;
    
    .theme-dark & {
      color: #a8a29e; // 设计稿 dark:text-warm-400
    }
  }

  .online-status {
    &::before {
      content: '';
      width: 12rpx; // 设计稿 w-1.5 = 6px = 12rpx
      height: 12rpx;
      background: #22c55e; // 设计稿 bg-green-500
      border-radius: 50%;
    }
  }

  .nav-actions {
    display: flex;
    gap: 40rpx; // 设计稿 gap-5 = 20px = 40rpx
    padding-right: 16rpx; // 设计稿 pr-2 = 8px = 16rpx
  }

  .icon-btn {
    width: 48rpx; // 设计稿 w-6 = 24px = 48rpx
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    svg {
      width: 48rpx;
      height: 48rpx;
      color: #4b5563; // 设计稿 text-gray-600
      transition: color 0.2s ease;
      
      .theme-dark & {
        color: #a8a29e; // 设计稿 dark:text-warm-400
      }
    }

    &:hover svg {
      color: #4f46e5; // 设计稿 hover:text-indigo-600
    }
    
    .theme-dark &:hover svg {
      color: #fb923c; // 设计稿 dark:hover:text-orange-400
    }
  }
}

// 滚动区 - 与设计稿一致
// 设计稿: bg-[#F5F7FA] dark:bg-[#121212] px-4 pt-28 pb-24 space-y-6
.chat-scroll-area {
  flex: 1;
  overflow: hidden;
  box-sizing: border-box;
  background: #F5F7FA; // 设计稿 bg-[#F5F7FA]
  
  .theme-dark & {
    background: #121212; // 设计稿 dark:bg-[#121212]
  }
}

.message-feed {
  padding: 32rpx; // 设计稿 px-4 = 16px = 32rpx
  padding-top: calc(224rpx + var(--status-bar-height)); // 设计稿 pt-28 = 112px = 224rpx
  padding-bottom: 192rpx; // 设计稿 pb-24 = 96px = 192rpx
}

.feed-status {
  text-align: center;
  padding: 20rpx;
  .link-text { color: var(--color-primary); font-size: 24rpx; }
  .end-text { color: var(--text-tertiary); font-size: 24rpx; }
}

// 消息项容器 - 与设计稿一致
// 设计稿: space-y-6 = 24px = 48rpx
.message-item {
  margin-bottom: 48rpx; // 设计稿 space-y-6

  .timestamp {
    display: flex;
    justify-content: center;
    margin-bottom: 24rpx;

    text {
      background: #f3f4f6; // 设计稿 bg-gray-100
      padding: 8rpx 16rpx; // 设计稿 px-2 py-1
      border-radius: 8rpx; // 设计稿 rounded
      font-size: 24rpx; // 设计稿 text-xs
      color: #9ca3af; // 设计稿 text-gray-400
      transition: background 0.3s, color 0.3s;

      .theme-dark & { 
        background: rgba(41, 37, 36, 0.5); // 设计稿 bg-warm-800/50
        color: #78716c; // 设计稿 text-warm-600
      }
    }
  }

  .system-notice {
    text-align: center;
    margin: 24rpx 0;
    text { font-size: 24rpx; color: var(--text-tertiary); }
  }
}

// ==========================================
// 消息行布局 - 与设计稿完全一致
// 设计稿: <div class="flex gap-3 msg-row ${alignClass}">
// ==========================================
.msg-row {
  display: flex;
  align-items: flex-start;
  gap: 24rpx; // 设计稿 gap-3 = 12px = 24rpx

  // 自己的消息 - 设计稿使用 flex-row-reverse
  &.is-self {
    flex-direction: row-reverse;
  }
}

// 头像容器 - 设计稿: w-10 h-10 rounded-xl object-cover shrink-0
.avatar-wrap {
  width: 80rpx; // 设计稿 w-10 = 40px = 80rpx
  height: 80rpx;
  flex-shrink: 0;
  border-radius: 24rpx; // 设计稿 rounded-xl = 12px = 24rpx
  overflow: hidden;
  background: #e5e7eb; // 设计稿 bg-gray-200
  
  .theme-dark & {
    background: #292524; // 设计稿 dark:bg-warm-800
  }
  
  .avatar-img {
    width: 100%;
    height: 100%;
    border-radius: 24rpx;
  }
  
  .avatar-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32rpx;
    font-weight: 600;
    color: #fff;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  }
}

// 内容列 - 设计稿: flex flex-col max-w-[75%]
.content-col {
  max-width: 75%;
  display: flex;
  flex-direction: column;

  // 自己消息时内容右对齐 - 设计稿: items-end
  &.items-end {
    align-items: flex-end;
  }
}

// 群聊发送者昵称 - 设计稿: text-[10px] text-gray-400 dark:text-warm-500 mb-1 ml-1
.sender-name {
  font-size: 20rpx; // 设计稿 text-[10px] = 10px = 20rpx
  color: #9ca3af; // 设计稿 text-gray-400
  margin-bottom: 8rpx; // 设计稿 mb-1 = 4px = 8rpx
  margin-left: 8rpx; // 设计稿 ml-1 = 4px = 8rpx
  
  .theme-dark & {
    color: #78716c; // 设计稿 dark:text-warm-500
  }
}

// ==========================================
// 气泡样式 - 与设计稿完全一致
// 设计稿: p-3 rounded-2xl text-[15px] leading-relaxed
// ==========================================
.bubble {
  padding: 24rpx; // 设计稿 p-3 = 12px = 24rpx
  border-radius: 32rpx; // 设计稿 rounded-2xl = 16px = 32rpx
  font-size: 30rpx; // 设计稿 text-[15px] = 15px = 30rpx
  line-height: 1.625; // 设计稿 leading-relaxed
  position: relative;
  word-break: break-all;
  max-width: 100%;
  transition: all 0.2s;

  // 对方气泡 - 设计稿 bubble-other
  // background: white, border-bottom-left-radius: 4px, box-shadow: 0 1px 2px rgba(0,0,0,0.05)
  &.bubble-other {
    background: #ffffff;
    color: #1f2937; // 设计稿 text-gray-800
    border-bottom-left-radius: 8rpx; // 设计稿 4px = 8rpx
    box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05); // 设计稿 shadow-sm

    // 设计稿深色模式: background: #262626, border: 1px solid #44403c
    .theme-dark & {
      background: #262626;
      color: #e7e5e4;
      border: 2rpx solid #44403c;
    }
  }

  // 自己气泡 - 设计稿 bubble-self
  // background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%), border-bottom-right-radius: 4px
  // box-shadow: 0 2px 8px rgba(79, 70, 229, 0.2)
  &.bubble-self {
    background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
    color: #ffffff;
    border-bottom-right-radius: 8rpx; // 设计稿 4px = 8rpx
    box-shadow: 0 4rpx 16rpx rgba(79, 70, 229, 0.2); // 设计稿 0 2px 8px
  }

  // 文本消息
  .msg-text {
    display: block;
  }

  // 媒体类型气泡特殊处理
  &.media-bubble {
    padding: 0;
    background: transparent !important;
    box-shadow: none !important;
    border: none !important;

    &.audio {
      padding: 24rpx;
      background: #ffffff !important;
      border-radius: 32rpx;
      box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05) !important;

      .theme-dark & {
        background: #262626 !important;
        border: 2rpx solid #44403c !important;
      }
    }
    
    // 自己发送的语音
    .is-self &.audio {
      background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%) !important;
      border: none !important;
      box-shadow: 0 4rpx 16rpx rgba(79, 70, 229, 0.2) !important;
    }

    &.file {
      background: transparent !important;
    }
  }
}

// 图片气泡 - 与设计稿一致
// 设计稿: rounded-2xl shadow-sm border border-gray-100 dark:border-warm-700 w-48
.image-bubble {
  .msg-image {
    width: 384rpx; // 设计稿 w-48 = 192px = 384rpx
    max-height: 400rpx;
    border-radius: 32rpx; // 设计稿 rounded-2xl
    display: block;
    background: #e5e7eb; // 设计稿 bg-gray-200
    border: 2rpx solid #f3f4f6; // 设计稿 border-gray-100
    
    .theme-dark & {
      background: #292524; // 设计稿 dark:bg-warm-800
      border-color: #44403c; // 设计稿 dark:border-warm-700
    }
  }
}

// 语音条 - 与设计稿一致
// 设计稿: p-3 rounded-2xl shadow-sm flex items-center gap-3 min-w-[100px]
.audio-capsule {
  display: flex;
  align-items: center;
  gap: 24rpx; // 设计稿 gap-3 = 12px = 24rpx
  min-width: 200rpx; // 设计稿 min-w-[100px] = 200rpx
  color: #6b7280; // 设计稿 text-gray-500
  
  .theme-dark & {
    color: #a8a29e; // 设计稿 dark:text-warm-400
  }

  // 自己发送的语音消息颜色
  .is-self & {
    color: rgba(255, 255, 255, 0.8); // 设计稿 text-white/80
  }

  .play-btn {
    width: 32rpx; // 设计稿 w-4 = 16px = 32rpx
    height: 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(45deg); // 设计稿 rotate-45

    svg {
      width: 32rpx;
      height: 32rpx;
    }
  }

  // 设计稿波形: flex items-end gap-1 h-3
  .wave-visualizer {
    display: flex;
    align-items: flex-end; // 设计稿 items-end
    gap: 8rpx; // 设计稿 gap-1 = 4px = 8rpx
    height: 24rpx; // 设计稿 h-3 = 12px = 24rpx

    // 设计稿波形条: w-1 wave-bar
    .wave-bar {
      width: 8rpx; // 设计稿 w-1 = 4px = 8rpx
      background: currentColor;
      border-radius: 99rpx; // 设计稿 rounded-99
      transition: height 0.1s;

      &:nth-child(1) { height: 8rpx; } // 设计稿 h-1
      &:nth-child(2) { height: 16rpx; } // 设计稿 h-2
      &:nth-child(3) { height: 24rpx; } // 设计稿 h-3
      &:nth-child(4) { height: 16rpx; } // 设计稿 h-2

      &.animating {
        animation: wave 0.8s infinite ease-in-out;

        &:nth-child(1) { animation-delay: 0s; }
        &:nth-child(2) { animation-delay: 0.1s; }
        &:nth-child(3) { animation-delay: 0.2s; }
        &:nth-child(4) { animation-delay: 0.3s; }
      }
    }
  }

  // 设计稿时长: text-sm font-medium ml-auto
  .duration-tag {
    font-size: 28rpx; // 设计稿 text-sm
    font-weight: 500; // 设计稿 font-medium
    margin-left: auto; // 设计稿 ml-auto
  }
}

// 设计稿波形动画
@keyframes wave {
  0%, 100% { height: 8rpx; } // 设计稿 4px
  50% { height: 32rpx; } // 设计稿 16px
}

// 文件卡片 - 与设计稿完全一致
// 设计稿: p-3 rounded-2xl shadow-md flex items-center gap-3 pr-4 min-w-[220px]
.file-card {
  background: #ffffff; // bubble-other 背景
  padding: 24rpx; // 设计稿 p-3 = 12px = 24rpx
  padding-right: 32rpx; // 设计稿 pr-4
  border-radius: 32rpx; // 设计稿 rounded-2xl
  display: flex;
  align-items: center;
  gap: 24rpx; // 设计稿 gap-3
  min-width: 440rpx; // 设计稿 min-w-[220px] = 440rpx
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08); // 设计稿 shadow-md
  transition: background 0.3s;

  .theme-dark & {
    background: #262626;
    border: 2rpx solid #44403c;
  }

  // 对方发送的文件图标 - 设计稿: bg-orange-100 dark:bg-orange-900/30 text-orange-500
  // w-10 h-10 rounded-lg
  .file-icon-box {
    width: 80rpx; // 设计稿 w-10 = 40px = 80rpx
    height: 80rpx;
    background: #ffedd5; // 设计稿 bg-orange-100
    border-radius: 16rpx; // 设计稿 rounded-lg = 8px = 16rpx
    display: flex;
    align-items: center;
    justify-content: center;
    color: #f97316; // 设计稿 text-orange-500
    flex-shrink: 0;

    svg {
      width: 40rpx; // 设计稿 w-5 = 20px = 40rpx
      height: 40rpx;
    }
    
    .theme-dark & {
      background: rgba(154, 52, 18, 0.3); // 设计稿 dark:bg-orange-900/30
    }
  }
  
  // 自己发送的文件 - 设计稿: bg-white/20 text-white
  &.file-self {
    background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
    box-shadow: 0 4rpx 16rpx rgba(79, 70, 229, 0.2);
    border: none;
    
    .theme-dark & {
      border: none;
    }
    
    .file-icon-box.icon-self {
      background: rgba(255, 255, 255, 0.2); // 设计稿 bg-white/20
      color: #fff; // 设计稿 text-white
    }
    
    .file-meta {
      .fname {
        color: #fff; // 设计稿 text-white
      }
      .fsize {
        color: rgba(255, 255, 255, 0.7); // 设计稿 text-white/70
      }
    }
  }

  // 设计稿: flex flex-col overflow-hidden
  .file-meta {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    // 设计稿: text-sm font-medium truncate
    .fname {
      font-size: 28rpx; // 设计稿 text-sm
      font-weight: 500; // 设计稿 font-medium
      color: #111827; // 设计稿 text-gray-900
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      
      .theme-dark & {
        color: #f5f5f4; // 设计稿 dark:text-warm-100
      }
    }

    // 设计稿: text-[10px]
    .fsize {
      font-size: 20rpx; // 设计稿 text-[10px]
      color: #9ca3af; // 设计稿 text-gray-400
      
      .theme-dark & {
        color: #78716c; // 设计稿 dark:text-warm-500
      }
    }
  }
}

// 视频预览
// 视频预览 - 与设计稿一致
.video-preview {
  position: relative;
  width: 384rpx; // 设计稿 w-48 = 192px = 384rpx
  border-radius: 32rpx;
  overflow: hidden;
  background: #000;
  cursor: pointer;
  
  .video-thumb {
    width: 100%;
    height: auto;
    aspect-ratio: 16/9;
    display: block;
    opacity: 0.9;
    transition: opacity 0.2s;
  }
  
  &:hover .video-thumb,
  &:active .video-thumb {
    opacity: 1;
  }
  
  .play-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .play-btn-circle {
    width: 80rpx; // 设计稿 w-10 = 40px = 80rpx
    height: 80rpx;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2rpx solid rgba(255, 255, 255, 0.3);
    
    svg {
      width: 32rpx; // 设计稿 w-4 = 16px = 32rpx
      height: 32rpx;
      color: #fff;
      margin-left: 4rpx; // 视觉居中调整
    }
  }
  
  .video-duration {
    position: absolute;
    bottom: 16rpx;
    right: 16rpx;
    font-size: 20rpx;
    color: #fff;
    font-weight: 500;
    background: rgba(0, 0, 0, 0.5);
    padding: 4rpx 12rpx;
    border-radius: 8rpx;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
  
  // 兼容旧的 video 标签
  .video-player {
    width: 100%;
    height: auto;
    aspect-ratio: 16/9;
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

// 底部输入栏 - 与设计稿完全一致
// 设计稿: bg-white dark:bg-warm-900 px-4 py-3 pb-8 border-t border-gray-100 dark:border-warm-800
.input-floater {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 200;
  background: #ffffff; // 设计稿 bg-white
  border-top: 2rpx solid #f3f4f6; // 设计稿 border-gray-100
  padding: 24rpx 32rpx 64rpx; // 设计稿 px-4 py-3 pb-8
  padding-bottom: calc(64rpx + env(safe-area-inset-bottom));
  transition: all 0.3s;
  
  .theme-dark & {
    background: #1c1917; // 设计稿 dark:bg-warm-900
    border-color: #292524; // 设计稿 dark:border-warm-800
  }
}

// 输入栏胶囊 - 与设计稿完全一致
// 设计稿: flex items-end gap-3
.input-bar-capsule {
  display: flex;
  align-items: flex-end; // 设计稿 items-end
  gap: 24rpx; // 设计稿 gap-3 = 12px = 24rpx

  // 设计稿图标: w-7 h-7 text-gray-500 dark:text-warm-400 mb-2
  .action-trigger {
    width: 56rpx; // 设计稿 w-7 = 28px = 56rpx
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280; // 设计稿 text-gray-500
    flex-shrink: 0;
    margin-bottom: 16rpx; // 设计稿 mb-2 = 8px = 16rpx
    transition: color 0.2s ease;
    cursor: pointer;

    svg {
      width: 56rpx;
      height: 56rpx;
    }
    
    .theme-dark & {
      color: #a8a29e; // 设计稿 dark:text-warm-400
    }

    &:hover {
      color: #4f46e5; // 设计稿 hover:text-indigo-600
    }
    
    .theme-dark &:hover {
      color: #fb923c; // 设计稿 dark:hover:text-orange-400
    }
  }

  .voice-btn {
    &:active {
      color: var(--color-primary);
      transform: scale(1.1);
    }
  }

  // 设计稿输入框: flex-1 bg-gray-100 dark:bg-warm-800 rounded-2xl px-4 py-2.5 min-h-[44px]
  // border border-transparent dark:border-warm-700
  .input-field-wrap {
    flex: 1;
    min-height: 88rpx; // 设计稿 min-h-[44px] = 88rpx
    background: #f3f4f6; // 设计稿 bg-gray-100
    border-radius: 32rpx; // 设计稿 rounded-2xl = 16px = 32rpx
    display: flex;
    align-items: center;
    padding: 20rpx 32rpx; // 设计稿 px-4 py-2.5
    border: 2rpx solid transparent;
    transition: all 0.2s;

    .theme-dark & {
      background: #292524; // 设计稿 dark:bg-warm-800
      border-color: #44403c; // 设计稿 dark:border-warm-700
    }

    // 设计稿: text-sm text-gray-800 dark:text-warm-100 placeholder-gray-400 dark:placeholder-warm-500
    .text-input {
      width: 100%;
      min-height: 40rpx; // 设计稿 h-5 = 20px = 40rpx
      max-height: 200rpx;
      font-size: 28rpx; // 设计稿 text-sm = 14px = 28rpx
      line-height: 1.5;
      color: #1f2937; // 设计稿 text-gray-800
      background: transparent;
      
      .theme-dark & {
        color: #f5f5f4; // 设计稿 dark:text-warm-100
      }
    }

    .input-placeholder {
      color: #9ca3af; // 设计稿 placeholder-gray-400
      
      .theme-dark & {
        color: #78716c; // 设计稿 dark:placeholder-warm-500
      }
    }

    :deep(.wd-input) {
      padding: 0;
      font-size: 28rpx;
      width: 100%;
      color: #1f2937;
      line-height: 1.5;
    }

    :deep(.wd-textarea) {
      padding: 0;
      font-size: 28rpx;
      width: 100%;
      color: #1f2937;
      line-height: 1.5;
    }

    :deep(.wd-input__placeholder),
    :deep(.wd-textarea__placeholder) {
      color: #9ca3af;
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
