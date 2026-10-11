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

## GitHub Pages

The site deploys through `.github/workflows/deploy-pages.yml` on pushes to `main`
and can also be deployed manually from the Actions tab. Vite uses `/world-kill/`
as its base path so built assets load at the repository's Pages URL.

In the repository's **Settings → Pages → Build and deployment**, choose
**GitHub Actions** as the source. After enabling it, rerun the deployment workflow
if its initial run failed. The published URL is:
https://zhusimeng0324-create.github.io/world-kill/
