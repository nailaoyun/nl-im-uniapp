<template>
  <wd-config-provider :theme="isDark ? 'dark' : 'light'">
    <view class="page-container" :class="{ dark: isDark }">

      <!-- 头部固定区域 -->
      <view class="fixed-header">
        <view class="nav-bar">
          <!-- 左侧: 头像 + 标题 (与消息页一致) -->
          <view class="nav-left" @click="openDrawer">
            <view class="avatar-container">
              <app-avatar
                :src="user?.avatar"
                :name="user?.name"
                :size="72"
                radius="16rpx"
              />
              <view class="online-dot"></view>
            </view>
            <text class="nav-title">联系人</text>
          </view>
          <!-- 右侧: 添加好友按钮 -->
          <view class="icon-btn" @click="goAddFriend">
            <!-- #ifdef H5 -->
            <svg class="add-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            <!-- #endif -->
            <!-- #ifdef MP-WEIXIN -->
            <wd-icon name="add-circle" size="44rpx" />
            <!-- #endif -->
          </view>
        </view>

        <view class="search-box-wrap">
          <view class="search-inner" @click="goSearch">
            <!-- #ifdef H5 -->
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <!-- #endif -->
            <!-- #ifdef MP-WEIXIN -->
            <wd-icon name="search" size="32rpx" custom-class="search-icon-mp" />
            <!-- #endif -->
            <text class="search-placeholder">搜索联系人/群聊</text>
          </view>
        </view>

        <!-- 分段控制器 -->
        <view class="tabs-wrapper">
          <view class="segmented-control">
            <view
                class="segment-slider"
                :style="{ transform: `translateX(${activeTabIndex * 100}%)` }"
            />
            <view
                v-for="(tab, index) in tabs"
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
          class="main-scroll custom-scrollbar"
          scroll-y
          :scroll-into-view="scrollIntoViewId"
          :scroll-with-animation="true"
          :refresher-enabled="true"
          :refresher-triggered="refreshing"
          @refresherrefresh="onRefresh"
      >
        <view class="scroll-spacer"></view>

        <!-- 功能 Grid -->
        <view v-if="activeTab === 'groups'" class="feature-grid">
          <view class="feature-card" @click="goFriendRequests">
            <view class="icon-wrap is-orange">
              <!-- #ifdef H5 -->
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
              <!-- #endif -->
              <!-- #ifdef MP-WEIXIN -->
              <wd-icon name="add-circle" size="48rpx" color="#fff" />
              <!-- #endif -->
            </view>
            <view class="text-wrap">
              <text class="feature-title">新朋友</text>
              <text v-if="friendRequestCount > 0" class="badge">{{ friendRequestCount }}</text>
            </view>
          </view>
          <view class="feature-card" @click="goGroupNotify">
            <view class="icon-wrap is-blue">
              <!-- #ifdef H5 -->
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <!-- #endif -->
              <!-- #ifdef MP-WEIXIN -->
              <wd-icon name="bell" size="48rpx" color="#fff" />
              <!-- #endif -->
            </view>
            <view class="text-wrap">
              <text class="feature-title">群通知</text>
            </view>
          </view>
        </view>

        <!-- 列表内容 -->
        <view class="list-container">
          <view v-if="loading" class="loading-box">
            <wd-loading size="40rpx" />
          </view>

          <!-- 1. 分组 Tab -->
          <template v-else-if="activeTab === 'groups'">
            <view class="group-section-header">
              <text class="section-title">我的分组</text>
              <view class="add-group-btn" @click="showCreateGroupModal = true">
                <!-- #ifdef H5 -->
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <!-- #endif -->
                <!-- #ifdef MP-WEIXIN -->
                <wd-icon name="add" size="28rpx" />
                <!-- #endif -->
                <text>新建</text>
              </view>
            </view>

            <!-- 未分组 -->
            <view v-if="ungroupedContacts.length" class="collapse-item animate-fade-in-up">
              <view class="collapse-header" @click="toggleCollapse(0)">
                <view class="collapse-arrow" :class="{ collapsed: collapsedIds.includes(0) }">
                  <!-- #ifdef H5 -->
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                  <!-- #endif -->
                  <!-- #ifdef MP-WEIXIN -->
                  <wd-icon name="arrow-down" size="24rpx" />
                  <!-- #endif -->
                </view>
                <text class="collapse-title">未分组</text>
                <text class="collapse-count">{{ ungroupedContacts.length }}</text>
              </view>
              <view v-show="!collapsedIds.includes(0)" class="collapse-content">
                <view v-for="contact in ungroupedContacts" :key="contact.id" class="contact-cell" @click="goContactDetail(contact)" @longpress="handleContactLongPress(contact)">
                  <app-avatar :src="contact.user?.avatar" :name="contact.remark_name || contact.user?.name" :size="80" radius="20rpx" />
                  <view class="cell-body">
                    <text class="cell-title">{{ contact.remark_name || contact.user?.name }}</text>
                    <text class="cell-desc">{{ contact.user?.desc || '暂无签名' }}</text>
                  </view>
                </view>
              </view>
            </view>

            <!-- 自定义分组 -->
            <view v-for="(group, index) in contactGroups" :key="group.id" class="collapse-item animate-fade-in-up" :style="{ animationDelay: `${(index + 1) * 50}ms` }">
              <view class="collapse-header" @click="toggleCollapse(group.id)" @longpress="handleGroupLongPress(group)">
                <view class="collapse-arrow" :class="{ collapsed: collapsedIds.includes(group.id) }">
                  <!-- #ifdef H5 -->
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                  <!-- #endif -->
                  <!-- #ifdef MP-WEIXIN -->
                  <wd-icon name="arrow-down" size="24rpx" />
                  <!-- #endif -->
                </view>
                <text class="collapse-title">{{ group.group_name }}</text>
                <text class="collapse-count">{{ getGroupContacts(group.id).length }}</text>
              </view>
              <view v-show="!collapsedIds.includes(group.id)" class="collapse-content">
                <view v-for="contact in getGroupContacts(group.id)" :key="contact.id" class="contact-cell" @click="goContactDetail(contact)" @longpress="handleContactLongPress(contact)">
                  <app-avatar :src="contact.user?.avatar" :name="contact.remark_name || contact.user?.name" :size="80" radius="20rpx" />
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
            <view v-for="group in alphabetGroupedContacts" :key="group.letter" class="alpha-group" :id="`letter-${group.letter}`">
              <view class="alpha-header">{{ group.letter }}</view>
              <view class="alpha-list">
                <view v-for="contact in group.contacts" :key="contact.id" class="contact-cell" @click="goContactDetail(contact)">
                  <app-avatar :src="contact.user?.avatar" :name="contact.remark_name || contact.user?.name" :size="80" radius="20rpx" />
                  <view class="cell-body border-bottom">
                    <text class="cell-title">{{ contact.remark_name || contact.user?.name }}</text>
                  </view>
                </view>
              </view>
            </view>
          </template>

          <!-- 3. 群聊 Tab -->
          <template v-else-if="activeTab === 'chats'">
            <view v-if="createdGroups.length" class="collapse-item animate-fade-in-up">
              <view class="collapse-header" @click="toggleCollapse('created')">
                <view class="collapse-arrow" :class="{ collapsed: collapsedIds.includes('created') }">
                  <!-- #ifdef H5 -->
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                  <!-- #endif -->
                  <!-- #ifdef MP-WEIXIN -->
                  <wd-icon name="arrow-down" size="24rpx" />
                  <!-- #endif -->
                </view>
                <text class="collapse-title">我创建的群</text>
                <text class="collapse-count">{{ createdGroups.length }}</text>
              </view>
              <view v-show="!collapsedIds.includes('created')" class="collapse-content">
                <view v-for="g in createdGroups" :key="g.room_id" class="contact-cell" @click="goGroupChat(g)">
                  <app-avatar :src="g.room_avatar" :name="g.room_name" :size="80" radius="20rpx" />
                  <view class="cell-body"><text class="cell-title">{{ g.room_name }}</text></view>
                </view>
              </view>
            </view>

            <view v-if="managedGroups.length" class="collapse-item animate-fade-in-up" style="animation-delay: 50ms;">
              <view class="collapse-header" @click="toggleCollapse('managed')">
                <view class="collapse-arrow" :class="{ collapsed: collapsedIds.includes('managed') }">
                  <!-- #ifdef H5 -->
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                  <!-- #endif -->
                  <!-- #ifdef MP-WEIXIN -->
                  <wd-icon name="arrow-down" size="24rpx" />
                  <!-- #endif -->
                </view>
                <text class="collapse-title">我管理的群</text>
                <text class="collapse-count">{{ managedGroups.length }}</text>
              </view>
              <view v-show="!collapsedIds.includes('managed')" class="collapse-content">
                <view v-for="g in managedGroups" :key="g.room_id" class="contact-cell" @click="goGroupChat(g)">
                  <app-avatar :src="g.room_avatar" :name="g.room_name" :size="80" radius="20rpx" />
                  <view class="cell-body"><text class="cell-title">{{ g.room_name }}</text></view>
                </view>
              </view>
            </view>

            <view v-if="joinedGroups.length" class="collapse-item animate-fade-in-up" style="animation-delay: 100ms;">
              <view class="collapse-header" @click="toggleCollapse('joined')">
                <view class="collapse-arrow" :class="{ collapsed: collapsedIds.includes('joined') }">
                  <!-- #ifdef H5 -->
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                  <!-- #endif -->
                  <!-- #ifdef MP-WEIXIN -->
                  <wd-icon name="arrow-down" size="24rpx" />
                  <!-- #endif -->
                </view>
                <text class="collapse-title">我加入的群</text>
                <text class="collapse-count">{{ joinedGroups.length }}</text>
              </view>
              <view v-show="!collapsedIds.includes('joined')" class="collapse-content">
                <view v-for="g in joinedGroups" :key="g.room_id" class="contact-cell" @click="goGroupChat(g)">
                  <app-avatar :src="g.room_avatar" :name="g.room_name" :size="80" radius="20rpx" />
                  <view class="cell-body"><text class="cell-title">{{ g.room_name }}</text></view>
                </view>
              </view>
            </view>
          </template>

          <view class="safe-area-spacer"></view>
        </view>
      </scroll-view>

      <!-- A-Z 索引条 -->
      <view v-if="activeTab === 'friends'" class="index-bar">
        <view v-for="l in letters" :key="l" class="index-item" @click.stop="scrollToLetter(l)">
          {{ l }}
        </view>
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

      <!-- 侧边抽屉 -->
      <app-drawer
        v-model="showDrawer"
        @logout="logout"
      />

      <wd-toast />
      <wd-message-box />
      <app-tab-bar current="contacts" />
      
      <!-- 全局通话组件 -->
      <global-call-provider />
    </view>
  </wd-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useContactStore, useChatStore, useAuthStore } from '@/stores'
