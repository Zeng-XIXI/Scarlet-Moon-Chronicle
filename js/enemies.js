'use strict';

class Enemy {
  constructor(game, data) {
    this.game = game;
    this.type = data.type;
    this.data = data;
    this.spawnX = data.x;
    this.spawnY = data.y;
    this.x = data.x;
    this.y = data.y;
    this.dir = -1;
    this.flash = 0;
    this.dead = false;
    this.deathT = 0;
    this.awake = false;
    this.anim = Math.random() * 10;
    this.cool = 1.1 + Math.random();
    this.hitPulse = 0;
    if (this.type === 'stalker') {
      this.maxHp = 72; this.hp = 72; this.w = 68; this.h = 54;
      this.contactDamage = 12;
    } else if (this.type === 'shade') {
      this.maxHp = 54; this.hp = 54; this.w = 48; this.h = 76;
      this.contactDamage = 10;
    } else {
      this.maxHp = 108; this.hp = 108; this.w = 56; this.h = 94;
      this.contactDamage = 14;
    }
    this.scoreValue = 1;
    this.baseY = data.baseY || data.y;
    this.minX = data.minX ?? data.x - 200;
    this.maxX = data.maxX ?? data.x + 200;
    this.lungeT = 0;
    this.lungeDir = -1;
    this.castT = 0;
    this.burstLeft = 0;
    this.burstT = 0;
    this.telegraph = 0;
  }

  get bounds() {
    return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
  }

