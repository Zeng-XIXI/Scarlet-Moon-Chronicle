'use strict';

class Input {
  constructor() {
    this.down = new Set();
    this.pressed = new Set();
    this.released = new Set();
    this.paused = false;
    this._keyMap = {
      KeyA: 'left', ArrowLeft: 'left',
      KeyD: 'right', ArrowRight: 'right',
      Space: 'jump',
      Digit1: 'weapon1', Numpad1: 'weapon1',
      Digit2: 'weapon2', Numpad2: 'weapon2',
      ShiftLeft: 'dash', ShiftRight: 'dash', KeyL: 'dash',
      KeyE: 'special',
      KeyR: 'reload',
      Escape: 'pause', KeyP: 'pause',
      Enter: 'confirm',
      KeyM: 'mute'
    };
    this._blocked = new Set(['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);
    this._touchPointers = new Map();
    this.mouse = {
      x: VIEW_W * 0.68,
      y: VIEW_H * 0.42,
      inside: false,
      active: false
    };
    this._bindKeyboard();
    this._bindTouch();
    this._bindMouse();
  }

  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (this._blocked.has(e.code)) e.preventDefault();
      const action = this._keyMap[e.code];
      if (!action) return;
      if (!e.repeat) this.press(action);
      this.down.add(action);
    }, { passive: false });

    window.addEventListener('keyup', (e) => {
      const action = this._keyMap[e.code];
      if (!action) return;
      this.down.delete(action);
      this.released.add(action);
    });

    window.addEventListener('blur', () => this.releaseAll());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.releaseAll();
    });
  }

  _bindTouch() {
    const buttons = document.querySelectorAll('[data-control]');
    buttons.forEach((btn) => {
      const control = btn.dataset.control;
      btn.setAttribute('aria-hidden', 'false');
      const start = (e) => {
        e.preventDefault();
        this._touchPointers.set(e.pointerId, control);
        if (!this.down.has(control)) this.press(control);
        this.down.add(control);
        btn.classList.add('is-active');
      };
      const end = (e) => {
        e.preventDefault();
        const held = this._touchPointers.get(e.pointerId);
        this._touchPointers.delete(e.pointerId);
        if (held === control) {
          const stillHeld = [...this._touchPointers.values()].includes(control);
          if (!stillHeld) this.down.delete(control);
        }
        btn.classList.remove('is-active');
      };
      btn.addEventListener('pointerdown', start);
      btn.addEventListener('pointerup', end);
      btn.addEventListener('pointercancel', end);
      btn.addEventListener('pointerleave', (e) => {
        if (this._touchPointers.has(e.pointerId)) end(e);
      });
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });
    document.addEventListener('contextmenu', (e) => {
      if (e.target && e.target.closest && e.target.closest('#stage')) e.preventDefault();
    });
  }

  _bindMouse() {
    const canvas = document.getElementById('game');
    if (!canvas) return;
    this.canvas = canvas;

    const setPosition = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      this.mouse.x = (e.clientX - rect.left) / rect.width * VIEW_W;
      this.mouse.y = (e.clientY - rect.top) / rect.height * VIEW_H;
      this.mouse.active = true;
      this.mouse.inside = this.mouse.x >= 0 && this.mouse.x <= VIEW_W && this.mouse.y >= 0 && this.mouse.y <= VIEW_H;
    };

    window.addEventListener('mousemove', setPosition, { passive: true });
    canvas.addEventListener('mouseenter', (e) => {
      setPosition(e);
      this.mouse.inside = true;
    });
    canvas.addEventListener('mouseleave', () => {
      this.mouse.inside = false;
    });

    canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0 && e.button !== 2) return;
      setPosition(e);
      e.preventDefault();
      const action = e.button === 0 ? 'attack' : 'guard';
      this.press(action);
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.down.delete('attack');
        this.released.add('attack');
      } else if (e.button === 2) {
        this.down.delete('guard');
        this.released.add('guard');
      }
    });

    window.addEventListener('contextmenu', (e) => {
      if (e.target && e.target.closest && e.target.closest('#stage')) e.preventDefault();
    });
  }

  press(action) {
    if (!this.down.has(action)) this.pressed.add(action);
    this.down.add(action);
  }

  isDown(action) { return this.down.has(action); }

  wasPressed(action) { return this.pressed.has(action); }

  wasReleased(action) { return this.released.has(action); }

  endFrame() {
    this.pressed.clear();
    this.released.clear();
  }

  clearPressed() {
    this.pressed.clear();
    this.released.clear();
  }

  releaseAll() {
    this.down.clear();
    this.pressed.clear();
    this.released.clear();
    this._touchPointers.clear();
    document.querySelectorAll('.touch-btn.is-active').forEach(b => b.classList.remove('is-active'));
  }
}
