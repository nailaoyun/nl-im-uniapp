/**
 * WebRTC Store - 管理 WebRTC 状态和回调
 * 参考 nl-im-vue-ts/src/stores/webrtc.ts 实现
 */
import { defineStore } from 'pinia'
import { useWebRTC } from '@/composables/useWebRTC'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useConversationStore } from '@/stores/conversation'
import { storage } from '@/utils/storage'

export const useWebRTCStore = defineStore('webrtc', () => {
  const authStore = useAuthStore()
  const chatStore = useChatStore()
  const conversationStore = useConversationStore()

  // --- 回调：处理收到来电 ---
  function handleIncomingCall(senderUserId: string) {
    // 查找来电者的联系人信息
    const contact = chatStore.contacts.find(
      (c) => c.user_id === senderUserId || c.id === senderUserId || c.contact_user_id === senderUserId
    )
    // 在 UniApp 中，来电处理由 useWebRTC composable 内部完成
    // 这里可以做额外的业务逻辑，如跳转到聊天页面
    if (contact) {
      console.log('📞 来电来自:', contact.remark_name || contact.user?.name)
    }
  }

  // --- 回调：获取房间ID策略 ---
  // 这个函数定义了如何找到两个人聊天的房间ID
  function getRoomId(receiverUserId?: string): string {
    // 策略 1: 优先从本地存储获取当前选中的房间ID (最准确)
    const cachedRoomId = storage.getSelectedRoomId()
    if (cachedRoomId) {
      return cachedRoomId
    }

    // 策略 2: 如果提供了接收者ID，尝试从联系人列表中查找对应的 room_id
    if (receiverUserId) {
      const contact = chatStore.contacts.find(
        (c) =>
          c.user_id === receiverUserId ||
          c.id === receiverUserId ||
          c.contact_user_id === receiverUserId
      )
      if (contact && contact.room_id) {
        return contact.room_id
      }
    }

    // 策略 3: 尝试从会话列表中查找
    if (receiverUserId) {
      const conversation = conversationStore.conversations.find(
        (c) => c.target_id === receiverUserId
      )
      if (conversation && conversation.room_id) {
        return conversation.room_id
      }
    }

    // 策略 4: 生成临时房间ID（两个用户ID排序后拼接）
    if (receiverUserId && authStore.user?.id) {
      return [authStore.user.id, receiverUserId].sort().join('_')
    }

    // 如果都找不到，返回空字符串
    return ''
  }

  // --- 获取 WebRTC 实例 ---
  // useWebRTC 是全局单例，直接返回
  const webrtc = useWebRTC()

  // --- 初始化监听器 ---
  function initListener() {
    webrtc.initListener()
  }

  return {
    webrtc,
    getRoomId,
    handleIncomingCall,
    initListener,
  }
})

