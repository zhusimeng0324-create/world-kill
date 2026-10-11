import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  reduceGame,
  deckCounts,
  canPlay,
  canTarget,
} from "../src/game.js";
const card = (type, id) => ({ type, id });
function fixture() {
  const g = createGame();
  g.players.forEach((p) => (p.hand = []));
  g.players[5].hand = [
    card("strike", 101),
    card("strike", 102),
    card("economy", 103),
    card("aid", 104),
    card("sanction", 105),
  ];
  return g;
}
test("initial deal and first turn", () => {
  const g = createGame();
  assert.equal(g.players[5].hand.length, 6);
  assert.equal(g.deck.length, 74);
  assert.ok(
    g.players.slice(0, 5).every((p) => p.hp === 4 && p.hand.length === 4),
  );
});
test("target validation, strike limit and immutable state", () => {
  const g = fixture();
  assert.equal(reduceGame(g, { type: "play", cardId: 101, target: "CN" }), g);
  const n = reduceGame(g, { type: "play", cardId: 101, target: "US" });
  assert.equal(n.players[0].hp, 3);
  assert.equal(g.players[0].hp, 4);
  assert.equal(reduceGame(n, { type: "play", cardId: 102, target: "RU" }), n);
});
test("defense, healing, economy and sanctions", () => {
  let g = fixture();
  g.players[0].hand = [card("defense", 201)];
  g = reduceGame(g, { type: "play", cardId: 101, target: "US" });
  assert.equal(g.players[0].hp, 4);
  assert.equal(g.players[0].hand.length, 0);
  assert.equal(reduceGame(g, { type: "play", cardId: 104 }), g);
  g.players[5].hp = 3;
  g = reduceGame(g, { type: "play", cardId: 104 });
  assert.equal(g.players[5].hp, 4);
  const count = g.players[5].hand.length;
  g = reduceGame(g, { type: "play", cardId: 103 });
  assert.equal(g.players[5].hand.length, count + 1);
  g.players[1].hand = [card("aid", 202)];
  g = reduceGame(g, { type: "play", cardId: 105, target: "RU" });
  assert.equal(g.players[1].hand.length, 0);
});
test("discard phase and AI turn progression", () => {
  let g = fixture();
  g = reduceGame(g, { type: "end" });
  assert.equal(g.phase, "discard");
  g = reduceGame(g, { type: "discard", cardId: 104 });
  assert.equal(g.turn, 0);
  assert.equal(g.phase, "ai");
  assert.equal(g.players[0].hand.length, 2);
});
test("human defense prompt, damage and automatic rescue", () => {
  let g = fixture();
  g.turn = 0;
  g.phase = "ai";
  g.players[0].hand = [card("strike", 200)];
  g.players[5].hand = [card("defense", 201)];
  g = reduceGame(g, { type: "ai" }, () => 0.99);
  assert.equal(g.phase, "respond");
  g = reduceGame(g, { type: "respond", defend: true });
  assert.equal(g.players[5].hp, 4);
  assert.equal(g.phase, "ai");
  g.phase = "respond";
  g.pending = {
    kind: "strike",
    type: "strike",
    source: 0,
    targets: [5],
    required: "defense",
  };
  g.players[5].hp = 1;
  g.players[5].hand = [card("aid", 202)];
  g = reduceGame(g, { type: "respond", defend: false });
  assert.equal(g.players[5].hp, 1);
  assert.equal(g.players[5].hand.length, 0);
  g.phase = "respond";
  g.pending = {
    kind: "strike",
    type: "strike",
    source: 0,
    targets: [5],
    required: "defense",
  };
  g = reduceGame(g, { type: "respond", defend: false });
  assert.equal(g.phase, "over");
});
test("victory and restart", () => {
  let g = fixture();
  g.players.slice(0, 5).forEach((p) => (p.hp = 0));
  g.players[0].hp = 1;
  g = reduceGame(g, { type: "play", cardId: 101, target: "US" });
  assert.equal(g.phase, "over");
  assert.match(g.result, /胜利/);
  g = reduceGame(g, { type: "restart" });
  assert.equal(g.phase, "play");
  assert.ok(g.players.every((p) => p.hp === 4));
});
test("deck recycling", () => {
  let g = fixture();
  g.deck = [];
  g.discard = [card("strike", 301), card("defense", 302)];
  g = reduceGame(g, { type: "play", cardId: 103 });
  assert.equal(g.players[5].hand.length, 6);
  assert.equal(g.deck.length, 1);
});
test("100 seeded complete games preserve card counts and finish", () => {
  for (let seed = 1; seed <= 100; seed++) {
    let value = seed;
    const rng = () => {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
    let g = createGame(rng);
    for (let step = 0; step < 5000 && g.phase !== "over"; step++) {
      let a;
      if (g.phase === "ai") a = { type: "ai" };
      else if (g.phase === "respond")
        a = {
          type: "respond",
          defend: g.players[5].hand.some((c) => c.type === g.pending.required),
        };
      else if (g.phase === "discard")
        a = { type: "discard", cardId: g.players[5].hand[0].id };
      else {
        const p = g.players[5];
        const targets = g.players.slice(0, 5).filter((p) => p.hp > 0);
        const c = p.hand.find((c) => canPlay(g, c));
        a = c
          ? {
              type: "play",
              cardId: c.id,
              target: targets.find((t) => canTarget(g, c.type, p, t))?.code,
            }
          : { type: "end" };
      }
      g = reduceGame(g, a, rng);
      assert.equal(
        g.deck.length +
          g.discard.length +
          g.players.reduce((n, p) => n + p.hand.length, 0),
        Object.values(deckCounts).reduce((a, b) => a + b, 0),
      );
      assert.ok(g.players.every((p) => p.hp >= 0 && p.hp <= 4));
    }
    assert.equal(g.phase, "over", `seed ${seed}`);
  }
});

test("intelligence transfers a card and rejects empty, self and eliminated targets", () => {
  let g = fixture();
  g.players[5].hand = [card("intelligence", 301)];
  assert.equal(canPlay(g, g.players[5].hand[0]), false);
  assert.equal(reduceGame(g, { type: "play", cardId: 301, target: "US" }), g);
  g.players[0].hand = [card("defense", 302)];
  assert.equal(canPlay(g, g.players[5].hand[0]), true);
  assert.equal(reduceGame(g, { type: "play", cardId: 301, target: "CN" }), g);
  g = reduceGame(g, { type: "play", cardId: 301, target: "US" });
  assert.deepEqual(g.players[5].hand, [card("defense", 302)]);
  assert.equal(g.players[0].hand.length, 0);
  assert.ok(g.discard.some((c) => c.id === 301));
  assert.ok(!g.discard.some((c) => c.id === 302));
});
test("area conflict excludes caster and eliminated nations, accepts strikes without consuming attack allowance", () => {
  let g = fixture();
  g.players[5].hand = [card("conflict", 301)];
  g.players[0].hand = [card("strike", 302)];
  g.players[1].hp = 0;
  g = reduceGame(g, { type: "play", cardId: 301 });
  assert.equal(g.players[5].hp, 4);
  assert.equal(g.players[0].hp, 4);
  assert.equal(g.players[0].hand.length, 0);
  assert.equal(g.players[1].hp, 0);
  assert.ok(g.players.slice(2, 5).every((p) => p.hp === 3));
  assert.equal(g.attacked, false);
  assert.equal(g.phase, "play");
  assert.equal(g.pending, null);
});
test("area crisis pauses at human, rejects wrong response, then resolves remaining targets exactly once", () => {
  let g = fixture();
  g.turn = 4;
  g.phase = "ai";
  g.players[4].hand = [card("crisis", 301)];
  g.players[5].hand = [card("strike", 302)];
  g.players[1].hand = [card("defense", 303)];
  g = reduceGame(g, { type: "ai" });
  assert.equal(g.phase, "respond");
  assert.equal(g.pending.required, "defense");
  assert.ok(g.players.every((p) => p.hp === 4));
  assert.equal(reduceGame(g, { type: "respond", defend: true }), g);
  g = reduceGame(g, { type: "respond", defend: false });
  assert.equal(g.players[5].hp, 3);
  assert.equal(g.players[1].hp, 4);
  assert.equal(g.players[1].hand.length, 0);
  assert.ok([0, 2, 3].every((i) => g.players[i].hp === 3));
  assert.equal(g.players[4].hp, 4);
  assert.equal(g.pending, null);
  assert.equal(g.phase, "ai");
  const unchanged = reduceGame(g, { type: "respond", defend: false });
  assert.equal(unchanged, g);
});
test("human may respond to conflict with strike even after its own attack has been used", () => {
  let g = fixture();
  g.turn = 0;
  g.phase = "ai";
  g.attacked = true;
  g.players[0].hand = [card("conflict", 301)];
  g.players[5].hand = [card("strike", 302)];
  g = reduceGame(g, { type: "ai" });
  assert.equal(g.pending.required, "strike");
  g = reduceGame(g, { type: "respond", defend: true });
  assert.equal(g.players[5].hp, 4);
  assert.equal(g.players[5].hand.length, 0);
  assert.equal(g.attacked, true);
  assert.equal(g.phase, "ai");
});
test("duel starts at target and alternates strikes until someone fails, without using attack allowance", () => {
  let g = fixture();
  g.players[5].hand = [card("duel", 301), card("strike", 302)];
  g.players[0].hand = [card("strike", 303)];
  g = reduceGame(g, { type: "play", cardId: 301, target: "US" });
  assert.equal(g.phase, "respond");
  assert.equal(g.pending.responder, 5);
  assert.equal(g.players[0].hand.length, 0);
  g = reduceGame(g, { type: "respond", defend: true });
  assert.equal(g.players[0].hp, 3);
  assert.equal(g.players[5].hp, 4);
  assert.equal(g.players[5].hand.length, 0);
  assert.equal(g.phase, "play");
  assert.equal(g.attacked, false);
});
test("AI duel starts with human response; refusing damages only human and resumes AI", () => {
  let g = fixture();
  g.turn = 0;
  g.phase = "ai";
  g.attacked = true;
  g.players[0].hand = [card("duel", 301)];
  g.players[5].hand = [card("strike", 302)];
  g = reduceGame(g, { type: "ai" }, () => 0.99);
  assert.equal(g.phase, "respond");
  assert.equal(g.pending.responder, 5);
  g = reduceGame(g, { type: "respond", defend: false });
  assert.equal(g.players[5].hp, 3);
  assert.equal(g.players[0].hp, 4);
  assert.equal(g.players[5].hand.length, 1);
  assert.equal(g.phase, "ai");
});
test("duel auto rescue ends the duel; death of AI caster skips to a living turn", () => {
  let g = fixture();
  g.turn = 0;
  g.phase = "ai";
  g.players[0].hp = 1;
  g.players[0].hand = [card("duel", 301), card("aid", 302)];
  g.players[5].hand = [card("strike", 303)];
  // Start a pending duel directly so the AI cannot heal before playing it.
  g.players[0].hand = [card("aid", 302)];
  g.pending = {
    kind: "duel",
    type: "duel",
    source: 0,
    target: 5,
    responder: 5,
    required: "strike",
  };
  g.phase = "respond";
  g = reduceGame(g, { type: "respond", defend: true });
  assert.equal(g.players[0].hp, 1);
  assert.equal(g.pending, null);
  assert.equal(g.phase, "ai");
  g.players[5].hand = [card("strike", 304)];
  g.pending = {
    kind: "duel",
    type: "duel",
    source: 0,
    target: 5,
    responder: 5,
    required: "strike",
  };
  g.phase = "respond";
  g = reduceGame(g, { type: "respond", defend: true });
  assert.equal(g.players[0].hp, 0);
  assert.equal(g.phase, "ai");
  g = reduceGame(g, { type: "ai" });
  assert.equal(g.turn, 1);
  assert.equal(g.players[1].hp, 4);
});
test("fatal area effect stops at human elimination without resolving later targets", () => {
  let g = fixture();
  g.turn = 4;
  g.phase = "ai";
  g.players[4].hand = [card("conflict", 301)];
  g.players[5].hp = 1;
  g.players[5].hand = [];
  g = reduceGame(g, { type: "ai" });
  g = reduceGame(g, { type: "respond", defend: false });
  assert.equal(g.phase, "over");
  assert.equal(g.pending, null);
  assert.ok(g.players.slice(0, 4).every((p) => p.hp === 4));
});
test("area effects can eliminate final opponents and declare human victory", () => {
  let g = fixture();
  g.players.slice(0, 5).forEach((p) => (p.hp = 1));
  g.players[5].hand = [card("crisis", 301)];
  g = reduceGame(g, { type: "play", cardId: 301 });
  assert.equal(g.phase, "over");
  assert.match(g.result, /胜利/);
  assert.equal(g.players[5].hp, 4);
});
