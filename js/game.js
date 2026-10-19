'use strict';

class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();
    this.input = new Input();
    this.audio = new AudioEngine();
    this.renderer = new WorldRenderer();
    this.isTouch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    this.appearance = Wardrobe.loadAppearance();
    this.hero = new Hero(this);
    this.boss = new Boss(this);
    this.enemies = [];
    this.solids = [];
    this.platforms = LEVEL.platforms;

    this.state = 'menu';
    this.menuTime = 0;
    this.time = 0;
    this.last = performance.now();
    this.camera = { x: 0, y: 0 };
    this.cameraInit = false;
    this.shake = 0;
    this.hitstop = 0;
    this.hitFlash = 0;
    this.hitFlashColor = '255,255,255';
    this.slowmo = 0;
    this.parrySlowT = 0;
    this.parryTextT = 0;
    this.parryFlash = 0;
    this.parryCount = 0;
    this.wardrobeOpen = false;
    this.suppressAttackUntil = 0;
    this.runTime = 0;
    this.deaths = 0;
    this.kills = 0;
    this.echoCount = 0;
    this.tutorialT = 0;
    this.toast = null;
    this.chapterCard = null;
    this.chapterQueue = [];
    this.dialogue = null;
    this.bossTriggered = false;
    this.bossDialogueDone = false;
    this.gateActive = false;
    this.bossDeathTimer = 0;
    this.endType = null;
    this.deathTimer = 0;
    this.fallingOut = false;
    this.respawnPoint = { x: LEVEL.start.x, y: LEVEL.start.y };

    this.particles = [];
    this.playerBullets = [];
    this.enemyBullets = [];
    this.damageTexts = [];
    this.shockwaves = [];
    this.slashArcs = [];
    this.alerts = [];
    this.pickups = [];
    this.echoes = [];
    this.checkpoints = [];
    this.shownChapters = [];
    this.stats = { kills: 0, echoes: 0, deaths: 0, time: 0 };

    this.hud = new HUDRenderer(this);
    this.bindUI();
    this.wardrobe = new Wardrobe(this);
    this.setupQuery();

    window.addEventListener('resize', () => this.resize());
    window.addEventListener('error', (e) => {
      if (e && e.message) document.body.dataset.gameError = e.message;
    });

    this.toMenu(true);
    this.raf = this.raf.bind(this);
    requestAnimationFrame(this.raf);
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(VIEW_W * this.dpr);
    this.canvas.height = Math.round(VIEW_H * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
  }

  bindUI() {
    const $ = (id) => document.getElementById(id);
    this.ui = {
      title: $('titleScreen'),
      startBtn: $('startBtn'),
      soundBtn: $('soundBtn'),
      soundLabel: $('soundLabel'),
      pauseSoundBtn: $('pauseSoundBtn'),
      touchPause: $('touchPause'),
      touchWeaponBtn: $('touchWeaponBtn'),
      touchAttackBtn: $('touchAttackBtn'),
      wardrobeBtn: $('wardrobeBtn'),
      pause: $('pauseScreen'),
      resumeBtn: $('resumeBtn'),
      quitBtn: $('quitBtn'),
      end: $('endScreen'),
      endKicker: $('endKicker'),
      endTitle: $('endTitle'),
      endCopy: $('endCopy'),
      endStats: $('endStats'),
      retryBtn: $('retryBtn'),
      endQuitBtn: $('endQuitBtn'),
      retryLabel: document.querySelector('#retryBtn .btn-label'),
      stage: document.getElementById('stage')
    };

    this.ui.startBtn.addEventListener('click', () => {
      this.audio.init();
      this.ui.startBtn.blur();
      this.startGame(false);
    });
    this.ui.soundBtn.addEventListener('click', () => this.toggleSound());
    this.ui.pauseSoundBtn.addEventListener('click', () => this.toggleSound());
    this.ui.touchPause.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.pause();
    });
    this.ui.resumeBtn.addEventListener('click', () => this.resume());
    this.ui.quitBtn.addEventListener('click', () => this.toMenu());
    this.ui.endQuitBtn.addEventListener('click', () => this.toMenu());
    this.ui.retryBtn.addEventListener('click', () => {
      this.audio.init();
      if (this.endType === 'dead') this.respawn();
      else this.startGame(true);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'playing') this.pause();
    });
    window.addEventListener('blur', () => {
      if (this.state === 'playing') this.pause();
    });
    document.addEventListener('pointerdown', () => this.audio.init(), { once: true });
    this.canvas.addEventListener('pointerdown', () => {
      if (this.dialogue && this.state === 'playing') {
        this.suppressAttackUntil = this.time + 0.18;
        this.advanceDialogue();
      }
    });
  }

  setupQuery() {
    const params = new URLSearchParams(location.search);
    this.debugParams = params;
    if (!params.has('autostart')) return;
    const scene = params.get('scene') || 'start';
    setTimeout(() => {
      this.startGame(params.has('skipintro') || scene !== 'start');
      if (scene === 'mid') {
        this.teleport(3230);
        this.showChapterCard(LEVEL.chapters[1]);
      } else if (scene === 'boss') {
        this.teleport(6540);
        this.startBossEncounter(true);
        this.boss.state = 'idle';
        this.boss.invulnerable = false;
        this.boss.stateT = 1.4;
        this.boss.timer = 0.8;
        this.camera.x = 6100;
        this.showChapterCard(LEVEL.chapters[2]);
      } else if (scene === 'victory') {
        this.teleport(7000);
        this.startBossEncounter(true);
        this.boss.state = 'idle';
        this.boss.invulnerable = false;
        this.boss.hp = 20;
        this.teleport(6780);
      } else if (scene === 'dialogue') {
        this.teleport(6510);
        this.startBossEncounter(false);
      }
    }, 120);
  }

  updateSoundLabels() {
    const on = this.audio.enabled;
    this.ui.soundLabel.textContent = on ? '声音 开' : '声音 关';
    this.ui.pauseSoundBtn.textContent = on ? '声音：开' : '声音：关';
    this.ui.soundBtn.classList.toggle('is-muted', !on);
  }

  toggleSound() {
    this.audio.init();
    this.audio.toggle();
    this.updateSoundLabels();
  }

  toMenu(first = false) {
    this.state = 'menu';
    if (this.ui && this.ui.soundLabel) this.updateSoundLabels();
    if (this.ui && this.ui.stage) this.ui.stage.dataset.state = 'menu';
    if (this.wardrobe && this.wardrobe.isOpen) this.wardrobe.close();
    this.wardrobeOpen = false;
    this.menuTime = 0;
    this.clearOverlays();
    this.ui.title.classList.remove('is-hidden');
    this.ui.title.setAttribute('aria-hidden', 'false');
    this.dialogue = null;
    this.pendingEnd = null;
    this.bossDeathTimer = 0;
    this.gateActive = false;
    this.bossTriggered = false;
    this.chapterQueue = [];
    this.chapterCard = null;
    this.ui.stage.dataset.dialogue = 'false';
    this.slowmo = 0;
    this.parrySlowT = 0;
    this.parryTextT = 0;
    this.parryFlash = 0;
    this.hitstop = 0;
    this.hitFlash = 0;
    this.shake = 0;
    this.particles = [];
    this.playerBullets = [];
    this.enemyBullets = [];
    this.damageTexts = [];
    this.shockwaves = [];
    this.slashArcs = [];
    this.alerts = [];
    this.boss.reset();
    this.hero.reset(872, 600);
    this.hero.dir = -1;
    this.hero.onGround = true;
    this.hero.animTime = 2.4;
    this.enemies = [];
    this.rebuildSolids();
    this.camera.x = 0;
    this.cameraInit = true;
    this.buildPickupData();
    this.buildCheckpointData();
    this.input.clearPressed();
    if (!first) this.audio.musicTimer = Math.min(this.audio.musicTimer, 1.5);
  }

  clearOverlays() {
    this.ui.pause.hidden = true;
    this.ui.end.hidden = true;
  }

  startGame(skipIntro = false) {
    this.audio.init();
    this.updateSoundLabels();
    if (this.wardrobe && this.wardrobe.isOpen) this.wardrobe.close();
    this.wardrobeOpen = false;
    this.ui.title.classList.add('is-hidden');
    this.ui.title.setAttribute('aria-hidden', 'true');
    this.ui.pause.hidden = true;
    this.ui.end.hidden = true;
    this.state = 'playing';
    if (this.ui && this.ui.stage) {
      this.ui.stage.dataset.state = 'playing';
      this.ui.stage.dataset.dialogue = 'false';
    }
    this.resetRun();
    this.camera.x = clamp(this.hero.x - VIEW_W * 0.44, 0, WORLD_W - VIEW_W);
    this.cameraInit = true;
    this.last = performance.now();
    this.input.clearPressed();
    this.audio.musicTimer = 0.4;
    this.audio.chordIndex = 0;

    if (skipIntro) {
      this.afterIntro();
    } else {
      this.showDialogue([
        { speaker: '绯', text: '城在坠落，月亮却像什么都没发生。' },
        { speaker: '绯', text: '穿过余烬长街，抵达无相圣所——把这场轮回，一刀斩断。' }
      ], () => this.afterIntro());
    }
  }

  resetRun() {
    this.runTime = 0;
    this.deaths = 0;
    this.kills = 0;
    this.echoCount = 0;
    this.stats = { kills: 0, echoes: 0, deaths: 0, time: 0 };
    this.hero.reset(LEVEL.start.x, LEVEL.start.y);
    this.hero.onGround = true;
    this.hero.dir = 1;
    this.boss.reset();
    this.enemies = LEVEL.enemies.map(data => new Enemy(this, data));
    this.buildPickupData();
    this.buildCheckpointData();
    this.respawnPoint = { x: LEVEL.start.x, y: LEVEL.start.y };
    this.bossTriggered = false;
    this.bossDialogueDone = false;
    this.gateActive = false;
    this.bossDeathTimer = 0;
    this.slowmo = 0;
    this.parrySlowT = 0;
    this.parryTextT = 0;
    this.parryFlash = 0;
    this.hitstop = 0;
    this.hitFlash = 0;
    this.shake = 0;
    this.particles = [];
    this.playerBullets = [];
    this.enemyBullets = [];
    this.damageTexts = [];
    this.shockwaves = [];
    this.slashArcs = [];
    this.alerts = [];
    this.toast = null;
    this.chapterCard = null;
    this.chapterQueue = [];
    this.tutorialT = 0;
    this.onWeaponChanged();
    this.dialogue = null;
    this.pendingEnd = null;
    this.endType = null;
    this.deathTimer = 0;
    this.fallingOut = false;
    this.shownChapters = LEVEL.chapters.map(() => false);
    this.rebuildSolids();
    this.camera.x = 0;
  }

  buildPickupData() {
    this.pickups = LEVEL.pickups.map((p, i) => ({
      ...p, id: i, collected: false, phase: hash(i * 3.4) * TAU
    }));
    this.echoes = LEVEL.echoes.map((e, i) => ({
      ...e, collected: false, phase: hash(i * 7.2) * TAU
    }));
  }

  buildCheckpointData() {
    this.checkpoints = LEVEL.checkpoints.map(cp => ({
      ...cp, active: false, phase: hash(cp.x) * TAU
    }));
  }

  rebuildSolids() {
    this.solids = LEVEL.grounds.map(g => ({ ...g }));
    if (this.gateActive) {
      this.solids.push({ x: LEVEL.arena.left - 18, y: 80, w: 36, h: 520 });
      this.solids.push({ x: LEVEL.arena.right - 18, y: 80, w: 36, h: 520 });
    }
  }

  afterIntro() {
    this.tutorialT = 12;
    this.shownChapters[0] = true;
    setTimeout(() => {
      if (this.state === 'playing' && this.hero.x < 620) this.queueChapterCard(LEVEL.chapters[0]);
    }, 250);
    this.input.clearPressed();
  }

  queueChapterCard(ch) {
    if (!ch) return;
    if (this.chapterCard || this.toast) {
      if (!this.chapterQueue.some(c => c.title === ch.title)) this.chapterQueue.push(ch);
      return;
    }
    this.showChapterCard(ch);
  }

  showChapterCard(ch) {
    if (!ch) return;
    this.chapterCard = { ...ch, t: 0, duration: 3.6 };
    this.audio.tone(196, 1.3, { type: 'sine', vol: 0.025, attack: 0.2, release: 1.1 });
    this.audio.tone(293.7, 1.5, { type: 'sine', vol: 0.018, attack: 0.3, release: 1.2, delay: 0.15 });
  }

  showToast(speaker, text, duration = 3.4) {
    this.toast = { speaker, text, t: 0, duration, max: duration };
  }

  showDialogue(lines, onDone) {
    this.dialogue = {
      lines: lines.map(l => ({ speaker: l.speaker, text: l.text, chars: 0, done: false })),
      index: 0,
      onDone,
      hold: 0,
      t: 0
    };
    this.input.clearPressed();
    this.ui.stage.dataset.dialogue = 'true';
    this.audio.click(520);
  }

  updateDialogue(dt) {
    const d = this.dialogue;
    if (!d) return;
    const line = d.lines[d.index];
    if (!line) return;
    d.t += dt;
    const speed = 34;
    if (!line.done) {
      line.chars = Math.min(line.text.length, line.chars + speed * dt);
      if (line.chars >= line.text.length) line.done = true;
    }
    const advance = this.input.wasPressed('jump') || this.input.wasPressed('confirm') ||
      this.input.wasPressed('attack');
    if (advance) this.advanceDialogue();
  }

  advanceDialogue() {
    const d = this.dialogue;
    if (!d) return;
    const line = d.lines[d.index];
    if (!line) return;
    if (line.chars < line.text.length) {
      line.chars = line.text.length;
      line.done = true;
      this.audio.click(680);
    } else if (d.index < d.lines.length - 1) {
      d.index++;
      d.t = 0;
      this.audio.click(620);
    } else {
      const cb = d.onDone;
      this.dialogue = null;
      this.input.clearPressed();
      this.input.down.delete('attack');
      this.input.down.delete('guard');
      this.ui.stage.dataset.dialogue = 'false';
      if (cb) cb();
    }
  }

  update(dt) {
    this.time += dt;
    this.audio.update(dt, this.renderer.getZone(this.camera.x));
    this.hitFlash = Math.max(0, this.hitFlash - dt * 2.6);
    this.shake = Math.max(0, this.shake - dt * 28);
    this.parryTextT = Math.max(0, this.parryTextT - dt);
    this.parryFlash = Math.max(0, this.parryFlash - dt);

    if (this.input.wasPressed('mute')) this.toggleSound();

    if (this.state === 'menu') {
      this.menuTime += dt;
      this.hero.animTime += dt;
      this.hero.dir = -1;
      this.updateParticles(dt);
      if (chance(0.13)) {
        this.spawnParticle({
          x: 760 + rand(-60, 260), y: 260 + rand(-60, 240),
          vx: rand(-8, 10), vy: rand(5, 18),
          life: rand(2.5, 5), size: rand(0.8, 2.0), color: '#d75c70',
          kind: chance(0.35) ? 'petal' : 'dust', alpha: rand(0.1, 0.4)
        });
      }
      if (this.wardrobeOpen) {
        if (this.input.wasPressed('pause')) this.wardrobe.close();
        return;
      }
      if (this.input.wasPressed('confirm') || this.input.wasPressed('jump')) {
        this.startGame(false);
      }
      return;
    }

    if (this.input.wasPressed('pause')) {
      if (this.state === 'playing') {
        this.pause();
        return;
      }
      if (this.state === 'paused') {
        this.resume();
        return;
      }
    }

    if (this.state === 'paused') return;
    if (this.state === 'dead') {
      this.updateParticles(dt * 0.25);
      return;
    }
    if (this.state === 'dying') {
      this.deathTimer -= dt;
      this.updateParticles(dt * 0.35);
      this.updateCamera(dt * 0.5);
      this.slowmo = Math.max(0, this.slowmo - dt);
      if (this.deathTimer <= 0) this.showEndScreen('dead');
      return;
    }
    if (this.state === 'victory') {
      this.updateParticles(dt * 0.5);
      return;
    }

    this.updateHudTimers(dt);
    if (this.dialogue) {
      this.updateDialogue(dt);
      this.updateParticles(dt);
      this.updateCamera(dt);
      return;
    }

    if (this.hitstop > 0) {
      this.hitstop -= dt;
      this.updateParticles(dt * 0.18);
      this.updateCamera(dt);
      return;
    }

    this.updateWorld(dt);
  }

  updateHudTimers(dt) {
    if (this.toast) {
      this.toast.t += dt;
      if (this.toast.t >= this.toast.duration) this.toast = null;
    }
    if (this.chapterCard) {
      this.chapterCard.t += dt;
      if (this.chapterCard.t >= this.chapterCard.duration) this.chapterCard = null;
    }
    if (!this.chapterCard && !this.toast && this.chapterQueue && this.chapterQueue.length && this.state === 'playing') {
      this.showChapterCard(this.chapterQueue.shift());
    }
    if (this.tutorialT > 0) this.tutorialT -= dt;
  }

  updateWorld(dt) {
    this.runTime += dt;
    const slow = this.slowmo > 0;
    const parrySlow = this.parrySlowT > 0;
    this.slowmo = Math.max(0, this.slowmo - dt);
    this.parrySlowT = Math.max(0, this.parrySlowT - dt);
    let wdt = dt;
    if (slow) wdt *= 0.26;
    if (parrySlow) wdt *= 0.3;

    this.hero.update(wdt, this);
    if (this.state !== 'playing') return;

    for (const e of this.enemies) e.update(wdt, this);
    if (this.state !== 'playing') return;

    if (this.boss.active) this.boss.update(wdt, this);
    this.updatePlayerBullets(wdt);
    this.updateEnemyBullets(wdt);
    this.updatePickups(wdt);
    this.updateTriggers(wdt);
    this.updateParticles(dt);
    this.updateShockwaves(dt);
    this.updateSlashArcs(dt);
    this.updateCamera(dt);

    if (this.boss.dead && this.bossDeathTimer > 0) {
      this.bossDeathTimer -= dt;
      if (chance(0.5)) {
        this.spawnBossBurst(this.boss.x + rand(-80, 80), this.boss.y + rand(-80, 80), 3);
      }
      if (this.bossDeathTimer <= 0) this.finishVictory();
    }

    if (this.fallingOut && this.hero.onGround) this.fallingOut = false;
  }

  updateTriggers(dt) {
    const x = this.hero.x;

    // 章节
    for (let i = 0; i < LEVEL.chapters.length; i++) {
      if (!this.shownChapters[i] && x >= LEVEL.chapters[i].at) {
        this.shownChapters[i] = true;
        this.queueChapterCard(LEVEL.chapters[i]);
      }
    }

    // 篝火
    for (const cp of this.checkpoints) {
      if (cp.active) continue;
      if (Math.abs(this.hero.x - cp.x) < 74 && Math.abs(this.hero.y - cp.y) < 44) {
        cp.active = true;
        this.respawnPoint = { x: cp.x + 66, y: 600 };
        const healed = this.hero.heal(34);
        this.hero.energy = Math.min(100, this.hero.energy + 18);
        this.audio.checkpoint();
        this.showToast('篝火', healed > 0 ? '余烬还记得你的名字。归途已点亮。' : '归途已点亮，长夜仍在继续。', 3.8);
        this.spawnBurst(cp.x, cp.y - 64, '#f5c883', 32, 190);
        this.spawnShockwave(cp.x, cp.y - 30, 150, '#f2c486', 0.9);
        this.addShake(3);
      }
    }

    // 残响
    for (const echo of this.echoes) {
      if (echo.collected) continue;
      if (Math.hypot(this.hero.x - echo.x, this.hero.y - 45 - echo.y) < 48) {
        echo.collected = true;
        this.echoCount++;
        this.hero.energy = Math.min(100, this.hero.energy + 20);
        this.audio.pickup();
        this.spawnBurst(echo.x, echo.y, '#f0c277', 26, 180);
        this.spawnShockwave(echo.x, echo.y, 90, '#f4d59e', 0.7);
        const n = ['一', '二', '三', '四', '五'][echo.id] || '一';
        this.showToast(`残响 · ${n}`, LEVEL.echoesText[echo.id] || '', 5.2);
      }
    }

    // 拾取
    for (const p of this.pickups) {
      if (p.collected) continue;
      if (Math.hypot(this.hero.x - p.x, this.hero.y - 48 - p.y) < 42) {
        p.collected = true;
        if (p.type === 'health') {
          const healed = this.hero.heal(34);
          if (healed > 0) {
            this.spawnDamageText(this.hero.x, this.hero.y - 92, `+${healed}`, 'heal');
          } else {
            this.hero.energy = Math.min(100, this.hero.energy + 16);
          }
          this.spawnBurst(p.x, p.y, '#ff7f8e', 22, 150);
        } else {
          this.hero.energy = Math.min(100, this.hero.energy + 32);
          this.spawnBurst(p.x, p.y, '#8adfdc', 22, 150);
        }
        this.audio.pickup();
        this.spawnShockwave(p.x, p.y, 65, p.type === 'health' ? '#ff8d94' : '#8be0db', 0.55);
      }
    }

    if (!this.bossTriggered && this.hero.x >= LEVEL.arena.trigger) {
      this.startBossEncounter(false);
    }

    if (this.hero.y > 830) this.onHeroFall();
  }

  updatePickups(dt) {
    // 数据驱动的上下浮动与光点在绘制时计算
  }

  updateCamera(dt) {
    if (this.state === 'menu') {
      this.camera.x = 0;
      return;
    }
    let target;
    if (this.boss.active && !this.boss.dead && this.hero.x > LEVEL.arena.left - 80) {
      target = (this.hero.x + this.boss.x) / 2 - VIEW_W * 0.48;
    } else {
      target = this.hero.x - VIEW_W * 0.44 + this.hero.dir * 36 + clamp(this.hero.vx * 0.12, -46, 46);
    }
    target = clamp(target, 0, WORLD_W - VIEW_W);
    if (!this.cameraInit) {
      this.camera.x = target;
      this.cameraInit = true;
    } else {
      this.camera.x = damp(this.camera.x, target, 4.2, dt);
      this.camera.x = clamp(this.camera.x, 0, WORLD_W - VIEW_W);
    }
    this.camera.y = 0;
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.ui.stage.dataset.state = 'paused';
    this.updateSoundLabels();
    this.ui.pause.hidden = false;
    this.input.releaseAll();
    this.audio.click(420);
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.ui.stage.dataset.state = 'playing';
    this.ui.pause.hidden = true;
    this.input.clearPressed();
    this.last = performance.now();
    this.audio.click(620);
  }

  startBossEncounter(skipDialogue = false) {
    if (this.bossTriggered) return;
    this.bossTriggered = true;
    this.gateActive = true;
    this.rebuildSolids();
    this.boss.activate();
    this.addShake(10);
    this.spawnBossBurst(this.boss.x, this.boss.y + 50, 25);
    this.audio.bossRoar();
    if (!skipDialogue) {
      this.showDialogue([
        { speaker: '无相', text: '你终于来了，执刃的少女。' },
        { speaker: '绯', text: '让开。我要去长夜尽头。' },
        { speaker: '无相', text: '那就用你的剑与枪，回答这座城的悔恨。' }
      ], () => {
        this.bossDialogueDone = true;
        this.audio.bossRoar();
        this.addShake(6);
      });
    } else {
      this.bossDialogueDone = true;
    }
  }

  onHeroFall() {
    if (this.fallingOut || this.state !== 'playing') return;
    this.fallingOut = true;
    const oldX = this.hero.x;
    this.hero.hurt(18, oldX, this, null, { ignoreGuard: true });
    this.spawnBurst(this.hero.x, 790, '#9bdad5', 22, 220);
    if (this.hero.alive) {
      this.hero.x = this.respawnPoint.x;
      this.hero.y = this.respawnPoint.y;
      this.hero.vx = 0;
      this.hero.vy = 0;
      this.hero.invuln = Math.max(this.hero.invuln, 1.3);
      this.camera.x = clamp(this.hero.x - VIEW_W * 0.44, 0, WORLD_W - VIEW_W);
      this.showToast('深渊', '余烬将你推回岸边。', 2.6);
      this.spawnShockwave(this.hero.x, this.hero.y - 30, 100, '#8adfdc', 0.6);
    }
    setTimeout(() => { this.fallingOut = false; }, 400);
  }

  onHeroDeath() {
    if (this.state !== 'playing') return;
    this.state = 'dying';
    this.ui.stage.dataset.state = 'dying';
    this.deathTimer = 1.35;
    this.slowmo = 0.85;
    this.deaths++;
    this.stats.deaths++;
    this.audio.death();
    this.addShake(16);
    this.hitFlash = Math.max(this.hitFlash, 0.4);
    this.hitFlashColor = '160,26,48';
    this.spawnBurst(this.hero.x, this.hero.y - 46, '#ff6e7b', 50, 330);
    this.spawnShockwave(this.hero.x, this.hero.y - 30, 190, '#ff5f75', 1.1);
    this.enemyBullets = [];
  }

  onHeroHurt() {
    this.shake = Math.max(this.shake, 8);
  }

  onEnemyKilled(enemy) {
    this.kills++;
    this.stats.kills++;
    this.hero.energy = Math.min(100, this.hero.energy + (enemy.type === 'sentinel' ? 16 : 8));
    if (this.hero.hp < this.hero.maxHp * 0.38 && chance(0.2)) {
      this.pickups.push({
        type: 'health', x: enemy.x, y: enemy.y, id: `drop${this.kills}`,
        collected: false, phase: rand(0, TAU), dynamic: true, vy: -150
      });
    }
  }

  onBossDeath(boss) {
    this.kills++;
    this.stats.kills++;
    this.bossDeathTimer = 2.8;
    this.slowmo = 1.65;
    this.hitstop = 0.1;
    this.hitFlash = 0.55;
    this.hitFlashColor = '255,220,190';
    this.gateActive = false;
    this.rebuildSolids();
    this.enemyBullets = [];
    this.addShake(22);
    this.spawnBossBurst(boss.x, boss.y, 70);
    this.spawnShockwave(boss.x, boss.y, 420, '#ffd9a1', 1.4);
    this.showToast('无相', '「原来……长夜也会结束。」', 3.6);
    this.audio.bossRoar();
    this.stats.time = this.runTime;
    this.stats.echoes = this.echoCount;
  }

  finishVictory() {
    this.state = 'victory';
    this.stats.time = this.runTime;
    this.stats.echoes = this.echoCount;
    this.stats.kills = this.kills;
    this.stats.deaths = this.deaths;
    this.audio.victory();
    this.showEndScreen('victory');
  }

  showEndScreen(type) {
    this.endType = type;
    this.state = type === 'dead' ? 'dead' : 'victory';
    this.ui.stage.dataset.state = this.state;
    this.input.clearPressed();
    const victory = type === 'victory';
    this.ui.endKicker.textContent = victory ? 'THE NIGHT ENDS' : 'THE NIGHT CLAIMS YOU';
    this.ui.endTitle.textContent = victory ? '长夜已尽' : '余烬未熄';
    this.ui.endCopy.textContent = victory
      ? '无相消散，血月坠落。绯收起剑，把最后一颗子弹留给了黎明。'
      : '绯倒在了长夜之中。篝火仍在燃烧，等待下一次苏醒。';
    const time = formatTime(this.runTime);
    this.ui.endStats.innerHTML =
      `<div><b>${time}</b><span>旅程</span></div>` +
      `<div><b>${this.kills}</b><span>击破</span></div>` +
      `<div><b>${this.echoCount} / 5</b><span>残响</span></div>` +
      `<div class="accent"><b>${this.deaths}</b><span>陨落</span></div>`;
    this.ui.retryLabel.textContent = victory ? '再次启程' : '从篝火苏醒';
    this.ui.end.hidden = false;
  }

  respawn() {
    this.ui.end.hidden = true;
    this.endType = null;
    this.state = 'playing';
    this.ui.stage.dataset.state = 'playing';
    this.hero.reset(this.respawnPoint.x, this.respawnPoint.y);
    this.hero.onGround = true;
    this.hero.invuln = 2.0;
    this.onWeaponChanged();
    this.boss.reset();
    this.bossTriggered = false;
    this.bossDialogueDone = false;
    this.bossDeathTimer = 0;
    this.gateActive = false;
    this.rebuildSolids();
    for (const e of this.enemies) e.reset();
    this.playerBullets = [];
    this.enemyBullets = [];
    this.particles = [];
    this.damageTexts = [];
    this.shockwaves = [];
    this.slashArcs = [];
    this.alerts = [];
    this.toast = null;
    this.chapterCard = null;
    this.chapterQueue = [];
    this.dialogue = null;
    this.ui.stage.dataset.dialogue = 'false';
    this.tutorialT = 0;
    this.slowmo = 0;
    this.parrySlowT = 0;
    this.parryTextT = 0;
    this.parryFlash = 0;
    this.hitstop = 0;
    this.hitFlash = 0;
    this.camera.x = clamp(this.hero.x - VIEW_W * 0.44, 0, WORLD_W - VIEW_W);
    this.cameraInit = true;
    this.input.clearPressed();
    this.last = performance.now();
    this.showToast('篝火', '余烬还记得你的名字。', 3);
    this.audio.checkpoint();
  }

  teleport(x) {
    this.hero.x = x;
    this.hero.y = 600;
    this.hero.vx = 0;
    this.hero.vy = 0;
    this.hero.onGround = true;
    this.camera.x = clamp(x - VIEW_W * 0.44, 0, WORLD_W - VIEW_W);
    this.cameraInit = true;
  }

  onWeaponChanged() {
    if (!this.ui) return;
    const gun = this.hero.weapon === 'gun';
    if (this.ui.touchWeaponBtn) this.ui.touchWeaponBtn.textContent = gun ? '枪' : '剑';
    if (this.ui.touchAttackBtn) this.ui.touchAttackBtn.textContent = gun ? '射' : '斩';
  }

  getAimWorldPoint() {
    const hero = this.hero;
    const mouse = this.input.mouse;
    if (!this.isTouch && mouse.active && mouse.inside) {
      return { x: mouse.x + this.camera.x, y: mouse.y + this.camera.y, source: 'mouse' };
    }
    // 触屏没有鼠标：自动锁定附近敌人，否则沿当前朝向攻击
    if (this.isTouch) {
      let best = null;
      let bestDist = 620;
      const ox = hero.x;
      const oy = hero.y - 52;
      const candidates = [];
      for (const e of this.enemies) {
        if (!e.dead) candidates.push(e);
      }
      if (this.boss.active && !this.boss.dead) candidates.push(this.boss);
      for (const target of candidates) {
        const d = Math.hypot(target.x - ox, (target.y - 20) - oy);
        if (d < bestDist) {
          bestDist = d;
          best = target;
        }
      }
      if (best) return { x: best.x, y: best.y - 18, source: 'auto' };
    }
    return { x: hero.x + hero.dir * 240, y: hero.y - 58, source: 'facing' };
  }

  onPerfectParry(hero, source, projectile) {
    this.parrySlowT = 1.0;
    this.parryTextT = 1.15;
    this.parryFlash = Math.max(this.parryFlash, 0.3);
    this.parryCount++;
    this.audio.parry();
    this.addShake(8);
    this.hitstop = Math.max(this.hitstop, 0.045);
    this.hitFlash = Math.max(this.hitFlash, 0.12);
    this.hitFlashColor = '158,234,227';
    const sx = hero.x + Math.cos(hero.aimWorldAngle) * 30;
    const sy = hero.y - 58 + Math.sin(hero.aimWorldAngle) * 30;
    this.spawnShockwave(sx, sy, 230, '#a9f0e8', 0.75);
    this.spawnShockwave(sx, sy, 120, '#f5d59a', 0.45);
    this.spawnBurst(sx, sy, '#e9fff7', 34, 260);
    this.spawnBurst(sx, sy, '#f2c47c', 20, 190);

    if (projectile) this.reflectEnemyProjectile(projectile);
    if (source && typeof source.takeDamage === 'function' && !source.dead) {
      source.takeDamage(36, this, 'parry');
    }
  }

  reflectEnemyProjectile(bullet) {
    const speed = Math.hypot(bullet.vx, bullet.vy) * 1.25;
    const angle = Math.atan2(-bullet.vy, -bullet.vx);
    this.playerBullets.push({
      x: bullet.x,
      y: bullet.y,
      px: bullet.x,
      py: bullet.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.35,
      damage: Math.max(34, Math.round(bullet.damage * 2.8)),
      reflected: true
    });
    this.spawnCastFlash(bullet.x, bullet.y, '#f9dc9e');
  }

  onGuardBlock(hero, source, projectile, amount) {
    hero.guardBlockFlash = 0.24;
    this.audio.guardBlock();
    this.addShake(3.5);
    const sx = hero.x + Math.cos(hero.aimWorldAngle) * 28;
    const sy = hero.y - 58 + Math.sin(hero.aimWorldAngle) * 28;
    this.spawnHitSpark(sx, sy, '#9fdcd7', 12);
    this.spawnShockwave(sx, sy, 55, '#8cd4d0', 0.35);
  }

  addShake(v) {
    if (REDUCED_MOTION) return;
    this.shake = Math.max(this.shake, v);
  }

  spawnShockwave(x, y, radius, color, duration = 0.8) {
    this.shockwaves.push({ x, y, radius, color, life: duration, maxLife: duration });
  }

  /* ================= 粒子与特效 ================= */
  spawnParticle(opts) {
    if (this.particles.length > 900) this.particles.shift();
    const life = opts.life ?? 0.5;
    this.particles.push({
      x: 0, y: 0, vx: 0, vy: 0,
      life, maxLife: life, size: 2, color: '#ffffff',
      kind: 'dot', gravity: 0, drag: 0, rot: rand(0, TAU), vr: rand(-6, 6),
      alpha: 1, ...opts
    });
  }

  spawnBurst(x, y, color, count = 16, speed = 240) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const s = rand(speed * 0.25, speed);
      this.spawnParticle({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 40,
        life: rand(0.22, 0.7),
        size: rand(0.8, 2.8),
        color,
        kind: chance(0.45) ? 'streak' : 'dot',
        gravity: rand(120, 430),
        drag: rand(0.5, 2.8)
      });
    }
    for (let i = 0; i < 4; i++) {
      this.spawnParticle({
        x, y, vx: rand(-30, 30), vy: rand(-70, -10),
        life: rand(0.5, 0.9), size: rand(6, 16), color,
        kind: 'smoke', alpha: 0.18, gravity: -10, drag: 1
      });
    }
  }

  spawnHitSpark(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const a = rand(-Math.PI, Math.PI);
      const s = rand(110, 430);
      this.spawnParticle({
        x: x + rand(-6, 6), y: y + rand(-8, 8),
        vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: rand(0.12, 0.36), size: rand(1, 2.6),
        color, kind: 'streak', drag: 3
      });
    }
    this.spawnParticle({
      x, y, life: 0.18, size: 20, color, kind: 'flash', alpha: 0.5
    });
  }

  spawnDamageText(x, y, amount, kind = 'damage-enemy') {
    const isHeal = kind === 'heal';
    const isPlayer = kind === 'damage-player';
    this.damageTexts.push({
      x, y,
      vx: rand(-18, 18),
      vy: isHeal ? -46 : -70,
      life: 0.8,
      maxLife: 0.8,
      text: isPlayer ? `−${amount}` : (isHeal ? `${amount}` : `${amount}`),
      color: isHeal ? '#9be5bf' : (isPlayer ? '#ff6c7d' : '#ffe0ae'),
      size: isPlayer ? 18 : 16
    });
  }

  spawnMuzzleSmoke(x, y, angle) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    for (let i = 0; i < 4; i++) {
      const spread = rand(-0.7, 0.7);
      this.spawnParticle({
        x, y,
        vx: (dx * rand(40, 120)) + Math.cos(angle + spread) * rand(5, 30),
        vy: (dy * rand(40, 120)) + Math.sin(angle + spread) * rand(5, 30),
        life: rand(0.18, 0.38), size: rand(3, 8),
        color: '#e4b27e', kind: 'smoke', alpha: 0.24,
        gravity: -20, drag: 3
      });
    }
    this.spawnParticle({
      x, y, vx: dx * 20, vy: dy * 20,
      life: 0.12, size: 13, color: '#ffd7a0', kind: 'flash', alpha: 0.35
    });
  }

  spawnReloadRing(x, y) {
    this.spawnShockwave(x, y, 32, '#e8c68a', 0.45);
    for (let i = 0; i < 5; i++) {
      this.spawnParticle({
        x: x + rand(-15, 15), y: y + rand(-8, 10),
        vx: rand(-25, 25), vy: rand(-50, -15),
        life: rand(0.25, 0.5), size: rand(0.8, 1.8),
        color: '#f0d5a0', kind: 'dot', drag: 2
      });
    }
  }

  spawnJumpDust(x, y) {
    for (let i = 0; i < 8; i++) {
      this.spawnParticle({
        x: x + rand(-15, 15), y: y + rand(-3, 2),
        vx: rand(-110, 110), vy: rand(-20, 30),
        life: rand(0.2, 0.45), size: rand(4, 11),
        color: '#8aa8a6', kind: 'smoke', alpha: 0.18,
        gravity: 40, drag: 3
      });
    }
  }

  spawnAirJump(x, y) {
    this.spawnShockwave(x, y, 45, '#9be9e4', 0.5);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      this.spawnParticle({
        x, y,
        vx: Math.cos(a) * rand(120, 250),
        vy: Math.sin(a) * rand(40, 130) + 40,
        life: rand(0.22, 0.5),
        size: rand(0.8, 2.2),
        color: i % 3 === 0 ? '#fff2d8' : '#87e2dd',
        kind: 'streak', drag: 3
      });
    }
  }

  spawnDashBurst(x, y, dir) {
    for (let i = 0; i < 12; i++) {
      this.spawnParticle({
        x: x - dir * rand(0, 25), y: y + rand(-40, 35),
        vx: -dir * rand(80, 290), vy: rand(-40, 40),
        life: rand(0.16, 0.38), size: rand(0.7, 2.2),
        color: i % 4 === 0 ? '#f4d6a0' : '#9ce7e1', kind: 'streak', drag: 2
      });
    }
    this.spawnParticle({
      x, y, life: 0.2, size: 38, color: '#9ce7e1', kind: 'ring', alpha: 0.3
    });
  }

  spawnFootstep(x, y, dir) {
    for (let i = 0; i < 2; i++) {
      this.spawnParticle({
        x: x - dir * 8 + rand(-4, 4), y: y - rand(0, 3),
        vx: -dir * rand(10, 45), vy: rand(-18, -5),
        life: rand(0.25, 0.5), size: rand(2.5, 5.5),
        color: '#91aaa7', kind: 'smoke', alpha: 0.14, gravity: -8, drag: 2
      });
    }
  }

  spawnDust(x, y, dir) {
    this.spawnParticle({
      x, y, vx: -dir * rand(20, 80), vy: rand(-40, -10),
      life: rand(0.3, 0.6), size: rand(3, 8), color: '#8d8688',
      kind: 'smoke', alpha: 0.16, drag: 2
    });
  }

  spawnAlert(x, y) {
    this.alerts.push({ x, y, life: 0.7, maxLife: 0.7 });
  }

  spawnCastFlash(x, y, color) {
    this.spawnParticle({ x, y, life: 0.28, size: 28, color, kind: 'flash', alpha: 0.4 });
    for (let i = 0; i < 6; i++) {
      const a = rand(0, TAU);
      this.spawnParticle({
        x, y, vx: Math.cos(a) * rand(40, 130), vy: Math.sin(a) * rand(40, 130),
        life: rand(0.2, 0.4), size: rand(0.7, 1.8), color, kind: 'streak', drag: 2
      });
    }
  }

  spawnBossBurst(x, y, count = 16) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const s = rand(80, 500);
      this.spawnParticle({
        x: x + rand(-50, 50), y: y + rand(-60, 50),
        vx: Math.cos(a) * s, vy: Math.sin(a) * s - 50,
        life: rand(0.25, 0.8), size: rand(0.9, 3.2),
        color: chance(0.3) ? '#ffe2b4' : (chance(0.5) ? '#ff6b78' : '#c85272'),
        kind: chance(0.35) ? 'streak' : 'dot',
        gravity: rand(100, 420), drag: rand(0.4, 2)
      });
    }
  }

  spawnChargeTrail(boss) {
    if (chance(0.6)) {
      this.spawnParticle({
        x: boss.x + rand(-30, 30), y: boss.y + rand(10, 70),
        vx: -boss.chargeDir * rand(80, 220), vy: rand(-70, -5),
        life: rand(0.18, 0.4), size: rand(1, 3),
        color: '#ff8a72', kind: 'streak', drag: 1.5
      });
    }
    if (chance(0.45)) this.spawnDust(boss.x - boss.chargeDir * 35, 596, boss.chargeDir);
  }

  spawnEnergyMote(hero) {
    const a = rand(0, TAU);
    this.spawnParticle({
      x: hero.x + Math.cos(a) * rand(20, 55),
      y: hero.y - 44 + Math.sin(a) * rand(20, 55),
      vx: rand(-8, 8), vy: rand(-28, -8),
      life: rand(0.5, 1.0), size: rand(0.8, 2),
      color: '#f5cd90', kind: 'dot', drag: 1
    });
  }

  triggerSpecial(hero) {
    this.audio.special();
    this.addShake(15);
    this.hitFlash = Math.max(this.hitFlash, 0.26);
    this.hitFlashColor = '255,220,176';
    this.spawnShockwave(hero.x, hero.y - 35, 340, '#ffe0a5', 1.0);
    this.spawnShockwave(hero.x, hero.y - 35, 210, '#f48a9a', 0.75);
    this.spawnBurst(hero.x, hero.y - 40, '#ffe2ae', 46, 360);
    this.hitstop = 0.075;

    const cx = hero.x;
    const cy = hero.y - 35;
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (Math.hypot(e.x - cx, e.y - cy) < 330) {
        e.takeDamage(86, this, 'special');
      }
    }
    if (this.boss.active && !this.boss.dead) {
      if (Math.hypot(this.boss.x - cx, this.boss.y - cy) < 380) {
        this.boss.takeDamage(130, this);
      }
    }
    this.showToast('月华', '斩夜 · 余烬为刃', 2.2);
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.gravity || 0) * dt;
      p.vx *= Math.max(0, 1 - (p.drag || 0) * dt);
      p.vy *= Math.max(0, 1 - (p.drag || 0) * 0.35 * dt);
      p.rot += p.vr * dt;
    }
    for (let i = this.damageTexts.length - 1; i >= 0; i--) {
      const t = this.damageTexts[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.damageTexts.splice(i, 1);
        continue;
      }
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.vy += 90 * dt;
    }
    for (let i = this.alerts.length - 1; i >= 0; i--) {
      this.alerts[i].life -= dt;
      if (this.alerts[i].life <= 0) this.alerts.splice(i, 1);
    }
  }

  updateShockwaves(dt) {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      this.shockwaves[i].life -= dt;
      if (this.shockwaves[i].life <= 0) this.shockwaves.splice(i, 1);
    }
  }

  updateSlashArcs(dt) {
    for (let i = this.slashArcs.length - 1; i >= 0; i--) {
      this.slashArcs[i].life -= dt;
      if (this.slashArcs[i].life <= 0) this.slashArcs.splice(i, 1);
    }
  }

  /* ================= 子弹 ================= */
  spawnPlayerBullet(x, y, angle, hero) {
    const speed = 1180;
    this.playerBullets.push({
      x, y, px: x, py: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.9,
      damage: 15
    });
  }

  spawnEnemyBullet(x, y, angle, speed, damage, type = 'orb') {
    this.enemyBullets.push({
      x, y, px: x, py: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: type === 'boss' ? 9 : 7,
      damage,
      type,
      life: 4.5,
      phase: rand(0, TAU)
    });
    this.spawnParticle({ x, y, life: 0.22, size: 18, color: type === 'boss' ? '#ff5d7e' : '#ff9d75', kind: 'flash', alpha: 0.3 });
  }

  applySwordHits(hero) {
    const reach = [112, 120, 146][hero.combo] || 112;
    const halfArc = [1.02, 1.08, 1.22][hero.combo] || 1.02;
    const damage = [18, 20, 36][hero.combo] || 18;
    const angle = hero.aimWorldAngle;
    const ox = hero.x;
    const oy = hero.y - 58;
    let hitAny = false;

    const overlapsSector = (bounds) => {
      const points = [
        [bounds.x + bounds.w * 0.5, bounds.y + bounds.h * 0.5],
        [bounds.x, bounds.y],
        [bounds.x + bounds.w, bounds.y],
        [bounds.x, bounds.y + bounds.h],
        [bounds.x + bounds.w, bounds.y + bounds.h],
        [bounds.x + bounds.w * 0.5, bounds.y],
        [bounds.x + bounds.w * 0.5, bounds.y + bounds.h]
      ];
      for (const [px, py] of points) {
        const dx = px - ox;
        const dy = py - oy;
        const dist = Math.hypot(dx, dy);
        if (dist > reach + 18) continue;
        if (dist < 38) return true;
        const diff = Math.abs(angleDelta(Math.atan2(dy, dx), angle));
        if (diff <= halfArc) return true;
      }
      return false;
    };

    for (const e of this.enemies) {
      if (e.dead) continue;
      if (overlapsSector(e.bounds)) {
        e.takeDamage(damage, this, 'sword');
        this.hero.energy = Math.min(100, this.hero.energy + 4.2);
        this.spawnHitSpark(e.x, e.y, '#ffe1b0', 12);
        hitAny = true;
      }
    }
    if (this.boss.active && !this.boss.dead && overlapsSector(this.boss.bounds)) {
      this.boss.takeDamage(damage + 2, this);
      this.hero.energy = Math.min(100, this.hero.energy + 5);
      this.spawnHitSpark(hero.x + Math.cos(angle) * 72, hero.y - 58 + Math.sin(angle) * 72, '#ffe2b3', 16);
      hitAny = true;
    }
    if (hitAny) {
      this.hitstop = Math.max(this.hitstop, hero.combo === 2 ? 0.075 : 0.05);
      this.addShake(hero.combo === 2 ? 5.5 : 2.8);
      this.audio.hit();
      const cx = hero.x + Math.cos(angle) * 58;
      const cy = hero.y - 58 + Math.sin(angle) * 58;
      this.spawnShockwave(cx, cy, 62, hero.combo === 2 ? '#ffce8f' : '#ffe6c2', 0.35);
    }
  }

  updatePlayerBullets(dt) {
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const b = this.playerBullets[i];
      b.px = b.x; b.py = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0) {
        this.playerBullets.splice(i, 1);
        continue;
      }
      if (this.pointSolid(b.x, b.y)) {
        this.spawnHitSpark(b.x, b.y, '#d8d0c5', 4);
        this.playerBullets.splice(i, 1);
        continue;
      }
      let hit = false;
      for (const e of this.enemies) {
        if (e.dead) continue;
        if (circleRect(b.x, b.y, 11, e.bounds)) {
          e.takeDamage(b.damage, this, 'gun');
          this.hero.energy = Math.min(100, this.hero.energy + 2.4);
          this.hitstop = Math.max(this.hitstop, 0.022);
          this.spawnHitSpark(b.x, b.y, '#ffdba4', 8);
          hit = true;
          break;
        }
      }
      if (!hit && this.boss.active && !this.boss.dead) {
        if (circleRect(b.x, b.y, 11, this.boss.bounds)) {
          this.boss.takeDamage(b.damage, this);
          this.hero.energy = Math.min(100, this.hero.energy + 2.6);
          this.hitstop = Math.max(this.hitstop, 0.022);
          this.spawnHitSpark(b.x, b.y, '#ffd0a0', 9);
          hit = true;
        }
      }
      if (hit) this.playerBullets.splice(i, 1);
    }
  }

  updateEnemyBullets(dt) {
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.px = b.x; b.py = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.x < -100 || b.x > WORLD_W + 100 || b.y < -100 || b.y > 760) {
        this.enemyBullets.splice(i, 1);
        continue;
      }
      if (this.pointSolid(b.x, b.y)) {
        this.spawnHitSpark(b.x, b.y, b.type === 'boss' ? '#ff7d8d' : '#e6ad86', 6);
        this.enemyBullets.splice(i, 1);
        continue;
      }
      if (circleRect(b.x, b.y, b.r, this.hero.bounds)) {
        const result = this.hero.incoming(b.damage, b.x, this, null, { projectile: b });
        if (result !== 'immune') {
          if (result !== 'perfect') this.spawnHitSpark(b.x, b.y, '#ff7788', 12);
          this.enemyBullets.splice(i, 1);
        }
      }
    }
  }

  bossBarrage(boss, wave) {
    const hero = this.hero;
    const sx = boss.x + boss.dir * 26;
    const sy = boss.y - 48;
    const base = Math.atan2((hero.y - 48) - sy, hero.x - sx);
    const count = boss.phase === 2 ? 7 : 5;
    const spread = boss.phase === 2 ? 1.2 : 0.95;
    for (let i = 0; i < count; i++) {
      const a = base + (i - (count - 1) / 2) * (spread / count) + rand(-0.02, 0.02);
      const speed = (boss.phase === 2 ? 330 : 285) + wave * 16;
      this.spawnEnemyBullet(sx, sy, a, speed, boss.phase === 2 ? 13 : 11, 'boss');
    }
    this.audio.noise(0.18, { vol: 0.055, freq: 700, freqEnd: 180, type: 'bandpass' });
    this.addShake(2);
    this.spawnCastFlash(sx, sy, '#ff5f7c');
  }

  bossSlash(boss) {
    this.audio.bossSlash();
    this.addShake(12);
    this.slashArcs.push({
      x: boss.x, y: boss.y - 30, dir: boss.dir,
      life: 0.38, maxLife: 0.38
    });
    const hb = {
      x: boss.dir > 0 ? boss.x - 20 : boss.x - 250,
      y: boss.y - 85,
      w: 270, h: 165
    };
    if (rectsOverlap(hb, this.hero.bounds)) {
      this.hero.hurt(boss.phase === 2 ? 29 : 25, boss.x, this, boss);
    }
    const cy = boss.y - 30;
    for (let i = 0; i < 16; i++) {
      const a = rand(-1.2, 1.2);
      const r = rand(60, 230);
      this.spawnParticle({
        x: boss.x + boss.dir * Math.cos(a) * r,
        y: cy + Math.sin(a) * r,
        vx: boss.dir * rand(30, 200), vy: rand(-120, 120),
        life: rand(0.2, 0.5), size: rand(0.9, 2.4),
        color: chance(0.4) ? '#ffe8c2' : '#ff6b76', kind: 'streak', drag: 2
      });
    }
  }

  floorAt(x, y) {
    let best = null;
    for (const g of this.solids) {
      if (x >= g.x && x <= g.x + g.w && g.y >= y - 4) {
        if (best === null || g.y < best) best = g.y;
      }
    }
    for (const p of this.platforms) {
      if (x >= p.x && x <= p.x + p.w && p.y >= y - 2) {
        if (best === null || p.y < best) best = p.y;
      }
    }
    return best;
  }

  pointSolid(x, y) {
    for (const s of this.solids) {
      if (pointInRect(x, y, s)) return true;
    }
    for (const p of this.platforms) {
      if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return true;
    }
    return false;
  }

  /* ================= 渲染 ================= */
  raf(ts) {
    let dt = (ts - this.last) / 1000;
    this.last = ts;
    if (!Number.isFinite(dt) || dt <= 0) dt = 1 / 60;
    dt = Math.min(dt, 1 / 30);
    this.update(dt);
    this.render();
    this.input.endFrame();
    requestAnimationFrame(this.raf);
  }

  render() {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    const cam = this.camera.x;
    const zone = this.renderer.getZone(cam);

    this.renderer.draw(ctx, this);

    let sx = 0, sy = 0;
    if (this.shake > 0 && !REDUCED_MOTION) {
      sx = rand(-this.shake, this.shake) * 0.55;
      sy = rand(-this.shake, this.shake) * 0.35;
    }

    ctx.save();
    ctx.translate(sx, sy);
    this.renderer.drawGround(ctx, cam, this.time, zone);
    this.renderer.drawProps(ctx, cam, this.time, zone);
    this.drawShrines(ctx, cam);
    this.drawEchoes(ctx, cam);
    this.drawPickups(ctx, cam);

    if (this.state !== 'menu') {
      this.renderer.drawBossGate(ctx, cam, this.time, this.gateActive, this.boss.dead);
      for (const e of this.enemies) e.draw(ctx, cam, this.time);
      this.boss.draw(ctx, cam, this.time);
      this.hero.draw(ctx, cam, this.time, this);
      this.drawPlayerBullets(ctx, cam);
      this.drawEnemyBullets(ctx, cam);
      this.drawSlashArcs(ctx, cam);
      this.drawShockwaves(ctx, cam);
      this.drawParticles(ctx, cam);
      this.drawAlerts(ctx, cam);
      this.drawDamageTexts(ctx, cam);
    } else {
      // 标题场景：月光落在少女身上
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const beam = ctx.createLinearGradient(1030, 120, 840, 620);
      beam.addColorStop(0, 'rgba(255, 154, 167, 0.08)');
      beam.addColorStop(0.55, 'rgba(222, 159, 170, 0.035)');
      beam.addColorStop(1, 'rgba(150, 210, 210, 0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(960, 150);
      ctx.lineTo(1086, 140);
      ctx.lineTo(1020, 650);
      ctx.lineTo(730, 650);
      ctx.closePath();
      ctx.fill();
      drawGlow(ctx, this.hero.x, 535, this.wardrobeOpen ? 210 : 150, '#e4a5a9', this.wardrobeOpen ? 0.09 : 0.055);
      if (this.wardrobeOpen) {
        const floor = ctx.createRadialGradient(this.hero.x, 600, 0, this.hero.x, 600, 160);
        floor.addColorStop(0, 'rgba(230, 179, 158, 0.11)');
        floor.addColorStop(1, 'rgba(230, 179, 158, 0)');
        ctx.fillStyle = floor;
        ctx.beginPath();
        ctx.ellipse(this.hero.x, 600, 155, 18, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
      this.hero.draw(ctx, cam, this.time, this, this.wardrobeOpen ? 1.38 : 1.16);
      this.drawParticles(ctx, cam);
    }

    this.renderer.drawForeground(ctx, cam, this.time, zone);
    ctx.restore();

    if (this.state !== 'menu') this.hud.draw(ctx);
    if (this.state !== 'menu') this.drawAimReticle(ctx, cam);
    if (this.hitFlash > 0) {
      ctx.fillStyle = `rgba(${this.hitFlashColor},${this.hitFlash * 0.65})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }

  drawShrines(ctx, cam) {
    for (const cp of this.checkpoints) {
      const x = cp.x - cam;
      if (x < -120 || x > VIEW_W + 120) continue;
      const y = cp.y;
      const active = cp.active;
      const t = this.time;
      ctx.save();
      // 石台
      ctx.fillStyle = 'rgba(15, 13, 24, 0.95)';
      ctx.beginPath();
      ctx.moveTo(x - 28, y);
      ctx.lineTo(x - 20, y - 30);
      ctx.lineTo(x + 20, y - 30);
      ctx.lineTo(x + 28, y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(35, 30, 42, 0.9)';
      ctx.fillRect(x - 24, y - 33, 48, 6);
      ctx.strokeStyle = active ? 'rgba(240, 195, 126, 0.7)' : 'rgba(154, 210, 204, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 19, y - 28);
      ctx.lineTo(x + 20, y - 28);
      ctx.stroke();

      // 悬浮火焰
      const flick = 0.8 + Math.sin(t * 7 + cp.phase) * 0.12;
      if (active) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        drawGlow(ctx, x, y - 60, 85 * flick, '#f3c981', 0.2);
        drawGlow(ctx, x, y - 59, 23, '#ffe3a6', 0.3);
        ctx.restore();
      }
      ctx.fillStyle = active ? 'rgba(248, 203, 128, 0.92)' : 'rgba(94, 181, 178, 0.4)';
      ctx.beginPath();
      ctx.moveTo(x, y - 35);
      ctx.quadraticCurveTo(x - 16, y - 52, x - 4 + Math.sin(t * 4 + cp.phase) * 4, y - 79 - flick * 8);
      ctx.quadraticCurveTo(x + 12, y - 52, x + 4, y - 35);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = active ? 'rgba(255, 245, 208, 0.9)' : 'rgba(143, 213, 207, 0.4)';
      ctx.beginPath();
      ctx.moveTo(x, y - 35);
      ctx.quadraticCurveTo(x - 5, y - 48, x + Math.sin(t * 5) * 2, y - 62);
      ctx.quadraticCurveTo(x + 5, y - 47, x + 2, y - 35);
      ctx.closePath();
      ctx.fill();

      // 飘带
      ctx.strokeStyle = active ? 'rgba(225, 166, 113, 0.4)' : 'rgba(115, 182, 178, 0.15)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(x - 20, y - 46);
      ctx.quadraticCurveTo(x - 30, y - 58, x - 25, y - 74 + Math.sin(t * 2) * 3);
      ctx.moveTo(x + 19, y - 48);
      ctx.quadraticCurveTo(x + 30, y - 59, x + 24, y - 78 + Math.sin(t * 2 + 1) * 3);
      ctx.stroke();

      // 已点亮的小字
      if (active) {
        ctx.save();
        ctx.globalAlpha = 0.54 + Math.sin(t * 2.2) * 0.08;
        ctx.fillStyle = '#e7c58f';
        ctx.font = '8px "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('篝 火', x, y - 98);
        ctx.restore();
      }
      ctx.restore();
    }
  }

  drawEchoes(ctx, cam) {
    for (const e of this.echoes) {
      if (e.collected) continue;
      const x = e.x - cam;
      if (x < -80 || x > VIEW_W + 80) continue;
      const t = this.time;
      const bob = Math.sin(t * 1.7 + e.phase) * 7;
      const y = e.y + bob;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, x, y, 58, '#edc384', 0.15);
      ctx.translate(x, y);
      ctx.rotate(t * 0.45 + e.phase);
      ctx.strokeStyle = 'rgba(241, 209, 157, 0.34)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 25 + Math.sin(t * 2 + e.phase) * 2, 0, TAU);
      ctx.stroke();
      ctx.rotate(-t * 0.8);
      ctx.fillStyle = 'rgba(245, 211, 151, 0.86)';
      drawDiamond(ctx, 0, 0, 8);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 246, 219, 0.9)';
      drawDiamond(ctx, 0, 0, 3.5);
      ctx.fill();
      // 羽状碎光
      for (let i = 0; i < 3; i++) {
        const a = t * 1.2 + i * TAU / 3 + e.phase;
        const px = Math.cos(a) * 31;
        const py = Math.sin(a) * 19;
        ctx.fillStyle = 'rgba(255, 234, 192, 0.45)';
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  drawPickups(ctx, cam) {
    for (const p of this.pickups) {
      if (p.collected) continue;
      const x = p.x - cam;
      if (x < -70 || x > VIEW_W + 70) continue;
      if (p.dynamic) {
        p.y += (p.vy || 0) * 0.016;
        p.vy = (p.vy || 0) + 500 * 0.016;
        if (p.y > 590) { p.y = 590; p.vy = 0; }
      }
      const y = p.y + Math.sin(this.time * 2.4 + (p.phase || 0)) * 5;
      const isHealth = p.type === 'health';
      const col = isHealth ? '#ff92a0' : '#97e8e1';
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, x, y, 42, col, 0.16);
      ctx.translate(x, y);
      ctx.rotate(this.time * 0.8 + (p.phase || 0));
      ctx.fillStyle = isHealth ? 'rgba(210, 54, 82, 0.88)' : 'rgba(54, 151, 153, 0.86)';
      drawDiamond(ctx, 0, 0, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 241, 214, 0.7)';
      ctx.lineWidth = 1;
      drawDiamond(ctx, 0, 0, 10);
      ctx.stroke();
      ctx.rotate(-(this.time * 0.8 + (p.phase || 0)));
      ctx.fillStyle = '#fff3da';
      if (isHealth) {
        ctx.fillRect(-1.5, -5, 3, 10);
        ctx.fillRect(-5, -1.5, 10, 3);
      } else {
        drawStar(ctx, 0, 0, 5.5, 2.2, 4, 0);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  drawPlayerBullets(ctx, cam) {
    for (const b of this.playerBullets) {
      const x = b.x - cam;
      const px = b.px - cam;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(px, b.py, x, b.y);
      g.addColorStop(0, 'rgba(255, 255, 255, 0)');
      g.addColorStop(0.45, b.reflected ? 'rgba(147, 238, 228, 0.65)' : 'rgba(255, 214, 151, 0.5)');
      g.addColorStop(1, b.reflected ? 'rgba(255, 240, 177, 1)' : 'rgba(255, 253, 239, 0.98)');
      ctx.strokeStyle = g;
      ctx.lineWidth = b.reflected ? 3.2 : 2.2;
      ctx.beginPath();
      ctx.moveTo(px, b.py);
      ctx.lineTo(x, b.y);
      ctx.stroke();
      drawGlow(ctx, x, b.y, b.reflected ? 17 : 10, b.reflected ? '#f7dd9c' : '#ffe1a9', b.reflected ? 0.55 : 0.38);
      ctx.fillStyle = b.reflected ? '#fff4b8' : '#fff8df';
      ctx.beginPath();
      ctx.arc(x, b.y, b.reflected ? 2.6 : 1.5, 0, TAU);
      ctx.fill();
      if (b.reflected) {
        ctx.strokeStyle = 'rgba(170, 240, 232, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, b.y, 7, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  drawEnemyBullets(ctx, cam) {
    for (const b of this.enemyBullets) {
      const x = b.x - cam;
      const px = b.px - cam;
      const boss = b.type === 'boss';
      const col = boss ? '#ff5c7d' : (b.type === 'bolt' ? '#ffb277' : '#ff8e9f');
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(px, b.py, x, b.y);
      g.addColorStop(0, 'rgba(255, 70, 96, 0)');
      g.addColorStop(1, boss ? 'rgba(255, 102, 130, 0.5)' : 'rgba(255, 160, 118, 0.36)');
      ctx.strokeStyle = g;
      ctx.lineWidth = boss ? 5 : 3;
      ctx.beginPath();
      ctx.moveTo(px, b.py);
      ctx.lineTo(x, b.y);
      ctx.stroke();
      drawGlow(ctx, x, b.y, boss ? 26 : 17, col, 0.35);
      ctx.fillStyle = boss ? '#ffd7d7' : '#ffdfb4';
      ctx.beginPath();
      ctx.arc(x, b.y, boss ? 3.4 : 2.5, 0, TAU);
      ctx.fill();
      if (boss) {
        ctx.strokeStyle = 'rgba(255, 117, 133, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, b.y, 9 + Math.sin(this.time * 8 + b.phase) * 1.5, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  drawParticles(ctx, cam) {
    ctx.save();
    for (const p of this.particles) {
      if (p.x - cam < -100 || p.x - cam > VIEW_W + 100) continue;
      const a = clamp(p.life / p.maxLife, 0, 1);
      const x = p.x - cam;
      const y = p.y;
      if (p.kind === 'smoke') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = a * (p.alpha ?? 0.2);
        const rr = p.size * (1.4 - a * 0.4);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, rr, 0, TAU);
        ctx.fill();
      } else if (p.kind === 'streak') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = a;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(0.6, p.size * 0.75);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - p.vx * 0.022, y - p.vy * 0.022);
        ctx.stroke();
      } else if (p.kind === 'ring') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = a * (p.alpha ?? 1);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2 * a + 0.4;
        ctx.beginPath();
        ctx.arc(x, y, p.size * (1.4 - a), 0, TAU);
        ctx.stroke();
      } else if (p.kind === 'flash') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = a * (p.alpha ?? 0.5);
        drawGlow(ctx, x, y, p.size * 2.2, p.color, 0.5);
      } else if (p.kind === 'petal') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = a * (p.alpha ?? 0.4);
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.8, p.size * 0.65, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = a * (p.alpha ?? 1);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, p.size * (0.6 + a * 0.4), 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawShockwaves(ctx, cam) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const s of this.shockwaves) {
      const p = 1 - s.life / s.maxLife;
      const r = s.radius * easeOutCubic(p);
      ctx.globalAlpha = (1 - p) * 0.55;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2.5 * (1 - p) + 0.4;
      ctx.beginPath();
      ctx.ellipse(s.x - cam, s.y, r, r * 0.42, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawSlashArcs(ctx, cam) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const s of this.slashArcs) {
      const p = 1 - s.life / s.maxLife;
      ctx.save();
      ctx.translate(s.x - cam, s.y);
      ctx.scale(s.dir, 1);
      ctx.globalAlpha = (1 - p) * 0.85;
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = i === 0 ? 'rgba(255, 244, 218, 0.95)' : (i === 1 ? 'rgba(255, 130, 129, 0.6)' : 'rgba(185, 42, 68, 0.32)');
        ctx.lineWidth = [2.2, 12, 30][i] * (1 - p * 0.3);
        ctx.beginPath();
        ctx.arc(0, 0, 150 + i * 3, -1.15 - p * 0.15, 1.2 + p * 0.2);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  drawAlerts(ctx, cam) {
    ctx.save();
    for (const a of this.alerts) {
      const p = 1 - a.life / a.maxLife;
      ctx.globalAlpha = (1 - p) * 0.9;
      ctx.fillStyle = '#ff6f7b';
      ctx.font = '700 17px "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', a.x - cam, a.y - 8 - p * 16);
    }
    ctx.restore();
  }

  drawDamageTexts(ctx, cam) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const t of this.damageTexts) {
      const p = t.life / t.maxLife;
      ctx.globalAlpha = clamp(p * 2, 0, 1);
      ctx.font = `700 ${t.size}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(10, 8, 13, 0.72)';
      ctx.strokeText(t.text, t.x - cam, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x - cam, t.y);
    }
    ctx.restore();
  }

  drawAimReticle(ctx, cam) {
    if (this.isTouch || !this.input.mouse.active || !this.input.mouse.inside) return;
    if (this.state !== 'playing' || this.dialogue) return;
    const hero = this.hero;
    const x = this.input.mouse.x;
    const y = this.input.mouse.y;
    const guard = hero.guarding;
    const perfect = guard && hero.guardTime <= 0.5;
    const col = guard ? (perfect ? '#ffe2a3' : '#8fe0d9') : (hero.weapon === 'gun' ? '#f1b88d' : '#f3dbbe');
    const sx = hero.x - cam;
    const sy = hero.y - 58;

    ctx.save();
    // 细瞄准线
    ctx.globalAlpha = guard ? 0.18 : 0.12;
    ctx.strokeStyle = col;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([2, 7]);
    ctx.beginPath();
    ctx.moveTo(lerp(sx, x, 0.12), lerp(sy, y, 0.12));
    ctx.lineTo(lerp(sx, x, 0.82), lerp(sy, y, 0.82));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.translate(x, y);
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = 1.2;

    if (guard) {
      ctx.rotate(Math.PI / 4);
      ctx.strokeRect(-8, -8, 16, 16);
      ctx.globalAlpha = 0.35;
      ctx.strokeRect(-13, -13, 26, 26);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.lineTo(-5, 0);
      ctx.moveTo(5, 0);
      ctx.lineTo(15, 0);
      ctx.moveTo(0, -15);
      ctx.lineTo(0, -5);
      ctx.moveTo(0, 5);
      ctx.lineTo(0, 15);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 1.3, 0, TAU);
      ctx.fill();
    }

    if (perfect) {
      ctx.globalAlpha = 0.35 + Math.sin(this.time * 15) * 0.15;
      ctx.beginPath();
      ctx.arc(0, 0, 21, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.__game = new Game();
});
