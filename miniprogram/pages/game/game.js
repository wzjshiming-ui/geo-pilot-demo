const WORLD_RADIUS = 2600;
const DESPAWN_MARGIN = 3600;
const MONSTER_BASE_TARGET = 56;
const PLAYER_SPEED = 290;
const PLAYER_RADIUS = 24;
const PLAYER_START_POWER = 10;
const SAFE_RADIUS = 900;
const MONSTER_SCALE = 0.8;
const AVATAR_STORAGE_KEY = "playerAvatarSrc";
const BEST_TIME_STORAGE_KEY = "bestSurvivalTime";

const monsterTypes = [
  { name: "小鸡", shape: "chick", baseColor: "#ffd54a", accentColor: "#ff9f1a" },
  { name: "小兔", shape: "rabbit", baseColor: "#f4f1ff", accentColor: "#ff7ab6" },
  { name: "小狗", shape: "dog", baseColor: "#d6a676", accentColor: "#6b4b32" },
  { name: "恐龙", shape: "dino", baseColor: "#7ee081", accentColor: "#2f8f52" },
  { name: "小恶魔", shape: "imp", baseColor: "#a86cff", accentColor: "#ff5d73" },
  { name: "章鱼怪", shape: "octo", baseColor: "#ff7e7e", accentColor: "#a93d72" }
];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function distanceSquared(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function roundRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

Page({
  data: {
    survivalTime: "0.0s",
    bestTime: "0.0s",
    power: PLAYER_START_POWER,
    growth: 0,
    kills: 0,
    showOverlay: true,
    overlayTag: "准备开战",
    overlayTitle: "774逃亡大挑战",
    overlayText: "拖动左下角透明摇杆开始移动。你可以切换成微信头像或上传自己的图片。",
    overlayAction: "start",
    joystickActive: false,
    joystickStickX: 0,
    joystickStickY: 0
  },

  onLoad() {
    const avatarSrc = wx.getStorageSync(AVATAR_STORAGE_KEY) || "/assets/default-avatar.jpg";
    this.bestSurvivalTime = Number(wx.getStorageSync(BEST_TIME_STORAGE_KEY) || 0);
    this.avatarSrc = avatarSrc;
    this.hudTick = 0;
    this.gameState = this.createGameState();
    this.joystickVisual = { x: 0, y: 0 };
  },

  onReady() {
    this.setupCanvas();
  },

  onUnload() {
    this.stopLoop();
  },

  createGameState() {
    return {
      player: {
        x: 0,
        y: 0,
        radius: PLAYER_RADIUS,
        power: PLAYER_START_POWER
      },
      monsters: [],
      effects: [],
      kills: 0,
      survivalClock: 0,
      running: false,
      phase: "intro",
      inputVector: { x: 0, y: 0, moving: false },
      cameraShake: 0,
      elapsed: 0,
      lastTimestamp: 0
    };
  },

  setupCanvas() {
    const query = wx.createSelectorQuery().in(this);
    query.select("#gameCanvas").fields({ node: true, size: true }).select(".joystick-zone").boundingClientRect().exec((res) => {
      const canvasInfo = res[0];
      const joystickRect = res[1];
      if (!canvasInfo || !canvasInfo.node) {
        return;
      }

      const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      const dpr = systemInfo.pixelRatio || 2;
      const canvas = canvasInfo.node;
      const ctx = canvas.getContext("2d");
      canvas.width = canvasInfo.width * dpr;
      canvas.height = canvasInfo.height * dpr;
      ctx.scale(dpr, dpr);

      this.canvas = canvas;
      this.ctx = ctx;
      this.viewport = { width: canvasInfo.width, height: canvasInfo.height, dpr };
      this.joystickRect = joystickRect;
      this.avatarImage = canvas.createImage();
      this.avatarImage.onload = () => {
        this.avatarLoaded = true;
      };
      this.avatarImage.onerror = () => {
        this.avatarLoaded = false;
      };
      this.loadAvatar(this.avatarSrc);
      this.resetGame(false);
      this.startLoop();
    });
  },

  startLoop() {
    this.stopLoop();
    const loop = (timestamp) => {
      this.animationFrame = this.canvas.requestAnimationFrame(loop);
      this.update(timestamp);
      this.draw();
    };
    this.animationFrame = this.canvas.requestAnimationFrame(loop);
  },

  stopLoop() {
    if (this.canvas && this.animationFrame) {
      this.canvas.cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  },

  loadAvatar(src) {
    this.avatarSrc = src;
    this.avatarLoaded = false;
    if (this.avatarImage) {
      this.avatarImage.src = src;
    }
  },

  updateHud(force = false) {
    const now = Date.now();
    if (!force && now - this.hudTick < 100) {
      return;
    }
    this.hudTick = now;
    const state = this.gameState;
    this.setData({
      survivalTime: `${state.survivalClock.toFixed(1)}s`,
      bestTime: `${this.bestSurvivalTime.toFixed(1)}s`,
      power: state.player.power,
      growth: Math.max(0, state.player.power - PLAYER_START_POWER),
      kills: state.kills,
      joystickStickX: this.joystickVisual.x,
      joystickStickY: this.joystickVisual.y
    });
  },

  showOverlay(tag, title, text, action = "start") {
    this.setData({
      showOverlay: true,
      overlayTag: tag,
      overlayTitle: title,
      overlayText: text,
      overlayAction: action
    });
  },

  hideOverlay() {
    this.setData({ showOverlay: false });
  },

  resetGame(startPlaying = true) {
    this.gameState = this.createGameState();
    this.gameState.running = startPlaying;
    this.gameState.phase = startPlaying ? "playing" : "intro";
    this.joystickVisual = { x: 0, y: 0 };
    this.setData({
      joystickActive: false,
      joystickStickX: 0,
      joystickStickY: 0
    });
    this.fillMonsterStock();
    this.updateHud(true);
    if (startPlaying) {
      this.hideOverlay();
    } else {
      this.showOverlay(
        "准备开战",
        "774逃亡大挑战",
        "拖动左下角透明摇杆开始移动。你可以切换成微信头像或上传自己的图片。",
        "start"
      );
    }
  },

  startFromOverlay() {
    this.restartGame();
  },

  restartGame() {
    this.resetGame(true);
    wx.vibrateShort({ type: "light" });
  },

  onChooseWechatAvatar(event) {
    const avatarUrl = event.detail && event.detail.avatarUrl;
    if (!avatarUrl) {
      return;
    }
    this.persistAvatar(avatarUrl);
  },

  onChooseLocalAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        if (file && file.tempFilePath) {
          this.persistAvatar(file.tempFilePath);
        }
      }
    });
  },

  persistAvatar(tempFilePath) {
    wx.saveFile({
      tempFilePath,
      success: (res) => {
        wx.setStorageSync(AVATAR_STORAGE_KEY, res.savedFilePath);
        this.loadAvatar(res.savedFilePath);
      },
      fail: () => {
        wx.setStorageSync(AVATAR_STORAGE_KEY, tempFilePath);
        this.loadAvatar(tempFilePath);
      }
    });
  },

  onJoystickStart(event) {
    if (!this.joystickRect) {
      return;
    }
    this.setData({ joystickActive: true });
    this.updateJoystickByTouch(event.touches[0]);
    if (this.gameState.phase === "intro") {
      this.gameState.running = true;
      this.gameState.phase = "playing";
      this.hideOverlay();
      wx.vibrateShort({ type: "light" });
    }
  },

  onJoystickMove(event) {
    this.updateJoystickByTouch(event.touches[0]);
  },

  onJoystickEnd() {
    this.gameState.inputVector = { x: 0, y: 0, moving: false };
    this.setData({ joystickActive: false });
  },

  updateJoystickByTouch(touch) {
    if (!touch || !this.joystickRect) {
      return;
    }

    const centerX = this.joystickRect.left + this.joystickRect.width / 2;
    const centerY = this.joystickRect.top + this.joystickRect.height / 2;
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const radius = Math.min(this.joystickRect.width, this.joystickRect.height) * 0.24;
    const length = Math.hypot(dx, dy);
    const limited = Math.min(radius, length || 0);
    const nx = length > 0 ? dx / length : 0;
    const ny = length > 0 ? dy / length : 0;
    const normalizedPower = Math.min(1, limited / radius);
    const deadZone = 0.18;
    const activePower = normalizedPower < deadZone ? 0 : (normalizedPower - deadZone) / (1 - deadZone);

    this.gameState.inputVector = {
      x: nx * activePower,
      y: ny * activePower,
      moving: activePower > 0.02
    };
  },

  getPlayerDistanceFromOrigin() {
    const { x, y } = this.gameState.player;
    return Math.hypot(x, y);
  },

  getDangerLevel() {
    const state = this.gameState;
    const outerPressure = Math.max(0, this.getPlayerDistanceFromOrigin() - SAFE_RADIUS) / 520;
    return 1 + state.survivalClock * 0.08 + Math.max(0, state.player.power - PLAYER_START_POWER) * 0.012 + outerPressure * 0.38;
  },

  getMonsterTargetCount() {
    const state = this.gameState;
    return Math.min(132, Math.floor(MONSTER_BASE_TARGET + state.survivalClock * 1.8 + state.player.power * 0.09));
  },

  randomSpawnAroundPlayer(minDistance = 320) {
    const state = this.gameState;
    const angle = randomBetween(0, Math.PI * 2);
    const distance = randomBetween(minDistance, WORLD_RADIUS);
    return {
      x: state.player.x + Math.cos(angle) * distance,
      y: state.player.y + Math.sin(angle) * distance
    };
  },

  spawnOutsideViewport(options = {}) {
    const { spread = 0.55, bias = "forward" } = options;
    const move = this.gameState.inputVector;
    let angle = randomBetween(0, Math.PI * 2);
    if (move.moving) {
      const baseAngle = Math.atan2(move.y, move.x);
      if (bias === "flank-left") {
        angle = baseAngle - randomBetween(0.45, spread);
      } else if (bias === "flank-right") {
        angle = baseAngle + randomBetween(0.45, spread);
      } else {
        angle = baseAngle + randomBetween(-spread, spread);
      }
    }

    const distance = Math.max(this.viewport.width, this.viewport.height) * 0.68 + 180 + randomBetween(0, 180);
    const state = this.gameState;
    return {
      x: state.player.x + Math.cos(angle) * distance,
      y: state.player.y + Math.sin(angle) * distance
    };
  },

  getMonsterValue(forceStronger = false) {
    const state = this.gameState;
    const power = state.player.power;
    const danger = this.getDangerLevel();
    const lowBand = Math.max(1, Math.floor(power * (0.26 + Math.min(0.2, danger * 0.02))));
    const equalBand = Math.max(lowBand + 6, Math.floor(power * (0.92 + Math.min(0.24, danger * 0.025)) + 8));
    const highBand = Math.max(equalBand + 8, Math.floor(power * (1.32 + Math.min(0.55, danger * 0.05)) + 20 + state.survivalClock * 1.6));
    let value;
    const roll = Math.random();

    if (roll < 0.26) {
      value = Math.floor(randomBetween(lowBand, Math.max(lowBand + 3, power * 0.72 + 4)));
    } else if (roll < 0.48) {
      value = Math.floor(randomBetween(Math.max(lowBand + 1, power * 0.76), equalBand));
    } else {
      value = Math.floor(randomBetween(Math.max(power + 4, equalBand), highBand));
    }

    if (forceStronger) {
      value = Math.max(value, Math.max(power + 6, Math.floor(power * 1.08)));
    }

    return value;
  },

  getMonsterStyle(value) {
    const visualMax = Math.max(40, this.gameState.player.power * 1.25 + 18);
    const t = Math.min(1, value / visualMax);
    const ringHue = 128 - t * 118;
    return {
      glow: `hsla(${Math.max(6, ringHue)}, 100%, 62%, ${0.22 + t * 0.22})`,
      ring: `hsla(${Math.max(0, ringHue - 8)}, 100%, 68%, ${0.55 + t * 0.2})`,
      label: `hsl(${Math.max(0, ringHue - 10)}, 96%, ${52 + t * 8}%)`
    };
  },

  createMonster(positionOverride, forceStronger = false) {
    const value = this.getMonsterValue(forceStronger);
    const base = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
    const strongerThanPlayer = value >= this.gameState.player.power;
    const position = positionOverride || this.randomSpawnAroundPlayer(strongerThanPlayer ? 240 : 340);
    return {
      ...base,
      x: position.x,
      y: position.y,
      radius: (30 + Math.min(18, value * 0.08)) * MONSTER_SCALE,
      value,
      wobble: randomBetween(0, Math.PI * 2),
      driftSeed: randomBetween(0, Math.PI * 2),
      bob: 0,
      mood: "idle",
      ...this.getMonsterStyle(value)
    };
  },

  fillMonsterStock() {
    while (this.gameState.monsters.length < this.getMonsterTargetCount()) {
      this.gameState.monsters.push(this.createMonster());
    }
  },

  spawnPressureWave() {
    const state = this.gameState;
    const distanceFromOrigin = this.getPlayerDistanceFromOrigin();
    const outsideSafeZone = distanceFromOrigin > SAFE_RADIUS;
    const shouldPressure =
      state.inputVector.moving &&
      (outsideSafeZone || state.survivalClock > 10 || state.monsters.length < this.getMonsterTargetCount() - 8);

    if (!shouldPressure) {
      return;
    }

    const pressureStrength = outsideSafeZone ? 3 : state.survivalClock > 18 ? 2 : 1;
    const spawnConfigs = [{ bias: "forward" }, { bias: "flank-left" }, { bias: "flank-right" }];

    for (let i = 0; i < pressureStrength; i += 1) {
      const config = spawnConfigs[i % spawnConfigs.length];
      const position = this.spawnOutsideViewport({
        spread: outsideSafeZone ? 0.75 : 0.92,
        bias: config.bias
      });
      state.monsters.push(this.createMonster(position, true));
    }
  },

  update(timestamp) {
    const state = this.gameState;
    if (!state.lastTimestamp) {
      state.lastTimestamp = timestamp;
    }
    const delta = Math.min(0.033, (timestamp - state.lastTimestamp) / 1000 || 0);
    state.lastTimestamp = timestamp;
    state.elapsed += delta;

    if (state.running) {
      state.survivalClock += delta;
      this.updatePlayer(delta);
      this.spawnPressureWave();
      this.updateMonsters(delta, timestamp);
      this.collideMonsters();
      this.cullFarMonsters();
      this.fillMonsterStock();
    }
    this.updateEffects(delta);
    this.updateHud();
  },

  updatePlayer(delta) {
    const { inputVector, player } = this.gameState;
    if (!inputVector.moving) {
      return;
    }
    player.x += inputVector.x * PLAYER_SPEED * delta;
    player.y += inputVector.y * PLAYER_SPEED * delta;
  },

  updateMonsters(delta, time) {
    const state = this.gameState;
    const danger = this.getDangerLevel();
    for (const monster of state.monsters) {
      const angle = Math.atan2(state.player.y - monster.y, state.player.x - monster.x);
      const distance = Math.sqrt(distanceSquared(monster, state.player));
      const weakerThanPlayer = monster.value < state.player.power;
      const muchStronger = monster.value > state.player.power * 1.18;
      const direction = weakerThanPlayer ? -1 : 1;
      const baseSpeed = weakerThanPlayer ? 104 : muchStronger ? 94 : 64;
      const pace =
        (baseSpeed + Math.min(96, monster.value * 0.09)) *
        (weakerThanPlayer ? 1 + danger * 0.04 : muchStronger ? 1 + danger * 0.09 : 1 + danger * 0.06);

      monster.wobble += delta * 1.6;
      const sway = Math.sin(monster.wobble + monster.driftSeed) * 0.7;
      monster.mood = weakerThanPlayer ? "flee" : muchStronger ? "hunt" : "orbit";

      if (distance < 300) {
        monster.x += Math.cos(angle) * direction * pace * delta;
        monster.y += Math.sin(angle) * direction * pace * delta;
      } else {
        const travelAngle = weakerThanPlayer ? angle + Math.PI + sway * 0.6 : angle + sway;
        const cruise = weakerThanPlayer ? 0.82 : muchStronger ? 0.72 : 0.36;
        monster.x += Math.cos(travelAngle) * pace * cruise * delta;
        monster.y += Math.sin(travelAngle) * pace * cruise * delta;
      }

      monster.bob = Math.sin(time * 0.003 + monster.wobble) * 4;
    }
  },

  collideMonsters() {
    const state = this.gameState;
    const survivors = [];
    for (const monster of state.monsters) {
      const hitDistance = state.player.radius + monster.radius;
      const touching = distanceSquared(monster, state.player) <= hitDistance * hitDistance;
      if (!touching) {
        survivors.push(monster);
        continue;
      }

      if (state.player.power > monster.value) {
        this.spawnAbsorbEffect(monster);
        state.player.power += monster.value;
        state.kills += 1;
        state.cameraShake = Math.min(10, 4 + monster.value * 0.04);
        wx.vibrateShort({ type: "light" });
        continue;
      }

      state.running = false;
      state.phase = "dead";
      this.bestSurvivalTime = Math.max(this.bestSurvivalTime, state.survivalClock);
      wx.setStorageSync(BEST_TIME_STORAGE_KEY, this.bestSurvivalTime);
      wx.vibrateShort({ type: "heavy" });
      this.showOverlay(
        "挑战失败",
        "774被活捉了，挑战失败",
        `你坚持了 ${state.survivalClock.toFixed(1)} 秒，当前伤害 ${state.player.power}，但撞上了强度 ${monster.value} 的${monster.name}。`,
        "restart"
      );
      this.updateHud(true);
      return;
    }
    state.monsters = survivors;
  },

  spawnAbsorbEffect(monster) {
    const state = this.gameState;
    const orbCount = Math.min(16, 6 + Math.floor(monster.value / 8));
    for (let i = 0; i < orbCount; i += 1) {
      state.effects.push({
        type: "absorb",
        x: monster.x + randomBetween(-8, 8),
        y: monster.y + randomBetween(-8, 8),
        vx: randomBetween(-26, 26),
        vy: randomBetween(-36, 36),
        life: 0.65 + randomBetween(0, 0.18),
        maxLife: 0.65 + randomBetween(0, 0.18),
        color: monster.label,
        radius: randomBetween(4, 8)
      });
    }

    state.effects.push({
      type: "burst",
      x: monster.x,
      y: monster.y,
      life: 0.34,
      maxLife: 0.34,
      radius: monster.radius,
      color: monster.ring,
      value: monster.value
    });
  },

  updateEffects(delta) {
    const state = this.gameState;
    const nextEffects = [];
    for (const effect of state.effects) {
      effect.life -= delta;
      if (effect.life <= 0) {
        continue;
      }

      if (effect.type === "absorb") {
        const dx = state.player.x - effect.x;
        const dy = state.player.y - effect.y;
        const dist = Math.hypot(dx, dy) || 1;
        const pull = 460 * delta;
        effect.vx += (dx / dist) * pull;
        effect.vy += (dy / dist) * pull;
        effect.vx *= 0.92;
        effect.vy *= 0.92;
        effect.x += effect.vx * delta;
        effect.y += effect.vy * delta;
        effect.radius *= 0.992;
      }

      if (effect.type === "burst") {
        effect.radius += 120 * delta;
      }

      nextEffects.push(effect);
    }

    state.effects = nextEffects;
    state.cameraShake *= 0.88;
    this.joystickVisual.x += (state.inputVector.x * 48 - this.joystickVisual.x) * 0.24;
    this.joystickVisual.y += (state.inputVector.y * 48 - this.joystickVisual.y) * 0.24;
  },

  cullFarMonsters() {
    const player = this.gameState.player;
    this.gameState.monsters = this.gameState.monsters.filter(
      (monster) => distanceSquared(monster, player) < DESPAWN_MARGIN * DESPAWN_MARGIN
    );
  },

  worldToScreen(entity, cameraX, cameraY) {
    return {
      x: entity.x - cameraX + this.viewport.width / 2,
      y: entity.y - cameraY + this.viewport.height / 2
    };
  },

  draw() {
    if (!this.ctx) {
      return;
    }
    const ctx = this.ctx;
    const state = this.gameState;
    ctx.clearRect(0, 0, this.viewport.width, this.viewport.height);
    const cameraX = state.player.x;
    const cameraY = state.player.y;
    const shakeX = state.cameraShake > 0 ? Math.sin(state.elapsed * 42) * state.cameraShake : 0;
    const shakeY = state.cameraShake > 0 ? Math.cos(state.elapsed * 35) * state.cameraShake : 0;

    ctx.save();
    ctx.translate(shakeX, shakeY);
    this.drawGrid(cameraX, cameraY);
    this.drawMonsters(cameraX, cameraY);
    this.drawEffects(cameraX, cameraY);
    this.drawPlayer();
    ctx.restore();
  },

  drawGrid(cameraX, cameraY) {
    const ctx = this.ctx;
    const { width, height } = this.viewport;
    const grid = 100;
    const startX = -((cameraX % grid) + grid) % grid;
    const startY = -((cameraY % grid) + grid) % grid;

    ctx.save();
    ctx.strokeStyle = "rgba(153, 190, 232, 0.10)";
    ctx.lineWidth = 1;
    for (let x = startX; x <= width; x += grid) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = startY; y <= height; y += grid) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  },

  drawValueLabel(x, y, value, fill, fontSize = 15) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = `800 ${fontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(2, 5, 10, 0.95)";
    ctx.strokeText(String(value), x, y);
    ctx.fillStyle = fill;
    ctx.fillText(String(value), x, y);
    ctx.restore();
  },

  drawChick(radius, baseColor, accentColor) {
    const ctx = this.ctx;
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.arc(0, 2, radius * 0.58, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(radius * 0.2, -radius * 0.35, radius * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.moveTo(radius * 0.36, -radius * 0.32);
    ctx.lineTo(radius * 0.68, -radius * 0.24);
    ctx.lineTo(radius * 0.36, -radius * 0.06);
    ctx.closePath();
    ctx.fill();
  },

  drawRabbit(radius, baseColor, accentColor) {
    const ctx = this.ctx;
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.ellipse(0, 6, radius * 0.52, radius * 0.46, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -radius * 0.18, radius * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.ellipse(-radius * 0.18, -radius * 0.9, radius * 0.11, radius * 0.42, -0.18, 0, Math.PI * 2);
    ctx.ellipse(radius * 0.18, -radius * 0.9, radius * 0.11, radius * 0.42, 0.18, 0, Math.PI * 2);
    ctx.fill();
  },

  drawDog(radius, baseColor, accentColor) {
    const ctx = this.ctx;
    ctx.fillStyle = baseColor;
    roundRectPath(ctx, -radius * 0.5, -radius * 0.1, radius, radius * 0.72, radius * 0.24);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -radius * 0.26, radius * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.ellipse(-radius * 0.24, -radius * 0.42, radius * 0.14, radius * 0.3, -0.4, 0, Math.PI * 2);
    ctx.ellipse(radius * 0.24, -radius * 0.42, radius * 0.14, radius * 0.3, 0.4, 0, Math.PI * 2);
    ctx.fill();
  },

  drawDino(radius, baseColor, accentColor) {
    const ctx = this.ctx;
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.ellipse(0, 6, radius * 0.6, radius * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(radius * 0.18, -radius * 0.24, radius * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.42, -radius * 0.08);
    ctx.lineTo(-radius * 0.8, -radius * 0.24);
    ctx.lineTo(-radius * 0.72, 0);
    ctx.closePath();
    ctx.fill();
  },

  drawImp(radius, baseColor, accentColor) {
    const ctx = this.ctx;
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.32, -radius * 0.28);
    ctx.lineTo(-radius * 0.1, -radius * 0.82);
    ctx.lineTo(0, -radius * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(radius * 0.32, -radius * 0.28);
    ctx.lineTo(radius * 0.1, -radius * 0.82);
    ctx.lineTo(0, -radius * 0.22);
    ctx.closePath();
    ctx.fill();
  },

  drawOcto(radius, baseColor, accentColor) {
    const ctx = this.ctx;
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.arc(0, -radius * 0.06, radius * 0.44, Math.PI, Math.PI * 2);
    ctx.lineTo(radius * 0.44, radius * 0.25);
    ctx.quadraticCurveTo(0, radius * 0.52, -radius * 0.44, radius * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * radius * 0.14, radius * 0.24);
      ctx.quadraticCurveTo(i * radius * 0.18, radius * 0.64, i * radius * 0.04, radius * 0.88);
      ctx.stroke();
    }
  },

  drawMonsterBody(monster) {
    switch (monster.shape) {
      case "chick":
        this.drawChick(monster.radius, monster.baseColor, monster.accentColor);
        break;
      case "rabbit":
        this.drawRabbit(monster.radius, monster.baseColor, monster.accentColor);
        break;
      case "dog":
        this.drawDog(monster.radius, monster.baseColor, monster.accentColor);
        break;
      case "dino":
        this.drawDino(monster.radius, monster.baseColor, monster.accentColor);
        break;
      case "imp":
        this.drawImp(monster.radius, monster.baseColor, monster.accentColor);
        break;
      default:
        this.drawOcto(monster.radius, monster.baseColor, monster.accentColor);
        break;
    }
  },

  drawMoodAccent(monster) {
    const ctx = this.ctx;
    if (monster.mood === "flee") {
      ctx.strokeStyle = "rgba(125, 255, 180, 0.9)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-monster.radius * 0.34, -monster.radius * 0.96);
      ctx.lineTo(-monster.radius * 0.1, -monster.radius * 1.16);
      ctx.lineTo(monster.radius * 0.18, -monster.radius * 0.94);
      ctx.stroke();
      return;
    }
    if (monster.mood === "hunt") {
      ctx.strokeStyle = "rgba(255, 115, 115, 0.95)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -monster.radius * 1.02, monster.radius * 0.22, Math.PI * 0.12, Math.PI * 0.88);
      ctx.stroke();
    }
  },

  drawMonsters(cameraX, cameraY) {
    const ctx = this.ctx;
    for (const monster of this.gameState.monsters) {
      const screen = this.worldToScreen(monster, cameraX, cameraY);
      if (
        screen.x < -120 ||
        screen.y < -120 ||
        screen.x > this.viewport.width + 120 ||
        screen.y > this.viewport.height + 120
      ) {
        continue;
      }

      ctx.save();
      ctx.translate(screen.x, screen.y + monster.bob);
      ctx.shadowColor = monster.glow;
      ctx.shadowBlur = 18;
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.arc(0, 0, monster.radius + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = monster.ring;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, monster.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
      this.drawMonsterBody(monster);
      this.drawMoodAccent(monster);
      this.drawValueLabel(0, -monster.radius - 14, monster.value, monster.label, 16);
      ctx.restore();
    }
  },

  drawEffects(cameraX, cameraY) {
    const ctx = this.ctx;
    for (const effect of this.gameState.effects) {
      const screen = this.worldToScreen(effect, cameraX, cameraY);
      const progress = effect.life / effect.maxLife;
      ctx.save();
      if (effect.type === "absorb") {
        ctx.globalAlpha = Math.max(0.1, progress);
        ctx.fillStyle = effect.color;
        ctx.shadowColor = effect.color;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, Math.max(1.5, effect.radius), 0, Math.PI * 2);
        ctx.fill();
      } else if (effect.type === "burst") {
        ctx.globalAlpha = progress;
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = 5 * progress;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, effect.radius, 0, Math.PI * 2);
        ctx.stroke();
        this.drawValueLabel(screen.x, screen.y, `+${effect.value}`, "#fff4be", 18);
      }
      ctx.restore();
    }
  },

  drawPlayer() {
    const ctx = this.ctx;
    const state = this.gameState;
    const centerX = this.viewport.width / 2;
    const centerY = this.viewport.height / 2;
    const pulse = 1 + Math.sin(state.elapsed * 2.8) * 0.06;
    const outerPulse = 1 + Math.sin(state.elapsed * 2.8 + 0.9) * 0.08;
    const ringRadius = 34 * pulse;
    const outerRadius = 46 * outerPulse;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.fillStyle = "rgba(92, 238, 213, 0.12)";
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(92, 238, 213, 0.18)";
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius + 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(164, 255, 240, 0.92)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius + 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.clip();

    if (this.avatarLoaded && this.avatarImage && this.avatarImage.width) {
      const sourceSize = Math.min(this.avatarImage.width, this.avatarImage.height);
      const sx = (this.avatarImage.width - sourceSize) / 2;
      const sy = (this.avatarImage.height - sourceSize) / 2;
      ctx.drawImage(this.avatarImage, sx, sy, sourceSize, sourceSize, -ringRadius, -ringRadius, ringRadius * 2, ringRadius * 2);
    } else {
      const fallback = ctx.createRadialGradient(-8, -10, 4, 0, 0, ringRadius + 4);
      fallback.addColorStop(0, "#5da3ff");
      fallback.addColorStop(1, "#173150");
      ctx.fillStyle = fallback;
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    ctx.strokeStyle = "rgba(255,255,255,0.96)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    this.drawValueLabel(0, -58, state.player.power, "#ecfff7", 18);
    ctx.restore();
  }
});
