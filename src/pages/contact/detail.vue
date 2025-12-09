<template>
  <view class="detail-page" :class="{ dark: isDark }">
    <!-- 导航栏 -->
    <app-nav-bar title="好友详情" />
    
    <view v-if="loading" class="loading-state">
      <wd-loading />
      <text>加载中...</text>
    </view>

    <template v-else-if="contact">
      <!-- 用户信息 -->
      <view class="header-section">
        <app-avatar
          :src="contact.user?.avatar"
          :name="contact.remark_name || contact.user?.name"
          :size="140"
          radius="12rpx"
        />
        <view class="user-info">
          <text class="name">{{ contact.remark_name || contact.user?.name || '未知' }}</text>
          <text class="id">ID: {{ contact.user?.id || '-' }}</text>
        </view>
      </view>

      <!-- 基本信息 -->
      <wd-cell-group>
        <wd-cell title="备注名" :value="contact.remark_name || '未设置'" is-link @click="editRemark" />
        <wd-cell title="个性签名" :value="contact.user?.desc || '暂无'" />
        <wd-cell title="地区" :value="contact.user?.region || '未知'" />
      </wd-cell-group>

      <!-- 设置 -->
      <wd-cell-group title="聊天设置">
        <wd-cell title="置顶聊天" center>
          <template #value>
            <wd-switch v-model="contact.is_top" @change="toggleTop" />
          </template>
        </wd-cell>
        <wd-cell title="消息免打扰" center>
          <template #value>
            <wd-switch v-model="contact.is_muted" @change="toggleMute" />
          </template>
        </wd-cell>
        <wd-cell title="加入黑名单" center>
          <template #value>
            <wd-switch v-model="contact.is_blocked" @change="toggleBlock" />
          </template>
        </wd-cell>
      </wd-cell-group>

      <!-- 操作按钮 -->
      <view class="actions-section">
        <view class="action-row">
          <wd-button type="primary" class="flex-btn" @click="goChat">
            <wd-icon name="chat" size="36rpx" />
            <text>发消息</text>
          </wd-button>
          <wd-button type="info" class="flex-btn" @click="startAudioCall">
            <wd-icon name="phone" size="36rpx" />
            <text>语音</text>
          </wd-button>
          <wd-button type="success" class="flex-btn" @click="startVideoCall">
            <wd-icon name="video" size="36rpx" />
            <text>视频</text>
          </wd-button>
        </view>
        <wd-button type="error" block plain @click="deleteFriend">删除好友</wd-button>
      </view>
    </template>

    <wd-toast />
    <wd-message-box />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import * as contactApi from '@/api/modules/contact'
import { generateColor } from '@/utils/format'
import { resolveImageUrl } from '@/utils/image'
import { useToast, useMessage } from 'wot-design-uni'
import { useTheme } from '@/composables/useTheme'
import AppAvatar from '@/components/common/AppAvatar.vue'
import type { Contact } from '@/types/api'

const toast = useToast()
const messageBox = useMessage()
const { isDark } = useTheme()

const loading = ref(true)
const contact = ref<Contact | null>(null)
const contactId = ref('')
const userId = ref('')

onLoad((options: any) => {
  contactId.value = options?.id || ''
  userId.value = options?.userId || ''
})

onMounted(async () => {
  if (contactId.value) {
    await loadContact()
  } else if (userId.value) {
    await loadContactByUserId()
  }
})

