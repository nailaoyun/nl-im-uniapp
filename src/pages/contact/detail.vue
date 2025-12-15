<template>
  <view class="detail-container" :class="{ 'theme-dark': isDark }">
    <!-- 视差背景 (与设计稿一致: blur-xl scale-110 opacity-70) -->
    <view class="parallax-bg">
      <image 
        v-if="contact?.user?.avatar" 
        :src="contact.user.avatar" 
        class="blur-image"
        mode="aspectFill"
      />
      <view class="gradient-overlay" />
    </view>

    <!-- 导航栏 (与设计稿一致) -->
    <view class="nav-header">
      <view class="nav-back" @click="goBack">
        <!-- #ifdef H5 || APP-PLUS -->
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        <!-- #endif -->
        <!-- #ifdef MP-WEIXIN -->
        <wd-icon name="arrow-left" size="44rpx" color="#fff" />
        <!-- #endif -->
      </view>
      <view class="nav-more">
        <!-- #ifdef H5 || APP-PLUS -->
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="1"/>
          <circle cx="19" cy="12" r="1"/>
          <circle cx="5" cy="12" r="1"/>
        </svg>
        <!-- #endif -->
        <!-- #ifdef MP-WEIXIN -->
        <wd-icon name="more" size="44rpx" color="#fff" />
        <!-- #endif -->
      </view>
    </view>

    <!-- 主体内容 - 好友状态 -->
    <scroll-view scroll-y class="main-scroll custom-scrollbar" v-if="!loading && isFriend && contact">
      <!-- 身份卡片区 (与设计稿一致) -->
      <view class="identity-section">
        <!-- 头像: w-32 h-32 rounded-full border-[6px] border-white shadow-xl -->
        <view class="avatar-wrapper">
          <app-avatar
            :src="contact.user?.avatar"
            :name="contact.remark_name || contact.user?.name"
            :size="256"
            round
          />
        </view>
        
        <!-- 名字: text-2xl font-bold -->
        <text class="user-name">{{ contact.remark_name || contact.user?.name || '未知' }}</text>
        
        <!-- 标签: text-xs bg-gray-100 px-2 py-0.5 rounded -->
        <view class="tag-row">
          <view class="info-tag">ID: {{ contact.user?.id?.slice(-6) || '-' }}</view>
          <view class="info-tag">{{ contact.user?.region || '未知' }}</view>
        </view>
        
        <!-- 签名: text-sm text-gray-500 text-center max-w-[200px] -->
        <text class="bio-text">{{ contact.user?.desc || '这个人很懒，什么都没写' }}</text>
      </view>

      <!-- 好友设置卡片 (与设计稿一致) -->
      <view class="settings-card animate-fade-in-up">
        <!-- 设置备注 -->
        <view class="setting-row" @click="editRemark">
          <text class="row-label">设置备注</text>
          <view class="row-right">
            <text class="row-value">{{ contact.remark_name || '未设置' }}</text>
            <!-- #ifdef H5 || APP-PLUS -->
            <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <!-- #endif -->
            <!-- #ifdef MP-WEIXIN -->
            <wd-icon name="arrow-right" size="32rpx" custom-class="chevron-icon-mp" />
            <!-- #endif -->
          </view>
        </view>
        
        <!-- 置顶聊天 -->
        <view class="setting-row">
          <text class="row-label">置顶聊天</text>
          <view class="toggle-wrap">
            <view 
              class="custom-toggle" 
              :class="{ active: contact.is_top }"
              @click="toggleTopManual"
            >
              <view class="toggle-thumb" />
            </view>
          </view>
        </view>
        
        <!-- 消息免打扰 -->
        <view class="setting-row no-border">
          <text class="row-label">消息免打扰</text>
          <view class="toggle-wrap">
            <view 
              class="custom-toggle" 
              :class="{ active: contact.is_muted }"
              @click="toggleMuteManual"
            >
              <view class="toggle-thumb" />
            </view>
          </view>
        </view>
      </view>

      <view class="bottom-spacer" />
    </scroll-view>

    <!-- 主体内容 - 陌生人状态 -->
    <scroll-view scroll-y class="main-scroll custom-scrollbar" v-else-if="!loading && !isFriend && strangerUser">
      <!-- 身份卡片区 -->
      <view class="identity-section">
        <view class="avatar-wrapper">
          <app-avatar
            :src="strangerUser.avatar"
            :name="strangerUser.name"
            :size="256"
            round
          />
        </view>
        
        <text class="user-name">{{ strangerUser.name || '未知' }}</text>
        
        <view class="tag-row">
          <view class="info-tag">ID: {{ strangerUser.id?.slice(-6) || '-' }}</view>
          <view class="info-tag">{{ strangerUser.region || '未知' }}</view>
        </view>
        
        <text class="bio-text">{{ strangerUser.desc || '这个人很懒，什么都没写' }}</text>
      </view>

      <!-- 陌生人信息卡片 -->
      <view class="stranger-card animate-fade-in-up">
        <text class="section-title">个人简介</text>
        
        <view class="info-row" v-if="sourceText">
          <text class="info-label">来源</text>
          <text class="info-value">{{ sourceText }}</text>
        </view>
        
        <view class="info-row">
          <text class="info-label">签名</text>
          <text class="info-value">{{ strangerUser.desc || '暂无签名' }}</text>
        </view>
        
        <view class="info-row" v-if="strangerUser.region">
          <text class="info-label">地区</text>
          <text class="info-value">{{ strangerUser.region }}</text>
        </view>
      </view>

      <view class="bottom-spacer" />
    </scroll-view>

    <!-- Loading -->
    <view v-else-if="loading" class="center-loading">
      <wd-loading size="60rpx" :color="isDark ? '#f97316' : '#4F46E5'"/>
    </view>

    <!-- 底部悬浮操作栏 - 好友状态 -->
    <view class="floating-dock" v-if="isFriend && contact">
      <view class="dock-buttons">
        <!-- 电话: flex-1 -->
        <view class="dock-btn secondary" @click="startAudioCall">
          <!-- #ifdef H5 || APP-PLUS -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.05 12.05 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.05 12.05 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          <!-- #endif -->
          <!-- #ifdef MP-WEIXIN -->
          <wd-icon name="phone" size="44rpx" />
          <!-- #endif -->
        </view>
        <!-- 发消息: flex-[2] -->
        <view class="dock-btn primary" @click="goChat">
          <!-- #ifdef H5 || APP-PLUS -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <!-- #endif -->
          <!-- #ifdef MP-WEIXIN -->
          <wd-icon name="chat" size="44rpx" />
          <!-- #endif -->
          <text>发消息</text>
        </view>
        <!-- 视频: flex-1 -->
        <view class="dock-btn secondary" @click="startVideoCall">
          <!-- #ifdef H5 || APP-PLUS -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
          <!-- #endif -->
          <!-- #ifdef MP-WEIXIN -->
          <wd-icon name="video" size="44rpx" />
          <!-- #endif -->
        </view>
      </view>
      
      <!-- 删除好友: text-xs text-gray-400 underline -->
      <view class="delete-link" @click="deleteFriend">
        <text>删除好友</text>
      </view>
    </view>

    <!-- 底部悬浮操作栏 - 陌生人状态 -->
    <view class="floating-dock" v-else-if="!isFriend && strangerUser">
      <view class="add-friend-btn" @click="addFriend">
        <!-- #ifdef H5 || APP-PLUS -->
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="8.5" cy="7" r="4"/>
          <line x1="20" y1="8" x2="20" y2="14"/>
          <line x1="23" y1="11" x2="17" y2="11"/>
        </svg>
        <!-- #endif -->
        <!-- #ifdef MP-WEIXIN -->
        <wd-icon name="add-circle" size="40rpx" color="#fff" />
        <!-- #endif -->
        <text>添加好友</text>
      </view>
    </view>

    <wd-toast />
    <wd-message-box />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import * as contactApi from '@/api/modules/contact'
