import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import Components from '@uni-helper/vite-plugin-uni-components'
import { WotResolver } from '@uni-helper/vite-plugin-uni-components/resolvers'
import UniKuRoot from '@uni-ku/root'
import Uni from '@uni-helper/plugin-uni'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  plugins: [
    // https://uni-helper.js.org/vite-plugin-uni-components
    Components({
      dts: true,
      resolvers: [WotResolver()]
    }),
    // https://github.com/niceyou/uni-ku-root - 全局共享 ConfigProvider
    UniKuRoot(),
    // https://uni-helper.js.org/plugin-uni
    Uni(),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        // 使用 @use 替代 @import 避免循环导入
        additionalData: `@use "wot-design-uni/components/common/abstracts/variable.scss" as *;`,
      },
    },
  },
})


