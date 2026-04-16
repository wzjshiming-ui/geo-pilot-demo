const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const powerValue = document.getElementById("powerValue");
const survivalTime = document.getElementById("survivalTime");
const weaponCount = document.getElementById("weaponCount");
const killCount = document.getElementById("killCount");
const overlay = document.getElementById("overlay");
const overlayTag = document.getElementById("overlayTag");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const restartButton = document.getElementById("restartButton");

const playerAvatar = new Image();
playerAvatar.src = "./player-avatar.jpg";

const WORLD_RADIUS = 2600;
const DESPAWN_MARGIN = 3600;
const MONSTER_TARGET = 56;
const PLAYER_SPEED = 290;
const PLAYER_RADIUS = 18;
const PLAYER_START_POWER = 10;
const SAFE_RADIUS = 900;
const MONSTER_SCALE = 0.8;

const monsterTypes = [
  { name: "小鸡", shape: "chick", baseColor: "#ffd54a", accentColor: "#ff9f1a" },
  { name: "小兔", shape: "rabbit", baseColor: "#f4f1ff", accentColor: "#ff7ab6" },
  { name: "小狗", shape: "dog", baseColor: "#d6a676", accentColor: "#6b4b32" },
  { name: "恐龙", shape: "dino", baseColor: "#7ee081", accentColor: "#2f8f52" },
  { name: "小恶魔", shape: "imp", baseColor: "#a86cff", accentColor: "#ff5d73" },
  { name: "章鱼怪", shape: "octo", baseColor: "#ff7e7e", accentColor: "#a93d72" },
];

const keys = new Set();

const state = {
  player: null,
  monsters: [],
  kills: 0,
  effects: [],
  cameraShake: 0,
  running: true,
  phase: "intro",
  lastTime: 0,
  elapsed: 0,
  survivalClock: 0,
};

