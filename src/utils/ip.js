function normalizeIp(ip) {
  if (!ip) return 'unknown';
  if (ip.startsWith('::ffff:')) return ip.slice(7);
  return ip;
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return normalizeIp(forwarded.split(',')[0].trim());
  return normalizeIp(req.socket.remoteAddress);
}

function getWsClientIp(ws) {
  return normalizeIp(ws._socket && ws._socket.remoteAddress);
}

function generateDeviceId(deviceInfo = {}) {
  const model = (deviceInfo.deviceModel || 'unknown').replace(/[^a-zA-Z0-9]/g, '-');
  return `${model}-${deviceInfo.browser || 'unknown'}-${deviceInfo.deviceType || 'desktop'}`;
}

module.exports = {
  normalizeIp,
  getClientIp,
  getWsClientIp,
  generateDeviceId
};
