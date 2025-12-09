import { createSSRApp } from 'vue'
import * as Pinia from 'pinia'
import App from './App.vue'

// wot-design-uni 样式变量通过 vite.config.ts 的 css.preprocessorOptions 配置

export function createApp() {
  const app = createSSRApp(App)
  app.use(Pinia.createPinia())
  return {
    app,
    Pinia,
  }
}
