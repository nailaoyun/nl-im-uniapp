<template>
  <view class="requests-page">
    <view v-if="loading" class="loading-state">
      <wd-loading />
      <text>加载中...</text>
    </view>

    <wd-status-tip v-else-if="requests.length === 0" tip="暂无好友申请" />

    <template v-else>
      <view
        v-for="item in requests"
        :key="item.id"
        class="request-item"
      >
        <wd-img
          v-if="item.from_user?.avatar"
          :src="item.from_user.avatar"
          width="96rpx"
          height="96rpx"
          radius="8rpx"
        />
        <view v-else class="avatar-placeholder" :style="{ background: generateColor(item.from_user?.name || '') }">
          {{ item.from_user?.name?.charAt(0) || '?' }}
        </view>

        <view class="request-info">
          <text class="name">{{ item.from_user?.name || '未知用户' }}</text>
          <text class="message">{{ item.message || '请求添加您为好友' }}</text>
        </view>

        <view class="request-actions">
          <template v-if="item.status === 'pending'">
            <wd-button size="small" plain @click="reject(item)">拒绝</wd-button>
            <wd-button size="small" type="primary" @click="accept(item)">同意</wd-button>
          </template>
          <text v-else class="status" :class="item.status">
            {{ item.status === 'accepted' ? '已添加' : '已拒绝' }}
          </text>
        </view>
      </view>
    </template>

    <wd-toast />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useContactStore } from '@/stores'
import * as contactApi from '@/api/modules/contact'
import { generateColor } from '@/utils/format'
import { useToast } from 'wot-design-uni'
import type { FriendRequest } from '@/types/api'

const contactStore = useContactStore()
const toast = useToast()

const loading = ref(true)
const requests = ref<FriendRequest[]>([])

onMounted(async () => {
  await loadRequests()
})

async function loadRequests() {
  loading.value = true
  try {
    requests.value = await contactApi.getFriendRequests()
    contactStore.setFriendRequests(requests.value)
  } catch (error) {
    console.error('加载好友申请失败:', error)
  } finally {
    loading.value = false
  }
}

async function accept(item: FriendRequest) {
  try {
    await contactApi.acceptFriendRequest(item.id)
    item.status = 'accepted'
    contactStore.removeFriendRequest(item.id)
    toast.success('已添加')
  } catch {
    toast.error('操作失败')
  }
}

async function reject(item: FriendRequest) {
  try {
    await contactApi.rejectFriendRequest(item.id)
    item.status = 'rejected'
    contactStore.removeFriendRequest(item.id)
    toast.success('已拒绝')
  } catch {
    toast.error('操作失败')
  }
}
</script>

<style lang="scss" scoped>
.requests-page {
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

.request-item {
  display: flex;
  align-items: center;
  padding: 24rpx 30rpx;
  background: var(--bg-content);
  border-bottom: 1rpx solid var(--divider-color);

  .avatar-placeholder {
    width: 96rpx;
    height: 96rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8rpx;
    color: #fff;
    font-size: 36rpx;
    font-weight: 600;
  }
}

.request-info {
  flex: 1;
  margin-left: 24rpx;
  min-width: 0;

  .name {
    display: block;
    font-size: 32rpx;
    color: var(--text-primary);
    font-weight: 500;
  }

  .message {
    display: block;
    font-size: 26rpx;
    color: var(--text-secondary);
    margin-top: 8rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.request-actions {
  display: flex;
  gap: 16rpx;
  align-items: center;

  .status {
    font-size: 26rpx;
    color: var(--text-tertiary);

    &.accepted {
      color: var(--color-primary);
    }
  }
}
</style>
