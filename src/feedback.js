import { cards } from "./game.js";

export function getFeedback(previous, current) {
  if (
    !previous ||
    !current ||
    (current.round === 1 && current.discard.length === 0)
  )
    return null;
  // Logs are newest first and capped; find the retained prefix of the previous log.
  const boundary = current.log.findIndex((_, index) =>
    current.log
      .slice(index)
      .every((entry, offset) => entry === previous.log[offset]),
  );
  const entries = boundary < 0 ? current.log : current.log.slice(0, boundary);
  const players = {};
  current.players.forEach((player, index) => {
    const before = previous.players[index];
    const mentions = entries.filter((entry) => entry.startsWith(player.name));
    if (before.hp > 0 && player.hp === 0)
      players[player.code] = { tone: "damage", label: "出局" };
    else if (mentions.some((entry) => entry.includes("自救")))
      players[player.code] = { tone: "heal", label: "自救 +1 HP" };
    else if (player.hp < before.hp)
      players[player.code] = {
        tone: "damage",
        label: `${player.hp - before.hp} HP`,
      };
    else if (player.hp > before.hp)
      players[player.code] = {
        tone: "heal",
        label: `+${player.hp - before.hp} HP`,
      };
    else if (mentions.some((entry) => entry.includes("响应")))
      players[player.code] = { tone: "block", label: "成功响应" };
    else if (player.hand.length > before.hand.length)
      players[player.code] = {
        tone: "draw",
        label: `+${player.hand.length - before.hand.length} 张牌`,
      };
  });
  const played = entries.find((entry) =>
    current.players.some((player) => entry.startsWith(`${player.name} 使用`)),
  );
  let card = null;
  if (played) {
    const source = current.players.find((player) =>
      played.startsWith(`${player.name} 使用`),
    );
    const match = Object.entries(cards).find(([, info]) =>
      played.includes(`使用${info.name}`),
    );
    if (match) {
      const [type, info] = match;
      const target = current.players.find((player) =>
        played.includes(` → ${player.name}`),
      );
      card = {
        ...info,
        type,
        source: source.name,
        target: target?.name,
        tone: ["strike", "conflict", "crisis", "duel"].includes(type)
          ? "damage"
          : type === "aid"
            ? "heal"
            : "event",
      };
    }
  }
  const response = entries.find((entry) => entry.startsWith("中国打出"));
  if (!card && response) {
    const info = Object.values(cards).find((info) =>
      response.includes(`打出${info.name}`),
    );
    if (info) card = { ...info, source: "China", tone: "block" };
    players.CN ||= { tone: "block", label: "成功响应" };
  }
  return { players, card, turnChanged: previous.round !== current.round };
}
