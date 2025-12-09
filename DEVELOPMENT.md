# NL-IM UniApp 移动端开发手册

> 基于 nl-im-vue-ts Web 端项目迁移，支持 App（Android/iOS）和微信小程序

## 目录

- [一、项目概述](#一项目概述)
- [二、目录结构](#二目录结构)
- [三、页面设计](#三页面设计qq-风格)
- [四、API 接口](#四api-接口文档)
- [五、类型定义](#五类型定义)
- [六、状态管理](#六状态管理pinia-store)
- [七、WebSocket](#七websocket-通讯)
- [八、主题系统](#八主题系统)
- [九、平台适配](#九平台适配)
- [十、UI 组件](#十ui-组件wot-design-uni)
- [十一、工具函数](#十一工具函数)
- [十二、开发规范](#十二开发规范)
- [十三、快速开始](#十三快速开始)
- [十四、功能清单](#十四功能清单)

---

## 一、项目概述

### 1.1 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| UniApp | 3.0+ | 跨平台框架 |
| Vue | 3.4.x | 前端框架 |
| TypeScript | 5.x | 类型支持 |
| Pinia | 2.2.x | 状态管理 |
| wot-design-uni | 1.13+ | UI 组件库 |
| Vite | 5.x | 构建工具 |

### 1.2 支持平台

| 平台 | 状态 | 说明 |
|------|------|------|
| Android | 支持 | App |
| iOS | 支持 | App |
| 微信小程序 | 支持 | 主要平台 |
| H5 | 可选 | 移动端网页 |

### 1.3 设计风格

- UI 参考**手机 QQ**
- 支持**浅色/暗色**两种主题
- 适配不同屏幕尺寸
- 遵循各平台设计规范

---

## 二、目录结构

```
nl-im-uniapp/src/
├── api/                        # API 接口层
│   ├── modules/                # 业务模块
│   │   ├── auth.ts             # 认证（登录/注册/验证码）
│   │   ├── user.ts             # 用户（信息/列表）
│   │   ├── contact.ts          # 联系人（好友/分组/申请）
│   │   ├── conversation.ts     # 会话（列表/未读/置顶）
│   │   ├── message.ts          # 消息（发送/历史/同步）
│   │   ├── room.ts             # 群聊（创建/成员/设置）
│   │   ├── moment.ts           # 朋友圈（动态/点赞/评论）
│   │   ├── attachment.ts       # 附件（上传/下载）
│   │   └── system.ts           # 系统（健康检查/配置）
│   ├── request/                # 请求封装
│   │   ├── index.ts            # uni.request 封装
│   │   └── types.ts            # 请求/响应类型
│   └── websocket/              # 实时通讯
│       └── index.ts            # WebSocket 管理器
│
├── components/                 # 公共组件
│   ├── chat/                   # 聊天组件
│   │   ├── MessageBubble.vue   # 消息气泡容器
│   │   ├── MessageInput.vue    # 消息输入框
│   │   ├── MessageList.vue     # 消息列表
│   │   └── bubble/             # 气泡类型
│   │       ├── TextBubble.vue
│   │       ├── ImageBubble.vue
│   │       ├── AudioBubble.vue
│   │       ├── VideoBubble.vue
│   │       └── FileBubble.vue
│   ├── common/                 # 通用组件
│   │   ├── AppNavBar.vue       # 导航栏
│   │   ├── AppTabBar.vue       # 底部标签栏
│   │   ├── AppDrawer.vue       # 侧边抽屉
│   │   ├── AppAvatar.vue       # 头像
│   │   ├── AppSearch.vue       # 搜索框
│   │   ├── AppEmpty.vue        # 空状态
│   │   └── AppLoading.vue      # 加载状态
│   ├── contact/                # 联系人组件
│   │   ├── ContactItem.vue     # 联系人项
│   │   └── ContactGroup.vue    # 联系人分组
│   └── moment/                 # 朋友圈组件
│       ├── MomentCard.vue      # 动态卡片
│       ├── MomentPublisher.vue # 发布器
│       └── MomentComment.vue   # 评论组件
│
├── composables/                # 组合式函数
│   ├── useTheme.ts             # 主题管理
│   ├── useAuth.ts              # 认证状态
│   ├── useSocket.ts            # WebSocket
│   └── useUpload.ts            # 文件上传
│
├── pages/                      # 页面
│   ├── index/                  # 首页（会话）
│   │   └── index.vue
│   ├── chat/                   # 聊天
│   │   ├── index.vue           # 聊天详情
│   │   └── group-info.vue      # 群信息
│   ├── contact/                # 联系人
│   │   ├── index.vue           # 联系人列表
│   │   ├── detail.vue          # 好友详情
│   │   ├── add.vue             # 添加好友
│   │   ├── requests.vue        # 好友申请
│   │   └── groups.vue          # 群聊列表
│   ├── moment/                 # 朋友圈
│   │   ├── index.vue           # 动态列表
│   │   ├── detail.vue          # 动态详情
│   │   ├── publish.vue         # 发布动态
│   │   └── notify.vue          # 消息通知
│   ├── login/                  # 登录
│   │   └── index.vue
│   ├── profile/                # 个人中心
│   │   ├── index.vue           # 个人资料
│   │   └── edit.vue            # 编辑资料
│   ├── settings/               # 设置
│   │   └── index.vue
│   └── search/                 # 搜索
│       └── index.vue
│
├── stores/                     # Pinia Store
│   ├── auth.ts                 # 认证
│   ├── chat.ts                 # 聊天
│   ├── contact.ts              # 联系人
│   ├── conversation.ts         # 会话
│   ├── moment.ts               # 朋友圈
│   └── app.ts                  # 全局应用
│
├── types/                      # 类型定义
│   ├── api.ts                  # API 类型
│   ├── conversation.ts         # 会话类型
│   ├── message.ts              # 消息类型
│   ├── moment.ts               # 朋友圈类型
│   └── user.ts                 # 用户类型
│
├── utils/                      # 工具函数
│   ├── storage.ts              # 本地存储
│   ├── format.ts               # 格式化
│   ├── message.ts              # 消息处理
│   └── platform.ts             # 平台判断
│
├── styles/                     # 样式
│   ├── variables.scss          # CSS 变量
│   ├── theme.scss              # 主题定义
│   └── common.scss             # 公共样式
│
├── static/                     # 静态资源
│   ├── images/
│   └── icons/
│
├── App.vue                     # 根组件
├── main.ts                     # 入口文件
├── pages.json                  # 页面配置
├── manifest.json               # 应用配置
├── theme.json                  # 主题配置
└── uni.scss                    # uni 变量
```

---

## 三、页面设计（QQ 风格）

### 3.1 页面路由配置

```json
// pages.json
{
  "pages": [
    { "path": "pages/index/index", "style": { "navigationStyle": "custom" } },
    { "path": "pages/chat/index", "style": { "navigationBarTitleText": "聊天" } },
    { "path": "pages/contact/index", "style": { "navigationStyle": "custom" } },
    { "path": "pages/moment/index", "style": { "navigationStyle": "custom" } },
    { "path": "pages/login/index", "style": { "navigationBarTitleText": "登录" } }
  ],
  "tabBar": {
    "list": [
      { "pagePath": "pages/index/index", "text": "消息", "iconPath": "...", "selectedIconPath": "..." },
      { "pagePath": "pages/contact/index", "text": "联系人", "iconPath": "...", "selectedIconPath": "..." },
      { "pagePath": "pages/moment/index", "text": "朋友圈", "iconPath": "...", "selectedIconPath": "..." }
    ]
  }
}
```

### 3.2 首页（会话页）

**路径**: `pages/index/index.vue`

```
┌─────────────────────────────────────┐
│  [头像]     消息           [+]      │  ← 自定义导航栏
├─────────────────────────────────────┤
│  🔍 搜索                            │  ← 搜索框
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │ [头像] 张三          14:30  │    │
│  │        你好，在吗？    [3]  │    │  ← 会话项
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ [头像] 工作群        昨天   │    │
│  │        李四: 收到      🔇   │    │
│  └─────────────────────────────┘    │
│               ...                    │
├─────────────────────────────────────┤
│    消息      联系人      朋友圈     │  ← TabBar
└─────────────────────────────────────┘
```

**功能点**:
- 点击头像 → 弹出左侧抽屉
- 点击加号 → 显示菜单（创建群聊/添加好友/扫一扫）
- 点击搜索 → 跳转搜索页
- 长按会话 → 显示操作菜单（置顶/删除/免打扰）
- 左滑会话 → 快捷操作

**左侧抽屉内容**:
```
┌────────────────────┐
│      [大头像]      │
│       昵称         │
│     个性签名       │
├────────────────────┤
│  👤  个人资料      │
│  ⚙️  设置          │
│  🌙  深色模式 [开关]│
├────────────────────┤
│  📤  退出登录      │
└────────────────────┘
```

### 3.3 聊天页

**路径**: `pages/chat/index.vue`

```
┌─────────────────────────────────────┐
│  [<]  张三 / 工作群(10)       [···] │  ← 导航栏（群聊显示成员数和更多按钮）
├─────────────────────────────────────┤
│                                     │
│          ┌──────────┐               │
│          │  你好    │  14:30        │  ← 对方消息（左侧）
│          └──────────┘               │
│                                     │
│                    ┌──────────┐     │
│           14:31    │  在的    │     │  ← 我的消息（右侧）
│                    └──────────┘     │
│                                     │
│              系统消息               │  ← 系统/通知消息（居中）
│                                     │
├─────────────────────────────────────┤
│  [😊] [📷] [📁]  输入消息...  [发送] │  ← 输入栏
└─────────────────────────────────────┘
```

**消息类型展示**:
| 类型 | 展示方式 |
|------|----------|
| 文本 | 气泡+文字 |
| 图片 | 缩略图，点击预览 |
| 语音 | 播放条+时长 |
| 视频 | 封面+播放按钮 |
| 文件 | 图标+文件名+大小 |
| 系统 | 居中灰色文字 |

### 3.4 联系人页

**路径**: `pages/contact/index.vue`

```
┌─────────────────────────────────────┐
│           联系人                    │
├─────────────────────────────────────┤
│  🔍 搜索                            │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │ [👥] 新朋友              [2] │    │  ← 功能入口
│  │ [👪] 群聊                    │    │
│  │ [🔔] 群通知              [1] │    │
│  └─────────────────────────────┘    │
├─────────────────────────────────────┤
│  A ─────────────────────────        │
│  │ [头像] 阿明                      │  ← 按字母分组
│  │ [头像] 阿强                      │
│  B ─────────────────────────        │
│  │ [头像] 白云                      │
│               ...                    │  ← 右侧字母索引
└─────────────────────────────────────┘
```

### 3.5 朋友圈页

**路径**: `pages/moment/index.vue`

```
┌─────────────────────────────────────┐
│                             朋友圈   │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │       [封面背景图]          │    │
│  │                     [头像]  │    │  ← 个人封面区
│  │                       昵称  │    │
│  └─────────────────────────────┘    │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │ [头像] 张三       2小时前   │    │
│  │ 今天天气真好！              │    │
│  │ [图片] [图片] [图片]        │    │  ← 动态卡片
│  │ ────────────────────        │    │
│  │ ❤️ 李四、王五               │    │
│  │ 李四: 确实不错              │    │
│  │ [评论输入...]         [❤️]  │    │
│  └─────────────────────────────┘    │
│               ...                    │
│                              [📷]   │  ← 悬浮发布按钮
└─────────────────────────────────────┘
```

---

## 四、API 接口文档

> 基础路径: `/api`，所有接口返回统一格式 `{ code: 0, message: "", result: {} }`

### 4.1 认证模块 `/auth`

| 接口 | 方法 | 路径 | 参数 | 说明 |
|------|------|------|------|------|
| 登录 | POST | `/login` | `{ account, password, remember? }` | 返回 token 和用户信息 |
| 注册 | POST | `/register` | `{ email, phone, password, confirm_password, code, agree_terms }` | - |
| 发送邮箱验证码 | POST | `/send-email-code` | `{ target, type: 'email' }` | - |
| 发送短信验证码 | POST | `/send-sms-code` | `{ target, type: 'sms' }` | - |
| 检查Token | GET | `/check-token` | - | 验证登录状态 |

### 4.2 用户模块 `/user`

| 接口 | 方法 | 路径 | 参数 | 说明 |
|------|------|------|------|------|
| 获取我的信息 | GET | `/user/my-info` | - | - |
| 获取用户列表 | GET | `/user/list` | `?page=1&page_size=20` | 分页 |
| 更新用户信息 | POST | `/user/update` | `{ id, updates: {...} }` | - |

### 4.3 联系人模块 `/contacts`

| 接口 | 方法 | 路径 | 参数 | 说明 |
|------|------|------|------|------|
| 获取联系人列表 | GET | `/contacts` | - | - |
| 搜索用户 | GET | `/contacts/search` | `?keyword=xxx&limit=20` | - |
| 添加好友 | POST | `/contacts/add-friend` | `{ to_user_id, message? }` | 发送申请 |
| 获取好友申请 | GET | `/contacts/friend-requests` | - | - |
| 接受申请 | POST | `/contacts/accept-request` | `{ request_id }` | - |
| 拒绝申请 | POST | `/contacts/reject-request` | `{ request_id }` | - |
| 获取好友详情 | GET | `/contacts/{id}` | - | - |
| 更新好友信息 | POST | `/contacts/update/{id}` | `{ remark_name?, is_top?, is_muted?, ... }` | - |
| 删除好友 | POST | `/contacts/delete/{id}` | - | - |
| 获取分组列表 | GET | `/contacts/groups` | - | - |
| 创建分组 | POST | `/contacts/groups` | `{ group_name }` | - |

### 4.4 会话模块 `/conversations`

| 接口 | 方法 | 路径 | 参数 | 说明 |
|------|------|------|------|------|
| 获取会话列表 | GET | `/conversations` | - | - |
| 重置未读数 | POST | `/conversations/reset-unread` | `{ target_id }` | - |
| 更新会话 | POST | `/conversations/update` | `{ target_id, is_top?, is_muted? }` | - |
| 删除会话 | POST | `/conversations/delete` | `{ target_id }` | - |
| 按房间获取会话 | GET | `/conversations/by-room/{roomId}` | - | - |

### 4.5 消息模块 `/messages`

| 接口 | 方法 | 路径 | 参数 | 说明 |
|------|------|------|------|------|
| 发送消息 | POST | `/send` | `{ room_id, message_type, content, duration?, extra? }` | - |
| 获取历史消息 | GET | `/messages` | `?room_id=xxx&page=1&page_size=50` | - |
| 同步消息 | GET | `/messages/sync` | `?room_id=xxx&page=1&page_size=50` | - |

### 4.6 群聊模块 `/groups`

| 接口 | 方法 | 路径 | 参数 | 说明 |
|------|------|------|------|------|
| 获取群列表 | GET | `/groups` | - | 带分组信息 |
| 创建群聊 | POST | `/groups` | `{ name, avatar?, member_ids, admin_ids? }` | - |
| 获取群信息 | GET | `/groups/{roomId}` | - | - |
| 获取群成员 | GET | `/groups/{roomId}/members` | `?keyword=xxx` | 可搜索 |
| 邀请成员 | POST | `/groups/{roomId}/members` | `{ member_ids: [] }` | - |
| 移除成员 | POST | `/groups/{roomId}/members/{userId}/remove` | - | - |
| 修改群信息 | POST | `/groups/{roomId}/update` | `{ name?, avatar? }` | - |
| 修改成员角色 | POST | `/groups/{roomId}/members/{userId}/role` | `{ role: 0\|1\|2 }` | 0成员/1管理/2群主 |
| 退出群聊 | POST | `/groups/{roomId}/quit` | - | - |
| 解散群聊 | POST | `/groups/{roomId}/dissolve` | - | 仅群主 |
| 获取群公告 | GET | `/groups/{roomId}/announcement` | - | - |
| 更新群公告 | POST | `/groups/{roomId}/announcement` | `{ announcement }` | - |
| 群通知列表 | GET | `/group-notifications` | `?page=1&page_size=20` | - |

### 4.7 朋友圈模块 `/moments`

| 接口 | 方法 | 路径 | 参数 | 说明 |
|------|------|------|------|------|
| 获取动态列表 | GET | `/moments` | `?page=1&page_size=20` | - |
| 发布动态 | POST | `/moments` | `{ content, media_type, media_urls?, visibility, ... }` | - |
| 获取动态详情 | GET | `/moments/{id}` | - | - |
| 删除动态 | DELETE | `/moments/{id}` | - | 仅自己 |
| 获取用户动态 | GET | `/moments/user/{userId}` | `?page=1&page_size=20` | - |
| 点赞 | POST | `/moments/{id}/like` | - | - |
| 取消点赞 | DELETE | `/moments/{id}/like` | - | - |
| 获取评论 | GET | `/moments/{id}/comments` | - | - |
| 发表评论 | POST | `/moments/{id}/comments` | `{ content, reply_to_comment_id? }` | - |
| 删除评论 | DELETE | `/moments/comments/{commentId}` | - | - |
| 获取通知 | GET | `/moments/notifications` | `?page=1&page_size=20` | - |
| 标记已读 | POST | `/moments/notifications/read` | `{ ids?: [], all?: true }` | - |
| 未读数 | GET | `/moments/notifications/unread-count` | - | - |

### 4.8 附件模块 `/attachments`

| 接口 | 方法 | 路径 | 参数 | 说明 |
|------|------|------|------|------|
| 上传附件 | POST | `/attachments/upload` | FormData: `{ file, type }` | multipart |
| 获取附件 | GET | `/attachments/{id}` | - | - |
| 附件列表 | GET | `/attachments` | `?type=xxx&page=1&page_size=20` | - |
| 删除附件 | POST | `/attachments/delete/{id}` | - | - |

### 4.9 系统模块

| 接口 | 方法 | 路径 | 参数 | 说明 |
|------|------|------|------|------|
| 健康检查 | GET | `/health` | - | - |
| ICE服务器 | GET | `/ice-servers` | `?user_id=xxx` | WebRTC配置 |
| 在线状态 | GET | `/check-user-online` | `?user_id=xxx` | - |
| 绑定客户端 | POST | `/bind` | `{ user_id, client_id }` | WebSocket |

---

## 五、类型定义

### 5.1 基础类型

```typescript
// types/api.ts

/** 用户 */
interface User {
  id: string
  email: string
  phone: string
  name: string
  avatar: string
  desc: string
  region: string
  created_at: string
  updated_at: string
}

/** 联系人 */
interface Contact {
  id: string
  user_id: string
  contact_user_id: string
  room_id?: string
  room_type?: 'p2p' | 'group'
  is_group?: boolean
  member_count?: number
  owner_id?: string
  remark_name?: string
  group_id?: number
  is_top: boolean
  is_muted: boolean
  is_special_care?: boolean
  is_blocked?: boolean
  user?: User
}

/** 好友申请 */
interface FriendRequest {
  id: number
  from_user_id: string
  to_user_id: string
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  from_user?: User
  to_user?: User
}

/** 分页响应 */
interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  size: number
}
```

### 5.2 会话类型

```typescript
// types/conversation.ts

interface Conversation {
  id: number
  user_id: string
  target_id: string
  type: number                 // 1:私聊 2:群聊
  room_type?: 'p2p' | 'group'
  room_id?: string
  is_group?: boolean
  member_count?: number
  owner_id?: string
  name?: string
  avatar?: string
  unread_count: number
  is_top: boolean
  is_muted: boolean
  is_special_care?: boolean
  last_message: string
  last_time: number
  target_user?: User
}
```

### 5.3 消息类型

```typescript
// types/message.ts

/** 消息类型枚举 */
enum MessageType {
  TEXT = 0,           // 文本
  IMAGE = 1,          // 图片
  AUDIO = 2,          // 语音
  VIDEO = 3,          // 视频
  SYSTEM = 4,         // 系统消息
  FRIEND_NOTIFY = 5,  // 好友通知
  SIGNAL = 6,         // WebRTC信令
  GROUP_NOTIFY = 7,   // 群通知
  FILE = 8,           // 文件
  MOMENTS_NOTIFY = 9, // 朋友圈通知
}

/** 聊天消息 */
interface ChatMessage {
  id: number
  room_id: string
  sender_user_id: string
  receiver_user_id?: string
  message_type: number
  content: string
  duration: number
  extra?: string | Record<string, any>
  created_at: string
  isSelf?: boolean     // 前端标记
}

/** 消息扩展信息 */
interface MessageExtra {
  url?: string         // 媒体URL
  name?: string        // 文件名
  size?: number        // 文件大小
  duration?: number    // 时长（秒）
  width?: number       // 图片/视频宽
  height?: number      // 图片/视频高
  attachment_id?: number
}

/** 发送消息请求 */
interface SendMessageRequest {
  room_id: string
  message_type: number
  content: string
  duration?: number
  extra?: string
}
```

### 5.4 朋友圈类型

```typescript
// types/moment.ts

/** 动态 */
interface Moment {
  id: number
  user_id: string
  content: string
  media_type: 0 | 1 | 2          // 0=纯文字 1=图片 2=视频
  media_urls: string[]
  location?: string
  visibility: 0 | 1 | 2 | 3      // 0=公开 1=仅好友 2=部分可见 3=部分不可见
  visible_user_ids?: string[]
  mention_user_ids?: string[]
  like_count: number
  comment_count: number
  created_at: string
  user?: User
  is_liked: boolean
  likes?: MomentLike[]
  comments?: MomentComment[]
}

/** 点赞 */
interface MomentLike {
  id: number
  moment_id: number
  user_id: string
  created_at: string
  user?: User
}

/** 评论 */
interface MomentComment {
  id: number
  moment_id: number
  user_id: string
  reply_to_comment_id?: number
  reply_to_user_id?: string
  content: string
  created_at: string
  user?: User
  reply_to_user?: User
}

/** 通知 */
interface MomentNotification {
  id: number
  user_id: string
  from_user_id: string
  moment_id: number
  type: 1 | 2 | 3 | 4            // 1=点赞 2=评论 3=回复 4=@提及
  comment_id?: number
  is_read: boolean
  created_at: string
  from_user?: User
  moment?: Moment
}
```

---

## 六、状态管理（Pinia Store）

### 6.1 Auth Store

```typescript
// stores/auth.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as authApi from '@/api/modules/auth'
import * as userApi from '@/api/modules/user'
import { storage } from '@/utils/storage'
import type { User, LoginRequest } from '@/types/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(storage.getToken())
  const user = ref<User | null>(storage.getUserInfo())
  const isAuthenticated = ref(!!token.value)

  async function login(data: LoginRequest) {
    const res = await authApi.login(data)
    token.value = res.token
    user.value = res.user
    isAuthenticated.value = true
    storage.setToken(res.token)
    storage.setUserId(res.user.id)
    storage.setUserInfo(res.user)
    return res
  }

  async function register(data: any) {
    await authApi.register(data)
  }

  function logout() {
    token.value = null
    user.value = null
    isAuthenticated.value = false
    storage.clear()
  }

  async function checkAuth() {
    if (!token.value) return false
    try {
      await authApi.checkToken()
      const userInfo = await userApi.getMyInfo()
      user.value = userInfo
      storage.setUserInfo(userInfo)
      return true
    } catch {
      logout()
      return false
    }
  }

  function updateUserInfo(userInfo: User) {
    user.value = userInfo
    storage.setUserInfo(userInfo)
  }

  return {
    token, user, isAuthenticated,
    login, register, logout, checkAuth, updateUserInfo
  }
})
```

### 6.2 Conversation Store

```typescript
// stores/conversation.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Conversation } from '@/types/conversation'
import * as conversationApi from '@/api/modules/conversation'

export const useConversationStore = defineStore('conversation', () => {
  const conversations = ref<Conversation[]>([])
  const loading = ref(false)

  const totalUnread = computed(() =>
    conversations.value.reduce((acc, c) => acc + (c.is_muted ? 0 : c.unread_count), 0)
  )

  async function loadConversations() {
    loading.value = true
    try {
      const list = await conversationApi.getConversationList()
      conversations.value = list.map(processConversation).sort(sortByTopAndTime)
    } finally {
      loading.value = false
    }
  }

  function handleMessageUpdate(message: ChatMessage, isSelf: boolean, isCurrentChat: boolean) {
    // 更新会话最后消息和未读数
  }

  async function clearUnread(targetId: string) {
    const conv = conversations.value.find(c => c.target_id === targetId || c.room_id === targetId)
    if (conv && conv.unread_count > 0) {
      conv.unread_count = 0
      await conversationApi.resetUnread(targetId)
    }
  }

  return {
    conversations, loading, totalUnread,
    loadConversations, handleMessageUpdate, clearUnread
  }
})
```

### 6.3 Chat Store

```typescript
// stores/chat.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ChatMessage, Contact } from '@/types/api'

export const useChatStore = defineStore('chat', () => {
  const currentTarget = ref<Contact | null>(null)
  const messages = ref<Record<string, ChatMessage[]>>({})
  const contacts = ref<Contact[]>([])

  const totalUnread = computed(() =>
    contacts.value.reduce((acc, c) => acc + (c.unread || 0), 0)
  )

  function setCurrentTarget(contact: Contact | null) {
    currentTarget.value = contact
    if (contact) contact.unread = 0
  }

  function addMessage(roomId: string, message: ChatMessage) {
    if (!messages.value[roomId]) messages.value[roomId] = []
    messages.value[roomId].push(message)
  }

  function getRoomMessages(roomId: string): ChatMessage[] {
    return messages.value[roomId] || []
  }

  function setRoomMessages(roomId: string, msgs: ChatMessage[]) {
    messages.value[roomId] = msgs
  }

  function setContacts(newContacts: Contact[]) {
    contacts.value = newContacts
  }

  return {
    currentTarget, messages, contacts, totalUnread,
    setCurrentTarget, addMessage, getRoomMessages, setRoomMessages, setContacts
  }
})
```

### 6.4 Moment Store

```typescript
// stores/moment.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as momentApi from '@/api/modules/moment'
import type { Moment, MomentNotification } from '@/types/moment'

export const useMomentStore = defineStore('moment', () => {
  const moments = ref<Moment[]>([])
  const currentMoment = ref<Moment | null>(null)
  const notifications = ref<MomentNotification[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const pagination = ref({ page: 1, pageSize: 20, total: 0, hasMore: true })

  const hasUnread = computed(() => unreadCount.value > 0)

  async function fetchMoments() {
    loading.value = true
    try {
      const res = await momentApi.getMoments(1, pagination.value.pageSize)
      moments.value = res.data || []
      pagination.value.total = res.total
      pagination.value.hasMore = moments.value.length < res.total
    } finally {
      loading.value = false
    }
  }

  async function toggleLike(momentId: number) {
    const moment = moments.value.find(m => m.id === momentId)
    if (!moment) return
    if (moment.is_liked) {
      await momentApi.unlikeMoment(momentId)
      moment.is_liked = false
      moment.like_count--
    } else {
      await momentApi.likeMoment(momentId)
      moment.is_liked = true
      moment.like_count++
    }
  }

  async function addComment(momentId: number, data: { content: string; reply_to_comment_id?: number }) {
    const comment = await momentApi.createComment(momentId, data)
    const moment = moments.value.find(m => m.id === momentId)
    if (moment) {
      if (!moment.comments) moment.comments = []
      moment.comments.push(comment)
      moment.comment_count++
    }
    return comment
  }

  return {
    moments, currentMoment, notifications, unreadCount, loading, pagination, hasUnread,
    fetchMoments, toggleLike, addComment
  }
})
```

---

## 七、WebSocket 通讯

### 7.1 WebSocket 管理器

```typescript
// api/websocket/index.ts
import type { ChatMessage } from '@/types/api'
import type { MomentNotifPayload } from '@/types/moment'

export interface WebSocketMessage {
  request_type?: string
  clientId?: string
  data?: ChatMessage | MomentNotifPayload
}

export type MessageHandler = (message: ChatMessage) => void
export type MomentNotifHandler = (payload: MomentNotifPayload) => void

class WebSocketManager {
  private socketTask: UniApp.SocketTask | null = null
  private clientId: string | null = null
  private userId: string | null = null
  private messageHandlers: MessageHandler[] = []
  private momentNotifHandlers: MomentNotifHandler[] = []
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000

  connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socketTask) {
        resolve()
        return
      }

      this.userId = userId
      const wsUrl = `ws://your-server/ws?user_id=${userId}`

      this.socketTask = uni.connectSocket({
        url: wsUrl,
        success: () => console.log('WebSocket connecting...'),
        fail: (err) => reject(err)
      })

      this.socketTask.onOpen(() => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
        resolve()
      })

      this.socketTask.onMessage((res) => {
        try {
          const payload: WebSocketMessage = JSON.parse(res.data as string)
          if (payload.clientId) this.clientId = payload.clientId
          if (payload.request_type === 'receive_message' && payload.data) {
            this.messageHandlers.forEach(h => h(payload.data as ChatMessage))
          }
          if (payload.request_type === 'moment_notification' && payload.data) {
            this.momentNotifHandlers.forEach(h => h(payload.data as MomentNotifPayload))
          }
        } catch (e) {
          console.error('Parse message error:', e)
        }
      })

      this.socketTask.onClose(() => {
        console.log('WebSocket closed')
        this.socketTask = null
        this.attemptReconnect()
      })

      this.socketTask.onError((err) => {
        console.error('WebSocket error:', err)
        reject(err)
      })
    })
  }

  disconnect() {
    if (this.socketTask) {
      this.socketTask.close({})
      this.socketTask = null
    }
    this.clientId = null
    this.userId = null
    this.messageHandlers = []
    this.momentNotifHandlers = []
  }

  getClientId(): string | null {
    return this.clientId
  }

  onMessage(handler: MessageHandler) {
    if (!this.messageHandlers.includes(handler)) {
      this.messageHandlers.push(handler)
    }
  }

  offMessage(handler: MessageHandler) {
    const index = this.messageHandlers.indexOf(handler)
    if (index > -1) this.messageHandlers.splice(index, 1)
  }

  onMomentNotification(handler: MomentNotifHandler) {
    if (!this.momentNotifHandlers.includes(handler)) {
      this.momentNotifHandlers.push(handler)
    }
  }

  offMomentNotification(handler: MomentNotifHandler) {
    const index = this.momentNotifHandlers.indexOf(handler)
    if (index > -1) this.momentNotifHandlers.splice(index, 1)
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || !this.userId) return
    this.reconnectAttempts++
    setTimeout(() => {
      if (this.userId) this.connect(this.userId).catch(console.error)
    }, this.reconnectDelay)
  }
}

export const wsManager = new WebSocketManager()
```

---

## 八、主题系统

### 8.1 CSS 变量

```scss
// styles/variables.scss
page {
  // 浅色主题（默认）
  --color-primary: #07c160;
  --color-danger: #fa5151;
  --color-warning: #ffc300;
  --color-success: #07c160;

  --bg-page: #ededed;
  --bg-content: #ffffff;
  --bg-hover: #f5f5f5;
  --bg-mask: rgba(0, 0, 0, 0.5);

  --text-primary: #333333;
  --text-secondary: #666666;
  --text-tertiary: #999999;
  --text-placeholder: #cccccc;

  --border-color: #e5e5e5;
  --divider-color: #f0f0f0;

  --nav-bg: #ededed;
  --tabbar-bg: #f7f7f7;
}

page.dark {
  // 暗色主题
  --bg-page: #111111;
  --bg-content: #1e1e1e;
  --bg-hover: #2a2a2a;
  --bg-mask: rgba(0, 0, 0, 0.7);

  --text-primary: #e5e5e5;
  --text-secondary: #a0a0a0;
  --text-tertiary: #666666;
  --text-placeholder: #444444;

  --border-color: #333333;
  --divider-color: #2a2a2a;

  --nav-bg: #1a1a1a;
  --tabbar-bg: #1a1a1a;
}
```

### 8.2 主题切换

```typescript
// composables/useTheme.ts
import { ref, watch } from 'vue'

const isDark = ref(false)

export function useTheme() {
  function initTheme() {
    // 读取缓存
    const cached = uni.getStorageSync('theme')
    if (cached) {
      isDark.value = cached === 'dark'
    } else {
      // 跟随系统
      const info = uni.getSystemInfoSync()
      isDark.value = info.theme === 'dark'
    }
    applyTheme()

    // 监听系统主题变化
    uni.onThemeChange?.((res) => {
      if (!uni.getStorageSync('theme')) {
        isDark.value = res.theme === 'dark'
        applyTheme()
      }
    })
  }

  function toggleTheme() {
    isDark.value = !isDark.value
    uni.setStorageSync('theme', isDark.value ? 'dark' : 'light')
    applyTheme()
  }

  function applyTheme() {
    // 设置页面根元素 class
    // #ifdef H5
    document.documentElement.className = isDark.value ? 'dark' : ''
    // #endif

    // 设置导航栏颜色
    uni.setNavigationBarColor({
      frontColor: isDark.value ? '#ffffff' : '#000000',
      backgroundColor: isDark.value ? '#1a1a1a' : '#ededed'
    })

    // 设置 TabBar 样式
    uni.setTabBarStyle({
      backgroundColor: isDark.value ? '#1a1a1a' : '#f7f7f7',
      borderStyle: isDark.value ? 'black' : 'white'
    })
  }

  return { isDark, initTheme, toggleTheme }
}
```

### 8.3 使用示例

```vue
<template>
  <view class="container">
    <text class="title">标题</text>
    <text class="desc">描述文字</text>
  </view>
</template>

<style lang="scss" scoped>
.container {
  background: var(--bg-content);
  padding: 20rpx;
}
.title {
  color: var(--text-primary);
  font-size: 32rpx;
}
.desc {
  color: var(--text-secondary);
  font-size: 28rpx;
}
</style>
```

---

## 九、平台适配

### 9.1 条件编译

```typescript
// 代码中
// #ifdef APP-PLUS
console.log('这是 App')
// #endif

// #ifdef MP-WEIXIN
console.log('这是微信小程序')
// #endif

// #ifdef H5
console.log('这是 H5')
// #endif

// #ifndef MP-WEIXIN
console.log('不是微信小程序的平台')
// #endif
```

```vue
<!-- 模板中 -->
<!-- #ifdef APP-PLUS -->
<view>仅 App 显示</view>
<!-- #endif -->

<!-- #ifdef MP-WEIXIN -->
<button open-type="share">分享</button>
<!-- #endif -->
```

### 9.2 平台工具函数

```typescript
// utils/platform.ts

/** 是否 App */
export function isApp(): boolean {
  // #ifdef APP-PLUS
  return true
  // #endif
  // #ifndef APP-PLUS
  return false
  // #endif
}

/** 是否微信小程序 */
export function isWeixin(): boolean {
  // #ifdef MP-WEIXIN
  return true
  // #endif
  // #ifndef MP-WEIXIN
  return false
  // #endif
}

/** 选择图片 */
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

/** 选择文件 */
export function chooseFile(): Promise<UniApp.ChooseFileSuccessCallbackResult> {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    uni.chooseFile({
      count: 1,
      success: resolve,
      fail: reject
    })
    // #endif

    // #ifdef MP-WEIXIN
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: resolve,
      fail: reject
    })
    // #endif
  })
}

/** 扫码 */
export function scanCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.scanCode({
      onlyFromCamera: false,
      success: (res) => resolve(res.result),
      fail: reject
    })
  })
}
```

### 9.3 存储封装

```typescript
// utils/storage.ts
const KEYS = {
  TOKEN: 'nl_im_token',
  USER_ID: 'nl_im_user_id',
  USER_INFO: 'nl_im_user_info',
  THEME: 'nl_im_theme',
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
  setUserId(id: string) {
    uni.setStorageSync(KEYS.USER_ID, id)
  },
  getUserId(): string | null {
    return uni.getStorageSync(KEYS.USER_ID) || null
  },

  // User Info
  setUserInfo(info: any) {
    uni.setStorageSync(KEYS.USER_INFO, JSON.stringify(info))
  },
  getUserInfo(): any | null {
    const str = uni.getStorageSync(KEYS.USER_INFO)
    return str ? JSON.parse(str) : null
  },

  // Theme
  setTheme(theme: 'light' | 'dark') {
    uni.setStorageSync(KEYS.THEME, theme)
  },
  getTheme(): 'light' | 'dark' | null {
    return uni.getStorageSync(KEYS.THEME) || null
  },

  // Clear all
  clear() {
    Object.values(KEYS).forEach(key => uni.removeStorageSync(key))
  }
}
```

---

## 十、UI 组件（wot-design-uni）

### 10.1 常用组件

| 组件 | 用途 | 示例 |
|------|------|------|
| `wd-button` | 按钮 | `<wd-button type="primary">提交</wd-button>` |
| `wd-input` | 输入框 | `<wd-input v-model="value" placeholder="请输入" />` |
| `wd-cell` | 单元格 | `<wd-cell title="标题" value="内容" />` |
| `wd-popup` | 弹出层 | `<wd-popup v-model="show" position="bottom">...</wd-popup>` |
| `wd-toast` | 轻提示 | `uni.$wot.toast('提示内容')` |
| `wd-dialog` | 对话框 | `uni.$wot.confirm({ title: '提示', msg: '确定删除？' })` |
| `wd-action-sheet` | 动作面板 | 底部弹出选项 |
| `wd-search` | 搜索框 | `<wd-search v-model="keyword" />` |
| `wd-badge` | 徽标 | `<wd-badge :value="99" />` |
| `wd-icon` | 图标 | `<wd-icon name="chat" />` |
| `wd-image` | 图片 | 支持懒加载、预览 |
| `wd-swipe-action` | 滑动操作 | 左滑删除等 |

### 10.2 自动导入配置

```typescript
// vite.config.ts
import Components from '@uni-helper/vite-plugin-uni-components'
import { WotResolver } from '@uni-helper/vite-plugin-uni-components/resolvers'

export default defineConfig({
  plugins: [
    Components({
      resolvers: [WotResolver()]
    })
  ]
})
```

---

## 十一、工具函数

### 11.1 格式化函数

```typescript
// utils/format.ts

/** 格式化相对时间 */
export function formatTime(timestamp: number | string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

/** 格式化文件大小 */
export function formatSize(bytes: number): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/** 格式化时长（秒转 MM:SS） */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}
```

### 11.2 消息处理

```typescript
// utils/message.ts
import { MessageType } from '@/types/message'
import type { ChatMessage } from '@/types/api'

/** 获取消息摘要 */
export function getMessageSummary(msg: ChatMessage): string {
  switch (msg.message_type) {
    case MessageType.TEXT:
      return msg.content || ''
    case MessageType.IMAGE:
      return '[图片]'
    case MessageType.AUDIO:
      return '[语音]'
    case MessageType.VIDEO:
      return '[视频]'
    case MessageType.FILE:
      return '[文件]'
    case MessageType.SYSTEM:
    case MessageType.GROUP_NOTIFY:
      return msg.content || '[系统消息]'
    default:
      return '[未知消息]'
  }
}

/** 是否系统消息 */
export function isSystemMessage(type: number): boolean {
  return [
    MessageType.SYSTEM,
    MessageType.FRIEND_NOTIFY,
    MessageType.GROUP_NOTIFY
  ].includes(type)
}
```

---

## 十二、开发规范

### 12.1 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件夹 | 小写连字符 | `chat-bubble/` |
| 页面文件 | 小写 | `index.vue`, `detail.vue` |
| 组件文件 | PascalCase | `MessageBubble.vue` |
| 变量/函数 | camelCase | `handleSend`, `isLoading` |
| 常量 | UPPER_SNAKE | `MESSAGE_TYPE`, `API_BASE` |
| 类型/接口 | PascalCase | `User`, `ChatMessage` |
| CSS 类名 | BEM 或小写连字符 | `.message-bubble__content` |

### 12.2 组件模板

```vue
<template>
  <view class="component-name">
    <!-- 内容 -->
  </view>
</template>

<script setup lang="ts">
/**
 * 组件名称
 * @description 组件描述
 */
import { ref, computed, onMounted } from 'vue'

// Props
interface Props {
  title: string
  disabled?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

// Emits
const emit = defineEmits<{
  click: [id: string]
  change: [value: string]
}>()

// State
const loading = ref(false)

// Computed
const displayTitle = computed(() => props.title.toUpperCase())

// Methods
function handleClick() {
  emit('click', 'some-id')
}

// Lifecycle
onMounted(() => {
  // 初始化
})
</script>

<style lang="scss" scoped>
.component-name {
  // 样式
}
</style>
```

### 12.3 Git 提交规范

```
<type>(<scope>): <subject>

类型：
- feat: 新功能
- fix: 修复 bug
- docs: 文档变更
- style: 代码格式（不影响功能）
- refactor: 重构
- perf: 性能优化
- test: 测试
- chore: 构建/工具变动

示例：
feat(chat): 添加语音消息发送功能
fix(contact): 修复好友列表不刷新问题
docs: 更新开发手册
```

---

## 十三、快速开始

### 13.1 环境准备

```bash
# 安装 Node.js 18+
# 安装 pnpm
npm install -g pnpm

# 安装 HBuilderX（可选，用于 App 开发）
```

### 13.2 项目启动

```bash
# 进入项目
cd nl-im-uniapp

# 安装依赖
pnpm install

# 开发模式
pnpm dev              # H5
pnpm dev:mp-weixin    # 微信小程序
pnpm dev:app          # App

# 构建
pnpm build:mp-weixin  # 微信小程序
pnpm build:app        # App
```

### 13.3 微信小程序调试

1. 运行 `pnpm dev:mp-weixin`
2. 打开**微信开发者工具**
3. 导入 `dist/dev/mp-weixin` 目录
4. 填写 AppID

### 13.4 App 调试

1. 运行 `pnpm dev:app`
2. 打开 HBuilderX
3. 运行到手机或模拟器

---

## 十四、功能清单

### 已规划功能

| 模块 | 功能 | 优先级 | 状态 |
|------|------|--------|------|
| 基础 | 项目框架搭建 | P0 | 待开发 |
| 基础 | 主题系统（浅色/暗色） | P0 | 待开发 |
| 基础 | API 请求封装 | P0 | 待开发 |
| 基础 | WebSocket 适配 | P0 | 待开发 |
| 基础 | Pinia Store | P0 | 待开发 |
| 登录 | 登录/注册页 | P0 | 待开发 |
| 首页 | 会话列表 | P0 | 待开发 |
| 首页 | 左侧抽屉 | P1 | 待开发 |
| 首页 | 加号菜单 | P1 | 待开发 |
| 聊天 | 聊天详情页 | P0 | 待开发 |
| 聊天 | 多类型消息展示 | P0 | 待开发 |
| 聊天 | 消息输入框 | P0 | 待开发 |
| 聊天 | 图片/文件发送 | P1 | 待开发 |
| 聊天 | 语音消息 | P2 | 待开发 |
| 联系人 | 联系人列表 | P0 | 待开发 |
| 联系人 | 好友详情 | P1 | 待开发 |
| 联系人 | 添加好友 | P1 | 待开发 |
| 联系人 | 好友申请 | P1 | 待开发 |
| 群聊 | 群聊列表 | P1 | 待开发 |
| 群聊 | 创建群聊 | P1 | 待开发 |
| 群聊 | 群信息/成员管理 | P2 | 待开发 |
| 朋友圈 | 动态列表 | P1 | 待开发 |
| 朋友圈 | 发布动态 | P1 | 待开发 |
| 朋友圈 | 点赞/评论 | P1 | 待开发 |
| 朋友圈 | 消息通知 | P2 | 待开发 |
| 设置 | 个人资料 | P1 | 待开发 |
| 设置 | 设置页 | P2 | 待开发 |
| 高级 | 消息推送 | P2 | 待开发 |
| 高级 | 语音/视频通话 | P3 | 待开发 |

---

## 附录

### A. 相关资源

- [UniApp 官方文档](https://uniapp.dcloud.net.cn/)
- [wot-design-uni 组件库](https://wot-design-uni.cn/)
- [Pinia 文档](https://pinia.vuejs.org/)
- [Vue 3 文档](https://cn.vuejs.org/)

### B. 后端 API 文档

请参考 `nl-im-vue-ts` 项目或后端接口文档。

### C. 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|----------|
| 2024-12-08 | v0.1.0 | 初始化开发手册 |
