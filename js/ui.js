'use strict';

class HUDRenderer {
  constructor(game) {
    this.game = game;
    this.isTouch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  }

  serif(size, weight = 400) {
    return `${weight} ${size}px "Songti SC", "STSong", "Noto Serif SC", serif`;
  }

  sans(size, weight = 400) {
    return `${weight} ${size}px "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`;
  }

  panel(ctx, x, y, w, h, cut = 10, fill = 'rgba(7, 9, 17, 0.67)') {
    ctx.save();
    cutRect(ctx, x, y, w, h, cut);
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, fill);
    g.addColorStop(1, 'rgba(5, 6, 12, 0.5)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(230, 204, 166, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  draw(ctx) {
    const g = this.game;
    if (g.state === 'menu') return;
    this.drawHealth(ctx);
    this.drawWeapons(ctx);
    this.drawEchoCount(ctx);
    this.drawMinimap(ctx);
    this.drawBossBar(ctx);
    this.drawObjectiveArrow(ctx);
    this.drawTutorial(ctx);
    this.drawToast(ctx);
    this.drawChapterCard(ctx);
    this.drawAimHint(ctx);
    this.drawBossCinematic(ctx);
    this.drawParrySlow(ctx);
    this.drawLowHealth(ctx);
    this.drawSoundState(ctx);
    this.drawDialogue(ctx);
  }

