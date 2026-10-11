import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const countries = [
  { name: "United States", code: "US", flag: "🇺🇸", position: "northwest" },
  { name: "Russia", code: "RU", flag: "🇷🇺", position: "north" },
  { name: "European Union", code: "EU", flag: "🇪🇺", position: "northeast" },
  { name: "India", code: "IN", flag: "🇮🇳", position: "west" },
  { name: "Japan", code: "JP", flag: "🇯🇵", position: "east" },
  { name: "China", code: "CN", flag: "🇨🇳", position: "south", human: true },
];

function Player({ player }) {
  return (
    <article
      className={`player ${player.position} ${player.human ? "human" : ""}`}
      aria-label={`${player.name}, 4 HP, 4 cards${player.human ? ", human player" : ""}`}
    >
      <div className="player-heading">
        <span className="flag" aria-hidden="true">
          {player.flag}
        </span>
        <span className="country-code">{player.code}</span>
        <span className="seat-type">{player.human ? "YOU" : "PLAYER"}</span>
      </div>
      <h2>{player.name}</h2>
      <div className="player-stats">
        <span className="hp">
          <span aria-hidden="true">● ● ● ●</span> <b>4 HP</b>
        </span>
        <span>
          ▱ <b>4</b> cards
        </span>
      </div>
    </article>
  );
}

function App() {
  const [started, setStarted] = useState(false);
  return (
    <div className="app">
      <header>
        <a className="wordmark" href="./">
          WORLD<span>KILL</span>
          <i />
        </a>
        <div className="header-meta">
          <span className="status-dot" />
          PROTOTYPE <span className="version">V.01</span>
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
            <button className="start-button" onClick={() => setStarted(true)}>
              Start Game <span aria-hidden="true">↗</span>
            </button>
            <p className="prototype-note">
              FIRST PROTOTYPE <span>•</span> SIX-PLAYER TABLE
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
          <section className="arena" aria-label="Six-player game table">
            <div className="table-surface" aria-hidden="true">
              <div className="table-ring" />
              <div className="table-center">
                <span className="crosshair">＋</span>
                <strong>WORLD KILL</strong>
                <span>GEOPOLITICAL STRATEGY</span>
                <small>PROTOTYPE / TABLE PREVIEW</small>
              </div>
            </div>
            {countries.map((player) => (
              <Player key={player.code} player={player} />
            ))}
          </section>
          <section className="hand" aria-label="China's hand">
            <div className="hand-label">
              <div>
                <p className="eyebrow">YOUR HAND</p>
                <h2>
                  China <span>/ 4 CARDS</span>
                </h2>
              </div>
              <p>
                Placeholder cards <span>—</span> preview only
              </p>
            </div>
            <div className="cards">
              {[1, 2, 3, 4].map((number) => (
                <article
                  className="card"
                  key={number}
                  aria-label={`Placeholder card ${number}`}
                >
                  <div className="card-top">
                    <span>WORLD KILL</span>
                    <span>0{number}</span>
                  </div>
                  <div className="card-symbol" aria-hidden="true">
                    ◇<span>＋</span>
                  </div>
                  <div className="card-bottom">
                    <h3>Placeholder</h3>
                    <span>CARD 0{number}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>
      )}
      <footer>
        <span>WORLD KILL © {new Date().getFullYear()}</span>
        <span>
          {started
            ? "TABLE PREVIEW · NO GAMEPLAY YET"
            : "A GEOPOLITICAL CARD GAME"}
        </span>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
