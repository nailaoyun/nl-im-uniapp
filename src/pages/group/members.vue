<template>
  <view class="members-page">
    <!-- 搜索框 -->
    <view class="search-section">
      <wd-search
        v-model="keyword"
        placeholder="搜索成员"
        hide-cancel
      />
    </view>

    <view v-if="loading" class="loading-state">
      <wd-loading />
      <text>加载中...</text>
    </view>

    <template v-else>
      <wd-cell
        v-for="member in filteredMembers"
        :key="member.user_id"
        :title="member.nickname || member.user?.name || '未知'"
        is-link
      >
        <template #icon>
          <wd-img
            v-if="member.user?.avatar"
            :src="member.user.avatar"
            width="80rpx"
            height="80rpx"
            radius="8rpx"
            custom-style="margin-right: 24rpx;"
          />
          <view v-else class="avatar-placeholder" :style="{ background: generateColor(member.user?.name || '') }">
            {{ member.user?.name?.charAt(0) || '?' }}
          </view>
        </template>
        <template #value>
          <wd-tag v-if="member.role === 2" type="warning" size="small">群主</wd-tag>
          <wd-tag v-else-if="member.role === 1" type="info" size="small">管理员</wd-tag>
        </template>
      </wd-cell>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import * as roomApi from '@/api/modules/room'
import { generateColor } from '@/utils/format'
import type { GroupMember } from '@/types/api'

const loading = ref(true)
const keyword = ref('')
const members = ref<GroupMember[]>([])
const roomId = ref('')

const filteredMembers = computed(() => {
  if (!keyword.value.trim()) return members.value
  const kw = keyword.value.trim().toLowerCase()
  return members.value.filter((m) => {
    const name = (m.nickname || m.user?.name || '').toLowerCase()
    return name.includes(kw)
  })
})

onLoad((options: any) => {
  roomId.value = options?.roomId || ''
})

onMounted(async () => {
  if (roomId.value) {
    await loadMembers()
  }
})

async function loadMembers() {
  loading.value = true
  try {
    members.value = await roomApi.getGroupMembers(roomId.value)
    // 按角色排序：群主 > 管理员 > 普通成员
    members.value.sort((a, b) => b.role - a.role)
  } catch (error) {
    console.error('加载群成员失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.members-page {
  min-height: 100vh;
  background: var(--bg-page);
}

.search-section {
  background: var(--bg-content);
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

.avatar-placeholder {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8rpx;
  margin-right: 24rpx;
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
}
</style>
