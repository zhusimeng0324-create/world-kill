import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

import { cards, createGame, reduceGame, canPlay, canTarget } from "./game.js";

import { getFeedback } from "./feedback.js";

function Player({ player, active, targetable, onTarget, feedback, effectId }) {
  return (
    <article
      className={`player ${player.position} ${player.human ? "human" : ""} ${active ? "active-player" : ""} ${player.hp <= 0 ? "eliminated" : ""} ${targetable ? "targetable-player" : ""}`}
      aria-label={`${player.name}, ${player.hp} HP, ${player.hand.length} cards`}
    >
      {feedback && (
        <div
          key={effectId}
          className={`player-feedback feedback-${feedback.tone}`}
          aria-hidden="true"
        >
          <span className="feedback-number">{feedback.label}</span>
        </div>
      )}
      <div className="player-heading">
        <span className="flag" aria-hidden="true">
          {player.flag}
        </span>
        <span className="country-code">{player.code}</span>
        <span className="seat-type">
          {player.hp <= 0 ? "OUT" : player.human ? "YOU" : "AI"}
        </span>
      </div>
      <h2>{player.name}</h2>
      <div className="player-stats">
        <span className="hp">
          <span aria-hidden="true">{"● ".repeat(player.hp)}</span>
          <b>{player.hp} HP</b>
        </span>
        <span>
          ▱ <b>{player.hand.length}</b> cards
        </span>
      </div>
      {targetable && (
        <button className="target-button" onClick={onTarget}>
          选择 {player.name}
        </button>
      )}
    </article>
  );
}

