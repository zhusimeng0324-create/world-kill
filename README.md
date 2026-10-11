# WORLD KILL

A React + Vite prototype for a geopolitical strategy card game.

## Development

Requires Node.js 20.19+ or 22.12+ (Node 24 is supported).

```sh
npm ci
npm run dev -- --host 0.0.0.0
```

## Production build

```sh
npm run build
npm run preview -- --host 0.0.0.0
```

The landing page opens a six-player table with China as the human player at the bottom, four HP and four cards per player, and four placeholder cards in China's hand. This prototype has no gameplay, AI, combat, skills, or networking.
