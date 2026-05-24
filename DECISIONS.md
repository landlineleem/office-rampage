# Design decisions log

Notes on major choices made while building Office Rampage, with the
reasoning behind each in case any of them need to be revisited.

## Engine: Phaser 4 (web-only)

Considered: Phaser 4, Three.js (2.5D), Unity, Godot.

Picked Phaser because the game is fundamentally 2D side-scrolling
and Phaser ships everything we need (Arcade physics, sprite groups,
TileSprite parallax, ParticleEmitter) out of the box. Three.js would
have given closer MFP visual fidelity via real 3D models, but model
rigging + animation would have cost weeks. Unity / Godot would have
been over-engineered for a hobby web target.

## Art: procedural + AI hybrid

Considered: pure procedural, pure AI sprites, free asset packs,
full 3D models.

Settled on: AI character sprites for the player + security guard
baseline; everything else (props, walls, floors, decor, enemy
variants) procedural with a cohesive limited palette and Katana-Zero-
style intentional flat shading.

The earlier AI-background experiment (a wide DALL-E lobby image used
as a tile sprite) failed — tiling was unavoidably obvious and a
static painted backdrop fought the moving character. Dropped that
direction in v0.13.

Enemy archetypes reuse the guard sprite with a tint + scale modifier
rather than separate sprites — this keeps the art coherent (no
stylistic clash) and lets new enemy types ship without an art
generation step. Heavy = dark steel tint + 1.22x, Sniper = red tint,
Intern = pale tint + 0.85x, CEO = gold tint + 1.7x.

## Gun-arm overlay: hidden

The MFP-signature rotating gun-arm was tried as a procedural sprite
overlay in v0.6-0.10, but no amount of color matching made it look
like part of the 3D-rendered character. Path B (generating multiple
character sprites at different aim angles with the gun-arm baked in)
is the documented future fix; for now the arm is hidden and bullets
still fire from the shoulder world position.

## Camera

Bottom-anchored character origin (0.5, 1.0) — sprite.y == feet. Makes
ground contact math trivial across pose swaps (standing 32x56,
slide 56x32, multi-aspect AI sprites). Camera follows with offset
(-150, 80) so the player sits at roughly the lower-third of the
screen with headroom for jumps.

## Slow-mo: world timeScale + counter-boost

Phaser arcade physics has a built-in timeScale property. Setting
`physics.world.timeScale = 1 / 0.35` slows everything; the player
gets a counter-boost so their velocity feels normal. This is far
simpler than rolling our own slow-mo per-entity.

## Sound: procedural Web Audio

No audio asset pipeline. All sounds (gunshots, hits, footsteps,
elevator dings, ambient music) are synthesized at play time from
oscillators + noise buffers + biquad filters routed through a
slow-mo lowpass bus. Music is a 4-layer ambient drone with LFO
detune drift.

## Fire modes

Single Stapler = semi-auto (click per shot, 140ms minimum spacing).
Auto Stapler = full-auto (hold to fire, 70ms cadence).
Implemented via WeaponConfig.fireMode + pointerdown handler for semi
vs `update()` held-button check for auto. Lets us add new weapons
either way trivially.

## Weapon damage: per-bullet payload

Each fired bullet has its damage payload stored on `setData("damage")`
at fire time. The overlap handlers read this value, so per-weapon and
per-enemy damage values can vary freely. Hole Punch shotgun pellets
each carry 2 damage, Swingline sniper bullets carry 8.

## HP: 100-point bar

Old system was 3 hearts, 1 damage per hit. Coarse — every encounter
was an existential threat. Bumped to 100 HP with scaled damage values
(guard bullet 18, heavy bullet 30, sniper bullet 45, contact 15-25).
Now combat has chunky, readable HP loss and the player can survive 4-5
mistakes per life. Invuln-frames shortened from 800ms to 450ms so
guards in groups can actually deal damage.

## Enemy archetypes: config-driven

Single Enemy class takes an EnemyConfig (HP, speed, sight, fire rate,
damage, tint, scale, scoreValue, etc). Five configs ship today —
Security, Heavy, Sniper, Intern, CEO. Adding a sixth is a config
object and one line in spawnEnemyByKind.

## Levels: data-only, theme switch

Each level is a LevelData object — width, ground, platforms, low
obstacles, enemies, door spawners, theme, reward pickup. GameScene
switches on `level.theme` for the right walls / floor / decor. Adding
a new level is creating a `.ts` file + appending to `LEVELS[]`.

## Door spawners

Each spawner is a wooden office door rendered as decor. When the
player crosses the configured `triggerX`, the door slides aside (tween
scaleX → 0) and a guard fades in from the doorway. Used on every floor
to control combat pacing.

## Reward pickups

Each level can declare an optional `rewardPickup` that drops when
every door is triggered AND the last guard is dead. Gates skipping —
you can't end-run a floor without engaging the encounters. Pickups
also unlock weapons for subsequent floors (state persisted via
`unlockedWeapons` Set threaded through scene init data).

## CEO boss

Reuses the Enemy class with a CEO_BOSS config: 60 HP, 1.7x scale,
fast rapid-burst fire, high contact damage, 5000 score value.
Elevator on Penthouse floor is gated by `bossAlive()` — overlap
shows "DEFEAT THE CEO FIRST" banner instead of transitioning.
HUD shows a 400px boss bar at the top of the screen while the CEO
is alive.

## High score

Stored in localStorage. Saved on both game over AND on level clear
(so dying after a victory still preserves the run). Menu shows
current high score with the floor it was reached on. Game over
shows "★ NEW HIGH SCORE ★" when beaten.

## Crosshair

System cursor hidden via `input.setDefaultCursor("none")` inside
GameScene. Each non-Game scene re-sets it to "default" explicitly
so the menu / game over / level cleared screens keep the OS cursor.

## QoL key bindings

P or ESC pauses (with full controls overlay). M toggles mute. 1/2/3/4
swap weapons. Slide moved off SHIFT to S so Win+Shift+S (Windows
screen clip) still works for the user's playtest recordings.
