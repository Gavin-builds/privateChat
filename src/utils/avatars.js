const fs = require('fs');

function getDefaultAvatars(defaultAvatarsDir) {
  try {
    return fs.readdirSync(defaultAvatarsDir)
      .filter((file) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file))
      .sort()
      .map((file) => `/public/default-avatars/${file}`);
  } catch (error) {
    console.error('读取预设头像失败:', error.message);
    return [];
  }
}

module.exports = {
  getDefaultAvatars
};
