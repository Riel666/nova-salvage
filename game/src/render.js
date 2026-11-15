// NOVA SALVAGE — everything the player sees: the neon field, the skiff, the
// HUD, and every screen. Canvas 2D only, system fonts only, nothing fetched.
import { FIELD, COLORS, PLAYER, CORE, MINE, POWER, TOTAL_WAVES } from './config.js';
import { PHASE_TITLE, PHASE_PLAY, PHASE_CLEAR, PHASE_OVER, PHASE_WIN } from './world.js';
import { TAU } from './random.js';

export const SCREEN_PAUSE = 'pause';

const NEBULA_COLORS = [COLORS.nebulaA, COLORS.nebulaB, COLORS.nebulaC];

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBackground(ctx, world) {
  const g = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  g.addColorStop(0, COLORS.bgTop);
  g.addColorStop(1, COLORS.bgBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  world.nebulae.forEach((n, i) => {
    const rg = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
    rg.addColorStop(0, NEBULA_COLORS[i]);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2);
  });
  for (const s of world.stars) {
    const a = 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(world.time * 1.7 + s.tw));
    ctx.globalAlpha = a;
    ctx.fillStyle = '#cfe0ff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawCore(ctx, world, c) {
  const bob = Math.sin(world.time * 2.2 + c.phase) * 3;
  const y = c.y + bob;
  const rot = world.time * 0.9 + c.phase;
  ctx.save();
  ctx.translate(c.x, y);
  ctx.rotate(rot);
  ctx.shadowColor = COLORS.coreGlow;
  ctx.shadowBlur = 14;
  ctx.fillStyle = COLORS.core;
  ctx.beginPath();
  ctx.moveTo(0, -CORE.radius);
  ctx.lineTo(CORE.radius * 0.72, 0);
  ctx.lineTo(0, CORE.radius);
  ctx.lineTo(-CORE.radius * 0.72, 0);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff6c9';
  ctx.beginPath();
  ctx.moveTo(0, -CORE.radius * 0.45);
  ctx.lineTo(CORE.radius * 0.32, 0);
  ctx.lineTo(0, CORE.radius * 0.45);
  ctx.lineTo(-CORE.radius * 0.32, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRock(ctx, world, rock) {
  ctx.save();
  ctx.translate(rock.x, rock.y);
  ctx.rotate(rock.rot);
  ctx.fillStyle = COLORS.rock;
  ctx.strokeStyle = COLORS.rockDark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < rock.verts.length; i += 1) {
    const a = (i / rock.verts.length) * TAU;
    const r = rock.r * rock.verts[i];
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath();
  ctx.arc(-rock.r * 0.25, -rock.r * 0.3, rock.r * 0.28, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawMine(ctx, world, mine) {
  const pulse = 0.5 + 0.5 * Math.sin(mine.pulse * 2.4);
  const p = world.player;
  const near = Math.hypot(p.x - mine.x, p.y - mine.y) < 120;
  ctx.save();
  ctx.translate(mine.x, mine.y);
  ctx.shadowColor = COLORS.mine;
  ctx.shadowBlur = near ? 18 + pulse * 10 : 8;
  ctx.strokeStyle = COLORS.mine;
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * TAU + world.time * 0.25;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * MINE.radius * 0.8, Math.sin(a) * MINE.radius * 0.8);
    ctx.lineTo(Math.cos(a) * (MINE.radius + 7 + pulse * 3), Math.sin(a) * (MINE.radius + 7 + pulse * 3));
    ctx.stroke();
  }
  ctx.fillStyle = '#3a0d18';
  ctx.beginPath();
  ctx.arc(0, 0, MINE.radius, 0, TAU);
  ctx.fill();
  ctx.fillStyle = COLORS.mineCore;
  ctx.beginPath();
  ctx.arc(0, 0, MINE.radius * (0.34 + pulse * 0.14), 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawPower(ctx, world, pw) {
  const bob = Math.sin(world.time * 2.6 + pw.phase) * 3;
  const color = pw.kind === 'shield' ? COLORS.shield : pw.kind === 'magnet' ? COLORS.magnet : COLORS.overdrive;
  ctx.save();
  ctx.translate(pw.x, pw.y + bob);
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, POWER.radius, 0, TAU);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#0a0f24';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pw.kind === 'shield' ? 'S' : pw.kind === 'magnet' ? 'M' : '2x', 0, 1);
  ctx.restore();
}

function drawPlayer(ctx, world) {
  const p = world.player;
  if (p.invuln > 0 && Math.floor(world.time * 14) % 2 === 0 && world.phase === PHASE_PLAY) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  if (p.thrusting) {
    const flick = 10 + Math.random() * 8;
    ctx.fillStyle = COLORS.flame;
    ctx.beginPath();
    ctx.moveTo(-12, -5);
    ctx.lineTo(-12 - flick, 0);
    ctx.lineTo(-12, 5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.shadowColor = COLORS.shipGlow;
  ctx.shadowBlur = 16;
  ctx.fillStyle = COLORS.ship;
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-11, -11);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-11, 11);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#0a0f24';
  ctx.beginPath();
  ctx.arc(3, 0, 4.5, 0, TAU);
  ctx.fill();
  ctx.restore();
  if (p.shield > 0) {
    ctx.save();
    ctx.strokeStyle = COLORS.shield;
    ctx.globalAlpha = 0.55 + 0.3 * Math.sin(world.time * 5);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, PLAYER.radius + 9, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
  if (p.dashTime > 0) {
    ctx.save();
    ctx.strokeStyle = 'rgba(127,231,255,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, PLAYER.radius + 16, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
}

function drawParticles(ctx, world) {
  for (const pt of world.parts) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of world.floats) {
    ctx.globalAlpha = Math.max(0, f.life);
    ctx.fillStyle = f.color;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

function drawHearts(ctx, x, y, hull, maxHull) {
  for (let i = 0; i < maxHull; i += 1) {
    const hx = x + i * 26;
    ctx.fillStyle = i < hull ? '#ff5d7a' : 'rgba(255,93,122,0.22)';
    ctx.beginPath();
    ctx.moveTo(hx, y + 5);
    ctx.bezierCurveTo(hx - 8, y - 4, hx - 2, y - 10, hx, y - 3);
    ctx.bezierCurveTo(hx + 2, y - 10, hx + 8, y - 4, hx, y + 5);
    ctx.fill();
  }
}

function drawHUD(ctx, world) {
  const p = world.player;
  ctx.save();
  ctx.fillStyle = 'rgba(5,8,20,0.55)';
  roundRect(ctx, 0, 0, FIELD.width, 46, 0);
  ctx.fill();
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.hud;
  ctx.font = 'bold 21px system-ui, sans-serif';
  ctx.fillText(`SCORE ${world.score}`, 16, 24);
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillStyle = COLORS.hudDim;
  ctx.fillText(`BEST ${Math.max(world.best, world.score)}`, 190, 25);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.hud;
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText(`WAVE ${world.wave}/${TOTAL_WAVES}`, FIELD.width / 2, 17);
  const barW = 150;
  const barX = FIELD.width / 2 - barW / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  roundRect(ctx, barX, 30, barW, 8, 4);
  ctx.fill();
  ctx.fillStyle = COLORS.core;
  const frac = Math.min(1, world.quota / world.quotaTarget);
  if (frac > 0) {
    roundRect(ctx, barX, 30, barW * frac, 8, 4);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SALVAGE ${world.quota}/${world.quotaTarget}`, barX + barW + 10, 34);
  ctx.textAlign = 'right';
  drawHearts(ctx, FIELD.width - 118, 16, world.hull, PLAYER.maxHull);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('HULL', FIELD.width - 124, 24);
  if (world.combo > 1) {
    ctx.fillStyle = COLORS.core;
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(`COMBO x${world.combo}`, FIELD.width - 16, 78);
  }
  const dashFrac = 1 - Math.max(0, p.dashCooldown) / 1.6;
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  roundRect(ctx, FIELD.width - 116, 50, 100, 6, 3);
  ctx.fill();
  ctx.fillStyle = dashFrac >= 1 ? COLORS.ship : COLORS.hudDim;
  if (dashFrac > 0) {
    roundRect(ctx, FIELD.width - 116, 50, 100 * dashFrac, 6, 3);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(dashFrac >= 1 ? 'DASH READY' : 'DASH', FIELD.width - 122, 53);
  let py = 62;
  ctx.textAlign = 'left';
  ctx.font = 'bold 12px system-ui, sans-serif';
  if (p.shield > 0) { ctx.fillStyle = COLORS.shield; ctx.fillText(`SHIELD ${Math.ceil(p.shield)}s`, 16, py); py += 16; }
  if (p.magnet > 0) { ctx.fillStyle = COLORS.magnet; ctx.fillText(`MAGNET ${Math.ceil(p.magnet)}s`, 16, py); py += 16; }
  if (p.overdrive > 0) { ctx.fillStyle = COLORS.overdrive; ctx.fillText(`OVERDRIVE 2x ${Math.ceil(p.overdrive)}s`, 16, py); py += 16; }
  ctx.restore();
}

function panel(ctx, title, lines, accent) {
  ctx.save();
  ctx.fillStyle = 'rgba(4,7,18,0.72)';
  roundRect(ctx, FIELD.width / 2 - 250, 128, 500, 300, 18);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.7;
  roundRect(ctx, FIELD.width / 2 - 250, 128, 500, 300, 18);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillText(title, FIELD.width / 2, 196);
  ctx.fillStyle = COLORS.hud;
  ctx.font = '17px system-ui, sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, FIELD.width / 2, 248 + i * 30));
  ctx.restore();
}

function drawTitle(ctx, world) {
  ctx.save();
  ctx.fillStyle = 'rgba(4,7,18,0.45)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.ship;
  ctx.shadowColor = COLORS.shipGlow;
  ctx.shadowBlur = 24;
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.fillText('NOVA SALVAGE', FIELD.width / 2, 190);
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.core;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('Harvest the cores. Dodge the mines. Clear all 8 waves.', FIELD.width / 2, 232);
  ctx.fillStyle = COLORS.hud;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('WASD / Arrows — thrust      SPACE — dash (brief shield)', FIELD.width / 2, 300);
  ctx.fillText('S shield   •   M magnet   •   2x overdrive      P pause   •   M mute', FIELD.width / 2, 328);
  ctx.fillText('Chain pickups for a combo up to x5. A graze earns +25.', FIELD.width / 2, 356);
  if (world.best > 0) {
    ctx.fillStyle = COLORS.core;
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.fillText(`BEST SCORE ${world.best}`, FIELD.width / 2, 398);
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  const blink = 0.6 + 0.4 * Math.sin(world.time * 4);
  ctx.globalAlpha = blink;
  ctx.fillText('— PRESS ENTER TO LAUNCH —', FIELD.width / 2, 452);
  ctx.restore();
}

function drawClear(ctx, world) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.good;
  ctx.shadowColor = COLORS.good;
  ctx.shadowBlur = 18;
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText(`WAVE ${world.wave} CLEARED`, FIELD.width / 2, FIELD.height / 2 - 10);
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.hud;
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText(world.wave >= TOTAL_WAVES ? 'The field is yours.' : `Wave ${world.wave + 1} incoming — hazards multiply.`, FIELD.width / 2, FIELD.height / 2 + 30);
  ctx.restore();
}

/** Draw the whole frame for `screen` over `world`. */
export function render(ctx, world, screen) {
  ctx.save();
  if (world.shake > 0.5) {
    ctx.translate((Math.random() - 0.5) * world.shake, (Math.random() - 0.5) * world.shake);
  }
  drawBackground(ctx, world);
  for (const c of world.cores) drawCore(ctx, world, c);
  for (const pw of world.powers) drawPower(ctx, world, pw);
  for (const mine of world.mines) drawMine(ctx, world, mine);
  for (const rock of world.rocks) drawRock(ctx, world, rock);
  if (world.phase !== PHASE_OVER) drawPlayer(ctx, world);
  drawParticles(ctx, world);
  ctx.restore();

  if (screen === PHASE_TITLE) {
    drawTitle(ctx, world);
    return;
  }
  drawHUD(ctx, world);
  if (screen === PHASE_CLEAR) drawClear(ctx, world);
  if (screen === SCREEN_PAUSE) {
    panel(ctx, 'PAUSED', ['Take a breath, pilot.', 'P — resume      R — restart run'], COLORS.hud);
  }
  if (screen === PHASE_OVER) {
    panel(ctx, 'SIGNAL LOST', [
      `Final score ${world.score}   •   Best ${Math.max(world.best, world.score)}`,
      `Waves cleared ${world.wave - 1}   •   Cores salvaged ${world.stats.collected}`,
      'Press R or ENTER to fly again',
    ], COLORS.danger);
  }
  if (screen === PHASE_WIN) {
    panel(ctx, 'FIELD CLEARED!', [
      `Final score ${world.score}   •   Best ${Math.max(world.best, world.score)}`,
      `All ${TOTAL_WAVES} waves cleared   •   Cores salvaged ${world.stats.collected}`,
      'Press R or ENTER to fly again',
    ], COLORS.good);
  }
  if (world.flash > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(255,40,70,${world.flash * 0.5})`;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.restore();
  }
}
