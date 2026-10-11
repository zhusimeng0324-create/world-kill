# WORLD KILL

A local, single-player geopolitical strategy card game built with React + Vite.
China is the human player; five other nations use simple AI.

## Development

Requires Node.js 20.19+ or 22.12+ (Node 24 is supported).

```sh
npm ci
npm run dev -- --host 0.0.0.0
```

Open the server's `/world-kill/` path. No API keys or backend are required.

## Rules

- Each nation starts with 4 HP and four cards. China goes first.
- Draw two cards at the start of each turn. China's first turn starts with six cards.
- 军事打击: deal one damage to an opponent, once per turn.
- 防御拦截: respond to an attack to cancel its damage.
- 人道援助: recover one HP, up to four; automatically consumed to rescue its holder at zero HP.
- 经济刺激: draw two cards.
- 经济制裁: discard one random card from an opponent's hand.
- Click a playable card, then choose a country if it requires a target.
- End your turn and choose cards to discard until your hand size is at most your HP.
- At zero HP without aid, a nation is eliminated. Eliminated nations lose their hands and skip turns.
- The last survivor wins. If China is eliminated, the game ends with a loss and can be restarted.
- The 72-card deck reshuffles discarded cards when exhausted. AI picks random legal targets.
- No distance, equipment, hidden roles, country abilities, or networking in this version.

## Validation and production build

```sh
npm test
npm run build
npm run preview -- --host 0.0.0.0
```

Engine tests cover card effects, responses, discarding, elimination, deck recycling,
restart, and 100 reproducible complete games with card conservation checks.

## GitHub Pages

The site deploys through `.github/workflows/deploy-pages.yml` on pushes to `main`
and can also be deployed manually from the Actions tab. Vite uses `/world-kill/`
as its base path so built assets load at the repository's Pages URL.

In the repository's **Settings → Pages → Build and deployment**, choose
**GitHub Actions** as the source. After enabling it, rerun the deployment workflow
if its initial run failed. The published URL is:
https://zhusimeng0324-create.github.io/world-kill/
