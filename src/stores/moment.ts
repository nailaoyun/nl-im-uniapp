/**
 * 朋友圈状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as momentApi from '@/api/modules/moment'
import type { Moment, MomentNotification, CreateMomentRequest, CreateCommentRequest, MomentNotifPayload } from '@/types/moment'

export const useMomentStore = defineStore('moment', () => {
  // ==========================================
  // 状态
  // ==========================================

  // 动态列表
  const moments = ref<Moment[]>([])
  // 当前查看的动态详情
  const currentMoment = ref<Moment | null>(null)
  // 通知列表
  const notifications = ref<MomentNotification[]>([])
  // 未读通知数
  const unreadCount = ref(0)
  // 加载状态
  const loading = ref(false)
  // 分页信息
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: true
  })
  // 通知分页
  const notifPagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: true
  })

  // ==========================================
  // 计算属性
  // ==========================================

  const hasUnread = computed(() => unreadCount.value > 0)

  // ==========================================
  // 动态相关方法
  // ==========================================

  /**
   * 获取动态列表（刷新）
   */
  async function fetchMoments() {
    loading.value = true
    try {
      pagination.value.page = 1
      const res = await momentApi.getMoments(1, pagination.value.pageSize)
      moments.value = res.data || []
      pagination.value.total = res.total
      pagination.value.hasMore = moments.value.length < res.total
    } catch (error) {
      console.error('获取动态列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载更多动态
   */
  async function fetchMoreMoments() {
    if (!pagination.value.hasMore || loading.value) return

    loading.value = true
    try {
      const nextPage = pagination.value.page + 1
      const res = await momentApi.getMoments(nextPage, pagination.value.pageSize)
      const newMoments = res.data || []
      moments.value = [...moments.value, ...newMoments]
      pagination.value.page = nextPage
      pagination.value.total = res.total
      pagination.value.hasMore = moments.value.length < res.total
    } catch (error) {
      console.error('加载更多动态失败:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取用户动态列表
   */
  async function fetchUserMoments(userId: string, refresh = false) {
    if (refresh) {
      pagination.value.page = 1
    }
    loading.value = true
    try {
      const res = await momentApi.getUserMoments(userId, pagination.value.page, pagination.value.pageSize)
      if (refresh) {
        moments.value = res.data || []
      } else {
        moments.value = [...moments.value, ...(res.data || [])]
      }
      pagination.value.total = res.total
      pagination.value.hasMore = moments.value.length < res.total
    } catch (error) {
      console.error('获取用户动态失败:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取动态详情
   */
  async function fetchMomentDetail(id: number) {
    loading.value = true
    try {
      currentMoment.value = await momentApi.getMomentDetail(id)
    } catch (error) {
      console.error('获取动态详情失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 发布动态
   */
  async function publishMoment(data: CreateMomentRequest) {
    try {
      const newMoment = await momentApi.createMoment(data)
      // 添加到列表顶部
      moments.value.unshift(newMoment)
      uni.showToast({ title: '发布成功', icon: 'success' })
      return newMoment
    } catch (error) {
      console.error('发布动态失败:', error)
      uni.showToast({ title: '发布失败', icon: 'none' })
      throw error
    }
  }

  /**
   * 删除动态
   */
  async function removeMoment(id: number) {
    try {
      await momentApi.deleteMoment(id)
      // 从列表中移除
      moments.value = moments.value.filter((m) => m.id !== id)
      if (currentMoment.value?.id === id) {
        currentMoment.value = null
      }
      uni.showToast({ title: '删除成功', icon: 'success' })
    } catch (error) {
      console.error('删除动态失败:', error)
      uni.showToast({ title: '删除失败', icon: 'none' })
      throw error
    }
  }

  // ==========================================
  // 点赞相关方法
  // ==========================================

  /**
   * 切换点赞状态
   */
  async function toggleLike(momentId: number) {
    const moment = moments.value.find((m) => m.id === momentId) || currentMoment.value
    if (!moment) return

    const wasLiked = moment.is_liked

    try {
      if (wasLiked) {
        await momentApi.unlikeMoment(momentId)
        moment.is_liked = false
        moment.like_count = Math.max(0, moment.like_count - 1)
      } else {
        await momentApi.likeMoment(momentId)
        moment.is_liked = true
        moment.like_count += 1
      }
    } catch (error) {
      console.error('点赞操作失败:', error)
      // 恢复状态
      moment.is_liked = wasLiked
      throw error
    }
  }

  // ==========================================
  // 评论相关方法
  // ==========================================

  /**
   * 添加评论
   */
  async function addComment(momentId: number, data: CreateCommentRequest) {
    try {
      const newComment = await momentApi.createComment(momentId, data)

      // 更新动态的评论列表
      const moment = moments.value.find((m) => m.id === momentId) || currentMoment.value
      if (moment) {
        if (!moment.comments) {
          moment.comments = []
        }
        moment.comments.push(newComment)
        moment.comment_count += 1
      }

      uni.showToast({ title: '评论成功', icon: 'success' })
      return newComment
    } catch (error) {
      console.error('评论失败:', error)
      uni.showToast({ title: '评论失败', icon: 'none' })
      throw error
    }
  }

  /**
   * 删除评论
   */
  async function removeComment(momentId: number, commentId: number) {
    try {
      await momentApi.deleteComment(commentId)

      // 更新动态的评论列表
      const moment = moments.value.find((m) => m.id === momentId) || currentMoment.value
      if (moment && moment.comments) {
        moment.comments = moment.comments.filter((c) => c.id !== commentId)
        moment.comment_count = Math.max(0, moment.comment_count - 1)
      }

      uni.showToast({ title: '删除成功', icon: 'success' })
    } catch (error) {
      console.error('删除评论失败:', error)
      uni.showToast({ title: '删除失败', icon: 'none' })
      throw error
    }
  }

  /**
   * 刷新评论列表
   */
  async function refreshComments(momentId: number) {
    try {
      const comments = await momentApi.getMomentComments(momentId)
      const moment = moments.value.find((m) => m.id === momentId) || currentMoment.value
      if (moment) {
        moment.comments = comments
      }
      return comments
    } catch (error) {
      console.error('刷新评论失败:', error)
      throw error
    }
  }

  // ==========================================
  // 通知相关方法
  // ==========================================

  /**
   * 获取通知列表
   */
  async function fetchNotifications(refresh = false) {
    if (refresh) {
      notifPagination.value.page = 1
    }
    loading.value = true
    try {
      const res = await momentApi.getNotifications(notifPagination.value.page, notifPagination.value.pageSize)
      if (refresh) {
        notifications.value = res.data || []
      } else {
        notifications.value = [...notifications.value, ...(res.data || [])]
      }
      notifPagination.value.total = res.total
      notifPagination.value.hasMore = notifications.value.length < res.total
    } catch (error) {
      console.error('获取通知列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载更多通知
   */
  async function fetchMoreNotifications() {
    if (!notifPagination.value.hasMore || loading.value) return

    notifPagination.value.page += 1
    await fetchNotifications(false)
  }

  /**
   * 标记通知已读
   */
  async function markAsRead(ids: number[]) {
    try {
      await momentApi.markNotificationsRead({ ids })
      // 更新本地状态
      notifications.value.forEach((n) => {
        if (ids.includes(n.id)) {
          n.is_read = true
        }
      })
      // 更新未读数
      await fetchUnreadCount()
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  /**
   * 标记全部已读
   */
  async function markAllAsRead() {
    try {
      await momentApi.markNotificationsRead({ all: true })
      // 更新本地状态
      notifications.value.forEach((n) => {
        n.is_read = true
      })
      unreadCount.value = 0
    } catch (error) {
      console.error('标记全部已读失败:', error)
    }
  }

  /**
   * 获取未读通知数量
   */
  async function fetchUnreadCount() {
    try {
      const res = await momentApi.getUnreadCount()
      unreadCount.value = res.count
    } catch (error) {
      console.error('获取未读数失败:', error)
    }
  }

  // ==========================================
  // WebSocket 通知处理
  // ==========================================

  /**
   * 处理 WebSocket 推送的朋友圈通知
   */
  function handleWsNotification(payload: MomentNotifPayload) {
    // 增加未读数
    unreadCount.value += 1

    // 显示通知
    let message = ''
    const userName = payload.from_user?.name || '有人'

    switch (payload.type) {
      case 'like':
        message = `${userName} 赞了你的动态`
        break
      case 'comment':
        message = `${userName} 评论了你的动态`
        break
      case 'reply':
        message = `${userName} 回复了你的评论`
        break
      case 'mention':
        message = `${userName} 在动态中@了你`
        break
    }

    uni.showToast({
      title: message,
      icon: 'none',
      duration: 3000
    })
  }

  // ==========================================
  // 重置状态
  // ==========================================

  function reset() {
    moments.value = []
    currentMoment.value = null
    notifications.value = []
    unreadCount.value = 0
    pagination.value = {
      page: 1,
      pageSize: 20,
      total: 0,
      hasMore: true
    }
    notifPagination.value = {
      page: 1,
      pageSize: 20,
      total: 0,
      hasMore: true
    }
  }

  return {
    // 状态
    moments,
    currentMoment,
    notifications,
    unreadCount,
    loading,
    pagination,
    notifPagination,

    // 计算属性
    hasUnread,

    // 动态方法
    fetchMoments,
    fetchMoreMoments,
    fetchUserMoments,
    fetchMomentDetail,
    publishMoment,
    removeMoment,
    deleteMoment: removeMoment, // 别名

    // 点赞方法
    toggleLike,

    // 评论方法
    addComment,
    removeComment,
    refreshComments,

    // 通知方法
    fetchNotifications,
    fetchMoreNotifications,
    markAsRead,
    markAllAsRead,
    fetchUnreadCount,

    // WebSocket
    handleWsNotification,

    // 重置
    reset
  }
})
