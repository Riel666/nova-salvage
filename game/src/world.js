// NOVA SALVAGE — the simulation. One fixed-step world: the skiff, the cores
// it harvests, the mines and rocks it dodges, the waves it clears, and the
// score it banks. Pure logic: no canvas, no audio, no DOM here, so the
// staged screenshots can drive it headless with a scripted pilot.
import {
  FIELD, STEP, TOTAL_WAVES, PLAYER, CORE, MINE, ROCK, POWER, SCORE,
  quotaTarget, rockCount, mineCount, rockSpeed,
} from './config.js';
import { mulberry32, range, pick, TAU } from './random.js';

export const PHASE_TITLE = 'title';
export const PHASE_PLAY = 'play';
export const PHASE_CLEAR = 'clear';
export const PHASE_OVER = 'over';
export const PHASE_WIN = 'win';

let nextId = 1;

function makeStars(rng) {
  const stars = [];
  for (let i = 0; i < 130; i += 1) {
    stars.push({ x: rng() * FIELD.width, y: rng() * FIELD.height, r: range(rng, 0.6, 2.0), tw: range(rng, 0, TAU) });
  }
  return stars;
}

function makeNebulae(rng) {
  return [
    { x: range(rng, 80, 320), y: range(rng, 60, 240), r: range(rng, 150, 240), hue: 0 },
    { x: range(rng, 560, 880), y: range(rng, 300, 520), r: range(rng, 140, 220), hue: 1 },
    { x: range(rng, 380, 640), y: range(rng, 80, 260), r: range(rng, 110, 180), hue: 2 },
  ];
}

function spawnCore(world) {
  const { rng, player } = world;
  let x = 0;
  let y = 0;
  for (let tries = 0; tries < 12; tries += 1) {
    x = range(rng, 40, FIELD.width - 40);
    y = range(rng, 50, FIELD.height - 40);
    const dx = x - player.x;
    const dy = y - player.y;
    if (dx * dx + dy * dy > 120 * 120) break;
  }
  world.cores.push({ id: nextId, x, y, phase: range(rng, 0, TAU), bob: range(rng, 0.6, 1.2) });
  nextId += 1;
}

function spawnRock(world, edge) {
  const { rng, wave } = world;
  const speed = range(rng, rockSpeed(wave) * 0.7, rockSpeed(wave) * 1.3);
  const angle = edge ? pick(rng, [0, Math.PI / 2, Math.PI, -Math.PI / 2]) + range(rng, -0.5, 0.5) : range(rng, 0, TAU);
  const r = range(rng, ROCK.minRadius, ROCK.maxRadius);
  let x;
  let y;
  if (edge) {
    const side = Math.floor(rng() * 4);
    x = side === 0 ? -r : side === 1 ? FIELD.width + r : range(rng, 0, FIELD.width);
    y = side === 2 ? -r : side === 3 ? FIELD.height + r : range(rng, 0, FIELD.height);
  } else {
    x = range(rng, 60, FIELD.width - 60);
    y = range(rng, 60, FIELD.height - 60);
  }
  const verts = [];
  const n = 8 + Math.floor(rng() * 3);
  for (let i = 0; i < n; i += 1) verts.push(range(rng, 0.72, 1.18));
  world.rocks.push({
    id: nextId, x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    r, rot: range(rng, 0, TAU), vr: range(rng, -0.9, 0.9), verts, grazed: false,
  });
  nextId += 1;
}

function spawnMine(world) {
  const { rng, player } = world;
  let x = 0;
  let y = 0;
  for (let tries = 0; tries < 12; tries += 1) {
    x = range(rng, 50, FIELD.width - 50);
    y = range(rng, 60, FIELD.height - 50);
    const dx = x - player.x;
    const dy = y - player.y;
    if (dx * dx + dy * dy > 150 * 150) break;
  }
  world.mines.push({ id: nextId, x, y, pulse: range(rng, 0, TAU), grazed: false });
  nextId += 1;
}

function spawnPower(world) {
  const { rng } = world;
  const kind = pick(rng, [SCORE.powerShield, SCORE.powerMagnet, SCORE.powerOverdrive]);
  world.powers.push({
    id: nextId, kind,
    x: range(rng, 60, FIELD.width - 60),
    y: range(rng, 70, FIELD.height - 70),
    phase: range(rng, 0, TAU),
  });
  nextId += 1;
}