  reset() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.baseY = this.data.baseY || this.spawnY;
    this.hp = this.maxHp;
    this.dead = false;
    this.deathT = 0;
    this.awake = false;
    this.flash = 0;
    this.cool = 1.2;
    this.lungeT = 0;
    this.castT = 0;
    this.burstLeft = 0;
    this.burstT = 0;
    this.telegraph = 0;
  }

  takeDamage(amount, game, source = 'sword') {
    if (this.dead) return false;
    if (this.type === 'shade' && this.castT > 0.38) {
      // 施法护盾：削减伤害但不完全免疫
      amount = Math.ceil(amount * 0.65);
    }
    this.hp -= amount;
    this.flash = 0.13;
    this.hitPulse = 1;
    this.awake = true;
    const col = this.type === 'shade' ? '#f27b96' : '#f4c48a';
    game.spawnHitSpark(this.x, this.y, col, this.type === 'sentinel' ? 14 : 9);
    game.spawnDamageText(this.x + rand(-9, 9), this.y - this.h * 0.55, amount, 'damage-enemy');
    game.audio.enemyHit();
    if (this.hp <= 0) {
      this.die(game);
      return true;
    }
    return false;
  }

  die(game) {
    if (this.dead) return;
    this.dead = true;
    this.hp = 0;
    this.deathT = 0.8;
    game.onEnemyKilled(this);
    game.spawnBurst(this.x, this.y, this.type === 'shade' ? '#ff7193' : '#ffc479', 24, 300);
    game.spawnBurst(this.x, this.y, '#e8f6ee', 10, 180);
    game.audio.enemyDeath();
    game.addShake(2.5);
  }

  update(dt, game) {
    this.anim += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.hitPulse = Math.max(0, this.hitPulse - dt * 5);
    if (this.dead) {
      this.deathT -= dt;
      return;
    }
    const hero = game.hero;
    const dx = hero.x - this.x;
    const dy = (hero.y - hero.h * 0.5) - this.y;
    const dist = Math.hypot(dx, dy);
    if (!this.awake && Math.abs(dx) < 500 && Math.abs(dy) < 330) {
      this.awake = true;
      game.spawnAlert(this.x, this.y - this.h * 0.65);
    }

    if (this.type === 'stalker') {
      this.updateStalker(dt, game, hero, dx, dist);
    } else if (this.type === 'shade') {
      this.updateShade(dt, game, hero, dx, dy, dist);
    } else if (this.type === 'sentinel') {
      this.updateSentinel(dt, game, hero, dx, dy, dist);
    }

    if (!this.dead && rectsOverlap(this.bounds, hero.bounds)) {
      hero.hurt(this.contactDamage, this.x, game, this);
    }
  }

  updateStalker(dt, game, hero, dx, dist) {
    this.cool = Math.max(0, this.cool - dt);
    if (this.lungeT > 0) {
      this.lungeT -= dt;
      this.x += this.lungeDir * 430 * dt;
      if (chance(0.4)) {
        game.spawnDust(this.x - this.lungeDir * 24, this.y + 20, this.lungeDir);
      }
    } else if (this.awake) {
      this.dir = dx >= 0 ? 1 : -1;
      if (Math.abs(dx) > 78) {
        this.x += this.dir * 132 * dt;
      }
      if (Math.abs(dx) < 128 && this.cool <= 0) {
        this.lungeT = 0.26;
        this.lungeDir = this.dir;
        this.cool = 1.65;
        game.audio.tone(150, 0.15, { type: 'sawtooth', vol: 0.03, slide: 80 });
      }
    } else {
      this.x += Math.sin(this.anim * 0.7) * 4 * dt;
    }
    this.x = clamp(this.x, this.minX, this.maxX);
    this.y = 578;
    this.w = 68;
    this.h = 54;
    this.maxHp = 72;
    this.contactDamage = 12;
  }

  updateShade(dt, game, hero, dx, dy, dist) {
    this.w = 48;
    this.h = 76;
    this.maxHp = 54;
    this.contactDamage = 10;
    if (this.castT > 0) {
      this.castT -= dt;
      if (this.castT <= 0) {
        this.fireOrb(game, hero);
        this.cool = 2.15 + rand(0, 0.8);
      }
    } else {
      this.cool -= dt;
    }

    if (this.awake) {
      this.dir = dx >= 0 ? 1 : -1;
      const desiredX = hero.x - hero.dir * 155 + Math.sin(this.anim * 0.9) * 42;
      const desiredY = clamp(hero.y - 165 + Math.sin(this.anim * 1.3) * 34, 265, 510);
      this.x = damp(this.x, desiredX, 1.5, dt);
      this.y = damp(this.y, desiredY, 1.7, dt);
      if (this.cool <= 0 && this.castT <= 0 && dist < 700) {
        this.castT = 0.58;
      }
    } else {
      this.x = this.spawnX + Math.sin(this.anim * 0.8) * 16;
      this.y = this.baseY + Math.sin(this.anim * 1.5) * 9;
    }
    this.y = clamp(this.y, 250, 520);
  }

  fireOrb(game, hero) {
    const sx = this.x;
    const sy = this.y + 9;
    const tx = hero.x + hero.vx * 0.28;
    const ty = hero.y - 45;
    const angle = Math.atan2(ty - sy, tx - sx);
    game.spawnEnemyBullet(sx, sy, angle, 245, 11, 'orb');
    game.spawnCastFlash(sx, sy, '#ff7894');
    game.audio.tone(520, 0.22, { type: 'triangle', vol: 0.035, slide: -260 });
  }

  updateSentinel(dt, game, hero, dx, dy, dist) {
    this.w = 56;
    this.h = 94;
    this.maxHp = 108;
    this.contactDamage = 14;
    this.dir = dx >= 0 ? 1 : -1;
    this.cool -= dt;
    this.telegraph = Math.max(0, this.telegraph - dt);

    if (this.burstLeft > 0) {
      this.burstT -= dt;
      if (this.burstT <= 0) {
        this.burstT = 0.13;
        this.burstLeft--;
        this.fireBolt(game, hero);
      }
    } else if (this.awake && this.cool <= 0 && dist < 830) {
      this.telegraph = 0.5;
      this.cool = 2.8;
      this.burstLeft = 3;
      this.burstT = 0.52;
      game.audio.tone(190, 0.3, { type: 'sawtooth', vol: 0.025, slide: 240 });
    }
    this.y = this.spawnY + Math.sin(this.anim * 1.8) * 2;
  }

  fireBolt(game, hero) {
    const sx = this.x + this.dir * 20;
    const sy = this.y - 12;
    const tx = hero.x + hero.vx * 0.22;
    const ty = hero.y - 44;
    const angle = Math.atan2(ty - sy, tx - sx) + rand(-0.035, 0.035);
    game.spawnEnemyBullet(sx, sy, angle, 360, 12, 'bolt');
    game.spawnCastFlash(sx, sy, '#ffb477');
    game.audio.noise(0.09, { vol: 0.03, freq: 1300, freqEnd: 500, type: 'bandpass' });
  }

  draw(ctx, cam, time) {
    if (this.dead && this.deathT <= 0) return;
    let alpha = 1;
    let scale = 1;
    if (this.dead) {
      const p = this.deathT / 0.8;
      alpha = p;
      scale = 0.85 + p * 0.3;
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    if (this.type === 'stalker') this.drawStalker(ctx, cam, time, scale);
    else if (this.type === 'shade') this.drawShade(ctx, cam, time, scale);
    else this.drawSentinel(ctx, cam, time, scale);
    ctx.restore();
  }

  drawHealthBar(ctx, x, y, w = 40) {
    if (this.hp >= this.maxHp || this.dead) return;
    const p = clamp(this.hp / this.maxHp, 0, 1);
    ctx.fillStyle = 'rgba(5, 7, 12, 0.72)';
    ctx.fillRect(x - w / 2, y, w, 3);
    ctx.fillStyle = p > 0.4 ? '#d4596f' : '#e39b65';
    ctx.fillRect(x - w / 2, y, w * p, 3);
  }

  drawStalker(ctx, cam, time, scale) {
    const x = this.x - cam;
    const y = this.y;
    ctx.save();
    // 地面阴影
    ctx.fillStyle = 'rgba(4, 5, 10, 0.38)';
    ctx.beginPath();
    ctx.ellipse(x, 600, 34, 6, 0, 0, TAU);
    ctx.fill();

    ctx.translate(x, y);
    ctx.scale(this.dir * scale, scale);
    const flash = this.flash > 0;
    const bodyCol = flash ? '#fff1dc' : '#1a1926';
    const plateCol = flash ? '#fff4e9' : '#2d2938';
    const run = this.awake && this.lungeT <= 0 ? Math.sin(time * 15) * 4 : Math.sin(time * 22) * 7;
    const lunge = this.lungeT > 0;

    // 尾巴
    ctx.strokeStyle = plateCol;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-25, -7);
    ctx.quadraticCurveTo(-40, -16, -49, -3 + Math.sin(time * 7) * 4);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(237, 100, 94, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-44, -11);
    ctx.lineTo(-50, -4);
    ctx.stroke();

    // 后腿与前腿
    const legs = [
      [-17, 8, -22 - (lunge ? 12 : 0), 22],
      [-11, 9, -7 + run * 1.7, 22],
      [15, 8, 20 + (lunge ? 11 : 0), 22],
      [21, 7, 25 - run * 1.7, 22]
    ];
    ctx.strokeStyle = '#12111c';
    ctx.lineWidth = 3.4;
    for (const l of legs) {
      ctx.beginPath();
      ctx.moveTo(l[0], l[1]);
      ctx.quadraticCurveTo(l[0] + (l[2] - l[0]) * 0.25, l[1] + 8, l[2], l[3]);
      ctx.stroke();
      ctx.fillStyle = plateCol;
      ctx.fillRect(l[2] - 4, l[3] - 2, 8, 3);
    }

    // 身体
    ctx.fillStyle = bodyCol;
    ctx.beginPath();
    ctx.ellipse(-2, -3, 27, 15, 0.08, 0, TAU);
    ctx.fill();
    ctx.fillStyle = plateCol;
    ctx.beginPath();
    ctx.moveTo(-25, -8);
    ctx.lineTo(-5, -16);
    ctx.lineTo(17, -10);
    ctx.lineTo(11, 2);
    ctx.lineTo(-16, 5);
    ctx.closePath();
    ctx.fill();
    // 背部晶刺
    ctx.fillStyle = '#4a2637';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-17 + i * 12, -12);
      ctx.lineTo(-13 + i * 12, -25 - i * 2);
      ctx.lineTo(-6 + i * 12, -12);
      ctx.closePath();
      ctx.fill();
    }
    // 头
    ctx.fillStyle = bodyCol;
    ctx.beginPath();
    ctx.moveTo(17, -11);
    ctx.lineTo(37, -8);
    ctx.lineTo(43, 0);
    ctx.lineTo(33, 8);
    ctx.lineTo(18, 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = plateCol;
    ctx.beginPath();
    ctx.moveTo(19, -14);
    ctx.lineTo(37, -12);
    ctx.lineTo(35, -5);
    ctx.lineTo(20, -6);
    ctx.closePath();
    ctx.fill();
    // 角
    ctx.strokeStyle = '#3f3449';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(23, -14);
    ctx.lineTo(19, -25);
    ctx.moveTo(31, -14);
    ctx.lineTo(34, -23);
    ctx.stroke();
    // 红眼
    const eyeA = 0.66 + Math.sin(time * 6) * 0.2;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = eyeA;
    drawGlow(ctx, 33, -2, 14, '#ff5d68', 0.4);
    ctx.fillStyle = '#ff8890';
    ctx.fillRect(28, -3.5, 11, 2.3);
    ctx.restore();
    // 胸口能量
    ctx.fillStyle = 'rgba(220, 72, 91, 0.8)';
    ctx.beginPath();
    ctx.arc(6, 2, 2.4, 0, TAU);
    ctx.fill();
    // 警示
    if (this.awake && !this.dead) {
      ctx.globalAlpha = 0.3 + Math.sin(time * 6) * 0.15;
      ctx.strokeStyle = '#c94c62';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(30, -2, 23, -0.7, 0.7);
      ctx.stroke();
    }
    ctx.restore();
    this.drawHealthBar(ctx, x, y - 43, 54);
  }

  drawShade(ctx, cam, time, scale) {
    const x = this.x - cam;
    const y = this.y;
    const flash = this.flash > 0;
    ctx.save();
    // 影
    ctx.fillStyle = 'rgba(4, 5, 10, 0.2)';
    ctx.beginPath();
    ctx.ellipse(x, Math.min(600, y + 90), 22, 4, 0, 0, TAU);
    ctx.fill();

    // 施法光环
    if (this.castT > 0) {
      const p = 1 - this.castT / 0.58;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.18 + p * 0.45;
      ctx.strokeStyle = '#ff7191';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(x, y + 4, 18 + p * 25, 0, TAU);
      ctx.stroke();
      drawGlow(ctx, x, y + 4, 44, '#ff5576', 0.18);
      ctx.restore();
    }

    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const sway = Math.sin(time * 2.2 + this.anim) * 4;
    // 披风
    ctx.fillStyle = flash ? 'rgba(255, 244, 234, 0.9)' : 'rgba(29, 18, 36, 0.94)';
    ctx.beginPath();
    ctx.moveTo(-3, -34);
    ctx.quadraticCurveTo(-30, -28, -31 + sway, 10);
    ctx.quadraticCurveTo(-19, 22, -14 + sway * 0.4, 39);
    ctx.lineTo(-3, 31);
    ctx.quadraticCurveTo(2, 42, 9 + sway * 0.3, 35);
    ctx.quadraticCurveTo(24, 27, 25 + sway * 0.4, 7);
    ctx.quadraticCurveTo(22, -28, 2, -34);
    ctx.closePath();
    ctx.fill();
    // 碎边
    ctx.fillStyle = flash ? 'rgba(255, 235, 224, 0.75)' : 'rgba(17, 11, 24, 0.95)';
    for (let i = 0; i < 5; i++) {
      const px = -25 + i * 12 + sway * 0.4;
      ctx.beginPath();
      ctx.moveTo(px, 20);
      ctx.lineTo(px + 4 + Math.sin(time * 3 + i) * 2, 44 + i % 2 * 8);
      ctx.lineTo(px + 9, 25);
      ctx.closePath();
      ctx.fill();
    }
    // 兜帽
    ctx.fillStyle = flash ? '#fff2e7' : '#2b1c35';
    ctx.beginPath();
    ctx.ellipse(0, -33, 18, 23, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(7, 5, 12, 0.96)';
    ctx.beginPath();
    ctx.ellipse(2, -31, 12, 16, 0, 0, TAU);
    ctx.fill();
    // 红眼
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const blink = 0.75 + Math.sin(time * 5 + this.anim) * 0.18;
    ctx.globalAlpha = blink;
    drawGlow(ctx, 4, -31, 18, '#ff4c6c', 0.4);
    ctx.fillStyle = '#ff9aa4';
    ctx.beginPath();
    ctx.ellipse(4, -31, 4.2, 2.3, -0.1, 0, TAU);
    ctx.fill();
    ctx.restore();
    // 手
    ctx.strokeStyle = flash ? '#ffeadd' : '#3a2543';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-16, -9);
    ctx.quadraticCurveTo(-27, 2, -25, 12);
    ctx.moveTo(17, -8);
    ctx.quadraticCurveTo(27, 4, 24, 15);
    ctx.stroke();
    // 胸针
    ctx.fillStyle = 'rgba(224, 81, 104, 0.8)';
    drawDiamond(ctx, 0, -12, 3);
    ctx.fill();
    ctx.restore();
    this.drawHealthBar(ctx, x, y - 58, 43);
  }

  drawSentinel(ctx, cam, time, scale) {
    const x = this.x - cam;
    const y = this.y;
    const flash = this.flash > 0;
    ctx.save();
    ctx.fillStyle = 'rgba(4, 5, 10, 0.28)';
    ctx.beginPath();
    ctx.ellipse(x, Math.min(600, y + 49), 24, 5, 0, 0, TAU);
    ctx.fill();

    ctx.translate(x, y);
    ctx.scale(this.dir * scale, scale);
    const pulse = Math.sin(time * 2.5 + this.anim);
    // 悬浮光环
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.28 + pulse * 0.08;
    ctx.strokeStyle = '#eab58c';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, -53, 26, 5, 0, 0, TAU);
    ctx.stroke();
    drawGlow(ctx, 0, -54, 32, '#e8aa7f', 0.1);
    ctx.restore();

    // 长袍
    ctx.fillStyle = flash ? '#fff4e8' : '#231c28';
    ctx.beginPath();
    ctx.moveTo(-17, 44);
    ctx.lineTo(-12, -31);
    ctx.quadraticCurveTo(-23, -44, -13, -54);
    ctx.lineTo(0, -60);
    ctx.lineTo(15, -52);
    ctx.quadraticCurveTo(23, -41, 12, -29);
    ctx.lineTo(18, 44);
    ctx.lineTo(9, 46);
    ctx.lineTo(4, 17);
    ctx.lineTo(-3, 46);
    ctx.closePath();
    ctx.fill();
    // 甲片
    ctx.fillStyle = flash ? '#ffe3ca' : '#3b2d38';
    ctx.beginPath();
    ctx.moveTo(-14, -34);
    ctx.lineTo(13, -34);
    ctx.lineTo(10, -12);
    ctx.lineTo(-10, -12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(236, 175, 125, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-8, -31);
    ctx.lineTo(-6, -15);
    ctx.moveTo(0, -32);
    ctx.lineTo(1, -14);
    ctx.moveTo(7, -31);
    ctx.lineTo(7, -15);
    ctx.stroke();
    // 头部尖盔
    ctx.fillStyle = flash ? '#fff2df' : '#30242d';
    ctx.beginPath();
    ctx.moveTo(-11, -53);
    ctx.lineTo(-9, -72);
    ctx.lineTo(0, -86);
    ctx.lineTo(10, -70);
    ctx.lineTo(11, -52);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(7, 6, 11, 0.92)';
    ctx.fillRect(-7, -66, 15, 6);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const eye = 0.5 + Math.sin(time * 5 + this.anim) * 0.2;
    ctx.globalAlpha = eye;
    ctx.fillStyle = '#ffae7d';
    ctx.fillRect(-4, -64.5, 9, 2);
    drawGlow(ctx, 0, -63, 12, '#ffae7d', 0.2);
    ctx.restore();
    // 头顶尖角
    ctx.strokeStyle = '#584050';
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(0, -85);
    ctx.lineTo(-2, -99);
    ctx.stroke();

    // 长枪
    const aim = Math.atan2(this.game.hero.y - 44 - (this.y - 12), this.game.hero.x - this.x);
    const localAim = clamp(this.dir > 0 ? aim : Math.PI - aim, -0.9, 0.9);
    ctx.save();
    ctx.translate(15, -14);
    ctx.rotate(localAim * 0.5);
    ctx.strokeStyle = flash ? '#fff1de' : '#4d3c43';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-24, 7);
    ctx.lineTo(51, -2);
    ctx.stroke();
    ctx.fillStyle = '#b78d60';
    ctx.beginPath();
    ctx.moveTo(51, -2);
    ctx.lineTo(63, -6);
    ctx.lineTo(55, 1);
    ctx.lineTo(63, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 174, 112, 0.65)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.lineTo(50, -2.5);
    ctx.stroke();
    // 蓄力
    if (this.telegraph > 0 || this.burstLeft > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.5 + Math.sin(time * 14) * 0.25;
      drawGlow(ctx, 62, -5, 18, '#ffb277', 0.4);
      ctx.fillStyle = '#ffe3bb';
      ctx.beginPath();
      ctx.arc(60, -4, 2.5, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    ctx.restore();
    this.drawHealthBar(ctx, x, y - 92, 54);
  }
}

