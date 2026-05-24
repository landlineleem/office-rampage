# Office Rampage

Top-down twin-stick arena horde shooter — a disgruntled office worker fights
waves of corporate enemies (Interns → CEO) using office supplies as weapons,
fueled by a caffeine-powered slow-motion meter.

Built with **Phaser 4 + TypeScript + Vite**.

See [`docs/plans/2026-05-23-office-rampage-design.md`](docs/plans/2026-05-23-office-rampage-design.md)
for the full design.

## Controls

- **WASD** — move
- **Mouse** — aim
- **Left click** — fire stapler
- **Space** — slow-motion (drains caffeine; refills on kill)

## Develop

```bash
npm install
npm run dev      # http://localhost:5173/office-rampage/
npm run build    # production build → dist/
npm run preview  # preview the built output
```

> Vite is configured with `base: "/office-rampage/"` for GitHub Pages.
> To preview locally without the prefix, run `VITE_BASE=/ npm run preview`.

## Status

**v0.1** — first playable build: move, aim, stapler, intern enemies, slow-mo,
combo counter, game over screen. Placeholder geometric art.

Future: more weapons, more enemies (HR Rep, IT Guy, Sentient Printer, Middle
Manager mini-boss, CEO final boss), arena cover layout, real art, second mode
(Pizza Kid vs. Raccoon Mafia).
