<template>
  <wd-config-provider :theme="isDark ? 'dark' : 'light'">
    <view class="edit-page" :class="{ dark: isDark }">
      <app-nav-bar title="编辑资料" custom-style="background: transparent;" />

      <view class="content-body">
        <view class="input-card">
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

        <view class="btn-wrap">
          <wd-button type="primary" block size="large" custom-style="border-radius: 24rpx; background: #4f46e5;" @click="save">保存</wd-button>
        </view>
      </view>
    </view>
  </wd-config-provider>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'

// --- 逻辑不变 ---
const { isDark } = useTheme(); const field = ref(''); const value = ref(''); const placeholder = ref(''); const maxLength = ref(0);
onMounted(() => {
  const pages = getCurrentPages(); const currentPage = pages[pages.length - 1]; const options = (currentPage as any).$page?.options || {};
  field.value = options.field || ''; value.value = decodeURIComponent(options.value || '');
  switch (field.value) {
    case 'name': placeholder.value = '请输入昵称'; maxLength.value = 20; uni.setNavigationBarTitle({ title: '修改昵称' }); break;
    case 'desc': placeholder.value = '请输入个性签名'; maxLength.value = 100; uni.setNavigationBarTitle({ title: '修改签名' }); break;
    case 'region': placeholder.value = '请输入地区'; maxLength.value = 50; uni.setNavigationBarTitle({ title: '修改地区' }); break;
  }
})
function save() { if (!value.value.trim()) { uni.showToast({ title: '内容不能为空', icon: 'none' }); return } uni.showToast({ title: '保存成功', icon: 'success' }); setTimeout(() => { uni.navigateBack() }, 1500) }
</script>

<style lang="scss" scoped>
.edit-page {
  --bg-page: #f5f7fa;
  --bg-surface: #ffffff;
  --text-primary: #1d1d1f;

  min-height: 100vh;
  background: var(--bg-page);
}
.edit-page.dark {
  --bg-page: #1c1c1e;
  --bg-surface: #2c2c2e;
  --text-primary: #f2f2f7;
}

.content-body { padding: 40rpx; }

.input-card {
  background: var(--bg-surface);
  border-radius: 24rpx;
  padding: 30rpx;
  position: relative;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.02);
  margin-bottom: 60rpx;
}

.custom-input {
  width: 100%; font-size: 32rpx; color: var(--text-primary);
  &.textarea { height: 200rpx; }
}

:deep(.p-holder) { color: #999; }

.counter {
  position: absolute; bottom: 20rpx; right: 30rpx;
  font-size: 24rpx; color: #999;
}

.btn-wrap {
  margin-top: 40rpx;
}
</style>
