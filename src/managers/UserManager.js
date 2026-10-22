const { EventEmitter } = require('events');

/**
 * 用户资料与在线状态管理。
 * 只负责数据，不直接操作 WebSocket；在线列表变化通过事件通知上层。
 */
class UserManager extends EventEmitter {
  constructor({ config, store }) {
    super();
    this.config = config;
    this.store = store;
    this.usersData = store.readJsonFile(config.FILES.users, {});
    this.onlineUsers = new Map(); // ip -> Map<deviceId, user>
    this.migrate();
  }

  migrate() {
    let changed = false;
    for (const [ip, value] of Object.entries(this.usersData)) {
      if (!value || !value.devices) {
        this.usersData[ip] = { devices: { default: value || {} } };
        changed = true;
      }
    }
    if (changed) this.persist();
  }

  persist() {
    this.store.writeJsonFile(this.config.FILES.users, this.usersData);
  }

  notifyOnlineUsers() {
    this.emit('online-users:changed');
  }

  getUser(ip, deviceId) {
    return this.usersData[ip]?.devices?.[deviceId] || null;
  }

  saveUser(ip, deviceId, userInfo) {
    if (!this.usersData[ip]) this.usersData[ip] = { devices: {} };
    this.usersData[ip].devices[deviceId] = {
      ...userInfo,
      deviceId,
      createdAt: userInfo.createdAt || new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    this.persist();
    return this.usersData[ip].devices[deviceId];
  }

  userOnline(ip, ws, userInfo, deviceId) {
    if (!this.onlineUsers.has(ip)) this.onlineUsers.set(ip, new Map());

    const user = {
      ...userInfo,
      ip,
      deviceId,
      ws,
      online: true,
      lastActive: Date.now()
    };

    this.onlineUsers.get(ip).set(deviceId, user);
    this.notifyOnlineUsers();
    return user;
  }

  userOffline(ip, deviceId, ws) {
    const devices = this.onlineUsers.get(ip);
    if (!devices) return;

    const current = devices.get(deviceId);
    if (!current) return;

    // 同一设备重连时，旧连接关闭不能把新连接踢下线
    if (ws && current.ws !== ws) return;

    devices.delete(deviceId);
    if (devices.size === 0) this.onlineUsers.delete(ip);
    this.notifyOnlineUsers();
  }

  touch(ip, deviceId) {
    const user = this.onlineUsers.get(ip)?.get(deviceId);
    if (user) user.lastActive = Date.now();
  }

  updateProfile(ip, deviceId, updates) {
    const saved = this.usersData[ip]?.devices?.[deviceId];
    if (!saved) return { success: false, error: '用户不存在' };

    const oldNickname = saved.nickname;
    this.usersData[ip].devices[deviceId] = {
      ...saved,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.persist();

    const online = this.onlineUsers.get(ip)?.get(deviceId);
    if (online) {
      if (updates.nickname) online.nickname = updates.nickname;
      if (updates.avatar) online.avatar = updates.avatar;
    }
    this.notifyOnlineUsers();

    return {
      success: true,
      oldNickname,
      newUser: this.usersData[ip].devices[deviceId]
    };
  }

  markMessageTime(ip, deviceId, timestamp) {
    const online = this.onlineUsers.get(ip)?.get(deviceId);
    if (online) online.lastMessageTime = timestamp;

    const saved = this.usersData[ip]?.devices?.[deviceId];
    if (saved) {
      saved.lastMessageTime = timestamp;
      this.persist();
    }
  }

  getOnlineUsers() {
    const users = [];
    for (const [ip, devices] of this.onlineUsers) {
      for (const [deviceId, user] of devices) {
        users.push({
          ip,
          deviceId,
          nickname: user.nickname,
          avatar: user.avatar,
          lastActive: user.lastActive,
          lastMessageTime: user.lastMessageTime || null,
          deviceType: user.deviceInfo?.deviceType || 'unknown'
        });
      }
    }
    return users;
  }

  findById(userId) {
    for (const [ip, devices] of this.onlineUsers) {
      for (const [deviceId, user] of devices) {
        if (`${ip}-${deviceId}` === userId) return user;
      }
    }
    return null;
  }
}

module.exports = UserManager;
