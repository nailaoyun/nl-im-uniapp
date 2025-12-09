/**
 * 主题切换组合式函数
 */
import { ref, watch } from 'vue'

const isDark = ref(false)
const isInitialized = ref(false)

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
   * 设置主题
   */
  function setTheme(dark: boolean) {
    isDark.value = dark
    uni.setStorageSync('nl_im_theme', dark ? 'dark' : 'light')
    applyTheme()
  }

  /**
   * 应用主题
   */
  function applyTheme() {
    // H5 端设置 html class
    // #ifdef H5
    if (typeof document !== 'undefined') {
      if (isDark.value) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
    // #endif

    // 设置导航栏颜色
    try {
      uni.setNavigationBarColor({
        frontColor: isDark.value ? '#ffffff' : '#000000',
        backgroundColor: isDark.value ? '#1a1a1a' : '#ededed',
        animation: {
          duration: 200,
          timingFunc: 'easeIn'
        }
      })
    } catch {
      // 忽略错误
    }

    // 设置 TabBar 样式
    try {
      uni.setTabBarStyle({
        color: '#999999',
        selectedColor: '#07c160',
        backgroundColor: isDark.value ? '#1a1a1a' : '#f7f7f7',
        borderStyle: isDark.value ? 'black' : 'white'
      })
    } catch {
      // 忽略错误
    }
  }

  return {
    isDark,
    initTheme,
    toggleTheme,
    setTheme
  }
}

export default useTheme
