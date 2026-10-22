import * as api from './api.js';
import { getFallbackAvatars } from './utils.js';

export class AvatarPicker {
  constructor({ mode, container, preview, uploadButton, uploadInput }) {
    this.mode = mode;
    this.container = container;
    this.preview = preview;
    this.uploadInput = uploadInput;

    this.avatars = [];
    this.selectedAvatar = null;
    this.customAvatar = null;

    uploadButton.addEventListener('click', () => uploadInput.click());
  }

  get value() {
    return this.customAvatar || this.selectedAvatar;
  }

  async load(selected = null) {
    let avatars = [];
    try {
      avatars = await api.getDefaultAvatars();
    } catch (error) {
      avatars = [];
    }
    if (!avatars.length) avatars = getFallbackAvatars();

    this.avatars = avatars;
    this.customAvatar = null;
    this.preview.style.display = 'none';
    this.preview.innerHTML = '';

    // 初始模式下默认选中第一个；编辑模式保留当前头像（可能不在预设列表中）
    this.selectedAvatar = this.mode === 'setup' ? (selected || avatars[0]) : selected;

    const optionClass = this.mode === 'setup'
      ? 'avatar-option'
      : 'avatar-option edit-avatar-option';

    this.container.innerHTML = avatars.map((avatar, index) => `
      <div class="${optionClass}" data-avatar="${avatar}" title="头像 ${index + 1}">
        <img src="${avatar}" alt="头像 ${index + 1}">
      </div>
    `).join('');

    this.container.querySelectorAll('.avatar-option').forEach((option) => {
      if (option.dataset.avatar === this.selectedAvatar) option.classList.add('selected');
      option.addEventListener('click', () => this.select(option.dataset.avatar));
    });

    return this.selectedAvatar;
  }

  select(avatar) {
    this.selectedAvatar = avatar;
    this.customAvatar = null;
    this.preview.style.display = 'none';
    this.preview.innerHTML = '';

    this.container.querySelectorAll('.avatar-option').forEach((option) => {
      option.classList.toggle('selected', option.dataset.avatar === avatar);
    });
  }

  async upload(file) {
    if (!file) return null;
    if (file.size > 5 * 1024 * 1024) throw new Error('头像不能超过 5MB');

    const data = await api.uploadAvatar(file);
    this.customAvatar = data.avatar;

    this.preview.innerHTML = `<img src="${data.avatar}" alt="自定义头像">`;
    this.preview.style.display = 'block';

    this.container.querySelectorAll('.avatar-option').forEach((option) => {
      option.classList.remove('selected');
    });

    return this.customAvatar;
  }
}