import { useToast, useMessage } from 'wot-design-uni'
import { useTheme } from '@/composables/useTheme'
import AppAvatar from '@/components/common/AppAvatar.vue'
import type { Contact } from '@/types/api'

import * as userApi from '@/api/modules/user'
import type { User } from '@/types/api'

// --- 状态定义 ---
const toast = useToast()
const messageBox = useMessage()
const { isDark } = useTheme()
const loading = ref(true)
const contact = ref<Contact | null>(null)
const strangerUser = ref<User | null>(null)
const contactId = ref('')
const userId = ref('')
const isFriend = ref(false)
const sourceText = ref('')

onLoad((options: any) => {
  contactId.value = options?.id || ''
  userId.value = options?.userId || ''
  // 来源信息（如果有）
  sourceText.value = options?.source ? decodeURIComponent(options.source) : ''
})

onMounted(async () => {
  if (contactId.value) {
    await loadContact()
  } else if (userId.value) {
    await loadContactByUserId()
  }
})

// 加载好友联系人
async function loadContact() {
  loading.value = true
  try {
    contact.value = await contactApi.getContactDetail(contactId.value)
    isFriend.value = true
  } catch (error) {
    console.error('加载联系人失败:', error)
    toast.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 通过用户ID加载 - 可能是好友也可能是陌生人
async function loadContactByUserId() {
  loading.value = true
  try {
    // 先尝试从好友列表查找
    const contacts = await contactApi.getContacts()
    const found = contacts.find((c: Contact) => 
      c.contact_user_id === userId.value || c.user_id === userId.value
    )
    
    if (found) {
      // 是好友
      contact.value = await contactApi.getContactDetail(found.id?.toString() || '')
      isFriend.value = true
    } else {
      // 不是好友，加载用户基本信息
      try {
        strangerUser.value = await userApi.getUserInfo(userId.value)
        isFriend.value = false
      } catch {
        // 用户不存在
        toast.warning('用户不存在')
        setTimeout(() => uni.navigateBack(), 1500)
      }
    }
  } catch (error) {
    console.error('加载失败:', error)
    toast.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 添加好友
async function addFriend() {
  try {
    const { value } = await messageBox.prompt({
      title: '添加好友',
      inputValue: '你好，我想加你为好友',
      inputPlaceholder: '请输入验证消息'
    })
    
    await contactApi.addFriend({
      to_user_id: userId.value,
      message: value || ''
    })
    toast.success('好友请求已发送')
  } catch (e: any) {
    if (e !== 'cancel') {
      toast.error(e?.message || '发送失败')
    }
  }
}
function goBack() { uni.navigateBack() }
function goChat() { if (!contact.value) return; uni.navigateTo({ url: `/pages/chat/index?targetId=${contact.value.contact_user_id}&roomId=${contact.value.room_id || ''}&name=${encodeURIComponent(contact.value.remark_name || contact.value.user?.name || '')}&avatar=${encodeURIComponent(contact.value.user?.avatar || '')}` }) }
function startAudioCall() { if (!contact.value) return; uni.navigateTo({ url: `/pages/chat/index?targetId=${contact.value.contact_user_id}&roomId=${contact.value.room_id || ''}&name=${encodeURIComponent(contact.value.remark_name || contact.value.user?.name || '')}&avatar=${encodeURIComponent(contact.value.user?.avatar || '')}&callType=audio` }) }
function startVideoCall() { if (!contact.value) return; uni.navigateTo({ url: `/pages/chat/index?targetId=${contact.value.contact_user_id}&roomId=${contact.value.room_id || ''}&name=${encodeURIComponent(contact.value.remark_name || contact.value.user?.name || '')}&avatar=${encodeURIComponent(contact.value.user?.avatar || '')}&callType=video` }) }
async function editRemark() { if (!contact.value) return; try { const { value } = await messageBox.prompt({ title: '修改备注名', inputValue: contact.value.remark_name || '', inputPlaceholder: '请输入备注名' }); await contactApi.updateContact(contactId.value, { remark_name: value }); contact.value.remark_name = value; toast.success('修改成功') } catch (e: any) { if (e !== 'cancel') { toast.error('修改失败') } } }
async function toggleTop() { if (!contact.value) return; try { await contactApi.updateContact(contactId.value, { is_top: contact.value.is_top }); toast.success(contact.value.is_top ? '已置顶' : '已取消置顶') } catch { contact.value.is_top = !contact.value.is_top; toast.error('操作失败') } }
async function toggleMute() { if (!contact.value) return; try { await contactApi.updateContact(contactId.value, { is_muted: contact.value.is_muted }); toast.success(contact.value.is_muted ? '已开启免打扰' : '已关闭免打扰') } catch { contact.value.is_muted = !contact.value.is_muted; toast.error('操作失败') } }
async function toggleBlock() { if (!contact.value) return; try { await contactApi.updateContact(contactId.value, { is_blocked: contact.value.is_blocked }); toast.success(contact.value.is_blocked ? '已加入黑名单' : '已移出黑名单') } catch { contact.value.is_blocked = !contact.value.is_blocked; toast.error('操作失败') } }
// 手动切换方法 (用于自定义开关)
async function toggleTopManual() { if (!contact.value) return; contact.value.is_top = !contact.value.is_top; await toggleTop() }
async function toggleMuteManual() { if (!contact.value) return; contact.value.is_muted = !contact.value.is_muted; await toggleMute() }
async function deleteFriend() { try { await messageBox.confirm({ title: '提示', msg: '确定要删除该好友吗？删除后将无法恢复' }); await contactApi.deleteContact(contactId.value); toast.success('删除成功'); setTimeout(() => { uni.navigateBack() }, 1000) } catch (e: any) { if (e !== 'cancel') { toast.error('删除失败') } } }
</script>

<style lang="scss" scoped>
// ==========================================
// 页面容器 - 浅色模式 (与设计稿完全一致)
// ==========================================
.detail-container {
  --bg-page: #f3f4f6;                  // gray-100 (页面背景)
  --bg-card: #ffffff;                  // 卡片背景
  --bg-tag: #f3f4f6;                   // gray-100 (标签背景)
  --bg-toggle: #e5e7eb;                // gray-200 (开关关闭)
  --text-main: #111827;                // gray-900 (名称)
  --text-sub: #6b7280;                 // gray-500 (签名)
  --text-tertiary: #9ca3af;            // gray-400 (标签/值)
  --color-brand: #4F46E5;              // indigo-600
  --border-color: #f9fafb;             // gray-50
  --gradient-to: #ffffff;              // 渐变终点色

  min-height: 100vh;
  background: var(--bg-page);
  position: relative;

  // 深色模式 - Warm Stone (与设计稿完全一致)
  &.theme-dark {
    --bg-page: #0c0a09;                // warm-950
    --bg-card: #1c1917;                // warm-900
    --bg-tag: #292524;                 // warm-800
    --bg-toggle: #44403c;              // warm-700
    --text-main: #fafaf9;              // warm-50
    --text-sub: #a8a29e;               // warm-400
    --text-tertiary: #78716c;          // warm-500
    --color-brand: #f97316;            // orange-500
    --border-color: rgba(41, 37, 36, 0.5);
    --gradient-to: #0c0a09;            // warm-950
  }
}

// 动画
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out forwards;
  opacity: 0;
}

.custom-scrollbar {
  &::-webkit-scrollbar { display: none; }
  -ms-overflow-style: none;
  scrollbar-width: none;
}

// ==========================================
// 视差背景 (与设计稿一致: blur-xl scale-110 opacity-70)
// ==========================================
.parallax-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 600rpx;
  overflow: hidden;
  z-index: 0;

  .blur-image {
    width: 100%;
    height: 100%;
    // blur-xl = 24px, 需要用px单位
    filter: blur(24px);
    -webkit-filter: blur(24px);
    transform: scale(1.1);         // scale-110
    opacity: 0.7;                  // opacity-70

    .theme-dark & {
      opacity: 0.5;
    }
  }

  .gradient-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 0%, var(--gradient-to) 100%);
  }
}

