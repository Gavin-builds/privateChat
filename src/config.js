const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');

const PORT = process.env.PORT || 8601;

const DATA_DIR = path.join(ROOT, 'data');
const UPLOADS_DIR = path.join(ROOT, 'uploads');
const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');
const DEFAULT_AVATARS_DIR = path.join(ROOT, 'public', 'default-avatars');

const FILES = {
  messages: path.join(DATA_DIR, 'messages.json'),
  users: path.join(DATA_DIR, 'users.json'),
  nicknames: path.join(DATA_DIR, 'nicknames.json')
};

const DEFAULT_NICKNAMES = [
  '夜行者', '霓虹旅人', '深空信号', '量子幽灵', '像素游侠', '零号节点', '午夜电波', '数据旅人',
  '电子幽灵', '矩阵过客', '光栅幽灵', '暗巷信使', '虚拟浪人', '缓存猎人', '噪声制造者', '后台进程',
  '匿名信号', '终端访客', '像素使者', '都市漫游者', '星际信使', '代码诗人', '随机噪声', '冷启动',
  '静默频道', '幻影节点', '午夜观察者', '协议旅人', '模拟信号', '电路幽灵', '数字流浪者', '屏幕幽灵',
  '低频电波', '午夜快递', '赛博猫', '数据松鼠', '太空土豆', '未知访客', '临时用户', '迷路电波'
];

const EMOJIS = [
  // 表情
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😋', '😜', '🤪',
  '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤨', '😐', '😶', '😏',
  '🙄', '😬', '😌', '😔', '😪', '😴', '😷', '🤒', '🤕', '🤢',
  '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎',
  '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺',
  '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓',
  '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀',
  '💩', '🤡', '👻', '👽', '🤖',
  // 手势
  '👋', '🤚', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟','💪',
  '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '✊',
  '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', 
  // 爱心
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟',
  // 符号与科技
  '🔥', '✨', '💫', '⚡', '☄️', '💥', '💤', '💦', '💬', '💭',
  '💯', '✅', '❌', '⚠️', '♻️', '📡', '🛰️', '🖥️', '💻', '⌨️',
  '💾', '🔮', '🎮', '🎧', '🎤', '🎲', '🎯', '📷', '📱', '🔋',
  '💡',
  // 动物
  '🐱', '🐶', '🦊', '🐼', '🐯', '🐸', '🐵', '🐧', '🦄', '🐙',
  '🦋', '🐝', '🐢', '🐍', '🌵', '🌲', '🌱', '🍀', '🍁', '🍂',
  // 自然与庆祝
  '🌙', '⭐', '🌟', '🌈', '☀️', '🌊', '🚀', '🛸', '🪐', '🎁',
  '🎈', '🎉', '🎊',
  // 食物
  '🍕', '🍔', '🍟', '🍜', '🍣', '🍩', '🍪', '🎂', '🍰', '🍫',
  '🍿', '☕', '🍺'
];

const MAX_MESSAGES = 1000;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_NICKNAME_LENGTH = 20;
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

function ensureDirectories() {
  [DATA_DIR, UPLOADS_DIR, AVATARS_DIR, DEFAULT_AVATARS_DIR].forEach((dir) => {
    fs.mkdirSync(dir, { recursive: true });
  });
}

module.exports = {
  ROOT,
  PORT,
  DATA_DIR,
  UPLOADS_DIR,
  AVATARS_DIR,
  DEFAULT_AVATARS_DIR,
  FILES,
  DEFAULT_NICKNAMES,
  EMOJIS,
  MAX_MESSAGES,
  MAX_MESSAGE_LENGTH,
  MAX_NICKNAME_LENGTH,
  MAX_UPLOAD_SIZE,
  ensureDirectories
};
