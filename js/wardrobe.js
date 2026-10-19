'use strict';

const DEFAULT_APPEARANCE = {
  outfit: 'blade',
  bladeHair: '#d8ccef',
  studentHair: '#1c1a20',
  top: '#f2eef0',
  skirt: '#5d384e',
  socks: '#e7e2d8',
  shoes: '#121117'
};

const WARDROBE_COLORS = {
  hair: {
    label: '发色', en: 'HAIR',
    swatches: ['#1c1a20', '#d8ccef', '#f0c9a8', '#d8859a', '#8bb6d6', '#e8d7a6']
  },
  top: {
    label: '上衣', en: 'BLOUSE',
    swatches: ['#f2eef0', '#e9dfcc', '#c6dce6', '#e7bdc6', '#d2d2d6', '#2d2b36']
  },
  skirt: {
    label: '裙子', en: 'PLAID SKIRT',
    swatches: ['#5d384e', '#2f3d5c', '#3c3a45', '#6c2a36', '#3e5a4a', '#7a5a42']
  },
  socks: {
    label: '袜子', en: 'KNEE SOCKS',
    swatches: ['#1b1923', '#e9e4dc', '#2f3d5c', '#5d384e', '#47424f']
  }
};

class Wardrobe {
  constructor(game) {
    this.game = game;
    this.root = document.getElementById('wardrobeScreen');
    this.panel = this.root.querySelector('.wardrobe-panel');
    this.tabs = [...this.root.querySelectorAll('[data-outfit]')];
    this.controls = document.getElementById('colorControls');
    this.note = document.getElementById('wardrobeNote');
    this.doneBtn = document.getElementById('wardrobeDoneBtn');
    this.resetBtn = document.getElementById('wardrobeResetBtn');
    this.openBtn = document.getElementById('wardrobeBtn');
    this.isOpen = false;
    this.rows = [];
    this.bind();
  }

  static loadAppearance() {
    const fallback = { ...DEFAULT_APPEARANCE };
    try {
      const raw = localStorage.getItem('scarlet-moon-appearance');
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return Wardrobe.sanitize(parsed);
    } catch (e) {
      return fallback;
    }
  }

  static sanitize(input = {}) {
    const out = { ...DEFAULT_APPEARANCE };
    out.outfit = input.outfit === 'student' ? 'student' : 'blade';
    out.bladeHair = normalizeHex(input.bladeHair, DEFAULT_APPEARANCE.bladeHair);
    out.studentHair = normalizeHex(input.studentHair, DEFAULT_APPEARANCE.studentHair);
    out.top = normalizeHex(input.top, DEFAULT_APPEARANCE.top);
    out.skirt = normalizeHex(input.skirt, DEFAULT_APPEARANCE.skirt);
    out.socks = normalizeHex(input.socks, DEFAULT_APPEARANCE.socks);
    out.shoes = normalizeHex(input.shoes, DEFAULT_APPEARANCE.shoes);
    return out;
  }

  save() {
    try {
      localStorage.setItem('scarlet-moon-appearance', JSON.stringify(this.game.appearance));
    } catch (e) {
      // file:// 或隐私模式可能禁用本地存储，不影响本次游戏
    }
  }

  bind() {
    this.openBtn.addEventListener('click', () => {
      this.game.audio.init();
      this.open();
    });
    this.doneBtn.addEventListener('click', () => this.close());
    this.resetBtn.addEventListener('click', () => {
      const outfit = this.game.appearance.outfit;
      this.game.appearance = { ...DEFAULT_APPEARANCE, outfit };
      this.save();
      this.sync();
      this.game.audio.click(500);
    });
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const outfit = tab.dataset.outfit === 'student' ? 'student' : 'blade';
        if (this.game.appearance.outfit === outfit) return;
        this.game.appearance.outfit = outfit;
        this.save();
        this.sync();
        this.game.audio.click(outfit === 'student' ? 660 : 540);
      });
    });
  }

  open() {
    this.isOpen = true;
    this.openBtn.blur();
    this.game.wardrobeOpen = true;
    this.root.hidden = false;
    this.game.ui.title.classList.add('is-wardrobe');
    this.game.hero.dir = -1;
    this.game.hero.x = 925;
    this.sync();
    this.game.audio.click(620);
  }

  close() {
    this.isOpen = false;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    this.game.wardrobeOpen = false;
    this.root.hidden = true;
    this.game.ui.title.classList.remove('is-wardrobe');
    this.game.hero.x = 872;
    this.game.audio.click(480);
  }

  toggle() {
    if (this.isOpen) this.close(); else this.open();
  }

  currentHairKey() {
    return this.game.appearance.outfit === 'student' ? 'studentHair' : 'bladeHair';
  }

  sync() {
    const look = this.game.appearance;
    this.tabs.forEach(tab => {
      tab.classList.toggle('is-active', tab.dataset.outfit === look.outfit);
    });
    this.buildRows();
    if (look.outfit === 'student') {
      this.note.textContent = '短袖衬衫、格子裙、过膝袜与小皮鞋。所有配色都会实时生效。';
    } else {
      this.note.textContent = '余烬剑装使用固定战斗配色；发色会同步应用到当前造型。';
    }
  }

  buildRows() {
    const look = this.game.appearance;
    const isStudent = look.outfit === 'student';
    const entries = isStudent
      ? [
          { key: this.currentHairKey(), type: 'hair' },
          { key: 'top', type: 'top' },
          { key: 'skirt', type: 'skirt' },
          { key: 'socks', type: 'socks' }
        ]
      : [{ key: this.currentHairKey(), type: 'hair' }];

    this.controls.replaceChildren();
    this.rows = [];
    entries.forEach(entry => {
      const config = WARDROBE_COLORS[entry.type];
      const row = document.createElement('div');
      row.className = 'color-row';

      const label = document.createElement('div');
      label.className = 'color-label';
      const labelSpan = document.createElement('span');
      labelSpan.textContent = config.label;
      const labelEn = document.createElement('em');
      labelEn.textContent = config.en;
      label.append(labelSpan, labelEn);

      const swatches = document.createElement('div');
      swatches.className = 'swatches';
      const swatchButtons = [];
      config.swatches.forEach(color => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'swatch';
        btn.style.setProperty('--swatch', color);
        btn.title = color;
        btn.addEventListener('click', () => this.setColor(entry.key, color));
        swatches.append(btn);
        swatchButtons.push({ btn, color });
      });

      const picker = document.createElement('label');
      picker.className = 'color-picker';
      picker.style.setProperty('--current', look[entry.key]);
      const input = document.createElement('input');
      input.type = 'color';
      input.value = look[entry.key];
      input.setAttribute('aria-label', config.label);
      input.addEventListener('input', () => this.setColor(entry.key, input.value));
      picker.append(input);

      row.append(label, swatches, picker);
      this.controls.append(row);
      const updateMarks = () => {
        const current = this.game.appearance[entry.key].toLowerCase();
        swatchButtons.forEach(({ btn, color }) => {
          btn.classList.toggle('is-active', color.toLowerCase() === current);
        });
        picker.style.setProperty('--current', this.game.appearance[entry.key]);
        input.value = this.game.appearance[entry.key];
      };
      this.rows.push({ updateMarks });
      updateMarks();
    });
  }

  setColor(key, color) {
    const value = normalizeHex(color, this.game.appearance[key]);
    if (this.game.appearance[key].toLowerCase() === value) return;
    this.game.appearance[key] = value;
    this.save();
    this.rows.forEach(row => row.updateMarks());
    if (chance(0.3)) this.game.audio.click(780);
  }
}
