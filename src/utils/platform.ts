/**
 * 平台相关工具函数
 */

/**
 * 是否 App 平台
 */
export function isApp(): boolean {
  // #ifdef APP-PLUS
  return true
  // #endif
  // #ifndef APP-PLUS
  return false
  // #endif
}

/**
 * 是否微信小程序
 */
export function isWeixin(): boolean {
  // #ifdef MP-WEIXIN
  return true
  // #endif
  // #ifndef MP-WEIXIN
  return false
  // #endif
}

/**
 * 是否 H5
 */
export function isH5(): boolean {
  // #ifdef H5
  return true
  // #endif
  // #ifndef H5
  return false
  // #endif
}

/**
 * 选择图片
 */
export function chooseImage(count = 9): Promise<string[]> {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => resolve(res.tempFilePaths),
      fail: reject
    })
  })
}

/**
 * 选择视频
 */
export function chooseVideo(): Promise<UniApp.ChooseVideoSuccess> {
  return new Promise((resolve, reject) => {
    uni.chooseVideo({
      sourceType: ['album', 'camera'],
      compressed: true,
      success: resolve,
      fail: reject
    })
  })
}

/**
 * 选择文件
 */
export function chooseFile(count = 1): Promise<any> {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    uni.chooseFile({
      count,
      success: resolve,
      fail: reject
    })
    // #endif

    // #ifdef MP-WEIXIN
    // @ts-ignore
    wx.chooseMessageFile({
      count,
      type: 'file',
      success: resolve,
      fail: reject
    })
    // #endif

    // #ifdef H5
    // H5 使用 input[type=file]
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = count > 1
    input.onchange = (e: any) => {
      const files = e.target.files
      resolve({ tempFiles: Array.from(files) })
    }
    input.click()
    // #endif
  })
}

/**
 * 扫码
 */
export function scanCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.scanCode({
      onlyFromCamera: false,
      success: (res) => resolve(res.result),
      fail: reject
    })
  })
}

/**
 * 预览图片
 */
export function previewImage(urls: string[], current = 0) {
  uni.previewImage({
    urls,
    current
  })
}

/**
 * 保存图片到相册
 */
export function saveImageToAlbum(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.saveImageToPhotosAlbum({
      filePath,
      success: () => {
        uni.showToast({ title: '保存成功', icon: 'success' })
        resolve()
      },
      fail: (err) => {
        if (err.errMsg.includes('auth deny')) {
          uni.showToast({ title: '请授权保存图片', icon: 'none' })
        }
        reject(err)
      }
    })
  })
}

/**
 * 复制到剪贴板
 */
export function copyToClipboard(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.setClipboardData({
      data: text,
      success: () => {
        uni.showToast({ title: '已复制', icon: 'success' })
        resolve()
      },
      fail: reject
    })
  })
}

/**
 * 拨打电话
 */
export function makePhoneCall(phoneNumber: string) {
  uni.makePhoneCall({
    phoneNumber,
    fail: (err) => {
      if (!err.errMsg.includes('cancel')) {
        uni.showToast({ title: '拨号失败', icon: 'none' })
      }
    }
  })
}
