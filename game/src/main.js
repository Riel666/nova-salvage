// NOVA SALVAGE — entry point. The game loop (fixed 60 Hz simulation, render
// every animation frame), the screen state machine, and the staged
// ?shot=start|play|surge|end mode the screenshots are captured with: a shot
// stages the world, renders one frame, then sets window.__shotReady.
import { FIELD, STEP } from './config.js';
import { Input } from './input.js';
import { SoundFX } from './audio.js';
import {
  createWorld, startGame, stepWorld, stepAmbient,
  PHASE_TITLE, PHASE_PLAY, PHASE_CLEAR, PHASE_OVER, PHASE_WIN,
} from './world.js';
import { render, SCREEN_PAUSE } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) ? seedParam >>> 0 : (Math.random() * 0xffffffff) >>> 0;
const shotName = params.get('shot');

const sfx = new SoundFX();
const input = new Input();
input.attach();

let world = createWorld(seed);
try {
  world.best = Number(window.localStorage.getItem('nova-salvage-best') ?? 0) || 0;
} catch {
  world.best = 0;
}

function saveBest() {
  try {
    window.localStorage.setItem('nova-salvage-best', String(world.best));
  } catch {
    // Storage may be unavailable; the best score is a nicety, not the game.
  }
}

function playEvents() {
  for (const event of world.events) {
    if (event === 'pickup') sfx.pickup(world.combo);
    if (event === 'hit') sfx.hit();
    if (event === 'dash') sfx.dash();
    if (event === 'power') sfx.power();
    if (event === 'clear') sfx.waveClear();
    if (event === 'nearmiss') sfx.nearMiss();
    if (event === 'shield') sfx.power();
    if (event === 'over') { sfx.gameOver(); saveBest(); }
    if (event === 'win') { sfx.win(); saveBest(); }
  }
}

function screenOf(world, paused) {
  if (paused) return SCREEN_PAUSE;
  return world.phase;
}

if (shotName) {
  // Staged capture: no audio, no input, one deterministic frame.
  try {
    const staged = stageShot(shotName, world);
    render(ctx, world, staged.screen);
    window.__shotReady = true;
  } catch (error) {
    window.__shotError = String(error && error.message ? error.message : error);
  }
} else {
  let paused = false;
  let last = performance.now();
  let accumulator = 0;

  canvas.addEventListener('click', () => {
    sfx.ensure();
    if (world.phase === PHASE_TITLE) {
      sfx.click();
      startGame(world, (Math.random() * 0xffffffff) >>> 0);
    }
  });

  function frame(now) {
    requestAnimationFrame(frame);
    const elapsed = Math.min(0.25, (now - last) / 1000);
    last = now;
    accumulator += elapsed;

    if (input.wasPressed('KeyM')) {
      const muted = sfx.toggleMute();
      void muted;
    }
    if (world.phase === PHASE_TITLE && input.startPressed) {
      sfx.ensure();
      sfx.click();
      startGame(world, (Math.random() * 0xffffffff) >>> 0);
    } else if ((world.phase === PHASE_OVER || world.phase === PHASE_WIN) && (input.wasPressed('KeyR') || input.startPressed)) {
      sfx.ensure();
      sfx.click();
      startGame(world, (Math.random() * 0xffffffff) >>> 0);
    } else if (world.phase === PHASE_PLAY && input.wasPressed('KeyP')) {
      paused = !paused;
      sfx.click();
    } else if (paused && input.wasPressed('KeyR')) {
      paused = false;
      startGame(world, (Math.random() * 0xffffffff) >>> 0);
    }

    if (!paused) {
      while (accumulator >= STEP) {
        accumulator -= STEP;
        if (world.phase === PHASE_TITLE) {
          stepAmbient(world, STEP);
        } else {
          const axis = input.axis();
          stepWorld(world, { x: axis.x, y: axis.y, dash: input.dashPressed });
          playEvents();
        }
        input.endStep();
      }
    } else {
      input.endStep();
    }
    render(ctx, world, screenOf(world, paused));
  }
  requestAnimationFrame(frame);
}
