/**
 * 主题切换组合式函数
 */
import { ref, computed } from 'vue'

const isDark = ref(false)
const isInitialized = ref(false)

// 用于 wd-config-provider 的 theme 属性
const theme = computed<'light' | 'dark'>(() => isDark.value ? 'dark' : 'light')

export function useTheme() {
  /**
   * 初始化主题
   */
  function initTheme() {
    if (isInitialized.value) return

    // 读取缓存的主题设置
    const cached = uni.getStorageSync('nl_im_theme')
    if (cached) {
      isDark.value = cached === 'dark'
    } else {
      // 跟随系统主题
      try {
        const info = uni.getSystemInfoSync()
        isDark.value = info.theme === 'dark'
      } catch {
        isDark.value = false
      }
    }

    applyTheme()
    isInitialized.value = true

    // 监听系统主题变化
    // #ifdef APP-PLUS || MP-WEIXIN
    uni.onThemeChange?.((res: { theme: 'dark' | 'light' }) => {
      // 如果用户没有手动设置主题，则跟随系统
      if (!uni.getStorageSync('nl_im_theme')) {
        isDark.value = res.theme === 'dark'
        applyTheme()
      }
    })
    // #endif
  }

  /**
   * 切换主题
   */
  function toggleTheme() {
    isDark.value = !isDark.value
    uni.setStorageSync('nl_im_theme', isDark.value ? 'dark' : 'light')
    applyTheme()
  }

  /**
   * 主题切换回调（用于 wd-switch @change）
   */
  function onThemeChange(value: { value: boolean }) {
    isDark.value = value.value
    uni.setStorageSync('nl_im_theme', value.value ? 'dark' : 'light')
    applyTheme()
  }

  /**
   * 设置主题
   * @param dark 是否深色模式
   * @param persist 是否持久化到存储（默认 true）
   */
  function setTheme(dark: boolean, persist = true) {
    isDark.value = dark
    if (persist) {
      uni.setStorageSync('nl_im_theme', dark ? 'dark' : 'light')
    }
    applyTheme()
  }

  /**
   * 应用主题
   */
  function applyTheme() {
    // H5 端设置 page 元素 class（不使用条件编译，直接检测环境）
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      // 同时设置 html 和所有 page 元素
      if (isDark.value) {
        document.documentElement.classList.add('dark')
        // UniApp H5 中 page 是 uni-page-body 的父元素
        document.querySelectorAll('uni-page-body').forEach((el) => {
          el.parentElement?.classList.add('dark')
        })
        // 查找所有可能的 page 元素
        document.querySelectorAll('uni-page, .uni-page').forEach((el) => {
          el.classList.add('dark')
        })
        // 直接给 body 也加上，确保全局生效
        document.body?.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
        document.querySelectorAll('uni-page-body').forEach((el) => {
          el.parentElement?.classList.remove('dark')
        })
        document.querySelectorAll('uni-page, .uni-page').forEach((el) => {
          el.classList.remove('dark')
        })
        document.body?.classList.remove('dark')
      }
    }

    // 设置导航栏颜色（延迟执行，确保页面已加载）
    setTimeout(() => {
      try {
        uni.setNavigationBarColor({
          frontColor: isDark.value ? '#ffffff' : '#000000',
          backgroundColor: isDark.value ? '#1a1a1a' : '#ededed',
          animation: {
            duration: 200,
            timingFunc: 'easeIn'
          },
          fail: () => {
            // 静默忽略 "page not found" 错误
          }
        })
      } catch {
        // 忽略错误
      }
    }, 100)

    // 设置 TabBar 样式（延迟执行，确保页面已加载）
    setTimeout(() => {
      try {
        uni.setTabBarStyle({
          color: '#999999',
          selectedColor: '#07c160',
          backgroundColor: isDark.value ? '#1a1a1a' : '#f7f7f7',
          borderStyle: isDark.value ? 'black' : 'white',
          fail: () => {
            // 静默忽略 "not TabBar page" 错误
          }
        })
      } catch {
        // 忽略错误
      }
    }, 100)
  }

  return {
    theme,
    isDark,
    initTheme,
    toggleTheme,
    onThemeChange,
    setTheme
  }
}

export default useTheme







