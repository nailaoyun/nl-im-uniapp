<template>
  <view class="detail-container" :class="{ 'theme-dark': isDark }">
    <!-- 头部背景区 (视差效果) -->
    <view class="profile-header">
      <view class="blur-bg" :style="headerBgStyle" />
      <view class="gradient-mask" />
      <app-nav-bar custom-style="background: transparent;" title-style="color: transparent;" />
    </view>

    <!-- 主体内容 (浮动卡片) -->
    <scroll-view scroll-y class="main-content" v-if="!loading && contact">
      <view class="content-wrapper">

        <!-- 用户身份卡片 -->
        <view class="identity-card">
          <view class="avatar-wrapper">
            <app-avatar
                :src="contact.user?.avatar"
                :name="contact.remark_name || contact.user?.name"
                :size="180"
                radius="50%"
                custom-style="border: 6rpx solid var(--bg-card);"
            />
          </view>
          <view class="info-block">
            <text class="user-name">{{ contact.remark_name || contact.user?.name || '未知' }}</text>
            <view class="meta-row">
              <text class="meta-tag">ID: {{ contact.user?.id || '-' }}</text>
              <text class="meta-tag">{{ contact.user?.region || '未知地区' }}</text>
            </view>
            <text class="bio-text">{{ contact.user?.desc || '这个人很懒，什么都没写' }}</text>
          </view>
        </view>

        <!-- 设置组：资料 -->
        <view class="settings-group">
          <wd-cell-group border>
            <wd-cell title="设置备注" is-link @click="editRemark">
              <template #icon><view class="icon-wrap color-blue"><wd-icon name="edit-1" size="32rpx" color="#fff"/></view></template>
              <template #value><text class="cell-text">{{ contact.remark_name || '未设置' }}</text></template>
            </wd-cell>
          </wd-cell-group>
        </view>

        <!-- 设置组：交互 -->
        <view class="settings-group">
          <view class="group-label">隐私与通知</view>
          <wd-cell-group border>
            <wd-cell title="置顶聊天" center>
              <template #icon><view class="icon-wrap color-orange"><wd-icon name="star" size="32rpx" color="#fff"/></view></template>
              <template #value>
                <wd-switch v-model="contact.is_top" size="24px" active-color="#4F46E5" @change="toggleTop" />
              </template>
            </wd-cell>
            <wd-cell title="消息免打扰" center>
              <template #icon><view class="icon-wrap color-purple"><wd-icon name="notification-off" size="32rpx" color="#fff"/></view></template>
              <template #value>
                <wd-switch v-model="contact.is_muted" size="24px" active-color="#4F46E5" @change="toggleMute" />
              </template>
            </wd-cell>
            <wd-cell title="加入黑名单" center>
              <template #icon><view class="icon-wrap color-red"><wd-icon name="forbid" size="32rpx" color="#fff"/></view></template>
              <template #value>
                <wd-switch v-model="contact.is_blocked" size="24px" active-color="#FA5151" @change="toggleBlock" />
              </template>
            </wd-cell>
          </wd-cell-group>
        </view>

        <view class="spacer" />
      </view>
    </scroll-view>

    <!-- Loading -->
    <view v-else-if="loading" class="center-loading">
      <wd-loading size="60rpx" color="#4F46E5"/>
    </view>

    <!-- 底部悬浮操作栏 -->
    <view class="floating-dock" v-if="contact">
      <view class="dock-content">
        <view class="dock-btn secondary" @click="startAudioCall">
          <wd-icon name="phone-filled" size="44rpx" />
        </view>
        <view class="dock-btn primary" @click="goChat">
          <wd-icon name="chat-filled" size="40rpx" />
          <text>发消息</text>
        </view>
        <view class="dock-btn secondary" @click="startVideoCall">
          <wd-icon name="video" size="44rpx" />
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
/* 高级灰配色 */
.detail-container {
  --bg-base: #F5F7FA;
  --bg-card: #FFFFFF;
  --text-main: #1D1D1F;
  --text-sub: #86909C;
  --primary: #4F46E5;

  min-height: 100vh;
  background: var(--bg-base);
  position: relative;

  &.theme-dark {
    --bg-base: #121212; /* 深度灰 */
    --bg-card: #1C1C1E; /* 卡片灰 */
    --text-main: #F7F8FA;
    --text-sub: #888;
  }
}

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
    filter: blur(50px);
    transform: scale(1.2);
    opacity: 0.8;
    .theme-dark & { opacity: 0.4; }
  }

  .gradient-mask {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 0%, var(--bg-base) 90%);
  }
}

