<template>
  <view class="add-page" :class="{ dark: isDark }">
    <!-- 导航栏 -->
    <app-nav-bar title="添加好友" />
    
    <!-- 搜索区域 -->
    <view class="search-section">
      <wd-search
        v-model="keyword"
        placeholder="输入用户ID或手机号搜索"
        show-action
        @search="doSearch"
        @cancel="keyword = ''"
      />
    </view>

    <!-- 搜索结果 -->
    <view v-if="searched" class="results-section">
      <view v-if="loading" class="loading-state">
        <wd-loading />
        <text>搜索中...</text>
      </view>

      <wd-status-tip v-else-if="results.length === 0" tip="未找到相关用户" />

      <template v-else>
        <view
          v-for="item in results"
          :key="item.id"
          class="result-item"
        >
          <app-avatar
            :src="item.avatar"
            :name="item.name"
            :size="96"
            radius="8rpx"
          />

          <view class="user-info">
            <text class="name">{{ item.name }}</text>
            <text class="id">ID: {{ item.id }}</text>
          </view>

          <wd-button type="primary" size="small" @click="addFriend(item)">添加</wd-button>
        </view>
      </template>
    </view>

    <!-- 扫码添加 -->
    <view class="scan-section" @click="scanQrCode">
      <view class="scan-icon">
        <wd-icon name="scan" size="64rpx" color="var(--color-primary)" />
      </view>
      <text class="scan-text">扫一扫添加好友</text>
    </view>

    <wd-toast />
    <wd-message-box />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import * as contactApi from '@/api/modules/contact'
import { generateColor } from '@/utils/format'
import { useToast, useMessage } from 'wot-design-uni'
import { useTheme } from '@/composables/useTheme'
import AppAvatar from '@/components/common/AppAvatar.vue'
import type { User } from '@/types/api'

const toast = useToast()
const message = useMessage()
const { isDark } = useTheme()

const keyword = ref('')
const loading = ref(false)
const searched = ref(false)
const results = ref<User[]>([])

async function doSearch() {
  if (!keyword.value.trim()) {
    toast.show('请输入搜索内容')
    return
  }

  loading.value = true
  searched.value = true
  try {
    results.value = await contactApi.searchUsers(keyword.value.trim())
  } catch (error) {
    console.error('搜索失败:', error)
    toast.error('搜索失败')
  } finally {
    loading.value = false
  }
}

async function addFriend(user: User) {
  try {
    const { value } = await message.prompt({
      title: '添加好友',
      inputPlaceholder: '请输入验证消息',
      inputValue: '你好，我是...'
    })

    await contactApi.addFriend({
      to_user_id: user.id,
      message: value || ''
    })
    toast.success('申请已发送')
  } catch (e: any) {
    if (e !== 'cancel') {
      toast.error('发送失败')
    }
  }
}

function scanQrCode() {
  uni.scanCode({
    onlyFromCamera: false,
    success: (res) => {
      console.log('扫码结果:', res.result)
      // TODO: 处理扫码结果
      toast.show('扫码功能开发中')
    },
    fail: () => {
      toast.error('扫码失败')
    }
  })
}
</script>

<style lang="scss" scoped>
.add-page {
  min-height: 100vh;
  background: var(--bg-page);
}

.search-section {
  background: var(--bg-content);
  padding: 10rpx 0;
}

.results-section {
  background: var(--bg-content);
  margin-top: 20rpx;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx;
  color: var(--text-tertiary);
  gap: 20rpx;
}

.result-item {
  display: flex;
  align-items: center;
  padding: 24rpx 30rpx;
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

.user-info {
  flex: 1;
  margin-left: 24rpx;
  min-width: 0;

  .name {
    display: block;
    font-size: 32rpx;
    color: var(--text-primary);
    font-weight: 500;
  }

  .id {
    display: block;
    font-size: 26rpx;
    color: var(--text-secondary);
    margin-top: 8rpx;
  }
}

.scan-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx;
  background: var(--bg-content);
  margin-top: 20rpx;

  .scan-icon {
    width: 120rpx;
    height: 120rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-hover);
    border-radius: 50%;
    margin-bottom: 24rpx;
  }

  .scan-text {
    font-size: 30rpx;
    color: var(--text-secondary);
  }
}
</style>
