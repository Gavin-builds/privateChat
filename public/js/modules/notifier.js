export class ChatNotifier {
  constructor({ chatArea, inputArea, onOpen }) {
    this.count = 0;

    this.element = document.createElement('div');
    this.element.className = 'new-message-notification';
    this.element.innerHTML = `
      <span class="mono">NEW</span>
      <span>有新消息</span>
      <span class="notification-count">0</span>
    `;

    this.countElement = this.element.querySelector('.notification-count');
    this.element.addEventListener('click', () => {
      this.hide();
      onOpen?.();
    });

    chatArea.insertBefore(this.element, inputArea);
  }

  show() {
    this.count += 1;
    this.countElement.textContent = this.count;
    this.element.classList.add('show');
  }

  hide() {
    this.count = 0;
    this.countElement.textContent = '0';
    this.element.classList.remove('show');
  }

  playSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.type = 'sine';
      oscillator.frequency.value = 760;
      gain.gain.setValueAtTime(0.06, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.12);
    } catch (error) {
      // 忽略音频错误
    }
  }
}
