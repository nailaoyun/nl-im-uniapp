<template>
  <view v-if="show" class="mention-picker" :class="{ dark: isDark }">
    <!-- 搜索框 -->
    <view class="search-section">
      <wd-search
        v-model="searchQuery"
        placeholder="搜索用户..."
        hide-cancel
        focus
      />
    </view>

    <!-- 用户列表 -->
    <scroll-view class="user-list" scroll-y>
      <view v-if="filteredUsers.length === 0" class="empty-state">
        <text>暂无匹配用户</text>
      </view>
      <view
        v-for="(user, index) in filteredUsers"
        :key="user.id"
        class="user-item"
        :class="{ selected: index === selectedIndex }"
        @click="selectUser(user)"
      >
        <app-avatar
          :src="user.avatar"
          :name="user.name"
          :size="64"
          radius="50%"
        />
        <view class="user-info">
          <text class="user-name">{{ user.name || user.id }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTheme } from '@/composables/useTheme'
import AppAvatar from '@/components/common/AppAvatar.vue'

export interface MentionUser {
  id: string
  name: string
  avatar?: string
}

const props = withDefaults(defineProps<{
  show: boolean
  users: MentionUser[]
}>(), {})

const emit = defineEmits<{
  select: [user: MentionUser]
  close: []
}>()

const { isDark } = useTheme()
const searchQuery = ref('')
const selectedIndex = ref(0)

// 过滤用户
const filteredUsers = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return props.users.slice(0, 20)
  return props.users.filter(user =>
    user.name?.toLowerCase().includes(query) ||
    user.id?.toLowerCase().includes(query)
  ).slice(0, 20)
})

// 选择用户
function selectUser(user: MentionUser) {
  emit('select', user)
  searchQuery.value = ''
  selectedIndex.value = 0
}

// 监听显示状态
watch(() => props.show, (show) => {
  if (show) {
    searchQuery.value = ''
    selectedIndex.value = 0
  }
})

// 监听搜索变化
watch(searchQuery, () => {
  selectedIndex.value = 0
})
</script>

<style lang="scss" scoped>
.mention-picker {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  margin-bottom: 16rpx;
  background: var(--bg-content);
  border-radius: 24rpx;
  box-shadow: 0 -8rpx 40rpx rgba(0, 0, 0, 0.2);
  border: 1rpx solid var(--divider-color);
  overflow: hidden;
  z-index: 100;
  max-height: 500rpx;
}

.search-section {
  padding: 16rpx;
  border-bottom: 1rpx solid var(--divider-color);
}

.user-list {
  max-height: 400rpx;
}

.empty-state {
  padding: 40rpx;
  text-align: center;
  font-size: 26rpx;
  color: var(--text-tertiary);
}

.user-item {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  gap: 20rpx;
  transition: background 0.2s;

  &:active,
  &.selected {
    background: var(--bg-hover);
  }
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 28rpx;
  color: var(--text-primary);
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

