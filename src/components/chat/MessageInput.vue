<template>
  <view class="message-input-container" :class="{ 'theme-dark': isDark }">
    <!-- 悬浮输入条 -->
    <view class="input-floater">
      <!-- 1. @提醒选择器 -->
      <mention-picker
          v-if="isGroup"
          :show="showMentionPicker"
          :users="mentionUsers"
          @select="handleMentionSelect"
          @close="showMentionPicker = false"
      />

      <!-- 2. 表情面板 -->
      <emoji-picker
          :show="showEmoji"
          @select="handleEmojiSelect"
          @close="showEmoji = false"
      />

      <!-- 3. 核心输入栏 (Layout: Mic | Input | Smile | Action) -->
      <view class="input-bar-capsule">
        <!-- 左侧: 语音按钮 -->
        <view
            class="icon-btn"
            :class="{ 'recording': isRecording }"
            @touchstart="startRecording"
            @touchmove="onRecordingMove"
            @touchend="stopRecording"
            @touchcancel="cancelRecording"
        >
          <!-- Lucide Icon: Mic -->
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
              v-model="inputValue"
              class="text-input"
              :auto-height="true"
              :maxlength="-1"
              :cursor-spacing="20"
              placeholder="发送消息..."
              placeholder-class="input-placeholder"
              :show-confirm-bar="false"
              :adjust-position="false"
              @focus="$emit('focus')"
              @confirm="onSend"
              @input="onInput"
          />
        </view>

        <!-- 右侧: 表情 & 更多/发送 -->
        <view class="right-actions">
          <!-- 表情按钮 -->
          <view class="icon-btn" @click="toggleEmoji">
            <!-- Lucide Icon: Smile -->
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </view>

          <!-- 发送按钮 (有文字时显示) -->
          <view v-if="inputValue.trim()" class="send-btn" @click="onSend">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </view>

          <!-- 更多按钮 (无文字时显示) -->
          <view v-else class="icon-btn" @click="showMore = true">
            <!-- Lucide Icon: Plus Circle -->
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </view>
        </view>
      </view>
    </view>

    <!-- 4. 更多功能面板 -->
    <wd-popup v-model="showMore" position="bottom" safe-area-inset-bottom :z-index="10000" custom-style="background: var(--bg-card); border-radius: 32rpx 32rpx 0 0;">
      <view class="tools-grid">
        <view class="tool-item" @click="emitAction('send-image')">
          <view class="tool-icon album">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </view>
          <text>相册</text>
        </view>
        <view class="tool-item" @click="emitAction('send-camera')">
          <view class="tool-icon camera">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </view>
          <text>拍摄</text>
        </view>
        <view class="tool-item" @click="emitAction('send-file')">
          <view class="tool-icon file">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
          </view>
          <text>文件</text>
        </view>
      </view>
    </wd-popup>

    <!-- 5. 录音遮罩 (保持业务逻辑) -->
    <view v-if="isRecording" class="recording-overlay">
      <view class="recording-content" :class="{ 'cancel-mode': isCancelRecording }">
        <view class="recording-icon">
          <svg v-if="!isCancelRecording" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" stroke-width="2"/><line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" stroke-width="2"/></svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </view>
        <view class="wave-bars">
          <view class="wave-bar" v-for="i in 5" :key="i" :style="{ animationDelay: `${i * 0.1}s` }"></view>
        </view>
        <text class="recording-duration">{{ formatRecordDuration(recordDuration) }}</text>
        <text class="recording-tip">{{ isCancelRecording ? '松开取消' : '上滑取消发送' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTheme } from '@/composables/useTheme'
import EmojiPicker from '@/components/chat/EmojiPicker.vue'
import MentionPicker from '@/components/chat/MentionPicker.vue'
import type { MentionUser } from '@/components/chat/MentionPicker.vue'
import type { GroupMember } from '@/types/api'

// Props & Emits
const props = withDefaults(defineProps<{
  modelValue?: string
  isGroup?: boolean
  members?: GroupMember[]
}>(), {
  modelValue: '',
  isGroup: false,
  members: () => []
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'send', val: string): void
  (e: 'send-voice', data: { path: string, duration: number }): void
  (e: 'send-image'): void
  (e: 'send-camera'): void
  (e: 'send-file'): void
  (e: 'focus'): void
}>()

const { isDark } = useTheme()
const inputValue = ref(props.modelValue)
const showEmoji = ref(false)
const showMore = ref(false)
const showMentionPicker = ref(false)

// 录音状态
const isRecording = ref(false)
const isCancelRecording = ref(false)
const recordDuration = ref(0)
let recordTimer: any = null
let recorderManager: any = null
let recordStartY = 0

// 提及用户
const mentionUsers = computed<MentionUser[]>(() => {
  return props.members.map(m => ({
    id: m.user_id,
    name: m.nickname || m.user?.name || '未知',
    avatar: m.user?.avatar
  }))
})

// 同步
watch(() => props.modelValue, (val) => inputValue.value = val)
watch(inputValue, (val) => emit('update:modelValue', val))

// 方法
function onInput(e: any) {
  const val = e.detail?.value || inputValue.value
  if (props.isGroup && val.endsWith('@')) {
    showMentionPicker.value = true
  }
}

function onSend() {
  if (!inputValue.value.trim()) return
  emit('send', inputValue.value.trim())
  inputValue.value = ''
  showEmoji.value = false
}

function toggleEmoji() {
  showEmoji.value = !showEmoji.value
  showMore.value = false
}

function handleEmojiSelect(emoji: string) {
  inputValue.value += emoji
}

function handleMentionSelect(user: MentionUser) {
  inputValue.value = inputValue.value.endsWith('@')
      ? inputValue.value + user.name + ' '
      : inputValue.value + '@' + user.name + ' '
  showMentionPicker.value = false
}

function emitAction(action: 'send-image' | 'send-camera' | 'send-file') {
  showMore.value = false
  emit(action)
}

// 录音逻辑 (核心逻辑保持不变，确保事件 emit 正确)
function initRecorder() {
  recorderManager = uni.getRecorderManager()
  recorderManager.onStart(() => { isRecording.value = true; recordDuration.value = 0; recordTimer = setInterval(() => recordDuration.value++, 1000) })
  recorderManager.onStop((res: any) => {
    clearInterval(recordTimer)
    isRecording.value = false
    if (!isCancelRecording.value && res.tempFilePath) {
      emit('send-voice', { path: res.tempFilePath, duration: recordDuration.value })
    }
    isCancelRecording.value = false
  })
}

function startRecording(e: TouchEvent) {
  recordStartY = e.touches[0].clientY
  if (!recorderManager) initRecorder()
  recorderManager.start({ format: 'aac' })
}

function onRecordingMove(e: TouchEvent) {
  if (!isRecording.value) return
  if (recordStartY - e.touches[0].clientY > 80) isCancelRecording.value = true
}

function stopRecording() { recorderManager?.stop() }
function cancelRecording() { isCancelRecording.value = true; stopRecording() }
function formatRecordDuration(s: number) { return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}` }
</script>

<style lang="scss" scoped>
/* =================================================================
   Message Input Styling - Warm Stone Restoration
   基于 聊天页面.html 的设计规范
   ================================================================= */

.message-input-container {
  /* 颜色变量 - 严格对标 HTML */
  --bg-floater: #ffffff;
  --bg-input: #f3f4f6;        /* gray-100 */
  --text-input: #1f2937;      /* gray-800 */
  --text-placeholder: #9ca3af;/* gray-400 */
  --icon-normal: #6b7280;     /* gray-500 */
  --icon-hover: #4f46e5;      /* indigo-600 */
  --border-color: #f3f4f6;    /* gray-100 */

  &.theme-dark {
    --bg-floater: #1c1917;    /* warm-900 */
    --bg-input: #292524;      /* warm-800 */
    --text-input: #e7e5e4;    /* warm-100 */
    --text-placeholder: #78716c;/* warm-500 */
    --icon-normal: #a8a29e;   /* warm-400 */
    --icon-hover: #fb923c;    /* orange-400 */
    --border-color: #292524;  /* warm-800 */
  }
}

/* 底部悬浮条容器 */
.input-floater {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 200;
  background: var(--bg-floater);
  border-top: 2rpx solid var(--border-color);

  /* 间距还原: px-4 py-3 pb-8 */
  padding: 24rpx 32rpx;
  padding-bottom: calc(64rpx + env(safe-area-inset-bottom));

  transition: background-color 0.3s ease, border-color 0.3s ease;
}

/* 胶囊布局: Flex Row + Gap 3 (24rpx)
   修改点：align-items: center 实现垂直居中
*/
.input-bar-capsule {
  display: flex;
  align-items: center; /* 核心修改: 垂直居中对齐 */
  gap: 24rpx;          /* gap-3 */
}

/* 图标按钮: w-7 h-7 (56rpx) */
.icon-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--icon-normal);
  flex-shrink: 0;
  margin-bottom: 0; /* 修改点: 移除底部 margin，因为已经是垂直居中了 */
  transition: color 0.2s, transform 0.1s;

  svg {
    width: 56rpx;
    height: 56rpx;
    stroke-width: 2; /* 确保图标线条清晰 */
  }

  &:active {
    color: var(--icon-hover);
    transform: scale(0.95);
  }

  &.recording {
    color: var(--icon-hover);
    transform: scale(1.1);
  }
}

/* 输入框容器: 核心高度调整
   新设计: min-h-[36px] (72rpx) -> 精致
*/
.input-field-wrap {
  flex: 1;
  min-height: 72rpx;
  background: var(--bg-input);
  border-radius: 36rpx; /* 圆角对应高度的一半 */
  padding: 16rpx 28rpx;
  display: flex;
  align-items: center;
  transition: background-color 0.3s;

  .text-input {
    width: 100%;
    max-height: 200rpx;
    min-height: 40rpx;
    font-size: 30rpx; /* text-sm approx */
    line-height: 1.4;
    color: var(--text-input);
    background: transparent;
  }

  .input-placeholder {
    color: var(--text-placeholder);
  }
}

/* 右侧操作区 */
.right-actions {
  display: flex;
  align-items: center;
  gap: 24rpx; /* gap-3 between smile and plus */
  margin-bottom: 0; /* 修改点: 移除底部 margin */
}

/* 发送按钮 - 视觉焦点 */
.send-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  /* 渐变色还原: Indigo / Orange */
  background: linear-gradient(135deg, #6366F1, #4F46E5);
  .theme-dark & { background: linear-gradient(135deg, #fb923c, #ea580c); }

  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0; /* 修改点: 移除底部 margin */
  box-shadow: 0 4rpx 12rpx rgba(79, 70, 229, 0.3);

  svg {
    width: 36rpx;
    height: 36rpx;
  }

  &:active {
    transform: scale(0.95);
  }
}

/* 录音浮层 (复用) */
.recording-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 999;
  display: flex; align-items: center; justify-content: center;
  .recording-content {
    background: var(--bg-floater); padding: 64rpx; border-radius: 48rpx;
    display: flex; flex-direction: column; align-items: center;
    &.cancel-mode { .recording-icon { background: #ef4444; } }
  }
  .recording-icon { width: 128rpx; height: 128rpx; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; margin-bottom: 32rpx; svg { width: 64rpx; height: 64rpx; } }
  .wave-bars { display: flex; gap: 8rpx; height: 48rpx; margin-bottom: 24rpx; .wave-bar { width: 8rpx; height: 16rpx; background: #10b981; border-radius: 8rpx; animation: wave 1s infinite; } }
  .recording-duration { font-size: 36rpx; font-weight: 700; color: var(--text-input); margin-bottom: 16rpx; }
  .recording-tip { font-size: 24rpx; color: var(--icon-normal); }
}
@keyframes wave { 0%, 100% { height: 16rpx; } 50% { height: 48rpx; } }

/* 更多面板 Grid (复用) */
.tools-grid {
  padding: 48rpx 32rpx; display: grid; grid-template-columns: repeat(4, 1fr); gap: 32rpx;
  .tool-item {
    display: flex; flex-direction: column; align-items: center; gap: 16rpx;
    .tool-icon {
      width: 112rpx; height: 112rpx; border-radius: 32rpx; display: flex; align-items: center; justify-content: center;
      &.album { background: #10b981; } &.camera { background: #f97316; } &.file { background: #eab308; }
      svg { width: 56rpx; height: 56rpx; }
    }
    text { font-size: 24rpx; color: var(--icon-normal); }
  }
}
</style>
