<template>
  <wd-config-provider :theme="isDark ? 'dark' : 'light'">
    <view class="page-container" :class="{ dark: isDark }">

      <!-- 头部固定区域 -->
      <view class="fixed-header">
        <view class="nav-bar">
          <text class="nav-title">通讯录</text>
          <!-- 修复：添加好友按钮 -->
          <view class="icon-btn" @click="goAddFriend">
            <wd-icon name="add-user" size="48rpx" color="var(--text-primary)" />
          </view>
        </view>

        <view class="search-box-wrap">
          <wd-search
              v-model="searchKeyword"
              placeholder="搜索联系人/群聊"
              disabled
              hide-cancel
              custom-style="background: var(--bg-surface);"
              @click="goSearch"
          />
        </view>

        <view class="tabs-wrapper">
          <view class="segmented-control">
            <view
                v-for="tab in tabs"
                :key="tab.key"
                class="segment-item"
                :class="{ active: activeTab === tab.key }"
                @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </view>
          </view>
        </view>
      </view>

      <!-- 滚动内容 -->
      <scroll-view
          class="main-scroll"
          scroll-y
          :refresher-enabled="true"
          :refresher-triggered="refreshing"
          @refresherrefresh="onRefresh"
      >
        <!-- 修复：顶部间距，防止Grid被遮挡 -->
        <view class="scroll-spacer"></view>

        <!-- 功能 Grid -->
        <view v-if="activeTab === 'groups'" class="feature-grid">
          <view class="feature-card" @click="goFriendRequests">
            <view class="icon-wrap is-orange"><wd-icon name="user-add" size="36rpx" color="#fff" /></view>
            <view class="text-wrap">
              <text class="feature-title">新朋友</text>
              <wd-badge v-if="friendRequestCount > 0" :value="friendRequestCount" type="danger" />
            </view>
          </view>
          <view class="feature-card" @click="goGroupNotify">
            <view class="icon-wrap is-blue"><wd-icon name="bell" size="36rpx" color="#fff" /></view>
            <view class="text-wrap"><text class="feature-title">群通知</text></view>
          </view>
        </view>

        <!-- 列表内容 -->
        <view class="list-container">
          <view v-if="loading" class="loading-box"><wd-loading size="40rpx" /></view>

          <!-- 1. 分组 Tab -->
          <template v-else-if="activeTab === 'groups'">
            <view class="group-section-header">
              <text class="section-title">我的分组</text>
              <view class="add-group-btn" @click="showCreateGroupModal = true">
                <wd-icon name="add" size="24rpx" /> <text>新建</text>
              </view>
            </view>

            <!-- 未分组 -->
            <view v-if="ungroupedContacts.length" class="collapse-item">
              <view class="collapse-header" @click="toggleCollapse(0)">
                <wd-icon :name="collapsedIds.includes(0) ? 'arrow-right' : 'arrow-down'" size="24rpx" color="var(--text-tertiary)" />
                <text class="collapse-title">未分组</text>
                <text class="collapse-count">{{ ungroupedContacts.length }}</text>
              </view>
              <view v-show="!collapsedIds.includes(0)" class="collapse-content">
                <view v-for="contact in ungroupedContacts" :key="contact.id" class="contact-cell" @click="goContactDetail(contact)" @longpress="handleContactLongPress(contact)">
                  <app-avatar :src="contact.user?.avatar" :name="contact.remark_name || contact.user?.name" :size="80" radius="12rpx" />
                  <view class="cell-body">
                    <text class="cell-title">{{ contact.remark_name || contact.user?.name }}</text>
                    <text class="cell-desc">{{ contact.user?.desc || '暂无签名' }}</text>
                  </view>
                </view>
              </view>
            </view>

            <!-- 自定义分组 -->
            <view v-for="group in contactGroups" :key="group.id" class="collapse-item">
              <view class="collapse-header" @click="toggleCollapse(group.id)" @longpress="handleGroupLongPress(group)">
                <wd-icon :name="collapsedIds.includes(group.id) ? 'arrow-right' : 'arrow-down'" size="24rpx" color="var(--text-tertiary)" />
                <text class="collapse-title">{{ group.group_name }}</text>
                <text class="collapse-count">{{ getGroupContacts(group.id).length }}</text>
              </view>
              <view v-show="!collapsedIds.includes(group.id)" class="collapse-content">
                <view v-for="contact in getGroupContacts(group.id)" :key="contact.id" class="contact-cell" @click="goContactDetail(contact)" @longpress="handleContactLongPress(contact)">
                  <app-avatar :src="contact.user?.avatar" :name="contact.remark_name || contact.user?.name" :size="80" radius="12rpx" />
                  <view class="cell-body">
                    <text class="cell-title">{{ contact.remark_name || contact.user?.name }}</text>
                    <text class="cell-desc">{{ contact.user?.desc }}</text>
                  </view>
                </view>
              </view>
            </view>
          </template>

          <!-- 2. 好友 Tab (A-Z) -->
          <template v-else-if="activeTab === 'friends'">
            <view v-for="group in alphabetGroupedContacts" :key="group.letter" class="alpha-group">
              <view class="alpha-header">{{ group.letter }}</view>
              <view class="alpha-list">
                <view v-for="contact in group.contacts" :key="contact.id" class="contact-cell" @click="goContactDetail(contact)">
                  <app-avatar :src="contact.user?.avatar" :name="contact.remark_name || contact.user?.name" :size="80" radius="12rpx" />
                  <view class="cell-body border-bottom">
                    <text class="cell-title">{{ contact.remark_name || contact.user?.name }}</text>
                  </view>
                </view>
              </view>
            </view>
          </template>

          <!-- 3. 群聊 Tab (修复：显示所有群组) -->
          <template v-else-if="activeTab === 'chats'">
            <!-- 我创建的 -->
            <view v-if="createdGroups.length" class="collapse-item">
              <view class="collapse-header" @click="toggleCollapse('created')">
                <wd-icon :name="collapsedIds.includes('created') ? 'arrow-right' : 'arrow-down'" size="24rpx" color="var(--text-tertiary)" />
                <text class="collapse-title">我创建的群</text>
                <text class="collapse-count">{{ createdGroups.length }}</text>
              </view>
              <view v-show="!collapsedIds.includes('created')" class="collapse-content">
                <view v-for="g in createdGroups" :key="g.room_id" class="contact-cell" @click="goGroupChat(g)">
                  <app-avatar :src="g.room_avatar" :name="g.room_name" :size="80" radius="12rpx" />
                  <view class="cell-body"><text class="cell-title">{{ g.room_name }}</text></view>
                </view>
              </view>
            </view>

            <!-- 我管理的 -->
            <view v-if="managedGroups.length" class="collapse-item">
              <view class="collapse-header" @click="toggleCollapse('managed')">
                <wd-icon :name="collapsedIds.includes('managed') ? 'arrow-right' : 'arrow-down'" size="24rpx" color="var(--text-tertiary)" />
                <text class="collapse-title">我管理的群</text>
                <text class="collapse-count">{{ managedGroups.length }}</text>
              </view>
              <view v-show="!collapsedIds.includes('managed')" class="collapse-content">
                <view v-for="g in managedGroups" :key="g.room_id" class="contact-cell" @click="goGroupChat(g)">
                  <app-avatar :src="g.room_avatar" :name="g.room_name" :size="80" radius="12rpx" />
                  <view class="cell-body"><text class="cell-title">{{ g.room_name }}</text></view>
                </view>
              </view>
            </view>

            <!-- 我加入的 -->
            <view v-if="joinedGroups.length" class="collapse-item">
              <view class="collapse-header" @click="toggleCollapse('joined')">
                <wd-icon :name="collapsedIds.includes('joined') ? 'arrow-right' : 'arrow-down'" size="24rpx" color="var(--text-tertiary)" />
                <text class="collapse-title">我加入的群</text>
                <text class="collapse-count">{{ joinedGroups.length }}</text>
              </view>
              <view v-show="!collapsedIds.includes('joined')" class="collapse-content">
                <view v-for="g in joinedGroups" :key="g.room_id" class="contact-cell" @click="goGroupChat(g)">
                  <app-avatar :src="g.room_avatar" :name="g.room_name" :size="80" radius="12rpx" />
                  <view class="cell-body"><text class="cell-title">{{ g.room_name }}</text></view>
                </view>
              </view>
            </view>
          </template>

          <view class="safe-area-spacer"></view>
        </view>
      </scroll-view>

      <!-- 索引条 -->
      <view v-if="activeTab === 'friends'" class="index-bar">
        <view v-for="l in letters" :key="l" class="index-item" @click.stop="scrollToLetter(l)">{{ l }}</view>
      </view>

      <!-- 弹窗组件 -->
      <wd-action-sheet v-model="showContactActions" :actions="contactActionItems" @select="onContactActionSelect" cancel-text="取消" />
      <wd-action-sheet v-model="showGroupActions" :actions="groupActionItems" @select="onGroupActionSelect" cancel-text="取消" />
      <wd-action-sheet v-model="showMoveGroupModal" :actions="moveGroupActions" @select="onMoveGroupSelect" cancel-text="取消" />
      <wd-popup v-model="showCreateGroupModal" custom-style="border-radius: 24rpx; width: 80%; padding: 40rpx; background: var(--bg-surface);">
        <view class="modal-content">
          <view class="modal-title">新建分组</view>
          <wd-input v-model="newGroupName" placeholder="请输入分组名称" clearable custom-style="margin: 30rpx 0;" />
          <view class="modal-btns">
            <wd-button size="medium" plain @click="showCreateGroupModal = false">取消</wd-button>
            <wd-button size="medium" @click="handleCreateGroup" :loading="creating">确定</wd-button>
          </view>
        </view>
      </wd-popup>
      <wd-popup v-model="showRenameGroupModal" custom-style="border-radius: 24rpx; width: 80%; padding: 40rpx; background: var(--bg-surface);">
        <view class="modal-content">
          <view class="modal-title">重命名分组</view>
          <wd-input v-model="renameGroupName" placeholder="请输入新名称" clearable custom-style="margin: 30rpx 0;" />
          <view class="modal-btns">
            <wd-button size="medium" plain @click="showRenameGroupModal = false">取消</wd-button>
            <wd-button size="medium" @click="handleRenameGroup" :loading="renaming">确定</wd-button>
          </view>
        </view>
      </wd-popup>
      <wd-popup v-model="showRemarkModal" custom-style="border-radius: 24rpx; width: 80%; padding: 40rpx; background: var(--bg-surface);">
        <view class="modal-content">
          <view class="modal-title">修改备注</view>
          <wd-input v-model="remarkName" placeholder="请输入备注名" clearable custom-style="margin: 30rpx 0;" />
          <view class="modal-btns">
            <wd-button size="medium" plain @click="showRemarkModal = false">取消</wd-button>
            <wd-button size="medium" @click="handleSaveRemark" :loading="savingRemark">确定</wd-button>
          </view>
        </view>
      </wd-popup>

      <wd-toast />
      <wd-message-box />
      <app-tab-bar current="contacts" />
    </view>
  </wd-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useContactStore, useChatStore } from '@/stores'
