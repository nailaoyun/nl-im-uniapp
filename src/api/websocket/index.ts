/**
 * WebSocket 管理器 - UniApp 适配版
 */
import type { ChatMessage } from '@/types/api'
import type { MomentNotifPayload } from '@/types/moment'

export interface WebSocketMessage {
  request_type?: string
  clientId?: string
  data?: ChatMessage | MomentNotifPayload
}

export type MessageHandler = (message: ChatMessage) => void
export type SignalHandler = (message: ChatMessage) => void
export type MomentNotifHandler = (payload: MomentNotifPayload) => void

class WebSocketManager {
  private socketTask: UniApp.SocketTask | null = null
  private clientId: string | null = null
  private userId: string | null = null
  private messageHandlers: MessageHandler[] = []
  private signalHandlers: SignalHandler[] = []
  private momentNotifHandlers: MomentNotifHandler[] = []
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private recentMomentNotifs: Set<string> = new Set()
  private notifCacheTimeout = 5000

  /**
   * 连接 WebSocket
   */
  connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socketTask) {
        resolve()
        return
      }

      this.userId = userId
      // TODO: 替换为实际的 WebSocket 地址
      // const wsUrl = `ws://g-ws.nailaoyun.cn/ws?user_id=${userId}`
      const wsUrl = `wss://g-ws.nailaoyun.cn/ws?user_id=${userId}`

      this.socketTask = uni.connectSocket({
        url: wsUrl,
        success: () => {
          console.log('WebSocket connecting...')
        },
        fail: (err) => {
          console.error('WebSocket connect failed:', err)
          reject(err)
        }
      })

      this.socketTask.onOpen(() => {
        console.log('✅ WebSocket connected')
        this.reconnectAttempts = 0
        resolve()
      })

      this.socketTask.onMessage((res) => {
        try {
          const data = (res.data as string).trim()
          const lines = data.split('\n').filter((line: string) => line.trim())

          for (const line of lines) {
            try {
              const payload: WebSocketMessage = JSON.parse(line)

              // 接收 clientId
              if (payload.clientId) {
                this.clientId = payload.clientId
              }

              // 处理接收消息
              if (payload.request_type === 'receive_message' && payload.data) {
                this.handleMessage(payload.data as ChatMessage)
              }

              // 处理朋友圈通知
              if (payload.request_type === 'moment_notification' && payload.data) {
                this.handleMomentNotification(payload.data as MomentNotifPayload)
              }
            } catch {
              // 忽略单行解析错误
            }
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error)
        }
      })

      this.socketTask.onError((error) => {
        console.error('WebSocket error:', error)
        reject(error)
      })

      this.socketTask.onClose(() => {
        console.log('WebSocket closed')
        this.socketTask = null
        this.attemptReconnect()
      })
    })
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.socketTask) {
      this.socketTask.close({})
      this.socketTask = null
    }
    this.clientId = null
    this.userId = null
    this.messageHandlers = []
    this.signalHandlers = []
    this.momentNotifHandlers = []
  }

  /**
   * 获取 ClientID
   */
  getClientId(): string | null {
    return this.clientId
  }

  /**
   * 添加普通消息处理器
   */
  onMessage(handler: MessageHandler) {
    if (!this.messageHandlers.includes(handler)) {
      this.messageHandlers.push(handler)
    }
  }

  /**
   * 移除普通消息处理器
   */
  offMessage(handler: MessageHandler) {
    const index = this.messageHandlers.indexOf(handler)
    if (index > -1) {
      this.messageHandlers.splice(index, 1)
    }
  }

  /**
   * 添加信令处理器 (WebRTC用)
   */
  onSignal(handler: SignalHandler) {
    if (!this.signalHandlers.includes(handler)) {
      this.signalHandlers.push(handler)
    }
  }

  /**
   * 移除信令处理器
   */
  offSignal(handler: SignalHandler) {
    const index = this.signalHandlers.indexOf(handler)
    if (index > -1) {
      this.signalHandlers.splice(index, 1)
    }
  }

  /**
   * 添加朋友圈通知处理器
   */
  onMomentNotification(handler: MomentNotifHandler) {
    if (!this.momentNotifHandlers.includes(handler)) {
      this.momentNotifHandlers.push(handler)
    }
  }

  /**
   * 移除朋友圈通知处理器
   */
  offMomentNotification(handler: MomentNotifHandler) {
    const index = this.momentNotifHandlers.indexOf(handler)
    if (index > -1) {
      this.momentNotifHandlers.splice(index, 1)
    }
  }

  /**
   * 内部处理朋友圈通知（带去重）
   */
  private handleMomentNotification(payload: MomentNotifPayload) {
    const notifKey = `${payload.moment_id}_${payload.type}_${payload.from_user?.id || ''}_${payload.comment_id || ''}`

    if (this.recentMomentNotifs.has(notifKey)) {
      console.log('🔄 跳过重复朋友圈通知:', notifKey)
      return
    }

    this.recentMomentNotifs.add(notifKey)

    setTimeout(() => {
      this.recentMomentNotifs.delete(notifKey)
    }, this.notifCacheTimeout)

    this.momentNotifHandlers.forEach((handler) => handler(payload))
  }

  /**
   * 内部处理接收到的消息
   */
  private handleMessage(message: ChatMessage) {
    // 信令消息（message_type = 6）- 路由到 signalHandlers
    if (message.message_type === 6) {
      this.signalHandlers.forEach((handler) => handler(message))
      return
    }

    // 普通消息 - 路由到 messageHandlers
    this.messageHandlers.forEach((handler) => handler(message))
  }

  /**
   * 尝试重连
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('WebSocket max reconnect attempts reached')
      return
    }

    if (!this.userId) {
      return
    }

    this.reconnectAttempts++
    console.log(`WebSocket reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId).catch(console.error)
      }
    }, this.reconnectDelay)
  }
}

export const wsManager = new WebSocketManager()