import { useTheme } from '@/composables/useTheme'
import { useToast, useMessage } from 'wot-design-uni'
import * as contactApi from '@/api/modules/contact'
import * as roomApi from '@/api/modules/room'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppTabBar from '@/components/common/AppTabBar.vue'
import AppDrawer from '@/components/common/AppDrawer.vue'
import GlobalCallProvider from '@/components/call/GlobalCallProvider.vue'
import type { Contact, ContactGroup } from '@/types/api'

// --- 逻辑完全不变 ---
interface GroupChat { room_id: string; room_type: string; room_name: string; room_avatar: string; category: 'joined' | 'created' | 'managed'; }
const authStore = useAuthStore(); const contactStore = useContactStore(); const chatStore = useChatStore(); const { isDark } = useTheme(); const toast = useToast(); const messageBox = useMessage();
const showDrawer = ref(false); const user = computed(() => authStore.user);
const tabs = [{ key: 'groups', label: '分组' }, { key: 'friends', label: '好友' }, { key: 'chats', label: '群聊' }]; const activeTab = ref('groups'); const searchKeyword = ref(''); const refreshing = ref(false); const loading = ref(false); const collapsedIds = ref<(number | string)[]>([]); const contactGroups = ref<ContactGroup[]>([]); const groupChats = ref<GroupChat[]>([]); const showContactActions = ref(false); const selectedContact = ref<Contact | null>(null); const showMoveGroupModal = ref(false); const showRemarkModal = ref(false); const remarkName = ref(''); const savingRemark = ref(false); const showGroupActions = ref(false); const selectedGroup = ref<ContactGroup | null>(null); const showCreateGroupModal = ref(false); const showRenameGroupModal = ref(false); const newGroupName = ref(''); const renameGroupName = ref(''); const creating = ref(false); const renaming = ref(false); const scrollIntoViewId = ref('');
const contacts = computed(() => chatStore.contacts); const friendRequestCount = computed(() => contactStore.friendRequests.filter(r => r.status === 'pending').length); const ungroupedContacts = computed(() => contacts.value.filter(c => !c.group_id || c.group_id === 0)); function getGroupContacts(groupId: number): Contact[] { return contacts.value.filter(c => c.group_id === groupId) }
const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#']; const alphabetGroupedContacts = computed(() => { const groups: Record<string, Contact[]> = {}; contacts.value.forEach(contact => { const name = contact.remark_name || contact.user?.name || ''; const firstChar = name.charAt(0).toUpperCase(); const letter = /[A-Z]/.test(firstChar) ? firstChar : '#'; if (!groups[letter]) groups[letter] = []; groups[letter].push(contact) }); return Object.keys(groups).sort((a, b) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b))).map(letter => ({ letter, contacts: groups[letter] })) });
const createdGroups = computed(() => groupChats.value.filter(g => g.category === 'created')); const managedGroups = computed(() => groupChats.value.filter(g => g.category === 'managed')); const joinedGroups = computed(() => groupChats.value.filter(g => g.category === 'joined'));
const contactActionItems = [{ name: '修改备注', value: 'remark' }, { name: '移动到分组', value: 'move' }, { name: '删除好友', value: 'delete', color: '#ef4444' }]; const groupActionItems = [{ name: '重命名', value: 'rename' }, { name: '删除分组', value: 'delete', color: '#ef4444' }]; const moveGroupActions = computed(() => { const actions: any[] = [{ name: '未分组', value: 0 }]; contactGroups.value.forEach(g => { if (selectedContact.value?.group_id !== g.id) actions.push({ name: g.group_name, value: g.id }) }); return actions });