// ==========================================
// 导航栏 (与设计稿一致)
// ==========================================
.nav-header {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;

  /* #ifdef MP-WEIXIN */
  padding: calc(var(--status-bar-height, 44px) + 88rpx + 24rpx) 32rpx 16rpx;
  /* #endif */

  /* #ifndef MP-WEIXIN */
  padding: calc(var(--status-bar-height, 0) + 24rpx) 32rpx 16rpx;
  /* #endif */

  .nav-back, .nav-more {
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.15s;

    svg {
      width: 44rpx;
      height: 44rpx;
      color: var(--text-main);

      .theme-dark & {
        color: #e7e5e4;  // warm-200
      }
    }

    &:active {
      opacity: 0.6;
    }
  }

  .nav-more svg {
    width: 40rpx;
    height: 40rpx;
  }
}

// ==========================================
// 主体滚动区
// ==========================================
.main-scroll {
  height: calc(100vh - 120rpx);
  position: relative;
  z-index: 1;
}

// ==========================================
// 身份卡片区 (与设计稿完全一致)
// ==========================================
.identity-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64rpx 48rpx 64rpx;

  // 头像: w-32 h-32 rounded-full border-[6px] border-white shadow-xl
  .avatar-wrapper {
    border-radius: 50%;
    border: 12rpx solid var(--bg-card);  // border-[6px] = 12rpx
    box-shadow: 0 20rpx 50rpx rgba(0, 0, 0, 0.2);  // shadow-xl
    margin-bottom: 32rpx;
  }

  // 名字: text-2xl font-bold
  .user-name {
    font-size: 48rpx;                    // text-2xl = 24px = 48rpx
    font-weight: 700;                    // font-bold
    color: var(--text-main);
    margin-bottom: 16rpx;
  }

  // 标签行
  .tag-row {
    display: flex;
    gap: 16rpx;
    margin-bottom: 32rpx;
  }

  // 标签: text-xs bg-gray-100 px-2 py-0.5 rounded
  .info-tag {
    font-size: 24rpx;                    // text-xs = 12px = 24rpx
    color: var(--text-tertiary);
    background: var(--bg-tag);
    padding: 8rpx 16rpx;                 // px-2 py-0.5
    border-radius: 8rpx;                 // rounded
  }

  // 签名: text-sm text-gray-500 text-center max-w-[200px]
  .bio-text {
    font-size: 28rpx;                    // text-sm = 14px = 28rpx
    color: var(--text-sub);
    text-align: center;
    line-height: 1.6;                    // leading-relaxed
    max-width: 400rpx;                   // max-w-[200px] = 400rpx
  }
}