class Boss {
  constructor(game) {
    this.game = game;
    this.w = 132;
    this.h = 200;
    this.maxHp = 1280;
    this.hp = this.maxHp;
    this.x = LEVEL.arena.bossX;
    this.y = 500;
    this.dir = -1;
    this.active = false;
    this.dead = false;
    this.flash = 0;
    this.anim = 0;
    this.state = 'dormant';
    this.stateT = 0;
    this.timer = 0;
    this.phase = 1;
    this.invulnerable = false;
    this.struck = false;
    this.waveIndex = 0;
    this.chargeDir = -1;
    this.contactDamage = 18;
    this.name = '无相 · 守门人';
  }

  get bounds() {
    return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
  }

  reset() {
    this.hp = this.maxHp;
    this.x = LEVEL.arena.bossX;
    this.y = 500;
    this.dir = -1;
    this.active = false;
    this.dead = false;
    this.flash = 0;
    this.anim = 0;
    this.state = 'dormant';
    this.stateT = 0;
    this.timer = 0;
    this.phase = 1;
    this.invulnerable = true;
    this.struck = false;
    this.waveIndex = 0;
    this.contactDamage = 18;
  }

  activate() {
    if (this.active) return;
    this.active = true;
    this.state = 'intro';
    this.stateT = 0;
    this.timer = 2.3;
    this.invulnerable = true;
    this.game.audio.bossRoar();
    this.game.addShake(12);
  }

