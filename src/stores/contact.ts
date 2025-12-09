/**
 * 联系人状态管理
 */
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { storage } from '@/utils/storage'
import type { FriendRequest, ContactGroup, Contact } from '@/types/api'

export type LeftPanelMode = 'default' | 'friend-manager' | 'friend-notify' | 'group-notify'

export const useContactStore = defineStore('contact', () => {
  const friendRequests = ref<FriendRequest[]>([])
  const groups = ref<ContactGroup[]>([])
  const leftPanelMode = ref<LeftPanelMode>(storage.getContactLeftPanelMode() as LeftPanelMode)
  const selectedContact = ref<Contact | null>(null)
  const contactListTab = ref<'friends' | 'groups'>(storage.getContactListTab())

  /**
   * 设置好友申请列表
   */
  function setFriendRequests(requests: FriendRequest[]) {
    friendRequests.value = requests
  }

  /**
   * 添加好友申请
   */
  function addFriendRequest(request: FriendRequest) {
    friendRequests.value.push(request)
  }

  /**
   * 移除好友申请
   */
  function removeFriendRequest(requestId: number) {
    const index = friendRequests.value.findIndex((r) => r.id === requestId)
    if (index > -1) {
      friendRequests.value.splice(index, 1)
    }
  }

  /**
   * 设置分组列表
   */
  function setGroups(newGroups: ContactGroup[]) {
    groups.value = newGroups
  }

  /**
   * 添加分组
   */
  function addGroup(group: ContactGroup) {
    groups.value.push(group)
  }

  /**
   * 更新分组
   */
  function updateGroup(group: ContactGroup) {
    const index = groups.value.findIndex((g) => g.id === group.id)
    if (index > -1) {
      groups.value[index] = group
    }
  }

  /**
   * 删除分组
   */
  function removeGroup(groupId: number) {
    const index = groups.value.findIndex((g) => g.id === groupId)
    if (index > -1) {
      groups.value.splice(index, 1)
    }
  }

  /**
   * 设置左侧面板模式
   */
  function setLeftPanelMode(mode: LeftPanelMode) {
    leftPanelMode.value = mode
    storage.setContactLeftPanelMode(mode)
    // 切换到管理/通知模式时，清除选中联系人
    if (mode !== 'default') {
      selectedContact.value = null
    }
  }

  /**
   * 设置选中的联系人
   */
  function setSelectedContact(contact: Contact | null) {
    selectedContact.value = contact
    // 选中联系人时，切换到默认模式
    if (contact) {
      leftPanelMode.value = 'default'
    }
  }

  // 监听 contactListTab 变化并保存
  watch(contactListTab, (newTab) => {
    storage.setContactListTab(newTab)
  })

  return {
    friendRequests,
    groups,
    leftPanelMode,
    selectedContact,
    contactListTab,
    setFriendRequests,
    addFriendRequest,
    removeFriendRequest,
    setGroups,
    addGroup,
    updateGroup,
    removeGroup,
    setLeftPanelMode,
    setSelectedContact
  }
})