export function setupWave(world) {
  world.quota = 0;
  world.quotaTarget = quotaTarget(world.wave);
  world.rocks = [];
  world.mines = [];
  world.powers = [];
  world.powerTimer = POWER.everySeconds;
  for (let i = 0; i < rockCount(world.wave); i += 1) spawnRock(world, false);
  for (let i = 0; i < mineCount(world.wave); i += 1) spawnMine(world);
  while (world.cores.length < 5 + Math.min(world.wave, 4)) spawnCore(world);
}

export function createWorld(seed) {
  const rng = mulberry32(seed);
  const world = {
    seed,
    rng,
    time: 0,
    phase: PHASE_TITLE,
    wave: 1,
    score: 0,
    best: 0,
    hull: PLAYER.maxHull,
    quota: 0,
    quotaTarget: quotaTarget(1),
    combo: 0,
    comboTimer: 0,
    player: {
      x: FIELD.width / 2, y: FIELD.height * 0.62, vx: 0, vy: 0, angle: -Math.PI / 2,
      invuln: 0, dashTime: 0, dashCooldown: 0, shield: 0, magnet: 0, overdrive: 0, thrusting: false,
    },
    cores: [],
    rocks: [],
    mines: [],
    powers: [],
    parts: [],
    floats: [],
    stars: makeStars(rng),
    nebulae: makeNebulae(rng),
    powerTimer: POWER.everySeconds,
    clearTimer: 0,
    shake: 0,
    flash: 0,
    events: [],
    stats: { collected: 0, hits: 0, nearMisses: 0, dashes: 0 },
  };
  setupWave(world);
  return world;
}

export function startGame(world, seed) {
  const fresh = createWorld(seed === undefined ? (Math.random() * 0xffffffff) >>> 0 : seed);
  fresh.best = world.best;
  fresh.phase = PHASE_PLAY;
  Object.keys(fresh).forEach((k) => { world[k] = fresh[k]; });
}

function burst(world, x, y, color, count, speed) {
  for (let i = 0; i < count; i += 1) {
    const a = world.rng() * TAU;
    const s = range(world.rng, speed * 0.3, speed);
    world.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: range(world.rng, 0.35, 0.8), maxLife: 0.8, size: range(world.rng, 1.5, 3.5), color });
  }
  if (world.parts.length > 420) world.parts.splice(0, world.parts.length - 420);
}

function floatText(world, x, y, text, color) {
  world.floats.push({ x, y, text, life: 1.0, color });
  if (world.floats.length > 24) world.floats.shift();
}

function hurtPlayer(world, fromX, fromY) {
  const p = world.player;
  if (p.invuln > 0 || p.dashTime > 0) return;
  if (p.shield > 0) {
    p.shield = 0;
    p.invuln = 1.0;
    world.shake = 8;
    world.events.push('shield');
    burst(world, p.x, p.y, '#6ef3ff', 18, 220);
    return;
  }
  world.hull -= 1;
  world.stats.hits += 1;
  world.combo = 0;
  world.comboTimer = 0;
  p.invuln = PLAYER.invulnTime;
  world.shake = 16;
  world.flash = 0.45;
  world.events.push('hit');
  const dx = p.x - fromX;
  const dy = p.y - fromY;
  const d = Math.hypot(dx, dy) || 1;
  p.vx = (dx / d) * 320;
  p.vy = (dy / d) * 320;
  burst(world, p.x, p.y, '#ff5d7a', 26, 300);
  if (world.hull <= 0) {
    world.phase = PHASE_OVER;
    world.events.push('over');
    burst(world, p.x, p.y, '#7fe7ff', 60, 380);
    burst(world, p.x, p.y, '#ffb347', 40, 300);
    if (world.score > world.best) world.best = world.score;
  }
}

function stepParticles(world, dt) {
  for (let i = world.parts.length - 1; i >= 0; i -= 1) {
    const pt = world.parts[i];
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vx *= 0.96;
    pt.vy *= 0.96;
    pt.life -= dt;
    if (pt.life <= 0) world.parts.splice(i, 1);
  }
  for (let i = world.floats.length - 1; i >= 0; i -= 1) {
    const f = world.floats[i];
    f.y -= 34 * dt;
    f.life -= dt * 0.9;
    if (f.life <= 0) world.floats.splice(i, 1);
  }
  if (world.shake > 0) world.shake = Math.max(0, world.shake - 42 * dt);
  if (world.flash > 0) world.flash = Math.max(0, world.flash - 1.4 * dt);
}

