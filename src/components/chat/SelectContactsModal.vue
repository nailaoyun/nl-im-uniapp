<template>
  <wd-popup
    v-model="modelValue"
    position="bottom"
    :safe-area-inset-bottom="true"
    custom-style="border-radius: 24rpx 24rpx 0 0; max-height: 80vh;"
    @close="handleClose"
  >
    <view class="contacts-modal" :class="{ dark: isDark }">
      <!-- 头部 -->
      <view class="modal-header">
        <view class="header-info">
          <text class="header-title">{{ title || (mode === 'invite' ? '邀请好友' : '选择联系人') }}</text>
          <text class="header-subtitle">已选择 {{ selectedContacts.length }} 人</text>
        </view>
        <wd-icon
          name="close"
          size="40rpx"
          color="var(--text-secondary)"
          @click="handleClose"
        />
      </view>

      <!-- 搜索框 -->
      <view class="search-bar">
        <wd-search
          v-model="searchQuery"
          placeholder="搜索联系人..."
          hide-cancel
        />
      </view>

      <!-- 已选联系人 -->
      <scroll-view v-if="selectedContacts.length > 0" class="selected-bar" scroll-x>
        <view
          v-for="contact in selectedContacts"
          :key="contact.id"
          class="selected-tag"
          @click="removeContact(contact.id || contact.user_id || '')"
        >
          <text class="tag-name">{{ contact.user?.name || contact.remark_name }}</text>
          <wd-icon name="close" size="24rpx" color="#fff" />
        </view>
      </scroll-view>

      <!-- 联系人列表 -->
      <scroll-view class="contact-list" scroll-y>
        <view v-if="filteredContacts.length === 0" class="empty-state">
          <wd-icon name="search" size="80rpx" color="var(--text-tertiary)" />
          <text class="empty-text">暂无联系人</text>
        </view>

        <view
          v-for="contact in filteredContacts"
          :key="contact.id"
          class="contact-item"
          :class="{ selected: isSelected(contact.id || contact.user_id || '') }"
          @click="toggleContact(contact)"
        >
          <app-avatar
            :src="contact.user?.avatar"
            :name="contact.user?.name || contact.remark_name || '?'"
            :size="80"
            radius="50%"
          />
          <view class="contact-info">
            <text class="contact-name">{{ contact.user?.name || contact.remark_name }}</text>
            <text v-if="contact.user?.desc" class="contact-desc">{{ contact.user.desc }}</text>
          </view>
          <view class="check-box" :class="{ checked: isSelected(contact.id || contact.user_id || '') }">
            <wd-icon
              v-if="isSelected(contact.id || contact.user_id || '')"
              name="check"
              size="24rpx"
              color="#fff"
            />
          </view>
        </view>
      </scroll-view>

      <!-- 群名称输入（创建模式） -->
      <view v-if="mode === 'create'" class="group-name-input">
        <wd-input
          v-model="groupName"
          placeholder="请输入群名称（必填）"
          :maxlength="20"
          no-border
        />
      </view>

      <!-- 底部操作 -->
      <view class="modal-footer">
        <wd-button plain @click="handleClose">取消</wd-button>
        <wd-button
          type="primary"
          :disabled="selectedContacts.length < 1 || (mode === 'create' && !groupName.trim())"
          @click="handleConfirm"
        >
          {{ mode === 'invite' ? '邀请' : '创建群聊' }}
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTheme } from '@/composables/useTheme'
import AppAvatar from '@/components/common/AppAvatar.vue'
import type { Contact } from '@/types/api'

const props = withDefaults(defineProps<{
  modelValue: boolean
  contacts: Contact[]
  mode?: 'create' | 'invite'
  title?: string
}>(), {
  mode: 'create'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'create': [data: { member_ids: string[]; name?: string; avatar?: string }]
  'invite': [data: { member_ids: string[] }]
  'select': [contacts: Contact[]]
}>()

const { isDark } = useTheme()
const searchQuery = ref('')
const groupName = ref('')
const selectedContacts = ref<Contact[]>([])

// 重置状态
watch(() => props.modelValue, (val) => {
  if (val) {
    searchQuery.value = ''
    groupName.value = ''
    selectedContacts.value = []
  }
})

// 过滤联系人
const filteredContacts = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return props.contacts.filter(c => {
    const name = (c.user?.name || c.remark_name || '').toLowerCase()
    return name.includes(query)
  })
})

// 判断是否选中
function isSelected(contactId: string): boolean {
  return selectedContacts.value.some(c => (c.id || c.user_id) === contactId)
}

// 切换选择
function toggleContact(contact: Contact) {
  const contactId = contact.id || contact.user_id || ''
  const index = selectedContacts.value.findIndex(c => (c.id || c.user_id) === contactId)
  if (index > -1) {
    selectedContacts.value.splice(index, 1)
  } else {
    selectedContacts.value.push(contact)
  }
}

// 移除已选
function removeContact(contactId: string) {
  const index = selectedContacts.value.findIndex(c => (c.id || c.user_id) === contactId)
  if (index > -1) {
    selectedContacts.value.splice(index, 1)
  }
}

// 确认
function handleConfirm() {
  if (selectedContacts.value.length < 1) return

  const memberIds = selectedContacts.value.map(c => c.user_id || c.id).filter(Boolean) as string[]

  if (props.mode === 'invite') {
    emit('invite', { member_ids: memberIds })
    emit('select', selectedContacts.value)
  } else {
    if (!groupName.value.trim()) return
    emit('create', {
      member_ids: memberIds,
      name: groupName.value.trim(),
      avatar: groupName.value.charAt(0).toUpperCase()
    })
  }

  handleClose()
}

function handleClose() {
  emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
.contacts-modal {
  display: flex;
  flex-direction: column;
  background: var(--bg-content);
  max-height: 80vh;
}

.modal-header {
  padding: 32rpx;
  border-bottom: 1rpx solid var(--divider-color);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.header-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.header-subtitle {
  font-size: 24rpx;
  color: var(--text-tertiary);
}

.search-bar {
  padding: 16rpx 24rpx;
  background: var(--bg-hover);
}

.selected-bar {
  padding: 16rpx 24rpx;
  white-space: nowrap;
  border-bottom: 1rpx solid var(--divider-color);
}

.selected-tag {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  background: var(--color-primary);
  border-radius: 24rpx;
  margin-right: 12rpx;

  .tag-name {
    font-size: 24rpx;
    color: #fff;
    max-width: 120rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.contact-list {
  flex: 1;
  max-height: 50vh;
  padding: 16rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx;
  gap: 16rpx;

  .empty-text {
    font-size: 26rpx;
    color: var(--text-tertiary);
  }
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  border-radius: 16rpx;
  gap: 20rpx;
  transition: background 0.2s;

  &.selected {
    background: rgba(var(--color-primary-rgb), 0.1);
  }
}

.contact-info {
  flex: 1;
  min-width: 0;

  .contact-name {
    font-size: 28rpx;
    color: var(--text-primary);
    display: block;
  }

  .contact-desc {
    font-size: 22rpx;
    color: var(--text-tertiary);
    margin-top: 4rpx;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.check-box {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 2rpx solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &.checked {
    background: var(--color-primary);
    border-color: var(--color-primary);
  }
}

.group-name-input {
  padding: 16rpx 24rpx;
  border-top: 1rpx solid var(--divider-color);
  background: var(--bg-hover);
}

.modal-footer {
  padding: 24rpx 32rpx;
  border-top: 1rpx solid var(--divider-color);
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
}
</style>

