export const nations = [
  { name: "United States", code: "US", flag: "🇺🇸", position: "northwest" },
  { name: "Russia", code: "RU", flag: "🇷🇺", position: "north" },
  { name: "European Union", code: "EU", flag: "🇪🇺", position: "northeast" },
  { name: "India", code: "IN", flag: "🇮🇳", position: "west" },
  { name: "Japan", code: "JP", flag: "🇯🇵", position: "east" },
  { name: "China", code: "CN", flag: "🇨🇳", position: "south", human: true },
];
export const cards = {
  strike: {
    name: "军事打击",
    symbol: "×",
    description: "对一名对手造成 1 点伤害；每回合限一次。",
    target: true,
  },
  defense: {
    name: "防御拦截",
    symbol: "◈",
    description: "响应军事打击或全球危机，抵消伤害。",
  },
  aid: {
    name: "人道援助",
    symbol: "+",
    description: "恢复 1 HP；濒危时自动使用自救。",
  },
  economy: { name: "经济刺激", symbol: "$", description: "立即摸两张牌。" },
  sanction: {
    name: "经济制裁",
    symbol: "⊖",
    description: "随机弃掉一名对手的一张手牌。",
    target: true,
  },
  intelligence: {
    name: "情报行动",
    symbol: "?",
    target: true,
    original: "顺手牵羊",
    description: "随机获得一名对手的一张手牌；不限制距离。",
  },
  conflict: {
    name: "区域冲突",
    symbol: "!",
    original: "南蛮入侵",
    description: "其他存活国家依次打出军事打击，否则失去 1 HP。",
  },
  crisis: {
    name: "全球危机",
    symbol: "◎",
    original: "万箭齐发",
    description: "其他存活国家依次打出防御拦截，否则失去 1 HP。",
  },
  duel: {
    name: "战略对抗",
    symbol: "≠",
    target: true,
    original: "决斗",
    description: "目标先出军事打击，双方交替响应，先不出者失去 1 HP。",
  },
};
export const deckCounts = {
  strike: 24,
  defense: 18,
  aid: 12,
  economy: 8,
  sanction: 10,
  intelligence: 8,
  conflict: 6,
  crisis: 6,
  duel: 8,
};
const order = [5, 0, 1, 2, 3, 4];
function shuffle(list, rng) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
function log(g, text) {
  g.log = [text, ...g.log].slice(0, 40);
}
function draw(g, player, count, rng) {
  for (let i = 0; i < count; i++) {
    if (!g.deck.length) g.deck = shuffle(g.discard.splice(0), rng);
    if (!g.deck.length) break;
    player.hand.push(g.deck.pop());
  }
}
function remove(g, p, id) {
  const i = p.hand.findIndex((c) => c.id === id);
  if (i < 0) return null;
  const [card] = p.hand.splice(i, 1);
  g.discard.push(card);
  return card;
}
function finish(g) {
  const alive = g.players.filter((p) => p.hp > 0);
  if (alive.length === 1 || g.players[5].hp <= 0) {
    g.phase = "over";
    g.pending = null;
    g.result =
      alive.length === 1 && alive[0].human
        ? "胜利！中国成为最后的存活者。"
        : "中国已出局，本局结束。再来一局挑战最后存活者！";
    log(g, g.result);
  }
}
function damage(g, target) {
  target.hp--;
  log(g, `${target.name} 失去 1 HP。`);
  if (target.hp <= 0) {
    const aid = target.hand.find((c) => c.type === "aid");
    if (aid) {
      remove(g, target, aid.id);
      target.hp = 1;
      log(g, `${target.name} 自动使用人道援助自救。`);
    } else {
      g.discard.push(...target.hand.splice(0));
      log(g, `${target.name} 已出局。`);
    }
  }
  finish(g);
}
function nextTurn(g, rng) {
  if (g.phase === "over") return;
  let i = order.indexOf(g.turn);
  do {
    i = (i + 1) % order.length;
  } while (g.players[order[i]].hp <= 0);
  g.turn = order[i];
  g.round++;
  g.attacked = false;
  g.phase = g.turn === 5 ? "play" : "ai";
  draw(g, g.players[g.turn], 2, rng);
  log(g, `${g.players[g.turn].name} 的回合：摸两张牌。`);
}
export function createGame(rng = Math.random) {
  let id = 0;
  const deck = shuffle(
    Object.entries(deckCounts).flatMap(([type, count]) =>
      Array.from({ length: count }, () => ({ id: ++id, type })),
    ),
    rng,
  );
  const g = {
    players: nations.map((p) => ({ ...p, hp: 4, hand: [] })),
    deck,
    discard: [],
    turn: 5,
    round: 1,
    phase: "play",
    attacked: false,
    pending: null,
    log: [],
    result: null,
  };
  g.players.forEach((p) => draw(g, p, 4, rng));
  draw(g, g.players[5], 2, rng);
  log(g, "中国先手：每国初始 4 张牌，回合开始摸两张。");
  return g;
}
export function canTarget(g, type, actor, target) {
  return Boolean(
    target &&
    target !== actor &&
    target.hp > 0 &&
    (!["sanction", "intelligence"].includes(type) || target.hand.length > 0),
  );
}
export function canPlay(g, card) {
  return (
    g.phase === "play" &&
    g.turn === 5 &&
    (card.type === "strike"
      ? !g.attacked
      : card.type === "aid"
        ? g.players[5].hp < 4
        : card.type !== "defense") &&
    (!cards[card.type].target ||
      g.players.some((p) => canTarget(g, card.type, g.players[5], p)))
  );
}
function advanceResponse(g, answered) {
  const effect = g.pending;
  if (effect.kind === "duel") {
    if (answered)
      effect.responder =
        effect.responder === effect.source ? effect.target : effect.source;
    else g.pending = null;
  } else {
    effect.targets.shift();
    if (!effect.targets.length) g.pending = null;
  }
}
// Resolve AI responses until the human needs to choose, or the effect is done.
function resolveEffect(g) {
  while (g.pending && g.phase !== "over") {
    const effect = g.pending;
    const index = effect.kind === "duel" ? effect.responder : effect.targets[0];
    const responder = g.players[index];
    if (responder.hp <= 0) {
      advanceResponse(g, false);
      continue;
    }
    if (responder.human) {
      g.phase = "respond";
      return;
    }
    const response = responder.hand.find((c) => c.type === effect.required);
    if (response) {
      remove(g, responder, response.id);
      log(
        g,
        `${responder.name} 打出${cards[effect.required].name}响应${cards[effect.type].name}。`,
      );
    } else damage(g, responder);
    if (g.phase === "over") return;
    advanceResponse(g, Boolean(response));
  }
  if (g.phase !== "over") g.phase = g.turn === 5 ? "play" : "ai";
}
function play(g, actor, card, target, rng) {
  remove(g, actor, card.id);
  log(
    g,
    `${actor.name} 使用${cards[card.type].name}${target ? ` → ${target.name}` : ""}。`,
  );
  if (card.type === "aid") actor.hp = Math.min(4, actor.hp + 1);
  if (card.type === "economy") draw(g, actor, 2, rng);
  if (card.type === "sanction" || card.type === "intelligence") {
    const i = Math.floor(rng() * target.hand.length);
    const [taken] = target.hand.splice(i, 1);
    if (card.type === "intelligence") actor.hand.push(taken);
    else g.discard.push(taken);
  }
  const source = g.turn;
  if (card.type === "strike" || card.type === "duel") {
    const targetIndex = g.players.indexOf(target);
    if (card.type === "strike") g.attacked = true;
    g.pending =
      card.type === "duel"
        ? {
            kind: "duel",
            type: card.type,
            source,
            target: targetIndex,
            responder: targetIndex,
            required: "strike",
          }
        : {
            kind: "strike",
            type: card.type,
            source,
            targets: [targetIndex],
            required: "defense",
          };
    resolveEffect(g);
  }
  if (card.type === "conflict" || card.type === "crisis") {
    const start = order.indexOf(source);
    const targets = Array.from(
      { length: order.length - 1 },
      (_, i) => order[(start + i + 1) % order.length],
    ).filter((i) => g.players[i].hp > 0);
    g.pending = {
      kind: "area",
      type: card.type,
      source,
      targets,
      required: card.type === "conflict" ? "strike" : "defense",
    };
    resolveEffect(g);
  }
}
export function reduceGame(state, action, rng = Math.random) {
  if (action.type === "restart") return createGame(rng);
  if (!state || state.phase === "over") return state;
  const g = structuredClone(state),
    actor = g.players[g.turn];
  if (action.type === "play" && g.turn === 5 && g.phase === "play") {
    const card = actor.hand.find((c) => c.id === action.cardId);
    if (!card || !canPlay(g, card)) return state;
    const target = g.players.find((p) => p.code === action.target);
    if (cards[card.type].target && !canTarget(g, card.type, actor, target))
      return state;
    play(g, actor, card, cards[card.type].target ? target : null, rng);
  } else if (action.type === "end" && g.turn === 5 && g.phase === "play") {
    if (actor.hand.length > actor.hp) {
      g.phase = "discard";
      log(g, `弃牌阶段：请弃 ${actor.hand.length - actor.hp} 张牌。`);
    } else nextTurn(g, rng);
  } else if (action.type === "discard" && g.phase === "discard") {
    if (!remove(g, actor, action.cardId)) return state;
    if (actor.hand.length <= actor.hp) nextTurn(g, rng);
  } else if (action.type === "respond" && g.phase === "respond") {
    const human = g.players[5];
    const required = g.pending.required;
    if (action.defend) {
      const response = human.hand.find((c) => c.type === required);
      if (!response) return state;
      remove(g, human, response.id);
      log(
        g,
        `中国打出${cards[required].name}响应${cards[g.pending.type].name}。`,
      );
    } else damage(g, human);
    if (g.phase !== "over") {
      advanceResponse(g, Boolean(action.defend));
      resolveEffect(g);
    }
  } else if (action.type === "ai" && g.phase === "ai") {
    const targets = g.players.filter((p) => p !== actor && p.hp > 0);
    let card = actor.hp < 4 && actor.hand.find((c) => c.type === "aid");
    card ||= actor.hand.find((c) => c.type === "economy");
    card ||= !g.attacked && actor.hand.find((c) => c.type === "strike");
    card ||= actor.hand.find((c) =>
      ["conflict", "crisis", "duel"].includes(c.type),
    );
    card ||=
      targets.some((p) => p.hand.length) &&
      actor.hand.find((c) => ["sanction", "intelligence"].includes(c.type));
    if (card) {
      const valid = targets.filter((p) => canTarget(g, card.type, actor, p));
      const target = valid[Math.floor(rng() * valid.length)];
      play(g, actor, card, cards[card.type].target ? target : null, rng);
    } else {
      while (actor.hand.length > actor.hp) {
        const card =
          actor.hand.find((c) => c.type === "strike") || actor.hand[0];
        remove(g, actor, card.id);
      }
      nextTurn(g, rng);
    }
  } else return state;
  return g;
}
