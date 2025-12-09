# Wot Design Uni 组件使用文档

> 本项目使用 [wot-design-uni](https://wot-design-uni.cn/) 作为 UI 组件库

## 目录

- [安装配置](#安装配置)
- [基础组件](#基础组件)
- [表单组件](#表单组件)
- [反馈组件](#反馈组件)
- [展示组件](#展示组件)
- [导航组件](#导航组件)
- [业务场景](#业务场景)

---

## 安装配置

### 1. 安装依赖

```bash
pnpm add wot-design-uni
```

### 2. 配置自动导入

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import Components from '@uni-helper/vite-plugin-uni-components'
import { WotResolver } from '@uni-helper/vite-plugin-uni-components/resolvers'

export default defineConfig({
  plugins: [
    uni(),
    Components({
      resolvers: [WotResolver()]
    })
  ]
})
```

### 3. 引入样式

```typescript
// main.ts
import 'wot-design-uni/components/common/abstracts/variable.scss'
```

### 4. TypeScript 支持

```json
// tsconfig.json
{
  "compilerOptions": {
    "types": ["wot-design-uni/global.d.ts"]
  }
}
```

---

## 基础组件

### Button 按钮

```vue
<template>
  <!-- 类型 -->
  <wd-button type="primary">主要按钮</wd-button>
  <wd-button type="success">成功按钮</wd-button>
  <wd-button type="warning">警告按钮</wd-button>
  <wd-button type="danger">危险按钮</wd-button>
  <wd-button type="info">信息按钮</wd-button>

  <!-- 朴素按钮 -->
  <wd-button type="primary" plain>朴素按钮</wd-button>

  <!-- 禁用 -->
  <wd-button type="primary" disabled>禁用按钮</wd-button>

  <!-- 加载中 -->
  <wd-button type="primary" loading>加载中</wd-button>

  <!-- 圆角 -->
  <wd-button type="primary" round>圆角按钮</wd-button>

  <!-- 块级 -->
  <wd-button type="primary" block>块级按钮</wd-button>

  <!-- 尺寸 -->
  <wd-button type="primary" size="small">小按钮</wd-button>
  <wd-button type="primary" size="medium">中按钮</wd-button>
  <wd-button type="primary" size="large">大按钮</wd-button>

  <!-- 图标按钮 -->
  <wd-button type="primary" icon="add-circle">带图标</wd-button>
</template>
```

### Icon 图标

```vue
<template>
  <!-- 基础使用 -->
  <wd-icon name="add-circle" />
  <wd-icon name="chat" />
  <wd-icon name="user" />

  <!-- 尺寸 -->
  <wd-icon name="chat" size="40rpx" />

  <!-- 颜色 -->
  <wd-icon name="chat" color="#07c160" />

  <!-- 常用图标 -->
  <wd-icon name="arrow-right" />   <!-- 右箭头 -->
  <wd-icon name="arrow-left" />    <!-- 左箭头 -->
  <wd-icon name="close" />         <!-- 关闭 -->
  <wd-icon name="check" />         <!-- 勾选 -->
  <wd-icon name="search" />        <!-- 搜索 -->
  <wd-icon name="setting" />       <!-- 设置 -->
  <wd-icon name="picture" />       <!-- 图片 -->
  <wd-icon name="camera" />        <!-- 相机 -->
  <wd-icon name="file" />          <!-- 文件 -->
  <wd-icon name="play" />          <!-- 播放 -->
  <wd-icon name="pause" />         <!-- 暂停 -->
  <wd-icon name="more" />          <!-- 更多 -->
  <wd-icon name="add" />           <!-- 添加 -->
  <wd-icon name="delete" />        <!-- 删除 -->
  <wd-icon name="edit" />          <!-- 编辑 -->
  <wd-icon name="share" />         <!-- 分享 -->
  <wd-icon name="scan" />          <!-- 扫码 -->
</template>
```

### Image 图片

```vue
<template>
  <!-- 基础使用 -->
  <wd-img
    width="200rpx"
    height="200rpx"
    src="https://example.com/image.jpg"
  />

  <!-- 填充模式 -->
  <wd-img
    width="200rpx"
    height="200rpx"
    src="xxx"
    mode="aspectFill"
  />
  <!-- mode: scaleToFill | aspectFit | aspectFill | widthFix | heightFix -->

  <!-- 圆形 -->
  <wd-img
    width="100rpx"
    height="100rpx"
    src="xxx"
    round
  />

  <!-- 懒加载 -->
  <wd-img src="xxx" lazy-load />

  <!-- 加载失败 -->
  <wd-img src="xxx">
    <template #error>
      <view class="error">加载失败</view>
    </template>
  </wd-img>

  <!-- 预览 -->
  <wd-img
    src="xxx"
    enable-preview
    :preview-src-list="['url1', 'url2']"
  />
</template>
```

---

## 表单组件

### Input 输入框

```vue
<template>
  <!-- 基础使用 -->
  <wd-input v-model="value" placeholder="请输入" />

  <!-- 类型 -->
  <wd-input v-model="value" type="text" />
  <wd-input v-model="value" type="number" />
  <wd-input v-model="value" type="password" />
  <wd-input v-model="value" type="textarea" />

  <!-- 禁用/只读 -->
  <wd-input v-model="value" disabled />
  <wd-input v-model="value" readonly />

  <!-- 清除按钮 -->
  <wd-input v-model="value" clearable />

  <!-- 显示字数统计 -->
  <wd-input v-model="value" maxlength="100" show-word-limit />

  <!-- 前后插槽 -->
  <wd-input v-model="value">
    <template #prefix>
      <wd-icon name="user" />
    </template>
    <template #suffix>
      <wd-button size="small" type="primary">发送</wd-button>
    </template>
  </wd-input>

  <!-- 带标签 -->
  <wd-input v-model="value" label="用户名" label-width="80px" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
const value = ref('')
</script>
```

### Textarea 文本域

```vue
<template>
  <wd-textarea
    v-model="content"
    placeholder="请输入内容"
    :maxlength="500"
    show-word-limit
    :rows="4"
    clearable
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
const content = ref('')
</script>
```

### Search 搜索框

```vue
<template>
  <!-- 基础使用 -->
  <wd-search v-model="keyword" placeholder="搜索" />

  <!-- 显示取消按钮 -->
  <wd-search
    v-model="keyword"
    placeholder="搜索"
    show-action
    @search="onSearch"
    @cancel="onCancel"
  />

  <!-- 禁用（作为入口） -->
  <wd-search
    v-model="keyword"
    disabled
    @click="goSearchPage"
  />

  <!-- 自定义样式 -->
  <wd-search
    v-model="keyword"
    placeholder-left
    hide-cancel
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const keyword = ref('')

function onSearch(value: string) {
  console.log('搜索:', value)
}

function onCancel() {
  keyword.value = ''
}
</script>
```

### Form 表单

```vue
<template>
  <wd-form ref="formRef" :model="formData" :rules="rules">
    <wd-cell-group>
      <wd-input
        v-model="formData.username"
        label="用户名"
        prop="username"
        placeholder="请输入用户名"
        clearable
      />
      <wd-input
        v-model="formData.password"
        label="密码"
        prop="password"
        type="password"
        placeholder="请输入密码"
        clearable
      />
      <wd-input
        v-model="formData.phone"
        label="手机号"
        prop="phone"
        type="number"
        placeholder="请输入手机号"
        clearable
      />
    </wd-cell-group>

    <view class="form-footer">
      <wd-button type="primary" block @click="submitForm">提交</wd-button>
    </view>
  </wd-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const formRef = ref()

const formData = reactive({
  username: '',
  password: '',
  phone: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名' },
    { min: 3, max: 20, message: '长度3-20个字符' }
  ],
  password: [
    { required: true, message: '请输入密码' },
    { min: 6, message: '密码至少6位' }
  ],
  phone: [
    { required: true, message: '请输入手机号' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
  ]
}

async function submitForm() {
  try {
    await formRef.value.validate()
    console.log('验证通过', formData)
    // 提交逻辑
  } catch (errors) {
    console.log('验证失败', errors)
  }
}
</script>
```

### Picker 选择器

```vue
<template>
  <!-- 单列选择 -->
  <wd-picker
    v-model="value"
    label="选择"
    :columns="columns"
    @confirm="onConfirm"
  />

  <!-- 多列选择 -->
  <wd-picker
    v-model="multiValue"
    label="多列选择"
    :columns="multiColumns"
    :column-change="onColumnChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const value = ref('')
const columns = ['选项1', '选项2', '选项3']

const multiValue = ref([])
const multiColumns = ref([
  ['北京', '上海', '广州'],
  ['朝阳区', '海淀区', '西城区']
])

function onConfirm({ value }) {
  console.log('选中:', value)
}

function onColumnChange({ selectedItem, index, resolve }) {
  // 联动逻辑
  resolve(newColumns)
}
</script>
```

### Switch 开关

```vue
<template>
  <wd-switch v-model="checked" />
  <wd-switch v-model="checked" disabled />
  <wd-switch v-model="checked" active-color="#07c160" />
  <wd-switch v-model="checked" size="24px" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
const checked = ref(false)
</script>
```

### Checkbox 复选框

```vue
<template>
  <!-- 单个 -->
  <wd-checkbox v-model="checked">同意协议</wd-checkbox>

  <!-- 复选框组 -->
  <wd-checkbox-group v-model="checkedList">
    <wd-checkbox value="1">选项1</wd-checkbox>
    <wd-checkbox value="2">选项2</wd-checkbox>
    <wd-checkbox value="3">选项3</wd-checkbox>
  </wd-checkbox-group>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const checked = ref(false)
const checkedList = ref(['1'])
</script>
```

### Radio 单选框

```vue
<template>
  <wd-radio-group v-model="value">
    <wd-radio value="1">选项1</wd-radio>
    <wd-radio value="2">选项2</wd-radio>
    <wd-radio value="3">选项3</wd-radio>
  </wd-radio-group>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const value = ref('1')
</script>
```

---

## 反馈组件

### Toast 轻提示

```typescript
// 使用方式
import { useToast } from 'wot-design-uni'

const toast = useToast()

// 文字提示
toast.show('提示内容')

// 成功
toast.success('操作成功')

// 失败
toast.error('操作失败')

// 警告
toast.warning('警告信息')

// 加载中
toast.loading('加载中...')

// 关闭
toast.close()

// 带配置
toast.show({
  msg: '提示内容',
  duration: 3000,
  iconName: 'check',
  position: 'middle'
})
```

```vue
<template>
  <!-- 也可使用组件形式 -->
  <wd-toast />
</template>

<script setup lang="ts">
import { useToast } from 'wot-design-uni'

const toast = useToast()

function showToast() {
  toast.success('成功')
}
</script>
```

### Message 消息提示

```typescript
import { useMessage } from 'wot-design-uni'

const message = useMessage()

// 基础使用
message.show('这是一条消息')

// 类型
message.success('成功消息')
message.error('错误消息')
message.warning('警告消息')
message.info('信息提示')

// 配置
message.show({
  msg: '消息内容',
  type: 'success',
  duration: 3000,
  closable: true
})
```

### Dialog 对话框

```vue
<template>
  <wd-message-box />
</template>

<script setup lang="ts">
import { useMessage } from 'wot-design-uni'

const messageBox = useMessage()

// 提示框
async function showAlert() {
  await messageBox.alert({
    title: '提示',
    msg: '这是一条提示信息'
  })
  console.log('点击了确定')
}

// 确认框
async function showConfirm() {
  try {
    await messageBox.confirm({
      title: '确认',
      msg: '确定要删除吗？'
    })
    console.log('点击了确定')
  } catch {
    console.log('点击了取消')
  }
}

// 输入框
async function showPrompt() {
  try {
    const { value } = await messageBox.prompt({
      title: '请输入',
      inputPlaceholder: '请输入内容'
    })
    console.log('输入内容:', value)
  } catch {
    console.log('取消输入')
  }
}

// 自定义按钮
messageBox.confirm({
  title: '提示',
  msg: '自定义按钮文字',
  confirmButtonText: '好的',
  cancelButtonText: '算了'
})
</script>
```

### ActionSheet 动作面板

```vue
<template>
  <wd-action-sheet
    v-model="visible"
    :actions="actions"
    @select="onSelect"
    @cancel="onCancel"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)

const actions = [
  { name: '选项1' },
  { name: '选项2' },
  { name: '选项3', color: '#ee0a24' },
  { name: '禁用选项', disabled: true }
]

function onSelect(item, index) {
  console.log('选中:', item.name, index)
}

function onCancel() {
  console.log('取消')
}

// 打开
function open() {
  visible.value = true
}
</script>
```

### Popup 弹出层

```vue
<template>
  <!-- 基础弹出层 -->
  <wd-popup v-model="show" position="bottom">
    <view class="popup-content">
      弹出内容
    </view>
  </wd-popup>

  <!-- 位置 -->
  <wd-popup v-model="show" position="top" />
  <wd-popup v-model="show" position="bottom" />
  <wd-popup v-model="show" position="left" />
  <wd-popup v-model="show" position="right" />
  <wd-popup v-model="show" position="center" />

  <!-- 圆角 -->
  <wd-popup v-model="show" position="bottom" round />

  <!-- 关闭按钮 -->
  <wd-popup v-model="show" closable />

  <!-- 禁止点击遮罩关闭 -->
  <wd-popup v-model="show" :close-on-click-modal="false" />

  <!-- 安全区域 -->
  <wd-popup v-model="show" position="bottom" safe-area-inset-bottom />
</template>

<script setup lang="ts">
import { ref } from 'vue'
const show = ref(false)
</script>
```

### Loading 加载

```vue
<template>
  <!-- 基础使用 -->
  <wd-loading />

  <!-- 类型 -->
  <wd-loading type="spinner" />
  <wd-loading type="circular" />

  <!-- 尺寸 -->
  <wd-loading size="24px" />

  <!-- 颜色 -->
  <wd-loading color="#07c160" />

  <!-- 文字 -->
  <wd-loading>加载中...</wd-loading>
</template>
```

### Notify 消息通知

```typescript
import { useNotify } from 'wot-design-uni'

const notify = useNotify()

// 基础使用
notify.show('消息内容')

// 类型
notify.primary('主要通知')
notify.success('成功通知')
notify.warning('警告通知')
notify.danger('危险通知')

// 配置
notify.show({
  message: '通知内容',
  type: 'success',
  duration: 3000,
  position: 'top'
})
```

---

## 展示组件

### Cell 单元格

```vue
<template>
  <!-- 基础单元格 -->
  <wd-cell title="标题" value="内容" />

  <!-- 带图标 -->
  <wd-cell title="标题" icon="user" />

  <!-- 带箭头 -->
  <wd-cell title="标题" is-link />

  <!-- 可点击 -->
  <wd-cell title="标题" is-link @click="onClick" />

  <!-- 居中 -->
  <wd-cell title="标题" value="内容" center />

  <!-- 描述 -->
  <wd-cell title="标题" label="描述信息" value="内容" />

  <!-- 自定义内容 -->
  <wd-cell title="标题">
    <template #value>
      <wd-button size="small">按钮</wd-button>
    </template>
  </wd-cell>

  <!-- 分组 -->
  <wd-cell-group title="分组标题">
    <wd-cell title="单元格1" value="内容" />
    <wd-cell title="单元格2" value="内容" />
  </wd-cell-group>
</template>
```

### Badge 徽标

```vue
<template>
  <!-- 数字 -->
  <wd-badge :value="5">
    <wd-button>按钮</wd-button>
  </wd-badge>

  <!-- 最大值 -->
  <wd-badge :value="100" :max="99">
    <wd-button>按钮</wd-button>
  </wd-badge>

  <!-- 小红点 -->
  <wd-badge is-dot>
    <wd-button>按钮</wd-button>
  </wd-badge>

  <!-- 自定义内容 -->
  <wd-badge value="NEW">
    <wd-button>按钮</wd-button>
  </wd-badge>

  <!-- 自定义颜色 -->
  <wd-badge :value="5" bg-color="#07c160">
    <wd-button>按钮</wd-button>
  </wd-badge>
</template>
```

### Tag 标签

```vue
<template>
  <!-- 类型 -->
  <wd-tag>标签</wd-tag>
  <wd-tag type="primary">主要</wd-tag>
  <wd-tag type="success">成功</wd-tag>
  <wd-tag type="warning">警告</wd-tag>
  <wd-tag type="danger">危险</wd-tag>

  <!-- 朴素 -->
  <wd-tag type="primary" plain>朴素</wd-tag>

  <!-- 圆角 -->
  <wd-tag type="primary" round>圆角</wd-tag>

  <!-- 标记 -->
  <wd-tag type="primary" mark>标记</wd-tag>

  <!-- 可关闭 -->
  <wd-tag type="primary" closable @close="onClose">可关闭</wd-tag>

  <!-- 尺寸 -->
  <wd-tag size="small">小</wd-tag>
  <wd-tag size="medium">中</wd-tag>
  <wd-tag size="large">大</wd-tag>
</template>
```

### Empty 空状态

```vue
<template>
  <!-- 默认 -->
  <wd-empty description="暂无数据" />

  <!-- 图片类型 -->
  <wd-empty image="network" description="网络错误" />
  <wd-empty image="search" description="搜索为空" />
  <wd-empty image="content" description="暂无内容" />

  <!-- 自定义图片 -->
  <wd-empty :image="customImage" description="自定义" />

  <!-- 底部操作 -->
  <wd-empty description="暂无数据">
    <wd-button type="primary" size="small">重新加载</wd-button>
  </wd-empty>
</template>
```

### Collapse 折叠面板

```vue
<template>
  <wd-collapse v-model="activeNames">
    <wd-collapse-item title="标题1" name="1">
      内容1
    </wd-collapse-item>
    <wd-collapse-item title="标题2" name="2">
      内容2
    </wd-collapse-item>
    <wd-collapse-item title="标题3" name="3">
      内容3
    </wd-collapse-item>
  </wd-collapse>

  <!-- 手风琴模式（只能展开一个） -->
  <wd-collapse v-model="activeName" accordion>
    <!-- ... -->
  </wd-collapse>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const activeNames = ref(['1'])
const activeName = ref('1')
</script>
```

### Progress 进度条

```vue
<template>
  <!-- 基础 -->
  <wd-progress :percentage="50" />

  <!-- 状态 -->
  <wd-progress :percentage="100" status="success" />
  <wd-progress :percentage="50" status="danger" />

  <!-- 隐藏文字 -->
  <wd-progress :percentage="50" :show-text="false" />

  <!-- 线宽 -->
  <wd-progress :percentage="50" :stroke-width="12" />

  <!-- 自定义颜色 -->
  <wd-progress :percentage="50" color="#07c160" />
</template>
```

### Skeleton 骨架屏

```vue
<template>
  <!-- 基础 -->
  <wd-skeleton :loading="loading">
    <view>实际内容</view>
  </wd-skeleton>

  <!-- 显示头像 -->
  <wd-skeleton :loading="loading" avatar />

  <!-- 自定义行数 -->
  <wd-skeleton :loading="loading" :row="4" />

  <!-- 动画 -->
  <wd-skeleton :loading="loading" animated />
</template>

<script setup lang="ts">
import { ref } from 'vue'
const loading = ref(true)
</script>
```

### Swiper 轮播

```vue
<template>
  <wd-swiper
    :list="images"
    autoplay
    :interval="3000"
    indicator
  />

  <!-- 自定义指示器 -->
  <wd-swiper :list="images">
    <template #indicator="{ current, total }">
      <view class="indicator">{{ current + 1 }}/{{ total }}</view>
    </template>
  </wd-swiper>
</template>

<script setup lang="ts">
const images = [
  'https://example.com/1.jpg',
  'https://example.com/2.jpg',
  'https://example.com/3.jpg'
]
</script>
```

---

## 导航组件

### Navbar 导航栏

```vue
<template>
  <!-- 基础 -->
  <wd-navbar title="标题" />

  <!-- 返回按钮 -->
  <wd-navbar title="标题" left-arrow @click-left="goBack" />

  <!-- 自定义左侧 -->
  <wd-navbar title="标题">
    <template #left>
      <wd-icon name="arrow-left" @click="goBack" />
    </template>
  </wd-navbar>

  <!-- 自定义右侧 -->
  <wd-navbar title="标题" left-arrow>
    <template #right>
      <wd-icon name="more" />
    </template>
  </wd-navbar>

  <!-- 固定顶部 -->
  <wd-navbar title="标题" fixed placeholder />
</template>

<script setup lang="ts">
function goBack() {
  uni.navigateBack()
}
</script>
```

### Tabbar 标签栏

```vue
<template>
  <wd-tabbar v-model="active" fixed placeholder safe-area-inset-bottom>
    <wd-tabbar-item icon="chat" title="消息" :badge="99" />
    <wd-tabbar-item icon="user" title="联系人" />
    <wd-tabbar-item icon="picture" title="朋友圈" dot />
  </wd-tabbar>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const active = ref(0)
</script>
```

### Tabs 标签页

```vue
<template>
  <wd-tabs v-model="active">
    <wd-tab title="标签1">内容1</wd-tab>
    <wd-tab title="标签2">内容2</wd-tab>
    <wd-tab title="标签3">内容3</wd-tab>
  </wd-tabs>

  <!-- 滑动切换 -->
  <wd-tabs v-model="active" swipeable animated>
    <!-- ... -->
  </wd-tabs>

  <!-- 粘性布局 -->
  <wd-tabs v-model="active" sticky>
    <!-- ... -->
  </wd-tabs>

  <!-- 徽标 -->
  <wd-tabs v-model="active">
    <wd-tab title="标签1" :badge="5">内容1</wd-tab>
    <wd-tab title="标签2" dot>内容2</wd-tab>
  </wd-tabs>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const active = ref(0)
</script>
```

### IndexBar 索引栏

```vue
<template>
  <wd-index-bar>
    <view v-for="item in list" :key="item.index">
      <wd-index-anchor :index="item.index" />
      <wd-cell v-for="name in item.children" :key="name" :title="name" />
    </view>
  </wd-index-bar>
</template>

<script setup lang="ts">
const list = [
  { index: 'A', children: ['阿明', '阿强'] },
  { index: 'B', children: ['白云', '贝贝'] },
  { index: 'C', children: ['陈晨', '陈明'] }
]
</script>
```

### SwipeAction 滑动操作

```vue
<template>
  <wd-swipe-action>
    <wd-cell title="左滑查看操作" />
    <template #right>
      <view class="action action-warn" @click="onTop">置顶</view>
      <view class="action action-danger" @click="onDelete">删除</view>
    </template>
  </wd-swipe-action>

  <!-- 左侧操作 -->
  <wd-swipe-action>
    <template #left>
      <view class="action">标记已读</view>
    </template>
    <wd-cell title="双向滑动" />
    <template #right>
      <view class="action">删除</view>
    </template>
  </wd-swipe-action>
</template>

<style scoped>
.action {
  display: flex;
  align-items: center;
  padding: 0 20rpx;
  height: 100%;
}
.action-warn {
  background: #ff976a;
  color: #fff;
}
.action-danger {
  background: #ee0a24;
  color: #fff;
}
</style>
```

### PullRefresh 下拉刷新

```vue
<template>
  <wd-pull-refresh v-model="refreshing" @refresh="onRefresh">
    <view class="content">
      内容区域
    </view>
  </wd-pull-refresh>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const refreshing = ref(false)

function onRefresh() {
  setTimeout(() => {
    refreshing.value = false
  }, 1000)
}
</script>
```

### Loadmore 加载更多

```vue
<template>
  <view class="list">
    <view v-for="item in list" :key="item.id">
      {{ item.name }}
    </view>
  </view>
  <wd-loadmore :state="loadState" @loadmore="loadMore" />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const list = ref([])
const loadState = ref<'loading' | 'finished' | 'error'>('loading')

function loadMore() {
  // 加载数据
  loadState.value = 'loading'
  fetchData().then(data => {
    list.value.push(...data)
    loadState.value = data.length < 20 ? 'finished' : 'loading'
  }).catch(() => {
    loadState.value = 'error'
  })
}
</script>
```

---

## 业务场景

### 场景1：会话列表项

```vue
<template>
  <wd-swipe-action>
    <wd-cell
      :title="conversation.name"
      :label="conversation.lastMessage"
      is-link
      @click="goChat"
    >
      <template #icon>
        <wd-img
          :src="conversation.avatar"
          width="88rpx"
          height="88rpx"
          round
        />
      </template>
      <template #value>
        <view class="meta">
          <text class="time">{{ formatTime(conversation.lastTime) }}</text>
          <wd-badge v-if="conversation.unread" :value="conversation.unread" />
          <wd-icon v-if="conversation.isMuted" name="volume-off" size="28rpx" />
        </view>
      </template>
    </wd-cell>
    <template #right>
      <view class="action" @click="toggleTop">
        {{ conversation.isTop ? '取消置顶' : '置顶' }}
      </view>
      <view class="action danger" @click="deleteConversation">删除</view>
    </template>
  </wd-swipe-action>
</template>
```

### 场景2：聊天消息输入

```vue
<template>
  <view class="message-input">
    <view class="toolbar">
      <wd-icon name="emotion" size="48rpx" @click="showEmoji" />
      <wd-icon name="picture" size="48rpx" @click="chooseImage" />
      <wd-icon name="folder" size="48rpx" @click="chooseFile" />
    </view>
    <view class="input-area">
      <wd-input
        v-model="message"
        type="textarea"
        :auto-height="true"
        placeholder="输入消息..."
        @confirm="sendMessage"
      />
    </view>
    <wd-button
      v-if="message"
      type="primary"
      size="small"
      @click="sendMessage"
    >
      发送
    </wd-button>
    <wd-icon v-else name="add-circle" size="48rpx" @click="showMore" />
  </view>
</template>
```

### 场景3：好友申请列表

```vue
<template>
  <view class="request-item">
    <wd-cell :label="request.message">
      <template #icon>
        <wd-img
          :src="request.fromUser.avatar"
          width="80rpx"
          height="80rpx"
          round
        />
      </template>
      <template #title>
        <text class="name">{{ request.fromUser.name }}</text>
      </template>
      <template #value>
        <view v-if="request.status === 'pending'" class="actions">
          <wd-button size="small" @click="reject">拒绝</wd-button>
          <wd-button size="small" type="primary" @click="accept">同意</wd-button>
        </view>
        <text v-else class="status">
          {{ request.status === 'accepted' ? '已添加' : '已拒绝' }}
        </text>
      </template>
    </wd-cell>
  </view>
</template>
```

### 场景4：朋友圈动态卡片

```vue
<template>
  <view class="moment-card">
    <!-- 用户信息 -->
    <view class="header">
      <wd-img :src="moment.user.avatar" width="80rpx" height="80rpx" round />
      <view class="info">
        <text class="name">{{ moment.user.name }}</text>
        <text class="time">{{ formatTime(moment.createdAt) }}</text>
      </view>
    </view>

    <!-- 内容 -->
    <view class="content">{{ moment.content }}</view>

    <!-- 图片 -->
    <view v-if="moment.mediaType === 1" class="images">
      <wd-img
        v-for="(url, index) in moment.mediaUrls"
        :key="index"
        :src="url"
        width="200rpx"
        height="200rpx"
        mode="aspectFill"
        enable-preview
        :preview-src-list="moment.mediaUrls"
      />
    </view>

    <!-- 操作栏 -->
    <view class="actions">
      <view class="action" @click="toggleLike">
        <wd-icon
          :name="moment.isLiked ? 'heart-fill' : 'heart'"
          :color="moment.isLiked ? '#ee0a24' : ''"
        />
        <text>{{ moment.likeCount || '赞' }}</text>
      </view>
      <view class="action" @click="showComment">
        <wd-icon name="comment" />
        <text>{{ moment.commentCount || '评论' }}</text>
      </view>
    </view>

    <!-- 点赞和评论 -->
    <view v-if="moment.likes?.length || moment.comments?.length" class="interactions">
      <!-- 点赞列表 -->
      <view v-if="moment.likes?.length" class="likes">
        <wd-icon name="heart-fill" color="#ee0a24" size="24rpx" />
        <text>{{ moment.likes.map(l => l.user?.name).join('、') }}</text>
      </view>
      <!-- 评论列表 -->
      <view v-for="comment in moment.comments" :key="comment.id" class="comment">
        <text class="name">{{ comment.user?.name }}</text>
        <text v-if="comment.replyToUser">
          回复 <text class="name">{{ comment.replyToUser.name }}</text>
        </text>
        <text>: {{ comment.content }}</text>
      </view>
    </view>
  </view>
</template>
```

### 场景5：设置页面

```vue
<template>
  <view class="settings">
    <wd-cell-group title="账号设置">
      <wd-cell title="个人资料" is-link @click="goProfile" />
      <wd-cell title="账号与安全" is-link />
    </wd-cell-group>

    <wd-cell-group title="通用设置">
      <wd-cell title="消息通知" is-link />
      <wd-cell title="隐私设置" is-link />
      <wd-cell title="深色模式" center>
        <template #value>
          <wd-switch v-model="isDark" @change="toggleTheme" />
        </template>
      </wd-cell>
      <wd-cell title="清除缓存" is-link @click="clearCache" />
    </wd-cell-group>

    <wd-cell-group title="关于">
      <wd-cell title="版本" :value="version" />
      <wd-cell title="用户协议" is-link />
      <wd-cell title="隐私政策" is-link />
    </wd-cell-group>

    <view class="logout">
      <wd-button type="danger" block @click="logout">退出登录</wd-button>
    </view>
  </view>
</template>
```

---

## 主题定制

### 修改主题色

```scss
// uni.scss
@import 'wot-design-uni/components/common/abstracts/_variable.scss';

// 覆盖变量
$-color-theme: #07c160;
$-color-success: #07c160;
$-color-danger: #ee0a24;
$-color-warning: #ff976a;
```

### 暗色模式适配

```scss
// 暗色模式下的组件样式覆盖
page.dark {
  // Cell
  --wot-cell-bg-color: var(--bg-content);
  --wot-cell-title-color: var(--text-primary);
  --wot-cell-label-color: var(--text-secondary);
  --wot-cell-value-color: var(--text-tertiary);

  // Button
  --wot-button-normal-bg-color: var(--bg-content);
  --wot-button-normal-color: var(--text-primary);

  // Input
  --wot-input-bg-color: var(--bg-content);
  --wot-input-color: var(--text-primary);
  --wot-input-placeholder-color: var(--text-placeholder);
}
```

---

## 常见问题

### 1. 组件样式不生效

确保在 `main.ts` 中引入了样式文件：

```typescript
import 'wot-design-uni/components/common/abstracts/variable.scss'
```

### 2. TypeScript 类型报错

在 `tsconfig.json` 中添加类型声明：

```json
{
  "compilerOptions": {
    "types": ["wot-design-uni/global.d.ts"]
  }
}
```

### 3. 自动导入不生效

检查 `vite.config.ts` 配置是否正确，确保安装了 `@uni-helper/vite-plugin-uni-components`。

### 4. 小程序端组件不显示

某些组件在小程序端需要在 `pages.json` 中配置：

```json
{
  "usingComponents": {
    "wd-button": "wot-design-uni/components/wd-button/wd-button"
  }
}
```

---

## 参考链接

- [wot-design-uni 官方文档](https://wot-design-uni.cn/)
- [组件列表](https://wot-design-uni.cn/component/button.html)
- [主题定制](https://wot-design-uni.cn/guide/custom-theme.html)
- [GitHub 仓库](https://github.com/Moonofweisheng/wot-design-uni)
