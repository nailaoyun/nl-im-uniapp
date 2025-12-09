<template>
  <!-- 根节点绑定 dark class 适配全局暗黑模式 -->
  <view class="login-page" :class="{ dark: isDark }">
    <!-- 导航栏 -->
    <app-nav-bar title="登录" :left-arrow="false" :bordered="false" />

    <!-- Logo 区域 -->
    <view class="logo-section">
      <view class="logo-box">
        <wd-icon name="chat" size="60px" color="#07c160" />
      </view>
      <text class="app-name">NL-IM</text>
      <text class="app-desc">即时通讯，连接你我</text>
    </view>

    <!-- 表单区域 -->
    <view class="form-section">
      <wd-cell-group border>
        <wd-input
            v-model="form.account"
            size="large"
            label="账号"
            label-width="60px"
            placeholder="请输入手机号/邮箱"
            clearable
            prefix-icon="user"
            :placeholder-style="isDark ? 'color: #555' : ''"
        />
        <wd-input
            v-model="form.password"
            size="large"
            label="密码"
            label-width="60px"
            type="password"
            placeholder="请输入密码"
            clearable
            show-password
            prefix-icon="lock"
            :placeholder-style="isDark ? 'color: #555' : ''"
        />
      </wd-cell-group>

      <view class="form-options">
        <wd-checkbox v-model="form.remember" shape="square">记住登录</wd-checkbox>
        <text class="forgot-link" @click="forgotPassword">忘记密码？</text>
      </view>

      <view class="action-buttons">
        <wd-button
            type="primary"
            block
            size="large"
            :loading="loading"
            :disabled="!canLogin"
            @click="handleLogin"
        >
          登录
        </wd-button>
      </view>

      <view class="register-link">
        <text>还没有账号？</text>
        <text class="link" @click="goRegister">立即注册</text>
      </view>
    </view>

    <!-- 其他登录方式 -->
    <view class="other-login">
      <wd-divider color="var(--text-tertiary)">其他登录方式</wd-divider>

      <view class="login-icons">
        <view class="login-icon-item" hover-class="hover-opacity" @click="loginWithWeixin">
          <wd-icon name="weixin" size="32px" color="#07c160" />
        </view>
      </view>
    </view>

    <!-- 全局反馈组件 -->
    <wd-toast />
    <wd-message-box />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores'
import { useToast, useMessage } from 'wot-design-uni'
import { useTheme } from '@/composables/useTheme'
// 引入 AppNavBar 组件 (通常已自动引入，显式引入以防万一)
import AppNavBar from '@/components/common/AppNavBar.vue'

const authStore = useAuthStore()
const toast = useToast()
const message = useMessage()
const { isDark } = useTheme()

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

// 登录逻辑 (保持原有逻辑不变)
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
      uni.reLaunch({ url: '/pages/index/index' })
    }, 1000)
  } catch (error: any) {
    toast.error(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}

function forgotPassword() {
  toast.show('忘记密码功能开发中')
}

function goRegister() {
  toast.show('注册功能开发中')
}

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
  background-color: var(--bg-page);
  padding: 0 40rpx;
  box-sizing: border-box;
  transition: background-color 0.3s;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120rpx;
  margin-bottom: 80rpx;

  .logo-box {
    width: 160rpx;
    height: 160rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--bg-content);
    border-radius: 32rpx;
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.05);
    margin-bottom: 30rpx;
  }

  .app-name {
    font-size: 48rpx;
    font-weight: 700;
    color: var(--text-primary);
  }

  .app-desc {
    margin-top: 12rpx;
    font-size: 28rpx;
    color: var(--text-secondary);
  }
}

.form-section {
  background-color: var(--bg-content);
  border-radius: 24rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.02);

  .form-options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 30rpx 0 50rpx;

    .forgot-link {
      font-size: 28rpx;
      color: var(--color-primary);
    }
  }

  .action-buttons {
    margin-bottom: 30rpx;
  }

  .register-link {
    text-align: center;
    font-size: 28rpx;
    color: var(--text-secondary);

    .link {
      color: var(--color-primary);
      margin-left: 10rpx;
      font-weight: 500;
    }
  }
}

.other-login {
  margin-top: auto;
  padding-bottom: calc(60rpx + env(safe-area-inset-bottom));
  width: 100%;

  .login-icons {
    display: flex;
    justify-content: center;
    margin-top: 40rpx;

    .login-icon-item {
      width: 96rpx;
      height: 96rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-content);
      border-radius: 50%;
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);

      &.hover-opacity {
        opacity: 0.8;
      }
    }
  }
}
</style>
