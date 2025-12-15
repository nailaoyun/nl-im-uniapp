/**
 * 安全区域和导航栏尺寸组合式函数
 * 用于获取微信小程序的状态栏、胶囊按钮、导航栏高度
 */
import { ref, computed, onMounted } from 'vue'

// 胶囊按钮信息
interface MenuButtonInfo {
  width: number
  height: number
  top: number
  right: number
  bottom: number
  left: number
}

// 全局单例状态（避免重复计算）
const systemInfo = ref<UniApp.GetSystemInfoResult | null>(null)
const menuButtonInfo = ref<MenuButtonInfo | null>(null)
const isInitialized = ref(false)

/**
 * 初始化安全区域数据
 */
function initSafeArea() {
  if (isInitialized.value) return

  try {
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
      console.log('📱 [SafeArea] 胶囊按钮信息:', menuButtonInfo.value)
    } catch (e) {
      console.warn('⚠️ [SafeArea] 获取胶囊按钮信息失败:', e)
    }
    // #endif

    isInitialized.value = true
  } catch (e) {
    console.error('❌ [SafeArea] 初始化失败:', e)
  }
}

export function useSafeArea() {
  // 状态栏高度
  const statusBarHeight = computed(() => {
    return systemInfo.value?.statusBarHeight || 0
  })

  // 导航栏内容高度（不含状态栏）
  const navBarContentHeight = computed(() => {
    // #ifdef MP-WEIXIN
    if (menuButtonInfo.value) {
      // 导航栏高度 = (胶囊按钮距顶部距离 - 状态栏高度) * 2 + 胶囊按钮高度
      const paddingTop = menuButtonInfo.value.top - statusBarHeight.value
      return paddingTop * 2 + menuButtonInfo.value.height
    }
    return 48 // 微信小程序默认值
    // #endif

    // #ifndef MP-WEIXIN
    return 44 // H5/App 默认值
    // #endif
  })

  // 导航栏总高度（状态栏 + 导航栏内容）
  const navBarTotalHeight = computed(() => {
    return statusBarHeight.value + navBarContentHeight.value
  })

  // 胶囊按钮右侧边距（用于计算导航栏右侧安全区域）
  const menuButtonRight = computed(() => {
    // #ifdef MP-WEIXIN
    if (menuButtonInfo.value && systemInfo.value) {
      // 屏幕宽度 - 胶囊按钮右边距
      return systemInfo.value.windowWidth - menuButtonInfo.value.right
    }
    return 10 // 默认 10px
    // #endif

    // #ifndef MP-WEIXIN
    return 0
    // #endif
  })

  // 安全区域右边距（避开胶囊按钮的宽度）
  const safeAreaRight = computed(() => {
    // #ifdef MP-WEIXIN
    if (menuButtonInfo.value && systemInfo.value) {
      // 胶囊按钮宽度 + 右边距 + 额外间距
      return menuButtonInfo.value.width + menuButtonRight.value + 10
    }
    return 100 // 默认 100px
    // #endif

    // #ifndef MP-WEIXIN
    return 0
    // #endif
  })

  // 初始化（在组件挂载时调用）
  onMounted(() => {
    initSafeArea()
  })

  // 也可以手动初始化
  function init() {
    initSafeArea()
  }

  return {
    systemInfo,
    menuButtonInfo,
    statusBarHeight,
    navBarContentHeight,
    navBarTotalHeight,
    menuButtonRight,
    safeAreaRight,
    init
  }
}

// 导出初始化函数，可在 App.vue 中调用
export { initSafeArea }

export default useSafeArea

