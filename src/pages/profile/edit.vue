<template>
  <view class="edit-page" :class="{ dark: isDark }">
    <!-- 导航栏 -->
    <app-nav-bar title="编辑资料" />
    
    <view class="form-item">
      <input
        v-model="value"
        class="input"
        :placeholder="placeholder"
        :maxlength="maxLength"
      />
      <text v-if="maxLength" class="counter">{{ value.length }}/{{ maxLength }}</text>
    </view>
    <button class="save-btn" @click="save">保存</button>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { isDark } = useTheme()
const field = ref('')
const value = ref('')
const placeholder = ref('')
const maxLength = ref(0)

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
      uni.setNavigationBarTitle({ title: '修改昵称' })
      break
    case 'desc':
      placeholder.value = '请输入个性签名'
      maxLength.value = 100
      uni.setNavigationBarTitle({ title: '修改签名' })
      break
    case 'region':
      placeholder.value = '请输入地区'
      maxLength.value = 50
      uni.setNavigationBarTitle({ title: '修改地区' })
      break
  }
})

function save() {
  if (!value.value.trim()) {
    uni.showToast({ title: '内容不能为空', icon: 'none' })
    return
  }

  // TODO: 调用接口保存
  uni.showToast({ title: '保存成功', icon: 'success' })
  setTimeout(() => {
    uni.navigateBack()
  }, 1500)
}
</script>

<style lang="scss" scoped>
.edit-page {
  padding: 30rpx;
  background: var(--bg-content);
  min-height: 100vh;
}

.form-item {
  position: relative;

  .input {
    width: 100%;
    padding: 24rpx;
    background: var(--bg-page);
    border-radius: 12rpx;
    font-size: 32rpx;
    color: var(--text-primary);
  }

  .counter {
    position: absolute;
    right: 24rpx;
    bottom: 24rpx;
    font-size: 24rpx;
    color: var(--text-tertiary);
  }
}

.save-btn {
  margin-top: 60rpx;
  background: var(--color-primary);
  color: #fff;
  font-size: 32rpx;
  border-radius: 12rpx;

  &::after {
    border: none;
  }
}
</style>
