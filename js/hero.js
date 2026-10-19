'use strict';

class Hero {
  constructor(game) {
    this.game = game;
    this.maxHp = 120;
    this.maxAmmo = 9;
    this.w = 30;
    this.h = 78;
    this.reset(LEVEL.start.x, LEVEL.start.y);
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.dir = 1;
    this.hp = this.maxHp;
    this.energy = 0;
    this.ammo = this.maxAmmo;
    this.onGround = false;
    this.coyote = 0;
    this.jumps = 0;
    this.jumpBuffer = 0;
    this.animTime = 0;
    this.swordTimer = 0;
    this.swordDuration = 0.34;
    this.swordElapsed = 0;
    this.swordHitDone = false;
    this.combo = 0;
    this.comboWindow = 0;
    this.comboQueued = false;
    this.attackSeq = 0;
    this.shootTimer = 0;
    this.gunPoseTimer = 0;
    this.shootCooldown = 0;
    this.muzzleTimer = 0;
    this.gunKick = 0;
    this.reloading = false;
    this.reloadTimer = 0;
    this.reloadTotal = 0.86;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.dashDust = 0;
    this.invuln = 0;
    this.hurtTimer = 0;
    this.specialTimer = 0;
    this.specialCd = 0;
    this.aim = 0;
    this.weapon = 'sword';
    this.aimWorldAngle = 0;
    this.aimLocalAngle = 0;
    this.aimPoint = { x: x + 240, y: y - 58 };
    this.aimVector = { x: 1, y: 0 };
    this.guarding = false;
    this.guardTime = 0;
    this.guardFlash = 0;
    this.guardBlockFlash = 0;
    this.weaponFlash = 0;
    this.footstep = 0;
    this.afterimages = [];
    this.alive = true;
    this.trailTimer = 0;
  }

