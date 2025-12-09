<template>
  <view class="info-page" :class="{ dark: isDark }">
    <!-- 导航栏 -->
    <app-nav-bar title="群信息" />
    
    <view v-if="loading" class="loading-state">
      <wd-loading />
      <text>加载中...</text>
    </view>

    <template v-else-if="groupInfo">
      <!-- 群头像和名称 -->
      <view class="header-section">
        <app-avatar
          :src="groupInfo.avatar"
          :name="groupInfo.name || '群聊'"
          :size="160"
          radius="24rpx"
        />
        <text class="group-name">{{ groupInfo.name }}</text>
        <view class="info-tags">
          <text class="info-tag">ID: {{ groupInfo.room_id?.slice(-6) }}</text>
          <text class="info-tag">{{ members.length }} 人</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="actions-grid">
        <!-- 发起通话 -->
        <view class="action-item" @click="handleStartCall">
          <view class="action-icon green">
            <wd-icon name="video" size="40rpx" color="#fff" />
          </view>
          <text class="action-label">通话</text>
        </view>

        <!-- 邀请成员 -->
        <view v-if="canInvite" class="action-item" @click="showInviteModal = true">
          <view class="action-icon blue">
            <wd-icon name="add" size="40rpx" color="#fff" />
          </view>
          <text class="action-label">邀请</text>
        </view>

        <!-- 群公告 -->
        <view class="action-item" @click="editAnnouncement">
          <view class="action-icon purple">
            <wd-icon name="bell" size="40rpx" color="#fff" />
          </view>
          <text class="action-label">公告</text>
        </view>

        <!-- 管理员设置（仅群主） -->
        <view v-if="isOwner" class="action-item" @click="showAdminModal = true">
          <view class="action-icon indigo">
            <wd-icon name="user" size="40rpx" color="#fff" />
          </view>
          <text class="action-label">管理员</text>
        </view>

        <!-- 群设置 -->
        <view class="action-item" @click="goSettings">
          <view class="action-icon gray">
            <wd-icon name="setting" size="40rpx" color="#fff" />
          </view>
          <text class="action-label">设置</text>
        </view>
      </view>

      <!-- 群公告预览 -->
      <view v-if="announcement" class="announcement-section" @click="editAnnouncement">
        <view class="section-title">
          <wd-icon name="bell" size="28rpx" color="var(--color-primary)" />
          <text>群公告</text>
        </view>
        <text class="announcement-content">{{ announcement }}</text>
      </view>

      <!-- 群成员 -->
      <view class="members-section">
        <view class="section-header" @click="goMembers">
          <text class="title">群成员</text>
          <text class="more">全部 {{ members.length }} 人 ›</text>
        </view>
        <scroll-view class="members-scroll" scroll-x>
          <!-- 邀请入口 -->
          <view v-if="canInvite" class="member-item add-btn" @click="showInviteModal = true">
            <view class="add-icon">
              <wd-icon name="add" size="40rpx" color="var(--text-tertiary)" />
            </view>
            <text class="member-name">邀请</text>
          </view>

          <!-- 成员列表 -->
          <view
            v-for="member in displayMembers"
            :key="member.user_id"
            class="member-item"
            @click="handleMemberClick(member)"
            @longpress="handleMemberLongPress(member)"
          >
            <view class="avatar-wrap">
            <app-avatar
              :src="member.user?.avatar"
              :name="member.nickname || member.user?.name"
                :size="96"
                radius="16rpx"
            />
              <!-- 群主标识 -->
              <view v-if="member.role === 2" class="role-badge owner">
                <wd-icon name="crown" size="20rpx" color="#000" />
              </view>
              <!-- 管理员标识 -->
              <view v-else-if="member.role === 1" class="role-badge admin">
                <wd-icon name="star" size="20rpx" color="#fff" />
              </view>
              <!-- 禁言标识 -->
              <view v-if="isMemberMuted(member)" class="muted-badge">
                <wd-icon name="volume-mute" size="16rpx" color="#fff" />
              </view>
            </view>
            <text class="member-name">{{ member.nickname || member.user?.name || '未知' }}</text>
          </view>
        </scroll-view>
      </view>

      <!-- 群设置 -->
      <wd-cell-group title="聊天设置">
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
        <wd-cell title="我在本群的昵称" :value="myNickname || '未设置'" is-link @click="editMyNickname" />
      </wd-cell-group>

      <!-- 危险操作 -->
      <view class="danger-section">
        <wd-button v-if="!isOwner" type="error" block plain @click="quitGroup">退出群聊</wd-button>
        <template v-else>
          <wd-button type="warning" block plain @click="showTransferModal = true" style="margin-bottom: 20rpx;">转让群主</wd-button>
          <wd-button type="error" block @click="dissolveGroup">解散群聊</wd-button>
        </template>
      </view>
    </template>

    <!-- 邀请成员弹窗 -->
    <select-contacts-modal
      v-model="showInviteModal"
      :contacts="availableContacts"
      mode="invite"
      title="邀请好友加入"
      @select="handleInviteMembers"
    />

    <!-- 发起群通话弹窗 -->
    <group-call-modal
      v-model="showCallModal"
      :members="callCandidates"
      @start-call="handleConfirmStartCall"
    />

    <!-- 管理员设置弹窗 -->
    <wd-popup v-model="showAdminModal" position="bottom" safe-area-inset-bottom custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="admin-modal">
        <view class="modal-header">
          <text class="modal-title">管理员设置</text>
          <text class="modal-subtitle">已选择 {{ selectedAdminIds.size }} 人</text>
        </view>
        <scroll-view class="modal-content" scroll-y>
          <view
            v-for="member in adminCandidates"
            :key="member.user_id"
            class="admin-item"
            :class="{ selected: selectedAdminIds.has(member.user_id) }"
            @click="toggleAdminSelection(member.user_id)"
          >
            <app-avatar
              :src="member.user?.avatar"
              :name="member.nickname || member.user?.name"
              :size="80"
              radius="50%"
            />
            <view class="admin-info">
              <text class="admin-name">{{ member.nickname || member.user?.name || '未知' }}</text>
              <text class="admin-role">{{ member.role === 1 ? '当前管理员' : '普通成员' }}</text>
            </view>
            <view class="check-box" :class="{ checked: selectedAdminIds.has(member.user_id) }">
              <wd-icon v-if="selectedAdminIds.has(member.user_id)" name="check" size="24rpx" color="#fff" />
            </view>
          </view>
        </scroll-view>
        <view class="modal-footer">
          <wd-button plain @click="showAdminModal = false">取消</wd-button>
          <wd-button type="primary" :loading="savingAdmins" @click="handleSaveAdmins">保存设置</wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 转让群主弹窗 -->
    <wd-popup v-model="showTransferModal" position="bottom" safe-area-inset-bottom custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="transfer-modal">
        <view class="modal-header">
          <text class="modal-title">转让群主</text>
          <text class="modal-subtitle">选择新群主</text>
        </view>
        <scroll-view class="modal-content" scroll-y>
          <view
            v-for="member in transferCandidates"
            :key="member.user_id"
            class="admin-item"
            :class="{ selected: transferToUserId === member.user_id }"
            @click="transferToUserId = member.user_id"
          >
            <app-avatar
              :src="member.user?.avatar"
              :name="member.nickname || member.user?.name"
              :size="80"
              radius="50%"
            />
            <view class="admin-info">
              <text class="admin-name">{{ member.nickname || member.user?.name || '未知' }}</text>
              <wd-tag v-if="member.role === 1" type="info" size="small">管理员</wd-tag>
            </view>
            <view class="check-box radio" :class="{ checked: transferToUserId === member.user_id }">
              <view v-if="transferToUserId === member.user_id" class="radio-dot"></view>
            </view>
          </view>
        </scroll-view>
        <view class="modal-footer">
          <wd-button plain @click="showTransferModal = false">取消</wd-button>
          <wd-button type="warning" :disabled="!transferToUserId" :loading="transferring" @click="handleTransferOwner">确认转让</wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 成员操作菜单 -->
    <wd-action-sheet
      v-model="showMemberActions"
      :actions="memberActionItems"
      @select="onMemberActionSelect"
      cancel-text="取消"
    />

    <!-- 禁言时长选择弹窗 -->
    <wd-popup v-model="showMuteModal" position="bottom" safe-area-inset-bottom custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="mute-modal">
        <view class="modal-header">
          <text class="modal-title">禁言成员</text>
          <text class="modal-subtitle">选择禁言 {{ mutingMember?.nickname || mutingMember?.user?.name || '该成员' }} 的时长</text>
        </view>
        <view class="mute-options">
          <view class="mute-option" @click="confirmMute(600)">
            <text>10分钟</text>
          </view>
          <view class="mute-option" @click="confirmMute(3600)">
            <text>1小时</text>
          </view>
          <view class="mute-option" @click="confirmMute(43200)">
            <text>12小时</text>
          </view>
          <view class="mute-option" @click="confirmMute(86400)">
            <text>1天</text>
          </view>
          <view class="mute-option" @click="confirmMute(604800)">
            <text>7天</text>
          </view>
          <view class="mute-option danger" @click="confirmMute(0)">
            <text>永久禁言</text>
          </view>
        </view>
        <view class="modal-footer">
          <wd-button block plain @click="showMuteModal = false">取消</wd-button>
        </view>
      </view>
    </wd-popup>

    <wd-toast />
    <wd-message-box />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import * as roomApi from '@/api/modules/room'
