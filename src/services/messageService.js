/**
 * 消息广播与持久化服务。
 */
function createMessageService({ userManager, config, store }) {
  function broadcastMessage(message) {
    const payload = JSON.stringify({ type: 'new_message', message });

    for (const devices of userManager.onlineUsers.values()) {
      for (const user of devices.values()) {
        if (user.ws && user.ws.readyState === 1) user.ws.send(payload);
      }
    }

    if (message.type === 'system') return;

    const messages = store.readJsonFile(config.FILES.messages, []);
    messages.push(message);
    if (messages.length > config.MAX_MESSAGES) {
      messages.splice(0, messages.length - config.MAX_MESSAGES);
    }
    store.writeJsonFile(config.FILES.messages, messages);
  }

  function broadcastOnlineUsers() {
    const users = userManager.getOnlineUsers();
    const payload = JSON.stringify({
      type: 'online_users',
      users,
      count: users.length
    });

    for (const devices of userManager.onlineUsers.values()) {
      for (const user of devices.values()) {
        if (user.ws && user.ws.readyState === 1) user.ws.send(payload);
      }
    }
  }

  function broadcastTyping(isTyping, senderIp, deviceId) {
    const sender = userManager.onlineUsers.get(senderIp)?.get(deviceId);
    if (!sender) return;

    const payload = JSON.stringify({
      type: 'user_typing',
      user: sender.nickname,
      avatar: sender.avatar,
      isTyping
    });

    for (const [ip, devices] of userManager.onlineUsers) {
      for (const [id, user] of devices) {
        if (ip === senderIp && id === deviceId) continue;
        if (user.ws && user.ws.readyState === 1) user.ws.send(payload);
      }
    }
  }

  return {
    broadcastMessage,
    broadcastOnlineUsers,
    broadcastTyping
  };
}

module.exports = createMessageService;