// ==========================================
// 设置卡片 (与设计稿一致: rounded-2xl shadow-sm border)
// ==========================================
.settings-card {
  margin: 0 24rpx 48rpx;
  background: var(--bg-card);
  border-radius: 32rpx;                  // rounded-2xl = 16px = 32rpx
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);  // shadow-sm
  border: 2rpx solid var(--border-color);
  overflow: hidden;

  .theme-dark & {
    box-shadow: none;
    border-color: rgba(41, 37, 36, 0.5);
  }
}

// 设置行 (与设计稿一致)
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;                        // p-4 = 16px = 32rpx
  border-bottom: 2rpx solid var(--border-color);
  transition: background 0.15s;

  .theme-dark & {
    border-bottom-color: rgba(41, 37, 36, 0.5);
  }

  &.no-border {
    border-bottom: none;
  }

  &:active {
    background: rgba(0, 0, 0, 0.02);
    .theme-dark & {
      background: rgba(255, 255, 255, 0.02);
    }
  }

  .row-label {
    font-size: 28rpx;                    // text-sm = 14px = 28rpx
    font-weight: 500;                    // font-medium
    color: var(--text-main);

    .theme-dark & {
      color: #e7e5e4;                    // warm-200
    }
  }

  .row-right {
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  .row-value {
    font-size: 24rpx;                    // text-xs
    color: var(--text-tertiary);
  }

  .chevron-icon {
    width: 32rpx;
    height: 32rpx;
    color: #d1d5db;                      // gray-300
  }
}

