<template>
  <view class="groups-page">
    <view v-if="loading" class="loading-state">
      <wd-loading />
      <text>加载中...</text>
    </view>

    <wd-status-tip v-else-if="groups.length === 0" tip="暂无群聊" />

    <template v-else>
      <wd-cell
        v-for="group in groups"
        :key="group.room_id"
        :title="group.room_name"
        :label="getCategoryText(group.category)"
        is-link
        @click="goChat(group)"
      >
        <template #icon>
          <wd-img
            v-if="group.room_avatar"
            :src="group.room_avatar"
            width="80rpx"
            height="80rpx"
            radius="8rpx"
            custom-style="margin-right: 24rpx;"
          />
          <view v-else class="avatar-placeholder" :style="{ background: generateColor(group.room_name || '') }">
            {{ group.room_name?.charAt(0) || '群' }}
          </view>
        </template>
      </wd-cell>
    </template>

    <!-- 创建群聊按钮 -->
    <view class="create-section" @click="goCreate">
      <wd-icon name="add-circle" size="40rpx" color="var(--color-primary)" />
      <text>创建群聊</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as roomApi from '@/api/modules/room'
import { generateColor } from '@/utils/format'

interface GroupItem {
  room_id: string
  room_name: string
  room_avatar: string
  category: 'joined' | 'created' | 'managed'
}

const loading = ref(true)
const groups = ref<GroupItem[]>([])

onMounted(async () => {
  await loadGroups()
})

async function loadGroups() {
  loading.value = true
  try {
    groups.value = await roomApi.getUserGroups()
  } catch (error) {
    console.error('加载群聊列表失败:', error)
  } finally {
    loading.value = false
  }
}

function getCategoryText(category: string) {
  switch (category) {
    case 'created':
      return '我创建的'
    case 'managed':
      return '我管理的'
    default:
      return '我加入的'
  }
}

function goChat(group: GroupItem) {
  uni.navigateTo({
    url: `/pages/chat/index?roomId=${group.room_id}&name=${encodeURIComponent(group.room_name)}`
  })
}

function goCreate() {
  uni.navigateTo({ url: '/pages/group/create' })
}
</script>

<style lang="scss" scoped>
.groups-page {
  min-height: 100vh;
  background: var(--bg-page);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx;
  color: var(--text-tertiary);
  gap: 20rpx;
}

.avatar-placeholder {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8rpx;
  margin-right: 24rpx;
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
}

.create-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 28rpx;
  background: var(--bg-content);
  margin-top: 20rpx;
  color: var(--color-primary);
  font-size: 32rpx;
}
</style>
