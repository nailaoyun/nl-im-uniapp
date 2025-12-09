<template>
  <view class="create-page">
    <!-- 导航栏 -->
    <app-nav-bar title="创建群聊" />
    
    <!-- 群名称 -->
    <wd-cell-group>
      <wd-input
        v-model="form.name"
        label="群名称"
        placeholder="请输入群名称"
        :maxlength="20"
        clearable
      />
    </wd-cell-group>

    <!-- 选择成员 -->
    <view class="members-section">
      <view class="section-header">
        <text class="title">选择成员</text>
        <text class="count">已选 {{ selectedIds.length }} 人</text>
      </view>

      <view v-if="loadingContacts" class="loading-state">
        <wd-loading />
        <text>加载中...</text>
      </view>

      <template v-else>
        <view
          v-for="contact in contacts"
          :key="contact.id"
          class="contact-item"
          @click="toggleSelect(contact)"
        >
          <wd-checkbox
            :model-value="selectedIds.includes(contact.contact_user_id)"
            @change="toggleSelect(contact)"
          />
          <app-avatar
            :src="contact.user?.avatar"
            :name="contact.remark_name || contact.user?.name"
            :size="72"
            radius="8rpx"
          />
          <text class="name">{{ contact.remark_name || contact.user?.name || '未知' }}</text>
        </view>
      </template>
    </view>

    <!-- 底部按钮 -->
    <view class="footer-section">
      <wd-button
        type="primary"
        block
        :loading="creating"
        :disabled="!canCreate"
        @click="createGroup"
      >
        创建群聊 ({{ selectedIds.length }})
      </wd-button>
    </view>

    <wd-toast />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import * as contactApi from '@/api/modules/contact'
import * as roomApi from '@/api/modules/room'
import { generateColor } from '@/utils/format'
import { useToast } from 'wot-design-uni'
import AppAvatar from '@/components/common/AppAvatar.vue'
import type { Contact } from '@/types/api'

const toast = useToast()

const loadingContacts = ref(true)
const creating = ref(false)
const contacts = ref<Contact[]>([])
const selectedIds = ref<string[]>([])
const form = ref({
  name: ''
})

const canCreate = computed(() => form.value.name.trim() && selectedIds.value.length >= 2)

onMounted(async () => {
  await loadContacts()
})

async function loadContacts() {
  loadingContacts.value = true
  try {
    contacts.value = await contactApi.getContacts()
  } catch (error) {
    console.error('加载联系人失败:', error)
  } finally {
    loadingContacts.value = false
  }
}

function toggleSelect(contact: Contact) {
  const id = contact.contact_user_id
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

async function createGroup() {
  if (!canCreate.value) return

  creating.value = true
  try {
    const group = await roomApi.createGroup({
      name: form.value.name.trim(),
      member_ids: selectedIds.value
    })
    toast.success('创建成功')

    // 跳转到群聊
    setTimeout(() => {
      uni.redirectTo({
        url: `/pages/chat/index?roomId=${group.room_id}&name=${encodeURIComponent(group.name)}`
      })
    }, 1000)
  } catch (error) {
    toast.error('创建失败')
  } finally {
    creating.value = false
  }
}
</script>

<style lang="scss" scoped>
.create-page {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: 160rpx;
}

.members-section {
  background: var(--bg-content);
  margin-top: 20rpx;

  .section-header {
    display: flex;
    justify-content: space-between;
    padding: 20rpx 30rpx;
    border-bottom: 1rpx solid var(--divider-color);

    .title {
      font-size: 28rpx;
      color: var(--text-tertiary);
    }

    .count {
      font-size: 28rpx;
      color: var(--color-primary);
    }
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx;
  color: var(--text-tertiary);
  gap: 20rpx;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid var(--divider-color);

  .avatar-placeholder {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8rpx;
    margin-left: 20rpx;
    color: #fff;
    font-size: 28rpx;
    font-weight: 600;
  }

  .name {
    flex: 1;
    margin-left: 20rpx;
    font-size: 32rpx;
    color: var(--text-primary);
  }
}

.footer-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: var(--bg-content);
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}
</style>
