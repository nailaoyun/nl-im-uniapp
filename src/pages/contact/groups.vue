<template>
  <wd-config-provider :theme="isDark ? 'dark' : 'light'">
    <view class="groups-page" :class="{ dark: isDark }">
      <app-nav-bar title="我的群聊" custom-style="background: transparent;" />

      <view class="content-body">
        <view v-if="loading" class="loading-state">
          <wd-loading />
          <text>加载中...</text>
        </view>

        <wd-status-tip v-else-if="groups.length === 0" image="content" tip="暂无群聊" />

        <view v-else class="group-list">
          <!-- 使用 block 遍历 -->
          <view
              v-for="group in groups"
              :key="group.room_id"
              class="group-card"
              @click="goChat(group)"
          >
            <view class="card-left">
              <wd-img
                  v-if="group.room_avatar"
                  :src="group.room_avatar"
                  width="100rpx"
                  height="100rpx"
                  radius="20rpx"
              />
              <view v-else class="avatar-placeholder" :style="{ background: generateColor(group.room_name || '') }">
                {{ group.room_name?.charAt(0) || '群' }}
              </view>
            </view>

            <view class="card-right">
              <view class="row-1">
                <text class="group-name text-ellipsis">{{ group.room_name }}</text>
                <view class="tag" :class="group.category">
                  {{ getCategoryText(group.category) }}
                </view>
              </view>
              <wd-icon name="arrow-right" size="28rpx" color="var(--text-tertiary)" />
            </view>
          </view>
        </view>
      </view>

      <!-- 悬浮创建按钮 -->
      <view class="fab-create" @click="goCreate">
        <wd-icon name="add" size="50rpx" color="#fff" />
        <text>创建</text>
      </view>
    </view>
  </wd-config-provider>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as roomApi from '@/api/modules/room'
import { generateColor } from '@/utils/format'
import { useTheme } from '@/composables/useTheme'

// --- 逻辑保持不变 ---
interface GroupItem { room_id: string; room_name: string; room_avatar: string; category: 'joined' | 'created' | 'managed' }
const { isDark } = useTheme(); const loading = ref(true); const groups = ref<GroupItem[]>([]);
onMounted(async () => { await loadGroups() });
async function loadGroups() { loading.value = true; try { groups.value = await roomApi.getUserGroups() } catch (error) { console.error('加载群聊列表失败:', error) } finally { loading.value = false } }
function getCategoryText(category: string) { switch (category) { case 'created': return '我创建的'; case 'managed': return '我管理的'; default: return '我加入的' } }
function goChat(group: GroupItem) { uni.navigateTo({ url: `/pages/chat/index?roomId=${group.room_id}&name=${encodeURIComponent(group.room_name)}` }) }
function goCreate() { uni.navigateTo({ url: '/pages/group/create' }) }
</script>

<style lang="scss" scoped>
.groups-page {
  --bg-page: #f5f7fa;
  --bg-surface: #ffffff;
  --text-primary: #1d1d1f;
  --text-tertiary: #9ca3af;

  min-height: 100vh;
  background: var(--bg-page);
}

.groups-page.dark {
  --bg-page: #1c1c1e;
  --bg-surface: #2c2c2e;
  --text-primary: #f2f2f7;
}

.content-body { padding: 30rpx; padding-bottom: 160rpx; }

.loading-state { padding: 100rpx; display: flex; flex-direction: column; align-items: center; gap: 20rpx; color: var(--text-tertiary); }

.group-card {
  background: var(--bg-surface);
  border-radius: 24rpx;
  padding: 24rpx;
  display: flex; align-items: center;
  margin-bottom: 20rpx;
  transition: transform 0.1s;

  &:active { transform: scale(0.98); }

  .card-left { margin-right: 24rpx; }

  .avatar-placeholder {
    width: 100rpx; height: 100rpx; border-radius: 20rpx; display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 36rpx; font-weight: 600;
  }

  .card-right {
    flex: 1; display: flex; align-items: center; justify-content: space-between;

    .row-1 { display: flex; flex-direction: column; gap: 8rpx; }

    .group-name { font-size: 32rpx; font-weight: 600; color: var(--text-primary); max-width: 400rpx; }

    .tag {
      align-self: flex-start; font-size: 20rpx; padding: 2rpx 10rpx; border-radius: 8rpx;
      &.created { background: rgba(79, 70, 229, 0.1); color: #4f46e5; }
      &.managed { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
      &.joined { background: rgba(0,0,0,0.05); color: var(--text-tertiary); .dark & { background: rgba(255,255,255,0.1); } }
    }
  }
}

.fab-create {
  position: fixed; bottom: 80rpx; right: 40rpx;
  background: #4f46e5; color: #fff;
  height: 90rpx; padding: 0 40rpx; border-radius: 45rpx;
  display: flex; align-items: center; gap: 12rpx;
  box-shadow: 0 8rpx 24rpx rgba(79, 70, 229, 0.4);
  font-size: 28rpx; font-weight: 600;
  z-index: 99;

  &:active { transform: scale(0.95); }
}
</style>