import { useTheme } from '@/composables/useTheme'
import { useToast, useMessage } from 'wot-design-uni'
import * as contactApi from '@/api/modules/contact'
import * as roomApi from '@/api/modules/room'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppTabBar from '@/components/common/AppTabBar.vue'
import type { Contact, ContactGroup } from '@/types/api'

// --- 逻辑完全不变 ---
interface GroupChat { room_id: string; room_type: string; room_name: string; room_avatar: string; category: 'joined' | 'created' | 'managed'; }
const contactStore = useContactStore(); const chatStore = useChatStore(); const { isDark } = useTheme(); const toast = useToast(); const messageBox = useMessage();
const tabs = [{ key: 'groups', label: '分组' }, { key: 'friends', label: '好友' }, { key: 'chats', label: '群聊' }]; const activeTab = ref('groups'); const searchKeyword = ref(''); const refreshing = ref(false); const loading = ref(false); const collapsedIds = ref<(number | string)[]>([]); const contactGroups = ref<ContactGroup[]>([]); const groupChats = ref<GroupChat[]>([]); const showContactActions = ref(false); const selectedContact = ref<Contact | null>(null); const showMoveGroupModal = ref(false); const showRemarkModal = ref(false); const remarkName = ref(''); const savingRemark = ref(false); const showGroupActions = ref(false); const selectedGroup = ref<ContactGroup | null>(null); const showCreateGroupModal = ref(false); const showRenameGroupModal = ref(false); const newGroupName = ref(''); const renameGroupName = ref(''); const creating = ref(false); const renaming = ref(false);
const contacts = computed(() => chatStore.contacts); const friendRequestCount = computed(() => contactStore.friendRequests.filter(r => r.status === 'pending').length); const ungroupedContacts = computed(() => contacts.value.filter(c => !c.group_id || c.group_id === 0)); function getGroupContacts(groupId: number): Contact[] { return contacts.value.filter(c => c.group_id === groupId) }
const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#']; const alphabetGroupedContacts = computed(() => { const groups: Record<string, Contact[]> = {}; contacts.value.forEach(contact => { const name = contact.remark_name || contact.user?.name || ''; const firstChar = name.charAt(0).toUpperCase(); const letter = /[A-Z]/.test(firstChar) ? firstChar : '#'; if (!groups[letter]) groups[letter] = []; groups[letter].push(contact) }); return Object.keys(groups).sort((a, b) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b))).map(letter => ({ letter, contacts: groups[letter] })) });
const createdGroups = computed(() => groupChats.value.filter(g => g.category === 'created')); const managedGroups = computed(() => groupChats.value.filter(g => g.category === 'managed')); const joinedGroups = computed(() => groupChats.value.filter(g => g.category === 'joined'));
const contactActionItems = [{ name: '修改备注', value: 'remark' }, { name: '移动到分组', value: 'move' }, { name: '删除好友', value: 'delete', color: '#fa5151' }]; const groupActionItems = [{ name: '重命名', value: 'rename' }, { name: '删除分组', value: 'delete', color: '#fa5151' }]; const moveGroupActions = computed(() => { const actions: any[] = [{ name: '未分组', value: 0 }]; contactGroups.value.forEach(g => { if (selectedContact.value?.group_id !== g.id) actions.push({ name: g.group_name, value: g.id }) }); return actions });
onMounted(() => loadData()); onShow(() => loadFriendRequests());
async function loadData() { loading.value = true; try { const [contactList, groups, chats] = await Promise.all([contactApi.getContacts(), contactApi.getGroups(), roomApi.getUserGroups()]); chatStore.setContacts(contactList); contactGroups.value = groups; groupChats.value = chats || [] } catch (error) { console.error(error) } finally { loading.value = false } }
async function loadFriendRequests() { try { const requests = await contactApi.getFriendRequests(); contactStore.setFriendRequests(requests) } catch {} }
async function onRefresh() { refreshing.value = true; await loadData(); await loadFriendRequests(); refreshing.value = false }
function toggleCollapse(id: number | string) { const idx = collapsedIds.value.indexOf(id); idx === -1 ? collapsedIds.value.push(id) : collapsedIds.value.splice(idx, 1) }
function goSearch() { uni.navigateTo({ url: '/pages/search/index' }) }
function goAddFriend() { uni.navigateTo({ url: '/pages/contact/add' }) }
function goFriendRequests() { uni.navigateTo({ url: '/pages/contact/requests' }) }
function goGroupNotify() { uni.navigateTo({ url: '/pages/group/notify' }) }
function goContactDetail(contact: Contact) { uni.navigateTo({ url: `/pages/contact/detail?id=${contact.id}` }) }
function goGroupChat(group: GroupChat) { uni.navigateTo({ url: `/pages/chat/index?roomId=${group.room_id}&name=${encodeURIComponent(group.room_name || '群聊')}` }) }
function scrollToLetter(letter: string) { console.log(letter) }
function handleContactLongPress(c: Contact) { selectedContact.value = c; remarkName.value = c.remark_name || ''; showContactActions.value = true }
function onContactActionSelect(a: { value: string }) { showContactActions.value = false; if(a.value === 'remark') showRemarkModal.value = true; else if(a.value === 'move') showMoveGroupModal.value = true; else if(a.value === 'delete') handleDeleteContact() }
async function handleSaveRemark() { if(!selectedContact.value) return; savingRemark.value=true; try { await contactApi.updateContact(selectedContact.value.id.toString(), {remark_name: remarkName.value}); const idx = chatStore.contacts.findIndex(c => c.id === selectedContact.value?.id); if(idx>-1) chatStore.contacts[idx].remark_name = remarkName.value; showRemarkModal.value=false; toast.success('备注已修改') } catch(e){toast.error('失败')} finally {savingRemark.value=false} }
async function onMoveGroupSelect(a: { value: number }) { if(!selectedContact.value) return; showMoveGroupModal.value=false; try { await contactApi.updateContact(selectedContact.value.id.toString(), {group_id: a.value}); const idx = chatStore.contacts.findIndex(c => c.id === selectedContact.value?.id); if(idx>-1) chatStore.contacts[idx].group_id = a.value; toast.success('已移动') } catch { toast.error('失败') } }
async function handleDeleteContact() { try { await messageBox.confirm({title:'提示', msg:'确定删除?'}); await contactApi.deleteContact(selectedContact.value!.id.toString()); const idx = chatStore.contacts.findIndex(c=>c.id===selectedContact.value!.id); if(idx>-1) chatStore.contacts.splice(idx,1); toast.success('已删除') } catch {} }
function handleGroupLongPress(g: ContactGroup) { selectedGroup.value=g; renameGroupName.value=g.group_name; showGroupActions.value=true }
function onGroupActionSelect(a: { value: string }) { showGroupActions.value=false; if(a.value==='rename') showRenameGroupModal.value=true; else if(a.value==='delete') handleDeleteGroup() }
async function handleCreateGroup() { if(!newGroupName.value.trim()) return; creating.value=true; try { const ng = await contactApi.createGroup({group_name: newGroupName.value.trim()}); contactGroups.value.push(ng); showCreateGroupModal.value=false; newGroupName.value=''; toast.success('成功') } catch { toast.error('失败') } finally { creating.value=false } }
async function handleRenameGroup() { if(!selectedGroup.value) return; renaming.value=true; try { await contactApi.updateGroup(selectedGroup.value.id, {group_name: renameGroupName.value.trim()}); const idx = contactGroups.value.findIndex(g=>g.id===selectedGroup.value!.id); if(idx>-1) contactGroups.value[idx].group_name=renameGroupName.value.trim(); showRenameGroupModal.value=false; toast.success('成功') } catch { toast.error('失败') } finally { renaming.value=false } }
async function handleDeleteGroup() { try { await messageBox.confirm({title:'提示', msg:'确定删除分组?'}); await contactApi.deleteGroup(selectedGroup.value!.id); const idx = contactGroups.value.findIndex(g=>g.id===selectedGroup.value!.id); if(idx>-1) contactGroups.value.splice(idx,1); chatStore.contacts.forEach(c=>{if(c.group_id===selectedGroup.value?.id) c.group_id=0}); toast.success('已删除') } catch {} }
</script>

