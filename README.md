# Office Rampage

Top-down twin-stick — wait, no — a **side-scrolling MFP-style action shooter** where a disgruntled office worker fights his way up Summit Capital Investments using office supplies as weapons, fueled by a caffeine-powered slow-motion meter.

Built with **Phaser 4 + TypeScript + Vite**. Procedural art + AI-generated sprites + procedural sound via Web Audio API.

🎮 **Play it:** https://landlineleem.github.io/office-rampage/

## Controls

- **A / D** — run left/right
- **W** — jump
- **S** — slide (combine with A or D for direction)
- **Mouse** — aim
- **Left click** — fire (hold to fire continuously)
- **SPACE** — slow-mo (drains caffeine; refills on kill)

## Floors

1. **Lobby** — Walk out of the NYC night, through the revolving door, and fight your way through the marble lobby of Summit Capital Investments. Vault the reception desk, climb the file cabinet, slide under the hazard barrier, reach the elevator.
2. **Cubicles** — Open-plan floor of an office. Server racks, workstation desks, hanging fluorescent tubes you slide under, rolling office chairs, water coolers. More guards, no exterior.

## Game feel

- **Particle effects**: muzzle flashes, bullet impact sparks, gun smoke, slide dust, ragdoll debris
- **Hit reactions**: scaled screen shake, color flashes, brief freeze-frames on kills
- **Bullet trails**: glowing comet trails behind every projectile
- **Faked ragdoll deaths**: guards launch with hit-direction velocity, tumble, settle into a lying pose, stay on the floor for the rest of the run
- **Slow-mo visuals**: vignette darkens edges + cool cyan tint + audio lowpass filter
- **Crosshair cursor**: tracks the mouse, scales up during slow-mo
- **Combo milestones**: x5 STREAK · x10 RAMPAGE · x15 UNSTOPPABLE · x20 GODLIKE
- **Procedural sound**: gunshots, footsteps, hits, elevator dings, ambient drone music — all synthesized at runtime via Web Audio API
- **Persistent high score**: localStorage-backed, shown on title + game over
- **Elevator transitions**: walk into the elevator, doors close, fade out, next floor

## Develop

```bash
npm install
npm run dev      # http://localhost:5173/office-rampage/
npm run build    # production build → dist/
```

The dev server uses `VITE_BASE=/office-rampage/` by default for GitHub Pages compatibility. Override with `VITE_BASE=/ npm run dev` if you want the path-less version locally.

## Asset pipeline

- AI-generated PNG sprites live in `public/assets/sprites/`. The game loads them at boot and falls back to procedural drawings if any file is missing.
- See [`SPRITE_SPEC.md`](SPRITE_SPEC.md) for the ChatGPT/DALL-E character bible used to generate the current character set.
- Sprites can be added or replaced incrementally — drop a file, reload, and the swap is automatic.

## Architecture

```
src/
├── main.ts                          # Phaser game config
├── scenes/
│   ├── BootScene.ts                 # Texture generation + asset preload
│   ├── MenuScene.ts                 # Title + parallax NYC skyline
│   ├── GameScene.ts                 # The actual gameplay
│   ├── LevelClearedScene.ts         # Between-floor screen
│   └── GameOverScene.ts             # Death screen + high score
├── core/
│   ├── SideScrollerPlayer.ts        # Player controller + animation
│   ├── ComboSystem.ts               # Kill streak tracking + milestones
│   ├── Sound.ts                     # Web Audio synthesis + music
│   ├── Particles.ts                 # Reusable particle bursts
│   ├── HitFx.ts                     # Shake / flash / freeze-frame
│   └── HighScore.ts                 # localStorage persistence
├── modes/office-sidescroller/
│   ├── config.ts                    # All tunable game values
│   ├── enemies.ts                   # SecurityGuard AI + animation
│   ├── weapons.ts                   # Pistol + GuardGun + bullet trails
│   ├── Corpse.ts                    # Ragdoll death sprites
│   ├── lobby-level.ts               # LevelData type + Floor 1
│   ├── cubicles-level.ts            # Floor 2
│   └── levels.ts                    # Ordered campaign + helpers
└── ui/
    └── HUD.ts                       # HP + caffeine + combo + score
```

## Status

**v0.28** — Two floors, full game-feel polish pass complete (particles, sound, hit reactions, ragdolls, bullet trails, slow-mo juice, HUD upgrade, music, high score, elevator transitions, crosshair, combo milestones).

Future work: more floors, more enemy types, more weapons, Path B for the gun-arm (AI sprite variants at multiple aim angles), boss fight at the CEO penthouse.