import * as contactApi from '@/api/modules/contact'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import { useGroupWebRTC } from '@/composables/useGroupWebRTC'
import { useToast, useMessage } from 'wot-design-uni'
import AppAvatar from '@/components/common/AppAvatar.vue'
import SelectContactsModal from '@/components/chat/SelectContactsModal.vue'
import GroupCallModal from '@/components/call/GroupCallModal.vue'
import type { GroupInfo, GroupMember, Contact } from '@/types/api'

const authStore = useAuthStore()
const { isDark } = useTheme()
const toast = useToast()
const messageBox = useMessage()
const groupWebRTC = useGroupWebRTC()

// 基础状态
const loading = ref(true)
const groupInfo = ref<GroupInfo | null>(null)
const members = ref<GroupMember[]>([])
const announcement = ref('')
const isMuted = ref(false)
const isTop = ref(false)
const roomId = ref('')
const availableContacts = ref<Contact[]>([])

// 弹窗状态
const showInviteModal = ref(false)
const showCallModal = ref(false)
const showAdminModal = ref(false)
const showTransferModal = ref(false)
const showMemberActions = ref(false)
const showMuteModal = ref(false)

// 禁言操作
const mutingMember = ref<GroupMember | null>(null)

// 管理员设置
const selectedAdminIds = ref<Set<string>>(new Set())
const savingAdmins = ref(false)