// 计算当前选中的标签索引
const activeTabIndex = computed(() => tabs.findIndex(t => t.key === activeTab.value))

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
function scrollToLetter(letter: string) { 
  // 检查是否有该字母的分组
  const hasGroup = alphabetGroupedContacts.value.some(g => g.letter === letter)
  if (hasGroup) {
    // 清空后再设置，确保重复点击同一字母也能触发滚动
    scrollIntoViewId.value = ''
    setTimeout(() => {
      scrollIntoViewId.value = `letter-${letter}`
    }, 10)
  }
}
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
function openDrawer() { showDrawer.value = true }
async function logout() { try { await messageBox.confirm({ title: '提示', msg: '确定退出?' }); showDrawer.value = false; authStore.logout() } catch {} }
</script>

<style lang="scss" scoped>
// ==========================================
// 页面容器 - 浅色模式 (与设计稿一致)
// ==========================================
.page-container {
  --bg-page: #ffffff;                     // 页面背景
  --bg-surface: #ffffff;                  // 卡片背景
  --bg-highlight: #f9fafb;                // gray-50 (hover)
  --bg-group: #f9fafb;                    // gray-50 (分组容器)
  --text-primary: #1f2937;                // gray-900
  --text-secondary: #6b7280;              // gray-500
  --text-tertiary: #9ca3af;               // gray-400
  --border-color: #f3f4f6;                // gray-100
  --color-brand: #4F46E5;                 // indigo-600
  --tab-bg: #f3f4f6;                      // gray-100
  --tab-active-bg: #ffffff;               // white + shadow-sm
  --search-bg: #f3f4f6;                   // gray-100
  --index-bg: rgba(243, 244, 246, 0.8);   // gray-100/80
  --index-hover: rgba(79, 70, 229, 0.1);  // indigo-100

  min-height: 100vh;
  background: var(--bg-page);
  color: var(--text-primary);
}

