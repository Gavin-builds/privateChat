export class ImageViewer {
  constructor(root) {
    this.root = root;
    this.image = root.querySelector('.full-image');
    this.info = root.querySelector('.image-info');
    this.zoomLevel = 1;
    this.zoomStep = 0.25;

    root.querySelector('.close-btn').addEventListener('click', () => this.hide());
    root.addEventListener('click', (event) => {
      if (event.target === root) this.hide();
    });

    root.querySelector('.zoom-in').addEventListener('click', () => this.zoom(1));
    root.querySelector('.zoom-out').addEventListener('click', () => this.zoom(-1));
    root.querySelector('.zoom-reset').addEventListener('click', () => this.reset());

    this.image.addEventListener('wheel', (event) => {
      event.preventDefault();
      this.zoom(event.deltaY > 0 ? -1 : 1);
    }, { passive: false });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.hide();
    });
  }

  show(url, sender, time) {
    this.image.src = url;
    this.info.textContent = `${sender || '匿名用户'} · ${time || ''}`;
    this.reset();
    this.root.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  hide() {
    this.root.classList.remove('active');
    document.body.style.overflow = '';
  }

  zoom(direction) {
    this.zoomLevel = Math.max(0.5, Math.min(3, this.zoomLevel + direction * this.zoomStep));
    this.image.style.transform = `scale(${this.zoomLevel})`;
  }

  reset() {
    this.zoomLevel = 1;
    this.image.style.transform = 'scale(1)';
  }
}
