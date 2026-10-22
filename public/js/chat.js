import * as api from './modules/api.js';
import { ChatSocket } from './modules/websocket.js';
import { AvatarPicker } from './modules/avatarPicker.js';
import { ImageViewer } from './modules/imageViewer.js';
import { ChatNotifier } from './modules/notifier.js';
import { StatusBar } from './modules/statusBar.js';
import { formatTime, getDeviceInfo, isAtBottom, getFallbackAvatars } from './modules/utils.js';
import {
  renderUserInfo,
  renderOnlineUsers as renderOnlineUsersHtml,
  renderMessages as renderMessagesHtml,
  createMessageHtml,
  updateMessageUsers
} from './modules/renderer.js';

class LobbyChat {
  constructor() {
    this.currentUser = null;
    this.messages = [];
    this.onlineUsers = [];
    this.emojis = [];

    this.deviceInfo = getDeviceInfo();
    this.fallbackAvatar = getFallbackAvatars()[0];

    this.historyLoaded = false;
    this.isEmojiPickerVisible = false;
    this.typingTimeout = null;
    this.socket = null;

    this.initElements();
    this.initComponents();
    this.bindEvents();
    this.connectWebSocket();
  }

  /* ------------------------------------------------------------ */
  /* DOM 初始化                                                    */
  /* ------------------------------------------------------------ */

  initElements() {
    this.setupModal = document.getElementById('setupModal');
    this.editModal = document.getElementById('editProfileModal');
    this.nicknameInput = document.getElementById('nickname');
    this.randomNicknameBtn = document.getElementById('randomNicknameBtn');
    this.avatarOptions = document.getElementById('avatarOptions');
    this.uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
    this.avatarUpload = document.getElementById('avatarUpload');
    this.customAvatarPreview = document.getElementById('customAvatarPreview');
    this.confirmSetupBtn = document.getElementById('confirmSetup');
    this.changeProfileBtn = document.getElementById('changeProfile');

    this.chatContainer = document.getElementById('chatContainer');
    this.userInfo = document.getElementById('userInfo');
    this.onlineStatus = document.getElementById('onlineStatus');
    this.onlineCount = document.getElementById('onlineCount');
    this.onlineSidebar = document.getElementById('onlineSidebar');
    this.sidebarToggle = document.getElementById('sidebarToggle');
    this.onlineList = document.getElementById('onlineList');
    this.messagesContainer = document.getElementById('messagesContainer');
    this.channelMeta = document.getElementById('channelMeta');
    this.messageInput = document.getElementById('messageInput');
    this.sendBtn = document.getElementById('sendBtn');
    this.emojiBtn = document.getElementById('emojiBtn');
    this.emojiPicker = document.getElementById('emojiPicker');
    this.imageBtn = document.getElementById('imageBtn');
    this.imageUpload = document.getElementById('imageUpload');
    this.status = document.getElementById('status');

    this.editNicknameInput = document.getElementById('editNickname');
    this.editRandomNicknameBtn = document.getElementById('editRandomNicknameBtn');
    this.editAvatarOptions = document.getElementById('editAvatarOptions');
    this.editUploadAvatarBtn = document.getElementById('editUploadAvatarBtn');
    this.editAvatarUpload = document.getElementById('editAvatarUpload');
    this.editCustomAvatarPreview = document.getElementById('editCustomAvatarPreview');
    this.saveProfileBtn = document.getElementById('saveProfileBtn');
    this.cancelEditBtn = document.getElementById('cancelEditBtn');
  }

  initComponents() {
    const chatArea = this.chatContainer.querySelector('.chat-area');
    const inputArea = this.chatContainer.querySelector('.chat-input-area');

    this.statusBar = new StatusBar(this.status);
    this.imageViewer = new ImageViewer(document.getElementById('imageViewer'));
    this.notifier = new ChatNotifier({
      chatArea,
      inputArea,
      onOpen: () => this.scrollToBottom()
    });

    this.setupAvatarPicker = new AvatarPicker({
      mode: 'setup',
      container: this.avatarOptions,
      preview: this.customAvatarPreview,
      uploadButton: this.uploadAvatarBtn,
      uploadInput: this.avatarUpload
    });

    this.editAvatarPicker = new AvatarPicker({
      mode: 'edit',
      container: this.editAvatarOptions,
      preview: this.editCustomAvatarPreview,
      uploadButton: this.editUploadAvatarBtn,
      uploadInput: this.editAvatarUpload
    });
  }