// ==========================================
// 深色模式 - Warm Stone (与设计稿一致)
// ==========================================
.page-container.dark {
  --bg-page: #1c1917;                      // warm-900
  --bg-surface: #1c1917;                   // warm-900
  --bg-highlight: #292524;                 // warm-800
  --bg-group: rgba(41, 37, 36, 0.4);       // warm-800/40
  --text-primary: #f5f5f4;                 // warm-100
  --text-secondary: #a8a29e;               // warm-400
  --text-tertiary: #78716c;                // warm-500
  --border-color: rgba(41, 37, 36, 0.5);   // warm-800/50
  --color-brand: #f97316;                  // orange-500
  --tab-bg: #292524;                       // warm-800
  --tab-active-bg: #44403c;                // warm-700
  --search-bg: #292524;                    // warm-800
  --index-bg: rgba(41, 37, 36, 0.8);       // warm-800/80
  --index-hover: rgba(154, 52, 18, 0.3);   // orange-900/30
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

// ==========================================
// 固定头部 (与设计稿一致)
// ==========================================
.fixed-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--bg-page);
  padding-top: var(--status-bar-height);
  // 与消息页一致，不要下边框
  border-bottom: none;
  transition: background 0.3s;
}

.nav-bar {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40rpx 16rpx;

  .nav-title {
    font-size: 42rpx;
    font-weight: 700;
    letter-spacing: -0.5rpx;
  }

  .icon-btn {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--search-bg);
    transition: all 0.15s;

    &:active {
      background: var(--bg-highlight);
      transform: scale(0.95);
    }

    .add-icon {
      width: 32rpx;
      height: 32rpx;
      color: var(--text-secondary);
    }
  }
}

