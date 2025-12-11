<template>
  <view class="message-input" :class="{ 'theme-dark': isDark }">
    <!-- @ 提及弹窗 (保持原有功能不变) -->
    <wd-popup v-model="showMentionPicker" position="bottom" safe-area-inset-bottom>
      <view class="mention-picker">
        <view class="mention-header">
          <text class="title">选择要 @ 的成员</text>
          <view class="close-btn" @click="showMentionPicker = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </view>
        </view>
        <scroll-view scroll-y class="mention-list">
          <view
            v-for="member in members"
            :key="member.user_id"
            class="mention-item"
            @click="selectMention(member)"
          >
            <app-avatar
              :src="member.user?.avatar"
              :name="member.nickname || member.user?.name"
              :size="72"
              radius="8rpx"
            />
            <text class="mention-name">{{ member.nickname || member.user?.name || '未知' }}</text>
          </view>
        </scroll-view>
      </view>
    </wd-popup>

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

    <!-- 底部输入栏 (按设计稿布局) -->
    <view class="input-bar">
      <!-- 左侧: 语音按钮 -->
      <view
        class="voice-btn"
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
      <view class="input-wrap">
        <textarea
          v-model="inputValue"
          class="text-input"
          :auto-height="true"
          :maxlength="-1"
          placeholder="发送消息..."
          placeholder-class="input-placeholder"
          :adjust-position="true"
          @input="onInput"
          @confirm="onSend"
        />
      </view>

      <!-- 右侧: 表情 + 加号/发送 -->
      <view class="right-actions">
        <view class="action-btn" @click="$emit('emoji')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </view>

        <!-- 有文字时显示发送按钮，否则显示加号 -->
        <view v-if="inputValue.trim()" class="send-btn" @click="onSend">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </view>
        <view v-else class="action-btn" @click="$emit('more')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTheme } from '@/composables/useTheme'
import AppAvatar from '@/components/common/AppAvatar.vue'
import type { GroupMember } from '@/types/api'

interface Props {
  modelValue?: string
  isGroup?: boolean
  members?: GroupMember[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  isGroup: false,
  members: () => []
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'send', value: string): void
  (e: 'sendVoice', data: { path: string; duration: number }): void
  (e: 'emoji'): void
  (e: 'image'): void
  (e: 'file'): void
  (e: 'more'): void
  (e: 'mention', member: GroupMember): void
}>()

const { isDark } = useTheme()

// 文本输入相关
const inputValue = ref(props.modelValue)
const showMentionPicker = ref(false)

// 语音录制相关
const isRecording = ref(false)
const isCancelRecording = ref(false)
const recordDuration = ref(0)
let recordTimer: ReturnType<typeof setInterval> | null = null
let recorderManager: UniApp.RecorderManager | null = null
let startY = 0
let voicePath = ''

watch(() => props.modelValue, (val) => {
  inputValue.value = val
})

watch(inputValue, (val) => {
  emit('update:modelValue', val)
})

// ========== 文本输入处理 (保持原有逻辑) ==========
function onInput(e: any) {
  const value = e.detail?.value || e.value || inputValue.value
  // 检测 @ 符号
  if (props.isGroup && value.endsWith('@')) {
    showMentionPicker.value = true
  }
}

function openMentionPicker() {
  showMentionPicker.value = true
}

function selectMention(member: GroupMember) {
  const name = member.nickname || member.user?.name || ''
  if (inputValue.value.endsWith('@')) {
    inputValue.value = inputValue.value + name + ' '
  } else {
    inputValue.value = inputValue.value + '@' + name + ' '
  }
  showMentionPicker.value = false
  emit('mention', member)
}

function onSend() {
  if (!inputValue.value.trim()) return
  emit('send', inputValue.value.trim())
  inputValue.value = ''
}

// ========== 语音录制处理 ==========
function initRecorderManager() {
  if (recorderManager) return recorderManager
  
  recorderManager = uni.getRecorderManager()
  
  recorderManager.onStart(() => {
    console.log('录音开始')
    isRecording.value = true
    recordDuration.value = 0
    recordTimer = setInterval(() => {
      recordDuration.value++
      // 最长60秒
      if (recordDuration.value >= 60) {
        stopRecording()
      }
    }, 1000)
  })
  
  recorderManager.onStop((res) => {
    console.log('录音结束', res)
    clearRecordTimer()
    isRecording.value = false
    
    if (!isCancelRecording.value && res.tempFilePath && recordDuration.value >= 1) {
      voicePath = res.tempFilePath
      emit('sendVoice', {
        path: voicePath,
        duration: recordDuration.value
      })
    }
    
    isCancelRecording.value = false
    recordDuration.value = 0
  })
  
  recorderManager.onError((err) => {
    console.error('录音错误', err)
    clearRecordTimer()
    isRecording.value = false
    isCancelRecording.value = false
    uni.showToast({ title: '录音失败', icon: 'none' })
  })
  
  return recorderManager
}

