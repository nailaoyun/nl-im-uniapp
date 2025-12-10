<template>
  <wd-config-provider :theme="isDark ? 'dark' : 'light'">
    <view class="requests-page" :class="{ dark: isDark }">
      <app-nav-bar title="新朋友" custom-style="background: transparent;" />

      <view class="content-body">
        <view v-if="loading" class="loading-state">
          <wd-loading size="50rpx" />
          <text>加载中...</text>
        </view>

        <wd-status-tip v-else-if="requests.length === 0" image="message" tip="暂无好友申请" />

        <template v-else>
          <view
              v-for="item in requests"
              :key="item.id"
              class="request-card"
          >
            <view class="card-left">
              <app-avatar
                  :src="item.from_user?.avatar"
                  :name="item.from_user?.name"
                  :size="100"
                  radius="20rpx"
              />
            </view>

            <view class="card-content">
              <view class="info-top">
                <text class="name">{{ item.from_user?.name || '未知用户' }}</text>
                <text class="time">刚刚</text> <!-- 这里可以加个时间字段 -->
              </view>
              <view class="msg-box">
                <text class="message">{{ item.message || '请求添加您为好友' }}</text>
              </view>
            </view>

            <view class="card-footer">
              <template v-if="item.status === 'pending'">
                <view class="btn-group">
                  <view class="action-btn reject" @click="reject(item)">拒绝</view>
                  <view class="action-btn accept" @click="accept(item)">同意</view>
                </view>
              </template>
              <text v-else class="status-text" :class="item.status">
                {{ item.status === 'accepted' ? '已添加' : '已拒绝' }}
              </text>
            </view>
          </view>
        </template>
      </view>

      <wd-toast />
    </view>
  </wd-config-provider>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useContactStore } from '@/stores'
import * as contactApi from '@/api/modules/contact'
import { useToast } from 'wot-design-uni'
import { useTheme } from '@/composables/useTheme'
import AppAvatar from '@/components/common/AppAvatar.vue'
import type { FriendRequest } from '@/types/api'

// --- 逻辑保持不变 ---
const contactStore = useContactStore(); const toast = useToast(); const { isDark } = useTheme();
const loading = ref(true); const requests = ref<FriendRequest[]>([]);
onMounted(async () => { await loadRequests() });
async function loadRequests() { loading.value = true; try { requests.value = await contactApi.getFriendRequests(); contactStore.setFriendRequests(requests.value) } catch (error) { console.error(error) } finally { loading.value = false } }
async function accept(item: FriendRequest) { try { await contactApi.acceptFriendRequest(item.id); item.status = 'accepted'; contactStore.removeFriendRequest(item.id); toast.success('已添加') } catch { toast.error('操作失败') } }
async function reject(item: FriendRequest) { try { await contactApi.rejectFriendRequest(item.id); item.status = 'rejected'; contactStore.removeFriendRequest(item.id); toast.success('已拒绝') } catch { toast.error('操作失败') } }
</script>

<style lang="scss" scoped>
.requests-page {
  --bg-page: #f5f7fa;
  --bg-surface: #ffffff;
  --text-primary: #1d1d1f;
  --text-secondary: #86868b;

  min-height: 100vh;
  background: var(--bg-page);
}

.requests-page.dark {
  --bg-page: #1c1c1e;
  --bg-surface: #2c2c2e;
  --text-primary: #f2f2f7;
}

.content-body { padding: 30rpx; }

.loading-state { padding: 100rpx; display: flex; flex-direction: column; align-items: center; gap: 20rpx; color: var(--text-secondary); }

.request-card {
  background: var(--bg-surface);
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;

  .card-left {
    display: flex; align-items: flex-start;
  }

  .card-content {
    flex: 1;
    .info-top {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx;
      .name { font-size: 32rpx; font-weight: 600; color: var(--text-primary); }
      .time { font-size: 24rpx; color: var(--text-secondary); }
    }
    .msg-box {
      background: rgba(0,0,0,0.03); padding: 16rpx; border-radius: 12rpx;
      .dark & { background: rgba(255,255,255,0.05); }
      .message { font-size: 28rpx; color: var(--text-secondary); line-height: 1.4; }
    }
  }

  .card-footer {
    display: flex; justify-content: flex-end; padding-top: 20rpx; border-top: 1rpx solid rgba(0,0,0,0.05);
    .dark & { border-top-color: rgba(255,255,255,0.1); }
  }
}

/* 移动端友好的按钮组 */
.btn-group {
  display: flex; gap: 20rpx;
  .action-btn {
    padding: 12rpx 32rpx; border-radius: 30rpx; font-size: 26rpx; font-weight: 500;
    &.reject { background: rgba(0,0,0,0.05); color: var(--text-primary); .dark & { background: rgba(255,255,255,0.1); } }
    &.accept { background: #4f46e5; color: #fff; box-shadow: 0 4rpx 12rpx rgba(79, 70, 229, 0.3); }
    &:active { opacity: 0.8; }
  }
}

.status-text {
  font-size: 26rpx; color: var(--text-secondary); font-weight: 500;
  &.accepted { color: #4f46e5; }
}
</style>