/** The title screen's slow drift: the field lives, nothing can hurt you. */
export function stepAmbient(world, dt) {
  world.time += dt;
  for (const rock of world.rocks) {
    rock.x += rock.vx * dt * 0.4;
    rock.y += rock.vy * dt * 0.4;
    rock.rot += rock.vr * dt * 0.4;
    if (rock.x < -60) rock.x = FIELD.width + 50;
    if (rock.x > FIELD.width + 60) rock.x = -50;
    if (rock.y < -60) rock.y = FIELD.height + 50;
    if (rock.y > FIELD.height + 60) rock.y = -50;
  }
  stepParticles(world, dt);
}

/** One fixed step of live play. `input` is {x, y, dash}. */
export function stepWorld(world, input) {
  const dt = STEP;
  const p = world.player;
  world.events.length = 0;
  world.time += dt;

  if (world.phase === PHASE_CLEAR) {
    world.clearTimer -= dt;
    stepParticles(world, dt);
    if (world.clearTimer <= 0) {
      if (world.wave >= TOTAL_WAVES) {
        world.phase = PHASE_WIN;
        world.events.push('win');
        if (world.score > world.best) world.best = world.score;
      } else {
        world.wave += 1;
        setupWave(world);
        world.phase = PHASE_PLAY;
      }
    }
    return;
  }
  if (world.phase !== PHASE_PLAY) return;

  // --- timers ---
  if (p.invuln > 0) p.invuln -= dt;
  if (p.dashCooldown > 0) p.dashCooldown -= dt;
  if (p.shield > 0) p.shield -= dt;
  if (p.magnet > 0) p.magnet -= dt;
  if (p.overdrive > 0) p.overdrive -= dt;
  if (world.comboTimer > 0) {
    world.comboTimer -= dt;
    if (world.comboTimer <= 0) world.combo = 0;
  }

  // --- dash ---
  if (input.dash && p.dashCooldown <= 0 && p.dashTime <= 0) {
    const ax = input.x;
    const ay = input.y;
    const len = Math.hypot(ax, ay);
    const dx = len > 0 ? ax / len : Math.cos(p.angle);
    const dy = len > 0 ? ay / len : Math.sin(p.angle);
    p.vx = dx * PLAYER.dashSpeed;
    p.vy = dy * PLAYER.dashSpeed;
    p.dashTime = PLAYER.dashTime;
    p.dashCooldown = PLAYER.dashCooldown;
    world.stats.dashes += 1;
    world.events.push('dash');
    burst(world, p.x, p.y, '#7fe7ff', 10, 160);
  }
  if (p.dashTime > 0) {
    p.dashTime -= dt;
  } else {
    p.vx += input.x * PLAYER.accel * dt;
    p.vy += input.y * PLAYER.accel * dt;
    const drag = Math.max(0, 1 - PLAYER.drag * dt);
    p.vx *= drag;
    p.vy *= drag;
    const speed = Math.hypot(p.vx, p.vy);
    if (speed > PLAYER.maxSpeed) {
      p.vx = (p.vx / speed) * PLAYER.maxSpeed;
      p.vy = (p.vy / speed) * PLAYER.maxSpeed;
    }
  }
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.x = Math.max(PLAYER.radius, Math.min(FIELD.width - PLAYER.radius, p.x));
  p.y = Math.max(PLAYER.radius, Math.min(FIELD.height - PLAYER.radius, p.y));
  const speed = Math.hypot(p.vx, p.vy);
  p.thrusting = speed > 40;
  if (speed > 30) {
    const target = Math.atan2(p.vy, p.vx);
    let diff = target - p.angle;
    while (diff > Math.PI) diff -= TAU;
    while (diff < -Math.PI) diff += TAU;
    p.angle += diff * Math.min(1, 14 * dt);
  }
  if (p.thrusting && world.time % 0.05 < STEP) {
    const bx = p.x - Math.cos(p.angle) * 16;
    const by = p.y - Math.sin(p.angle) * 16;
    world.parts.push({ x: bx, y: by, vx: -Math.cos(p.angle) * 60 + range(world.rng, -20, 20), vy: -Math.sin(p.angle) * 60 + range(world.rng, -20, 20), life: 0.3, maxLife: 0.3, size: 2.5, color: '#ffb347' });
  }

  // --- cores ---
  const targetCores = 5 + Math.min(world.wave, 4);
  while (world.cores.length < targetCores) spawnCore(world);
  for (let i = world.cores.length - 1; i >= 0; i -= 1) {
    const c = world.cores[i];
    if (p.magnet > 0) {
      const dx = p.x - c.x;
      const dy = p.y - c.y;
      const d = Math.hypot(dx, dy);
      if (d < 200 && d > 1) {
        c.x += (dx / d) * 260 * dt;
        c.y += (dy / d) * 260 * dt;
      }
    }
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    if (dx * dx + dy * dy < (PLAYER.pickupRadius + CORE.radius) ** 2) {
      world.cores.splice(i, 1);
      world.combo = Math.min(world.combo + 1, CORE.maxCombo);
      world.comboTimer = CORE.comboWindow;
      const gained = CORE.score * world.combo * (p.overdrive > 0 ? 2 : 1);
      world.score += gained;
      world.quota += 1;
      world.stats.collected += 1;
      world.events.push('pickup');
      burst(world, c.x, c.y, '#ffd94a', 12, 180);
      floatText(world, c.x, c.y - 14, `+${gained}`, '#ffd94a');
      if (world.quota >= world.quotaTarget) {
        const bonus = SCORE.waveBonus * world.wave;
        world.score += bonus;
        world.phase = PHASE_CLEAR;
        world.clearTimer = 2.4;
        world.events.push('clear');
        floatText(world, FIELD.width / 2, FIELD.height / 2 - 60, `WAVE BONUS +${bonus}`, '#7dffb0');
      }
    }
  }

  // --- rocks ---
  if (world.phase !== PHASE_PLAY) {
    stepParticles(world, dt);
    return;
  }
  for (const rock of world.rocks) {
    rock.x += rock.vx * dt;
    rock.y += rock.vy * dt;
    rock.rot += rock.vr * dt;
    if (rock.x < -rock.r - 20) rock.x = FIELD.width + rock.r + 10;
    if (rock.x > FIELD.width + rock.r + 20) rock.x = -rock.r - 10;
    if (rock.y < -rock.r - 20) rock.y = FIELD.height + rock.r + 10;
    if (rock.y > FIELD.height + rock.r + 20) rock.y = -rock.r - 10;
    const dx = p.x - rock.x;
    const dy = p.y - rock.y;
    const d = Math.hypot(dx, dy);
    const hitR = rock.r + PLAYER.radius - 2;
    if (d < hitR) {
      hurtPlayer(world, rock.x, rock.y);
      if (world.phase !== PHASE_PLAY) return;
    } else if (!rock.grazed && d < hitR + SCORE.nearMissRadius) {
      rock.grazed = true;
      world.score += SCORE.nearMiss;
      world.stats.nearMisses += 1;
      world.events.push('nearmiss');
      floatText(world, p.x, p.y - 24, `CLOSE +${SCORE.nearMiss}`, '#8fa3c8');
    }
    if (d > hitR + SCORE.nearMissRadius + 30) rock.grazed = false;
  }

  // --- mines ---
  for (const mine of world.mines) {
    mine.pulse += dt;
    const dx = p.x - mine.x;
    const dy = p.y - mine.y;
    const d = Math.hypot(dx, dy);
    const hitR = MINE.radius + PLAYER.radius - 4;
    if (d < hitR) {
      hurtPlayer(world, mine.x, mine.y);
      if (world.phase !== PHASE_PLAY) return;
    } else if (!mine.grazed && d < hitR + SCORE.nearMissRadius) {
      mine.grazed = true;
      world.score += SCORE.nearMiss;
      world.stats.nearMisses += 1;
      world.events.push('nearmiss');
      floatText(world, p.x, p.y - 24, `CLOSE +${SCORE.nearMiss}`, '#8fa3c8');
    }
    if (d > hitR + SCORE.nearMissRadius + 30) mine.grazed = false;
  }

  // --- power-ups ---
  world.powerTimer -= dt;
  if (world.powerTimer <= 0) {
    spawnPower(world);
    world.powerTimer = POWER.everySeconds;
  }
  for (let i = world.powers.length - 1; i >= 0; i -= 1) {
    const pw = world.powers[i];
    const dx = p.x - pw.x;
    const dy = p.y - pw.y;
    if (dx * dx + dy * dy < (PLAYER.pickupRadius + POWER.radius) ** 2) {
      world.powers.splice(i, 1);
      if (pw.kind === SCORE.powerShield) p.shield = 12;
      if (pw.kind === SCORE.powerMagnet) p.magnet = 10;
      if (pw.kind === SCORE.powerOverdrive) p.overdrive = 8;
      world.events.push('power');
      burst(world, pw.x, pw.y, '#c792ff', 16, 200);
      floatText(world, pw.x, pw.y - 16, pw.kind.toUpperCase() + '!', '#c792ff');
    }
  }

  stepParticles(world, dt);
}