async function loadContact() {
  loading.value = true
  try {
    contact.value = await contactApi.getContactDetail(contactId.value)
  } catch (error) {
    console.error('加载联系人失败:', error)
    toast.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 通过用户 ID 查找联系人
async function loadContactByUserId() {
  loading.value = true
  try {
    // 获取所有联系人，找到对应的用户
    const contacts = await contactApi.getContacts()
    const found = contacts.find((c: Contact) => c.contact_user_id === userId.value || c.user_id === userId.value)
    if (found) {
      contact.value = await contactApi.getContactDetail(found.id?.toString() || '')
    } else {
      toast.warning('未找到该联系人')
      setTimeout(() => uni.navigateBack(), 1500)
    }
  } catch (error) {
    console.error('加载联系人失败:', error)
    toast.error('加载失败')
  } finally {
    loading.value = false
  }
}

function goChat() {
  if (!contact.value) return
  uni.navigateTo({
    url: `/pages/chat/index?targetId=${contact.value.contact_user_id}&roomId=${contact.value.room_id || ''}&name=${encodeURIComponent(contact.value.remark_name || contact.value.user?.name || '')}&avatar=${encodeURIComponent(contact.value.user?.avatar || '')}`
  })
}

function startAudioCall() {
  if (!contact.value) return
  uni.navigateTo({
    url: `/pages/chat/index?targetId=${contact.value.contact_user_id}&roomId=${contact.value.room_id || ''}&name=${encodeURIComponent(contact.value.remark_name || contact.value.user?.name || '')}&avatar=${encodeURIComponent(contact.value.user?.avatar || '')}&callType=audio`
  })
}

function startVideoCall() {
  if (!contact.value) return
  uni.navigateTo({
    url: `/pages/chat/index?targetId=${contact.value.contact_user_id}&roomId=${contact.value.room_id || ''}&name=${encodeURIComponent(contact.value.remark_name || contact.value.user?.name || '')}&avatar=${encodeURIComponent(contact.value.user?.avatar || '')}&callType=video`
  })
}

async function editRemark() {
  if (!contact.value) return
  try {
    const { value } = await messageBox.prompt({
      title: '修改备注名',
      inputValue: contact.value.remark_name || '',
      inputPlaceholder: '请输入备注名'
    })

    await contactApi.updateContact(contactId.value, { remark_name: value })
    contact.value.remark_name = value
    toast.success('修改成功')
  } catch (e: any) {
    if (e !== 'cancel') {
      toast.error('修改失败')
    }
  }
}

async function toggleTop() {
  if (!contact.value) return
  try {
    await contactApi.updateContact(contactId.value, { is_top: contact.value.is_top })
    toast.success(contact.value.is_top ? '已置顶' : '已取消置顶')
  } catch {
    contact.value.is_top = !contact.value.is_top
    toast.error('操作失败')
  }
}

async function toggleMute() {
  if (!contact.value) return
  try {
    await contactApi.updateContact(contactId.value, { is_muted: contact.value.is_muted })
    toast.success(contact.value.is_muted ? '已开启免打扰' : '已关闭免打扰')
  } catch {
    contact.value.is_muted = !contact.value.is_muted
    toast.error('操作失败')
  }
}

async function toggleBlock() {
  if (!contact.value) return
  try {
    await contactApi.updateContact(contactId.value, { is_blocked: contact.value.is_blocked })
    toast.success(contact.value.is_blocked ? '已加入黑名单' : '已移出黑名单')
  } catch {
    contact.value.is_blocked = !contact.value.is_blocked
    toast.error('操作失败')
  }
}

async function deleteFriend() {
  try {
    await messageBox.confirm({
      title: '提示',
      msg: '确定要删除该好友吗？删除后将无法恢复'
    })

    await contactApi.deleteContact(contactId.value)
    toast.success('删除成功')
    setTimeout(() => {
      uni.navigateBack()
    }, 1000)
  } catch (e: any) {
    if (e !== 'cancel') {
      toast.error('删除失败')
    }
  }
}
</script>

<style lang="scss" scoped>
.detail-page {
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
  align-items: center;
  padding: 40rpx 30rpx;
  background: var(--bg-content);
  margin-bottom: 20rpx;

  .avatar-placeholder {
    width: 140rpx;
    height: 140rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12rpx;
    color: #fff;
    font-size: 56rpx;
    font-weight: 600;
  }
}

.user-info {
  margin-left: 30rpx;

  .name {
    display: block;
    font-size: 40rpx;
    color: var(--text-primary);
    font-weight: 600;
    margin-bottom: 8rpx;
  }

  .id {
    display: block;
    font-size: 26rpx;
    color: var(--text-tertiary);
  }
}

.actions-section {
  padding: 60rpx 30rpx;
  padding-bottom: calc(60rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 24rpx;

  .action-row {
    display: flex;
    gap: 20rpx;
  }

  .flex-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
  }
}
</style>
