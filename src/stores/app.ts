/**
 * 应用全局状态管理
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type TabType = 'chat' | 'contact' | 'moment'

export const useAppStore = defineStore('app', () => {
  // 当前激活的 Tab
  const currentTab = ref<TabType>('chat')

  // 是否暗色模式
  const isDark = ref(false)

  // 系统信息
  const systemInfo = ref<UniApp.GetSystemInfoResult | null>(null)

  // 左侧抽屉是否打开
  const drawerVisible = ref(false)

  /**
   * 初始化应用
   */
  function init() {
    // 获取系统信息
    systemInfo.value = uni.getSystemInfoSync()

    // 初始化主题
    initTheme()

    // 读取缓存的 Tab
    const cachedTab = uni.getStorageSync('current_tab')
    if (cachedTab && ['chat', 'contact', 'moment'].includes(cachedTab)) {
      currentTab.value = cachedTab as TabType
    }
  }

  /**
   * 初始化主题
   */
  function initTheme() {
    // 读取缓存的主题设置
    const cachedTheme = uni.getStorageSync('theme')
    if (cachedTheme) {
      isDark.value = cachedTheme === 'dark'
    } else {
      // 跟随系统
      const info = uni.getSystemInfoSync()
      isDark.value = info.theme === 'dark'
    }

    applyTheme()

    // 监听系统主题变化
    // @ts-ignore
    uni.onThemeChange?.((res: { theme: string }) => {
      if (!uni.getStorageSync('theme')) {
        isDark.value = res.theme === 'dark'
        applyTheme()
      }
    })
  }

  /**
   * 应用主题
   */
  function applyTheme() {
    // 设置导航栏颜色
    uni.setNavigationBarColor({
      frontColor: isDark.value ? '#ffffff' : '#000000',
      backgroundColor: isDark.value ? '#1a1a1a' : '#ededed',
      animation: {
        duration: 300,
        timingFunc: 'easeIn'
      }
    })

    // 设置 TabBar 样式
    uni.setTabBarStyle({
      backgroundColor: isDark.value ? '#1a1a1a' : '#f7f7f7',
      borderStyle: isDark.value ? 'black' : 'white',
      color: isDark.value ? '#808080' : '#999999',
      selectedColor: isDark.value ? '#ffffff' : '#07c160'
    })
  }

  /**
   * 切换主题
   */
  function toggleTheme() {
    isDark.value = !isDark.value
    uni.setStorageSync('theme', isDark.value ? 'dark' : 'light')
    applyTheme()
  }

  /**
   * 设置当前 Tab
   */
  function setCurrentTab(tab: TabType) {
    currentTab.value = tab
    uni.setStorageSync('current_tab', tab)
  }

  /**
   * 打开抽屉
   */
  function openDrawer() {
    drawerVisible.value = true
  }

  /**
   * 关闭抽屉
   */
  function closeDrawer() {
    drawerVisible.value = false
  }

  /**
   * 切换抽屉
   */
  function toggleDrawer() {
    drawerVisible.value = !drawerVisible.value
  }

  return {
    currentTab,
    isDark,
    systemInfo,
    drawerVisible,
    init,
    initTheme,
    applyTheme,
    toggleTheme,
    setCurrentTab,
    openDrawer,
    closeDrawer,
    toggleDrawer
  }
})
