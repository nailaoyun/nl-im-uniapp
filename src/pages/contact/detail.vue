<template>
  <view class="detail-page">
    <view v-if="loading" class="loading-state">
      <wd-loading />
      <text>加载中...</text>
    </view>

    <template v-else-if="contact">
      <!-- 用户信息 -->
      <view class="header-section">
        <wd-img
          v-if="contact.user?.avatar"
          :src="contact.user.avatar"
          width="140rpx"
          height="140rpx"
          radius="12rpx"
        />
        <view v-else class="avatar-placeholder" :style="{ background: generateColor(contact.user?.name || '') }">
          {{ contact.user?.name?.charAt(0) || '?' }}
        </view>
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
        <wd-button type="primary" block @click="goChat">发消息</wd-button>
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
import { useToast, useMessage } from 'wot-design-uni'
import type { Contact } from '@/types/api'

const toast = useToast()
const messageBox = useMessage()

const loading = ref(true)
const contact = ref<Contact | null>(null)
const contactId = ref('')

onLoad((options: any) => {
  contactId.value = options?.id || ''
})

onMounted(async () => {
  if (contactId.value) {
    await loadContact()
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

function goChat() {
  if (!contact.value) return
  uni.navigateTo({
    url: `/pages/chat/index?id=${contact.value.contact_user_id}&roomId=${contact.value.room_id || ''}&name=${encodeURIComponent(contact.value.remark_name || contact.value.user?.name || '')}`
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
}
</style>
