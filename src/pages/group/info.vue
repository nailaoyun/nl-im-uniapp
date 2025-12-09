<template>
  <view class="info-page">
    <view v-if="loading" class="loading-state">
      <wd-loading />
      <text>加载中...</text>
    </view>

    <template v-else-if="groupInfo">
      <!-- 群头像和名称 -->
      <view class="header-section">
        <wd-img
          v-if="groupInfo.avatar"
          :src="groupInfo.avatar"
          width="120rpx"
          height="120rpx"
          radius="16rpx"
        />
        <view v-else class="avatar-placeholder" :style="{ background: generateColor(groupInfo.name || '') }">
          {{ groupInfo.name?.charAt(0) || '群' }}
        </view>
        <text class="group-name">{{ groupInfo.name }}</text>
        <text class="member-count">{{ groupInfo.member_count || 0 }} 人</text>
      </view>

      <!-- 群成员 -->
      <view class="members-section">
        <view class="section-header" @click="goMembers">
          <text class="title">群成员</text>
          <text class="more">全部 {{ groupInfo.member_count }} 人 ›</text>
        </view>
        <view class="members-grid">
          <view
            v-for="member in displayMembers"
            :key="member.user_id"
            class="member-item"
          >
            <wd-img
              v-if="member.user?.avatar"
              :src="member.user.avatar"
              width="80rpx"
              height="80rpx"
              radius="8rpx"
            />
            <view v-else class="member-avatar" :style="{ background: generateColor(member.user?.name || '') }">
              {{ member.user?.name?.charAt(0) || '?' }}
            </view>
            <text class="member-name">{{ member.nickname || member.user?.name || '未知' }}</text>
          </view>
          <view class="member-item add-btn" @click="inviteMembers">
            <view class="add-icon">
              <wd-icon name="add" size="40rpx" color="var(--text-tertiary)" />
            </view>
            <text class="member-name">邀请</text>
          </view>
        </view>
      </view>

      <!-- 群设置 -->
      <wd-cell-group title="群设置">
        <wd-cell title="群名称" :value="groupInfo.name" is-link @click="editName" />
        <wd-cell title="群公告" :value="announcement || '未设置'" is-link @click="editAnnouncement" />
        <wd-cell title="消息免打扰" center>
          <template #value>
            <wd-switch v-model="isMuted" @change="toggleMute" />
          </template>
        </wd-cell>
        <wd-cell title="置顶聊天" center>
          <template #value>
            <wd-switch v-model="isTop" @change="toggleTop" />
          </template>
        </wd-cell>
      </wd-cell-group>

      <!-- 操作按钮 -->
      <view class="actions-section">
        <wd-button type="error" block plain @click="quitGroup">退出群聊</wd-button>
      </view>
    </template>

    <wd-toast />
    <wd-message-box />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import * as roomApi from '@/api/modules/room'
import { generateColor } from '@/utils/format'
import { useToast, useMessage } from 'wot-design-uni'
import type { GroupInfo, GroupMember } from '@/types/api'

const toast = useToast()
const messageBox = useMessage()

const loading = ref(true)
const groupInfo = ref<GroupInfo | null>(null)
const members = ref<GroupMember[]>([])
const announcement = ref('')
const isMuted = ref(false)
const isTop = ref(false)
const roomId = ref('')

const displayMembers = computed(() => members.value.slice(0, 8))

onLoad((options: any) => {
  roomId.value = options?.roomId || ''
})

onMounted(async () => {
  if (roomId.value) {
    await loadGroupInfo()
  }
})

async function loadGroupInfo() {
  loading.value = true
  try {
    const [info, memberList, announcementRes] = await Promise.all([
      roomApi.getGroup(roomId.value),
      roomApi.getGroupMembers(roomId.value),
      roomApi.getGroupAnnouncement(roomId.value).catch(() => ({ announcement: '' }))
    ])
    groupInfo.value = info
    members.value = memberList
    announcement.value = announcementRes.announcement
  } catch (error) {
    console.error('加载群信息失败:', error)
    toast.error('加载失败')
  } finally {
    loading.value = false
  }
}

function goMembers() {
  uni.navigateTo({ url: `/pages/group/members?roomId=${roomId.value}` })
}

function inviteMembers() {
  toast.show('邀请功能开发中')
}

async function editName() {
  if (!groupInfo.value) return
  try {
    const { value } = await messageBox.prompt({
      title: '修改群名称',
      inputValue: groupInfo.value.name,
      inputPlaceholder: '请输入群名称'
    })

    await roomApi.updateGroup(roomId.value, { name: value })
    groupInfo.value.name = value
    toast.success('修改成功')
  } catch (e: any) {
    if (e !== 'cancel') {
      toast.error('修改失败')
    }
  }
}

async function editAnnouncement() {
  try {
    const { value } = await messageBox.prompt({
      title: '修改群公告',
      inputValue: announcement.value,
      inputPlaceholder: '请输入群公告'
    })

    await roomApi.updateGroupAnnouncement(roomId.value, { announcement: value })
    announcement.value = value
    toast.success('修改成功')
  } catch (e: any) {
    if (e !== 'cancel') {
      toast.error('修改失败')
    }
  }
}

function toggleMute() {
  toast.show(isMuted.value ? '已开启免打扰' : '已关闭免打扰')
}

function toggleTop() {
  toast.show(isTop.value ? '已置顶' : '已取消置顶')
}

async function quitGroup() {
  try {
    await messageBox.confirm({
      title: '提示',
      msg: '确定要退出该群聊吗？'
    })

    await roomApi.quitGroup(roomId.value)
    toast.success('已退出')
    setTimeout(() => {
      uni.navigateBack({ delta: 2 })
    }, 1000)
  } catch (e: any) {
    if (e !== 'cancel') {
      toast.error('操作失败')
    }
  }
}
</script>

<style lang="scss" scoped>
.info-page {
  min-height: 100vh;
  background: var(--bg-page);
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

.header-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx;
  background: var(--bg-content);
  margin-bottom: 20rpx;

  .avatar-placeholder {
    width: 120rpx;
    height: 120rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16rpx;
    color: #fff;
    font-size: 48rpx;
    font-weight: 600;
  }

  .group-name {
    margin-top: 20rpx;
    font-size: 36rpx;
    font-weight: 600;
    color: var(--text-primary);
  }

  .member-count {
    margin-top: 8rpx;
    font-size: 26rpx;
    color: var(--text-tertiary);
  }
}

.members-section {
  background: var(--bg-content);
  margin-bottom: 20rpx;
  padding: 30rpx;

  .section-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 24rpx;

    .title {
      font-size: 28rpx;
      color: var(--text-tertiary);
    }

    .more {
      font-size: 28rpx;
      color: var(--text-link);
    }
  }

  .members-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 24rpx;
  }

  .member-item {
    width: 120rpx;
    display: flex;
    flex-direction: column;
    align-items: center;

    .member-avatar {
      width: 80rpx;
      height: 80rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8rpx;
      color: #fff;
      font-size: 28rpx;
      font-weight: 600;
    }

    .member-name {
      margin-top: 8rpx;
      font-size: 24rpx;
      color: var(--text-secondary);
      max-width: 120rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &.add-btn {
      .add-icon {
        width: 80rpx;
        height: 80rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2rpx dashed var(--border-color);
        border-radius: 8rpx;
      }
    }
  }
}

.actions-section {
  padding: 60rpx 30rpx;
  padding-bottom: calc(60rpx + env(safe-area-inset-bottom));
}
</style>