function App() {
  const [game, setGame] = useState(null);
  const [selected, setSelected] = useState(null);
  const [effects, setEffects] = useState(null);
  const previousGame = useRef(null);
  const effectSequence = useRef(0);
  useEffect(() => {
    const feedback = getFeedback(previousGame.current, game);
    previousGame.current = game;
    if (!feedback) {
      setEffects(null);
      return;
    }
    const id = ++effectSequence.current;
    setEffects({ ...feedback, id });
    const timer = setTimeout(() => setEffects(null), 1700);
    return () => clearTimeout(timer);
  }, [game]);
  const started = Boolean(game);
  const send = (action) => {
    setGame((g) => reduceGame(g, action));
    setSelected(null);
  };
  useEffect(() => {
    if (game?.phase !== "ai") return;
    const timer = setTimeout(
      () => setGame((g) => reduceGame(g, { type: "ai" })),
      650,
    );
    return () => clearTimeout(timer);
  }, [game]);
  const selectedCard = game?.players[5].hand.find((c) => c.id === selected);
  function chooseCard(card) {
    if (game.phase === "discard")
      return send({ type: "discard", cardId: card.id });
    if (!canPlay(game, card)) return;
    if (cards[card.type].target)
      setSelected(selected === card.id ? null : card.id);
    else send({ type: "play", cardId: card.id });
  }
  return (
    <div className="app">
      <header>
        <a className="wordmark" href="./">
          WORLD<span>KILL</span>
          <i />
        </a>
        <div className="header-meta">
          <span className="status-dot" />
          PROTOTYPE <span className="version">V.04</span>
        </div>
      </header>
      {!started ? (
        <main className="landing">
          <div className="orbital-art" aria-hidden="true">
            <div className="globe">
              <div className="meridian" />
              <div className="equator" />
            </div>
            <span className="orbit-label">GLOBAL STRATEGY / 06 NATIONS</span>
          </div>
          <section className="intro">
            <p className="eyebrow">THE WORLD IS AT THE TABLE</p>
            <h1>
              WORLD
              <br />
              <span>KILL</span>
              <sup>®</sup>
            </h1>
            <p className="description">
              Six nations. One table.
              <br />A new arena for geopolitical strategy.
            </p>
            <button
              className="start-button"
              onClick={() => setGame(createGame())}
            >
              Start Game <span aria-hidden="true">↗</span>
            </button>
            <p className="prototype-note">
              PLAYABLE PROTOTYPE <span>•</span> SIX-PLAYER TABLE
            </p>
          </section>
          <div className="landing-footer">
            <span>01 / THE GLOBAL ARENA</span>
            <span>POWER. INFLUENCE. SURVIVAL.</span>
          </div>
        </main>
      ) : (
        <main className="game">
          <div className="game-title">
            <div>
              <p className="eyebrow">THE GLOBAL ARENA</p>
              <h1>Six nations. One table.</h1>
            </div>
            <span className="table-badge">
              TABLE 01 <span> / </span> 6 PLAYERS
            </span>
          </div>
          <section
            className={`arena ${game.phase === "over" ? "finished-arena" : ""}`}
            aria-label="Six-player game table"
          >
            <div className="table-surface" aria-hidden="true">
              <div className="table-ring" />
              <div className="table-center">
                <span className="crosshair">＋</span>
                <strong>WORLD KILL</strong>
                <span>GEOPOLITICAL STRATEGY</span>
                <small key={game.round} className="turn-marker">
                  TURN {game.round} / {game.players[game.turn].code}
                </small>
              </div>
            </div>
            {effects?.card && (
              <div
                key={effects.id}
                className={`event-display event-${effects.card.tone}`}
                aria-hidden="true"
              >
                <span className="event-source">
                  {effects.card.source}
                  {effects.card.target ? ` → ${effects.card.target}` : ""}
                </span>
                <span className="event-symbol">{effects.card.symbol}</span>
                <strong>{effects.card.name}</strong>
              </div>
            )}
            {game.phase === "over" && (
              <div
                className={`result-display ${game.players[5].hp > 0 ? "result-victory" : "result-defeat"}`}
              >
                <span>{game.players[5].hp > 0 ? "VICTORY" : "GAME OVER"}</span>
                <strong>
                  {game.players[5].hp > 0 ? "最后的存活者" : "中国已出局"}
                </strong>
                <small>在下方点击「再来一局」</small>
              </div>
            )}
            {game.players.map((player, index) => (
              <Player
                key={player.code}
                player={player}
                feedback={effects?.players[player.code]}
                effectId={effects?.id}
                active={game.turn === index && game.phase !== "over"}
                targetable={Boolean(
                  selectedCard &&
                  game.phase === "play" &&
                  canTarget(game, selectedCard.type, game.players[5], player),
                )}
                onTarget={() =>
                  send({
                    type: "play",
                    cardId: selectedCard.id,
                    target: player.code,
                  })
                }
              />
            ))}
          </section>
          <section
            className={`turn-controls ${game.phase === "respond" ? "response-controls" : ""}`}
            aria-label="回合操作"
          >
            <div aria-live="polite">
              <strong
                key={`${game.round}-${game.phase}`}
                className="turn-message"
              >
                {game.phase === "over"
                  ? game.result
                  : game.phase === "respond"
                    ? `${game.players[game.pending.source].name} 的${cards[game.pending.type].name}：请打出${cards[game.pending.required].name}，或承受 1 点伤害。`
                    : game.phase === "discard"
                      ? `请选择弃掉 ${game.players[5].hand.length - game.players[5].hp} 张牌`
                      : game.phase === "ai"
                        ? `${game.players[game.turn].name} 正在行动…`
                        : selectedCard
                          ? "点击目标国家使用 " + cards[selectedCard.type].name
                          : "你的回合：点击手牌出牌"}
              </strong>
            </div>
            <div className="control-buttons">
              {game.phase === "play" && (
                <button onClick={() => send({ type: "end" })}>结束回合</button>
              )}
              {selectedCard && (
                <button onClick={() => setSelected(null)}>取消选择</button>
              )}
              {game.phase === "respond" && (
                <>
                  <button
                    disabled={
                      !game.players[5].hand.some(
                        (c) => c.type === game.pending.required,
                      )
                    }
                    onClick={() => send({ type: "respond", defend: true })}
                  >
                    打出{cards[game.pending.required].name}
                  </button>
                  <button
                    onClick={() => send({ type: "respond", defend: false })}
                  >
                    承受 1 点伤害
                  </button>
                </>
              )}
              {game.phase === "over" && (
                <button onClick={() => send({ type: "restart" })}>
                  再来一局
                </button>
              )}
            </div>
          </section>
          <section className="hand" aria-label="China's hand">
            <div className="hand-label">
              <div>
                <p className="eyebrow">YOUR HAND</p>
                <h2>
                  China <span>/ {game.players[5].hand.length} CARDS</span>
                </h2>
              </div>
              <p>
                {game.attacked && game.turn === 5
                  ? "本回合已使用军事打击"
                  : "每回合一次军事打击"}
              </p>
            </div>
            <div className="cards">
              {game.players[5].hand.map((card, index) => (
                <button
                  key={card.id}
                  style={{ "--deal-delay": `${Math.min(index, 7) * 45}ms` }}
                  className={`card playable-card ${selected === card.id ? "selected-card" : ""}`}
                  disabled={game.phase !== "discard" && !canPlay(game, card)}
                  onClick={() => chooseCard(card)}
                  aria-label={`${game.phase === "discard" ? "弃掉" : "使用"}${cards[card.type].name} ${card.id}`}
                  aria-pressed={selected === card.id}
                >
                  <div className="card-top">
                    <span>
                      {["strike", "defense", "aid"].includes(card.type)
                        ? "基本牌"
                        : "锦囊牌"}
                    </span>
                    <span>{card.id}</span>
                  </div>
                  <div className="card-symbol" aria-hidden="true">
                    {cards[card.type].symbol}
                  </div>
                  <div className="card-bottom">
                    <h3>{cards[card.type].name}</h3>
                    <span className="card-description">
                      {cards[card.type].description}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            {!game.players[5].hand.length && (
              <p className="empty-hand">暂无手牌</p>
            )}
          </section>
          <details className="rules">
            <summary>玩法说明</summary>
            <p>
              中国先手，每国 4 HP、初始 4 张牌。回合开始摸 2
              张，可使用多张事件牌，但军事打击限一次。结束回合须弃牌至手牌数不超过
              HP。响应锦囊时打出的军事打击不占用每回合的攻击次数。人道援助在 0
              HP
              时自动自救，否则立即出局。最后存活者获胜；中国出局后本局结束。没有距离、装备、身份或国家技能。其他五国为本地简单
              AI，随机选择合法目标。牌堆耗尽后洗回弃牌。
            </p>
          </details>
          <details className="rules card-guide">
            <summary>锦囊牌图鉴（6 种）</summary>
            <dl>
              {Object.entries(cards)
                .filter(
                  ([type]) => !["strike", "defense", "aid"].includes(type),
                )
                .map(([type, info]) => (
                  <div key={type}>
                    <dt>
                      {info.name}{" "}
                      <span>
                        {" "}
                        /{" "}
                        {info.original ||
                          (type === "economy" ? "无中生有" : "过河拆桥")}
                      </span>
                    </dt>
                    <dd>{info.description}</dd>
                  </div>
                ))}
            </dl>
          </details>
          <section className="game-log" aria-label="战局记录">
            <h2>战局记录</h2>
            <ol>
              {game.log.map((entry, i) => (
                <li key={`${game.round}-${i}-${entry}`}>{entry}</li>
              ))}
            </ol>
          </section>
        </main>
      )}
      <footer>
        <span>WORLD KILL © {new Date().getFullYear()}</span>
        <span>
          {started
            ? "LOCAL GAME · FIVE AI OPPONENTS"
            : "A GEOPOLITICAL CARD GAME"}
        </span>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
