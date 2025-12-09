/**
 * 本地存储工具函数
 */

const KEYS = {
  TOKEN: 'nl_im_token',
  USER_ID: 'nl_im_user_id',
  USER_INFO: 'nl_im_user_info',
  REMEMBER: 'nl_im_remember',
  CURRENT_TAB: 'nl_im_current_tab',
  CONTACT_LEFT_PANEL_MODE: 'nl_im_contact_left_panel_mode',
  CONTACT_LIST_TAB: 'nl_im_contact_list_tab',
  SELECTED_CONVERSATION: 'nl_im_selected_conversation',
  SELECTED_ROOM_ID: 'nl_im_selected_room_id',
  THEME: 'nl_im_theme'
}

export const storage = {
  // Token
  setToken(token: string) {
    uni.setStorageSync(KEYS.TOKEN, token)
  },

  getToken(): string | null {
    return uni.getStorageSync(KEYS.TOKEN) || null
  },

  removeToken() {
    uni.removeStorageSync(KEYS.TOKEN)
  },

  // User ID
  setUserId(userId: string) {
    uni.setStorageSync(KEYS.USER_ID, userId)
  },

  getUserId(): string | null {
    return uni.getStorageSync(KEYS.USER_ID) || null
  },

  removeUserId() {
    uni.removeStorageSync(KEYS.USER_ID)
  },

  // User Info
  setUserInfo(userInfo: any) {
    uni.setStorageSync(KEYS.USER_INFO, JSON.stringify(userInfo))
  },

  getUserInfo(): any | null {
    const info = uni.getStorageSync(KEYS.USER_INFO)
    if (!info) return null
    try {
      return JSON.parse(info)
    } catch {
      return null
    }
  },

  removeUserInfo() {
    uni.removeStorageSync(KEYS.USER_INFO)
  },

  // Remember
  setRemember(remember: boolean) {
    uni.setStorageSync(KEYS.REMEMBER, String(remember))
  },

  getRemember(): boolean {
    return uni.getStorageSync(KEYS.REMEMBER) === 'true'
  },

  // Current Tab (chat/contact/moment)
  setCurrentTab(tab: 'chat' | 'contact' | 'moment') {
    uni.setStorageSync(KEYS.CURRENT_TAB, tab)
  },

  getCurrentTab(): 'chat' | 'contact' | 'moment' {
    const tab = uni.getStorageSync(KEYS.CURRENT_TAB)
    return tab === 'chat' || tab === 'contact' || tab === 'moment' ? tab : 'chat'
  },

  // Contact Left Panel Mode
  setContactLeftPanelMode(mode: string) {
    uni.setStorageSync(KEYS.CONTACT_LEFT_PANEL_MODE, mode)
  },

  getContactLeftPanelMode(): string {
    return uni.getStorageSync(KEYS.CONTACT_LEFT_PANEL_MODE) || 'default'
  },

  // Contact List Tab
  setContactListTab(tab: 'friends' | 'groups') {
    uni.setStorageSync(KEYS.CONTACT_LIST_TAB, tab)
  },

  getContactListTab(): 'friends' | 'groups' {
    const tab = uni.getStorageSync(KEYS.CONTACT_LIST_TAB)
    return tab === 'friends' || tab === 'groups' ? tab : 'friends'
  },

  // Selected Conversation
  setSelectedConversation(targetId: string | null) {
    if (targetId) {
      uni.setStorageSync(KEYS.SELECTED_CONVERSATION, targetId)
    } else {
      uni.removeStorageSync(KEYS.SELECTED_CONVERSATION)
    }
  },

  getSelectedConversation(): string | null {
    return uni.getStorageSync(KEYS.SELECTED_CONVERSATION) || null
  },

  // Selected Room ID
  setSelectedRoomId(roomId: string | null) {
    if (roomId) {
      uni.setStorageSync(KEYS.SELECTED_ROOM_ID, roomId)
    } else {
      uni.removeStorageSync(KEYS.SELECTED_ROOM_ID)
    }
  },

  getSelectedRoomId(): string | null {
    return uni.getStorageSync(KEYS.SELECTED_ROOM_ID) || null
  },

  // Theme
  setTheme(theme: 'light' | 'dark') {
    uni.setStorageSync(KEYS.THEME, theme)
  },

  getTheme(): 'light' | 'dark' | null {
    const theme = uni.getStorageSync(KEYS.THEME)
    return theme === 'light' || theme === 'dark' ? theme : null
  },

  // Clear all
  clear() {
    Object.values(KEYS).forEach((key) => uni.removeStorageSync(key))
  }
}