  takeDamage(amount, game) {
    if (!this.active || this.dead || this.invulnerable) return false;
    this.hp -= amount;
    this.flash = 0.1;
    game.spawnHitSpark(this.x + rand(-40, 40), this.y + rand(-60, 60), '#ffbd7f', 14);
    game.spawnDamageText(this.x + rand(-25, 25), this.y - 70, amount, 'damage-enemy');
    game.audio.enemyHit();
    if (this.phase === 1 && this.hp <= this.maxHp * 0.52) {
      this.enterPhaseTwo(game);
    }
    if (this.hp <= 0) {
      this.hp = 0;
      this.die(game);
      return true;
    }
    return false;
  }

  enterPhaseTwo(game) {
    this.phase = 2;
    this.state = 'transition';
    this.stateT = 0;
    this.timer = 1.45;
    this.invulnerable = true;
    game.audio.bossRoar();
    game.addShake(16);
    game.spawnBossBurst(this.x, this.y, 40);
    game.showToast('守门人', '「不错。让我看看，你的长夜有多深。」', 3);
    game.hitFlash = Math.max(game.hitFlash, 0.3);
    game.hitFlashColor = '255,52,80';
  }

  die(game) {
    if (this.dead) return;
    this.dead = true;
    this.invulnerable = true;
    this.state = 'dead';
    game.onBossDeath(this);
  }

