/**
 * 格式化工具函数
 */

/**
 * 格式化时间（相对时间）
 */
export function formatTime(timestamp: number | string): string {
  const date = new Date(typeof timestamp === 'string' ? timestamp : timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  // 刚刚（1分钟内）
  if (seconds < 60) {
    return '刚刚'
  }

  // X分钟前（1小时内）
  if (minutes < 60) {
    return `${minutes}分钟前`
  }

  // X小时前（24小时内）
  if (hours < 24) {
    return `${hours}小时前`
  }

  // 昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天'
  }

  // X天前（7天内）
  if (days < 7) {
    return `${days}天前`
  }

  // 超过7天，显示具体日期
  const currentYear = now.getFullYear()
  const messageYear = date.getFullYear()

  if (currentYear === messageYear) {
    // 今年：显示月-日
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${month}-${day}`
  } else {
    // 去年或更早：显示年-月-日
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}

/**
 * 格式化消息时间（用于聊天记录）
 */
export function formatMessageTime(timestamp: number | string): string {
  const date = new Date(typeof timestamp === 'string' ? timestamp : timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  const formatTimeStr = (d: Date) => {
    const h = d.getHours().toString().padStart(2, '0')
    const m = d.getMinutes().toString().padStart(2, '0')
    return `${h}:${m}`
  }

  // 刚刚（1分钟内）
  if (seconds < 60) {
    return '刚刚'
  }

  // X分钟前（1小时内）
  if (minutes < 60) {
    return `${minutes}分钟前`
  }

  // X小时前（24小时内）
  if (hours < 24) {
    return `${hours}小时前`
  }

  // 昨天 HH:mm
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${formatTimeStr(date)}`
  }

  // 本周内：显示星期几 HH:mm
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  if (date > weekAgo) {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    const weekday = weekdays[date.getDay()]
    return `周${weekday} ${formatTimeStr(date)}`
  }

  // 今年：MM-DD HH:mm
  const currentYear = now.getFullYear()
  const messageYear = date.getFullYear()

  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')

  if (currentYear === messageYear) {
    return `${month}-${day} ${formatTimeStr(date)}`
  } else {
    // 去年或更早：YYYY-MM-DD HH:mm
    const year = date.getFullYear()
    return `${year}-${month}-${day} ${formatTimeStr(date)}`
  }
}

/**
 * 格式化文件大小
 */
export function formatSize(bytes: number): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 格式化时长（秒转MM:SS）
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * 格式化相对时间（别名）
 */
export function formatRelativeTime(timestamp: number | string): string {
  return formatTime(timestamp)
}

/**
 * 生成用户头像颜色
 */
export function generateColor(str: string): string {
  const colors = [
    '#3b82f6', // blue
    '#ec4899', // pink
    '#10b981', // green
    '#f59e0b', // amber
    '#6366f1', // indigo
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4' // cyan
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}
