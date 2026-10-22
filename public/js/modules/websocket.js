export class ChatSocket {
  constructor({ deviceInfo, onEvent, onClose, onStatus }) {
    this.deviceInfo = deviceInfo;
    this.onEvent = onEvent;
    this.onClose = onClose;
    this.onStatus = onStatus;

    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.closedByUser = false;
  }

  get isOpen() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    try {
      this.ws = new WebSocket(`${protocol}//${window.location.host}`);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.onStatus?.('连接已建立', 'success');
        this.sendDeviceInfo();
      };

      this.ws.onmessage = (event) => {
        try {
          this.onEvent?.(JSON.parse(event.data));
        } catch (error) {
          // 忽略无法解析的帧
        }
      };

      this.ws.onclose = (event) => {
        if (event.code === 1000 || this.closedByUser) return;
        this.onStatus?.('连接断开，正在重连…', 'warning');
        this.onClose?.();
        this.reconnect();
      };

      this.ws.onerror = () => {
        this.onStatus?.('连接错误', 'error');
      };
    } catch (error) {
      this.onStatus?.('连接失败，请刷新页面', 'error');
    }
  }

  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.onStatus?.('重连失败，请刷新页面', 'error');
      return;
    }

    this.reconnectAttempts += 1;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);

    setTimeout(() => {
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) this.connect();
    }, delay);
  }

  send(payload) {
    if (!this.isOpen) return false;
    this.ws.send(JSON.stringify(payload));
    return true;
  }

  sendDeviceInfo() {
    return this.send({ deviceInfo: this.deviceInfo });
  }

  sendSetup({ nickname, avatar }) {
    return this.send({
      type: 'setup_user',
      nickname,
      avatar,
      deviceInfo: this.deviceInfo
    });
  }

  sendProfile({ nickname, avatar }) {
    return this.send({
      type: 'update_profile',
      nickname,
      avatar
    });
  }

  sendMessage(content) {
    return this.send({
      type: 'send_message',
      message: { type: 'text', content }
    });
  }

  sendTyping(isTyping) {
    return this.send({ type: 'typing', isTyping });
  }

  close() {
    this.closedByUser = true;
    this.ws?.close();
  }
}
