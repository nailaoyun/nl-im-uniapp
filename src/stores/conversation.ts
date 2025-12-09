/**
 * 会话状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Conversation } from '@/types/conversation'
import type { ChatMessage } from '@/types/api'
import * as conversationApi from '@/api/modules/conversation'
import * as groupApi from '@/api/modules/room'
import { getMessageSummary } from '@/utils/message'
import { useChatStore } from './chat'

export const useConversationStore = defineStore('conversation', () => {
  const conversations = ref<Conversation[]>([])
  const loading = ref(false)

  // 计算总未读数
  const totalUnread = computed(() => conversations.value.reduce((acc, c) => acc + (c.is_muted ? 0 : c.unread_count), 0))

  /**
   * 初始化加载会话列表
   */
  async function loadConversations() {
    loading.value = true
    try {
      const list = await conversationApi.getConversationList()
      // 后端返回的数据需要简单处理一下
      conversations.value = list
        .map((c: any) => {
          const isGroup = c.type === 2 // type: 1=私聊, 2=群聊
          const roomType = isGroup ? 'group' : 'p2p'

          // 将后端的 room 字段映射为前端的 target_group
          const targetGroup = c.room || c.target_group

          // 转换 last_time 为时间戳（确保排序正确）
          let lastTime = c.last_time
          if (typeof lastTime === 'string') {
            lastTime = new Date(lastTime).getTime()
          } else if (!lastTime) {
            lastTime = 0
          }

          return {
            ...c,
            room_type: roomType,
            is_group: isGroup,
            // 群聊显示群名称，单聊显示用户名称
            name: isGroup
              ? targetGroup?.room_name || targetGroup?.name || c.name || c.room_id || '群聊'
              : c.target_user?.name || c.name || '未知用户',
            avatar: isGroup
              ? targetGroup?.room_avatar || targetGroup?.avatar || c.avatar || ''
              : c.target_user?.avatar || c.avatar || '',
            // 群聊相关字段
            room_id: isGroup ? c.room_id || c.target_id : c.room_id,
            member_count: targetGroup?.member_count,
            owner_id: targetGroup?.owner_id,
            // 确保 last_time 是时间戳
            last_time: lastTime,
            last_message_time: c.last_time || c.last_message_time,
            // 映射 room 为 target_group（前端期望的字段名）
            target_group: targetGroup
              ? {
                  id: targetGroup.room_id || targetGroup.id,
                  room_id: targetGroup.room_id,
                  room_type: 'group',
                  name: targetGroup.room_name || targetGroup.name,
                  avatar: targetGroup.room_avatar || targetGroup.avatar,
                  owner_id: targetGroup.owner_id,
                  member_count: targetGroup.member_count,
                  created_at: targetGroup.created_at
                }
              : undefined
          }
        })
        .sort((a: any, b: any) => {
          // 确保排序：置顶优先 > 时间倒序（最新在最上面）
          if (a.is_top !== b.is_top) return a.is_top ? -1 : 1
          return (b.last_time || 0) - (a.last_time || 0)
        })

      // 对于群聊信息缺失的会话，尝试异步获取群信息
      conversations.value.forEach(async (conv) => {
        if (conv.is_group && conv.room_id && !conv.target_group && !conv.name) {
          try {
            const groupInfo = await groupApi.getGroup(conv.room_id)
            // 更新会话的群信息
            const index = conversations.value.findIndex((c) => c.id === conv.id)
            if (index !== -1) {
              conversations.value[index].target_group = groupInfo as any
              conversations.value[index].name = (groupInfo as any).room_name || groupInfo.name || conv.room_id
              conversations.value[index].avatar = (groupInfo as any).room_avatar || groupInfo.avatar
              conversations.value[index].member_count = groupInfo.member_count
              conversations.value[index].owner_id = groupInfo.owner_id
            }
          } catch (error) {
            console.error(`Failed to fetch group info for room ${conv.room_id}:`, error)
          }
        }
      })
    } catch (error) {
      console.error('Fetch conversations failed:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 处理新消息 (发送或接收)
   */
  function handleMessageUpdate(message: ChatMessage, isSelf: boolean, isCurrentChat: boolean = false) {
    // 群聊和单聊统一使用 room_id 定位会话
    const roomId = message.room_id
    if (!roomId) return

    // 优先按 room_id 匹配（群聊和单聊都支持）
    let conv = conversations.value.find((c) => c.room_id === roomId)
    // 如果没有 room_id，回退到按 target_id 匹配（兼容旧逻辑）
    if (!conv) {
      const targetId = isSelf ? message.receiver_user_id : message.sender_user_id
      if (targetId) {
        conv = conversations.value.find((c) => c.target_id === targetId)
      }
    }

    // 判断是否为群聊
    const isGroupChat = conv?.type === 2 || conv?.is_group

    // 生成摘要：群聊时需要包含发送者信息
    let summary = getMessageSummary(message)
    if (isGroupChat && !isSelf && message.sender_user_id) {
      // 从 chatStore 中查找发送者信息
      const chatStore = useChatStore()
      const senderContact = chatStore.contacts.find(
        (c) => c.user_id === message.sender_user_id || c.id === message.sender_user_id
      )
      if (senderContact) {
        const senderName = senderContact.remark_name || senderContact.user?.name || '未知用户'
        summary = `${senderName}：${summary}`
      }
    }

    const now = new Date(message.created_at || Date.now()).getTime()

    if (conv) {
      conv.last_message = summary
      conv.last_time = now
      // 如果不是自己发送的，且不是当前选中的聊天，且未设置免打扰，则增加未读数
      if (!isSelf && !isCurrentChat && !conv.is_muted) {
        conv.unread_count = (conv.unread_count || 0) + 1
      }
    } else {
      // 新会话直接重新拉取，保证与后端一致
      loadConversations()
      return
    }

    // 更新后重新排序，确保最新消息在最上面
    sortConversations()
  }

  /**
   * 增加未读数
   */
  function incrementUnread(targetIdOrRoomId: string) {
    // 优先按 room_id 匹配（群聊场景）
    let conv = conversations.value.find((c) => c.room_id === targetIdOrRoomId)
    // 如果没有找到，再按 target_id 匹配（单聊场景）
    if (!conv) {
      conv = conversations.value.find((c) => c.target_id === targetIdOrRoomId)
    }
    if (conv) {
      conv.unread_count = (conv.unread_count || 0) + 1
    }
  }

  /**
   * 清除未读数 (同步后端)
   */
  async function clearUnread(targetIdOrRoomId: string) {
    // 优先按 room_id 匹配（群聊场景）
    let conv = conversations.value.find((c) => c.room_id === targetIdOrRoomId)
    // 如果没有找到，再按 target_id 匹配（单聊场景）
    if (!conv) {
      conv = conversations.value.find((c) => c.target_id === targetIdOrRoomId)
    }
    if (conv && conv.unread_count > 0) {
      conv.unread_count = 0
      // 调用后端接口
      try {
        await conversationApi.resetUnread(conv.target_id || targetIdOrRoomId)
      } catch (e) {
        console.error(e)
      }
    }
  }

  /**
   * 排序
   */
  function sortConversations() {
    conversations.value.sort((a, b) => {
      if (a.is_top !== b.is_top) return a.is_top ? -1 : 1
      return b.last_time - a.last_time
    })
  }

  return {
    conversations,
    loading,
    totalUnread,
    loadConversations,
    handleMessageUpdate,
    incrementUnread,
    clearUnread,
    sortConversations
  }
})