  chooseAttack(game) {
    const hero = game.hero;
    const dx = Math.abs(hero.x - this.x);
    const r = Math.random();
    if (dx < 280) {
      if (r < 0.53) this.beginSlash(game);
      else if (r < 0.78) this.beginCharge(game);
      else this.beginBarrage(game);
    } else if (dx < 560) {
      if (r < 0.3) this.beginSlash(game);
      else if (r < 0.64) this.beginCharge(game);
      else this.beginBarrage(game);
    } else {
      if (r < 0.15) this.beginSlash(game);
      else if (r < 0.49) this.beginCharge(game);
      else this.beginBarrage(game);
    }
  }

  beginSlash(game) {
    this.state = 'slash';
    this.stateT = 0;
    this.struck = false;
    this.timer = this.phase === 2 ? 1.22 : 1.35;
    this.slashDir = this.game.hero.x >= this.x ? 1 : -1;
    game.audio.noise(0.22, { vol: 0.04, freq: 420, freqEnd: 1200, type: 'bandpass' });
  }

  beginBarrage(game) {
    this.state = 'barrage';
    this.stateT = 0;
    this.waveIndex = 0;
    this.timer = this.phase === 2 ? 2.05 : 2.15;
    this.barrageWaves = this.phase === 2 ? 4 : 3;
  }

  beginCharge(game) {
    this.state = 'charge';
    this.stateT = 0;
    this.chargeDir = this.game.hero.x >= this.x ? 1 : -1;
    this.dir = this.chargeDir;
    this.timer = this.phase === 2 ? 1.2 : 1.35;
  }