function clearRecordTimer() {
  if (recordTimer) {
    clearInterval(recordTimer)
    recordTimer = null
  }
}

function startRecording(e: TouchEvent) {
  startY = e.touches[0].clientY
  isCancelRecording.value = false
  
  // 初始化录音管理器
  const recorder = initRecorderManager()
  
  // 开始录音
  recorder.start({
    duration: 60000, // 最长60秒
    sampleRate: 16000,
    numberOfChannels: 1,
    encodeBitRate: 48000,
    format: 'mp3'
  })
}

function onRecordingMove(e: TouchEvent) {
  if (!isRecording.value) return
  
  const currentY = e.touches[0].clientY
  const diff = startY - currentY
  
  // 上滑超过80px触发取消
  isCancelRecording.value = diff > 80
}

function stopRecording() {
  if (!isRecording.value) return
  
  if (recorderManager) {
    recorderManager.stop()
  }
}

function cancelRecording() {
  isCancelRecording.value = true
  stopRecording()
}

function formatRecordDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// 暴露方法供父组件使用
defineExpose({
  openMentionPicker
})
</script>

<style lang="scss" scoped>
.message-input {
  --input-bg: #f1f1f1;
  --input-text: #1f2937;
  --placeholder-color: #9ca3af;
  --icon-color: #6b7280;
  --icon-hover: #4F46E5;
  --send-bg: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
  --border-color: rgba(0, 0, 0, 0.05);
  --bg-content: #ffffff;
  
  position: relative;
  background: var(--bg-content);
  border-top: 1rpx solid var(--border-color);
  
  &.theme-dark {
    --input-bg: #292524;
    --input-text: #f5f5f4;
    --placeholder-color: #78716c;
    --icon-color: #a8a29e;
    --icon-hover: #f97316;
    --send-bg: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
    --border-color: #44403c;
    --bg-content: #1c1917;
  }
}

// 底部输入栏
.input-bar {
  display: flex;
  align-items: flex-end;
  gap: 24rpx;
  padding: 24rpx 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
}

// 语音按钮
.voice-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-bottom: 16rpx;
  color: var(--icon-color);
  transition: color 0.15s;
  
  svg {
    width: 56rpx;
    height: 56rpx;
  }
  
  &:active {
    color: var(--icon-hover);
    transform: scale(1.1);
  }
}

// 输入框容器
.input-wrap {
  flex: 1;
  min-height: 88rpx;
  background: var(--input-bg);
  border-radius: 40rpx;
  padding: 20rpx 28rpx;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  
  .theme-dark & {
    border: 1rpx solid var(--border-color);
  }
}

.text-input {
  width: 100%;
  min-height: 48rpx;
  max-height: 200rpx;
  font-size: 30rpx;
  line-height: 1.5;
  color: var(--input-text);
  background: transparent;
}

.input-placeholder {
  color: var(--placeholder-color);
}

// 右侧操作按钮
.right-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.action-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--icon-color);
  transition: all 0.15s;
  
  svg {
    width: 56rpx;
    height: 56rpx;
  }
  
  &:active {
    color: var(--icon-hover);
  }
}

// 发送按钮
.send-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: var(--send-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(79, 70, 229, 0.3);
  transition: all 0.2s;
  animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  
  .theme-dark & {
    box-shadow: 0 4rpx 16rpx rgba(249, 115, 22, 0.3);
  }
  
  svg {
    width: 36rpx;
    height: 36rpx;
  }
  
  &:active {
    transform: scale(0.95);
  }
}

@keyframes popIn {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

// 录音浮层
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
  color: var(--input-text);
  font-family: monospace;
  margin-bottom: 16rpx;
}

.recording-tip {
  font-size: 24rpx;
  color: var(--placeholder-color);
}

// @ 提及选择器 (保持原有样式)
.mention-picker {
  max-height: 60vh;
  background: var(--bg-content);
  
  .mention-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 30rpx;
    border-bottom: 1rpx solid var(--border-color);
    
    .title {
      font-size: 32rpx;
      font-weight: 600;
      color: var(--input-text);
    }
    
    .close-btn {
      width: 48rpx;
      height: 48rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--icon-color);
      
      svg {
        width: 32rpx;
        height: 32rpx;
      }
    }
  }
  
  .mention-list {
    max-height: 50vh;
  }
  
  .mention-item {
    display: flex;
    align-items: center;
    padding: 20rpx 30rpx;
    gap: 20rpx;
    
    &:active {
      background: var(--input-bg);
    }
    
    .mention-name {
      font-size: 30rpx;
      color: var(--input-text);
    }
  }
}
</style>
