<template>
  <view class="detail-container" :class="{ 'theme-dark': isDark }">
    <!-- 头部背景区 (视差效果) -->
    <view class="profile-header">
      <view class="blur-bg" :style="headerBgStyle" />
      <view class="gradient-mask" />

      <!-- 返回按钮 -->
      <view class="nav-back" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </view>
    </view>

    <!-- 主体内容 (浮动卡片) -->
    <scroll-view scroll-y class="main-content custom-scrollbar" v-if="!loading && contact">
      <view class="content-wrapper">

        <!-- 用户身份卡片 -->
        <view class="identity-card animate-fade-in-up">
          <view class="avatar-wrapper">
            <app-avatar
                :src="contact.user?.avatar"
                :name="contact.remark_name || contact.user?.name"
                :size="256"
                round
                custom-style="border: 12rpx solid var(--bg-card);"
            />
          </view>
          <view class="info-block">
            <text class="user-name">{{ contact.remark_name || contact.user?.name || '未知' }}</text>
            <view class="meta-row">
              <view class="meta-tag">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <text>ID: {{ contact.user?.id || '-' }}</text>
              </view>
              <view class="meta-tag">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <text>{{ contact.user?.region || '未知地区' }}</text>
              </view>
            </view>
            <text class="bio-text">{{ contact.user?.desc || '这个人很懒，什么都没写' }}</text>
          </view>
        </view>

        <!-- 设置组：资料 -->
        <view class="settings-group animate-fade-in-up" style="animation-delay: 100ms;">
          <view class="settings-card">
            <view class="setting-item" @click="editRemark">
              <view class="icon-wrap color-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </view>
              <view class="item-body">
                <text class="item-title">设置备注</text>
                <text class="item-value">{{ contact.remark_name || '未设置' }}</text>
              </view>
              <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </view>
          </view>
        </view>

        <!-- 设置组：交互 -->
        <view class="settings-group animate-fade-in-up" style="animation-delay: 150ms;">
          <view class="group-label">隐私与通知</view>
          <view class="settings-card">
            <view class="setting-item">
              <view class="icon-wrap color-orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </view>
              <view class="item-body">
                <text class="item-title">置顶聊天</text>
              </view>
              <wd-switch v-model="contact.is_top" size="24px" :active-color="isDark ? '#f97316' : '#4F46E5'" @change="toggleTop" />
            </view>

            <view class="setting-item">
              <view class="icon-wrap color-purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </view>
              <view class="item-body">
                <text class="item-title">消息免打扰</text>
              </view>
              <wd-switch v-model="contact.is_muted" size="24px" :active-color="isDark ? '#f97316' : '#4F46E5'" @change="toggleMute" />
            </view>

            <view class="setting-item">
              <view class="icon-wrap color-red">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                </svg>
              </view>
              <view class="item-body">
                <text class="item-title">加入黑名单</text>
              </view>
              <wd-switch v-model="contact.is_blocked" size="24px" active-color="#ef4444" @change="toggleBlock" />
            </view>
          </view>
        </view>

        <view class="spacer" />
      </view>
    </scroll-view>

    <!-- Loading -->
    <view v-else-if="loading" class="center-loading">
      <wd-loading size="60rpx" :color="isDark ? '#f97316' : '#4F46E5'"/>
    </view>

    <!-- 底部悬浮操作栏 -->
    <view class="floating-dock" v-if="contact">
      <view class="dock-content">
        <view class="dock-btn secondary" @click="startAudioCall">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/>
          </svg>
        </view>
        <view class="dock-btn primary" @click="goChat">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <text>发消息</text>
        </view>
        <view class="dock-btn secondary" @click="startVideoCall">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </view>
      </view>

      <view class="danger-btn" @click="deleteFriend">
        <text>删除好友</text>
      </view>
    </view>

    <wd-toast />
    <wd-message-box />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import * as contactApi from '@/api/modules/contact'
import { useToast, useMessage } from 'wot-design-uni'
import { useTheme } from '@/composables/useTheme'
import AppAvatar from '@/components/common/AppAvatar.vue'
import type { Contact } from '@/types/api'

// --- 逻辑保持不变 ---
const toast = useToast(); const messageBox = useMessage(); const { isDark } = useTheme();
const loading = ref(true); const contact = ref<Contact | null>(null); const contactId = ref(''); const userId = ref('');

const headerBgStyle = computed(() => {
  const url = contact.value?.user?.avatar || '';
  return url ? `background-image: url(${url});` : 'background: var(--bg-card);';
})