.main-content {
  height: 100vh;
  position: relative;
  z-index: 1;
}

.content-wrapper {
  padding: 0 32rpx;
  padding-top: calc(180rpx + var(--status-bar-height));
}

/* 身份卡片 */
.identity-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;

  .avatar-wrapper {
    box-shadow: 0 16rpx 40rpx rgba(0,0,0,0.1);
    border-radius: 50%;
  }

  .info-block {
    margin-top: 30rpx;
    text-align: center;

    .user-name {
      font-size: 48rpx;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 16rpx;
      letter-spacing: -1rpx;
    }

    .meta-row {
      display: flex;
      justify-content: center;
      gap: 16rpx;
      margin-bottom: 24rpx;

      .meta-tag {
        font-size: 24rpx;
        color: var(--text-sub);
        background: rgba(0,0,0,0.03);
        .theme-dark & { background: rgba(255,255,255,0.08); }
        padding: 6rpx 20rpx;
        border-radius: 12rpx;
      }
    }

    .bio-text {
      font-size: 28rpx;
      color: var(--text-main);
      opacity: 0.6;
      max-width: 500rpx;
      line-height: 1.6;
    }
  }
}

/* 设置组 */
.settings-group {
  margin-bottom: 40rpx;

  .group-label {
    font-size: 26rpx;
    color: var(--text-sub);
    margin-bottom: 20rpx;
    margin-left: 12rpx;
    font-weight: 600;
  }

  :deep(.wd-cell-group) {
    border-radius: 32rpx;
    overflow: hidden;
    background: var(--bg-card);
    box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.02);
  }

  :deep(.wd-cell) {
    background: transparent;
    padding: 36rpx 32rpx;
    &::after { left: 110rpx; background: rgba(0,0,0,0.05); }
    .theme-dark &::after { background: rgba(255,255,255,0.05); }
  }

  .icon-wrap {
    width: 60rpx;
    height: 60rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;

    &.color-blue { background: #007AFF; }
    &.color-orange { background: #FF9500; }
    &.color-purple { background: #5856D6; }
    &.color-red { background: #FF3B30; }
  }

  .cell-text {
    color: var(--text-sub);
    font-size: 28rpx;
  }
}

.spacer { height: 300rpx; }

/* 底部操作台 */
.floating-dock {
  position: fixed;
  bottom: 0;
  width: 100%;
  padding: 30rpx 40rpx;
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
  background: var(--bg-card);
  border-top: 1rpx solid rgba(0,0,0,0.05);
  border-radius: 48rpx 48rpx 0 0;
  box-shadow: 0 -10rpx 40rpx rgba(0,0,0,0.04);
  z-index: 100;

  .theme-dark & { border-top-color: rgba(255,255,255,0.05); }

  .dock-content {
    display: flex;
    align-items: center;
    gap: 32rpx;
    margin-bottom: 30rpx;

    .dock-btn {
      height: 110rpx;
      border-radius: 36rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:active { transform: scale(0.96); }

      &.primary {
        flex: 2;
        background: var(--primary);
        color: #fff;
        gap: 16rpx;
        font-weight: 600;
        font-size: 34rpx;
        box-shadow: 0 10rpx 24rpx rgba(79, 70, 229, 0.2);
      }

      &.secondary {
        flex: 1;
        background: rgba(0,0,0,0.04);
        color: var(--text-main);
        .theme-dark & { background: rgba(255,255,255,0.08); }
      }
    }
  }

  .danger-btn {
    text-align: center;
    text {
      color: var(--text-sub);
      font-size: 26rpx;
      text-decoration: underline;
      padding: 10rpx 20rpx;
      opacity: 0.8;
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