  drawHealth(ctx) {
    const g = this.game;
    const hero = g.hero;
    const x = 28, y = 22, w = 370, h = 90;
    this.panel(ctx, x, y, w, h, 12, 'rgba(7, 9, 17, 0.72)');

    // 细角
    ctx.save();
    ctx.strokeStyle = 'rgba(223, 183, 129, 0.42)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 9, y + 1);
    ctx.lineTo(x + 28, y + 1);
    ctx.moveTo(x + 1, y + 9);
    ctx.lineTo(x + 1, y + 28);
    ctx.stroke();
    ctx.restore();

    // 头像
    const px = x + 43;
    const py = y + 45;
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, 29, 0, TAU);
    ctx.clip();
    const bg = ctx.createRadialGradient(px - 8, py - 10, 3, px, py, 34);
    bg.addColorStop(0, '#372a3d');
    bg.addColorStop(1, '#0d0d17');
    ctx.fillStyle = bg;
    ctx.fillRect(px - 32, py - 32, 64, 64);
    // 后方头发
    const look = g.appearance || DEFAULT_APPEARANCE;
    const hair = look.outfit === 'student' ? look.studentHair : look.bladeHair;
    ctx.fillStyle = darken(hair, 0.2);
    ctx.beginPath();
    if (look.outfit === 'student') {
      ctx.ellipse(px - 2, py + 3, 20, 21, -0.15, 0, TAU);
    } else {
      ctx.ellipse(px - 2, py + 2, 22, 25, -0.15, 0, TAU);
    }
    ctx.fill();
    // 脖颈与肩
    ctx.fillStyle = '#d8ad9c';
    ctx.fillRect(px - 3, py + 12, 9, 9);
    ctx.fillStyle = look.outfit === 'student' ? look.top : '#42172a';
    ctx.beginPath();
    ctx.moveTo(px - 16, py + 28);
    ctx.quadraticCurveTo(px - 9, py + 16, px - 2, py + 18);
    ctx.lineTo(px + 10, py + 18);
    ctx.quadraticCurveTo(px + 19, py + 19, px + 22, py + 29);
    ctx.closePath();
    ctx.fill();
    // 脸
    const face = ctx.createLinearGradient(px - 9, py - 14, px + 14, py + 16);
    face.addColorStop(0, '#f9e0cd');
    face.addColorStop(1, '#daac9c');
    ctx.fillStyle = face;
    ctx.beginPath();
    ctx.moveTo(px - 12, py - 9);
    ctx.quadraticCurveTo(px - 4, py - 20, px + 8, py - 18);
    ctx.quadraticCurveTo(px + 17, py - 15, px + 16, py - 2);
    ctx.quadraticCurveTo(px + 15, py + 9, px + 8, py + 14);
    ctx.quadraticCurveTo(px + 2, py + 18, px - 3, py + 13);
    ctx.quadraticCurveTo(px - 12, py + 5, px - 12, py - 9);
    ctx.closePath();
    ctx.fill();
    // 侧发
    const hairLight = lighten(hair, 0.32);
    const hairDark = darken(hair, 0.2);
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.ellipse(px - 13, py - 1, 6, 18, 0.2, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 1, 4.5, 14, -0.18, 0, TAU);
    ctx.fill();
    // 刘海
    const fringe = ctx.createLinearGradient(px - 15, py - 22, px + 14, py - 4);
    fringe.addColorStop(0, hairLight);
    fringe.addColorStop(0.55, hair);
    fringe.addColorStop(1, hairDark);
    ctx.fillStyle = fringe;
    ctx.beginPath();
    ctx.moveTo(px - 15, py - 5);
    ctx.quadraticCurveTo(px - 12, py - 24, px + 6, py - 21);
    ctx.quadraticCurveTo(px + 21, py - 17, px + 19, py - 3);
    ctx.quadraticCurveTo(px + 10, py - 11, px + 4, py - 6);
    ctx.quadraticCurveTo(px - 2, py - 1, px - 6, py + 5);
    ctx.quadraticCurveTo(px - 8, py - 3, px - 15, py - 5);
    ctx.closePath();
    ctx.fill();
    // 眼睛
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = '#ff4f6a';
    ctx.beginPath();
    ctx.ellipse(px + 8, py + 1, 4.2, 2.6, -0.08, 0, TAU);
    ctx.fill();
    drawGlow(ctx, px + 8, py + 1, 12, '#ff6177', 0.28);
    ctx.fillStyle = '#fff3df';
    ctx.beginPath();
    ctx.arc(px + 9.3, py, 0.9, 0, TAU);
    ctx.fill();
    ctx.restore();
    // 唇与腮红
    ctx.strokeStyle = 'rgba(175, 82, 94, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 7, py + 8);
    ctx.quadraticCurveTo(px + 10, py + 9, px + 12, py + 7);
    ctx.stroke();
    ctx.fillStyle = 'rgba(220, 119, 128, 0.2)';
    ctx.beginPath();
    ctx.ellipse(px + 10, py + 4.5, 3.2, 1.4, 0.2, 0, TAU);
    ctx.fill();
    // 红发饰
    ctx.fillStyle = '#b42c48';
    ctx.beginPath();
    ctx.moveTo(px - 17, py - 12);
    ctx.lineTo(px - 8, py - 17);
    ctx.lineTo(px - 10, py - 7);
    ctx.lineTo(px - 16, py - 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e4bf80';
    ctx.beginPath();
    ctx.arc(px - 12, py - 10, 1.3, 0, TAU);
    ctx.fill();
    ctx.restore();

    // 头像环
    ctx.save();
    ctx.strokeStyle = 'rgba(225, 192, 143, 0.62)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px, py, 30, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(225, 192, 143, 0.14)';
    ctx.beginPath();
    ctx.arc(px, py, 34, 0, TAU);
    ctx.stroke();
    ctx.restore();

    const tx = x + 88;
    // 名字
    ctx.fillStyle = '#f2e5d1';
    ctx.font = this.serif(20, 400);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('绯', tx, y + 32);
    ctx.fillStyle = 'rgba(219, 190, 151, 0.62)';
    ctx.font = this.sans(7, 500);
    ctx.fillText(look.outfit === 'student' ? 'AFTER SCHOOL' : 'THE ASHEN BLADE', tx + 29, y + 30);
    ctx.fillStyle = 'rgba(195, 172, 141, 0.36)';
    ctx.font = this.sans(7, 400);
    ctx.fillText('LV. 01', tx + 29, y + 40);

    // 生命条
    const hpRatio = clamp(hero.hp / hero.maxHp, 0, 1);
    const barX = tx;
    const barY = y + 44;
    const barW = 248;
    const barH = 8;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(barX, barY, barW, barH);
    const hpGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    hpGrad.addColorStop(0, '#9a2745');
    hpGrad.addColorStop(0.52, '#d84a5e');
    hpGrad.addColorStop(1, '#f0807c');
    ctx.fillStyle = hpGrad;
    ctx.fillRect(barX, barY, barW * hpRatio, barH);
    ctx.fillStyle = 'rgba(255, 230, 214, 0.36)';
    ctx.fillRect(barX, barY, barW * hpRatio, 1);
    // 分段刻线
    for (let i = 1; i < 4; i++) {
      ctx.fillStyle = 'rgba(7, 8, 14, 0.55)';
      ctx.fillRect(barX + (barW / 4) * i, barY, 1, barH);
    }
    ctx.strokeStyle = 'rgba(239, 201, 166, 0.17)';
    ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);
    ctx.fillStyle = 'rgba(244, 227, 205, 0.7)';
    ctx.font = this.sans(8, 500);
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.ceil(hero.hp)} / ${hero.maxHp}`, barX + barW, barY + 20);

    // 月华能量
    const enRatio = clamp(hero.energy / 100, 0, 1);
    const enY = y + 70;
    ctx.fillStyle = 'rgba(205, 178, 137, 0.52)';
    ctx.font = this.serif(8);
    ctx.textAlign = 'left';
    ctx.fillText('月华', barX, enY + 5);
    const ex = barX + 28;
    const ew = 183;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(ex, enY, ew, 4);
    const enGrad = ctx.createLinearGradient(ex, enY, ex + ew, enY);
    enGrad.addColorStop(0, '#7d6a9b');
    enGrad.addColorStop(0.55, '#d5ac74');
    enGrad.addColorStop(1, '#ffe1a0');
    ctx.fillStyle = enGrad;
    ctx.fillRect(ex, enY, ew * enRatio, 4);
    if (enRatio >= 1) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.35 + Math.sin(g.time * 4) * 0.15;
      drawGlow(ctx, ex + ew, enY + 2, 18, '#ffe1a0', 0.4);
      ctx.restore();
    }
    // 能量说明
    ctx.fillStyle = 'rgba(208, 191, 164, 0.4)';
    ctx.font = this.sans(6.5);
    ctx.textAlign = 'left';
    ctx.fillText(enRatio >= 1 ? 'E  月华爆发  就绪' : 'E  月华爆发', ex + ew + 10, enY + 5);

    // 状态徽记
    if (hero.guarding) {
      const perfect = hero.guardTime <= 0.5;
      ctx.save();
      ctx.globalAlpha = 0.72 + Math.sin(g.time * 8) * 0.12;
      ctx.fillStyle = perfect ? '#ffe0a0' : '#8fdcd6';
      ctx.font = this.sans(7);
      ctx.textAlign = 'right';
      ctx.fillText(perfect ? '完美弹反窗口' : '防御 · 伤害 -30%', x + w - 15, y + 82);
      ctx.restore();
    } else if (hero.reloading) {
      ctx.fillStyle = 'rgba(235, 196, 132, 0.72)';
      ctx.font = this.sans(7);
      ctx.textAlign = 'right';
      ctx.fillText('换弹中', x + w - 15, y + 82);
    } else if (hero.specialTimer > 0) {
      ctx.fillStyle = 'rgba(255, 222, 166, 0.8)';
      ctx.font = this.sans(7);
      ctx.textAlign = 'right';
      ctx.fillText('月华 · 斩夜', x + w - 15, y + 82);
    } else if (hpRatio < 0.3) {
      ctx.save();
      ctx.globalAlpha = 0.5 + Math.sin(g.time * 6) * 0.2;
      ctx.fillStyle = '#ff7f8b';
      ctx.font = this.sans(7);
      ctx.textAlign = 'right';
      ctx.fillText('生命垂危', x + w - 15, y + 82);
      ctx.restore();
    }
  }

  drawWeapons(ctx) {
    const g = this.game;
    const hero = g.hero;
    const swordActive = hero.weapon === 'sword';
    const gunActive = hero.weapon === 'gun';
    const x1 = 1016, x2 = 1140, y = 24, w = 116, h = 82;
    this.drawWeaponCard(ctx, x1, y, w, h, 'sword', swordActive, '剑', 'BLADE', '1');
    this.drawWeaponCard(ctx, x2, y, w, h, 'gun', gunActive, '枪', 'CINDER', '2');

    // 弹药刻度
    const pipsX = x2 + 11;
    const pipsY = y + 58;
    const pipsW = 7;
    const gap = 1.9;
    for (let i = 0; i < hero.maxAmmo; i++) {
      ctx.fillStyle = i < hero.ammo ? 'rgba(242, 207, 151, 0.92)' : 'rgba(255, 255, 255, 0.09)';
      ctx.fillRect(pipsX + i * (pipsW + gap), pipsY, pipsW, 2.5);
    }
    if (hero.reloading) {
      const p = 1 - hero.reloadTimer / hero.reloadTotal;
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(pipsX, pipsY + 6, 78, 1.5);
      ctx.fillStyle = 'rgba(240, 195, 128, 0.9)';
      ctx.fillRect(pipsX, pipsY + 6, 78 * clamp(p, 0, 1), 1.5);
      ctx.fillStyle = 'rgba(235, 199, 145, 0.7)';
      ctx.font = this.sans(6.5);
      ctx.textAlign = 'right';
      ctx.fillText('R', x2 + w - 10, y + 70);
    } else {
      ctx.fillStyle = 'rgba(211, 194, 169, 0.4)';
      ctx.font = this.sans(6);
      ctx.textAlign = 'right';
      ctx.fillText(hero.ammo === 0 ? 'AUTO' : 'R 换弹', x2 + w - 10, y + 70);
    }
  }

  drawWeaponCard(ctx, x, y, w, h, type, active, cn, en, key) {
    const g = this.game;
    ctx.save();
    cutRect(ctx, x, y, w, h, 9);
    const bg = ctx.createLinearGradient(x, y, x, y + h);
    if (active) {
      bg.addColorStop(0, type === 'sword' ? 'rgba(74, 22, 38, 0.85)' : 'rgba(35, 48, 53, 0.82)');
      bg.addColorStop(1, 'rgba(8, 9, 16, 0.72)');
    } else {
      bg.addColorStop(0, 'rgba(14, 15, 25, 0.7)');
      bg.addColorStop(1, 'rgba(6, 7, 13, 0.56)');
    }
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = active
      ? (type === 'sword' ? 'rgba(237, 129, 127, 0.67)' : 'rgba(143, 208, 197, 0.58)')
      : 'rgba(231, 205, 169, 0.14)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 顶部强调线
    ctx.fillStyle = active
      ? (type === 'sword' ? 'rgba(239, 116, 123, 0.9)' : 'rgba(134, 213, 201, 0.84)')
      : 'rgba(214, 187, 147, 0.15)';
    ctx.fillRect(x + 9, y + 1, w - 18, 1.2);

    // 图标
    ctx.save();
    ctx.translate(x + 83, y + 35);
    if (type === 'sword') {
      ctx.rotate(-0.72);
      ctx.strokeStyle = active ? 'rgba(248, 239, 216, 0.92)' : 'rgba(224, 214, 202, 0.48)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-17, 0);
      ctx.lineTo(20, 0);
      ctx.stroke();
      ctx.strokeStyle = active ? '#d2ac72' : 'rgba(189, 159, 114, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-11, -5);
      ctx.lineTo(-11, 5);
      ctx.stroke();
      ctx.fillStyle = active ? '#f6e5be' : 'rgba(220, 206, 183, 0.45)';
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(10, -2.4);
      ctx.lineTo(10, 2.4);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.strokeStyle = active ? 'rgba(219, 243, 236, 0.9)' : 'rgba(207, 218, 211, 0.45)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-15, -3);
      ctx.lineTo(13, -3);
      ctx.lineTo(18, 0);
      ctx.lineTo(13, 3);
      ctx.lineTo(-7, 5);
      ctx.lineTo(-13, 7);
      ctx.stroke();
      ctx.fillStyle = active ? 'rgba(238, 202, 145, 0.9)' : 'rgba(202, 180, 143, 0.4)';
      ctx.fillRect(8, -2, 11, 1.5);
    }
    ctx.restore();

    // 键位
    ctx.fillStyle = 'rgba(8, 9, 15, 0.7)';
    ctx.fillRect(x + 9, y + 10, 17, 15);
    ctx.strokeStyle = active ? 'rgba(241, 220, 190, 0.5)' : 'rgba(234, 210, 178, 0.2)';
    ctx.strokeRect(x + 9.5, y + 10.5, 16, 14);
    ctx.fillStyle = active ? 'rgba(247, 233, 211, 0.9)' : 'rgba(226, 211, 189, 0.5)';
    ctx.font = this.sans(8, 600);
    ctx.textAlign = 'center';
    ctx.fillText(key, x + 17.5, y + 20.5);

    // 名称
    ctx.textAlign = 'left';
    ctx.fillStyle = active ? '#f2e5d0' : 'rgba(227, 211, 188, 0.65)';
    ctx.font = this.serif(17);
    ctx.fillText(cn, x + 32, y + 33);
    ctx.fillStyle = active ? 'rgba(219, 188, 144, 0.65)' : 'rgba(206, 184, 153, 0.3)';
    ctx.font = this.sans(5.5, 500);
    ctx.fillText(en, x + 33, y + 42);

    if (active) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.16 + Math.sin(g.time * 7) * 0.06;
      drawGlow(ctx, x + 85, y + 35, 30, type === 'sword' ? '#f06a72' : '#8fe0d5', 0.4);
      ctx.restore();
    }
    ctx.restore();
  }

  drawEchoCount(ctx) {
    const g = this.game;
    const x = 1256;
    const y = 122;
    ctx.save();
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(222, 203, 177, 0.46)';
    ctx.font = this.serif(8);
    ctx.fillText('残响', x - 60, y);
    ctx.fillStyle = 'rgba(242, 222, 191, 0.78)';
    ctx.font = this.sans(10, 500);
    ctx.fillText(`${g.echoCount} / 5`, x, y);
    for (let i = 0; i < 5; i++) {
      const px = x - 88 + i * 16;
      ctx.fillStyle = i < g.echoCount ? '#e7c286' : 'rgba(255, 255, 255, 0.1)';
      drawDiamond(ctx, px, y + 12, 3);
      ctx.fill();
    }
    ctx.restore();
  }

  drawMinimap(ctx) {
    const g = this.game;
    const hero = g.hero;
    const x = 426;
    const y = 30;
    const w = 530;
    const z = WORLD_W;
    const px = x + clamp(hero.x / z, 0, 1) * w;
    const chapterIndex = Math.max(0, LEVEL.chapters.findIndex((c, i) => i === LEVEL.chapters.length - 1 || hero.x < LEVEL.chapters[i + 1].at));
    const chapter = LEVEL.chapters[chapterIndex];
    const objective = g.boss.active && !g.boss.dead
      ? '击败守门人 · 无相'
      : (g.boss.dead ? '长夜已尽' : `前往无相圣所 · ${Math.max(0, Math.round((LEVEL.arena.trigger - hero.x) / 10))}m`);

    ctx.save();
    // 刻度
    ctx.strokeStyle = 'rgba(234, 211, 180, 0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 9);
    ctx.lineTo(x + w, y + 9);
    ctx.stroke();
    // 进度
    const prog = clamp(hero.x / z, 0, 1);
    const lineGrad = ctx.createLinearGradient(x, 0, x + w, 0);
    lineGrad.addColorStop(0, 'rgba(159, 48, 72, 0.1)');
    lineGrad.addColorStop(prog, 'rgba(228, 98, 112, 0.65)');
    lineGrad.addColorStop(1, 'rgba(159, 48, 72, 0.1)');
    ctx.strokeStyle = lineGrad;
    ctx.beginPath();
    ctx.moveTo(x, y + 9);
    ctx.lineTo(x + w * prog, y + 9);
    ctx.stroke();
    // 章节节点
    for (const c of LEVEL.chapters) {
      const cx = x + (c.at / z) * w;
      ctx.fillStyle = hero.x >= c.at ? 'rgba(231, 195, 144, 0.72)' : 'rgba(223, 200, 168, 0.25)';
      drawDiamond(ctx, cx, y + 9, 3);
      ctx.fill();
    }
    // 篝火
    for (const cp of g.checkpoints) {
      const cx = x + (cp.x / z) * w;
      ctx.fillStyle = cp.active ? 'rgba(119, 220, 208, 0.8)' : 'rgba(157, 180, 175, 0.22)';
      ctx.beginPath();
      ctx.arc(cx, y + 9, 2.2, 0, TAU);
      ctx.fill();
    }
    // Boss 标记
    const bx = x + (LEVEL.arena.bossX / z) * w;
    ctx.strokeStyle = g.boss.dead ? 'rgba(135, 149, 146, 0.4)' : 'rgba(255, 101, 119, 0.72)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx, y + 3);
    ctx.lineTo(bx + 4.5, y + 9);
    ctx.lineTo(bx, y + 15);
    ctx.lineTo(bx - 4.5, y + 9);
    ctx.closePath();
    ctx.stroke();
    // 玩家
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, px, y + 9, 12, '#ffdca7', 0.35);
    ctx.fillStyle = '#fff1d7';
    ctx.beginPath();
    ctx.arc(px, y + 9, 2.6, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(238, 219, 192, 0.7)';
    ctx.font = this.serif(11);
    const label = `${chapter.no} · ${chapter.title}`;
    ctx.fillText(label, x + w / 2, y + 34);
    ctx.fillStyle = 'rgba(207, 191, 169, 0.4)';
    ctx.font = this.sans(8.3);
    ctx.fillText(objective, x + w / 2, y + 49);
    ctx.restore();
  }

  drawBossBar(ctx) {
    const g = this.game;
    const boss = g.boss;
    if (!boss.active || (boss.dead && g.bossDeathTimer <= 0)) return;
    if (g.dialogue) return;
    const touch = this.isTouch;
    const x = touch ? 404 : 330;
    const y = touch ? 94 : 634;
    const w = touch ? 472 : 620;
    const h = touch ? 42 : 57;
    ctx.save();
    cutRect(ctx, x, y, w, h, 8);
    const bg = ctx.createLinearGradient(x, y, x, y + h);
    bg.addColorStop(0, touch ? 'rgba(12, 7, 14, 0.84)' : 'rgba(12, 7, 14, 0.74)');
    bg.addColorStop(1, touch ? 'rgba(5, 5, 10, 0.5)' : 'rgba(5, 5, 10, 0.36)');
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(219, 153, 128, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(244, 224, 197, 0.92)';
    ctx.font = this.serif(touch ? 11 : 16);
    ctx.fillText(boss.name, x + w / 2, y + (touch ? 15 : 24));
    if (!touch) {
      ctx.fillStyle = 'rgba(213, 166, 127, 0.45)';
      ctx.font = this.sans(5.5, 500);
      ctx.fillText('THE FACELESS WARDEN', x + w / 2, y + 33);
    }

    const bx = x + (touch ? 58 : 80);
    const by = y + (touch ? 23 : 40);
    const bw = w - (touch ? 116 : 160);
    const bh = touch ? 5 : 7;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.56)';
    ctx.fillRect(bx, by, bw, bh);
    const ratio = clamp(boss.hp / boss.maxHp, 0, 1);
    const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    grad.addColorStop(0, '#82213c');
    grad.addColorStop(0.55, '#d9475e');
    grad.addColorStop(1, '#ff9b84');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, bw * ratio, bh);
    ctx.fillStyle = 'rgba(255, 239, 210, 0.32)';
    ctx.fillRect(bx, by, bw * ratio, 1);
    ctx.fillStyle = 'rgba(9, 7, 12, 0.7)';
    ctx.fillRect(bx + bw * 0.52, by - 1, 1, bh + 2);
    ctx.strokeStyle = 'rgba(227, 185, 137, 0.19)';
    ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(221, 193, 163, 0.5)';
    ctx.font = this.sans(touch ? 5.5 : 6.5);
    ctx.fillText(boss.phase === 2 ? 'PHASE II' : 'PHASE I', x + (touch ? 18 : 28), y + (touch ? 36 : 49));
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(221, 193, 163, 0.44)';
    ctx.fillText(`${Math.ceil((boss.hp / boss.maxHp) * 100)}%`, x + w - (touch ? 18 : 28), y + (touch ? 36 : 49));
    ctx.restore();
  }

  drawObjectiveArrow(ctx) {
    const g = this.game;
    if (g.boss.active || g.boss.dead || g.state !== 'playing') return;
    const t = g.time;
    const x = 1248;
    const y = 360 + Math.sin(t * 1.4) * 5;
    ctx.save();
    ctx.globalAlpha = 0.25 + Math.sin(t * 2) * 0.06;
    ctx.strokeStyle = '#e4c493';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x - i * 7, y - 7);
      ctx.lineTo(x - 7 - i * 7, y);
      ctx.lineTo(x - i * 7, y + 7);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawTutorial(ctx) {
    const g = this.game;
    if (g.tutorialT <= 0 || g.dialogue || g.chapterCard || g.toast || g.boss.active || g.state !== 'playing' || this.isTouch) return;
    const elapsed = 12 - g.tutorialT;
    const alpha = clamp(elapsed / 0.6, 0, 1) * clamp(g.tutorialT / 1.5, 0, 1);
    const x = 38, y = 608;
    ctx.save();
    ctx.globalAlpha = alpha;
    this.panel(ctx, x, y, 406, 66, 8, 'rgba(6, 8, 15, 0.6)');
    ctx.fillStyle = 'rgba(226, 195, 148, 0.75)';
    ctx.font = this.serif(9.5);
    ctx.textAlign = 'left';
    ctx.fillText('旅 途 备 忘', x + 18, y + 19);
    ctx.fillStyle = 'rgba(229, 217, 198, 0.72)';
    ctx.font = this.sans(10);
    if (this.isTouch) {
      ctx.fillText('左侧移动 · 右侧「斩 / 枪 / 跃 / 闪」', x + 18, y + 38);
      ctx.fillText('长按枪键连续射击 · 「月」释放月华', x + 18, y + 55);
    } else {
      ctx.fillText('鼠标瞄准 · 左键攻击 · 右键点按盾反', x + 18, y + 38);
      ctx.fillText('1 剑 / 2 枪 · 长按右键防御 · SHIFT 闪避', x + 18, y + 55);
    }
    ctx.restore();
  }

  drawToast(ctx) {
    const g = this.game;
    if (!g.toast || g.dialogue || g.chapterCard) return;
    const t = g.toast.t;
    const d = g.toast.duration;
    const fade = Math.min(clamp(t / 0.25, 0, 1), clamp((d - t) / 0.5, 0, 1));
    const x = 400, y = this.isTouch ? 418 : 574, w = 480, h = 64;
    ctx.save();
    ctx.globalAlpha = fade;
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, 'rgba(7, 8, 15, 0)');
    grad.addColorStop(0.12, 'rgba(7, 8, 15, 0.72)');
    grad.addColorStop(0.88, 'rgba(7, 8, 15, 0.72)');
    grad.addColorStop(1, 'rgba(7, 8, 15, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(224, 183, 127, 0.26)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 40, y + 1);
    ctx.lineTo(x + w - 40, y + 1);
    ctx.moveTo(x + 40, y + h - 1);
    ctx.lineTo(x + w - 40, y + h - 1);
    ctx.stroke();
    ctx.fillStyle = 'rgba(228, 191, 135, 0.86)';
    ctx.font = this.serif(10.5);
    ctx.textAlign = 'left';
    ctx.fillText(g.toast.speaker, x + 44, y + 21);
    ctx.fillStyle = 'rgba(237, 225, 205, 0.88)';
    ctx.font = this.serif(14.5);
    const lines = wrapText(ctx, g.toast.text, w - 88);
    lines.slice(0, 2).forEach((line, i) => {
      ctx.fillText(line, x + 44, y + 42 + i * 19);
    });
    ctx.restore();
  }

  drawChapterCard(ctx) {
    const g = this.game;
    const c = g.chapterCard;
    if (!c || g.dialogue) return;
    const fade = Math.min(clamp(c.t / 0.6, 0, 1), clamp((c.duration - c.t) / 1.0, 0, 1));
    const cx = VIEW_W / 2;
    ctx.save();
    ctx.globalAlpha = fade;
    const bg = ctx.createLinearGradient(0, 190, VIEW_W, 190);
    bg.addColorStop(0, 'rgba(4, 5, 11, 0)');
    bg.addColorStop(0.2, 'rgba(4, 5, 11, 0.55)');
    bg.addColorStop(0.8, 'rgba(4, 5, 11, 0.55)');
    bg.addColorStop(1, 'rgba(4, 5, 11, 0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 208, VIEW_W, 112);

    ctx.strokeStyle = 'rgba(226, 189, 136, 0.38)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 196, 238);
    ctx.lineTo(cx - 38, 238);
    ctx.moveTo(cx + 38, 238);
    ctx.lineTo(cx + 196, 238);
    ctx.moveTo(cx - 170, 294);
    ctx.lineTo(cx - 72, 294);
    ctx.moveTo(cx + 72, 294);
    ctx.lineTo(cx + 170, 294);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(227, 193, 143, 0.85)';
    ctx.font = this.serif(9);
    ctx.fillText(c.no, cx, 232);
    ctx.fillStyle = 'rgba(246, 233, 214, 0.96)';
    ctx.font = this.serif(31, 400);
    ctx.fillText(c.title, cx, 275);
    ctx.fillStyle = 'rgba(215, 185, 148, 0.45)';
    ctx.font = '400 8px "Baskerville", "Times New Roman", serif';
    ctx.fillText(c.sub, cx, 308);
    ctx.restore();
  }

  drawAimHint(ctx) {
    const g = this.game;
    if (g.state !== 'playing' || g.dialogue) return;
    const hero = g.hero;
    if (hero.reloading) return;
    if (g.ammoHintT > 0) {
      // 预留动态提示
    }
  }

  drawBossCinematic(ctx) {
    const g = this.game;
    const boss = g.boss;
    if (!boss.active || boss.state !== 'intro' || g.dialogue) return;
    const p = clamp(boss.stateT / 2.05, 0, 1);
    const a = Math.min(clamp(boss.stateT / 0.35, 0, 1), clamp((2.05 - boss.stateT) / 0.45, 0, 1));
    ctx.save();
    ctx.globalAlpha = a * 0.82;
    ctx.fillStyle = '#030409';
    ctx.fillRect(0, 0, VIEW_W, 44);
    ctx.fillRect(0, VIEW_H - 44, VIEW_W, 44);
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(238, 218, 189, 0.9)';
    ctx.font = this.serif(19);
    ctx.textAlign = 'left';
    ctx.fillText('守门人 · 无相', 34, VIEW_H - 16);
    ctx.fillStyle = 'rgba(214, 173, 133, 0.5)';
    ctx.font = this.sans(7);
    ctx.fillText('THE FACELESS WARDEN', 191, VIEW_H - 18);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(221, 193, 160, 0.45)';
    ctx.fillText('圣所之门 · 已封锁', VIEW_W - 34, VIEW_H - 17);
    ctx.restore();
  }

  drawParrySlow(ctx) {
    const g = this.game;
    if (g.parrySlowT <= 0 && g.parryTextT <= 0) return;
    const slow = clamp(g.parrySlowT, 0, 1);
    const pulse = 0.5 + Math.sin(g.time * 10) * 0.5;
    ctx.save();
    if (slow > 0) {
      ctx.fillStyle = 'rgba(90, 196, 196, 0.045)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      const grad = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.28, VIEW_W / 2, VIEW_H / 2, VIEW_W * 0.7);
      grad.addColorStop(0, 'rgba(110, 225, 218, 0)');
      grad.addColorStop(0.72, 'rgba(88, 202, 201, 0.04)');
      grad.addColorStop(1, 'rgba(140, 238, 228, 0.12)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = `rgba(159, 236, 228, ${0.06 + pulse * 0.04})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const r = 160 + i * 60 + (1 - slow) * 60;
        ctx.beginPath();
        ctx.arc(VIEW_W / 2, VIEW_H / 2, r, 0, TAU);
        ctx.stroke();
      }
    }
    if (g.parryTextT > 0) {
      const a = clamp(g.parryTextT / 0.3, 0, 1) * clamp((1.15 - g.parryTextT) / 0.1, 0, 1);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = a;
      const y = 190;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 231, 179, 0.94)';
      ctx.font = this.serif(30);
      ctx.fillText('完美弹反', VIEW_W / 2, y);
      ctx.fillStyle = 'rgba(166, 234, 227, 0.6)';
      ctx.font = '400 8px "Baskerville", "Times New Roman", serif';
      ctx.fillText('PERFECT PARRY  ·  TIME FRACTURE', VIEW_W / 2, y + 20);
      ctx.strokeStyle = 'rgba(234, 205, 154, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(VIEW_W / 2 - 190, y + 34);
      ctx.lineTo(VIEW_W / 2 - 30, y + 34);
      ctx.moveTo(VIEW_W / 2 + 30, y + 34);
      ctx.lineTo(VIEW_W / 2 + 190, y + 34);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawLowHealth(ctx) {
    const g = this.game;
    const hero = g.hero;
    const hp = hero.hp / hero.maxHp;
    if (hp > 0.3 || !hero.alive || g.state === 'menu') return;
    const pulse = 0.08 + Math.sin(g.time * 5.5) * 0.028;
    const grad = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.24, VIEW_W / 2, VIEW_H / 2, VIEW_W * 0.68);
    grad.addColorStop(0, 'rgba(122, 13, 33, 0)');
    grad.addColorStop(0.72, `rgba(137, 16, 38, ${pulse * 0.5})`);
    grad.addColorStop(1, `rgba(180, 23, 48, ${pulse})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  drawSoundState(ctx) {
    const g = this.game;
    if (g.audio.enabled) return;
    ctx.save();
    ctx.fillStyle = 'rgba(210, 189, 164, 0.35)';
    ctx.font = this.sans(7);
    ctx.textAlign = 'right';
    ctx.fillText('声音已关闭  ·  M', 1252, 704);
    ctx.restore();
  }

  drawDialogue(ctx) {
    const g = this.game;
    const d = g.dialogue;
    if (!d) return;
    const line = d.lines[d.index];
    if (!line) return;
    const x = 148, y = 542, w = 984, h = 144;
    const shown = Math.floor(line.chars);
    const text = line.text.slice(0, shown);

    ctx.save();
    const bottomFade = ctx.createLinearGradient(0, 470, 0, VIEW_H);
    bottomFade.addColorStop(0, 'rgba(3, 4, 9, 0)');
    bottomFade.addColorStop(1, 'rgba(3, 4, 9, 0.72)');
    ctx.fillStyle = bottomFade;
    ctx.fillRect(0, 460, VIEW_W, 260);

    cutRect(ctx, x, y, w, h, 12);
    const bg = ctx.createLinearGradient(x, y, x, y + h);
    bg.addColorStop(0, 'rgba(10, 10, 18, 0.9)');
    bg.addColorStop(1, 'rgba(5, 6, 12, 0.92)');
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(228, 192, 141, 0.27)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 左侧装饰
    ctx.fillStyle = 'rgba(192, 52, 71, 0.85)';
    ctx.fillRect(x + 20, y + 24, 2, h - 48);
    ctx.fillStyle = 'rgba(226, 190, 139, 0.9)';
    drawDiamond(ctx, x + 21, y + 34, 4);
    ctx.fill();

    ctx.fillStyle = 'rgba(238, 201, 148, 0.9)';
    ctx.font = this.serif(12);
    ctx.textAlign = 'left';
    ctx.fillText(line.speaker, x + 48, y + 35);
    ctx.fillStyle = 'rgba(222, 205, 181, 0.3)';
    ctx.font = this.sans(6.5);
    ctx.fillText('SPEAKER', x + 48 + ctx.measureText(line.speaker).width + 16, y + 33);
    ctx.strokeStyle = 'rgba(232, 198, 148, 0.16)';
    ctx.beginPath();
    ctx.moveTo(x + 48, y + 46);
    ctx.lineTo(x + w - 48, y + 46);
    ctx.stroke();

    ctx.fillStyle = 'rgba(240, 228, 210, 0.91)';
    ctx.font = this.serif(16);
    const lines = wrapText(ctx, text, w - 100);
    lines.slice(0, 3).forEach((l, i) => {
      ctx.fillText(l, x + 48, y + 79 + i * 28);
    });

    if (shown >= line.text.length) {
      ctx.save();
      ctx.globalAlpha = 0.45 + Math.sin(g.time * 4) * 0.18;
      ctx.fillStyle = 'rgba(231, 198, 150, 0.8)';
      ctx.font = this.sans(8);
      ctx.textAlign = 'right';
      const last = d.index >= d.lines.length - 1;
      ctx.fillText(this.isTouch ? (last ? '轻触屏幕 · 结束' : '轻触屏幕 · 继续') : (last ? '左键 / SPACE  结束' : '左键 / SPACE  继续'), x + w - 34, y + h - 17);
      drawDiamond(ctx, x + w - 132, y + h - 20, 3);
      ctx.fill();
      ctx.restore();
    }

    // 进度点
    for (let i = 0; i < d.lines.length; i++) {
      ctx.fillStyle = i === d.index ? 'rgba(231, 193, 137, 0.9)' : 'rgba(223, 202, 173, 0.18)';
      ctx.beginPath();
      ctx.arc(x + w - 34 - (d.lines.length - 1 - i) * 12, y + 29, 1.7, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}