function resizeCanvas() {
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function distanceSquared(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function randomSpawnAroundPlayer(minDistance = 320) {
  const angle = randomBetween(0, Math.PI * 2);
  const distance = randomBetween(minDistance, WORLD_RADIUS);
  return {
    x: state.player.x + Math.cos(angle) * distance,
    y: state.player.y + Math.sin(angle) * distance,
  };
}

function getPlayerDistanceFromOrigin() {
  return Math.hypot(state.player.x, state.player.y);
}

function getPlayerMoveVector() {
  const horizontal = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0);
  const vertical = (keys.has("s") ? 1 : 0) - (keys.has("w") ? 1 : 0);
  const length = Math.hypot(horizontal, vertical) || 1;
  return {
    x: horizontal / length,
    y: vertical / length,
    moving: horizontal !== 0 || vertical !== 0,
  };
}

function spawnAheadOfPlayer({ distanceMin = 320, distanceMax = 720, spread = 0.85, bias = "forward" } = {}) {
  const move = getPlayerMoveVector();
  let angle;

  if (!move.moving) {
    angle = randomBetween(0, Math.PI * 2);
  } else {
    const baseAngle = Math.atan2(move.y, move.x);
    if (bias === "flank-left") {
      angle = baseAngle - randomBetween(0.3, spread);
    } else if (bias === "flank-right") {
      angle = baseAngle + randomBetween(0.3, spread);
    } else {
      angle = baseAngle + randomBetween(-spread, spread);
    }
  }

  const distance = randomBetween(distanceMin, distanceMax);
  return {
    x: state.player.x + Math.cos(angle) * distance,
    y: state.player.y + Math.sin(angle) * distance,
  };
}

function getViewportSpawnDistance() {
  return Math.max(window.innerWidth, window.innerHeight) * 0.68 + 180;
}

function spawnOutsideViewport({ spread = 0.55, bias = "forward" } = {}) {
  const move = getPlayerMoveVector();
  let angle;

  if (!move.moving) {
    angle = randomBetween(0, Math.PI * 2);
  } else {
    const baseAngle = Math.atan2(move.y, move.x);
    if (bias === "flank-left") {
      angle = baseAngle - randomBetween(0.45, spread);
    } else if (bias === "flank-right") {
      angle = baseAngle + randomBetween(0.45, spread);
    } else {
      angle = baseAngle + randomBetween(-spread, spread);
    }
  }

  const distance = getViewportSpawnDistance() + randomBetween(0, 180);
  return {
    x: state.player.x + Math.cos(angle) * distance,
    y: state.player.y + Math.sin(angle) * distance,
  };
}

function createPlayer() {
  return {
    x: 0,
    y: 0,
    radius: PLAYER_RADIUS,
    power: PLAYER_START_POWER,
  };
}

function getDangerLevel() {
  const outerPressure = Math.max(0, getPlayerDistanceFromOrigin() - SAFE_RADIUS) / 520;
  return (
    1 +
    state.survivalClock * 0.08 +
    Math.max(0, state.player.power - PLAYER_START_POWER) * 0.012 +
    outerPressure * 0.38
  );
}

function getMonsterTargetCount() {
  return Math.min(132, Math.floor(MONSTER_TARGET + state.survivalClock * 1.8 + state.player.power * 0.09));
}

function getMonsterValue() {
  const power = state.player.power;
  const danger = getDangerLevel();
  const lowBand = Math.max(1, Math.floor(power * (0.26 + Math.min(0.2, danger * 0.02))));
  const equalBand = Math.max(lowBand + 6, Math.floor(power * (0.92 + Math.min(0.24, danger * 0.025)) + 8));
  const highBand = Math.max(equalBand + 8, Math.floor(power * (1.32 + Math.min(0.55, danger * 0.05)) + 20 + state.survivalClock * 1.6));
  const roll = Math.random();

  if (roll < 0.26) {
    return Math.floor(randomBetween(lowBand, Math.max(lowBand + 3, power * 0.72 + 4)));
  }

  if (roll < 0.48) {
    return Math.floor(randomBetween(Math.max(lowBand + 1, power * 0.76), equalBand));
  }

  return Math.floor(randomBetween(Math.max(power + 4, equalBand), highBand));
}

function getMonsterStyle(value) {
  const visualMax = Math.max(40, state.player.power * 1.25 + 18);
  const t = Math.min(1, value / visualMax);
  const ringHue = 128 - t * 118;
  return {
    glow: `hsla(${Math.max(6, ringHue)}, 100%, 62%, ${0.22 + t * 0.22})`,
    ring: `hsla(${Math.max(0, ringHue - 8)}, 100%, 68%, ${0.55 + t * 0.2})`,
    label: `hsl(${Math.max(0, ringHue - 10)}, 96%, ${52 + t * 8}%)`,
  };
}

function createMonster() {
  return createMonsterAtPosition();
}

function createMonsterAtPosition(positionOverride, forceStronger = false) {
  const base = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
  let value = getMonsterValue();
  if (forceStronger) {
    const minimumThreat = Math.max(state.player.power + 6, Math.floor(state.player.power * 1.08));
    value = Math.max(value, minimumThreat);
  }
  const strongerThanPlayer = value >= state.player.power;
  const position = positionOverride || randomSpawnAroundPlayer(strongerThanPlayer ? 240 : 340);
  const style = getMonsterStyle(value);
  return {
    ...base,
    x: position.x,
    y: position.y,
    radius: (30 + Math.min(18, value * 0.08)) * MONSTER_SCALE,
    value,
    bob: 0,
    wobble: randomBetween(0, Math.PI * 2),
    driftSeed: randomBetween(0, Math.PI * 2),
    mood: "idle",
    ...style,
  };
}

function keepMonstersStocked() {
  while (state.monsters.length < getMonsterTargetCount()) {
    state.monsters.push(createMonster());
  }
}

function spawnPressureWave() {
  const distanceFromOrigin = getPlayerDistanceFromOrigin();
  const outsideSafeZone = distanceFromOrigin > SAFE_RADIUS;
  const move = getPlayerMoveVector();
  const shouldPressure =
    move.moving && (outsideSafeZone || state.survivalClock > 10 || state.monsters.length < getMonsterTargetCount() - 8);

  if (!shouldPressure) {
    return;
  }

  const pressureStrength = outsideSafeZone ? 3 : state.survivalClock > 18 ? 2 : 1;
  const spawnConfigs = [
    { bias: "forward" },
    { bias: "flank-left" },
    { bias: "flank-right" },
  ];

  for (let i = 0; i < pressureStrength; i += 1) {
    const config = spawnConfigs[i % spawnConfigs.length];
    const position = spawnOutsideViewport({
      spread: outsideSafeZone ? 0.75 : 0.92,
      bias: config.bias,
    });
    state.monsters.push(createMonsterAtPosition(position, true));
  }
}

function cullFarMonsters() {
  state.monsters = state.monsters.filter(
    (monster) => distanceSquared(monster, state.player) < DESPAWN_MARGIN * DESPAWN_MARGIN,
  );
}

function updateHUD() {
  survivalTime.textContent = `${state.survivalClock.toFixed(1)}s`;
  powerValue.textContent = state.player.power;
  weaponCount.textContent = state.player.power - PLAYER_START_POWER;
  killCount.textContent = state.kills;
}

function showOverlay({ title, text, tag }) {
  overlayTag.textContent = tag;
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function resetGame() {
  state.player = createPlayer();
  state.monsters = [];
  state.kills = 0;
  state.effects = [];
  state.cameraShake = 0;
  state.running = false;
  state.phase = "intro";
  state.lastTime = performance.now();
  state.elapsed = 0;
  state.survivalClock = 0;
  keepMonstersStocked();
  updateHUD();
  showOverlay({
    tag: "吞噬成长",
    title: "774逃亡大挑战",
    text: "你初始伤害为 10，只能碰比自己数值低的怪物。击杀后会吸收它的数值，慢慢挑战更强敌人。",
  });
}

function restartGame() {
  resetGame();
  state.running = true;
  state.phase = "playing";
  hideOverlay();
}

function getMoveAxis() {
  return getPlayerMoveVector();
}

function updatePlayer(delta) {
  const movement = getMoveAxis();
  if (!movement.moving) {
    return;
  }
  state.player.x += movement.x * PLAYER_SPEED * delta;
  state.player.y += movement.y * PLAYER_SPEED * delta;
}

function collideMonsters() {
  const survivors = [];

  for (const monster of state.monsters) {
    const hitDistance = state.player.radius + monster.radius;
    const touching = distanceSquared(monster, state.player) <= hitDistance * hitDistance;

    if (!touching) {
      survivors.push(monster);
      continue;
    }

    if (state.player.power > monster.value) {
      spawnAbsorbEffect(monster);
      state.player.power += monster.value;
      state.kills += 1;
      state.cameraShake = Math.min(10, 4 + monster.value * 0.04);
      continue;
    }

    state.running = false;
    state.phase = "dead";
    showOverlay({
      tag: "挑战失败",
      title: "774被活捉了，挑战失败",
      text: `你坚持了 ${state.survivalClock.toFixed(1)} 秒，当前伤害 ${state.player.power}，但撞上了强度 ${monster.value} 的${monster.name}。按空格或点击按钮重新开始。`,
    });
    updateHUD();
    return;
  }

  state.monsters = survivors;
  updateHUD();
}

function spawnAbsorbEffect(monster) {
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
      radius: randomBetween(4, 8),
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
    value: monster.value,
  });
}