  update(dt, game) {
    if (!this.active || this.dead) return;
    this.anim += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.stateT += dt;
    this.timer -= dt;
    const hero = game.hero;

    if (this.state === 'intro') {
      if (this.stateT > 2.05) {
        this.state = 'idle';
        this.stateT = 0;
        this.timer = 1.05;
        this.invulnerable = false;
        game.spawnBossBurst(this.x, this.y + 40, 20);
        game.addShake(8);
      }
      return;
    }

    if (this.state === 'transition') {
      if (this.stateT > 1.35) {
        this.state = 'idle';
        this.stateT = 0;
        this.timer = 0.5;
        this.invulnerable = false;
        this.phase = 2;
      }
      return;
    }

    if (this.state === 'dead') return;

    if (this.state === 'idle') {
      this.dir = hero.x >= this.x ? 1 : -1;
      if (Math.abs(hero.x - this.x) > 310) {
        this.x += this.dir * (this.phase === 2 ? 48 : 34) * dt;
      }
      if (this.timer <= 0) this.chooseAttack(game);
      this.x = clamp(this.x, LEVEL.arena.left + 95, LEVEL.arena.right - 95);
      this.checkContact(game);
      return;
    }

    if (this.state === 'slash') {
      this.dir = this.slashDir;
      const windup = this.phase === 2 ? 0.48 : 0.62;
      if (!this.struck && this.stateT >= windup) {
        this.struck = true;
        game.bossSlash(this);
      }
      if (this.stateT > windup && this.stateT < windup + 0.34) {
        this.x += this.slashDir * 90 * dt;
      }
      if (this.timer <= 0) {
        this.state = 'idle';
        this.stateT = 0;
        this.timer = this.phase === 2 ? rand(0.35, 0.68) : rand(0.6, 1.0);
      }
      this.x = clamp(this.x, LEVEL.arena.left + 95, LEVEL.arena.right - 95);
      return;
    }

    if (this.state === 'barrage') {
      this.dir = hero.x >= this.x ? 1 : -1;
      const windup = this.phase === 2 ? 0.46 : 0.58;
      const interval = this.phase === 2 ? 0.33 : 0.4;
      if (this.stateT > windup) {
        const wave = Math.floor((this.stateT - windup) / interval);
        if (wave < this.barrageWaves && wave >= this.waveIndex) {
          this.waveIndex = wave + 1;
          game.bossBarrage(this, wave);
        }
      }
      if (this.timer <= 0) {
        this.state = 'idle';
        this.stateT = 0;
        this.timer = this.phase === 2 ? rand(0.4, 0.75) : rand(0.7, 1.1);
      }
      return;
    }

    if (this.state === 'charge') {
      const windup = this.phase === 2 ? 0.36 : 0.5;
      if (this.stateT > windup && this.stateT < windup + 0.4) {
        this.x += this.chargeDir * (this.phase === 2 ? 940 : 800) * dt;
        if (this.stateT < windup + 0.38) {
          game.spawnChargeTrail(this);
          this.checkContact(game);
        }
      }
      this.dir = this.chargeDir;
      if (this.timer <= 0) {
        this.state = 'idle';
        this.stateT = 0;
        this.timer = this.phase === 2 ? rand(0.35, 0.6) : rand(0.55, 0.9);
        game.spawnBossBurst(this.x, this.y + 40, 8);
      }
      const before = this.x;
      this.x = clamp(this.x, LEVEL.arena.left + 95, LEVEL.arena.right - 95);
      if (before !== this.x && this.stateT > windup) {
        game.addShake(10);
        game.spawnBossBurst(this.x, this.y, 14);
      }
      return;
    }
  }

  checkContact(game) {
    const hero = game.hero;
    if (rectsOverlap(this.bounds, hero.bounds)) {
      hero.hurt(this.state === 'charge' ? 22 : this.contactDamage, this.x, game, this);
    }
  }

