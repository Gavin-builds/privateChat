export async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error((data && data.error) || `请求失败 (${response.status})`);
  }
  return data;
}

export async function getMessages() {
  const data = await fetchJson('/api/messages');
  return Array.isArray(data) ? data : [];
}

export async function getDefaultAvatars() {
  const data = await fetchJson('/api/default-avatars');
  return Array.isArray(data) ? data : [];
}

export async function getEmojis() {
  const data = await fetchJson('/api/emojis');
  return Array.isArray(data) ? data : [];
}

export async function getRandomNickname() {
  const data = await fetchJson('/api/random-nickname');
  return data.nickname || '匿名用户';
}

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);
  return fetchJson('/api/upload-avatar', {
    method: 'POST',
    body: formData
  });
}

export async function uploadImage(file, senderId) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('senderId', senderId);
  return fetchJson('/api/upload', {
    method: 'POST',
    body: formData
  });
}