// 转让群主
const transferToUserId = ref('')
const transferring = ref(false)

// 成员操作
const selectedMember = ref<GroupMember | null>(null)

// 计算属性
const currentUserRole = computed(() => members.value.find(m => m.user_id === authStore.user?.id)?.role ?? 0)
const isOwner = computed(() => currentUserRole.value === 2)
const isAdmin = computed(() => currentUserRole.value === 1)
const canInvite = computed(() => isOwner.value || isAdmin.value)
const displayMembers = computed(() => members.value.slice(0, 12))
const myNickname = computed(() => members.value.find(m => m.user_id === authStore.user?.id)?.nickname || '')

// 转换群成员为 Contact 格式
const callCandidates = computed(() => {
  return members.value
    .filter(m => m.user_id !== authStore.user?.id)
    .map(m => ({
      id: m.user_id,
      user_id: m.user_id,
      remark_name: m.nickname || m.user?.name || '未知',
      user: m.user,
      is_online: m.user?.is_online
    } as unknown as Contact))
})

// 管理员候选人（排除群主）
const adminCandidates = computed(() => {
  return members.value.filter(m => m.user_id !== authStore.user?.id && m.role !== 2)
})

// 转让候选人（排除自己）
const transferCandidates = computed(() => {
  return members.value.filter(m => m.user_id !== authStore.user?.id)
})

// 成员操作菜单项
const memberActionItems = computed(() => {
  if (!selectedMember.value) return []
  const items: any[] = []
  const member = selectedMember.value

  // 查看资料
  items.push({ name: '查看资料', value: 'view' })

  // 不能操作自己
  if (member.user_id === authStore.user?.id) return items

  // 群主的操作
  if (isOwner.value) {
    if (member.role === 0) {
      items.push({ name: '设为管理员', value: 'setAdmin' })
    } else if (member.role === 1) {
      items.push({ name: '取消管理员', value: 'removeAdmin' })
    }
    if (isMemberMuted(member)) {
      items.push({ name: '解除禁言', value: 'unmute' })
    } else {
      items.push({ name: '禁言', value: 'mute' })
    }
    items.push({ name: '移除成员', value: 'remove', color: '#fa5151' })
  }
  // 管理员的操作
  else if (isAdmin.value && member.role === 0) {
    if (isMemberMuted(member)) {
      items.push({ name: '解除禁言', value: 'unmute' })
    } else {
      items.push({ name: '禁言', value: 'mute' })
    }
    items.push({ name: '移除成员', value: 'remove', color: '#fa5151' })
  }

  return items
})