  /* ------------------------------------------------------------ */
  /* 事件绑定                                                      */
  /* ------------------------------------------------------------ */

  bindEvents() {
    this.sendBtn.addEventListener('click', () => this.sendMessage());

    this.messageInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        this.sendMessage();
      }
    });

    this.messageInput.addEventListener('input', () => {
      this.resizeInput();
      this.sendTypingStatus(true);
      clearTimeout(this.typingTimeout);
      this.typingTimeout = setTimeout(() => this.sendTypingStatus(false), 2500);
    });

    this.messageInput.addEventListener('blur', () => this.sendTypingStatus(false));

    this.randomNicknameBtn.addEventListener('click', async () => {
      this.nicknameInput.value = await api.getRandomNickname();
    });

    this.avatarUpload.addEventListener('change', (event) => {
      this.handleAvatarUpload(event, this.setupAvatarPicker);
    });
    this.editAvatarUpload.addEventListener('change', (event) => {
      this.handleAvatarUpload(event, this.editAvatarPicker);
    });

    this.confirmSetupBtn.addEventListener('click', () => this.submitSetup());
    this.changeProfileBtn.addEventListener('click', () => this.showEditModal());
    this.editRandomNicknameBtn.addEventListener('click', async () => {
      this.editNicknameInput.value = await api.getRandomNickname();
    });
    this.saveProfileBtn.addEventListener('click', () => this.submitProfileUpdate());
    this.cancelEditBtn.addEventListener('click', () => this.hideEditModal());
    this.editModal.addEventListener('click', (event) => {
      if (event.target === this.editModal) this.hideEditModal();
    });

    this.emojiBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      this.toggleEmojiPicker();
    });

    this.emojiPicker.addEventListener('click', (event) => {
      const item = event.target.closest('.emoji-item');
      if (item) this.insertEmoji(item.textContent);
    });

    this.imageBtn.addEventListener('click', () => this.imageUpload.click());
    this.imageUpload.addEventListener('change', (event) => this.uploadImage(event));

    this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
    this.onlineStatus.addEventListener('click', () => this.toggleSidebar());

    this.messagesContainer.addEventListener('scroll', () => {
      if (this.notifier.count > 0 && this.isAtBottom()) this.notifier.hide();
    });

    document.addEventListener('click', (event) => {
      if (!this.emojiPicker.contains(event.target) && !this.emojiBtn.contains(event.target)) {
        this.hideEmojiPicker();
      }

      if (window.innerWidth <= 1200) {
        const inSidebar = this.onlineSidebar.contains(event.target);
        const onToggle = this.sidebarToggle.contains(event.target);
        const onStatus = this.onlineStatus.contains(event.target);
        if (!inSidebar && !onToggle && !onStatus) this.closeSidebar();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.hideEditModal();
        this.hideEmojiPicker();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1200) this.closeSidebar();
    });
  }

  resizeInput() {
    const input = this.messageInput;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
  }

  /* ------------------------------------------------------------ */
  /* 资料加载                                                      */
  /* ------------------------------------------------------------ */

  async loadEmojis() {
    try {
      this.emojis = await api.getEmojis();
    } catch (error) {
      this.emojis = ['😀', '😂', '🥰', '😎', '🤔', '👍', '❤️', '🔥', '🎉', '🙏', '👏', '💪'];
    }

    this.emojiPicker.innerHTML = this.emojis
      .map((emoji) => `<span class="emoji-item">${emoji}</span>`)
      .join('');
  }

  async loadMessages() {
    try {
      this.messages = await api.getMessages();
    } catch (error) {
      this.messages = [];
      this.statusBar.show('历史消息加载失败', 'error');
    }
    this.renderMessages();
    this.scrollToBottom();
  }

  /* ------------------------------------------------------------ */
  /* 身份设置                                                      */
  /* ------------------------------------------------------------ */

  async handleRequireSetup() {
    await this.setupAvatarPicker.load(null);
    if (!this.nicknameInput.value) {
      this.nicknameInput.value = await api.getRandomNickname();
    }
    this.setupModal.hidden = false;
    this.chatContainer.hidden = true;
  }

  submitSetup() {
    const nickname = this.nicknameInput.value.trim();
    if (!nickname) {
      this.statusBar.show('请输入代号', 'error');
      return;
    }

    const avatar = this.setupAvatarPicker.value;
    if (!avatar) {
      this.statusBar.show('请选择头像', 'error');
      return;
    }

    if (!this.socket?.isOpen) {
      this.statusBar.show('连接尚未就绪，请稍候重试', 'error');
      return;
    }

    this.socket.sendSetup({ nickname, avatar });
    this.statusBar.show('正在接入大厅…', 'info');
  }

  handleUserInfo(data) {
    this.currentUser = data.user;
    this.setupModal.hidden = true;
    this.editModal.hidden = true;
    this.chatContainer.hidden = false;

    renderUserInfo(this.userInfo, this.currentUser);

    if (!this.historyLoaded) {
      this.historyLoaded = true;
      this.loadMessages();
      this.loadEmojis();
    }

    this.statusBar.show(
      data.isNewUser ? `欢迎 ${data.user.nickname} 加入大厅` : `欢迎回来，${data.user.nickname}`,
      'success'
    );
  }

  handleProfileUpdated(data) {
    this.currentUser = data.user;
    renderUserInfo(this.userInfo, this.currentUser);
    this.updateMessagesUserInfo();
    this.statusBar.show('资料已更新', 'success');
  }

  showEditModal() {
    if (!this.currentUser) return;

    this.editNicknameInput.value = this.currentUser.nickname;
    this.editAvatarPicker.load(this.currentUser.avatar);
    this.editModal.hidden = false;
  }

  hideEditModal() {
    this.editModal.hidden = true;
  }

  submitProfileUpdate() {
    const nickname = this.editNicknameInput.value.trim();
    if (!nickname) {
      this.statusBar.show('请输入代号', 'error');
      return;
    }

    if (!this.socket?.isOpen) {
      this.statusBar.show('连接已断开，请刷新页面', 'error');
      return;
    }

    this.socket.sendProfile({
      nickname,
      avatar: this.editAvatarPicker.value
    });
    this.hideEditModal();
    this.statusBar.show('正在更新资料…', 'info');
  }

  async handleAvatarUpload(event, picker) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      this.statusBar.show('头像上传中…', 'info');
      await picker.upload(file);
      this.statusBar.show('头像上传成功', 'success');
    } catch (error) {
      this.statusBar.show(error.message || '头像上传失败', 'error');
    } finally {
      event.target.value = '';
    }
  }

  /* ------------------------------------------------------------ */
  /* 连接                                                          */
  /* ------------------------------------------------------------ */

  connectWebSocket() {
    this.socket = new ChatSocket({
      deviceInfo: this.deviceInfo,
      onEvent: (data) => this.handleSocketEvent(data),
      onClose: () => {
        this.historyLoaded = false;
      },
      onStatus: (message, type) => this.statusBar.show(message, type)
    });

    this.socket.connect();
  }

  handleSocketEvent(data) {
    switch (data.type) {
      case 'require_setup':
        this.handleRequireSetup();
        break;
      case 'user_info':
        this.handleUserInfo(data);
        break;
      case 'profile_updated':
        this.handleProfileUpdated(data);
        break;
      case 'new_message':
        this.handleNewMessage(data.message);
        break;
      case 'online_users':
        this.handleOnlineUsers(data);
        break;
      case 'user_typing':
        this.handleUserTyping(data);
        break;
      case 'error':
        this.statusBar.show(data.message || '操作失败', 'error');
        break;
    }
  }

  handleUserTyping(data) {
    if (data.isTyping) this.statusBar.showTyping(data.user);
    else this.statusBar.clearTyping();
  }

  sendTypingStatus(isTyping) {
    if (this.currentUser) this.socket?.sendTyping(isTyping);
  }

  /* ------------------------------------------------------------ */
  /* 在线用户                                                      */
  /* ------------------------------------------------------------ */

  handleOnlineUsers(data) {
    this.onlineUsers = Array.isArray(data.users) ? data.users : [];
    this.onlineCount.textContent = data.count ?? this.onlineUsers.length;
    this.renderOnlineUsers();
    this.updateMessagesUserInfo();
  }

  renderOnlineUsers() {
    renderOnlineUsersHtml(
      this.onlineList,
      this.onlineUsers,
      this.currentUserId(),
      this.fallbackAvatar
    );
  }

  currentUserId() {
    return `${this.currentUser?.senderIp || ''}-${this.currentUser?.deviceId || ''}`;
  }

  getUserInfoBySenderId(senderId) {
    if (!senderId) return null;

    if (this.currentUser && senderId === this.currentUserId()) {
      return { nickname: this.currentUser.nickname, avatar: this.currentUser.avatar };
    }

    for (const user of this.onlineUsers) {
      if (`${user.ip}-${user.deviceId}` === senderId) {
        return { nickname: user.nickname, avatar: user.avatar };
      }
    }
    return null;
  }

  /* ------------------------------------------------------------ */
  /* 消息                                                          */
  /* ------------------------------------------------------------ */

  renderContext() {
    return {
      currentUserId: this.currentUserId(),
      resolveUser: (senderId) => this.getUserInfoBySenderId(senderId),
      fallbackAvatar: this.fallbackAvatar
    };
  }

  handleNewMessage(message) {
    if (!message) return;

    const index = this.messages.findIndex((item) => item.id === message.id);
    if (index >= 0) {
      this.messages[index] = message;
      const element = this.messagesContainer.querySelector(`[data-id="${message.id}"]`);
      if (element) element.outerHTML = createMessageHtml(message, this.renderContext());
      this.bindImageClickEvents();
      return;
    }

    const wasAtBottom = this.isAtBottom();
    this.messages.push(message);
    if (this.messages.length > 1000) this.messages.splice(0, this.messages.length - 1000);

    this.renderMessages();

    if (wasAtBottom) {
      this.scrollToBottom();
    } else if (message.type !== 'system' && message.senderId !== this.currentUserId()) {
      this.notifier.show();
    }

    if (message.senderId !== this.currentUserId() && (document.hidden || !wasAtBottom)) {
      this.notifier.playSound();
    }
  }

  renderMessages() {
    const wasAtBottom = this.isAtBottom();

    renderMessagesHtml(this.messagesContainer, this.messages, this.renderContext());
    this.channelMeta.textContent = `MSG ${this.messages.length}`;

    this.bindImageClickEvents();

    if (wasAtBottom) this.scrollToBottom();
  }

  updateMessagesUserInfo() {
    updateMessageUsers(
      this.messagesContainer,
      this.messages,
      (senderId) => this.getUserInfoBySenderId(senderId)
    );
  }

  bindImageClickEvents() {
    this.messagesContainer.querySelectorAll('.message-image').forEach((img) => {
      img.addEventListener('click', (event) => {
        event.stopPropagation();
        const messageId = img.closest('.message')?.dataset.id;
        const message = this.messages.find((item) => String(item.id) === messageId);
        if (message && message.type === 'image') {
          this.imageViewer.show(message.content, message.sender, formatTime(message.timestamp));
        }
      });
    });
  }

  sendMessage() {
    const content = this.messageInput.value.trim();
    if (!content || !this.currentUser) return;

    if (!this.socket?.isOpen) {
      this.statusBar.show('连接已断开，请刷新页面', 'error');
      return;
    }

    this.socket.sendMessage(content);
    this.messageInput.value = '';
    this.resizeInput();
    this.sendTypingStatus(false);
  }

  async uploadImage(event) {
    const file = event.target.files[0];
    if (!file || !this.currentUser) return;

    if (file.size > 5 * 1024 * 1024) {
      this.statusBar.show('图片不能超过 5MB', 'error');
      event.target.value = '';
      return;
    }

    try {
      this.statusBar.show('图片上传中…', 'info');
      await api.uploadImage(file, this.currentUserId());
      this.statusBar.show('图片已发送', 'success');
    } catch (error) {
      this.statusBar.show(error.message || '图片发送失败', 'error');
    } finally {
      event.target.value = '';
    }
  }

  /* ------------------------------------------------------------ */
  /* 表情 / 侧栏                                                   */
  /* ------------------------------------------------------------ */

  toggleEmojiPicker() {
    this.isEmojiPickerVisible = !this.isEmojiPickerVisible;
    this.emojiPicker.classList.toggle('show', this.isEmojiPickerVisible);
  }

  hideEmojiPicker() {
    this.isEmojiPickerVisible = false;
    this.emojiPicker.classList.remove('show');
  }

  insertEmoji(emoji) {
    const input = this.messageInput;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, start) + emoji + input.value.slice(end);
    input.selectionStart = input.selectionEnd = start + emoji.length;
    input.focus();
    this.resizeInput();
    this.sendTypingStatus(true);
  }

  toggleSidebar() {
    this.onlineSidebar.classList.toggle('show');
  }

  closeSidebar() {
    this.onlineSidebar.classList.remove('show');
  }

  isAtBottom() {
    return isAtBottom(this.messagesContainer);
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.chat = new LobbyChat();
});
