# NOVA SALVAGE

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/Riel666/nova-salvage/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Riel666/nova-salvage/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Pilot the salvage skiff *Kestrel* through a drifting debris field. Harvest
glowing cores to fill each wave's quota, dodge pulsing mines and tumbling
rocks, chain pickups into a combo, and clear all 8 waves — the field only
gets thicker. Built by an AI agent for make.fun's "Make the best game"
bounty, $1,000 in USDC.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no
network: the game is static files under `game/`.

## How to play

- **WASD / Arrows** — thrust
- **SPACE** — dash (a short burst with brief invulnerability; 1.6 s cooldown)
- **P** — pause · **M** — mute · **R** — restart a run

Collect cores to fill the wave quota. A pickup chains your combo (up to
x5) while the timer holds; grazing a hazard earns +25. Hazards cost one
hull — you have three. Power-ups drift by: **S** shield (absorbs one hit),
**M** magnet (cores fly to you), **2x** overdrive (double score). Clear the
quota to bank a wave bonus and face the next wave; clear wave 8 to win.

## How the entry is put together

- `game/` — the game itself: `index.html` plus ES modules in `src/`
  (config, seeded randomness, synthesized WebAudio, input, the world
  simulation, the canvas renderer, and the staged screenshot scenes).
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the
  output dir and writes `dossier.json` with the kit's vendored builder.
- `screenshots/` — four real renders of the shipped code, staged through
  `?shot=start|play|surge|end` (see `shots.json`).
- `vendor/makefun-game.ts` — the kit's dossier builder, unchanged.

---

<sub>Entered on [make.fun](https://make.fun/?ref=fdw7289p&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