function updateMonsters(delta, time) {
  const danger = getDangerLevel();
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
}

function updateEffects(delta) {
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
}

function drawGrid(cameraX, cameraY) {
  const width = window.innerWidth;
  const height = window.innerHeight;
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
}

function worldToScreen(entity, cameraX, cameraY) {
  return {
    x: entity.x - cameraX + window.innerWidth / 2,
    y: entity.y - cameraY + window.innerHeight / 2,
  };
}

function drawValueLabel(x, y, value, fill, fontSize = 15) {
  ctx.save();
  ctx.font = `800 ${fontSize}px Trebuchet MS, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(2, 5, 10, 0.95)";
  ctx.strokeText(String(value), x, y);
  ctx.fillStyle = fill;
  ctx.fillText(String(value), x, y);
  ctx.restore();
}

function drawChick(radius, baseColor, accentColor) {
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

  ctx.strokeStyle = "#3a2a12";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.18, radius * 0.6);
  ctx.lineTo(-radius * 0.24, radius * 0.9);
  ctx.moveTo(radius * 0.05, radius * 0.6);
  ctx.lineTo(radius * 0.02, radius * 0.9);
  ctx.stroke();

  ctx.fillStyle = "#20140f";
  ctx.beginPath();
  ctx.arc(radius * 0.18, -radius * 0.38, radius * 0.05, 0, Math.PI * 2);
  ctx.fill();
}

function drawRabbit(radius, baseColor, accentColor) {
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

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(-radius * 0.18, -radius * 0.9, radius * 0.16, radius * 0.5, -0.18, 0, Math.PI * 2);
  ctx.ellipse(radius * 0.18, -radius * 0.9, radius * 0.16, radius * 0.5, 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#20140f";
  ctx.beginPath();
  ctx.arc(-radius * 0.1, -radius * 0.24, radius * 0.04, 0, Math.PI * 2);
  ctx.arc(radius * 0.1, -radius * 0.24, radius * 0.04, 0, Math.PI * 2);
  ctx.fill();
}

function drawDog(radius, baseColor, accentColor) {
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.roundRect(-radius * 0.5, -radius * 0.1, radius, radius * 0.72, radius * 0.24);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, -radius * 0.26, radius * 0.34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.ellipse(-radius * 0.24, -radius * 0.42, radius * 0.14, radius * 0.3, -0.4, 0, Math.PI * 2);
  ctx.ellipse(radius * 0.24, -radius * 0.42, radius * 0.14, radius * 0.3, 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2a1b12";
  ctx.beginPath();
  ctx.arc(0, -radius * 0.18, radius * 0.07, 0, Math.PI * 2);
  ctx.fill();
}

function drawDino(radius, baseColor, accentColor) {
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

  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-radius * 0.14 + i * radius * 0.12, -radius * 0.48);
    ctx.lineTo(-radius * 0.04 + i * radius * 0.12, -radius * 0.78);
    ctx.lineTo(radius * 0.05 + i * radius * 0.12, -radius * 0.48);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = "#173722";
  ctx.beginPath();
  ctx.arc(radius * 0.24, -radius * 0.28, radius * 0.05, 0, Math.PI * 2);
  ctx.fill();
}

function drawImp(radius, baseColor, accentColor) {
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

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(radius * 0.2, radius * 0.46);
  ctx.quadraticCurveTo(radius * 0.72, radius * 0.56, radius * 0.54, radius * 0.9);
  ctx.stroke();
}

function drawOcto(radius, baseColor, accentColor) {
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
}

function drawMonsterBody(monster) {
  const { radius, shape, baseColor, accentColor } = monster;
  switch (shape) {
    case "chick":
      drawChick(radius, baseColor, accentColor);
      break;
    case "rabbit":
      drawRabbit(radius, baseColor, accentColor);
      break;
    case "dog":
      drawDog(radius, baseColor, accentColor);
      break;
    case "dino":
      drawDino(radius, baseColor, accentColor);
      break;
    case "imp":
      drawImp(radius, baseColor, accentColor);
      break;
    default:
      drawOcto(radius, baseColor, accentColor);
      break;
  }
}

function drawMoodAccent(monster) {
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
}

function drawMonsters(cameraX, cameraY) {
  for (const monster of state.monsters) {
    const screen = worldToScreen(monster, cameraX, cameraY);
    if (
      screen.x < -120 ||
      screen.y < -120 ||
      screen.x > window.innerWidth + 120 ||
      screen.y > window.innerHeight + 120
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

    drawMonsterBody(monster);
    drawMoodAccent(monster);
    drawValueLabel(0, -monster.radius - 14, monster.value, monster.label, 16);
    ctx.restore();
  }
}

function drawEffects(cameraX, cameraY) {
  for (const effect of state.effects) {
    const screen = worldToScreen(effect, cameraX, cameraY);
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
    }

    if (effect.type === "burst") {
      ctx.globalAlpha = progress;
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = 5 * progress;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, effect.radius, 0, Math.PI * 2);
      ctx.stroke();
      drawValueLabel(screen.x, screen.y, `+${effect.value}`, "#fff4be", 18);
    }
    ctx.restore();
  }
}

function drawShinChan(power) {
  ctx.save();
  const pulse = 1 + Math.sin(state.elapsed * 2.8) * 0.06;
  const outerPulse = 1 + Math.sin(state.elapsed * 2.8 + 0.9) * 0.08;
  const ringRadius = 31 * pulse;
  const outerRadius = 42 * outerPulse;

  ctx.fillStyle = "rgba(92, 238, 213, 0.12)";
  ctx.beginPath();
  ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(92, 238, 213, 0.18)";
  ctx.beginPath();
  ctx.arc(0, 0, ringRadius + 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(164, 255, 240, 0.92)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, ringRadius + 1.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (playerAvatar.complete && playerAvatar.naturalWidth > 0) {
    const size = ringRadius * 2;
    const sourceSize = Math.min(playerAvatar.naturalWidth, playerAvatar.naturalHeight);
    const sx = (playerAvatar.naturalWidth - sourceSize) / 2;
    const sy = (playerAvatar.naturalHeight - sourceSize) / 2;
    ctx.drawImage(playerAvatar, sx, sy, sourceSize, sourceSize, -ringRadius, -ringRadius, size, size);
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

  ctx.strokeStyle = "rgba(255, 255, 255, 0.96)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
  ctx.stroke();

  drawValueLabel(0, -54, power, "#ecfff7", 17);
  ctx.restore();
}

function drawPlayer() {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const pulse = 14 + Math.sin(performance.now() * 0.01) * 2;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.shadowColor = "rgba(116, 247, 213, 0.5)";
  ctx.shadowBlur = 24;
  ctx.fillStyle = "rgba(116, 247, 213, 0.16)";
  ctx.beginPath();
  ctx.arc(0, 0, PLAYER_RADIUS + pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  drawShinChan(state.player.power);
  ctx.restore();
}

function drawScene() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  const cameraX = state.player.x;
  const cameraY = state.player.y;
  const shakeX = state.cameraShake > 0 ? Math.sin(state.elapsed * 42) * state.cameraShake : 0;
  const shakeY = state.cameraShake > 0 ? Math.cos(state.elapsed * 35) * state.cameraShake : 0;
  ctx.save();
  ctx.translate(shakeX, shakeY);
  drawGrid(cameraX, cameraY);
  drawMonsters(cameraX, cameraY);
  drawEffects(cameraX, cameraY);
  drawPlayer();
  ctx.restore();
}

function gameLoop(timestamp) {
  const delta = Math.min(0.033, (timestamp - state.lastTime) / 1000 || 0);
  state.lastTime = timestamp;
  state.elapsed += delta;

  if (state.running) {
    state.survivalClock += delta;
    updatePlayer(delta);
    spawnPressureWave();
    updateMonsters(delta, timestamp);
    collideMonsters();
    cullFarMonsters();
    keepMonstersStocked();
  }
  updateEffects(delta);

  drawScene();
  requestAnimationFrame(gameLoop);
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["w", "a", "s", "d", " "].includes(key)) {
    event.preventDefault();
  }

  if (["w", "a", "s", "d"].includes(key)) {
    keys.add(key);
    if (overlay.classList.contains("hidden")) {
      return;
    }
    if (state.phase === "intro") {
      state.running = true;
      state.phase = "playing";
      hideOverlay();
    }
  }

  if (key === " " && state.phase === "dead") {
    restartGame();
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

restartButton.addEventListener("click", restartGame);

resizeCanvas();
resetGame();
requestAnimationFrame(gameLoop);
