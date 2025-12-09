<template>
  <view class="login-page">
    <!-- Logo -->
    <view class="logo-section">
      <view class="logo">
        <wd-icon name="chat" size="120rpx" color="#07c160" />
      </view>
      <text class="app-name">NL-IM</text>
      <text class="app-desc">即时通讯</text>
    </view>

    <!-- 登录表单 -->
    <view class="form-section">
      <wd-cell-group border>
        <wd-input
          v-model="form.account"
          label="账号"
          placeholder="请输入手机号/邮箱"
          clearable
          :prefix-icon="'user'"
        />
        <wd-input
          v-model="form.password"
          label="密码"
          type="password"
          placeholder="请输入密码"
          clearable
          show-password
          :prefix-icon="'lock'"
        />
      </wd-cell-group>

      <view class="form-options">
        <wd-checkbox v-model="form.remember">记住登录</wd-checkbox>
        <text class="forgot-link" @click="forgotPassword">忘记密码？</text>
      </view>

      <wd-button
        type="primary"
        block
        :loading="loading"
        :disabled="!canLogin"
        @click="handleLogin"
      >
        登录
      </wd-button>

      <view class="register-link">
        <text>还没有账号？</text>
        <text class="link" @click="goRegister">立即注册</text>
      </view>
    </view>

    <!-- 其他登录方式 -->
    <view class="other-login">
      <view class="divider">
        <view class="line" />
        <text class="text">其他登录方式</text>
        <view class="line" />
      </view>
      <view class="login-icons">
        <view class="login-icon" @click="loginWithWeixin">
          <wd-icon name="weixin" size="56rpx" color="#07c160" />
        </view>
      </view>
    </view>

    <!-- Toast 和 MessageBox -->
    <wd-toast />
    <wd-message-box />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores'
import { useToast, useMessage } from 'wot-design-uni'

const authStore = useAuthStore()
const toast = useToast()
const message = useMessage()

// 表单数据
const form = ref({
  account: '',
  password: '',
  remember: true
})

const loading = ref(false)

// 是否可以登录
const canLogin = computed(() => {
  return form.value.account.trim() && form.value.password.trim()
})

// 登录
async function handleLogin() {
  if (!canLogin.value) return

  loading.value = true
  try {
    await authStore.login({
      account: form.value.account.trim(),
      password: form.value.password,
      remember: form.value.remember
    })
    toast.success('登录成功')
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 1000)
  } catch (error: any) {
    toast.error(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}

// 忘记密码
function forgotPassword() {
  toast.show('忘记密码功能开发中')
}

// 去注册
function goRegister() {
  toast.show('注册功能开发中')
}

// 微信登录
function loginWithWeixin() {
  // #ifdef MP-WEIXIN
  uni.login({
    provider: 'weixin',
    success: (res) => {
      console.log('微信登录:', res.code)
      toast.show('微信登录开发中')
    },
    fail: () => {
      toast.error('微信登录失败')
    }
  })
  // #endif

  // #ifndef MP-WEIXIN
  toast.show('请在微信小程序中使用此功能')
  // #endif
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
  padding: 0 40rpx;
}

// Logo 区域
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 150rpx;
  margin-bottom: 80rpx;

  .logo {
    width: 160rpx;
    height: 160rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-content);
    border-radius: 32rpx;
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
  }

  .app-name {
    margin-top: 24rpx;
    font-size: 48rpx;
    font-weight: 700;
    color: var(--text-primary);
  }

  .app-desc {
    margin-top: 8rpx;
    font-size: 28rpx;
    color: var(--text-secondary);
  }
}

// 表单区域
.form-section {
  background: var(--bg-content);
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;

  .form-options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 30rpx 0;

    .forgot-link {
      font-size: 28rpx;
      color: var(--color-primary);
    }
  }

  .register-link {
    text-align: center;
    margin-top: 30rpx;
    font-size: 28rpx;
    color: var(--text-secondary);

    .link {
      color: var(--color-primary);
      margin-left: 8rpx;
    }
  }
}

// 其他登录方式
.other-login {
  margin-top: auto;
  padding-bottom: calc(60rpx + env(safe-area-inset-bottom));

  .divider {
    display: flex;
    align-items: center;
    margin-bottom: 40rpx;

    .line {
      flex: 1;
      height: 1rpx;
      background: var(--border-color);
    }

    .text {
      padding: 0 24rpx;
      font-size: 26rpx;
      color: var(--text-tertiary);
    }
  }

  .login-icons {
    display: flex;
    justify-content: center;
    gap: 60rpx;

    .login-icon {
      width: 96rpx;
      height: 96rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-content);
      border-radius: 50%;
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
    }
  }
}
</style>