<style lang="scss" scoped>
.page-container {
  --bg-page: #f7f8fa;
  --bg-surface: #ffffff;
  --bg-highlight: #f2f3f5;
  --text-primary: #1f1f1f;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;
  --border-color: rgba(0,0,0,0.05);
  --brand-color: #4f46e5;
  --tab-bg: #e5e7eb;
  --tab-active-bg: #ffffff;

  min-height: 100vh;
  background: var(--bg-page);
  color: var(--text-primary);
}

.page-container.dark {
  --bg-page: #1c1c1e; /* Dark Grey */
  --bg-surface: #2c2c2e;
  --bg-highlight: #3a3a3c;
  --text-primary: #f2f2f7;
  --text-secondary: #aeaeb2;
  --text-tertiary: #636366;
  --border-color: rgba(255,255,255,0.1);
  --tab-bg: #2c2c2e;
  --tab-active-bg: #636366;
}

.fixed-header {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: var(--bg-page);
  padding-top: var(--status-bar-height);
}

.nav-bar {
  height: 88rpx; display: flex; align-items: center; justify-content: space-between; padding: 0 32rpx;
  .nav-title { font-size: 40rpx; font-weight: 700; }
  .icon-btn { &:active { opacity: 0.7; } }
}

.search-box-wrap { padding: 10rpx 24rpx; }

