// Curated historical snapshots, not a live news feed. Update facts and sources
// together; card types and quantities remain in game.js.
export const eventPack = {
  version: "01",
  label: "俄乌战争与国际影响",
  period: "2022—2023",
};

export const historicalEvents = [
  {
    id: "ukraine-2022",
    title: "俄乌战争全面爆发",
    date: "2022-02-24",
    types: ["strike", "conflict"],
    summary:
      "2022 年 2 月 24 日，俄罗斯对乌克兰发动全面入侵。联合国大会于 3 月 2 日通过 ES-11/1 号决议，要求俄罗斯撤军。",
    source: {
      name: "联合国大会 · ES-11/1 号决议（2022-03-02）",
      url: "https://docs.un.org/en/A/RES/ES-11/1",
    },
  },
  {
    id: "eu-sanctions-2023",
    title: "欧盟第十轮对俄制裁",
    date: "2023-02-25",
    types: ["sanction"],
    summary:
      "2023 年 2 月 25 日，欧盟通过第十轮对俄制裁，扩大出口限制及针对个人和实体的限制措施。",
    source: {
      name: "欧盟理事会 · 对俄制裁资料",
      url: "https://www.consilium.europa.eu/en/policies/sanctions-against-russia/",
    },
  },
  {
    id: "black-sea-grain-2022",
    title: "黑海粮食倡议签署",
    date: "2022-07-22",
    types: ["aid"],
    summary:
      "2022 年 7 月 22 日，在联合国和土耳其斡旋下，黑海粮食倡议签署，为乌克兰经黑海出口粮食提供安排。本卡记录签署时的事件。",
    source: {
      name: "联合国 · 黑海粮食倡议资料",
      url: "https://www.un.org/en/black-sea-grain-initiative",
    },
  },
];

export function getCardEvent(card) {
  return (
    historicalEvents.find((event) => event.types.includes(card.type)) || null
  );
}
