/**
 * 应用全局状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type TabType = 'chat' | 'contact' | 'moment'

// 微信小程序胶囊按钮信息类型
export interface MenuButtonInfo {
  width: number
  height: number
  top: number
  right: number
  bottom: number
  left: number
}

export const useAppStore = defineStore('app', () => {
  // 当前激活的 Tab
  const currentTab = ref<TabType>('chat')

  // 是否暗色模式
  const isDark = ref(false)

  // 系统信息
  const systemInfo = ref<UniApp.GetSystemInfoResult | null>(null)

  // 微信小程序胶囊按钮信息
  const menuButtonInfo = ref<MenuButtonInfo | null>(null)

  // 左侧抽屉是否打开
  const drawerVisible = ref(false)

  // 状态栏高度
  const statusBarHeight = computed(() => systemInfo.value?.statusBarHeight || 0)

  // 导航栏高度（不含状态栏）
  const navBarHeight = computed(() => {
    // #ifdef MP-WEIXIN
    if (menuButtonInfo.value) {
      // 导航栏高度 = (胶囊按钮距顶部距离 - 状态栏高度) * 2 + 胶囊按钮高度
      const paddingTop = menuButtonInfo.value.top - statusBarHeight.value
      return paddingTop * 2 + menuButtonInfo.value.height
    }
    // #endif
    return 44 // 默认导航栏高度
  })

  // 导航栏总高度（含状态栏）
  const navBarTotalHeight = computed(() => statusBarHeight.value + navBarHeight.value)

  /**
   * 初始化应用
   */
  function init() {
    // 获取系统信息
    systemInfo.value = uni.getSystemInfoSync()

    // #ifdef MP-WEIXIN
    // 获取微信小程序胶囊按钮位置信息
    try {
      const rect = uni.getMenuButtonBoundingClientRect()
      menuButtonInfo.value = {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left
      }
      console.log('📱 [App] 胶囊按钮信息:', menuButtonInfo.value)
      console.log('📱 [App] 状态栏高度:', statusBarHeight.value, '导航栏高度:', navBarHeight.value)
    } catch (e) {
      console.warn('⚠️ [App] 获取胶囊按钮信息失败:', e)
    }
    // #endif

    // 初始化主题
    initTheme()

    // 读取缓存的 Tab
    const cachedTab = uni.getStorageSync('current_tab')
    if (cachedTab && ['chat', 'contact', 'moment'].includes(cachedTab)) {
      currentTab.value = cachedTab as TabType
    }

    // 注入 CSS 变量到页面
    injectCSSVariables()
  }

  /**
   * 注入 CSS 变量（用于微信小程序安全区域）
   */
  function injectCSSVariables() {
    // #ifdef MP-WEIXIN
    const pages = getCurrentPages()
    if (pages.length > 0) {
      // 通过 page 元素设置 CSS 变量无法直接操作，但可以通过 JS 计算后在组件中使用
      console.log('📱 [App] CSS 变量 - statusBarHeight:', statusBarHeight.value, 'navBarHeight:', navBarHeight.value)
    }
    // #endif
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
    menuButtonInfo,
    statusBarHeight,
    navBarHeight,
    navBarTotalHeight,
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