// 左侧: 头像 + 标题 (与消息页一致)
.nav-left {
  display: flex;
  align-items: center;
  gap: 24rpx;
  cursor: pointer;
  transition: opacity 0.15s;

  &:active {
    opacity: 0.7;
  }
}

.avatar-container {
  position: relative;
  width: 72rpx;
  height: 72rpx;
}

.online-dot {
  position: absolute;
  bottom: -4rpx;
  right: -4rpx;
  width: 24rpx;
  height: 24rpx;
  background: #10b981;
  border: 4rpx solid var(--bg-surface);
  border-radius: 50%;
}

// 搜索栏
.search-box-wrap {
  padding: 10rpx 32rpx;
}

.search-inner {
  height: 80rpx;
  background: var(--search-bg);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  transition: background 0.2s;

  &:active {
    background: var(--bg-highlight);
  }

  .search-icon {
    width: 32rpx;
    height: 32rpx;
    color: var(--text-tertiary);
  }

  .search-placeholder {
    font-size: 28rpx;
    color: var(--text-tertiary);
  }
}

// 分段控制器
.tabs-wrapper {
  padding: 16rpx 32rpx 24rpx;
}

.segmented-control {
  position: relative;
  background: var(--tab-bg);
  border-radius: 16rpx;
  padding: 6rpx;
  display: flex;
  height: 72rpx;

  .segment-slider {
    position: absolute;
    top: 6rpx;
    left: 6rpx;
    width: calc((100% - 12rpx) / 3);
    height: calc(100% - 12rpx);
    background: var(--tab-active-bg);
    border-radius: 12rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .segment-item {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    font-weight: 500;
    color: var(--text-secondary);
    transition: color 0.3s;

    &.active {
      color: var(--text-primary);
      font-weight: 600;
    }
  }
}

// 滚动区
.main-scroll {
  margin-top: calc(var(--status-bar-height) + 290rpx);
  height: calc(100vh - var(--status-bar-height) - 290rpx);
}

.scroll-spacer {
  height: 20rpx;
}

// ==========================================
// 功能卡片 (与设计稿一致)
// ==========================================
.feature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
  padding: 16rpx 32rpx 16rpx;
}

.feature-card {
  background: var(--bg-surface);
  padding: 24rpx;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  border: 1rpx solid var(--border-color);
  transition: transform 0.15s;

  .dark & {
    box-shadow: none;
  }

  &:active {
    transform: scale(0.98);
  }

  .icon-wrap {
    width: 80rpx;
    height: 80rpx;
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 40rpx;
      height: 40rpx;
    }

    &.is-orange {
      background: linear-gradient(135deg, #fb923c, #f97316);
    }

    &.is-blue {
      background: linear-gradient(135deg, #38bdf8, #0ea5e9);
    }
  }

  .text-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4rpx;

    .feature-title {
      font-weight: 700;
      font-size: 28rpx;
    }

    .badge {
      font-size: 20rpx;
      font-weight: 500;
      color: #ef4444;
    }
  }
}

