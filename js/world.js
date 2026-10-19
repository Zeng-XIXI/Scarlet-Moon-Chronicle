'use strict';

const LEVEL = {
  width: WORLD_W,
  start: { x: 260, y: 600 },
  grounds: [
    { x: -240, y: 600, w: 1560, h: 220 },
    { x: 1460, y: 600, w: 1440, h: 220 },
    { x: 3030, y: 600, w: 1150, h: 220 },
    { x: 4320, y: 600, w: 980, h: 220 },
    { x: 5450, y: 600, w: 2350, h: 220 }
  ],
  platforms: [
    { x: 520, y: 492, w: 190, h: 22 },
    { x: 880, y: 400, w: 135, h: 20 },
    { x: 1170, y: 500, w: 140, h: 22 },
    { x: 1570, y: 500, w: 180, h: 22 },
    { x: 1860, y: 402, w: 150, h: 20 },
    { x: 2160, y: 492, w: 190, h: 22 },
    { x: 2450, y: 386, w: 130, h: 20 },
    { x: 2870, y: 504, w: 100, h: 20 },
    { x: 3230, y: 490, w: 170, h: 22 },
    { x: 3500, y: 396, w: 150, h: 20 },
    { x: 3770, y: 495, w: 150, h: 22 },
    { x: 4050, y: 402, w: 130, h: 20 },
    { x: 4400, y: 494, w: 160, h: 22 },
    { x: 4660, y: 400, w: 130, h: 20 },
    { x: 4890, y: 488, w: 170, h: 22 },
    { x: 5160, y: 394, w: 130, h: 20 },
    { x: 5350, y: 520, w: 100, h: 18 },
    { x: 5630, y: 464, w: 200, h: 22 },
    { x: 5900, y: 376, w: 140, h: 20 },
    { x: 6140, y: 468, w: 160, h: 22 },
    { x: 6610, y: 418, w: 160, h: 20 },
    { x: 7230, y: 450, w: 160, h: 20 }
  ],
  checkpoints: [
    { x: 2750, y: 600, id: 0 },
    { x: 5580, y: 600, id: 1 }
  ],
  echoes: [
    { x: 950, y: 350, id: 0 },
    { x: 2300, y: 440, id: 1 },
    { x: 4115, y: 350, id: 2 },
    { x: 5970, y: 326, id: 3 },
    { x: 6670, y: 366, id: 4 }
  ],
  pickups: [
    { type: 'health', x: 1610, y: 455 },
    { type: 'energy', x: 3545, y: 350 },
    { type: 'health', x: 4935, y: 442 },
    { type: 'energy', x: 6185, y: 422 },
    { type: 'health', x: 6500, y: 548 },
    { type: 'energy', x: 7295, y: 404 }
  ],
  enemies: [
    { type: 'stalker', x: 800, y: 578, minX: 360, maxX: 1250 },
    { type: 'shade', x: 1130, y: 404, baseY: 404 },
    { type: 'stalker', x: 1740, y: 578, minX: 1500, maxX: 2550 },
    { type: 'shade', x: 2040, y: 386, baseY: 386 },
    { type: 'sentinel', x: 2260, y: 448 },
    { type: 'stalker', x: 2670, y: 578, minX: 2430, maxX: 2870 },
    { type: 'shade', x: 3260, y: 402, baseY: 402 },
    { type: 'stalker', x: 3565, y: 578, minX: 3180, maxX: 3880 },
    { type: 'sentinel', x: 3815, y: 451 },
    { type: 'shade', x: 4060, y: 352, baseY: 352 },
    { type: 'stalker', x: 4510, y: 578, minX: 4350, maxX: 5120 },
    { type: 'shade', x: 4810, y: 354, baseY: 354 },
    { type: 'sentinel', x: 5220, y: 444 },
    { type: 'stalker', x: 5545, y: 578, minX: 5480, maxX: 5870 },
    { type: 'shade', x: 5940, y: 326, baseY: 326 },
    { type: 'sentinel', x: 6210, y: 424 },
    { type: 'stalker', x: 6260, y: 578, minX: 6100, maxX: 6360 }
  ],
  chapters: [
    { at: 0, no: '第一幕', title: '余烬长街', sub: 'THE ASHEN APPROACH' },
    { at: 2980, no: '第二幕', title: '赤月回廊', sub: 'THE CRIMSON CAUSEWAY' },
    { at: 5920, no: '终幕', title: '无相圣所', sub: 'SANCTUM OF THE FACELESS' }
  ],
  echoesText: [
    '城门陷落那夜，月亮变成了红色。',
    '守门人说，圣所里封存的不是怪物，是这座城的悔恨。',
    '如果剑斩不断命运，就用子弹打碎它。',
    '绯，别回头。',
    '在长夜尽头，有人一直等你。'
  ],
  arena: {
    trigger: 6510,
    left: 6360,
    right: 7430,
    bossX: 6990,
    bossY: 515,
    groundY: 600
  }
};

class WorldRenderer {
  constructor() {
    this.buildSky();
    this.buildCity();
    this.buildDecor();
    this.buildAmbient();
  }

  buildSky() {
    this.stars = [];
    const r = seeded(9182);
    for (let i = 0; i < 150; i++) {
      this.stars.push({
        x: r() * 2400 - 400,
        y: 18 + r() * 360,
        s: 0.5 + r() * 1.7,
        p: r() * TAU,
        a: 0.25 + r() * 0.6
      });
    }
    this.clouds = [];
    for (let i = 0; i < 7; i++) {
      this.clouds.push({
        x: r() * 3100 - 400,
        y: 130 + r() * 240,
        s: 0.7 + r() * 1.5,
        speed: 2 + r() * 5,
        a: 0.05 + r() * 0.1,
        p: r() * TAU
      });
    }
    this.islands = [];
    for (let i = 0; i < 7; i++) {
      this.islands.push({
        x: r() * 3300 - 300,
        y: 235 + r() * 240,
        s: 0.5 + r() * 1.2,
        flip: r() > 0.5
      });
    }
  }

