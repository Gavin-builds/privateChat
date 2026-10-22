const express = require('express');
const path = require('path');
const multer = require('multer');
const { getDefaultAvatars } = require('../utils/avatars');
const { createId } = require('../utils/id');

/**
 * HTTP 路由层：只处理请求解析与响应，业务动作交给 manager / service。
 */
function createHttpRouter({ userManager, messaging, config, store }) {
  const router = express.Router();

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, file.fieldname === 'avatar' ? config.AVATARS_DIR : config.UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
    }
  });

  const upload = multer({
    storage,
    limits: { fileSize: config.MAX_UPLOAD_SIZE },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('只允许上传图片文件'));
    }
  });

  router.get('/api/messages', (req, res) => {
    res.json(store.readJsonFile(config.FILES.messages, []));
  });

  router.get('/api/online-users', (req, res) => {
    const users = userManager.getOnlineUsers();
    res.json({ users, count: users.length });
  });

  router.get('/api/default-avatars', (req, res) => {
    res.json(getDefaultAvatars(config.DEFAULT_AVATARS_DIR));
  });

  router.get('/api/emojis', (req, res) => {
    res.json(config.EMOJIS);
  });

  router.get('/api/random-nickname', (req, res) => {
    const nicknames = store.readJsonFile(config.FILES.nicknames, config.DEFAULT_NICKNAMES);
    const pool = Array.isArray(nicknames) && nicknames.length ? nicknames : config.DEFAULT_NICKNAMES;
    res.json({ nickname: pool[Math.floor(Math.random() * pool.length)] });
  });

  router.post('/api/upload-avatar', upload.single('avatar'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: '没有上传文件' });
    res.json({ avatar: `/uploads/avatars/${req.file.filename}` });
  });

  router.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: '没有上传文件' });

    const user = userManager.findById(req.body.senderId);
    if (!user) return res.status(401).json({ error: '用户未登录' });

    const newMessage = {
      id: createId(),
      type: 'image',
      content: `/uploads/${req.file.filename}`,
      sender: user.nickname,
      senderId: req.body.senderId,
      senderIp: user.ip,
      deviceId: user.deviceId,
      avatar: user.avatar,
      deviceType: user.deviceInfo?.deviceType || 'unknown',
      timestamp: new Date().toISOString()
    };

    userManager.markMessageTime(user.ip, user.deviceId, newMessage.timestamp);
    messaging.broadcastMessage(newMessage);
    res.json(newMessage);
  });

  // 上传错误统一返回 JSON
  router.use((error, req, res, next) => {
    if (!error) return next();
    res.status(400).json({ error: error.message || '请求处理失败' });
  });

  return router;
}

module.exports = createHttpRouter;
