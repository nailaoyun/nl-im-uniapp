<template>
  <view v-if="show" class="emoji-picker" :class="{ dark: isDark }">
    <!-- 分类标签 -->
    <view class="emoji-tabs">
      <view
        v-for="(cat, idx) in categories"
        :key="cat.key"
        class="tab-item"
        :class="{ active: activeTab === idx }"
        @click="activeTab = idx"
      >
        <text>{{ cat.icon }}</text>
      </view>
    </view>

    <!-- 表情列表 -->
    <scroll-view scroll-y class="emoji-grid-container">
      <view class="emoji-grid">
        <view
          v-for="emoji in currentEmojis"
          :key="emoji"
          class="emoji-item"
          @click="selectEmoji(emoji)"
        >
          {{ emoji }}
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'select', emoji: string): void
  (e: 'close'): void
}>()

const { isDark } = useTheme()
const activeTab = ref(0)

// 表情分类
const categories = [
  {
    key: 'face',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
      '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
      '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛',
      '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
      '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄',
      '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷',
      '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴',
      '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐'
    ]
  },
  {
    key: 'gesture',
    icon: '👋',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏',
      '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
      '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛',
      '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️',
      '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃'
    ]
  },
  {
    key: 'heart',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
      '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️',
      '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈'
    ]
  },
  {
    key: 'animal',
    icon: '🐶',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
      '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵',
      '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤',
      '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗'
    ]
  },
  {
    key: 'food',
    icon: '🍔',
    emojis: [
      '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓',
      '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝',
      '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥗',
      '🍜', '🍝', '🍲', '🍱', '🍣', '🍤', '🍿', '🧁'
    ]
  },
  {
    key: 'activity',
    icon: '⚽',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
      '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
      '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿',
      '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌'
    ]
  },
  {
    key: 'object',
    icon: '💡',
    emojis: [
      '⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️',
      '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹',
      '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺',
      '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰'
    ]
  },
  {
    key: 'symbol',
    icon: '🔥',
    emojis: [
      '🔥', '💥', '✨', '🌟', '⭐', '🌈', '☀️', '🌤️',
      '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️',
      '❄️', '☃️', '⛄', '🌬️', '💨', '💧', '💦', '☔',
      '🎵', '🎶', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸'
    ]
  }
]

const currentEmojis = computed(() => categories[activeTab.value]?.emojis || [])

function selectEmoji(emoji: string) {
  emit('select', emoji)
}
</script>

<style lang="scss" scoped>
.emoji-picker {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: var(--bg-card, #fff);
  border-radius: 24rpx 24rpx 0 0;
  box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.1);
  z-index: 100;
  animation: slideUp 0.25s ease-out;

  &.dark {
    background: #292524;
    box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.3);
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.emoji-tabs {
  display: flex;
  padding: 16rpx 24rpx;
  gap: 8rpx;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
  overflow-x: auto;

  .dark & {
    border-bottom-color: #44403c;
  }

  &::-webkit-scrollbar {
    display: none;
  }
}

.tab-item {
  min-width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  font-size: 40rpx;
  transition: all 0.2s;

  &:active {
    transform: scale(0.95);
  }

  &.active {
    background: rgba(79, 70, 229, 0.1);

    .dark & {
      background: rgba(249, 115, 22, 0.15);
    }
  }
}

.emoji-grid-container {
  height: 400rpx;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8rpx;
  padding: 16rpx 24rpx;
}

.emoji-item {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  border-radius: 16rpx;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  &:active {
    transform: scale(0.9);
    background: rgba(0, 0, 0, 0.1);
  }

  .dark &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}
</style>