// 列表容器
.list-container {
  padding: 0 32rpx;
}

.loading-box {
  display: flex;
  justify-content: center;
  padding: 60rpx;
}

// 分组头部
.group-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 32rpx 0 16rpx;

  .section-title {
    font-size: 28rpx;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .add-group-btn {
    display: flex;
    align-items: center;
    gap: 8rpx;
    font-size: 26rpx;
    color: var(--color-brand);
    background: rgba(79, 70, 229, 0.1);
    padding: 10rpx 20rpx;
    border-radius: 30rpx;
    transition: all 0.15s;

    svg {
      width: 24rpx;
      height: 24rpx;
    }

    .dark & {
      background: rgba(249, 115, 22, 0.15);
    }

    &:active {
      opacity: 0.7;
    }
  }
}

// ==========================================
// 折叠项 (与设计稿一致)
// ==========================================
.collapse-item {
  margin-bottom: 16rpx;
  background: var(--bg-group);
  border-radius: 24rpx;
  overflow: hidden;
  border: 1rpx solid var(--border-color);
}

.collapse-header {
  padding: 24rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  transition: background 0.15s;

  &:active {
    background: var(--bg-highlight);
  }

  .collapse-arrow {
    width: 32rpx;
    height: 32rpx;
    color: var(--text-tertiary);
    transition: transform 0.2s;

    svg {
      width: 100%;
      height: 100%;
    }

    &.collapsed {
      transform: rotate(-90deg);
    }
  }

  .collapse-title {
    flex: 1;
    font-weight: 600;
    font-size: 30rpx;
  }

  .collapse-count {
    color: var(--text-tertiary);
    font-size: 24rpx;
  }
}

.collapse-content {
  border-top: 1rpx solid var(--border-color);
}

// 联系人单元格
.contact-cell {
  padding: 20rpx 24rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  transition: background 0.15s;

  &:active {
    background: var(--bg-highlight);
  }

  .cell-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding-right: 20rpx;

    &.border-bottom {
      padding-bottom: 20rpx;
      border-bottom: 1rpx solid var(--border-color);
    }
  }

  .cell-title {
    font-size: 30rpx;
    font-weight: 500;
    margin-bottom: 6rpx;
  }

  .cell-desc {
    font-size: 24rpx;
    color: var(--text-tertiary);
  }
}

// 字母分组
.alpha-group {
  margin-bottom: 30rpx;
}

.alpha-header {
  font-size: 26rpx;
  font-weight: 700;
  color: var(--color-brand);
  margin-bottom: 12rpx;
  padding-left: 4rpx;
}

.alpha-list {
  background: var(--bg-surface);
  border-radius: 20rpx;
  overflow: hidden;
}

// A-Z索引条 (设计稿: 带模糊背景)
.index-bar {
  position: fixed;
  right: 20rpx;  // 设计稿: right-[20px] = 40rpx/2
  top: 50%;
  transform: translateY(-50%);
  background: var(--index-bg);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 20rpx;
  padding: 16rpx 8rpx;
  z-index: 101;
  border: 1rpx solid var(--border-color);

  .index-item {
    font-size: 20rpx;  // 设计稿: text-[10px]
    font-weight: 600;
    width: 32rpx;
    height: 32rpx;
    line-height: 32rpx;
    text-align: center;
    color: var(--text-secondary);
    margin: 2rpx 0;
    border-radius: 50%;
    transition: all 0.15s;

    &:active {
      color: var(--color-brand);
      background: var(--index-hover);
    }

    // 深色模式下提高索引条对比度
    .dark & {
      color: #d6d3d1;  // warm-300 - 更亮的颜色提高对比度

      &:active {
        color: #f97316;  // orange-500
        background: rgba(249, 115, 22, 0.15);  // orange-500/15
      }
    }
  }
}

// 弹窗
.modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;

  .modal-title {
    font-size: 34rpx;
    font-weight: 600;
    margin-bottom: 10rpx;
    color: var(--text-primary);
  }

  .modal-btns {
    display: flex;
    gap: 32rpx;
    width: 100%;
    justify-content: space-between;
    margin-top: 20rpx;
  }
}

.safe-area-spacer {
  height: 180rpx;
}
</style>