onLoad((options: any) => { contactId.value = options?.id || ''; userId.value = options?.userId || '' })
onMounted(async () => { if (contactId.value) { await loadContact() } else if (userId.value) { await loadContactByUserId() } })
async function loadContact() { loading.value = true; try { contact.value = await contactApi.getContactDetail(contactId.value) } catch (error) { console.error('加载联系人失败:', error); toast.error('加载失败') } finally { loading.value = false } }
async function loadContactByUserId() { loading.value = true; try { const contacts = await contactApi.getContacts(); const found = contacts.find((c: Contact) => c.contact_user_id === userId.value || c.user_id === userId.value); if (found) { contact.value = await contactApi.getContactDetail(found.id?.toString() || '') } else { toast.warning('未找到该联系人'); setTimeout(() => uni.navigateBack(), 1500) } } catch (error) { console.error('加载联系人失败:', error); toast.error('加载失败') } finally { loading.value = false } }
function goBack() { uni.navigateBack() }
function goChat() { if (!contact.value) return; uni.navigateTo({ url: `/pages/chat/index?targetId=${contact.value.contact_user_id}&roomId=${contact.value.room_id || ''}&name=${encodeURIComponent(contact.value.remark_name || contact.value.user?.name || '')}&avatar=${encodeURIComponent(contact.value.user?.avatar || '')}` }) }
function startAudioCall() { if (!contact.value) return; uni.navigateTo({ url: `/pages/chat/index?targetId=${contact.value.contact_user_id}&roomId=${contact.value.room_id || ''}&name=${encodeURIComponent(contact.value.remark_name || contact.value.user?.name || '')}&avatar=${encodeURIComponent(contact.value.user?.avatar || '')}&callType=audio` }) }
function startVideoCall() { if (!contact.value) return; uni.navigateTo({ url: `/pages/chat/index?targetId=${contact.value.contact_user_id}&roomId=${contact.value.room_id || ''}&name=${encodeURIComponent(contact.value.remark_name || contact.value.user?.name || '')}&avatar=${encodeURIComponent(contact.value.user?.avatar || '')}&callType=video` }) }
async function editRemark() { if (!contact.value) return; try { const { value } = await messageBox.prompt({ title: '修改备注名', inputValue: contact.value.remark_name || '', inputPlaceholder: '请输入备注名' }); await contactApi.updateContact(contactId.value, { remark_name: value }); contact.value.remark_name = value; toast.success('修改成功') } catch (e: any) { if (e !== 'cancel') { toast.error('修改失败') } } }
async function toggleTop() { if (!contact.value) return; try { await contactApi.updateContact(contactId.value, { is_top: contact.value.is_top }); toast.success(contact.value.is_top ? '已置顶' : '已取消置顶') } catch { contact.value.is_top = !contact.value.is_top; toast.error('操作失败') } }
async function toggleMute() { if (!contact.value) return; try { await contactApi.updateContact(contactId.value, { is_muted: contact.value.is_muted }); toast.success(contact.value.is_muted ? '已开启免打扰' : '已关闭免打扰') } catch { contact.value.is_muted = !contact.value.is_muted; toast.error('操作失败') } }
async function toggleBlock() { if (!contact.value) return; try { await contactApi.updateContact(contactId.value, { is_blocked: contact.value.is_blocked }); toast.success(contact.value.is_blocked ? '已加入黑名单' : '已移出黑名单') } catch { contact.value.is_blocked = !contact.value.is_blocked; toast.error('操作失败') } }
async function deleteFriend() { try { await messageBox.confirm({ title: '提示', msg: '确定要删除该好友吗？删除后将无法恢复' }); await contactApi.deleteContact(contactId.value); toast.success('删除成功'); setTimeout(() => { uni.navigateBack() }, 1000) } catch (e: any) { if (e !== 'cancel') { toast.error('删除失败') } } }
</script>

<style lang="scss" scoped>
// 页面容器 - 浅色模式
.detail-container {
  --bg-base: #f7f8fa;
  --bg-card: #ffffff;
  --text-main: #1d1d1f;
  --text-sub: #6b7280;
  --color-brand: #4F46E5;

  min-height: 100vh;
  background: var(--bg-base);
  position: relative;

  // 深色模式 - Warm Stone
  &.theme-dark {
    --bg-base: #1c1917;
    --bg-card: #292524;
    --text-main: #f5f5f4;
    --text-sub: #78716c;
    --color-brand: #f97316;
  }
}

// 动画
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

// 视差头部背景
.profile-header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 600rpx;
  z-index: 0;
  overflow: hidden;

  .blur-bg {
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    filter: blur(40px);
    transform: scale(1.1);
    opacity: 0.7;

    .theme-dark & {
      opacity: 0.4;
    }
  }

  .gradient-mask {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 0%, var(--bg-base) 85%);
  }

  .nav-back {
    position: absolute;
    top: calc(var(--status-bar-height) + 16rpx);
    left: 24rpx;
    width: 72rpx;
    height: 72rpx;
    background: rgba(0, 0, 0, 0.15);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    z-index: 10;
    transition: all 0.15s;

    svg {
      width: 40rpx;
      height: 40rpx;
      color: #fff;
    }

    &:active {
      transform: scale(0.95);
      background: rgba(0, 0, 0, 0.25);
    }
  }
}

