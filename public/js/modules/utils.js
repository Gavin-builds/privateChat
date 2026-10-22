export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = String(text ?? '');
  return div.innerHTML;
}

export function formatTime(timestamp) {
  const date = new Date(timestamp || Date.now());
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export function formatLastMessageTime(timestamp) {
  if (!timestamp) return '暂无发言';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '暂无发言';

  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return `最后发言 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return `最后发言 ${date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}`;
}

export function getDeviceInfo() {
  const ua = navigator.userAgent;
  let deviceType = 'desktop';
  let browser = 'unknown';
  let deviceModel = 'unknown';

  if (/ipad|tablet/i.test(ua)) deviceType = 'tablet';
  else if (/mobile|iphone|ipod|android/i.test(ua)) deviceType = 'mobile';

  if (/edg\//i.test(ua)) browser = 'edge';
  else if (/chrome|crios/i.test(ua)) browser = 'chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'firefox';
  else if (/safari/i.test(ua)) browser = 'safari';

  if (/android/i.test(ua)) {
    const match = ua.match(/Android\s+[\d.]+;\s+(.*?)\s+Build\//);
    if (match) deviceModel = match[1];
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    const match = ua.match(/\((.*?)\)/);
    if (match) deviceModel = match[1].split(';')[1]?.trim() || 'unknown';
  }

  return {
    userAgent: ua,
    deviceType,
    browser,
    deviceModel,
    timestamp: new Date().toISOString()
  };
}

export function isAtBottom(container) {
  const { scrollTop, scrollHeight, clientHeight } = container;
  return scrollHeight - scrollTop - clientHeight < 12;
}

export function getFallbackAvatars() {
  return Array.from({ length: 8 }, (_, i) => `/public/default-avatars/agent-0${i + 1}.svg`);
}
