// NOVA SALVAGE — tuning constants. One place for every number the game
// balances on, so a wave's difficulty or a pickup's value is a one-line edit.
export const FIELD = { width: 960, height: 600 };
export const STEP = 1 / 60;

export const TOTAL_WAVES = 8;
export const quotaTarget = (wave) => 6 + wave * 2;
export const rockCount = (wave) => 2 + wave;
export const mineCount = (wave) => 1 + Math.floor(wave / 2);
export const rockSpeed = (wave) => 55 + wave * 9;

export const PLAYER = {
  radius: 14,
  accel: 1500,
  maxSpeed: 330,
  drag: 2.6,
  dashSpeed: 780,
  dashTime: 0.22,
  dashCooldown: 1.6,
  maxHull: 3,
  invulnTime: 1.6,
  pickupRadius: 26,
};

export const CORE = { radius: 11, score: 100, comboWindow: 3.0, maxCombo: 5 };
export const MINE = { radius: 17, pulse: 1.4 };
export const ROCK = { minRadius: 16, maxRadius: 34 };
export const POWER = { radius: 14, everySeconds: 14 };

export const SCORE = {
  nearMiss: 25,
  nearMissRadius: 52,
  waveBonus: 500,
  powerShield: 'shield',
  powerMagnet: 'magnet',
  powerOverdrive: 'overdrive',
};

export const COLORS = {
  bgTop: '#070b1e',
  bgBottom: '#0d1330',
  nebulaA: 'rgba(88, 60, 180, 0.20)',
  nebulaB: 'rgba(20, 140, 160, 0.16)',
  nebulaC: 'rgba(190, 60, 110, 0.12)',
  ship: '#7fe7ff',
  shipGlow: '#2fa8ff',
  flame: '#ffb347',
  core: '#ffd94a',
  coreGlow: '#ff9d00',
  mine: '#ff5d7a',
  mineCore: '#ff8fa3',
  rock: '#8d93a8',
  rockDark: '#565d75',
  shield: '#6ef3ff',
  magnet: '#c792ff',
  overdrive: '#ff9d5c',
  hud: '#dfe9ff',
  hudDim: '#8fa3c8',
  danger: '#ff5d7a',
  good: '#7dffb0',
};