// 主内容
.main-content {
  height: 100vh;
  position: relative;
  z-index: 1;
}

.content-wrapper {
  padding: 0 32rpx;
  padding-top: calc(220rpx + var(--status-bar-height));
}

// 身份卡片
.identity-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;

  .avatar-wrapper {
    box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.15);
    border-radius: 50%;
  }

  .info-block {
    margin-top: 30rpx;
    text-align: center;

    .user-name {
      font-size: 48rpx;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 16rpx;
    }

    .meta-row {
      display: flex;
      justify-content: center;
      gap: 16rpx;
      margin-bottom: 24rpx;

      .meta-tag {
        display: flex;
        align-items: center;
        gap: 8rpx;
        font-size: 24rpx;
        color: var(--text-sub);
        background: rgba(0, 0, 0, 0.04);
        padding: 10rpx 20rpx;
        border-radius: 20rpx;

        .theme-dark & {
          background: rgba(255, 255, 255, 0.08);
        }

        svg {
          width: 24rpx;
          height: 24rpx;
        }
      }
    }

    .bio-text {
      font-size: 28rpx;
      color: var(--text-sub);
      max-width: 500rpx;
      line-height: 1.6;
    }
  }
}

// 设置组
.settings-group {
  margin-bottom: 40rpx;

  .group-label {
    font-size: 26rpx;
    color: var(--text-sub);
    margin-bottom: 16rpx;
    margin-left: 12rpx;
    font-weight: 600;
  }
}

.settings-card {
  background: var(--bg-card);
  border-radius: 24rpx;
  overflow: hidden;
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 28rpx 28rpx;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.04);
  transition: background 0.15s;

  .theme-dark & {
    border-bottom-color: rgba(255, 255, 255, 0.06);
  }

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: rgba(0, 0, 0, 0.02);

    .theme-dark & {
      background: rgba(255, 255, 255, 0.02);
    }
  }

  .icon-wrap {
    width: 60rpx;
    height: 60rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;

    svg {
      width: 32rpx;
      height: 32rpx;
    }

    &.color-blue { background: #0ea5e9; }
    &.color-orange { background: #f97316; }
    &.color-purple { background: #8b5cf6; }
    &.color-red { background: #ef4444; }
  }

  .item-body {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .item-title {
    font-size: 30rpx;
    color: var(--text-main);
    font-weight: 500;
  }

  .item-value {
    font-size: 26rpx;
    color: var(--text-sub);
    margin-top: 4rpx;
  }

  .chevron {
    width: 32rpx;
    height: 32rpx;
    color: var(--text-sub);
    opacity: 0.5;
  }
}

.spacer {
  height: 320rpx;
}

// 底部操作台
.floating-dock {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 30rpx 40rpx;
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
  background: var(--bg-card);
  border-top: 1rpx solid rgba(0, 0, 0, 0.05);
  border-radius: 64rpx 64rpx 0 0;
  box-shadow: 0 -20rpx 80rpx rgba(0, 0, 0, 0.05);
  z-index: 100;

  .theme-dark & {
    border-top-color: rgba(255, 255, 255, 0.05);
  }

  .dock-content {
    display: flex;
    align-items: center;
    gap: 24rpx;
    margin-bottom: 24rpx;

    .dock-btn {
      height: 100rpx;
      border-radius: 32rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;

      svg {
        width: 44rpx;
        height: 44rpx;
      }

      &:active {
        transform: scale(0.96);
      }

      &.primary {
        flex: 2;
        background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
        color: #fff;
        gap: 16rpx;
        font-weight: 600;
        font-size: 32rpx;
        box-shadow: 0 8rpx 24rpx rgba(79, 70, 229, 0.25);

        .theme-dark & {
          background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
          box-shadow: 0 8rpx 24rpx rgba(249, 115, 22, 0.25);
        }
      }

      &.secondary {
        flex: 1;
        background: rgba(0, 0, 0, 0.04);
        color: var(--text-main);

        .theme-dark & {
          background: rgba(255, 255, 255, 0.08);
        }
      }
    }
  }

  .danger-btn {
    text-align: center;

    text {
      color: var(--text-sub);
      font-size: 26rpx;
      padding: 10rpx 20rpx;
      opacity: 0.6;
    }

    &:active text {
      opacity: 1;
      color: #ef4444;
    }
  }
}

.center-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
