import { escapeHtml } from './utils.js';

export class StatusBar {
  constructor(element) {
    this.element = element;
    this.timer = null;
  }

  show(message, type = 'info') {
    clearTimeout(this.timer);
    this.element.textContent = message;
    this.element.className = `status ${type === 'info' ? '' : type}`.trim();

    if (type !== 'info') {
      this.timer = setTimeout(() => this.clear(), 3200);
    }
  }

  showTyping(name) {
    clearTimeout(this.timer);
    this.element.className = 'status';
    this.element.innerHTML = `<span class="typing-status">${escapeHtml(name || '有人')} 正在输入…</span>`;

    this.timer = setTimeout(() => this.clearTyping(), 3500);
  }

  clearTyping() {
    if (this.element.querySelector('.typing-status')) this.element.textContent = '';
  }

  clear() {
    clearTimeout(this.timer);
    this.element.textContent = '';
    this.element.className = 'status';
  }
}
