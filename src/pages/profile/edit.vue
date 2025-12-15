<template>
  <wd-config-provider :theme="isDark ? 'dark' : 'light'">
    <view class="edit-page" :class="{ dark: isDark }">
      <!-- 导航栏 -->
      <view class="nav-bar">
        <view class="nav-back" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </view>
        <text class="nav-title">{{ pageTitle }}</text>
        <view class="nav-placeholder"></view>
      </view>

      <view class="content-body">
        <!-- 输入卡片 -->
        <view class="input-card animate-fade-in-up">
          <view class="input-label">{{ inputLabel }}</view>
          <textarea
              v-if="field === 'desc'"
              v-model="value"
              class="custom-input textarea"
              :placeholder="placeholder"
              :maxlength="maxLength"
              placeholder-class="p-holder"
          />
          <input
              v-else
              v-model="value"
              class="custom-input"
              :placeholder="placeholder"
              :maxlength="maxLength"
              placeholder-class="p-holder"
          />
          <text v-if="maxLength" class="counter">{{ value.length }}/{{ maxLength }}</text>
        </view>

        <!-- 保存按钮 -->
        <view class="btn-wrap animate-fade-in-up" style="animation-delay: 100ms;">
          <view class="save-btn" @click="save">
            保存
          </view>
        </view>
      </view>
    </view>
  </wd-config-provider>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores'
import * as userApi from '@/api/modules/user'

const { isDark } = useTheme()
const authStore = useAuthStore()
const saving = ref(false)
const field = ref('')
const value = ref('')
const placeholder = ref('')
const maxLength = ref(0)
const pageTitle = ref('编辑资料')
const inputLabel = ref('')

function goBack() { uni.navigateBack() }

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = (currentPage as any).$page?.options || {}
  field.value = options.field || ''
  value.value = decodeURIComponent(options.value || '')

  switch (field.value) {
    case 'name':
      placeholder.value = '请输入昵称'
      maxLength.value = 20
      pageTitle.value = '修改昵称'
      inputLabel.value = '昵称'
      break
    case 'desc':
      placeholder.value = '请输入个性签名'
      maxLength.value = 100
      pageTitle.value = '修改签名'
      inputLabel.value = '个性签名'
      break
    case 'region':
      placeholder.value = '请输入地区'
      maxLength.value = 50
      pageTitle.value = '修改地区'
      inputLabel.value = '地区'
      break
  }
})

async function save() {
  if (!value.value.trim()) {
    uni.showToast({ title: '内容不能为空', icon: 'none' })
    return
  }
  if (saving.value) return
  saving.value = true
  
  try {
    const userId = authStore.user?.id
    if (!userId) {
      uni.showToast({ title: '用户信息异常', icon: 'none' })
      return
    }
    
    // 构建更新数据
    const updates: Record<string, string> = {}
    updates[field.value] = value.value.trim()
    
    // 调用 API 更新用户信息
    const updatedUser = await userApi.updateUser({ id: userId, updates })
    
    // 更新本地 store
    if (authStore.user) {
      const newUserInfo = { ...authStore.user, ...updates }
      authStore.updateUserInfo(newUserInfo)
    }
    
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => { uni.navigateBack() }, 1500)
  } catch (error: any) {
    console.error('保存失败:', error)
    uni.showToast({ title: error.message || '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
// 页面容器 - 浅色模式
.edit-page {
  --bg-page: #f7f8fa;
  --bg-surface: #ffffff;
  --text-primary: #1d1d1f;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;
  --color-brand: #4F46E5;

  min-height: 100vh;
  background: var(--bg-page);
}

// 深色模式 - Warm Stone
.edit-page.dark {
  --bg-page: #1c1917;
  --bg-surface: #292524;
  --text-primary: #f5f5f4;
  --text-secondary: #e7e5e4;
  --text-tertiary: #78716c;
  --color-brand: #f97316;
}

// 动画
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out forwards;
  opacity: 0;
}

// 导航栏
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(var(--status-bar-height) + var(--mp-safe-top, 0px) + 16rpx) 24rpx 16rpx;
  background: var(--bg-page);

  .nav-back {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.15s;

    svg {
      width: 40rpx;
      height: 40rpx;
      color: var(--text-primary);
    }

    &:active {
      background: rgba(0, 0, 0, 0.05);
    }
  }

  .nav-title {
    font-size: 34rpx;
    font-weight: 600;
    color: var(--text-primary);
  }

  .nav-placeholder {
    width: 72rpx;
  }
}

// 内容
.content-body {
  padding: 40rpx;
}

// 输入卡片
.input-card {
  background: var(--bg-surface);
  border-radius: 24rpx;
  padding: 32rpx;
  position: relative;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);
  margin-bottom: 48rpx;

  .input-label {
    font-size: 26rpx;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 16rpx;
  }
}

.custom-input {
  width: 100%;
  font-size: 32rpx;
  color: var(--text-primary);
  background: transparent;
  border: none;
  outline: none;
  padding: 16rpx 0;
  border-bottom: 2rpx solid transparent;
  transition: border-color 0.2s;

  &:focus {
    border-bottom-color: var(--color-brand);
  }

  &.textarea {
    height: 200rpx;
    line-height: 1.6;
    resize: none;
  }
}

:deep(.p-holder) {
  color: var(--text-tertiary);
}

.counter {
  position: absolute;
  bottom: 20rpx;
  right: 32rpx;
  font-size: 24rpx;
  color: var(--text-tertiary);
}

// 保存按钮
.btn-wrap {
  margin-top: 40rpx;
}

.save-btn {
  width: 100%;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(79, 70, 229, 0.25);
  transition: all 0.15s;

  .dark & {
    background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
    box-shadow: 0 8rpx 24rpx rgba(249, 115, 22, 0.25);
  }

  &:active {
    transform: scale(0.98);
  }
}
</style>
