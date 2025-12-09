/**
 * 聊天状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ChatMessage, Contact } from '@/types/api'
import { generateColor } from '@/utils/format'

export const useChatStore = defineStore('chat', () => {
  const currentTarget = ref<Contact | null>(null)
  const messages = ref<Record<string, ChatMessage[]>>({})
  const contacts = ref<Contact[]>([])

  const totalUnread = computed(() => contacts.value.reduce((acc, c) => acc + (c.unread || 0), 0))

  /**
   * 设置当前聊天对象
   */
  function setCurrentTarget(contact: Contact | null) {
    currentTarget.value = contact
    if (contact) {
      contact.unread = 0
      // 如果是群聊，标记 is_group
      if (contact.room_type === 'group' || contact.room_id?.startsWith('group_')) {
        contact.is_group = true
      }
    }
  }

  /**
   * 添加消息
   */
  function addMessage(roomId: string, message: ChatMessage) {
    if (!messages.value[roomId]) {
      messages.value[roomId] = []
    }
    messages.value[roomId].push(message)
  }

  /**
   * 获取房间消息
   */
  function getRoomMessages(roomId: string): ChatMessage[] {
    return messages.value[roomId] || []
  }

  /**
   * 设置房间消息
   */
  function setRoomMessages(roomId: string, msgs: ChatMessage[]) {
    messages.value[roomId] = msgs
  }

  /**
   * 更新联系人列表
   */
  function setContacts(newContacts: Contact[]) {
    // 为每个联系人生成颜色
    contacts.value = newContacts.map((contact) => ({
      ...contact,
      color: contact.color || generateColor(contact.user_id || contact.id)
    }))
  }

  /**
   * 更新联系人最后消息
   */
  function updateContactLastMsg(contactIdOrRoomId: string, lastMsg: string, lastTime: number) {
    // 优先按 room_id 匹配（群聊场景）
    let contact = contacts.value.find((c) => c.room_id === contactIdOrRoomId)
    // 如果没有找到，再按 id 或 user_id 匹配（单聊场景）
    if (!contact) {
      contact = contacts.value.find((c) => c.id === contactIdOrRoomId || c.user_id === contactIdOrRoomId)
    }
    if (contact) {
      contact.last_msg = lastMsg
      contact.last_time = lastTime
    }
  }

  /**
   * 增加联系人未读数
   */
  function incrementUnread(contactIdOrRoomId: string) {
    // 优先按 room_id 匹配（群聊场景）
    let contact = contacts.value.find((c) => c.room_id === contactIdOrRoomId)
    // 如果没有找到，再按 id 或 user_id 匹配（单聊场景）
    if (!contact) {
      contact = contacts.value.find((c) => c.id === contactIdOrRoomId || c.user_id === contactIdOrRoomId)
    }
    if (contact && contact.id !== currentTarget.value?.id && contact.room_id !== currentTarget.value?.room_id) {
      contact.unread = (contact.unread || 0) + 1
    }
  }

  /**
   * 清空房间消息
   */
  function clearRoomMessages(roomId: string) {
    messages.value[roomId] = []
  }

  /**
   * 移除单条消息
   */
  function removeMessage(roomId: string, messageId: number) {
    if (messages.value[roomId]) {
      const index = messages.value[roomId].findIndex(m => m.id === messageId)
      if (index > -1) {
        messages.value[roomId].splice(index, 1)
      }
    }
  }

  // 群通知相关状态
  const lastGroupNotification = ref<{ room_id: string; type: string; data: any } | null>(null)
  const myMuteStatus = ref<Record<string, string | null>>({}) // room_id -> muted_until

  /**
   * 设置最后的群通知（用于触发群面板刷新）
   */
  function setLastGroupNotification(notification: { room_id: string; type: string; data: any }) {
    lastGroupNotification.value = { ...notification, _timestamp: Date.now() } as any
  }

  /**
   * 设置我在某个群的禁言状态
   */
  function setMyMuteStatus(roomId: string, mutedUntil: string | null) {
    myMuteStatus.value[roomId] = mutedUntil
  }

  /**
   * 获取我在某个群是否被禁言
   */
  function isMyMuted(roomId: string): boolean {
    const mutedUntil = myMuteStatus.value[roomId]
    if (!mutedUntil) return false
    return new Date(mutedUntil) > new Date()
  }

  /**
   * 获取我的禁言到期时间
   */
  function getMyMutedUntil(roomId: string): string | null {
    return myMuteStatus.value[roomId] || null
  }

  return {
    currentTarget,
    messages,
    contacts,
    totalUnread,
    lastGroupNotification,
    myMuteStatus,
    setCurrentTarget,
    addMessage,
    getRoomMessages,
    setRoomMessages,
    setContacts,
    updateContactLastMsg,
    incrementUnread,
    clearRoomMessages,
    removeMessage,
    setLastGroupNotification,
    setMyMuteStatus,
    isMyMuted,
    getMyMutedUntil
  }
})
