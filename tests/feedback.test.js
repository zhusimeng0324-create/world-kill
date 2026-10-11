import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame, reduceGame } from "../src/game.js";
import { getFeedback } from "../src/feedback.js";

function initial() {
  const g = createGame();
  g.players.forEach((p) => (p.hand = []));
  return g;
}
test("attack feedback names source and target and leaves game untouched", () => {
  const before = initial();
  before.players[5].hand = [{ id: 1001, type: "strike" }];
  const after = reduceGame(before, {
    type: "play",
    cardId: 1001,
    target: "US",
  });
  const original = structuredClone(after);
  const feedback = getFeedback(before, after);
  assert.equal(feedback.players.US.tone, "damage");
  assert.equal(feedback.players.US.label, "-1 HP");
  assert.equal(feedback.card.source, "China");
  assert.equal(feedback.card.target, "United States");
  assert.equal(feedback.card.name, "军事打击");
  assert.deepEqual(after, original);
});
test("self-rescue with unchanged final HP still gives heal feedback", () => {
  const before = initial();
  before.players[5].hand = [{ id: 1001, type: "strike" }];
  before.players[0].hp = 1;
  before.players[0].hand = [{ id: 1002, type: "aid" }];
  const after = reduceGame(before, {
    type: "play",
    cardId: 1001,
    target: "US",
  });
  assert.equal(after.players[0].hp, before.players[0].hp);
  assert.deepEqual(getFeedback(before, after).players.US, {
    tone: "heal",
    label: "自救 +1 HP",
  });
});
test("human responses show block instead of replaying the AI attack", () => {
  let before = initial();
  before.turn = 0;
  before.phase = "ai";
  before.players[0].hand = [{ id: 1001, type: "strike" }];
  before.players[5].hand = [{ id: 1002, type: "defense" }];
  before = reduceGame(before, { type: "ai" }, () => 0.99);
  const after = reduceGame(before, { type: "respond", defend: true });
  const feedback = getFeedback(before, after);
  assert.equal(feedback.card.name, "防御拦截");
  assert.equal(feedback.card.tone, "block");
  assert.equal(feedback.players.CN.label, "成功响应");
});
test("turn feedback and draw counts survive capped logs; restart clears effects", () => {
  const before = initial();
  before.log = Array.from({ length: 40 }, (_, i) => `Earlier event ${i}`);
  const after = reduceGame(before, { type: "end" });
  const feedback = getFeedback(before, after);
  assert.equal(feedback.turnChanged, true);
  assert.equal(feedback.card, null);
  assert.equal(feedback.players.US.label, "+2 张牌");
  assert.equal(after.log.length, 40);
  assert.equal(
    getFeedback(after, reduceGame(after, { type: "restart" })),
    null,
  );
});
