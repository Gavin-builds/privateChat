const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('ws');

const config = require('./src/config');
const fileStore = require('./src/utils/fileStore');
const UserManager = require('./src/managers/UserManager');
const createMessageService = require('./src/services/messageService');
const createHttpRouter = require('./src/routes/httpRoutes');
const attachWsHandler = require('./src/handlers/wsHandler');

config.ensureDirectories();

const app = express();
const server = http.createServer(app);
const wss = new Server({ server });

const userManager = new UserManager({ config, store: fileStore });
const messaging = createMessageService({ userManager, config, store: fileStore });

// 用户在线状态变化 → 广播在线列表（数据层不直接接触 WebSocket）
userManager.on('online-users:changed', () => messaging.broadcastOnlineUsers());

app.use(express.json());
app.use('/uploads', express.static(config.UPLOADS_DIR));
app.use('/public', express.static(path.join(config.ROOT, 'public')));
app.use(createHttpRouter({ userManager, messaging, config, store: fileStore }));
app.get('*', (req, res) => {
  res.sendFile(path.join(config.ROOT, 'index.html'));
});

attachWsHandler({ wss, userManager, messaging, config });

server.listen(config.PORT, () => {
  console.log(`聊天服务器运行在 http://localhost:${config.PORT}`);
  console.log('WebSocket 服务已启动');
});
