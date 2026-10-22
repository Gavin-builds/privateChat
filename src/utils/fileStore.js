const fs = require('fs');
const path = require('path');

function readJsonFile(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf8').trim();
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.error(`读取 ${path.basename(filePath)} 失败:`, error.message);
    return fallback;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
    return true;
  } catch (error) {
    console.error(`写入 ${path.basename(filePath)} 失败:`, error.message);
    return false;
  }
}

module.exports = {
  readJsonFile,
  writeJsonFile
};
