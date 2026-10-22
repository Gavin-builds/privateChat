import { escapeHtml, formatTime, formatLastMessageTime } from './utils.js';

export function renderUserInfo(container, user) {
  if (!user) return;
  container.innerHTML = `
    <img src="${escapeHtml(user.avatar)}" alt="${escapeHtml(user.nickname)}" class="user-avatar">
    <span class="user-nickname">${escapeHtml(user.nickname)}</span>
  `;
}

export function renderOnlineUsers(container, users, currentUserId, fallbackAvatar) {
  container.innerHTML = users.map((user) => {
    const userId = `${user.ip}-${user.deviceId}`;
    const isSelf = currentUserId && userId === currentUserId;

    return `
      <div class="online-user ${isSelf ? 'is-self' : ''}" data-user-id="${escapeHtml(userId)}">
        <img src="${escapeHtml(user.avatar || fallbackAvatar)}" alt="${escapeHtml(user.nickname)}" class="online-user-avatar">
        <div class="online-user-info">
          <div class="online-user-name">
            <span>${escapeHtml(user.nickname)}</span>
            ${isSelf ? '<span class="self-tag">YOU</span>' : ''}
          </div>
          <div class="online-user-status">ONLINE</div>
          <div class="online-user-last-message">${formatLastMessageTime(user.lastMessageTime)}</div>
        </div>
      </div>
    `;
  }).join('');
}

export function renderMessages(container, messages, context) {
  const empty = messages.length === 0
    ? `<div class="empty-state">
         <div class="empty-title mono">NO SIGNAL</div>
         <div class="empty-hint mono">大厅还很安静 · 发送第一条广播</div>
       </div>`
    : '';

  container.innerHTML = empty + messages
    .map((message) => createMessageHtml(message, context))
    .join('');
}

export function createMessageHtml(message, { currentUserId, resolveUser, fallbackAvatar }) {
  if (!message) return '';

  if (message.type === 'system') {
    return `
      <div class="message system-message">
        <div class="system-line">
          <span class="sys-tag">SYS</span>
          <span>${escapeHtml(message.content || '')}</span>
        </div>
      </div>
    `;
  }

  const userInfo = resolveUser(message.senderId);
  const senderName = userInfo?.nickname || message.sender || '匿名用户';
  const avatar = userInfo?.avatar || message.avatar || fallbackAvatar;
  const isOwn = currentUserId && message.senderId === currentUserId;

  const contentHtml = message.type === 'image'
    ? `<div class="message-text">IMG // 图片</div>
       <img src="${escapeHtml(message.content)}" alt="聊天图片" class="message-image">`
    : `<div class="message-text">${escapeHtml(message.content || '')}</div>`;

  return `
    <div class="message ${isOwn ? 'own-message' : ''}" data-id="${escapeHtml(message.id)}">
      <img src="${escapeHtml(avatar)}" alt="${escapeHtml(senderName)}" class="message-avatar">
      <div class="message-body">
        <div class="message-meta">
          <span class="sender-name">${escapeHtml(senderName)}</span>
          <span class="message-time">${formatTime(message.timestamp)}</span>
        </div>
        <div class="message-content">${contentHtml}</div>
      </div>
    </div>
  `;
}

export function updateMessageUsers(container, messages, resolveUser) {
  container.querySelectorAll('.message:not(.system-message)').forEach((element) => {
    const message = messages.find((item) => String(item.id) === element.dataset.id);
    if (!message) return;

    const userInfo = resolveUser(message.senderId);
    if (!userInfo) return;

    const nameElement = element.querySelector('.sender-name');
    if (nameElement && nameElement.textContent !== userInfo.nickname) {
      nameElement.textContent = userInfo.nickname;
    }

    const avatarElement = element.querySelector('.message-avatar');
    if (avatarElement && avatarElement.getAttribute('src') !== userInfo.avatar) {
      avatarElement.src = userInfo.avatar;
      avatarElement.alt = userInfo.nickname;
    }
  });
}