  draw(ctx, cam, time) {
    if (!this.active) return;
    const hero = this.game.hero;
    const x = this.x - cam;
    const y = this.y;
    let rise = 0;
    if (this.dead) {
      rise = -40 * clamp(this.game.bossDeathTimer / 2.4, 0, 1);
    }
    ctx.save();
    // 地面阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.beginPath();
    ctx.ellipse(x, 601, 63, 10, 0, 0, TAU);
    ctx.fill();

    // 二阶段气场
    if (this.phase === 2 && !this.dead) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.2 + Math.sin(time * 4) * 0.05;
      drawGlow(ctx, x, y + 10, 130, '#ff3c5e', 0.22);
      ctx.strokeStyle = 'rgba(255, 83, 112, 0.22)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(x, y + 35, 65 + i * 18 + Math.sin(time * 2 + i) * 4, 0.25, Math.PI - 0.25);
        ctx.stroke();
      }
      ctx.restore();
    }

    const bossScale = 1.24;
    ctx.translate(x, 600 + rise);
    ctx.scale(this.dir * bossScale, bossScale);
    ctx.translate(0, -80);
    const flash = this.flash > 0;
    const dark = flash ? '#fff6e8' : '#1c1523';
    const plate = flash ? '#fff0df' : '#3b2e42';
    const trim = flash ? '#fff9ec' : '#974057';
    const breathe = Math.sin(time * 1.8) * 2;
    const charge = this.state === 'charge';
    const slash = this.state === 'slash';
    const windup = slash && this.stateT < (this.phase === 2 ? 0.48 : 0.62);
    const strike = slash && this.stateT >= (this.phase === 2 ? 0.48 : 0.62);
    const barrage = this.state === 'barrage';
    const lean = charge ? 12 : (windup ? -4 : 0);

    // 披风
    const capeSway = Math.sin(time * 2.1) * 8;
    ctx.fillStyle = flash ? 'rgba(255, 243, 231, 0.82)' : 'rgba(41, 15, 27, 0.82)';
    ctx.beginPath();
    ctx.moveTo(-38, -45);
    ctx.quadraticCurveTo(-84, -20, -91 + capeSway, 47);
    ctx.quadraticCurveTo(-63, 37, -54, 72);
    ctx.lineTo(-34, 51);
    ctx.lineTo(-26, 76);
    ctx.lineTo(-15, 36);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(172, 63, 79, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-45, -30);
    ctx.quadraticCurveTo(-70, 3, -77 + capeSway, 52);
    ctx.stroke();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = 'rgba(255, 106, 122, 0.28)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-39, -43);
    ctx.quadraticCurveTo(-84, -15, -90 + capeSway, 49);
    ctx.stroke();
    ctx.restore();

    // 腿
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.moveTo(-29, 18);
    ctx.lineTo(-22, 72);
    ctx.lineTo(-36, 81);
    ctx.lineTo(-46, 76);
    ctx.lineTo(-40, 15);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(20, 17);
    ctx.lineTo(31, 70);
    ctx.lineTo(45, 80);
    ctx.lineTo(22, 82);
    ctx.lineTo(12, 19);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = plate;
    ctx.beginPath();
    ctx.moveTo(-37, 51);
    ctx.lineTo(-22, 49);
    ctx.lineTo(-19, 68);
    ctx.lineTo(-34, 71);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(14, 50);
    ctx.lineTo(29, 48);
    ctx.lineTo(34, 66);
    ctx.lineTo(18, 69);
    ctx.closePath();
    ctx.fill();
    // 红裂纹
    ctx.strokeStyle = 'rgba(255, 70, 94, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-30, 53);
    ctx.lineTo(-24, 59);
    ctx.lineTo(-28, 67);
    ctx.stroke();

    // 腰甲
    ctx.save();
    ctx.translate(lean, 0);
    ctx.fillStyle = plate;
    ctx.beginPath();
    ctx.moveTo(-28, 8);
    ctx.lineTo(28, 8);
    ctx.lineTo(21, 29);
    ctx.lineTo(0, 35);
    ctx.lineTo(-23, 29);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = trim;
    ctx.beginPath();
    ctx.moveTo(-19, 11);
    ctx.lineTo(19, 11);
    ctx.lineTo(15, 19);
    ctx.lineTo(-16, 19);
    ctx.closePath();
    ctx.fill();

    // 躯干
    const torso = ctx.createLinearGradient(-36, -47, 36, 20);
    torso.addColorStop(0, flash ? '#fff7ec' : '#2b2332');
    torso.addColorStop(0.5, dark);
    torso.addColorStop(1, flash ? '#ffe6cd' : '#100c16');
    ctx.fillStyle = torso;
    ctx.beginPath();
    ctx.moveTo(-38, -45);
    ctx.quadraticCurveTo(-35, -12, -22, 12);
    ctx.lineTo(20, 12);
    ctx.quadraticCurveTo(34, -12, 37, -44);
    ctx.lineTo(19, -56);
    ctx.lineTo(0, -48);
    ctx.lineTo(-20, -56);
    ctx.closePath();
    ctx.fill();
    // 胸甲
    ctx.fillStyle = plate;
    ctx.beginPath();
    ctx.moveTo(-27, -38);
    ctx.quadraticCurveTo(0, -51, 28, -37);
    ctx.lineTo(22, -7);
    ctx.lineTo(0, 2);
    ctx.lineTo(-20, -7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(205, 121, 100, 0.38)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -44);
    ctx.lineTo(0, -10);
    ctx.moveTo(-22, -29);
    ctx.lineTo(0, -20);
    ctx.lineTo(22, -29);
    ctx.stroke();
    // 胸口红核
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const core = 0.5 + Math.sin(time * 3.5) * 0.16 + (windup ? 0.25 : 0);
    ctx.globalAlpha = core;
    drawGlow(ctx, 0, -20, 26, '#ff3f5d', 0.4);
    ctx.fillStyle = '#ff8491';
    drawDiamond(ctx, 0, -20, 5);
    ctx.fill();
    ctx.restore();

    // 甲胄边缘的冷光与裂纹
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = 'rgba(171, 225, 220, 0.17)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-36, -43);
    ctx.quadraticCurveTo(-33, -9, -19, 11);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 94, 110, 0.36)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, -30);
    ctx.lineTo(9, -20);
    ctx.lineTo(17, -12);
    ctx.lineTo(9, -2);
    ctx.moveTo(-25, 16);
    ctx.lineTo(-18, 23);
    ctx.stroke();
    ctx.restore();

    // 肩甲
    ctx.fillStyle = plate;
    ctx.beginPath();
    ctx.moveTo(-41, -47);
    ctx.lineTo(-19, -53);
    ctx.lineTo(-8, -39);
    ctx.lineTo(-22, -28);
    ctx.lineTo(-43, -34);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(39, -46);
    ctx.lineTo(20, -54);
    ctx.lineTo(9, -39);
    ctx.lineTo(22, -27);
    ctx.lineTo(43, -33);
    ctx.closePath();
    ctx.fill();
    // 尖刺
    ctx.fillStyle = trim;
    ctx.beginPath();
    ctx.moveTo(-40, -47);
    ctx.lineTo(-56, -63);
    ctx.lineTo(-34, -57);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(39, -47);
    ctx.lineTo(55, -64);
    ctx.lineTo(33, -57);
    ctx.closePath();
    ctx.fill();

    // 头部
    const headY = -70 + breathe * 0.25;
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.moveTo(-14, headY + 12);
    ctx.lineTo(-16, headY - 3);
    ctx.lineTo(-6, headY - 15);
    ctx.lineTo(7, headY - 14);
    ctx.lineTo(16, headY - 2);
    ctx.lineTo(13, headY + 13);
    ctx.lineTo(0, headY + 19);
    ctx.closePath();
    ctx.fill();
    // 面具
    ctx.fillStyle = flash ? '#fffdf6' : '#d7c4b2';
    ctx.beginPath();
    ctx.moveTo(-11, headY + 10);
    ctx.lineTo(-13, headY - 5);
    ctx.lineTo(-3, headY - 12);
    ctx.lineTo(10, headY - 9);
    ctx.lineTo(13, headY + 2);
    ctx.lineTo(7, headY + 12);
    ctx.lineTo(-2, headY + 15);
    ctx.closePath();
    ctx.fill();
    // 面具裂痕
    ctx.strokeStyle = 'rgba(108, 70, 65, 0.7)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(3, headY - 11);
    ctx.lineTo(-1, headY - 2);
    ctx.lineTo(4, headY + 5);
    ctx.stroke();

    // 黑色面甲与红色眼缝
    ctx.fillStyle = 'rgba(8, 6, 11, 0.94)';
    ctx.beginPath();
    ctx.moveTo(-9, headY - 5);
    ctx.lineTo(11, headY - 4);
    ctx.lineTo(10, headY + 4);
    ctx.lineTo(-7, headY + 5);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.72 + Math.sin(time * 5) * 0.16;
    drawGlow(ctx, 7, headY, 19, '#ff3c59', 0.55);
    ctx.fillStyle = '#ffb0b0';
    ctx.fillRect(4, headY - 1.2, 8, 2.2);
    ctx.fillRect(-6, headY + 1, 3.5, 1.2);
    ctx.restore();
    // 额心印记
    ctx.fillStyle = 'rgba(184, 47, 70, 0.85)';
    drawDiamond(ctx, 0, headY - 8, 2.6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(205, 170, 128, 0.5)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-11, headY + 6);
    ctx.lineTo(8, headY + 10);
    ctx.stroke();

    // 头部暗环
    ctx.save();
    ctx.globalAlpha = 0.23;
    ctx.strokeStyle = '#ff6c79';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, headY, 28, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.restore();
    // 巨角
    ctx.strokeStyle = flash ? '#fff4e5' : '#3e2d3a';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-12, headY - 10);
    ctx.quadraticCurveTo(-28, headY - 25, -37, headY - 18);
    ctx.moveTo(10, headY - 10);
    ctx.quadraticCurveTo(25, headY - 30, 35, headY - 22);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(217, 89, 94, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-15, headY - 14);
    ctx.quadraticCurveTo(-26, headY - 23, -33, headY - 19);
    ctx.moveTo(13, headY - 13);
    ctx.quadraticCurveTo(24, headY - 26, 32, headY - 22);
    ctx.stroke();

    // 持剑臂
    let bladeAngle = 0.68;
    if (windup) bladeAngle = -2.35 + this.stateT * 0.8;
    else if (strike) bladeAngle = lerp(-1.7, 0.9, clamp((this.stateT - 0.62) / 0.4, 0, 1));
    else if (charge) bladeAngle = 1.15;
    else if (barrage) bladeAngle = -0.9;
    ctx.save();
    ctx.translate(33, -22);
    ctx.rotate(bladeAngle);
    // 手臂
    ctx.strokeStyle = dark;
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(-20, -10);
    ctx.lineTo(0, 0);
    ctx.stroke();
    // 剑柄
    ctx.fillStyle = '#1a1420';
    ctx.fillRect(-6, -5, 17, 10);
    ctx.fillStyle = trim;
    ctx.fillRect(7, -10, 5, 20);
    // 巨剑
    const blade = ctx.createLinearGradient(12, 0, 145, 0);
    blade.addColorStop(0, '#b9c1cc');
    blade.addColorStop(0.5, '#eef0ee');
    blade.addColorStop(1, '#fff8e9');
    ctx.fillStyle = flash ? '#ffffff' : blade;
    ctx.beginPath();
    ctx.moveTo(12, -9);
    ctx.lineTo(112, -12);
    ctx.lineTo(150, 0);
    ctx.lineTo(112, 12);
    ctx.lineTo(12, 9);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(61, 35, 48, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(140, 0);
    ctx.stroke();
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = windup ? 0.6 : 0.22;
    ctx.strokeStyle = windup ? '#ff6a77' : '#d7e4e3';
    ctx.lineWidth = windup ? 2.6 : 1.2;
    ctx.beginPath();
    ctx.moveTo(15, -8);
    ctx.lineTo(145, 0);
    ctx.stroke();
    ctx.restore();
    ctx.restore();

    // 空闲另一只臂
    ctx.strokeStyle = dark;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(-34, -33);
    ctx.quadraticCurveTo(-50, -10, -44, 4);
    ctx.stroke();
    ctx.fillStyle = plate;
    ctx.beginPath();
    ctx.arc(-44, 6, 7, 0, TAU);
    ctx.fill();

    // 蓄力地面预警
    if (windup) {
      const p = clamp(this.stateT / 0.62, 0, 1);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.25 + p * 0.5;
      ctx.strokeStyle = '#ff5a6e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(65, 80, 100 * (0.4 + p * 0.6), 11, 0, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 0.12 + p * 0.25;
      ctx.fillStyle = '#ff5a6e';
      ctx.beginPath();
      ctx.ellipse(65, 80, 90 * p, 8, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    // 蓄力弹幕法阵
    if (barrage) {
      const p = clamp(this.stateT / 1.8, 0, 1);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.translate(0, -28);
      ctx.rotate(time * 0.6);
      ctx.globalAlpha = 0.14 + p * 0.24;
      ctx.strokeStyle = '#ff6377';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, 54 + p * 20, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i * TAU / 6;
        ctx.moveTo(Math.cos(a) * 36, Math.sin(a) * 36);
        ctx.lineTo(Math.cos(a) * 75, Math.sin(a) * 75);
      }
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
    ctx.restore();
  }
}
