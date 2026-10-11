import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame, reduceGame } from "../src/game.js";
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
  assert.equal(g.deck.length, 46);
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
  g.pending = { attacker: "US" };
  g.players[5].hp = 1;
  g.players[5].hand = [card("aid", 202)];
  g = reduceGame(g, { type: "respond", defend: false });
  assert.equal(g.players[5].hp, 1);
  assert.equal(g.players[5].hand.length, 0);
  g.phase = "respond";
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
          defend: g.players[5].hand.some((c) => c.type === "defense"),
        };
      else if (g.phase === "discard")
        a = { type: "discard", cardId: g.players[5].hand[0].id };
      else {
        const p = g.players[5];
        const targets = g.players.slice(0, 5).filter((p) => p.hp > 0);
        const c =
          p.hand.find((c) => c.type === "aid" && p.hp < 4) ||
          p.hand.find((c) => c.type === "economy") ||
          p.hand.find((c) => c.type === "strike" && !g.attacked) ||
          p.hand.find(
            (c) => c.type === "sanction" && targets.some((t) => t.hand.length),
          );
        a = c
          ? {
              type: "play",
              cardId: c.id,
              target: targets.find(
                (t) => c.type !== "sanction" || t.hand.length,
              )?.code,
            }
          : { type: "end" };
      }
      g = reduceGame(g, a, rng);
      assert.equal(
        g.deck.length +
          g.discard.length +
          g.players.reduce((n, p) => n + p.hand.length, 0),
        72,
      );
      assert.ok(g.players.every((p) => p.hp >= 0 && p.hp <= 4));
    }
    assert.equal(g.phase, "over", `seed ${seed}`);
  }
});