// 检查成员是否被禁言
function isMemberMuted(member: GroupMember): boolean {
  if (!member.muted_until) return false
  return new Date(member.muted_until) > new Date()
}

onLoad((options: any) => {
  roomId.value = options?.roomId || ''
})

onMounted(async () => {
  if (roomId.value) {
    await loadGroupInfo()
  }
})

onShow(() => {
  if (roomId.value && !loading.value) {
    loadGroupInfo()
  }
})

async function loadGroupInfo() {
  loading.value = true
  try {
    const [info, memberList, announcementRes, contacts] = await Promise.all([
      roomApi.getGroup(roomId.value),
      roomApi.getGroupMembers(roomId.value),
      roomApi.getGroupAnnouncement(roomId.value).catch(() => ({ announcement: '' })),
      contactApi.getContacts()
    ])
    groupInfo.value = info
    members.value = memberList
    // 按角色排序
    members.value.sort((a, b) => b.role - a.role)
    announcement.value = announcementRes.announcement

    // 过滤可邀请的好友
    const memberIds = new Set(memberList.map(m => m.user_id))
    availableContacts.value = contacts.filter(c => !memberIds.has(c.user_id || c.id))
  } catch (error) {
    console.error('加载群信息失败:', error)
    toast.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 导航
function goMembers() {
  uni.navigateTo({ url: `/pages/group/members?roomId=${roomId.value}` })
}

function goSettings() {
  // 可以跳转到更详细的设置页，或者使用弹窗
  toast.show('更多设置功能开发中')
}

// 通话
function handleStartCall() {
  if (callCandidates.value.length === 0) {
    toast.info('群里只有你一个人，无法通话')
    return
  }
  showCallModal.value = true
}

function handleConfirmStartCall(type: 'audio' | 'video', selectedIds: string[]) {
  if (!selectedIds.length) {
    toast.warning('请选择至少一名成员')
    return
  }
  groupWebRTC.startGroupCall(roomId.value, selectedIds, type)
  showCallModal.value = false
}

// 邀请成员
async function handleInviteMembers(selectedContacts: Contact[]) {
  const memberIds = selectedContacts.map(c => c.user_id || c.id).filter(Boolean) as string[]
  if (!memberIds.length) return

  try {
    await roomApi.inviteGroupMembers(roomId.value, { member_ids: memberIds })
    toast.success('邀请成功')
    showInviteModal.value = false
    loadGroupInfo()
  } catch (e) {
    toast.error('邀请失败')
  }
}

// 公告
async function editAnnouncement() {
  try {
    const { value } = await messageBox.prompt({
      title: '群公告',
      inputValue: announcement.value,
      inputPlaceholder: '请输入群公告'
    })

    await roomApi.updateGroupAnnouncement(roomId.value, value)
    announcement.value = value
    toast.success('公告已更新')
  } catch (e: any) {
    if (e !== 'cancel') {
      toast.error('修改失败')
    }
  }
}

// 我的群昵称
async function editMyNickname() {
  try {
    const { value } = await messageBox.prompt({
      title: '我在本群的昵称',
      inputValue: myNickname.value,
      inputPlaceholder: '请输入昵称'
    })

    await roomApi.updateMyNickname(roomId.value, value)
    // 更新本地状态
    const me = members.value.find(m => m.user_id === authStore.user?.id)
    if (me) me.nickname = value
    toast.success('昵称已更新')
  } catch (e: any) {
    if (e !== 'cancel') {
      toast.error('修改失败')
    }
  }
}

// 免打扰/置顶
function toggleMute() {
  toast.show(isMuted.value ? '已开启免打扰' : '已关闭免打扰')
}

function toggleTop() {
  toast.show(isTop.value ? '已置顶' : '已取消置顶')
}

// 成员操作
function handleMemberClick(member: GroupMember) {
  uni.navigateTo({ url: `/pages/contact/detail?userId=${member.user_id}` })
}

function handleMemberLongPress(member: GroupMember) {
  selectedMember.value = member
  showMemberActions.value = true
}

async function onMemberActionSelect(item: { value: string }) {
  if (!selectedMember.value) return
  const member = selectedMember.value

  switch (item.value) {
    case 'view':
      handleMemberClick(member)
      break
    case 'setAdmin':
      await setMemberRole(member, 1)
      break
    case 'removeAdmin':
      await setMemberRole(member, 0)
      break
    case 'mute':
      await muteMember(member)
      break
    case 'unmute':
      await unmuteMember(member)
      break
    case 'remove':
      await removeMember(member)
      break
  }
  showMemberActions.value = false
}

async function setMemberRole(member: GroupMember, role: number) {
  try {
    await roomApi.updateMemberRole(roomId.value, member.user_id, { role })
    toast.success(role === 1 ? '已设为管理员' : '已取消管理员')
    loadGroupInfo()
  } catch (e) {
    toast.error('操作失败')
  }
}

function muteMember(member: GroupMember) {
  mutingMember.value = member
  showMuteModal.value = true
}

async function confirmMute(duration: number) {
  if (!mutingMember.value) return
  try {
    await roomApi.muteGroupMember(roomId.value, mutingMember.value.user_id, duration)
    const durationText = duration === 0 ? '永久' : 
      duration < 3600 ? `${duration / 60}分钟` : 
      duration < 86400 ? `${duration / 3600}小时` : 
      `${duration / 86400}天`
    toast.success(`已禁言${durationText}`)
    showMuteModal.value = false
    mutingMember.value = null
    loadGroupInfo()
  } catch (e) {
    toast.error('操作失败')
  }
}

async function unmuteMember(member: GroupMember) {
  try {
    await roomApi.muteGroupMember(roomId.value, member.user_id, -1)
    toast.success('已解除禁言')
    loadGroupInfo()
  } catch (e) {
    toast.error('操作失败')
  }
}

async function removeMember(member: GroupMember) {
  try {
    await messageBox.confirm({
      title: '移除成员',
      msg: `确定要将"${member.nickname || member.user?.name || '该成员'}"移出群聊吗？`
    })
    await roomApi.removeGroupMember(roomId.value, member.user_id)
    toast.success('已移除')
    loadGroupInfo()
  } catch (e: any) {
    if (e !== 'cancel') {
      toast.error('操作失败')
    }
  }
}

// 管理员设置
function toggleAdminSelection(userId: string) {
  if (selectedAdminIds.value.has(userId)) {
    selectedAdminIds.value.delete(userId)
  } else {
    selectedAdminIds.value.add(userId)
  }
  selectedAdminIds.value = new Set(selectedAdminIds.value)
}

async function handleSaveAdmins() {
  savingAdmins.value = true
  try {
    const currentAdminIds = new Set(members.value.filter(m => m.role === 1).map(m => m.user_id))
    const toAdd = [...selectedAdminIds.value].filter(id => !currentAdminIds.has(id))
    const toRemove = [...currentAdminIds].filter(id => !selectedAdminIds.value.has(id))

    const promises: Promise<void>[] = []
    for (const userId of toAdd) {
      promises.push(roomApi.updateMemberRole(roomId.value, userId, { role: 1 }))
    }
    for (const userId of toRemove) {
      promises.push(roomApi.updateMemberRole(roomId.value, userId, { role: 0 }))
    }
    await Promise.all(promises)

    toast.success('管理员设置已保存')
    showAdminModal.value = false
    loadGroupInfo()
  } catch (e) {
    toast.error('保存失败')
  } finally {
    savingAdmins.value = false
  }
}

// 转让群主
async function handleTransferOwner() {
  if (!transferToUserId.value) return
  transferring.value = true
  try {
    await roomApi.updateMemberRole(roomId.value, transferToUserId.value, { role: 2 })
    toast.success('群主已转让')
    showTransferModal.value = false
    transferToUserId.value = ''
    loadGroupInfo()
  } catch (e) {
    toast.error('转让失败')
  } finally {
    transferring.value = false
  }
}

// 退出群聊
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

// 解散群聊
async function dissolveGroup() {
  try {
    await messageBox.confirm({
      title: '解散群聊',
      msg: '确定要解散该群聊吗？此操作不可恢复。'
    })
    await roomApi.dissolveGroup(roomId.value)
    toast.success('群聊已解散')
    setTimeout(() => {
      uni.navigateBack({ delta: 2 })
    }, 1000)
  } catch (e: any) {
    if (e !== 'cancel') {
      toast.error('操作失败')
    }
  }
}

// 初始化管理员设置弹窗时的选中状态
function initAdminSelection() {
  selectedAdminIds.value = new Set(
    members.value.filter(m => m.role === 1).map(m => m.user_id)
  )
}
</script>

<style lang="scss" scoped>
.info-page {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: env(safe-area-inset-bottom);
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
  padding: 60rpx 40rpx 40rpx;
  background: var(--bg-content);
  margin-bottom: 20rpx;

  .group-name {
    margin-top: 24rpx;
    font-size: 40rpx;
    font-weight: 700;
    color: var(--text-primary);
  }

  .info-tags {
    margin-top: 12rpx;
    display: flex;
    gap: 16rpx;
  }

  .info-tag {
    padding: 6rpx 16rpx;
    background: var(--bg-hover);
    border-radius: 8rpx;
    font-size: 22rpx;
    color: var(--text-tertiary);
    font-family: monospace;
  }
}

.actions-grid {
  display: flex;
  justify-content: center;
  gap: 40rpx;
  padding: 30rpx;
  background: var(--bg-content);
  margin-bottom: 20rpx;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.action-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;

  &:active {
    transform: scale(0.95);
  }

  &.green { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
  &.blue { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
  &.purple { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
  &.indigo { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); }
  &.gray { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); }
}

.action-label {
  font-size: 24rpx;
  color: var(--text-secondary);
}

.announcement-section {
  background: var(--bg-content);
  padding: 24rpx 30rpx;
  margin-bottom: 20rpx;

  .section-title {
    display: flex;
    align-items: center;
    gap: 8rpx;
    font-size: 24rpx;
    color: var(--text-tertiary);
    margin-bottom: 12rpx;
  }

  .announcement-content {
    font-size: 28rpx;
    color: var(--text-primary);
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.members-section {
  background: var(--bg-content);
  padding: 30rpx;
  margin-bottom: 20rpx;

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

  .members-scroll {
    white-space: nowrap;
  }

  .member-item {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    width: 120rpx;
    margin-right: 16rpx;

    .avatar-wrap {
      position: relative;
    }

    .role-badge {
      position: absolute;
      top: -8rpx;
      right: -8rpx;
      width: 32rpx;
      height: 32rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      &.owner {
        background: #fbbf24;
      }

      &.admin {
        background: #3b82f6;
      }
    }

    .muted-badge {
      position: absolute;
      bottom: -4rpx;
      right: -4rpx;
      width: 28rpx;
      height: 28rpx;
      border-radius: 50%;
      background: #f97316;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .member-name {
      margin-top: 12rpx;
      font-size: 24rpx;
      color: var(--text-secondary);
      max-width: 120rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &.add-btn {
      .add-icon {
        width: 96rpx;
        height: 96rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2rpx dashed var(--border-color);
        border-radius: 16rpx;
      }
    }
  }
}

.danger-section {
  padding: 60rpx 30rpx;
}

// 弹窗样式
.admin-modal,
.transfer-modal {
  background: var(--bg-content);
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 32rpx;
  border-bottom: 1rpx solid var(--divider-color);

  .modal-title {
    font-size: 32rpx;
    font-weight: 600;
    color: var(--text-primary);
    display: block;
  }

  .modal-subtitle {
    font-size: 24rpx;
    color: var(--text-tertiary);
    margin-top: 8rpx;
    display: block;
  }
}

.modal-content {
  flex: 1;
  max-height: 50vh;
  padding: 16rpx;
}

.admin-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  border-radius: 16rpx;
  gap: 20rpx;
  transition: background 0.2s;

  &.selected {
    background: rgba(99, 102, 241, 0.1);
  }
}

.admin-info {
  flex: 1;
  min-width: 0;

  .admin-name {
    font-size: 28rpx;
    color: var(--text-primary);
    display: block;
  }

  .admin-role {
    font-size: 22rpx;
    color: var(--text-tertiary);
    margin-top: 4rpx;
    display: block;
  }
}

.check-box {
  width: 40rpx;
  height: 40rpx;
  border-radius: 8rpx;
  border: 2rpx solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &.checked {
    background: var(--color-primary);
    border-color: var(--color-primary);
  }

  &.radio {
    border-radius: 50%;

    .radio-dot {
      width: 20rpx;
      height: 20rpx;
      border-radius: 50%;
      background: var(--color-primary);
    }
  }
}

.modal-footer {
  padding: 24rpx 32rpx;
  border-top: 1rpx solid var(--divider-color);
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
}

// 禁言弹窗样式
.mute-modal {
  background: var(--bg-content);

  .mute-options {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16rpx;
    padding: 32rpx;
  }

  .mute-option {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24rpx 16rpx;
    background: var(--bg-hover);
    border-radius: 16rpx;
    font-size: 28rpx;
    color: var(--text-primary);
    transition: all 0.2s;

    &:active {
      transform: scale(0.98);
      background: var(--bg-active);
    }

    &.danger {
      background: rgba(249, 115, 22, 0.1);
      color: #f97316;
    }
  }
}
</style>
