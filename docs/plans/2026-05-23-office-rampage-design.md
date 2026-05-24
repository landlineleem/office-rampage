# Office Rampage — Design

**Date:** 2026-05-23
**Status:** v0.1 design, validated via brainstorming session

## One-liner

Top-down twin-stick arena horde shooter where a disgruntled office worker
fights waves of corporate enemies (Interns → CEO) using office supplies as
weapons, fueled by a caffeine-powered slow-motion meter. Built in Phaser 3 +
TypeScript, deployed to GitHub Pages. Architected so a second "Pizza Delivery
vs. Raccoon Mafia" mode can be added later without rewriting the engine.

## Tech stack

- **Engine:** Phaser (TypeScript)
- **Build:** Vite (fast HMR, static output)
- **Hosting:** GitHub Pages via GitHub Actions on push to `main`
- **Repo:** `landlineleem/office-rampage`
- **Art (MVP):** Placeholder geometric shapes — colored rectangles/circles with
  simple icons. Real sprites come after game feel is dialed in.

## Core mechanics

### Movement
- WASD, 8-direction, constant speed.
- Hold **Shift** to slide — short burst, brief i-frames, pass through enemies.

### Aim & shoot
- Mouse cursor = aim point.
- Left click: primary weapon.
- Right click: secondary (dual-wield). Both aim the same direction (twin-stick
  convention; independent dual-aim is a side-scroller affordance that doesn't
  translate cleanly to top-down).
- Auto-reload when empty.

### Caffeine meter (slow-motion)
- Hold **Space** → "Caffeine Rush": world slows to ~30% speed, player moves
  at near-normal speed.
- Full meter ≈ 5 seconds of slow-mo.
- Refills: +10% per kill, +5%/sec near coffee mugs / vending machines.
- Empty meter → 1 second of *slower* movement (withdrawal penalty).

### Style combos
- Each kill within 2s of the last increments combo counter.
- Combo multiplies score.
- Breaks on damage taken or timeout.
- HUD shows floating `x3!`, `x7!` above player; screen-edge effects intensify
  with combo size.

### Health
- 3 hits → dead. No regen. Health pickups rare drops from elites.

### Weapons (MVP set)
- **Stapler** — rapid-fire, low damage, infinite ammo (starter primary).
- **Three-hole punch** — 3-bullet spread shotgun, slow, devastating close.
- **Red Swingline** — single-shot sniper, one-shots most enemies, very slow.

Pickups drop from defeated enemies. Hot-swap on pickup (old weapon drops).

## Enemy roster (corporate ladder)

| Enemy | Behavior | HP | Role | Intro wave |
|---|---|---|---|---|
| Intern | Sprints, melee coffee splash | 1 | Swarm filler | 1 |
| HR Rep | Stops at medium range, throws NDAs | 2 | Forces movement | 3 |
| IT Guy | Slow, laptop shield blocks front damage — flank | 3 | Positioning | 5 |
| Sentient Printer | Stationary turret, slow rotation, paper-jam burst | 4 | Area-denial | 7 |
| Middle Manager *(mini-boss)* | Fast, dodges, TPS report grenades | 8 | Every 5 waves | 5, 10, 15… |
| The CEO *(final boss)* | Giant Excel spreadsheet, bullet-hell rows/columns | 30 | Endgame | 20 |

## Arena & waves

- **Arena:** Single open-plan office floor (~30×20 tiles).
  - Desks/cubicle walls = half-cover (block bullets, shoot over).
  - Water coolers/printers = full cover.
  - Coffee mug pickups scattered.
- **Spawns:** From 4 corner doors (NE, NW, SE, SW). 1-second door-flash
  telegraph before spawn.
- **Wave structure:**
  - Wave N spawns ~N×2 enemies, mix shifts heavier with N.
  - Clear arena → 10-second breather → next wave.
  - Caffeine refills full at breather start.
  - Every 3 waves, a random new weapon drops at arena center.
- **Death:** Game over screen with stats (waves, kills, best combo). One
  button: "Back to Work." Restart.

## Project structure

```
office-rampage/
├── src/
│   ├── main.ts                  # Phaser game config + boot
│   ├── scenes/
│   │   ├── BootScene.ts         # Asset loading
│   │   ├── MenuScene.ts         # Title + mode select
│   │   ├── GameScene.ts         # The actual arena
│   │   └── GameOverScene.ts     # Death screen
│   ├── modes/                   # ← swappable game modes
│   │   └── office/
│   │       ├── config.ts        # Enemy stats, weapons, arena, theme
│   │       ├── enemies.ts       # Intern, HR Rep, IT Guy, Printer, Manager
│   │       └── weapons.ts       # Stapler, hole punch, Swingline
│   ├── core/                    # ← mode-agnostic systems
│   │   ├── Player.ts            # Movement, slide, slow-mo, caffeine
│   │   ├── WaveManager.ts       # Spawn logic
│   │   ├── ComboSystem.ts       # Style/combo tracking
│   │   └── Pickup.ts            # Coffee, weapons
│   └── ui/
│       └── HUD.ts               # Health, caffeine bar, combo, wave
├── public/                      # Static assets
├── index.html
├── vite.config.ts
└── .github/workflows/deploy.yml # Auto-deploy to GH Pages
```

The `modes/office/` split is the key thing — when we add Pizza Kid later, it's
`modes/pizza/` with its own enemies/weapons/config, and `core/` doesn't change.

## MVP scope (v0.1 — first playable build)

1. Player moves (WASD), aims (mouse), shoots stapler (left click).
2. Interns spawn in waves, walk at you, melee on contact.
3. Slow-mo works on Space, caffeine meter visible.
4. Combo counter visible.
5. Take 3 hits → game over → restart.
6. Deployed to GitHub Pages, playable on phone or desktop.

## Explicitly out of scope for v0.1

Sound, music, real art, multiplayer, save files, settings menu, particle
effects. *(Small screen shake on hits is in — too good to skip.)*

## Iteration loop

1. I build → push → GH Actions deploys to `landlineleem.github.io/office-rampage`.
2. You play, tell me what feels off.
3. I tune (speeds, damage, fire rates, slow-mo strength).
4. Repeat.

Game feel is iterative — every tunable value will be revised multiple times.

## Future work (post-v0.1)

- Remaining enemies (HR Rep, IT Guy, Printer, Middle Manager, CEO)
- Remaining weapons (hole punch, Swingline) + pickup system
- Arena cover layout (desks, water coolers)
- Coffee mug pickups
- Real art swap-in
- Sound + music
- Second mode: Pizza Kid vs. Raccoon Mafia
