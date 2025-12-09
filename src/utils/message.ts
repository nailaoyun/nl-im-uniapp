/**
 * 消息处理工具函数
 */
import type { ChatMessage } from '@/types/api'
import { MessageType } from '@/types/message'

export interface MessageTypeConfig {
  label: string
  icon: string
  summaryFn: (msg: ChatMessage) => string
}

/**
 * 消息类型配置映射表
 */
export const messageTypeConfigs: Record<number, MessageTypeConfig> = {
  [MessageType.TEXT]: {
    label: '文本消息',
    icon: 'chat',
    summaryFn: (msg) => msg.content || ''
  },
  [MessageType.IMAGE]: {
    label: '图片',
    icon: 'picture',
    summaryFn: () => '[图片]'
  },
  [MessageType.AUDIO]: {
    label: '语音',
    icon: 'volume',
    summaryFn: () => '[语音]'
  },
  [MessageType.VIDEO]: {
    label: '视频',
    icon: 'video',
    summaryFn: () => '[视频]'
  },
  [MessageType.SYSTEM]: {
    label: '系统消息',
    icon: 'warning',
    summaryFn: (msg) => {
      const extra = typeof msg.extra === 'string' ? JSON.parse(msg.extra || '{}') : msg.extra || {}
      return extra.title || msg.content || '[系统消息]'
    }
  },
  [MessageType.FRIEND_NOTIFY]: {
    label: '好友通知',
    icon: 'add-circle',
    summaryFn: (msg) => {
      const extra = typeof msg.extra === 'string' ? JSON.parse(msg.extra || '{}') : msg.extra || {}
      return extra.title || msg.content || '[好友通知]'
    }
  },
  [MessageType.SIGNAL]: {
    label: '通话',
    icon: 'phone',
    summaryFn: () => '[通话]'
  },
  [MessageType.GROUP_NOTIFY]: {
    label: '群通知',
    icon: 'user',
    summaryFn: (msg) => {
      // 优先使用后端发送的 content
      if (msg.content) {
        return msg.content
      }

      const extra = typeof msg.extra === 'string' ? JSON.parse(msg.extra || '{}') : msg.extra || {}
      // 根据事件类型生成更具体的文案
      if (extra.type === 'member_invite' || extra.event === 'member_invite') {
        const operatorName = extra.operator_name || '未知用户'
        const targetNames = extra.target_names || []
        if (targetNames.length > 0) {
          return `${operatorName} 邀请了 ${targetNames.join('、')} 加入群聊`
        }
        return `${operatorName} 邀请了成员加入群聊`
      } else if (extra.type === 'member_remove' || extra.event === 'member_remove') {
        const operatorName = extra.operator_name || '未知用户'
        const targetName = extra.target_name || '用户'
        return `${operatorName} 将 ${targetName} 移出了群聊`
      } else if (extra.type === 'member_leave' || extra.event === 'member_leave') {
        const targetName = extra.target_name || '用户'
        return `${targetName} 退出了群聊`
      } else if (extra.type === 'member_join' || extra.event === 'member_join') {
        const targetName = extra.target_name || '用户'
        return `${targetName} 加入了群聊`
      } else if (extra.event === 'group_update') {
        return `群信息已更新`
      } else if (extra.event === 'role_change') {
        return `成员角色已变更`
      }
      return extra.title || '[群通知]'
    }
  },
  [MessageType.FILE]: {
    label: '文件',
    icon: 'folder',
    summaryFn: (msg) => {
      const extra = typeof msg.extra === 'string' ? JSON.parse(msg.extra || '{}') : msg.extra || {}
      return extra.name ? `[文件] ${extra.name}` : '[文件]'
    }
  },
  [MessageType.MOMENTS_NOTIFY]: {
    label: '朋友圈通知',
    icon: 'heart',
    summaryFn: (msg) => {
      const extra = typeof msg.extra === 'string' ? JSON.parse(msg.extra || '{}') : msg.extra || {}
      return extra.title || msg.content || '[朋友圈通知]'
    }
  }
}

/**
 * 获取消息摘要
 */
export function getMessageSummary(msg: ChatMessage): string {
  const config = messageTypeConfigs[msg.message_type]
  if (config) {
    return config.summaryFn(msg)
  }
  return msg.content || '[未知消息]'
}

/**
 * 获取消息类型标签
 */
export function getMessageTypeLabel(messageType: number): string {
  return messageTypeConfigs[messageType]?.label || '未知消息'
}

/**
 * 获取消息类型图标
 */
export function getMessageTypeIcon(messageType: number): string {
  return messageTypeConfigs[messageType]?.icon || 'warning'
}

/**
 * 判断是否为系统/通知类消息（需要特殊样式）
 */
export function isSystemOrNotifyMessage(messageType: number): boolean {
  return [MessageType.SYSTEM, MessageType.FRIEND_NOTIFY, MessageType.GROUP_NOTIFY, MessageType.MOMENTS_NOTIFY].includes(
    messageType
  )
}
