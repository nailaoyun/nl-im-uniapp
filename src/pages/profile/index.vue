<template>
  <view class="profile-page">
    <!-- 头像区域 -->
    <view class="header-section">
      <view class="avatar-wrap" @click="changeAvatar">
        <wd-img
          v-if="user?.avatar"
          :src="user.avatar"
          width="160rpx"
          height="160rpx"
          round
        />
        <view v-else class="avatar-placeholder">
          {{ user?.name?.charAt(0) || '?' }}
        </view>
        <view class="change-tip">点击更换</view>
      </view>
    </view>

    <!-- 基本信息 -->
    <wd-cell-group title="基本信息">
      <wd-cell title="昵称" :value="user?.name || '未设置'" is-link @click="editField('name')" />
      <wd-cell title="ID" :value="user?.id || '-'" />
      <wd-cell title="个性签名" :value="user?.desc || '未设置'" is-link @click="editField('desc')" />
      <wd-cell title="地区" :value="user?.region || '未设置'" is-link @click="editField('region')" />
    </wd-cell-group>

    <!-- 联系方式 -->
    <wd-cell-group title="联系方式">
      <wd-cell title="手机号" :value="formatPhone(user?.phone)" />
      <wd-cell title="邮箱" :value="user?.email || '未绑定'" />
    </wd-cell-group>

    <wd-toast />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores'
import { useToast } from 'wot-design-uni'

const authStore = useAuthStore()
const toast = useToast()

const user = computed(() => authStore.user)

function formatPhone(phone?: string) {
  if (!phone) return '未绑定'
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

function changeAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      // TODO: 上传头像
      console.log('选择的图片:', res.tempFilePaths[0])
      toast.show('头像上传功能开发中')
    }
  })
}

function editField(field: string) {
  const value = field === 'name' ? user.value?.name : field === 'desc' ? user.value?.desc : user.value?.region
  uni.navigateTo({
    url: `/pages/profile/edit?field=${field}&value=${encodeURIComponent(value || '')}`
  })
}
</script>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background: var(--bg-page);
}

.header-section {
  display: flex;
  justify-content: center;
  padding: 60rpx 0;
  background: var(--bg-content);
  margin-bottom: 20rpx;
}

.avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;

  .avatar-placeholder {
    width: 160rpx;
    height: 160rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--color-primary);
    color: #fff;
    font-size: 64rpx;
    font-weight: 600;
  }

  .change-tip {
    margin-top: 16rpx;
    font-size: 26rpx;
    color: var(--text-tertiary);
  }
}
</style>
