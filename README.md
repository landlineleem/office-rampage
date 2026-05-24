# Office Rampage

Side-scrolling MFP-style action shooter. Fight your way from the street up through 7 floors of Summit Capital Investments using office supplies as weapons, fueled by a caffeine-powered slow-motion meter.

Built with **Phaser 4 + TypeScript + Vite**. Procedural art + AI-generated character sprites + procedural sound via the Web Audio API.

🎮 **Play it:** https://landlineleem.github.io/office-rampage/

## Controls

| Key | Action |
|---|---|
| **A / D** | Run left / right |
| **W** | Jump · press again mid-air for **double jump** |
| **S** | Slide · you can **fire during slide** for the MFP combo |
| **Mouse** | Aim |
| **Left click** | Fire (auto weapons hold, semi weapons click each) |
| **SPACE** | Slow-motion (drains caffeine) |
| **1 / 2 / 3 / 4** | Swap weapon |
| **P** or **ESC** | Pause |
| **M** | Mute / unmute |

## Floors

1. **Lobby** — NYC night, marble columns, reception desk, security guards. Clear it to unlock the Auto Stapler.
2. **Cubicles** — Open-plan office floor. Guards + Interns. Slide under hanging fluorescent tubes.
3. **Boardroom** — Walnut + brass executive suite with a long boardroom table and chandeliers. Heavy Guards introduced. Clear to unlock the Hole Punch shotgun.
4. **Break Room** — White-tile cafeteria with vending machines, fridges, and snipers perched on the counters. Clear to unlock the Red Swingline sniper.
5. **Server Room** — Industrial dark with cable trays + steel grate floor. Server-rack platforms for vertical traversal. Mixed enemy waves.
6. **Hallway** — Long narrow corridor with identical doors. Pure combat density — 9 patrolling + 8 door spawners.
7. **Penthouse** — Luxury marble + gold + skyline view. **The CEO boss fight.** Defeat him to win.

## Enemies

| Type | Notes |
|---|---|
| **Security Guard** | Baseline. Patrols, fires staples. 2 HP. |
| **Heavy Guard** | 5 HP, slow, dark armor tint, heavier gun (30 dmg per bullet). |
| **Sniper** | Stationary, red tint, glass-cannon. Long aim delay with a pulsing laser sight. One shot does 45 dmg from 1100px away. |
| **Intern** | Pale, fast, no gun. Charges and slams into you on sight. 22 dmg per contact. |
| **The CEO** | Boss. 60 HP, golden tint, 1.7x scale. Rapid burst fire. **Phase 2 at 50% HP** — fire rate doubles, bullet damage +5, tint goes deep red. Blocks the elevator until defeated. |

## Weapons

| Slot | Weapon | Fire mode | Damage | Notes |
|---|---|---|---|---|
| 1 | **Stapler** | Semi-auto | 1 | Click each shot. Starter weapon. |
| 2 | **Auto Stapler** | Full-auto | 1 | Hold to spray. Slight inaccuracy. Drops on Lobby clear. |
| 3 | **Hole Punch** | Semi-auto | 2 × 5 pellets | Shotgun spread, close range. Drops on Boardroom clear. |
| 4 | **Red Swingline** | Semi-auto | 8 | Sniper rifle. One-shots regular guards. Drops on Break Room clear. |

## Game feel

Procedural particle effects (muzzle flashes, impact sparks, gun smoke, slide dust, ragdoll debris) · Hit reactions (screen shake, freeze-frame, full-screen flashes) · Bullet trails with glow halos · Ragdoll-ish corpses that fall and fade · Slow-mo vignette + cyan tint + audio lowpass · Custom rotating crosshair that scales up during slow-mo · Combo milestones at x5/x10/x15/x20 (STREAK · RAMPAGE · UNSTOPPABLE · GODLIKE) · Floating score popups per kill · Boss HP bar at the top during boss fight · Persistent high score via localStorage · Ambient drone music (4-layer Web Audio synthesis) · Elevator transitions between floors

## Develop

```bash
npm install
npm run dev      # http://localhost:5173/office-rampage/
npm run build    # production build → dist/
```

The dev server uses `VITE_BASE=/office-rampage/` by default for GitHub Pages compatibility. Override with `VITE_BASE=/ npm run dev` for the path-less version.

## Asset pipeline

AI-generated PNG sprites live in `public/assets/sprites/`. The game loads them at boot and falls back to procedural drawings if any file is missing.

Sprites currently in play:
- `player_idle.png`, `player_walk_0.png`, `player_walk_1.png`, `player_jump.png`
- `guard_idle.png`, `guard_walk_0.png`, `guard_walk_1.png`

Heavy / Sniper / Intern reuse the guard sprite with a color tint + scale modifier. The CEO boss does the same at 1.7x scale with a gold tint.

See [`SPRITE_SPEC.md`](SPRITE_SPEC.md) for the ChatGPT/DALL-E character bible.

## Architecture

```
src/
├── main.ts
├── scenes/
│   ├── BootScene.ts             # Procedural texture generation + asset preload
│   ├── MenuScene.ts             # Title screen with parallax skyline + high score
│   ├── GameScene.ts             # Gameplay
│   ├── LevelClearedScene.ts     # Inter-floor screen (incl. VICTORY)
│   └── GameOverScene.ts         # Death screen with high score check
├── core/
│   ├── SideScrollerPlayer.ts    # Player controller + animation + state
│   ├── ComboSystem.ts           # Streak tracking + milestones
│   ├── Sound.ts                 # Web Audio synthesis + ambient music
│   ├── Particles.ts             # Reusable particle bursts
│   ├── HitFx.ts                 # Camera shake / hit-pause / flash combos
│   └── HighScore.ts             # localStorage persistence
├── modes/office-sidescroller/
│   ├── config.ts                # Global tunable values
│   ├── enemies.ts               # Enemy class + 5 archetype configs
│   ├── weapons.ts               # PlayerWeapon + GuardGun + 4 weapon configs
│   ├── Corpse.ts                # Falling + fading death sprites
│   ├── Pickup.ts                # Weapon drop pickups
│   ├── lobby-level.ts           # LevelData type + Floor 1
│   ├── cubicles-level.ts        # Floor 2
│   ├── boardroom-level.ts       # Floor 3
│   ├── breakroom-level.ts       # Floor 4
│   ├── server-level.ts          # Floor 5
│   ├── hallway-level.ts         # Floor 6
│   ├── penthouse-level.ts       # Floor 7
│   └── levels.ts                # Ordered campaign array
└── ui/
    └── HUD.ts                   # HP bar + caffeine + combo + score + boss bar
```

## Status

**v0.44** — Full 7-floor campaign with boss fight. All juice + QoL pass complete.

See [`DECISIONS.md`](DECISIONS.md) for the rationale behind major design choices.