.tabs-wrapper { padding: 16rpx 32rpx 24rpx; }
.segmented-control {
  background: var(--tab-bg); border-radius: 16rpx; padding: 6rpx; display: flex; height: 72rpx;
  .segment-item {
    flex: 1; display: flex; align-items: center; justify-content: center;
    font-size: 28rpx; font-weight: 500; color: var(--text-secondary); border-radius: 12rpx;
    transition: all 0.3s;
    &.active { background: var(--tab-active-bg); color: var(--text-primary); font-weight: 600; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.08); }
  }
}

.main-scroll { margin-top: calc(var(--status-bar-height) + 290rpx); height: calc(100vh - var(--status-bar-height) - 290rpx); }

/* 修复：Grid 顶部垫片 */
.scroll-spacer { height: 20rpx; }
.feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24rpx; padding: 0 32rpx 32rpx; }
.feature-card {
  background: var(--bg-surface); padding: 24rpx; border-radius: 20rpx; display: flex; align-items: center; gap: 20rpx;
  .icon-wrap { width: 80rpx; height: 80rpx; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; &.is-orange { background: linear-gradient(135deg, #f97316, #fb923c); } &.is-blue { background: linear-gradient(135deg, #0ea5e9, #38bdf8); } }
  .text-wrap { flex: 1; display: flex; flex-direction: column; .feature-title { font-weight: 600; font-size: 28rpx; } }
}

.list-container { padding: 0 32rpx; }
.group-section-header {
  display: flex; align-items: center; justify-content: space-between; margin: 32rpx 0 16rpx;
  .section-title { font-size: 32rpx; font-weight: 700; color: var(--text-secondary); }
  .add-group-btn { display: flex; align-items: center; gap: 4rpx; font-size: 26rpx; color: var(--brand-color); background: rgba(79, 70, 229, 0.1); padding: 8rpx 20rpx; border-radius: 30rpx; }
}

.collapse-item { margin-bottom: 24rpx; background: var(--bg-surface); border-radius: 20rpx; overflow: hidden; }
.collapse-header {
  padding: 24rpx; display: flex; align-items: center; gap: 16rpx; &:active { background: var(--bg-highlight); }
  .collapse-title { flex: 1; font-weight: 600; font-size: 30rpx; }
  .collapse-count { color: var(--text-tertiary); font-size: 24rpx; }
}

.contact-cell {
  padding: 20rpx 24rpx; display: flex; align-items: center; gap: 24rpx; &:active { background: var(--bg-highlight); }
  .cell-body {
    flex: 1; display: flex; flex-direction: column; padding-right: 20rpx;
    &.border-bottom { padding-bottom: 20rpx; border-bottom: 1rpx solid var(--border-color); }
  }
  .cell-title { font-size: 30rpx; font-weight: 500; margin-bottom: 6rpx; }
  .cell-desc { font-size: 24rpx; color: var(--text-tertiary); }
}

.alpha-group { margin-bottom: 30rpx; }
.alpha-header { font-size: 24rpx; font-weight: 700; color: var(--brand-color); margin-bottom: 12rpx; }

.index-bar {
  position: fixed; right: 8rpx; top: 55%; transform: translateY(-50%);
  background: var(--bg-highlight); border-radius: 20rpx; padding: 16rpx 6rpx; z-index: 101;
  .index-item { font-size: 20rpx; font-weight: 600; padding: 2rpx 10rpx; text-align: center; color: var(--text-secondary); margin: 4rpx 0; &:active { color: var(--brand-color); } }
}

.modal-content { display: flex; flex-direction: column; align-items: center; .modal-title { font-size: 34rpx; font-weight: 600; margin-bottom: 10rpx; color: var(--text-primary); } .modal-btns { display: flex; gap: 32rpx; width: 100%; justify-content: space-between; margin-top: 20rpx;} }
.safe-area-spacer { height: 180rpx; }
</style>
