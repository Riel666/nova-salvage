// The screenshot scenes behind ?shot=start|play|surge|end. Each one plays the
// real rules forward from a fresh world for a fixed number of steps, steered
// by a simple autopilot (score every steering direction by how close it gets
// to the nearest core, minus how close it gets to a hazard), so the frame is
// what a short game really looks like and the same seed always gives the same
// frame.
import { FIELD, PLAYER, STEP } from './config.js';
import { PHASE_TITLE, PHASE_PLAY, PHASE_CLEAR, stepWorld, setupWave, stepAmbient } from './world.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 26;
const SURGE_SECONDS = 46;
const END_LIMIT_SECONDS = 600;
/**
 * How far ahead, in seconds, the autopilot checks each way it could move: the
 * play scene's pilot looks well ahead and keeps all its hull; the end scene's
 * looks only a moment ahead, so it is caught out once the field thickens, as
 * a hurried player is.
 */
const HORIZON_PLAY = 0.8;
const HORIZON_SURGE = 0.8;
const HORIZON_END = 0.8;
const SAMPLE = 1 / 30;
/** The eight steering directions the pilot scores, plus staying still. */
const DIRECTIONS = [
  [0, 0], [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];
const DANGER_RADIUS = 130;

/** Danger of standing at (x, y) after `t` seconds: mines and rocks nearby. */
function dangerAt(state, x, y, t) {
  let danger = 0;
  for (const mine of state.mines) {
    const d = Math.hypot(x - mine.x, y - mine.y);
    if (d < DANGER_RADIUS) danger += (DANGER_RADIUS - d) / DANGER_RADIUS;
  }
  for (const rock of state.rocks) {
    const rx = rock.x + rock.vx * t;
    const ry = rock.y + rock.vy * t;
    const d = Math.hypot(x - rx, y - ry);
    if (d < DANGER_RADIUS + rock.r) danger += (DANGER_RADIUS + rock.r - d) / (DANGER_RADIUS + rock.r);
  }
  return danger;
}

/** The safest steering direction that still chases the nearest core. */
function autopilot(state, horizon, dangerWeight = 3) {
  const player = state.player;
  let core = null;
  let bestCore = Infinity;
  for (const c of state.cores) {
    const d = Math.hypot(c.x - player.x, c.y - player.y);
    if (d < bestCore) {
      bestCore = d;
      core = c;
    }
  }
  let best = DIRECTIONS[0];
  let bestScore = -Infinity;
  for (const [dx, dy] of DIRECTIONS) {
    const len = Math.hypot(dx, dy) || 1;
    let score = 0;
    for (let t = SAMPLE; t <= horizon; t += SAMPLE) {
      const nx = Math.min(FIELD.width - PLAYER.radius, Math.max(PLAYER.radius, player.x + (dx / len) * PLAYER.maxSpeed * t));
      const ny = Math.min(FIELD.height - PLAYER.radius, Math.max(PLAYER.radius, player.y + (dy / len) * PLAYER.maxSpeed * t));
      score -= dangerAt(state, nx, ny, t) * dangerWeight;
      if (core) {
        const dc = Math.hypot(core.x - nx, core.y - ny);
        score -= dc / 400;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = [dx, dy];
    }
  }
  const dash = dangerAt(state, player.x, player.y, 0.15) > 0.9 && player.dashCooldown <= 0;
  return { x: best[0], y: best[1], dash };
}

/**
 * Set `world` to the named scene (start, play, surge or end; any other name
 * is start) and return the screen to draw over it.
 */
export function stageShot(name, world) {
  if (name !== 'play' && name !== 'surge' && name !== 'end') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) stepAmbient(world, STEP);
    return { screen: PHASE_TITLE };
  }
  if (name === 'surge') {
    world.wave = 5;
    setupWave(world);
  }
  if (name === 'end') {
    // A hurried pilot deep in the field, down to its last hull: start at
    // wave 6 with one hull left, chase cores hard and weigh danger not at
    // all, so the run ends on the loss screen.
    world.wave = 6;
    setupWave(world);
    world.hull = 1;
  }
  world.phase = PHASE_PLAY;
  const limit = name === 'end' ? END_LIMIT_SECONDS : name === 'surge' ? SURGE_SECONDS : PLAY_SECONDS;
  const horizon = name === 'end' ? HORIZON_END : HORIZON_PLAY;
  const weight = name === 'end' ? 0 : 3;
  for (let index = 0; index < limit / STEP; index += 1) {
    stepWorld(world, autopilot(world, horizon, weight));
    if (world.phase !== PHASE_PLAY && world.phase !== PHASE_CLEAR) break;
    if (world.phase === PHASE_CLEAR) {
      // Let the clear banner finish, then keep playing the next wave.
      for (let j = 0; j < 2.4 / STEP; j += 1) stepWorld(world, { x: 0, y: 0, dash: false });
      if (world.phase !== PHASE_PLAY) break;
    }
  }
  return { screen: world.phase };
}
