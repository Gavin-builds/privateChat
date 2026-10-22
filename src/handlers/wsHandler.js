const { send } = require('../utils/ws');
const { getWsClientIp, generateDeviceId } = require('../utils/ip');
const { getDefaultAvatars } = require('../utils/avatars');
const { createId } = require('../utils/id');

/**
 * WebSocket 接入层：解析客户端事件，调用管理器与服务。
 */
function attachWsHandler({ wss, userManager, messaging, config }) {
  wss.on('connection', (ws, req) => {
    const clientIp = getWsClientIp(ws);
    let deviceId = 'default';
    let currentUser = null;

    ws.on('message', (raw) => {
      let data;
      try {
        data = JSON.parse(raw);
      } catch (error) {
        return;
      }

      if (data.deviceInfo) {
        deviceId = generateDeviceId(data.deviceInfo);
        const saved = userManager.getUser(clientIp, deviceId);

        if (saved) {
          const updated = userManager.saveUser(clientIp, deviceId, {
            ...saved,
            deviceInfo: data.deviceInfo
          });
          currentUser = userManager.userOnline(clientIp, ws, updated, deviceId);
          send(ws, {
            type: 'user_info',
            user: { ...updated, senderIp: clientIp, deviceId },
            isNewUser: false
          });
        } else {
          send(ws, {
            type: 'require_setup',
            defaultAvatars: getDefaultAvatars(config.DEFAULT_AVATARS_DIR)
          });
        }
      }

      switch (data.type) {
        case 'setup_user':
          handleSetup(data, clientIp, ws, deviceId);
          break;
        case 'update_profile':
          handleUpdateProfile(data, clientIp, ws, deviceId);
          break;
        case 'send_message':
          handleSendMessage(data, clientIp, ws, deviceId);
          break;
        case 'typing':
          messaging.broadcastTyping(!!data.isTyping, clientIp, deviceId);
          break;
      }

      if (currentUser) userManager.touch(clientIp, deviceId);
    });

    ws.on('close', () => userManager.userOffline(clientIp, deviceId, ws));
    ws.on('error', () => userManager.userOffline(clientIp, deviceId, ws));
  });

  function handleSetup(data, clientIp, ws, deviceId) {
    const nickname = (data.nickname || '').trim().slice(0, config.MAX_NICKNAME_LENGTH) || '匿名用户';
    const avatars = getDefaultAvatars(config.DEFAULT_AVATARS_DIR);
    const avatar = data.avatar || avatars[0] || '/public/default-avatars/agent-01.svg';
    const existing = userManager.getUser(clientIp, deviceId);

    const saved = userManager.saveUser(clientIp, deviceId, {
      ...(existing || {}),
      nickname,
      avatar,
      deviceInfo: data.deviceInfo || existing?.deviceInfo
    });

    userManager.userOnline(clientIp, ws, saved, deviceId);

    send(ws, {
      type: 'user_info',
      user: { ...saved, senderIp: clientIp, deviceId },
      isNewUser: !existing
    });

    if (!existing) {
      messaging.broadcastMessage({
        id: createId(),
        type: 'system',
        content: `欢迎 ${nickname} 加入大厅`,
        timestamp: new Date().toISOString()
      });
    }
  }

  function handleUpdateProfile(data, clientIp, ws, deviceId) {
    const online = userManager.onlineUsers.get(clientIp)?.get(deviceId);
    if (!online) {
      send(ws, { type: 'error', message: '用户未登录' });
      return;
    }

    const updates = {};
    if (data.nickname && String(data.nickname).trim()) {
      updates.nickname = String(data.nickname).trim().slice(0, config.MAX_NICKNAME_LENGTH);
    }
    if (data.avatar) updates.avatar = data.avatar;
    if (!Object.keys(updates).length) return;

    const result = userManager.updateProfile(clientIp, deviceId, updates);
    if (!result.success) {
      send(ws, { type: 'error', message: result.error || '资料更新失败' });
      return;
    }

    send(ws, {
      type: 'profile_updated',
      user: { ...result.newUser, senderIp: clientIp, deviceId }
    });

    if (updates.nickname && updates.nickname !== result.oldNickname) {
      messaging.broadcastMessage({
        id: createId(),
        type: 'system',
        content: `${result.oldNickname || '匿名用户'} 改名为 ${updates.nickname}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  function handleSendMessage(data, clientIp, ws, deviceId) {
    const user = userManager.onlineUsers.get(clientIp)?.get(deviceId);
    if (!user) {
      send(ws, { type: 'error', message: '请先设置昵称和头像' });
      return;
    }

    const content = typeof data.message?.content === 'string'
      ? data.message.content.trim().slice(0, config.MAX_MESSAGE_LENGTH)
      : '';
    if (!content) return;

    const newMessage = {
      id: createId(),
      type: 'text',
      content,
      sender: user.nickname,
      senderId: `${clientIp}-${deviceId}`,
      senderIp: clientIp,
      deviceId,
      avatar: user.avatar,
      deviceType: user.deviceInfo?.deviceType || 'unknown',
      timestamp: new Date().toISOString()
    };

    userManager.markMessageTime(clientIp, deviceId, newMessage.timestamp);
    messaging.broadcastMessage(newMessage);
  }
}

module.exports = attachWsHandler;