  buildCity() {
    const r = seeded(48151);
    this.farTowers = [];
    for (let i = 0; i < 52; i++) {
      const w = 40 + r() * 130;
      const h = 70 + r() * 280;
      const tower = {
        x: -250 + i * 78 + r() * 70,
        w,
        h,
        base: 580,
        spire: r() > 0.58,
        broken: r() > 0.5,
        windows: []
      };
      const cols = Math.max(1, Math.floor(w / 24));
      const rows = Math.max(2, Math.floor(h / 36));
      for (let c = 0; c < cols; c++) {
        for (let row = 0; row < rows; row++) {
          if (r() > 0.76) {
            tower.windows.push({
              x: 9 + c * (w - 16) / cols,
              y: 18 + row * (h - 30) / rows,
              a: 0.18 + r() * 0.55,
              warm: r() > 0.44,
              w: 2 + r() * 4,
              h: 3 + r() * 7
            });
          }
        }
      }
      this.farTowers.push(tower);
    }

    this.midTowers = [];
    for (let i = 0; i < 32; i++) {
      const w = 70 + r() * 190;
      const h = 100 + r() * 330;
      this.midTowers.push({
        x: -350 + i * 154 + r() * 100,
        w,
        h,
        base: 650,
        broken: r() > 0.46,
        spire: r() > 0.7,
        side: r() > 0.5,
        windows: Array.from({ length: Math.floor(r() * 5) }, () => ({
          x: 12 + r() * (w - 30),
          y: 30 + r() * Math.max(20, h - 80),
          w: 3 + r() * 4,
          h: 8 + r() * 16,
          warm: r() > 0.4,
          a: 0.15 + r() * 0.32
        }))
      });
    }

    this.arches = [
      { x: 560, w: 410, h: 330, broken: 0.34 },
      { x: 2200, w: 470, h: 390, broken: 0.5 },
      { x: 4320, w: 420, h: 350, broken: 0.24 },
      { x: 6020, w: 520, h: 430, broken: 0.58 }
    ];
    this.banners = [
      { x: 740, y: 250, h: 130, w: 44, hue: 'red' },
      { x: 2410, y: 218, h: 160, w: 52, hue: 'red' },
      { x: 4470, y: 270, h: 120, w: 38, hue: 'dark' },
      { x: 6250, y: 190, h: 190, w: 60, hue: 'red' }
    ];
  }

  buildDecor() {
    this.props = [
      { type: 'pillar', x: 360, h: 146, w: 46 },
      { type: 'lantern', x: 660, y: 600, h: 118 },
      { type: 'pillar', x: 1270, h: 190, w: 52, broken: true },
      { type: 'brazier', x: 1468, y: 600 },
      { type: 'pillar', x: 1830, h: 170, w: 42 },
      { type: 'statue', x: 2090, y: 600, scale: 1 },
      { type: 'lantern', x: 2585, y: 600, h: 96 },
      { type: 'torii', x: 3060, y: 600, scale: 1.15 },
      { type: 'pillar', x: 3310, h: 205, w: 50, broken: true },
      { type: 'bannerPost', x: 3660, y: 600, scale: 0.9 },
      { type: 'brazier', x: 4300, y: 600 },
      { type: 'statue', x: 4630, y: 600, scale: 0.92, broken: true },
      { type: 'pillar', x: 5050, h: 226, w: 48 },
      { type: 'lantern', x: 5210, y: 600, h: 120 },
      { type: 'brazier', x: 5405, y: 600 },
      { type: 'torii', x: 5770, y: 600, scale: 0.78, broken: true },
      { type: 'pillar', x: 6110, h: 180, w: 42, broken: true },
      { type: 'brazier', x: 6330, y: 600 },
      { type: 'gate', x: 6630, y: 600 },
      { type: 'brazier', x: 7380, y: 600 },
      { type: 'pillar', x: 7460, h: 250, w: 55, broken: true }
    ];
  }

  buildAmbient() {
    const r = seeded(773);
    this.motes = [];
    for (let i = 0; i < 42; i++) {
      this.motes.push({
        x: r() * 1480,
        y: r() * 660,
        s: 0.6 + r() * 2.4,
        speed: 5 + r() * 14,
        drift: 6 + r() * 22,
        phase: r() * TAU,
        kind: r() > 0.64 ? 'petal' : 'dust',
        alpha: 0.16 + r() * 0.45
      });
    }
    this.fgGrass = [];
    for (let i = 0; i < 90; i++) {
      this.fgGrass.push({
        x: i * 73 + hash(i * 3) * 50,
        h: 18 + hash(i * 9) * 55,
        lean: -6 + hash(i * 11) * 12,
        a: 0.2 + hash(i + 4) * 0.45
      });
    }
  }

  getZone(cam) {
    if (cam < 2600) return 0;
    if (cam < 5600) return 1;
    return 2;
  }

  draw(ctx, game) {
    const cam = game.camera.x;
    const time = game.time;
    const zone = this.getZone(cam);
    this.drawSky(ctx, cam, time, zone);
    this.drawStars(ctx, cam, time);
    this.drawMoon(ctx, cam, time, zone);
    this.drawClouds(ctx, cam, time);
    this.drawFarCity(ctx, cam, time, zone);
    this.drawIslands(ctx, cam, time);
    this.drawMidCity(ctx, cam, time, zone);
    this.drawArches(ctx, cam, time, zone);
    this.drawHorizonFog(ctx, cam, time, zone);
    this.drawAmbientBack(ctx, cam, time);
  }

  drawSky(ctx, cam, time, zone) {
    let top, mid, low, horizon;
    if (zone === 0) {
      top = '#040713'; mid = '#0d1327'; low = '#302039'; horizon = '#7c4055';
    } else if (zone === 1) {
      top = '#0a050f'; mid = '#1b0916'; low = '#42101f'; horizon = '#9a3948';
    } else {
      top = '#03040b'; mid = '#0d0612'; low = '#280b20'; horizon = '#62303e';
    }
    const t0 = smoothstep(2350, 3000, cam);
    const t1 = smoothstep(5350, 5950, cam);
    let c1 = top, c2 = mid, c3 = low, c4 = horizon;
    if (t0 > 0) {
      c1 = mixHex('#040713', '#0a050f', t0);
      c2 = mixHex('#0d1327', '#1b0916', t0);
      c3 = mixHex('#302039', '#42101f', t0);
      c4 = mixHex('#7c4055', '#9a3948', t0);
    }
    if (t1 > 0) {
      c1 = mixHex(t0 > 0 ? '#0a050f' : '#040713', '#03040b', t1);
      c2 = mixHex(t0 > 0 ? '#1b0916' : '#0d1327', '#0d0612', t1);
      c3 = mixHex(t0 > 0 ? '#42101f' : '#302039', '#280b20', t1);
      c4 = mixHex(t0 > 0 ? '#9a3948' : '#7c4055', '#62303e', t1);
    }
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, c1);
    g.addColorStop(0.44, c2);
    g.addColorStop(0.76, c3);
    g.addColorStop(1, c4);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    // 高空薄雾与极光
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const aurora = ctx.createLinearGradient(0, 110, VIEW_W, 350);
    aurora.addColorStop(0, 'rgba(62, 118, 136, 0)');
    aurora.addColorStop(0.45, zone === 0 ? 'rgba(62, 138, 146, 0.055)' : 'rgba(135, 38, 78, 0.06)');
    aurora.addColorStop(1, 'rgba(62, 118, 136, 0)');
    ctx.fillStyle = aurora;
    ctx.beginPath();
    ctx.moveTo(-100, 180);
    ctx.bezierCurveTo(320, 40, 620, 310, 1420, 100);
    ctx.lineTo(1420, 260);
    ctx.bezierCurveTo(700, 420, 300, 180, -100, 310);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawStars(ctx, cam, time) {
    const shift = cam * 0.012;
    ctx.save();
    for (const s of this.stars) {
      let x = s.x - shift;
      if (x < -30 || x > VIEW_W + 30) continue;
      const tw = 0.55 + Math.sin(time * 1.2 + s.p) * 0.4;
      ctx.globalAlpha = s.a * tw;
      ctx.fillStyle = '#dbe7f5';
      ctx.beginPath();
      ctx.arc(x, s.y, s.s * 0.72, 0, TAU);
      ctx.fill();
      if (s.s > 1.8) {
        ctx.globalAlpha *= 0.4;
        ctx.fillRect(x - 3.5, s.y - 0.4, 7, 0.8);
        ctx.fillRect(x - 0.4, s.y - 3.5, 0.8, 7);
      }
    }
    ctx.restore();
  }