  get bounds() {
    return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h };
  }

  get muzzle() {
    const angle = this.aimWorldAngle;
    return {
      x: this.x + Math.cos(angle) * 40,
      y: this.y - 58 + Math.sin(angle) * 40,
      angle
    };
  }

  get isStudent() {
    return this.game.appearance && this.game.appearance.outfit === 'student';
  }

  get hairColor() {
    const look = this.game.appearance || DEFAULT_APPEARANCE;
    return this.isStudent ? look.studentHair : look.bladeHair;
  }

  setWeapon(weapon, game) {
    if (weapon !== 'gun') weapon = 'sword';
    if (this.weapon === weapon) return;
    this.weapon = weapon;
    this.swordTimer = 0;
    this.swordElapsed = 0;
    this.combo = 0;
    this.comboWindow = 0;
    this.comboQueued = false;
    this.shootTimer = 0;
    this.weaponFlash = 0.35;
    game.audio.weaponSwitch(weapon);
    game.spawnBurst(
      this.x + Math.cos(this.aimWorldAngle) * 20,
      this.y - 62 + Math.sin(this.aimWorldAngle) * 20,
      weapon === 'sword' ? '#f2c683' : '#9fe4de',
      11, 130
    );
    game.onWeaponChanged();
  }

  raiseGuard(game) {
    this.guarding = true;
    this.guardTime = 0;
    this.guardFlash = 0.32;
    this.swordTimer = 0;
    this.combo = 0;
    this.comboWindow = 0;
    this.comboQueued = false;
    game.audio.guardRaise();
    game.spawnShockwave(
      this.x + Math.cos(this.aimWorldAngle) * 26,
      this.y - 58 + Math.sin(this.aimWorldAngle) * 26,
      46, '#9fe0da', 0.4
    );
  }

  startSword(step) {
    this.combo = step;
    this.swordDuration = [0.32, 0.32, 0.43][step];
    this.swordTimer = this.swordDuration;
    this.swordElapsed = 0;
    this.swordHitDone = false;
    this.comboQueued = false;
    this.comboWindow = 0;
    this.attackSeq++;
    this.shootTimer = 0;
    this.game.audio.sword(step);
    this.game.addShake(step === 2 ? 2.6 : 1.1);
    if (this.onGround) this.vx += Math.cos(this.aimWorldAngle) * (step === 2 ? 95 : 70) * 0.8;
    // 起手刀光碎屑
    const mx = this.x + Math.cos(this.aimWorldAngle) * 28;
    const my = this.y - 58 + Math.sin(this.aimWorldAngle) * 28;
    for (let i = 0; i < 4; i++) {
      this.game.spawnParticle({
        x: mx + rand(-18, 18), y: my + rand(-25, 20),
        vx: Math.cos(this.aimWorldAngle) * rand(30, 150) + rand(-30, 30),
        vy: Math.sin(this.aimWorldAngle) * rand(30, 150) + rand(-80, 20),
        life: rand(0.15, 0.3), size: rand(0.7, 2.2),
        color: '#f6e9cf', kind: 'streak', drag: 4
      });
    }
  }

  startReload(manual = false) {
    if (this.reloading || this.ammo === this.maxAmmo) return;
    this.reloading = true;
    this.reloadTotal = manual ? 0.72 : 0.88;
    this.reloadTimer = this.reloadTotal;
    this.shootTimer = 0;
    this.game.audio.reload();
  }

  fire(game) {
    if (this.reloading) return;
    if (this.ammo <= 0) {
      game.audio.empty();
      this.startReload(false);
      return;
    }
    this.ammo--;
    const m = this.muzzle;
    game.spawnPlayerBullet(m.x, m.y, m.angle, this);
    this.shootCooldown = 0.142;
    this.shootTimer = 0.16;
    this.gunPoseTimer = 0.95;
    this.muzzleTimer = 0.075;
    this.gunKick = 1;
    this.vx -= Math.cos(this.aimWorldAngle) * 26;
    game.audio.shot();
    game.addShake(1.7);
    game.spawnMuzzleSmoke(m.x, m.y, this.aimWorldAngle);
    this.energy = Math.min(100, this.energy + 0.9);
    if (this.ammo <= 0) {
      this.startReload(false);
    }
  }

  useSpecial(game) {
    if (this.energy < 100 || this.specialTimer > 0) return false;
    this.energy = 0;
    this.specialTimer = 1.15;
    this.specialCd = 1.15;
    this.invuln = Math.max(this.invuln, 1.25);
    this.hp = Math.min(this.maxHp, this.hp + 18);
    game.triggerSpecial(this);
    return true;
  }

  hurt(amount, sourceX, game, source = null, opts = {}) {
    return this.incoming(amount, sourceX, game, source, opts) !== 'immune';
  }

  incoming(amount, sourceX, game, source = null, opts = {}) {
    if (this.invuln > 0 || this.dashTimer > 0 || !this.alive) return 'immune';

    let guarded = false;
    if (this.guarding && !opts.ignoreGuard) {
      if (this.guardTime <= 0.5) {
        game.onPerfectParry(this, source, opts.projectile || null);
        this.invuln = Math.max(this.invuln, 0.22);
        this.guardFlash = 0.5;
        return 'perfect';
      }
      amount = Math.max(0.5, amount * 0.7);
      game.onGuardBlock(this, source, opts.projectile || null, amount);
      this.guardBlockFlash = 0.24;
      guarded = true;
    }

    this.applyDamage(amount, sourceX, game);
    return guarded ? 'blocked' : 'hit';
  }

  applyDamage(amount, sourceX, game) {
    this.hp = Math.max(0, this.hp - amount);
    this.invuln = 1.0;
    this.hurtTimer = 0.32;
    this.specialTimer = 0;
    const dir = this.x >= sourceX ? 1 : -1;
    this.vx = dir * 330;
    this.vy = -270;
    this.onGround = false;
    this.swordTimer = 0;
    this.combo = 0;
    this.comboWindow = 0;
    this.comboQueued = false;
    game.audio.hurt();
    game.addShake(9);
    game.hitFlash = Math.max(game.hitFlash, 0.32);
    game.hitFlashColor = '255,68,92';
    game.spawnBurst(this.x, this.y - 45, '#ff5b70', 20, 240);
    game.spawnDamageText(this.x, this.y - 85, Math.round(amount * 10) / 10, 'damage-player');
    if (this.hp <= 0) {
      this.alive = false;
      game.onHeroDeath();
    } else {
      game.onHeroHurt();
    }
  }

  heal(amount) {
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - before;
  }

  update(dt, game) {
    this.animTime += dt;
    this.invuln = Math.max(0, this.invuln - dt);
    this.hurtTimer = Math.max(0, this.hurtTimer - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.shootCooldown = Math.max(0, this.shootCooldown - dt);
    this.shootTimer = Math.max(0, this.shootTimer - dt);
    this.gunPoseTimer = Math.max(0, this.gunPoseTimer - dt);
    this.muzzleTimer = Math.max(0, this.muzzleTimer - dt);
    this.specialCd = Math.max(0, this.specialCd - dt);
    this.gunKick = damp(this.gunKick, 0, 18, dt);
    this.guardFlash = Math.max(0, this.guardFlash - dt);
    this.guardBlockFlash = Math.max(0, this.guardBlockFlash - dt);
    this.weaponFlash = Math.max(0, this.weaponFlash - dt);
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    this.dashTimer = Math.max(0, this.dashTimer - dt);
    this.afterimages = this.afterimages.filter(a => (a.life -= dt) > 0);

    if (this.reloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.reloading = false;
        this.ammo = this.maxAmmo;
        this.game.spawnReloadRing(this.x, this.y - 63);
      }
    }

    const input = game.input;
    const canControl = game.state === 'playing' && !game.dialogue;
    if (!canControl) {
      this.guarding = false;
      this.guardTime = 0;
      this.vx = damp(this.vx, 0, 18, dt);
      this.updatePhysics(dt, game);
      this.updateSword(dt, game);
      return;
    }

    const move = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0);

    // 鼠标 / 自动瞄准：攻击方向就是光标指向
    const aimPoint = game.getAimWorldPoint();
    if (aimPoint.source === 'facing' && move !== 0) {
      this.dir = move;
      aimPoint.x = this.x + move * 240;
      aimPoint.y = this.y - 58;
    }
    const ox = this.x;
    const oy = this.y - 58;
    const aimDx = aimPoint.x - ox;
    const aimDy = aimPoint.y - oy;
    if (Math.hypot(aimDx, aimDy) > 7) {
      const angle = Math.atan2(aimDy, aimDx);
      this.aimWorldAngle = angle;
      this.aimLocalAngle = Math.atan2(Math.sin(angle), Math.abs(Math.cos(angle)));
      if (Math.abs(Math.cos(angle)) > 0.025) this.dir = Math.cos(angle) >= 0 ? 1 : -1;
    }
    this.aimPoint = aimPoint;
    this.aimVector = { x: Math.cos(this.aimWorldAngle), y: Math.sin(this.aimWorldAngle) };

    // 数字键 / 触屏按钮切换武器
    if (input.wasPressed('weapon1')) this.setWeapon('sword', game);
    if (input.wasPressed('weapon2')) this.setWeapon('gun', game);
    if (input.wasPressed('switchWeapon')) {
      this.setWeapon(this.weapon === 'sword' ? 'gun' : 'sword', game);
    }

    // 盾牌：右键点按进入 0.5s 完美弹反窗口，长按转为 30% 减伤防御
    const wantsGuard = input.isDown('guard') && this.dashTimer <= 0 && (this.guarding || this.hurtTimer <= 0);
    if (wantsGuard) {
      if (!this.guarding) this.raiseGuard(game);
      this.guardTime += dt;
    } else if (this.guarding) {
      this.guarding = false;
      this.guardTime = 0;
    }

    // 剑技输入
    const attackAllowed = game.time >= (game.suppressAttackUntil || 0);
    if (!this.guarding && attackAllowed && this.weapon === 'sword' && input.wasPressed('attack') && this.hurtTimer <= 0 && !this.reloading) {
      if (this.swordTimer > 0) {
        this.comboQueued = true;
      } else if (this.comboWindow > 0) {
        this.startSword(Math.min(2, this.combo + 1));
      } else {
        this.startSword(0);
      }
    }

    // 枪击
    if (!this.guarding && attackAllowed && this.weapon === 'gun' && input.isDown('attack') && this.swordTimer <= 0 && this.hurtTimer <= 0) {
      if (this.shootCooldown <= 0 && !this.reloading) this.fire(game);
    }
    if (input.wasPressed('reload') && this.weapon === 'gun') this.startReload(true);

    // 换弹完成提示
    if (this.weapon === 'gun' && !this.reloading && this.ammo === 0) this.startReload(false);

    // 月华爆发
    if (!this.guarding && input.wasPressed('special')) this.useSpecial(game);

    // 闪避
    if (input.wasPressed('dash') && this.dashCooldown <= 0 && this.hurtTimer <= 0) {
      this.dashTimer = 0.19;
      this.dashCooldown = 0.58;
      this.invuln = Math.max(this.invuln, 0.24);
      this.guarding = false;
      this.guardTime = 0;
      this.vx = this.dir * 790;
      this.vy = 0;
      this.jumpBuffer = 0;
      game.audio.dash();
      game.addShake(3);
      game.spawnDashBurst(this.x, this.y - 42, this.dir);
      this.trailTimer = 0;
      if (this.swordTimer > 0) this.swordTimer = Math.min(this.swordTimer, 0.08);
    }

    // 跳跃
    if (input.wasPressed('jump')) this.jumpBuffer = 0.13;
    if (this.jumpBuffer > 0 && this.hurtTimer <= 0) {
      if (this.onGround || this.coyote > 0) {
        this.vy = -850;
        this.jumps = 1;
        this.onGround = false;
        this.coyote = 0;
        this.jumpBuffer = 0;
        game.audio.jump();
        game.spawnJumpDust(this.x, this.y);
      } else if (this.jumps < 2) {
        this.vy = -790;
        this.jumps = 2;
        this.jumpBuffer = 0;
        game.audio.doubleJump();
        game.spawnAirJump(this.x, this.y - 42);
      }
    }
    if (!input.isDown('jump') && this.vy < -260) {
      this.vy += 2100 * dt;
    }

    // 水平移动
    if (this.hurtTimer <= 0 && this.dashTimer <= 0) {
      const attackSlow = this.swordTimer > 0 ? 0.52 : 1;
      const guardSlow = this.guarding ? 0.46 : 1;
      if (move !== 0) {
        const target = move * 335 * attackSlow * guardSlow;
        const rate = this.onGround ? 17 : 10;
        this.vx = damp(this.vx, target, rate, dt);
      } else {
        this.vx = damp(this.vx, 0, this.onGround ? 20 : 5, dt);
      }
    } else if (this.dashTimer > 0) {
      this.vx = this.dir * 790;
      this.vy = 0;
      this.trailTimer -= dt;
      if (this.trailTimer <= 0) {
        this.trailTimer = 0.028;
        this.afterimages.push({ x: this.x, y: this.y, dir: this.dir, life: 0.24, maxLife: 0.24 });
        game.spawnParticle({
          x: this.x + rand(-8, 8), y: this.y - rand(10, 70),
          vx: -this.dir * rand(80, 230), vy: rand(-20, 20),
          life: rand(0.15, 0.32), size: rand(0.8, 2.2),
          color: '#a5e5df', kind: 'streak', drag: 2.5
        });
      }
    } else {
      this.vx = damp(this.vx, 0, 9, dt);
    }

    // 始终施加重力，确保站立时也能持续贴合地面（避免隔帧失去 grounded 状态）
    if (this.dashTimer <= 0) {
      this.vy += 2360 * dt;
      this.vy = Math.min(this.vy, 1250);
    }

    if (this.onGround && Math.abs(this.vx) > 80) {
      this.footstep -= dt;
      if (this.footstep <= 0) {
        this.footstep = 0.19;
        game.spawnFootstep(this.x, this.y, this.dir);
      }
    }

    this.updateSword(dt, game);
    this.updatePhysics(dt, game);

    if (this.onGround) {
      this.jumps = 0;
      this.coyote = 0.1;
    } else {
      this.coyote = Math.max(0, this.coyote - dt);
    }

    if (this.y > 830) game.onHeroFall();
    if (this.energy >= 100 && !REDUCED_MOTION && chance(0.25)) {
      game.spawnEnergyMote(this);
    }
  }

  updateSword(dt, game) {
    if (this.swordTimer > 0) {
      this.swordTimer = Math.max(0, this.swordTimer - dt);
      this.swordElapsed += dt;
      const p = this.swordElapsed / this.swordDuration;
      if (!this.swordHitDone && p >= 0.24) {
        this.swordHitDone = true;
        game.applySwordHits(this);
      }
      if (this.swordTimer <= 0) {
        this.swordTimer = 0;
        this.comboWindow = 0.36;
        if (this.comboQueued) {
          this.comboQueued = false;
          this.startSword(this.combo < 2 ? this.combo + 1 : 0);
        }
      }
    } else if (this.comboWindow > 0) {
      this.comboWindow -= dt;
      if (this.comboWindow <= 0) this.combo = 0;
    }
  }

  updatePhysics(dt, game) {
    const prevY = this.y;
    this.onGround = false;

    this.x += this.vx * dt;
    let b = this.bounds;
    for (const s of game.solids) {
      if (!rectsOverlap(b, s)) continue;
      if (this.vx > 0) {
        this.x = s.x - this.w / 2 - 0.01;
      } else if (this.vx < 0) {
        this.x = s.x + s.w + this.w / 2 + 0.01;
      }
      this.vx = 0;
      b = this.bounds;
    }
    this.x = clamp(this.x, 20, WORLD_W - 20);

    this.y += this.vy * dt;
    b = this.bounds;

    for (const s of game.solids) {
      if (!rectsOverlap(b, s)) continue;
      if (this.vy >= 0 && prevY <= s.y + 3) {
        this.y = s.y;
        this.vy = 0;
        this.onGround = true;
      } else if (this.vy < 0 && prevY - this.h >= s.y + s.h - 3) {
        this.y = s.y + s.h + this.h;
        this.vy = 0;
      } else {
        // 从侧面挤入时向上顶出
        if (this.y > s.y + s.h / 2) {
          this.y = s.y;
          this.vy = 0;
          this.onGround = true;
        }
      }
      b = this.bounds;
    }

    for (const p of game.platforms) {
      if (this.vy < 0) continue;
      if (prevY <= p.y + 1 && this.y >= p.y && this.x + this.w / 2 > p.x + 2 && this.x - this.w / 2 < p.x + p.w - 2) {
        this.y = p.y;
        this.vy = 0;
        this.onGround = true;
      }
    }

    if (this.onGround && this.dashTimer > 0) {
      this.dashTimer = 0;
      game.spawnDashBurst(this.x, this.y - 35, this.dir);
    }
  }

  draw(ctx, cam, time, game, extraScale = 1) {
    if (!this.alive && game.state !== 'victory' && game.state !== 'dying') return;
    const floor = game.floorAt(this.x, this.y);
    if (!REDUCED_MOTION && floor !== null) {
      const height = clamp(this.y - floor, 0, 320);
      ctx.save();
      ctx.globalAlpha = 0.34 * (1 - height / 380);
      const sw = 27 + height * 0.04;
      const g = ctx.createRadialGradient(this.x - cam, floor + 2, 0, this.x - cam, floor + 2, sw);
      g.addColorStop(0, 'rgba(3, 5, 12, 0.82)');
      g.addColorStop(1, 'rgba(3, 5, 12, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(this.x - cam, floor + 1, sw, 7, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // 逆光轮廓：让少女从暗色废墟中浮现
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.16;
    drawGlow(ctx, this.x - cam, this.y - 58, 74 * extraScale, '#96d7d8', 0.2);
    ctx.globalAlpha = 0.08;
    drawGlow(ctx, this.x - cam + 18 * this.dir, this.y - 86, 38 * extraScale, '#f08a95', 0.18);
    ctx.restore();

    // 月华满能光环
    if (this.energy >= 100 && !REDUCED_MOTION) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.22 + Math.sin(time * 4) * 0.06;
      drawGlow(ctx, this.x - cam, this.y - 44, 64, '#f0c889', 0.22);
      ctx.restore();
    }

    // 冲刺残影
    for (const a of this.afterimages) {
      const alpha = (a.life / a.maxLife) * 0.22;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.globalCompositeOperation = 'screen';
      ctx.translate(a.x - cam, a.y);
      ctx.scale(a.dir, 1);
      ctx.fillStyle = '#9fe2dc';
      ctx.beginPath();
      ctx.ellipse(0, -100, 12, 14, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-12, -88);
      ctx.lineTo(12, -88);
      ctx.lineTo(8, -42);
      ctx.lineTo(-8, -42);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#9fe2dc';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-4, -42);
      ctx.lineTo(-11, -3);
      ctx.moveTo(5, -42);
      ctx.lineTo(11, -3);
      ctx.stroke();
      ctx.restore();
    }

    const running = this.onGround && Math.abs(this.vx) > 45 && this.dashTimer <= 0;
    const runPhase = this.animTime * 13.5;
    const bob = running ? Math.abs(Math.sin(runPhase)) * 2.2 : Math.sin(this.animTime * 2.1) * 0.9;
    const lean = this.dashTimer > 0 ? 12 : (running ? 3.2 : 0) + (this.swordTimer > 0 ? 3 : 0);
    const blink = this.invuln > 0 && this.hurtTimer <= 0 && this.specialTimer <= 0 && Math.floor(time * 24) % 2 === 0;
    let alpha = blink ? 0.48 : 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x - cam, this.y + bob);
    if (this.dashTimer > 0) ctx.rotate(-0.07);
    ctx.scale(this.dir * 0.95 * extraScale, 1.08 * extraScale);

    const student = this.isStudent;
    // 武器拖尾在身体后方先画一层柔光
    if (this.swordTimer > 0) this.drawSwordTrail(ctx, true);
    if (!student) this.drawScarf(ctx, time, running);
    this.drawHairBack(ctx, time, running);
    this.drawBackArm(ctx, running, time);

    let backFoot, frontFoot;
    if (this.dashTimer > 0) {
      backFoot = { x: -25, y: -8 };
      frontFoot = { x: 12, y: -3 };
    } else if (!this.onGround) {
      const rise = this.vy < 0;
      backFoot = { x: rise ? -16 : -18, y: rise ? -14 : -7 };
      frontFoot = { x: rise ? 11 : 15, y: rise ? -8 : -16 };
    } else if (running) {
      const s = Math.sin(runPhase);
      backFoot = { x: -7 - s * 15, y: -Math.max(0, s) * 11 };
      frontFoot = { x: 7 + s * 15, y: -Math.max(0, -s) * 11 };
    } else if (this.guarding || this.swordTimer > 0) {
      backFoot = { x: -16, y: 0 };
      frontFoot = { x: 17, y: 0 };
    } else {
      backFoot = { x: -8, y: 0 };
      frontFoot = { x: 8, y: 0 };
    }

    if (student) {
      this.drawLegSchool(ctx, -5, -45, backFoot.x, backFoot.y, -5, true);
      this.drawLegSchool(ctx, 4, -45, frontFoot.x, frontFoot.y, 4, false);
      this.drawSchoolBag(ctx, time, running);
    } else {
      this.drawLeg(ctx, -5, -45, backFoot.x, backFoot.y, -5, '#242138', '#151522', 0.85);
      this.drawLeg(ctx, 4, -45, frontFoot.x, frontFoot.y, 4, '#3a3450', '#1c1a2b', 1);
    }

    if (!student) this.drawCoatTails(ctx, time, running);
    if (student) this.drawTorsoSchool(ctx, lean, running, time);
    else this.drawTorso(ctx, lean, running, time);

    // 头部
    const headShift = lean * 0.55;
    this.drawHead(ctx, headShift, time, running);

    // 前臂与武器 / 盾牌
    if (this.guarding) {
      this.drawGuard(ctx, time);
    } else {
      this.drawFrontArmAndWeapon(ctx, time, lean);
      if (this.swordTimer > 0) this.drawSwordTrail(ctx, false);
      if (this.muzzleTimer > 0 && this.weapon === 'gun') this.drawMuzzleFlash(ctx);
    }
    if (student) this.drawSchoolRibbon(ctx, time);
    else this.drawScarfKnot(ctx, time);

    this.drawSpecialAura(ctx, time);
    ctx.restore();
  }

  getHairPalette() {
    const base = this.hairColor;
    return {
      base,
      light: lighten(base, 0.5),
      mid: lighten(base, 0.18),
      dark: darken(base, 0.28),
      shadow: darken(base, 0.5)
    };
  }

  drawLeg(ctx, hx, hy, fx, fy, bend, color, bootColor, dark) {
    const ankleY = fy - 7;
    const kx = (hx + fx) / 2 + bend;
    const ky = (hy + ankleY) / 2 - 2;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.quadraticCurveTo(kx, ky, fx, ankleY);
    ctx.stroke();
    ctx.strokeStyle = dark > 0.9 ? '#343049' : '#1d1b2d';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(hx + 2, hy - 6);
    ctx.quadraticCurveTo(kx + 3, ky, fx + 2, ankleY - 7);
    ctx.stroke();
    // 靴子
    ctx.fillStyle = bootColor;
    ctx.beginPath();
    ctx.moveTo(fx - 5, ankleY + 2);
    ctx.lineTo(fx + 2, ankleY - 5);
    ctx.lineTo(fx + 10, ankleY + 1);
    ctx.lineTo(fx + 11, fy + 1);
    ctx.lineTo(fx - 6, fy + 1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(194, 184, 214, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fx - 3, ankleY + 1);
    ctx.lineTo(fx + 7, ankleY + 1);
    ctx.stroke();
    ctx.restore();
  }

  drawLegSchool(ctx, hx, hy, fx, fy, bend, back) {
    const look = this.game.appearance;
    const ankleY = fy - 7;
    const kx = (hx + fx) / 2 + bend;
    const ky = (hy + ankleY) / 2 - 2;
    const skin = back ? '#d7ad9c' : '#efc9b5';
    const sock = look.socks;
    const sockDark = darken(sock, 0.22);
    const shoe = look.shoes || '#121117';
    ctx.save();
    ctx.lineCap = 'round';

    // 大腿（裙摆以下露出）
    ctx.strokeStyle = skin;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.quadraticCurveTo(kx, ky, fx, ankleY);
    ctx.stroke();

    // 过膝袜：从膝上延伸到脚踝
    const thighTopX = lerp(hx, fx, 0.28);
    const thighTopY = lerp(hy, ankleY, 0.28);
    ctx.strokeStyle = sock;
    ctx.lineWidth = 9.6;
    ctx.beginPath();
    ctx.moveTo(thighTopX, thighTopY);
    ctx.quadraticCurveTo(kx, ky, fx, ankleY + 1);
    ctx.stroke();
    // 袜口
    ctx.strokeStyle = lighten(sock, 0.26);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(thighTopX - 3, thighTopY - 1);
    ctx.lineTo(thighTopX + 3, thighTopY + 2);
    ctx.stroke();
    // 高光
    ctx.strokeStyle = hexToRgba(lighten(sock, 0.55), 0.22);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(thighTopX + 3, thighTopY + 5);
    ctx.quadraticCurveTo(kx + 3, ky, fx + 2, ankleY - 5);
    ctx.stroke();

    // 小皮鞋
    ctx.fillStyle = shoe;
    ctx.beginPath();
    ctx.moveTo(fx - 6, ankleY + 2);
    ctx.lineTo(fx + 1, ankleY - 4);
    ctx.lineTo(fx + 10, ankleY + 1);
    ctx.lineTo(fx + 11, fy + 2);
    ctx.lineTo(fx - 7, fy + 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = hexToRgba(lighten(shoe, 0.4), 0.36);
    ctx.beginPath();
    ctx.ellipse(fx + 3, ankleY + 1, 5, 1.2, -0.08, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = darken(shoe, 0.45);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(fx - 6, fy + 2);
    ctx.lineTo(fx + 10, fy + 2);
    ctx.stroke();
    // 袜子上的细纹
    ctx.strokeStyle = hexToRgba(sockDark, 0.5);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(thighTopX + 1, thighTopY + 9);
    ctx.lineTo(kx + 1, ky + 1);
    ctx.stroke();
    ctx.restore();
  }

  drawBackArm(ctx, running, time) {
    const swing = running ? Math.sin(this.animTime * 13.5) * 8 : Math.sin(time * 2 + 1) * 1.5;
    const student = this.isStudent;
    ctx.save();
    ctx.lineCap = 'round';

    if (student) {
      const top = this.game.appearance.top;
      // 后臂短袖
      ctx.fillStyle = top;
      ctx.beginPath();
      ctx.ellipse(-12, -82, 6.4, 7.2, -0.35, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = hexToRgba(this.game.appearance.skirt, 0.45);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(-12, -82, 5.2, 0.2, 2.2);
      ctx.stroke();

      ctx.strokeStyle = '#e7c0ac';
      ctx.lineWidth = 6.2;
      ctx.beginPath();
      ctx.moveTo(-11, -80);
      ctx.quadraticCurveTo(-20, -72 + swing * 0.28, -16 + swing * 0.3, -60);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 232, 211, 0.3)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-9, -79);
      ctx.quadraticCurveTo(-17, -71, -14 + swing * 0.3, -61);
      ctx.stroke();
      ctx.fillStyle = '#edc6b2';
      ctx.beginPath();
      ctx.arc(-16 + swing * 0.3, -57, 3.2, 0, TAU);
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.strokeStyle = '#141324';
    ctx.lineWidth = 7.5;
    ctx.beginPath();
    ctx.moveTo(-11, -82);
    ctx.quadraticCurveTo(-20, -72 + swing * 0.28, -16 + swing * 0.3, -59);
    ctx.stroke();
    ctx.fillStyle = '#e6c4ae';
    ctx.beginPath();
    ctx.arc(-16 + swing * 0.3, -57, 3.6, 0, TAU);
    ctx.fill();
    // 腰侧枪套
    ctx.fillStyle = '#171522';
    ctx.beginPath();
    ctx.moveTo(-17, -44);
    ctx.lineTo(-8, -50);
    ctx.lineTo(-5, -38);
    ctx.lineTo(-13, -32);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(188, 109, 104, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-15, -44);
    ctx.lineTo(-8, -46);
    ctx.stroke();
    ctx.restore();
  }

  drawCoatTails(ctx, time, running) {
    const sway = Math.sin(time * 4.4 + this.animTime * 2) * 4 + (running ? -5 : 0);
    ctx.save();
    ctx.fillStyle = '#2b1626';
    ctx.beginPath();
    ctx.moveTo(-9, -52);
    ctx.quadraticCurveTo(-22, -42, -31 + sway, -17);
    ctx.lineTo(-16 + sway, -22);
    ctx.lineTo(-5, -40);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(151, 44, 63, 0.72)';
    ctx.beginPath();
    ctx.moveTo(7, -52);
    ctx.quadraticCurveTo(22, -40, 28 + sway * 0.7, -16);
    ctx.lineTo(15 + sway * 0.6, -21);
    ctx.lineTo(3, -40);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(235, 203, 177, 0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-7, -50);
    ctx.quadraticCurveTo(-18, -39, -27 + sway, -19);
    ctx.stroke();
    ctx.restore();
  }

  drawSchoolBag(ctx, time, running) {
    const look = this.game.appearance;
    const sway = running ? Math.sin(this.animTime * 13.5) * 2 : Math.sin(time * 2.3) * 0.8;
    const base = darken(look.skirt, 0.48);
    ctx.save();
    ctx.translate(-16 + sway, -44);
    ctx.rotate(0.12 + sway * 0.006);
    ctx.fillStyle = base;
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.quadraticCurveTo(-11, 7, -8, 17);
    ctx.lineTo(6, 18);
    ctx.quadraticCurveTo(9, 6, 6, -4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = darken(base, 0.24);
    ctx.beginPath();
    ctx.moveTo(-8, -3);
    ctx.lineTo(6, -3);
    ctx.lineTo(5, 5);
    ctx.lineTo(-7, 5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hexToRgba(lighten(base, 0.35), 0.35);
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-7, 6);
    ctx.lineTo(5, 6);
    ctx.stroke();
    ctx.fillStyle = '#c8a45f';
    ctx.fillRect(-1.5, 4, 3, 3);
    // 肩带
    ctx.strokeStyle = hexToRgba(darken(look.skirt, 0.32), 0.9);
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(6, -4);
    ctx.quadraticCurveTo(10, -22, 20, -39);
    ctx.stroke();
    ctx.restore();
  }

  drawTorso(ctx, lean, running, time) {
    ctx.save();
    // 腰身
    const body = ctx.createLinearGradient(-14, -88, 14, -44);
    body.addColorStop(0, '#453d5c');
    body.addColorStop(0.45, '#282336');
    body.addColorStop(1, '#171522');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-12 + lean, -85);
    ctx.quadraticCurveTo(-15 + lean, -73, -8, -57);
    ctx.quadraticCurveTo(-7, -49, -10, -45);
    ctx.lineTo(9, -45);
    ctx.quadraticCurveTo(7, -50, 8, -57);
    ctx.quadraticCurveTo(14 + lean, -73, 12 + lean, -85);
    ctx.closePath();
    ctx.fill();

    // 内衬与领口
    ctx.fillStyle = '#e9decf';
    ctx.beginPath();
    ctx.moveTo(-8 + lean, -84);
    ctx.lineTo(8 + lean, -84);
    ctx.lineTo(6 + lean, -73);
    ctx.lineTo(1 + lean, -66);
    ctx.lineTo(-6 + lean, -73);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#b9a99c';
    ctx.beginPath();
    ctx.moveTo(-1 + lean, -68);
    ctx.lineTo(4 + lean, -70);
    ctx.lineTo(2 + lean, -58);
    ctx.lineTo(-3 + lean, -59);
    ctx.closePath();
    ctx.fill();

    // 月光轮廓
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = 'rgba(150, 224, 220, 0.26)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-11 + lean, -84);
    ctx.quadraticCurveTo(-15 + lean, -71, -7, -56);
    ctx.lineTo(-9, -46);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(239, 139, 145, 0.2)';
    ctx.beginPath();
    ctx.moveTo(12 + lean, -84);
    ctx.quadraticCurveTo(14 + lean, -72, 8, -58);
    ctx.stroke();
    ctx.restore();

    // 束腰
    ctx.fillStyle = '#551f33';
    ctx.beginPath();
    ctx.moveTo(-8, -61);
    ctx.lineTo(8, -61);
    ctx.lineTo(10, -48);
    ctx.lineTo(-10, -48);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(218, 176, 113, 0.65)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-9, -58);
    ctx.lineTo(9, -58);
    ctx.moveTo(-9.5, -52);
    ctx.lineTo(9.5, -52);
    ctx.stroke();

    // 腰带与扣
    ctx.fillStyle = '#1a1520';
    ctx.fillRect(-10, -50, 20, 5);
    ctx.fillStyle = '#c8a262';
    ctx.beginPath();
    ctx.arc(0, -47.5, 3.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#6d2638';
    ctx.beginPath();
    ctx.arc(0, -47.5, 1.6, 0, TAU);
    ctx.fill();

    // 胸口红饰
    ctx.fillStyle = '#cc3a55';
    ctx.beginPath();
    ctx.moveTo(2 + lean, -82);
    ctx.lineTo(10 + lean, -77);
    ctx.lineTo(5 + lean, -72);
    ctx.lineTo(-1 + lean, -77);
    ctx.closePath();
    ctx.fill();

    // 肩甲
    ctx.save();
    ctx.translate(9 + lean, -84);
    ctx.rotate(-0.2);
    ctx.fillStyle = '#3b334c';
    ctx.beginPath();
    ctx.moveTo(-5, -4);
    ctx.quadraticCurveTo(7, -7, 12, 1);
    ctx.quadraticCurveTo(7, 8, -3, 5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(211, 181, 135, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-3, -2);
    ctx.quadraticCurveTo(5, -4, 10, 1);
    ctx.stroke();
    ctx.restore();

    // 短裙片
    const sway = running ? Math.sin(this.animTime * 13.5) * 2 : Math.sin(time * 2.4) * 1;
    const skirt = [
      { x1: -9, x2: -18, c: '#6d2136' },
      { x1: -5, x2: -11, c: '#382238' },
      { x1: 0, x2: 2, c: '#932b43' },
      { x1: 6, x2: 14, c: '#352039' },
      { x1: 9, x2: 22, c: '#592034' }
    ];
    for (let i = 0; i < skirt.length; i++) {
      const s = skirt[i];
      ctx.fillStyle = s.c;
      ctx.beginPath();
      ctx.moveTo(s.x1, -47);
      ctx.lineTo(s.x1 + 5, -30 + Math.abs(s.x2) * 0.08);
      ctx.lineTo(s.x2 + sway * (i % 2 ? 0.7 : 1), -26);
      ctx.lineTo(s.x2 + 4, -44);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(225, 171, 130, 0.28)';
    ctx.beginPath();
    ctx.moveTo(-10, -45);
    ctx.lineTo(-16, -29);
    ctx.lineTo(-12, -30);
    ctx.closePath();
    ctx.fill();

    // 颈部
    ctx.fillStyle = '#e9c5af';
    ctx.beginPath();
    ctx.moveTo(-3 + lean, -88);
    ctx.lineTo(4 + lean, -88);
    ctx.lineTo(4 + lean, -96);
    ctx.lineTo(-3 + lean, -96);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawTorsoSchool(ctx, lean, running, time) {
    const look = this.game.appearance;
    const top = look.top;
    const skirt = look.skirt;
    const shirtDark = darken(top, 0.2);
    const trim = mixHex(skirt, '#1c1b25', 0.45);
    const sway = running ? Math.sin(this.animTime * 13.5) * 2.2 : Math.sin(time * 2.2) * 1.0;

    ctx.save();

    // 衬衫上身
    const shirt = ctx.createLinearGradient(-13, -87, 13, -45);
    shirt.addColorStop(0, lighten(top, 0.18));
    shirt.addColorStop(0.55, top);
    shirt.addColorStop(1, shirtDark);
    ctx.fillStyle = shirt;
    ctx.beginPath();
    ctx.moveTo(-11 + lean, -85);
    ctx.quadraticCurveTo(-13 + lean, -73, -7, -57);
    ctx.quadraticCurveTo(-8, -49, -10, -45);
    ctx.lineTo(9, -45);
    ctx.quadraticCurveTo(7, -50, 8, -57);
    ctx.quadraticCurveTo(14 + lean, -73, 11 + lean, -85);
    ctx.closePath();
    ctx.fill();

    // 肩部褶线
    ctx.strokeStyle = hexToRgba(shirtDark, 0.6);
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(-8 + lean, -81);
    ctx.quadraticCurveTo(-2, -76, -3, -66);
    ctx.moveTo(8 + lean, -81);
    ctx.quadraticCurveTo(3, -77, 4, -67);
    ctx.stroke();

    // 水手领
    ctx.fillStyle = trim;
    ctx.beginPath();
    ctx.moveTo(-11 + lean, -85);
    ctx.lineTo(-3 + lean, -73);
    ctx.lineTo(0, -68);
    ctx.lineTo(4 + lean, -74);
    ctx.lineTo(11 + lean, -85);
    ctx.lineTo(8 + lean, -89);
    ctx.lineTo(0, -84);
    ctx.lineTo(-8 + lean, -89);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hexToRgba(lighten(trim, 0.55), 0.7);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-9 + lean, -84);
    ctx.lineTo(0, -76);
    ctx.lineTo(9 + lean, -84);
    ctx.stroke();

    // 颈部
    ctx.fillStyle = '#eac3ae';
    ctx.beginPath();
    ctx.moveTo(-3 + lean, -88);
    ctx.lineTo(4 + lean, -88);
    ctx.lineTo(4 + lean, -96);
    ctx.lineTo(-3 + lean, -96);
    ctx.closePath();
    ctx.fill();

    // 书包斜肩带
    ctx.strokeStyle = hexToRgba(darken(skirt, 0.45), 0.62);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(8 + lean, -84);
    ctx.lineTo(-8, -51);
    ctx.stroke();

    // 衬衫下摆
    ctx.fillStyle = lighten(top, 0.04);
    ctx.beginPath();
    ctx.moveTo(-9, -48);
    ctx.lineTo(9, -48);
    ctx.lineTo(7, -44);
    ctx.lineTo(-8, -44);
    ctx.closePath();
    ctx.fill();

    // 格纹裙
    ctx.save();
    const skirtPath = new Path2D();
    skirtPath.moveTo(-10, -46);
    skirtPath.lineTo(10, -46);
    skirtPath.quadraticCurveTo(17, -34, 21 + sway, -24);
    skirtPath.lineTo(-21 + sway, -24);
    skirtPath.quadraticCurveTo(-17, -34, -10, -46);
    skirtPath.closePath();
    const skirtGrad = ctx.createLinearGradient(0, -46, 0, -23);
    skirtGrad.addColorStop(0, lighten(skirt, 0.13));
    skirtGrad.addColorStop(0.55, skirt);
    skirtGrad.addColorStop(1, darken(skirt, 0.22));
    ctx.fillStyle = skirtGrad;
    ctx.fill(skirtPath);
    ctx.clip(skirtPath);
    ctx.strokeStyle = hexToRgba(lighten(skirt, 0.45), 0.26);
    ctx.lineWidth = 0.8;
    for (let x = -22; x <= 22; x += 6) {
      ctx.beginPath();
      ctx.moveTo(x, -48);
      ctx.lineTo(x + sway * 0.4, -21);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(8, 7, 12, 0.24)';
    for (let y = -43; y <= -25; y += 6) {
      ctx.beginPath();
      ctx.moveTo(-23, y);
      ctx.lineTo(23, y);
      ctx.stroke();
    }
    ctx.restore();

    // 百褶阴影
    ctx.strokeStyle = 'rgba(8, 7, 12, 0.3)';
    ctx.lineWidth = 1.2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 5, -45);
      ctx.lineTo(i * 8 + sway * 0.7, -25);
      ctx.stroke();
    }
    ctx.fillStyle = hexToRgba(lighten(skirt, 0.55), 0.3);
    ctx.beginPath();
    ctx.moveTo(-17, -30);
    ctx.lineTo(-10, -43);
    ctx.lineTo(-7, -43);
    ctx.lineTo(-13, -27);
    ctx.closePath();
    ctx.fill();

    // 腰带
    ctx.fillStyle = trim;
    ctx.fillRect(-10, -48, 20, 4);
    ctx.fillStyle = hexToRgba(lighten(trim, 0.5), 0.5);
    ctx.fillRect(-10, -48, 20, 0.8);

    // 月光轮廓
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = 'rgba(150, 224, 220, 0.25)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-10 + lean, -84);
    ctx.quadraticCurveTo(-13 + lean, -70, -7, -55);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  drawSchoolRibbon(ctx, time) {
    const sway = Math.sin(time * 3.1) * 1.2;
    ctx.save();
    ctx.translate(0, -81);
    // 领结
    ctx.fillStyle = '#b5324d';
    ctx.beginPath();
    ctx.moveTo(-1, 0);
    ctx.lineTo(-9, -5);
    ctx.lineTo(-8, 4);
    ctx.lineTo(-1, 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(1, 0);
    ctx.lineTo(9, -5 + sway * 0.2);
    ctx.lineTo(8, 4 + sway * 0.2);
    ctx.lineTo(1, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d75666';
    ctx.beginPath();
    ctx.ellipse(0, 0.5, 2.3, 2.8, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e7c282';
    ctx.beginPath();
    ctx.arc(0, 0.5, 0.8, 0, TAU);
    ctx.fill();
    // 垂带
    ctx.strokeStyle = 'rgba(166, 37, 66, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-1, 3);
    ctx.quadraticCurveTo(-5, 11, -4 + sway, 17);
    ctx.moveTo(2, 3);
    ctx.quadraticCurveTo(5, 10, 6 + sway, 15);
    ctx.stroke();
    ctx.restore();
  }

  drawHead(ctx, shift, time, running) {
    const pal = this.getHairPalette();
    const student = this.isStudent;
    ctx.save();
    ctx.translate(shift, 0);
    // 后发主线
    ctx.fillStyle = pal.shadow;
    ctx.beginPath();
    ctx.moveTo(-7, -117);
    ctx.quadraticCurveTo(7, -126, 17, -113);
    ctx.quadraticCurveTo(20, -102, 12, -96);
    ctx.lineTo(2, -88);
    ctx.quadraticCurveTo(-14, -96, -10, -109);
    ctx.closePath();
    ctx.fill();

    // 脸
    const skin = ctx.createLinearGradient(-4, -118, 16, -92);
    skin.addColorStop(0, '#f8ddca');
    skin.addColorStop(1, '#e4b9a5');
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.moveTo(-8, -112);
    ctx.quadraticCurveTo(-3, -121, 8, -120);
    ctx.quadraticCurveTo(17, -118, 17, -107);
    ctx.quadraticCurveTo(17, -99, 12, -94);
    ctx.quadraticCurveTo(8, -89, 4, -91);
    ctx.quadraticCurveTo(-3, -94, -7, -102);
    ctx.closePath();
    ctx.fill();

    // 耳朵
    ctx.fillStyle = '#e8bda7';
    ctx.beginPath();
    ctx.ellipse(-5, -105, 3.2, 5, -0.2, 0, TAU);
    ctx.fill();

    // 眼睛
    const eyeGlow = 0.55 + Math.sin(time * 2.2) * 0.15;
    ctx.fillStyle = '#30182b';
    ctx.beginPath();
    ctx.moveTo(4.5, -106.5);
    ctx.quadraticCurveTo(9.5, -109, 13.5, -106.2);
    ctx.quadraticCurveTo(9.5, -103.2, 4.5, -106.5);
    ctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = eyeGlow;
    ctx.fillStyle = '#ff4e69';
    ctx.beginPath();
    ctx.ellipse(9.2, -106.2, 2.4, 2.9, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = eyeGlow * 0.8;
    drawGlow(ctx, 9.5, -106, 8, '#ff6b7f', 0.25);
    ctx.restore();
    ctx.fillStyle = '#fff0db';
    ctx.beginPath();
    ctx.arc(10, -107.2, 0.7, 0, TAU);
    ctx.fill();
    // 睫毛
    ctx.strokeStyle = '#3e2233';
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(4.8, -107);
    ctx.quadraticCurveTo(9, -110.2, 14.4, -106.3);
    ctx.stroke();
    // 眉毛
    ctx.strokeStyle = 'rgba(115, 87, 109, 0.8)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(5, -112);
    ctx.quadraticCurveTo(9.5, -114, 13.6, -111.4);
    ctx.stroke();
    // 鼻与唇
    ctx.strokeStyle = 'rgba(166, 102, 100, 0.65)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(14.4, -100.5);
    ctx.quadraticCurveTo(15.3, -99.2, 14.1, -98.4);
    ctx.stroke();
    ctx.strokeStyle = '#b75b6b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(10, -94.6);
    ctx.quadraticCurveTo(12.2, -93.4, 13.8, -94.7);
    ctx.stroke();
    // 腮红
    ctx.fillStyle = 'rgba(220, 117, 126, 0.16)';
    ctx.beginPath();
    ctx.ellipse(8, -97.8, 4, 1.7, 0.1, 0, TAU);
    ctx.fill();

    // 前发
    const hairGrad = ctx.createLinearGradient(-10, -123, 16, -88);
    hairGrad.addColorStop(0, pal.light);
    hairGrad.addColorStop(0.5, pal.base);
    hairGrad.addColorStop(1, pal.dark);
    ctx.fillStyle = hairGrad;
    ctx.beginPath();
    ctx.moveTo(-10, -108);
    ctx.quadraticCurveTo(-10, -123, 5, -124);
    ctx.quadraticCurveTo(18, -123, 19, -111);
    ctx.quadraticCurveTo(14, -116, 9, -115);
    ctx.quadraticCurveTo(13, -110, 10, -104);
    ctx.quadraticCurveTo(7, -113, 2, -116);
    ctx.quadraticCurveTo(5, -109, 2, -104);
    ctx.quadraticCurveTo(-1, -111, -5, -114);
    ctx.quadraticCurveTo(-3, -107, -6, -102);
    ctx.quadraticCurveTo(-8, -104, -10, -108);
    ctx.closePath();
    ctx.fill();
    // 侧发（校园造型为短鲍伯）
    ctx.beginPath();
    ctx.moveTo(-8, -112);
    if (student) {
      ctx.quadraticCurveTo(-16, -102, -11, -92);
      ctx.quadraticCurveTo(-5, -98, -3, -105);
    } else {
      ctx.quadraticCurveTo(-14, -99, -9, -82);
      ctx.quadraticCurveTo(-4, -91, -3, -105);
    }
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(16, -112);
    if (student) {
      ctx.quadraticCurveTo(20, -103, 16, -95);
      ctx.quadraticCurveTo(13, -99, 13, -108);
    } else {
      ctx.quadraticCurveTo(20, -103, 17, -94);
      ctx.quadraticCurveTo(14, -99, 13, -108);
    }
    ctx.closePath();
    ctx.fill();
    // 发丝高光
    ctx.strokeStyle = hexToRgba(pal.light, 0.58);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-3, -120);
    ctx.quadraticCurveTo(5, -123, 13, -118);
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(pal.mid, 0.48);
    ctx.beginPath();
    ctx.moveTo(2, -116);
    ctx.quadraticCurveTo(8, -113, 10, -106);
    ctx.stroke();
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = 'rgba(178, 230, 225, 0.22)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-9, -108);
    ctx.quadraticCurveTo(-3, -123, 10, -121);
    ctx.stroke();
    ctx.restore();

    // 红色发饰
    ctx.fillStyle = '#b72c48';
    ctx.beginPath();
    ctx.moveTo(-7.5, -116);
    ctx.lineTo(-15, -119);
    ctx.lineTo(-11, -111);
    ctx.lineTo(-16, -107);
    ctx.lineTo(-6, -110);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e6bf7d';
    ctx.beginPath();
    ctx.arc(-8, -113.5, 1.6, 0, TAU);
    ctx.fill();

    // 呆毛
    ctx.strokeStyle = hexToRgba(pal.light, 0.8);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(1, -123);
    ctx.quadraticCurveTo(5, -130, 10, -127);
    ctx.stroke();
    ctx.restore();
  }

  drawHairBack(ctx, time, running) {
    const pal = this.getHairPalette();
    const flow = Math.sin(time * 2.6) * 3 + (running ? -5 : 0) - clamp(this.vx * 0.02, -8, 8);
    ctx.save();
    const g = ctx.createLinearGradient(-50, -110, -4, -55);
    g.addColorStop(0, pal.light);
    g.addColorStop(0.5, pal.base);
    g.addColorStop(1, pal.dark);
    ctx.fillStyle = g;

    if (this.isStudent) {
      // 校园造型：及颈短发
      ctx.beginPath();
      ctx.moveTo(-4, -116);
      ctx.quadraticCurveTo(-20, -117, -25 + flow * 0.25, -104);
      ctx.quadraticCurveTo(-30 + flow * 0.4, -92, -21 + flow * 0.35, -83);
      ctx.quadraticCurveTo(-13, -91, -10, -101);
      ctx.quadraticCurveTo(-8, -108, -4, -111);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-17, -108);
      ctx.quadraticCurveTo(-22, -96, -18, -84);
      ctx.quadraticCurveTo(-11, -90, -9, -103);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = hexToRgba(pal.light, 0.38);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-8, -111);
      ctx.quadraticCurveTo(-20, -108, -23 + flow * 0.25, -96);
      ctx.stroke();
      ctx.strokeStyle = hexToRgba(pal.shadow, 0.55);
      ctx.beginPath();
      ctx.moveTo(-15, -100);
      ctx.quadraticCurveTo(-18, -93, -15, -87);
      ctx.stroke();
      // 小发夹
      ctx.fillStyle = '#b7334e';
      ctx.beginPath();
      ctx.moveTo(-8, -110);
      ctx.lineTo(-14, -112);
      ctx.lineTo(-12, -106);
      ctx.closePath();
      ctx.fill();
      // 发丝轮廓
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = hexToRgba(pal.light, 0.3);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-5, -115);
      ctx.quadraticCurveTo(-22, -113, -25 + flow * 0.25, -101);
      ctx.stroke();
      ctx.restore();
      ctx.restore();
      return;
    }

    // 大后发
    ctx.beginPath();
    ctx.moveTo(-4, -115);
    ctx.quadraticCurveTo(-24, -118, -31 + flow * 0.4, -100);
    ctx.quadraticCurveTo(-40 + flow, -84, -34 + flow, -62);
    ctx.quadraticCurveTo(-24, -72, -20, -86);
    ctx.quadraticCurveTo(-16, -101, -7, -106);
    ctx.closePath();
    ctx.fill();
    // 马尾
    ctx.beginPath();
    ctx.moveTo(-8, -113);
    ctx.quadraticCurveTo(-31, -120, -43 + flow * 0.7, -103);
    ctx.quadraticCurveTo(-55 + flow, -86, -48 + flow, -69);
    ctx.quadraticCurveTo(-41 + flow * 0.5, -83, -30, -91);
    ctx.quadraticCurveTo(-19, -102, -8, -105);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hexToRgba(pal.light, 0.42);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-12, -112);
    ctx.quadraticCurveTo(-32, -112, -40 + flow * 0.7, -98);
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(pal.shadow, 0.52);
    ctx.beginPath();
    ctx.moveTo(-20, -94);
    ctx.quadraticCurveTo(-29, -85, -29 + flow * 0.4, -75);
    ctx.stroke();
    // 发带
    ctx.fillStyle = 'rgba(177, 40, 65, 0.92)';
    ctx.beginPath();
    ctx.moveTo(-10, -111);
    ctx.quadraticCurveTo(-20, -113, -24, -105);
    ctx.quadraticCurveTo(-17, -106, -13, -102);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawScarf(ctx, time, running) {
    const wind = clamp(-this.vx * 0.055, -14, 14);
    const wave = Math.sin(time * 4.2) * 5 + Math.sin(time * 7.1) * 2;
    ctx.save();
    const g = ctx.createLinearGradient(-60, -95, -4, -55);
    g.addColorStop(0, '#651329');
    g.addColorStop(0.45, '#a92743');
    g.addColorStop(1, '#c84358');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-2, -89);
    ctx.bezierCurveTo(-18, -95, -38 + wind, -92 + wave, -55 + wind, -78 + wave * 0.5);
    ctx.lineTo(-49 + wind, -66 + wave * 0.4);
    ctx.bezierCurveTo(-35 + wind * 0.6, -76, -19, -80, -1, -78);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-3, -84);
    ctx.bezierCurveTo(-20, -84, -40 + wind, -72 + wave, -53 + wind, -52 + wave * 0.7);
    ctx.lineTo(-43 + wind, -45 + wave * 0.5);
    ctx.bezierCurveTo(-31 + wind * 0.5, -62, -17, -70, -2, -71);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 191, 159, 0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-7, -88);
    ctx.bezierCurveTo(-25, -91, -44 + wind, -84, -53 + wind, -73);
    ctx.stroke();
    ctx.restore();
  }

  drawScarfKnot(ctx, time) {
    ctx.save();
    ctx.translate(0, -89);
    ctx.fillStyle = '#c2354f';
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 3.2, -0.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e5b876';
    ctx.beginPath();
    ctx.arc(1.5, 0, 1.2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  drawFrontArmAndWeapon(ctx, time, lean) {
    const shoulder = { x: 9 + lean, y: -82 };
    const aim = this.aimLocalAngle;
    const student = this.isStudent;

    if (this.weapon === 'gun') {
      const reach = 27 - this.gunKick * 4.5;
      const hand = {
        x: shoulder.x + Math.cos(aim) * reach,
        y: shoulder.y + Math.sin(aim) * reach
      };
      this.drawArmTo(ctx, shoulder, hand, student, time);
      this.drawGun(ctx, hand, time, aim);
      return;
    }

    let angle;
    if (this.swordTimer > 0) {
      const p = clamp(this.swordElapsed / this.swordDuration, 0, 1);
      let startA, endA;
      if (this.combo === 0) {
        startA = aim - 1.28;
        endA = aim + 0.76;
      } else if (this.combo === 1) {
        startA = aim + 1.5;
        endA = aim - 0.6;
      } else {
        startA = aim - 1.72;
        endA = aim + 1.0;
      }
      if (p < 0.2) angle = startA;
      else if (p < 0.62) angle = lerp(startA, endA, easeOutCubic(invLerp(0.2, 0.62, p)));
      else angle = aim + 0.64;
    } else {
      angle = aim + 0.64 + Math.sin(time * 1.8 + this.aimLocalAngle) * 0.025;
    }

    const reach = this.swordTimer > 0 ? 24 : 19;
    const hand = {
      x: shoulder.x + Math.cos(angle) * reach,
      y: shoulder.y + Math.sin(angle) * reach
    };
    this.drawArmTo(ctx, shoulder, hand, student, time);
    this.drawSword(ctx, hand, angle);
  }

  drawArmTo(ctx, shoulder, hand, student, time) {
    const dx = hand.x - shoulder.x;
    const dy = hand.y - shoulder.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const bend = this.swordTimer > 0 ? 4.2 : 2.2;
    const elbowX = (shoulder.x + hand.x) / 2 + nx * bend;
    const elbowY = (shoulder.y + hand.y) / 2 + ny * bend;

    ctx.save();
    ctx.lineCap = 'round';

    if (student) {
      // 短袖袖口
      ctx.save();
      ctx.translate(shoulder.x + Math.cos(this.aimLocalAngle) * 2, shoulder.y + Math.sin(this.aimLocalAngle) * 2);
      ctx.rotate(this.aimLocalAngle);
      ctx.fillStyle = this.game.appearance.top;
      ctx.beginPath();
      ctx.moveTo(-4, -7);
      ctx.quadraticCurveTo(6, -9, 9, -3);
      ctx.quadraticCurveTo(11, 4, 3, 7);
      ctx.quadraticCurveTo(-2, 5, -4, -7);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = hexToRgba(this.game.appearance.skirt, 0.65);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(1, -7);
      ctx.quadraticCurveTo(5, -1, 2, 6);
      ctx.stroke();
      ctx.restore();
    }

    ctx.strokeStyle = student ? '#efc9b4' : '#211d31';
    ctx.lineWidth = student ? 6.2 : 7;
    ctx.beginPath();
    ctx.moveTo(shoulder.x, shoulder.y);
    ctx.quadraticCurveTo(elbowX, elbowY, hand.x, hand.y);
    ctx.stroke();

    ctx.strokeStyle = student ? 'rgba(255, 231, 211, 0.34)' : 'rgba(222, 193, 157, 0.23)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(shoulder.x + 2, shoulder.y + 2);
    ctx.quadraticCurveTo(elbowX + 2, elbowY, hand.x + 2, hand.y - 2);
    ctx.stroke();

    if (!student) {
      ctx.fillStyle = '#343047';
      ctx.beginPath();
      ctx.ellipse(hand.x - 2, hand.y + 1, 4.3, 3.2, 0.3, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = student ? '#edc6b2' : '#e8c5ae';
    ctx.beginPath();
    ctx.arc(hand.x + 1.5, hand.y, student ? 2.4 : 2.8, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  drawGuard(ctx, time) {
    const aim = this.aimLocalAngle;
    const shoulder = { x: 9, y: -82 };
    const cx = Math.cos(aim) * 31 + 1;
    const cy = -58 + Math.sin(aim) * 31;
    const student = this.isStudent;
    this.drawArmTo(ctx, shoulder, { x: cx, y: cy }, student, time);

    const perfect = this.guardTime <= 0.5;
    const accent = student ? '#95e3dc' : '#f0c47f';
    const face = student ? '#243746' : '#2b2029';
    const rim = student ? '#c6ad7c' : '#d3b071';
    const gem = student ? '#8de5df' : '#ff6576';
    const flash = this.guardFlash + this.guardBlockFlash;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    drawGlow(ctx, 0, 0, perfect ? 58 : 42, perfect ? '#ffe3a1' : '#86d8d2', perfect ? 0.22 : 0.1);
    if (flash > 0) drawGlow(ctx, 0, 0, 50 + flash * 45, '#fff4d3', flash * 0.85);
    ctx.restore();

    // 盾牌主体
    const shieldGrad = ctx.createRadialGradient(-5, -6, 2, 0, 0, 24);
    shieldGrad.addColorStop(0, lighten(face, 0.25));
    shieldGrad.addColorStop(0.65, face);
    shieldGrad.addColorStop(1, darken(face, 0.38));
    ctx.fillStyle = shieldGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rim;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 243, 215, 0.36)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(rim, 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -19);
    ctx.lineTo(0, 19);
    ctx.moveTo(-19, 0);
    ctx.lineTo(19, 0);
    ctx.stroke();

    // 中央纹章
    ctx.save();
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = 'rgba(255, 246, 219, 0.74)';
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();
    ctx.fillStyle = gem;
    drawDiamond(ctx, 0, 0, 5.2);
    ctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    drawGlow(ctx, 0, 0, 11, gem, 0.35);
    ctx.restore();

    // 四枚铆钉
    for (let i = 0; i < 4; i++) {
      const a = i * TAU / 4 + Math.PI / 4;
      ctx.fillStyle = 'rgba(239, 215, 169, 0.8)';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 18.5, Math.sin(a) * 18.5, 1.5, 0, TAU);
      ctx.fill();
    }

    // 完美窗口倒计时 / 防御状态
    if (perfect) {
      const left = clamp(1 - this.guardTime / 0.5, 0, 1);
      ctx.strokeStyle = 'rgba(255, 228, 168, 0.92)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, 30, -Math.PI / 2, -Math.PI / 2 + TAU * left);
      ctx.stroke();
      ctx.save();
      ctx.globalAlpha = 0.5 + Math.sin(time * 14) * 0.2;
      ctx.strokeStyle = 'rgba(255, 244, 209, 0.6)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, TAU);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.strokeStyle = 'rgba(134, 216, 210, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 30, -Math.PI * 0.78, Math.PI * 0.78);
      ctx.stroke();
    }

    // 面向攻击方向的防护弧
    ctx.save();
    ctx.rotate(aim);
    ctx.strokeStyle = perfect ? 'rgba(255, 226, 164, 0.48)' : 'rgba(130, 214, 207, 0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 37, -0.9, 0.9);
    ctx.stroke();
    ctx.restore();

    if (this.guardBlockFlash > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = this.guardBlockFlash * 3;
      ctx.strokeStyle = '#fff8df';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 27, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  drawSword(ctx, hand, angle) {
    ctx.save();
    ctx.translate(hand.x, hand.y);
    ctx.rotate(angle);
    // 刀柄
    ctx.fillStyle = '#17121d';
    ctx.fillRect(-13, -3.1, 15, 6.2);
    ctx.strokeStyle = 'rgba(197, 155, 101, 0.7)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-12 + i * 3.2, -3);
      ctx.lineTo(-10 + i * 3.2, 3);
      ctx.stroke();
    }
    // 护手
    ctx.fillStyle = '#b89455';
    ctx.beginPath();
    ctx.moveTo(2, -8);
    ctx.lineTo(5, -8);
    ctx.lineTo(6, 8);
    ctx.lineTo(3, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d7bd85';
    ctx.beginPath();
    ctx.arc(4, 0, 1.8, 0, TAU);
    ctx.fill();
    // 刀身
    const blade = ctx.createLinearGradient(6, 0, 77, 0);
    blade.addColorStop(0, '#e9edf3');
    blade.addColorStop(0.38, '#b7c4d1');
    blade.addColorStop(0.7, '#d8dee8');
    blade.addColorStop(1, '#f6f6f2');
    ctx.fillStyle = blade;
    ctx.beginPath();
    ctx.moveTo(6, -3.7);
    ctx.lineTo(63, -2.5);
    ctx.lineTo(78, 0);
    ctx.lineTo(63, 2.5);
    ctx.lineTo(6, 3.7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(91, 50, 65, 0.55)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(8, 0.4);
    ctx.lineTo(70, 0.4);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(9, -2.2);
    ctx.lineTo(61, -1.3);
    ctx.stroke();
    // 刀镡红光
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.34;
    drawGlow(ctx, 4, 0, 10, '#e65a70', 0.22);
    ctx.restore();
    // 尾穗
    ctx.strokeStyle = 'rgba(184, 46, 70, 0.9)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-13, 0);
    ctx.quadraticCurveTo(-20, 5, -19, 13);
    ctx.stroke();
    ctx.fillStyle = 'rgba(189, 52, 74, 0.8)';
    ctx.beginPath();
    ctx.arc(-19, 14, 1.8, 0, TAU);
    ctx.fill();
    // 金属反光
    const glint = Math.max(0, Math.sin(this.animTime * 3.4 + 0.5));
    if (glint > 0.96) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.9;
      drawGlow(ctx, 64, 0, 12, '#fff7e3', 0.7);
      ctx.restore();
    }
    ctx.restore();
  }

  drawGun(ctx, hand, time, angle) {
    ctx.save();
    ctx.translate(hand.x, hand.y);
    ctx.rotate(angle);
    // 枪身
    ctx.fillStyle = '#252331';
    ctx.beginPath();
    ctx.moveTo(-5, -5);
    ctx.lineTo(25, -4);
    ctx.lineTo(30, -1.5);
    ctx.lineTo(30, 1.5);
    ctx.lineTo(17, 3.5);
    ctx.lineTo(6, 8);
    ctx.lineTo(-1, 7);
    ctx.lineTo(2, 1);
    ctx.lineTo(-5, 0.5);
    ctx.closePath();
    ctx.fill();
    // 套筒
    ctx.fillStyle = '#4f4a5e';
    ctx.beginPath();
    ctx.moveTo(2, -4.5);
    ctx.lineTo(24, -3.8);
    ctx.lineTo(25, -0.5);
    ctx.lineTo(2, -1);
    ctx.closePath();
    ctx.fill();
    // 枪口
    ctx.fillStyle = '#0e0e16';
    ctx.fillRect(24, -3, 7, 6);
    ctx.fillStyle = '#b89b6c';
    ctx.fillRect(29, -1.2, 2, 2.4);
    // 玫瑰纹章
    ctx.strokeStyle = 'rgba(195, 79, 95, 0.8)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(11, -2.6, 2.1, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8.5, 3);
    ctx.lineTo(11, 6);
    ctx.stroke();
    // 扳机
    ctx.strokeStyle = 'rgba(20, 17, 25, 0.9)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(6, 3, 3, 0, Math.PI);
    ctx.stroke();
    // 后坐力闪光
    if (this.muzzleTimer > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = clamp(this.muzzleTimer / 0.075, 0, 1);
      drawGlow(ctx, 34, 0, 21, '#ffb070', 0.65);
      ctx.fillStyle = '#fff5d6';
      drawStar(ctx, 34, 0, 12, 3.5, 6, 0);
      ctx.fill();
      ctx.fillStyle = '#ffc27b';
      ctx.beginPath();
      ctx.moveTo(30, -2);
      ctx.lineTo(47, -6);
      ctx.lineTo(38, 0);
      ctx.lineTo(47, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  drawMuzzleFlash(ctx) {
    const aim = this.aimLocalAngle;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = clamp(this.muzzleTimer / 0.075, 0, 1) * 0.4;
    drawGlow(ctx, Math.cos(aim) * 54, -58 + Math.sin(aim) * 54, 30, '#ffba7c', 0.5);
    ctx.restore();
  }

  drawSwordTrail(ctx, backLayer) {
    if (this.swordTimer <= 0) return;
    const p = clamp(this.swordElapsed / this.swordDuration, 0, 1);
    if (p < 0.08 || p > 0.72) return;
    const aim = this.aimLocalAngle;
    let start, end, r;
    let cy = -58;
    if (this.combo === 0) { start = aim - 1.58; end = aim + 0.84; r = 76; }
    else if (this.combo === 1) { start = aim + 1.55; end = aim - 0.68; r = 79; }
    else { start = aim - 1.92; end = aim + 1.05; r = 88; }
    const q = easeOutQuint(clamp((p - 0.08) / 0.47, 0, 1));
    const current = lerp(start, end, q);
    const anticlockwise = end < start;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    if (backLayer) {
      ctx.globalAlpha = 0.11;
      ctx.strokeStyle = this.combo === 2 ? '#ffd294' : '#c8f4ef';
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.arc(0, cy, r, start, current, anticlockwise);
      ctx.stroke();
    } else {
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = [0.55, 0.34, 0.16][i] * (1 - q * 0.28);
        ctx.strokeStyle = ['#fff7e5', '#ffe3b0', '#74ded9'][i];
        ctx.lineWidth = [2.2, 7, 16][i];
        ctx.beginPath();
        ctx.arc(0, cy, r - i * 2.5, start, current, anticlockwise);
        ctx.stroke();
      }
      const px = Math.cos(current) * r;
      const py = cy + Math.sin(current) * r;
      ctx.globalAlpha = 0.7;
      drawGlow(ctx, px, py, 18, '#fff7e0', 0.5);
    }
    ctx.restore();
  }

  drawSpecialAura(ctx, time) {
    if (this.specialTimer <= 0) return;
    const p = 1 - this.specialTimer / 1.15;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = (1 - p) * 0.75;
    drawGlow(ctx, 0, -45, 110 + p * 80, '#ffd9a0', 0.5);
    ctx.strokeStyle = '#ffe8ba';
    ctx.lineWidth = 2.5 - p * 1.8;
    ctx.beginPath();
    ctx.arc(0, -42, 40 + p * 165, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = (1 - p) * 0.35;
    ctx.strokeStyle = '#f38ca0';
    ctx.beginPath();
    ctx.arc(0, -42, 24 + p * 110, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
}
