<template>
  <view class="members-page">
    <!-- 导航栏 -->
    <app-nav-bar title="群成员" />
    
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
        @click="goMemberDetail(member)"
      >
        <template #icon>
          <view class="member-avatar-wrap">
            <app-avatar
              :src="member.user?.avatar"
              :name="member.nickname || member.user?.name"
              :size="80"
              radius="8rpx"
            />
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
import { resolveImageUrl } from '@/utils/image'
import AppAvatar from '@/components/common/AppAvatar.vue'
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

function goMemberDetail(member: GroupMember) {
  // 跳转到成员详情页
  uni.navigateTo({ url: `/pages/contact/detail?userId=${member.user_id}` })
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

.member-avatar-wrap {
  margin-right: 24rpx;
}
</style>