  drawMoon(ctx, cam, time, zone) {
    const x = 1042 - cam * 0.017;
    const y = 152;
    const r = 92;
    const pulse = 1 + Math.sin(time * 0.6) * 0.01;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    drawGlow(ctx, x, y, r * 3.8, zone === 0 ? '#e35d75' : '#ee5d76', 0.15);
    drawGlow(ctx, x, y, r * 2.1, '#ff8a94', 0.14);
    ctx.restore();

    const halo = ctx.createRadialGradient(x, y, r * 0.72, x, y, r * 2.25);
    halo.addColorStop(0, 'rgba(240, 142, 148, 0.14)');
    halo.addColorStop(0.45, 'rgba(188, 56, 84, 0.08)');
    halo.addColorStop(1, 'rgba(142, 30, 57, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.25, 0, TAU);
    ctx.fill();

    const moon = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    moon.addColorStop(0, '#ffd6c8');
    moon.addColorStop(0.3, '#ff9b9d');
    moon.addColorStop(0.7, '#db526d');
    moon.addColorStop(1, '#8e254a');
    ctx.fillStyle = moon;
    ctx.beginPath();
    ctx.arc(x, y, r * pulse, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r * pulse, 0, TAU);
    ctx.clip();
    ctx.fillStyle = 'rgba(105, 21, 54, 0.19)';
    const craters = [
      [-32, -12, 24, 17], [27, -33, 18, 12], [40, 28, 25, 18],
      [-14, 41, 16, 12], [8, 5, 40, 26], [-55, 38, 12, 8]
    ];
    for (const c of craters) {
      ctx.beginPath();
      ctx.ellipse(x + c[0], y + c[1], c[2], c[3], 0.6, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255, 192, 176, 0.17)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x - 5, y, r * 0.78, -0.8, 2.2);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = 'rgba(255, 191, 174, 0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, r + 13, Math.PI * 0.92, Math.PI * 1.78);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r + 24, Math.PI * 1.14, Math.PI * 1.55);
    ctx.stroke();
  }

  drawClouds(ctx, cam, time) {
    ctx.save();
    for (const c of this.clouds) {
      const w = 280 * c.s;
      let x = c.x - cam * 0.045 + Math.sin(time * 0.025 + c.p) * 30;
      x = ((x + 600) % 2400 + 2400) % 2400 - 600;
      if (x < -w * 2 || x > VIEW_W + w) continue;
      const y = c.y;
      ctx.globalAlpha = c.a;
      for (let i = 0; i < 4; i++) {
        const px = x + i * w * 0.28;
        const py = y + Math.sin(i * 2.1 + c.p) * 12;
        const rr = w * (0.22 + hash(i + c.p) * 0.16);
        const g = ctx.createRadialGradient(px, py, 0, px, py, rr);
        g.addColorStop(0, 'rgba(201, 166, 190, 0.58)');
        g.addColorStop(0.55, 'rgba(138, 104, 139, 0.18)');
        g.addColorStop(1, 'rgba(80, 60, 100, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(px, py, rr, rr * 0.36, -0.06, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawFarCity(ctx, cam, time, zone) {
    const shift = cam * 0.17;
    const base = 585;
    ctx.save();
    for (const t of this.farTowers) {
      const x = t.x - shift;
      if (x + t.w < -100 || x > VIEW_W + 100) continue;
      const top = t.base - t.h;
      ctx.fillStyle = zone === 2 ? 'rgba(11, 8, 20, 0.93)' : 'rgba(9, 11, 25, 0.9)';
      ctx.beginPath();
      ctx.moveTo(x, base);
      ctx.lineTo(x, top + (t.broken ? t.h * 0.12 : 0));
      if (t.broken) {
        ctx.lineTo(x + t.w * 0.28, top + t.h * 0.06);
        ctx.lineTo(x + t.w * 0.46, top + t.h * 0.17);
        ctx.lineTo(x + t.w * 0.7, top + 2);
        ctx.lineTo(x + t.w * 0.79, top + t.h * 0.1);
        ctx.lineTo(x + t.w, top + t.h * 0.02);
      } else {
        ctx.lineTo(x + t.w * 0.5, top);
        ctx.lineTo(x + t.w, top + t.h * 0.03);
      }
      ctx.lineTo(x + t.w, base);
      ctx.closePath();
      ctx.fill();

      if (t.spire && !t.broken) {
        ctx.strokeStyle = 'rgba(10, 12, 24, 0.9)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x + t.w * 0.5, top);
        ctx.lineTo(x + t.w * 0.5, top - 30 - t.w * 0.18);
        ctx.stroke();
      }

      for (const w of t.windows) {
        ctx.globalAlpha = w.a * (0.7 + Math.sin(time * 0.6 + w.x) * 0.2);
        ctx.fillStyle = w.warm ? '#b3765c' : '#51858c';
        ctx.fillRect(x + w.x, top + w.y + 8, w.w, w.h);
      }
      ctx.globalAlpha = 1;
    }

    // 悬浮的远城桥梁
    ctx.strokeStyle = 'rgba(10, 12, 24, 0.6)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const x = 260 + i * 770 - shift;
      if (x < -400 || x > VIEW_W + 400) continue;
      ctx.beginPath();
      ctx.moveTo(x, 430 + i * 24);
      ctx.bezierCurveTo(x + 120, 400 + i * 20, x + 220, 455 + i * 30, x + 360, 420 + i * 18);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawIslands(ctx, cam, time) {
    const shift = cam * 0.24;
    ctx.save();
    for (const is of this.islands) {
      let x = is.x - shift + Math.sin(time * 0.08 + is.s) * 5;
      if (x < -250 || x > VIEW_W + 250) continue;
      ctx.save();
      ctx.translate(x, is.y + Math.sin(time * 0.18 + is.x) * 4);
      ctx.scale(is.flip ? -is.s : is.s, is.s);
      ctx.fillStyle = 'rgba(13, 12, 24, 0.8)';
      ctx.beginPath();
      ctx.moveTo(-70, 0);
      ctx.lineTo(76, -2);
      ctx.lineTo(48, 17);
      ctx.lineTo(18, 21);
      ctx.lineTo(3, 58 + hash(is.x) * 30);
      ctx.lineTo(-18, 25);
      ctx.lineTo(-52, 17);
      ctx.closePath();
      ctx.fill();
      // 废墟残柱
      ctx.fillStyle = 'rgba(19, 17, 30, 0.9)';
      ctx.fillRect(-30, -45, 10, 45);
      ctx.fillRect(20, -28, 8, 28);
      ctx.fillRect(-34, -50, 19, 6);
      ctx.fillStyle = 'rgba(113, 208, 203, 0.1)';
      ctx.fillRect(-31, -41, 2, 26);
      ctx.strokeStyle = 'rgba(8, 8, 17, 0.45)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-22 + i * 18, 17);
        ctx.quadraticCurveTo(-26 + i * 16, 45, -17 + i * 18, 70 + i * 18);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  drawMidCity(ctx, cam, time, zone) {
    const shift = cam * 0.42;
    const base = 690;
    ctx.save();
    for (const t of this.midTowers) {
      const x = t.x - shift;
      if (x + t.w < -180 || x > VIEW_W + 180) continue;
      const top = t.base - t.h;
      const dark = zone === 2 ? '#0b0715' : '#0c0919';
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(x, base);
      ctx.lineTo(x + (t.broken ? 3 : 0), top + t.h * 0.1);
      if (t.broken) {
        ctx.lineTo(x + t.w * 0.2, top + t.h * 0.03);
        ctx.lineTo(x + t.w * 0.36, top + t.h * 0.14);
        ctx.lineTo(x + t.w * 0.53, top);
        ctx.lineTo(x + t.w * 0.7, top + t.h * 0.11);
        ctx.lineTo(x + t.w * 0.86, top + t.h * 0.04);
        ctx.lineTo(x + t.w, top + t.h * 0.13);
      } else {
        ctx.lineTo(x + t.w * 0.4, top);
        ctx.lineTo(x + t.w * 0.5, top - 18);
        ctx.lineTo(x + t.w * 0.6, top);
        ctx.lineTo(x + t.w, top + t.h * 0.04);
      }
      ctx.lineTo(x + t.w, base);
      ctx.closePath();
      ctx.fill();

      for (const w of t.windows) {
        ctx.globalAlpha = w.a;
        ctx.fillStyle = w.warm ? '#8f554b' : '#326a71';
        ctx.fillRect(x + w.x, top + w.y, w.w, w.h);
      }
      ctx.globalAlpha = 1;

      // 边缘冷光
      ctx.strokeStyle = 'rgba(124, 175, 175, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, base);
      ctx.lineTo(x + (t.broken ? 3 : 0), top + t.h * 0.1);
      ctx.stroke();
    }

    // 远处的残破高架
    ctx.strokeStyle = 'rgba(12, 10, 24, 0.8)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-50, 500);
    ctx.bezierCurveTo(230, 470, 410, 532, 660, 490);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(152, 80, 91, 0.08)';
    ctx.beginPath();
    ctx.moveTo(-50, 497);
    ctx.bezierCurveTo(230, 467, 410, 529, 660, 487);
    ctx.stroke();
    ctx.restore();
  }

  drawArches(ctx, cam, time, zone) {
    const shift = cam * 0.74;
    ctx.save();
    for (const a of this.arches) {
      const x = a.x - shift;
      if (x + a.w < -200 || x > VIEW_W + 200) continue;
      const ground = 620;
      const top = ground - a.h;
      const colW = 36;
      const archH = a.h * a.broken;
      ctx.fillStyle = 'rgba(12, 10, 22, 0.88)';
      ctx.beginPath();
      ctx.moveTo(x, ground);
      ctx.lineTo(x, top + 50);
      ctx.lineTo(x + colW * 0.4, top + 34);
      ctx.lineTo(x + colW, top + 72);
      ctx.lineTo(x + colW, ground);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + a.w - colW, ground);
      ctx.lineTo(x + a.w - colW, top + 26);
      ctx.lineTo(x + a.w - colW * 0.4, top + 60);
      ctx.lineTo(x + a.w, top + 40);
      ctx.lineTo(x + a.w, ground);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(12, 10, 22, 0.88)';
      ctx.lineWidth = colW;
      ctx.beginPath();
      ctx.moveTo(x + colW / 2, top + 34);
      ctx.bezierCurveTo(x + a.w * 0.28, top - 65, x + a.w * 0.72, top - 65, x + a.w - colW / 2, top + 24);
      ctx.stroke();

      // 内圈冷光
      ctx.strokeStyle = zone === 0 ? 'rgba(108, 190, 188, 0.11)' : 'rgba(212, 88, 108, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + colW / 2 + 1, top + 36);
      ctx.bezierCurveTo(x + a.w * 0.28, top - 59, x + a.w * 0.72, top - 59, x + a.w - colW / 2 - 1, top + 26);
      ctx.stroke();

      // 悬挂符文
      ctx.fillStyle = zone === 0 ? 'rgba(111, 213, 207, 0.16)' : 'rgba(229, 92, 116, 0.18)';
      for (let i = 0; i < 3; i++) {
        const px = x + a.w * 0.28 + i * a.w * 0.18;
        const py = top - 20 + Math.sin(time * 0.8 + i) * 5;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-2, -2, 4, 4);
        ctx.restore();
      }
    }
    ctx.restore();

    const bshift = cam * 0.8;
    for (const b of this.banners) {
      const x = b.x - bshift;
      if (x < -100 || x > VIEW_W + 100) continue;
      const sway = Math.sin(time * 0.7 + b.x) * 5;
      ctx.fillStyle = b.hue === 'red' ? 'rgba(88, 20, 34, 0.58)' : 'rgba(34, 21, 39, 0.6)';
      ctx.beginPath();
      ctx.moveTo(x - b.w / 2, b.y);
      ctx.quadraticCurveTo(x - b.w / 2 + sway, b.y + b.h * 0.52, x - b.w * 0.32 + sway, b.y + b.h);
      ctx.lineTo(x + b.w * 0.32 + sway, b.y + b.h);
      ctx.quadraticCurveTo(x + b.w / 2 + sway * 0.5, b.y + b.h * 0.5, x + b.w / 2, b.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(200, 119, 111, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, b.y + 14);
      ctx.lineTo(x + sway * 0.5, b.y + b.h * 0.84);
      ctx.stroke();
    }
  }

  drawHorizonFog(ctx, cam, time, zone) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 4; i++) {
      const y = 410 + i * 48;
      const x = ((time * (3 + i) + i * 390) % 1900) - 300;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 540);
      const col = zone === 0 ? '73, 149, 148' : '154, 54, 76';
      g.addColorStop(0, `rgba(${col}, ${0.026 + i * 0.009})`);
      g.addColorStop(0.6, `rgba(${col}, 0.012)`);
      g.addColorStop(1, `rgba(${col}, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, 540, 70, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  drawAmbientBack(ctx, cam, time) {
    ctx.save();
    for (const m of this.motes) {
      let x = m.x - (cam * 0.08) % 1480;
      x = ((x + 80) % 1480 + 1480) % 1480 - 80;
      let y = (m.y - time * m.speed + Math.sin(time * 0.35 + m.phase) * m.drift) % 720;
      y = ((y + 720) % 720);
      if (m.kind === 'petal') {
        ctx.globalAlpha = m.alpha * 0.8;
        ctx.fillStyle = '#c95568';
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(time * 0.4 + m.phase);
        ctx.beginPath();
        ctx.ellipse(0, 0, m.s * 1.4, m.s * 0.55, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.globalAlpha = m.alpha * 0.55;
        ctx.fillStyle = '#a6dfe0';
        ctx.beginPath();
        ctx.arc(x, y, m.s * 0.6, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawGround(ctx, cam, time, zone) {
    const accent = zone === 0 ? '#84d8d2' : '#e46b7d';
    // 深渊
    const abyss = ctx.createLinearGradient(0, 590, 0, VIEW_H);
    abyss.addColorStop(0, 'rgba(36, 15, 30, 0.6)');
    abyss.addColorStop(0.38, 'rgba(17, 7, 16, 0.93)');
    abyss.addColorStop(1, 'rgba(3, 3, 8, 1)');
    ctx.fillStyle = abyss;
    ctx.fillRect(0, 590, VIEW_W, 130);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const pitGlow = ctx.createLinearGradient(0, 620, 0, 720);
    pitGlow.addColorStop(0, zone === 0 ? 'rgba(64, 149, 151, 0.06)' : 'rgba(164, 42, 66, 0.08)');
    pitGlow.addColorStop(1, 'rgba(90, 12, 28, 0)');
    ctx.fillStyle = pitGlow;
    ctx.fillRect(0, 620, VIEW_W, 100);
    ctx.restore();

    for (const g of LEVEL.grounds) {
      const x = g.x - cam;
      if (x + g.w < -180 || x > VIEW_W + 180) continue;
      this.drawGroundBlock(ctx, g, x, time, zone, accent);
    }

    for (const p of LEVEL.platforms) {
      const x = p.x - cam;
      if (x + p.w < -120 || x > VIEW_W + 120) continue;
      this.drawPlatform(ctx, p, x, time, zone, accent);
    }
  }

  drawGroundBlock(ctx, g, x, time, zone, accent) {
    const y = g.y;
    const h = 205;
    const baseGrad = ctx.createLinearGradient(0, y, 0, y + h);
    baseGrad.addColorStop(0, zone === 2 ? '#171020' : '#171522');
    baseGrad.addColorStop(0.13, '#0c0c17');
    baseGrad.addColorStop(1, '#05060b');
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.moveTo(x, y + 13);
    ctx.lineTo(x + 9, y + 2);
    ctx.lineTo(x + g.w - 12, y);
    ctx.lineTo(x + g.w, y + 16);
    ctx.lineTo(x + g.w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();

    // 断面
    ctx.fillStyle = 'rgba(9, 9, 16, 0.95)';
    ctx.beginPath();
    ctx.moveTo(x, y + 13);
    for (let i = 0; i < 6; i++) {
      const px = x + 8 + i * (g.w / 6);
      ctx.lineTo(px, y + (i % 2 === 0 ? 2 : 9));
    }
    ctx.lineTo(x + g.w, y + 16);
    ctx.lineTo(x + g.w, y + 30);
    ctx.lineTo(x, y + 34);
    ctx.closePath();
    ctx.fill();

    // 地表边缘
    const edge = ctx.createLinearGradient(0, y - 1, 0, y + 16);
    edge.addColorStop(0, zone === 0 ? 'rgba(111, 180, 178, 0.38)' : 'rgba(190, 92, 106, 0.36)');
    edge.addColorStop(1, 'rgba(56, 38, 58, 0.02)');
    ctx.fillStyle = edge;
    ctx.fillRect(x + 2, y - 1, g.w - 4, 16);

    ctx.strokeStyle = rgba(accent, 0.22);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 0.5);
    ctx.lineTo(x + g.w - 4, y + 0.5);
    ctx.stroke();

    // 石缝与裂纹
    ctx.save();
    ctx.globalAlpha = 0.36;
    for (let i = 0; i < Math.floor(g.w / 58); i++) {
      const px = x + 24 + hash(i * 17 + g.x) * (g.w - 48);
      const py = y + 30 + hash(i * 7 + 3) * 110;
      const len = 14 + hash(i * 13) * 44;
      ctx.strokeStyle = i % 4 === 0 ? rgba(accent, 0.13) : 'rgba(5, 5, 11, 0.8)';
      ctx.lineWidth = i % 4 === 0 ? 0.8 : 1.2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + len * 0.32, py + 8);
      ctx.lineTo(px + len * 0.17, py + 21);
      ctx.lineTo(px + len * 0.5, py + 31);
      ctx.stroke();
    }
    ctx.restore();

    // 砖石线
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = '#b6a7ac';
    ctx.lineWidth = 0.7;
    for (let row = 0; row < 3; row++) {
      const ry = y + 52 + row * 45;
      ctx.beginPath();
      ctx.moveTo(x + 6, ry);
      ctx.lineTo(x + g.w - 6, ry);
      ctx.stroke();
      const offset = row % 2 ? 38 : 0;
      for (let bx = x + 28 + offset; bx < x + g.w - 20; bx += 68) {
        ctx.beginPath();
        ctx.moveTo(bx, ry);
        ctx.lineTo(bx, ry + 22);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 发光草
    const grassSeed = seeded(Math.floor(g.x) + 71);
    for (let i = 0; i < Math.floor(g.w / 19); i++) {
      const px = x + 4 + grassSeed() * (g.w - 8);
      const bh = 5 + grassSeed() * 15;
      const lean = (grassSeed() - 0.5) * 8 + Math.sin(time * 1.3 + px * 0.03) * 2.2;
      ctx.strokeStyle = rgba(accent, 0.1 + grassSeed() * 0.23);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(px, y);
      ctx.quadraticCurveTo(px + lean * 0.4, y - bh * 0.55, px + lean, y - bh);
      ctx.stroke();
    }

    // 边缘碎石
    for (let side = 0; side < 2; side++) {
      const ex = side === 0 ? x : x + g.w;
      const dir = side === 0 ? 1 : -1;
      ctx.fillStyle = 'rgba(12, 11, 20, 0.9)';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(ex, y + 20 + i * 15);
        ctx.lineTo(ex + dir * (8 + hash(i + g.x) * 18), y + 29 + i * 16);
        ctx.lineTo(ex, y + 37 + i * 16);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  drawPlatform(ctx, p, x, time, zone, accent) {
    const y = p.y;
    const h = p.h || 20;
    // 吊索
    if (p.w > 120 || hash(p.x) > 0.5) {
      ctx.strokeStyle = 'rgba(9, 8, 17, 0.7)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x + 18, y + h);
      ctx.quadraticCurveTo(x + 16, y + h + 30, x + 24, y + h + 48);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + p.w - 18, y + h);
      ctx.quadraticCurveTo(x + p.w - 15, y + h + 26, x + p.w - 23, y + h + 39);
      ctx.stroke();
    }

    const grad = ctx.createLinearGradient(0, y, 0, y + h + 16);
    grad.addColorStop(0, zone === 2 ? '#211426' : '#1c1a2b');
    grad.addColorStop(1, '#05060c');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x + 4, y);
    ctx.lineTo(x + p.w - 5, y);
    ctx.lineTo(x + p.w, y + h);
    ctx.lineTo(x + p.w - 13, y + h + 9);
    ctx.lineTo(x + 14, y + h + 6);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(accent, 0.32);
    ctx.fillRect(x + 4, y, p.w - 8, 2);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.45;
    const edgeGlow = ctx.createLinearGradient(0, y - 7, 0, y + 8);
    edgeGlow.addColorStop(0, rgba(accent, 0));
    edgeGlow.addColorStop(0.6, rgba(accent, 0.1));
    edgeGlow.addColorStop(1, rgba(accent, 0));
    ctx.fillStyle = edgeGlow;
    ctx.fillRect(x + 2, y - 7, p.w - 4, 15);
    ctx.restore();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(x + 8, y + 3, p.w - 16, 2);
    // 边缘小灯，提示落点
    ctx.fillStyle = rgba(accent, 0.45);
    ctx.fillRect(x + 2, y + h - 2, 5, 1.5);
    ctx.fillRect(x + p.w - 7, y + h - 2, 5, 1.5);

    ctx.strokeStyle = 'rgba(9, 8, 16, 0.75)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 9, y + h + 6);
    ctx.lineTo(x + p.w - 10, y + h + 3);
    ctx.stroke();

    // 悬挂苔藓
    for (let i = 0; i < Math.floor(p.w / 24); i++) {
      const px = x + 15 + hash(i + p.x) * (p.w - 30);
      const len = 4 + hash(i * 5 + p.y) * 14;
      ctx.strokeStyle = rgba(accent, 0.1);
      ctx.beginPath();
      ctx.moveTo(px, y + h + 2);
      ctx.quadraticCurveTo(px + Math.sin(time + i) * 1.5, y + h + len * 0.6, px - 1, y + h + len);
      ctx.stroke();
    }
  }

  drawProps(ctx, cam, time, zone) {
    for (const p of this.props) {
      const x = p.x - cam;
      if (x < -300 || x > VIEW_W + 300) continue;
      switch (p.type) {
        case 'pillar': this.drawPillar(ctx, x, p, time, zone); break;
        case 'lantern': this.drawLantern(ctx, x, p, time, zone); break;
        case 'brazier': this.drawBrazier(ctx, x, p, time, zone); break;
        case 'statue': this.drawStatue(ctx, x, p, time, zone); break;
        case 'torii': this.drawTorii(ctx, x, p, time, zone); break;
        case 'bannerPost': this.drawBannerPost(ctx, x, p, time, zone); break;
        case 'gate': this.drawSanctumGate(ctx, x, p, time, zone); break;
      }
    }
  }

  drawPillar(ctx, x, p, time, zone) {
    const y = 600;
    const w = p.w;
    const h = p.h;
    const top = y - h;
    ctx.save();
    ctx.fillStyle = 'rgba(12, 11, 21, 0.93)';
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.lineTo(x - w / 2 + 4, top + 16);
    ctx.lineTo(x - w / 2 + 11, top);
    if (p.broken) {
      ctx.lineTo(x + 2, top + 10);
      ctx.lineTo(x + w * 0.28, top + 3);
      ctx.lineTo(x + w / 2, top + 22);
    } else {
      ctx.lineTo(x + w / 2 - 6, top + 2);
      ctx.lineTo(x + w / 2, top + 14);
    }
    ctx.lineTo(x + w / 2 - 5, y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(27, 23, 38, 0.7)';
    ctx.fillRect(x - w / 2 - 5, y - 13, w + 10, 13);
    ctx.fillRect(x - w / 2 - 2, top + 25, w + 4, 6);
    ctx.strokeStyle = zone === 0 ? 'rgba(105, 189, 185, 0.11)' : 'rgba(203, 88, 107, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + 6, top + 34);
    ctx.lineTo(x - w / 2 + 2, y - 18);
    ctx.stroke();
    // 悬挂的布条
    ctx.fillStyle = 'rgba(92, 27, 43, 0.32)';
    const sway = Math.sin(time * 0.8 + x) * 3;
    ctx.beginPath();
    ctx.moveTo(x - 12, top + 38);
    ctx.quadraticCurveTo(x - 20 + sway, top + 80, x - 11 + sway, top + 112);
    ctx.lineTo(x + 2 + sway, top + 104);
    ctx.quadraticCurveTo(x - 2, top + 68, x - 2, top + 40);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawLantern(ctx, x, p, time, zone) {
    const y = p.y;
    const top = y - p.h;
    const sway = Math.sin(time * 0.7 + p.x * 0.02) * 2.5;
    ctx.save();
    ctx.translate(sway, 0);
    ctx.strokeStyle = 'rgba(18, 15, 28, 0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, top + 26);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, top + 26);
    ctx.lineTo(x - 17, top + 26);
    ctx.stroke();

    const lx = x - 17;
    const ly = top + 26;
    ctx.fillStyle = 'rgba(33, 24, 35, 0.95)';
    ctx.beginPath();
    ctx.moveTo(lx - 10, ly);
    ctx.lineTo(lx + 10, ly);
    ctx.lineTo(lx + 7, ly + 26);
    ctx.lineTo(lx - 7, ly + 26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = zone === 0 ? 'rgba(134, 218, 207, 0.36)' : 'rgba(233, 116, 119, 0.3)';
    ctx.fillRect(lx - 5, ly + 5, 10, 15);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    drawGlow(ctx, lx, ly + 12, 42, zone === 0 ? '#79d7cf' : '#ef7885', 0.12);
    ctx.restore();
    ctx.strokeStyle = 'rgba(11, 9, 18, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lx - 11, ly);
    ctx.lineTo(lx + 11, ly);
    ctx.stroke();
    ctx.restore();
  }

  drawBrazier(ctx, x, p, time, zone) {
    const y = p.y;
    ctx.save();
    ctx.fillStyle = 'rgba(14, 12, 22, 0.96)';
    ctx.beginPath();
    ctx.moveTo(x - 13, y);
    ctx.lineTo(x - 9, y - 38);
    ctx.lineTo(x + 9, y - 38);
    ctx.lineTo(x + 13, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(28, 23, 35, 0.95)';
    ctx.beginPath();
    ctx.ellipse(x, y - 44, 28, 10, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(135, 72, 72, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x, y - 44, 28, 10, 0, 0, TAU);
    ctx.stroke();

    const flicker = 0.82 + Math.sin(time * 8 + p.x) * 0.12 + Math.sin(time * 13) * 0.05;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    drawGlow(ctx, x, y - 59, 76 * flicker, zone === 0 ? '#7fd4cf' : '#f37b79', 0.17);
    drawGlow(ctx, x, y - 58, 25, '#ffd9a0', 0.32);
    ctx.restore();
    ctx.fillStyle = zone === 0 ? 'rgba(151, 236, 220, 0.75)' : 'rgba(255, 167, 123, 0.8)';
    ctx.beginPath();
    ctx.moveTo(x, y - 44);
    ctx.quadraticCurveTo(x - 13, y - 57, x - 3 + Math.sin(time * 4) * 4, y - 78 - flicker * 6);
    ctx.quadraticCurveTo(x + 11, y - 57, x + 3, y - 44);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 242, 202, 0.83)';
    ctx.beginPath();
    ctx.moveTo(x, y - 44);
    ctx.quadraticCurveTo(x - 4, y - 54, x + Math.sin(time * 6) * 2, y - 64);
    ctx.quadraticCurveTo(x + 5, y - 53, x + 2, y - 44);
    ctx.closePath();
    ctx.fill();

    // 火星
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 4; i++) {
      const ph = (time * (0.4 + i * 0.1) + i * 0.29) % 1;
      const px = x + Math.sin(time * 2 + i * 2) * 12 + i * 2;
      const py = y - 58 - ph * 50;
      ctx.globalAlpha = (1 - ph) * 0.5;
      ctx.fillStyle = zone === 0 ? '#9be6df' : '#ff9d79';
      ctx.fillRect(px, py, 1.4, 1.4);
    }
    ctx.restore();
    ctx.restore();
  }

  drawStatue(ctx, x, p, time, zone) {
    const y = p.y;
    const s = p.scale || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = 'rgba(13, 11, 22, 0.92)';
    // 底座
    ctx.fillRect(-38, -24, 76, 24);
    ctx.fillRect(-48, -14, 96, 14);
    // 长袍
    ctx.beginPath();
    ctx.moveTo(-17, -24);
    ctx.lineTo(-25, -140);
    ctx.quadraticCurveTo(-34, -170, -22, -190);
    ctx.lineTo(0, -204);
    ctx.lineTo(22, -190);
    ctx.quadraticCurveTo(34, -170, 25, -140);
    ctx.lineTo(17, -24);
    ctx.closePath();
    ctx.fill();
    // 兜帽
    ctx.beginPath();
    ctx.ellipse(0, -204, 18, 22, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(35, 29, 45, 0.7)';
    ctx.beginPath();
    ctx.moveTo(-16, -204);
    ctx.quadraticCurveTo(0, -232, 16, -204);
    ctx.quadraticCurveTo(4, -214, -16, -204);
    ctx.fill();
    // 手势与剑
    ctx.strokeStyle = 'rgba(13, 11, 22, 0.95)';
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(-18, -166);
    ctx.lineTo(-34, -132);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(18, -166);
    ctx.lineTo(36, -150);
    ctx.lineTo(36, -128);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(47, 37, 53, 0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(36, -128);
    ctx.lineTo(38, -20);
    ctx.stroke();
    ctx.strokeStyle = zone === 0 ? 'rgba(108, 199, 193, 0.08)' : 'rgba(208, 81, 101, 0.09)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-18, -28);
    ctx.lineTo(-19, -142);
    ctx.stroke();
    if (p.broken) {
      ctx.fillStyle = 'rgba(9, 9, 16, 0.96)';
      ctx.beginPath();
      ctx.moveTo(-25, -140);
      ctx.lineTo(-10, -128);
      ctx.lineTo(2, -147);
      ctx.lineTo(-13, -158);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  drawTorii(ctx, x, p, time, zone) {
    const y = p.y;
    const s = p.scale || 1;
    const w = 360 * s;
    const h = 290 * s;
    const top = y - h;
    ctx.save();
    ctx.strokeStyle = 'rgba(15, 11, 21, 0.95)';
    ctx.lineWidth = 18 * s;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.lineTo(x - w / 2 + 8 * s, top + 25 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w / 2 - 8 * s, top + 25 * s);
    ctx.stroke();

    ctx.lineWidth = 13 * s;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 - 30 * s, top + 26 * s);
    ctx.quadraticCurveTo(x, top + 6 * s, x + w / 2 + 30 * s, top + 26 * s);
    ctx.stroke();
    ctx.lineWidth = 7 * s;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 - 15 * s, top + 62 * s);
    ctx.lineTo(x + w / 2 + 15 * s, top + 62 * s);
    ctx.stroke();

    // 金属边缘微光
    ctx.strokeStyle = zone === 0 ? 'rgba(111, 197, 191, 0.13)' : 'rgba(211, 88, 106, 0.15)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + 10 * s, y);
    ctx.lineTo(x - w / 2 + 18 * s, top + 30 * s);
    ctx.stroke();

    // 纸垂
    for (let i = 0; i < 5; i++) {
      const px = x - w * 0.3 + i * w * 0.15;
      const sway = Math.sin(time * 1.1 + i) * 3;
      ctx.strokeStyle = 'rgba(219, 205, 185, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, top + 64 * s);
      ctx.lineTo(px + sway, top + 92 * s);
      ctx.stroke();
      ctx.fillStyle = 'rgba(215, 196, 172, 0.2)';
      ctx.fillRect(px - 2 + sway, top + 92 * s, 4, 9 * s);
    }

    if (p.broken) {
      ctx.fillStyle = 'rgba(7, 7, 13, 0.96)';
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - 27 * s, top + 38 * s);
      ctx.lineTo(x + w / 2 + 4 * s, top + 50 * s);
      ctx.lineTo(x + w / 2 - 2 * s, top + 80 * s);
      ctx.lineTo(x + w / 2 - 33 * s, top + 65 * s);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  drawBannerPost(ctx, x, p, time, zone) {
    const y = p.y;
    const s = p.scale || 1;
    ctx.save();
    ctx.strokeStyle = 'rgba(15, 12, 23, 0.9)';
    ctx.lineWidth = 5 * s;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 230 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - 215 * s);
    ctx.lineTo(x + 80 * s, y - 215 * s);
    ctx.stroke();
    const sway = Math.sin(time * 0.75 + x) * 4;
    ctx.fillStyle = 'rgba(82, 24, 38, 0.4)';
    ctx.beginPath();
    ctx.moveTo(x + 75 * s, y - 214 * s);
    ctx.quadraticCurveTo(x + 80 * s + sway, y - 168 * s, x + 66 * s + sway, y - 120 * s);
    ctx.lineTo(x + 96 * s + sway, y - 126 * s);
    ctx.quadraticCurveTo(x + 98 * s, y - 172 * s, x + 93 * s, y - 214 * s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawSanctumGate(ctx, x, p, time, zone) {
    const y = p.y;
    const top = y - 390;
    ctx.save();
    // 两侧巨柱
    ctx.fillStyle = 'rgba(11, 8, 17, 0.95)';
    ctx.fillRect(x - 280, top, 84, 390);
    ctx.fillRect(x + 196, top, 84, 390);
    ctx.fillStyle = 'rgba(31, 21, 33, 0.8)';
    ctx.fillRect(x - 286, top - 18, 96, 20);
    ctx.fillRect(x + 190, top - 18, 96, 20);
    ctx.fillRect(x - 260, top + 22, 43, 9);
    ctx.fillRect(x + 216, top + 22, 43, 9);

    // 门楣
    ctx.fillStyle = 'rgba(10, 8, 16, 0.96)';
    ctx.beginPath();
    ctx.moveTo(x - 300, top - 18);
    ctx.lineTo(x - 278, top - 72);
    ctx.lineTo(x - 86, top - 92);
    ctx.lineTo(x, top - 118);
    ctx.lineTo(x + 86, top - 92);
    ctx.lineTo(x + 278, top - 72);
    ctx.lineTo(x + 300, top - 18);
    ctx.closePath();
    ctx.fill();

    // 门内幽光
    const g = ctx.createLinearGradient(0, top + 60, 0, y);
    g.addColorStop(0, 'rgba(60, 15, 32, 0.06)');
    g.addColorStop(0.7, 'rgba(109, 25, 46, 0.12)');
    g.addColorStop(1, 'rgba(13, 7, 14, 0.4)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 196, top + 48, 392, y - top - 48);

    // 符文
    ctx.save();
    ctx.globalAlpha = 0.22 + Math.sin(time * 0.7) * 0.05;
    ctx.strokeStyle = '#bd4d63';
    ctx.lineWidth = 1;
    for (let i = 0; i < 7; i++) {
      const px = x - 170 + i * 56;
      const py = top + 86 + Math.sin(i * 2) * 15;
      ctx.beginPath();
      ctx.arc(px, py, 12, 0, TAU);
      ctx.moveTo(px - 8, py);
      ctx.lineTo(px + 8, py);
      ctx.moveTo(px, py - 8);
      ctx.lineTo(px, py + 8);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  }

  drawBossGate(ctx, cam, time, active, dead) {
    if (!active) return;
    const accent = dead ? '#8f9e9c' : '#e35267';
    const sides = [LEVEL.arena.left, LEVEL.arena.right];
    ctx.save();
    for (let s = 0; s < 2; s++) {
      const x = sides[s] - cam;
      if (x < -120 || x > VIEW_W + 120) continue;
      const alpha = dead ? 0.1 : 0.72;
      const g = ctx.createLinearGradient(x - 26, 0, x + 26, 0);
      g.addColorStop(0, rgba(accent, 0));
      g.addColorStop(0.38, rgba(accent, alpha * 0.12));
      g.addColorStop(0.5, rgba(accent, alpha * 0.3));
      g.addColorStop(0.62, rgba(accent, alpha * 0.12));
      g.addColorStop(1, rgba(accent, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - 30, 86, 60, 516);
      // 能量核心线
      ctx.strokeStyle = rgba(accent, alpha * 0.85);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x, 104);
      ctx.lineTo(x + Math.sin(time * 2.2 + s) * 2.5, 594);
      ctx.stroke();

      ctx.strokeStyle = rgba(accent, alpha * 0.55);
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const yy = 130 + i * 78 + Math.sin(time * 2 + i) * 3;
        ctx.beginPath();
        ctx.moveTo(x - 13 - i * 0.5, yy);
        ctx.lineTo(x + 13 + i * 0.5, yy);
        ctx.stroke();
        ctx.save();
        ctx.translate(x, yy);
        ctx.rotate(Math.PI / 4);
        ctx.strokeRect(-3, -3, 6, 6);
        ctx.restore();
      }
      // 上下锚座
      ctx.fillStyle = 'rgba(39, 23, 37, 0.95)';
      ctx.fillRect(x - 18, 78, 36, 16);
      ctx.fillRect(x - 18, 587, 36, 13);
      ctx.strokeStyle = rgba(accent, alpha * 0.6);
      ctx.strokeRect(x - 18.5, 78.5, 35, 15);

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 12; i++) {
        const yy = ((time * 120 + i * 58) % 490) + 104;
        ctx.globalAlpha = 0.25 + (i % 3) * 0.08;
        ctx.fillStyle = accent;
        ctx.fillRect(x + Math.sin(time * 2.6 + i) * 11, yy, 1.3, 13 + (i % 4) * 5);
      }
      drawGlow(ctx, x, 340, 80, accent, dead ? 0.04 : 0.1);
      ctx.restore();
    }
    ctx.restore();
  }

  drawForeground(ctx, cam, time, zone) {
    // 前景草影
    ctx.save();
    for (const g of this.fgGrass) {
      let x = g.x - (cam * 1.06) % 2800;
      x = ((x % 2800) + 2800) % 2800 - 200;
      if (x < -30 || x > VIEW_W + 30) continue;
      const sway = Math.sin(time * 1.1 + g.x * 0.05) * 2;
      ctx.strokeStyle = `rgba(4, 6, 12, ${g.a})`;
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.moveTo(x, 718);
      ctx.quadraticCurveTo(x + g.lean + sway, 718 - g.h * 0.6, x + g.lean * 2.2 + sway, 718 - g.h);
      ctx.stroke();
    }
    ctx.restore();

    // 近景飘尘
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 12; i++) {
      const t = time * (9 + i * 1.1) + i * 97;
      const x = ((t * 1.4 + i * 180) % 1600) - 120;
      const y = 160 + ((Math.sin(t * 0.009 + i) * 0.5 + 0.5) * 400);
      ctx.globalAlpha = 0.08 + (i % 3) * 0.03;
      ctx.fillStyle = i % 4 === 0 ? '#f18a98' : '#c9e3dd';
      ctx.beginPath();
      ctx.arc(x, y, 0.8 + (i % 3) * 0.6, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}