// 自定义开关 (与设计稿一致)
.toggle-wrap {
  display: flex;
  align-items: center;
}

.custom-toggle {
  width: 80rpx;                          // w-10 = 40px = 80rpx
  height: 48rpx;                         // h-6 = 24px = 48rpx
  background: var(--bg-toggle);
  border-radius: 48rpx;                  // rounded-full
  position: relative;
  transition: background 0.2s;

  .toggle-thumb {
    position: absolute;
    left: 8rpx;
    top: 8rpx;
    width: 32rpx;                        // w-4 = 16px = 32rpx
    height: 32rpx;                       // h-4 = 16px = 32rpx
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);  // shadow-sm
    transition: transform 0.2s;
  }

  &.active {
    background: var(--color-brand);

    .toggle-thumb {
      transform: translateX(32rpx);      // 移动到右边
    }
  }
}

// ==========================================
// 底部悬浮操作栏 (与设计稿一致: rounded-t-[32px] shadow-[0_-10px_40px])
// ==========================================
.floating-dock {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32rpx 48rpx;                  // px-6 py-4
  padding-bottom: calc(64rpx + env(safe-area-inset-bottom));  // pb-8
  background: var(--bg-card);
  border-top: 2rpx solid var(--border-color);
  border-radius: 64rpx 64rpx 0 0;        // rounded-t-[32px] = 64rpx
  box-shadow: 0 -20rpx 80rpx rgba(0, 0, 0, 0.05);  // shadow-[0_-10px_40px]
  z-index: 100;

  .theme-dark & {
    border-top-color: #292524;           // warm-800
  }
}

// 按钮行
.dock-buttons {
  display: flex;
  gap: 32rpx;                            // gap-4 = 16px = 32rpx
  margin-bottom: 32rpx;                  // mb-4
}

.dock-btn {
  height: 96rpx;                         // h-12 = 48px = 96rpx
  border-radius: 32rpx;                  // rounded-2xl
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  transition: all 0.15s;

  svg {
    width: 40rpx;                        // w-5 h-5 = 20px = 40rpx
    height: 40rpx;
  }

  &:active {
    transform: scale(0.95);
    opacity: 0.9;
  }

  // 次要按钮: flex-1
  &.secondary {
    flex: 1;
    background: var(--bg-tag);
    color: var(--text-main);

    .theme-dark & {
      background: #292524;               // warm-800
      color: #e7e5e4;                    // warm-200
    }

    &:hover {
      background: #e5e7eb;               // gray-200
      .theme-dark & {
        background: #44403c;             // warm-700
      }
    }
  }

  // 主要按钮: flex-[2]
  &.primary {
    flex: 2;
    background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
    color: #fff;
    font-weight: 700;                    // font-bold
    font-size: 28rpx;
    box-shadow: 0 8rpx 24rpx rgba(99, 102, 241, 0.3);

    svg {
      stroke: #fff;
    }

    .theme-dark & {
      background: linear-gradient(135deg, #fb923c 0%, #ea580c 100%);
      box-shadow: 0 8rpx 24rpx rgba(234, 88, 12, 0.3);
    }
  }
}

// 删除好友链接: text-xs text-gray-400 underline
.delete-link {
  text-align: center;

  text {
    font-size: 24rpx;                    // text-xs
    color: var(--text-tertiary);
    text-decoration: underline;          // underline
  }

  &:active text {
    color: #ef4444;                      // hover:text-red-500
  }
}

// 底部留白
.bottom-spacer {
  height: 360rpx;
}

// ==========================================
// 陌生人信息卡片 (参考设计稿)
// ==========================================
.stranger-card {
  margin: 0 24rpx 48rpx;
  background: var(--bg-card);
  border-radius: 32rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  border: 2rpx solid var(--border-color);

  .theme-dark & {
    box-shadow: none;
    border-color: rgba(41, 37, 36, 0.5);
  }

  .section-title {
    font-size: 28rpx;
    font-weight: 600;
    color: var(--text-main);
    margin-bottom: 24rpx;
    display: block;
  }

  .info-row {
    display: flex;
    margin-bottom: 16rpx;

    &:last-child {
      margin-bottom: 0;
    }

    .info-label {
      width: 100rpx;
      font-size: 26rpx;
      color: var(--text-tertiary);
      flex-shrink: 0;
    }

    .info-value {
      flex: 1;
      font-size: 26rpx;
      color: var(--text-sub);
      line-height: 1.5;
    }
  }
}

// ==========================================
// 添加好友按钮 (参考设计稿)
// ==========================================
.add-friend-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  height: 96rpx;
  background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
  border-radius: 48rpx;
  box-shadow: 0 8rpx 24rpx rgba(99, 102, 241, 0.3);
  transition: all 0.15s;

  svg {
    width: 40rpx;
    height: 40rpx;
    stroke: #fff;
  }

  text {
    color: #fff;
    font-size: 32rpx;
    font-weight: 600;
  }

  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }

  .theme-dark & {
    background: linear-gradient(135deg, #fb923c 0%, #ea580c 100%);
    box-shadow: 0 8rpx 24rpx rgba(234, 88, 12, 0.3);
  }
}

// 加载中
.center-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>

