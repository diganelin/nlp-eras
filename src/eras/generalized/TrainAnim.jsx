import { useEffect, useRef, useState } from "react";

// Stage 2 — "Train on Everything". Simulated training animation.
// Sources feed a "Model" box containing a single vector grid. Attention
// cells light up green within the grid; a pool of interesting predicted
// words pops out. Four counters race continuously to plausible GPT-3-era
// targets. The model sits on a datacenter of server racks with LEDs.

const TOTAL_MS = 18000;

// GPT-3-era training targets (grounded where possible):
// - Tokens: ~300B (published, Brown et al 2020). ~15B sentences at ~20 tokens/sentence.
// - GPU hours: ~3.1M V100-hours (Patterson et al 2021, https://arxiv.org/abs/2104.10350).
// - Electricity: 1,287 MWh = 1.29 GWh (Patterson et al 2021).
//   At ~30 kWh/home/day → ~43,000 home-days.
// - Dollar cost: ~$4.6M (Lambda Labs 2020 estimate for GPT-3 training on V100s).
const FINAL = {
  sentences: 15e9,
  hours:     3_100_000,
  dollars:   4_600_000,
  homesDay:  43000,
};

const SOURCES = [
  { name: "Wikipedia",         icon: "🌐" },
  { name: "News archives",     icon: "📰" },
  { name: "Reddit + forums",   icon: "💬" },
  { name: "Books (Gutenberg)", icon: "📚" },
  { name: "GitHub code",       icon: "👨‍💻" },
  { name: "Science papers",    icon: "🧪" },
  { name: "Recipe blogs",      icon: "🍳" },
  { name: "Q&A sites",         icon: "❓" },
  { name: "Product reviews",   icon: "⭐" },
  { name: "Personal blogs",    icon: "📝" },
];

// A mix of function + content words, varied enough to feel alive.
const PREDICT_WORDS = [
  "the", "and", "of", "that", "was", "to", "is", "in",
  "unicorn", "quantum", "chocolate", "midnight", "galaxy",
  "Python", "recipe", "history", "lightning", "detective",
  "volcano", "Shakespeare", "banana", "octopus", "sunrise",
  "spaghetti", "samurai", "coffee", "paradox", "firefly",
  "dragon", "wildfire", "whisper", "treasure", "mystery",
];

function spellBillions(n) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} billion`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} million`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} thousand`;
  return Math.round(n).toLocaleString();
}
function formatHours(n) {
  if (n >= 1000) return `${Math.round(n).toLocaleString()} hours`;
  return `${Math.round(n)} hours`;
}
function formatDollars(n) {
  if (n >= 1_000_000) return `$${(n/1_000_000).toFixed(2)} million`;
  if (n >= 1000) return `$${(n/1000).toFixed(1)} thousand`;
  return `$${Math.round(n)}`;
}
function formatHomesDay(n) {
  return `${Math.round(n).toLocaleString()} homes × 1 day`;
}

function easeOut(t) { return 1 - Math.pow(1 - t, 2); }

const GRID_ROWS = 5;
const GRID_COLS = 8;

export default function TrainAnim({ onAdvance }) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const startedAt = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (done) return;
    const tick = (ts) => {
      if (startedAt.current === null) startedAt.current = ts;
      const elapsed = ts - startedAt.current;
      const p = Math.min(1, elapsed / TOTAL_MS);
      setProgress(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDone(true);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [done]);

  const skip = () => {
    cancelAnimationFrame(rafRef.current);
    setProgress(1);
    setDone(true);
  };

  const e = easeOut(progress);
  const sentences = FINAL.sentences * e;
  const hours = FINAL.hours * e;
  const dollars = FINAL.dollars * e;
  const homesDay = FINAL.homesDay * e;

  // Spread sources over the whole animation: one activates per 1/N of progress.
  const activeCount = Math.min(
    SOURCES.length,
    Math.max(0, Math.floor(progress * SOURCES.length))
  );

  // Drives the grid pulses (~5 ticks per second).
  const fastTick = Math.floor(progress * TOTAL_MS / 200);

  // Cheap integer hash → pseudo-random [0,1) that doesn't cycle visibly.
  const hash = (a, b) => {
    let x = (a * 374761393 + b * 668265263) | 0;
    x = (x ^ (x >>> 13)) * 1274126177;
    x = x ^ (x >>> 16);
    return ((x >>> 0) % 1000) / 1000;
  };

  // Vector cells pulse pseudo-randomly. Attention lights up a random
  // scattering of cells each tick — different positions each time.
  const cells = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const k = r * GRID_COLS + c;
      const vecBase = hash(k, fastTick);
      const vecIntensity = activeCount > 0 ? 0.18 + vecBase * 0.65 : 0.1;
      const attended = activeCount > 0 && hash(k + 101, fastTick) < 0.18;
      cells.push({ vecIntensity, attended });
    }
  }

  // Word pops in every ~550ms.
  const wordTick = Math.floor(progress * TOTAL_MS / 550);
  const predictWord =
    activeCount > 0 ? PREDICT_WORDS[wordTick % PREDICT_WORDS.length] : "…";

  return (
    <div className="gen gen--anim">
      <div className="gen__prompt">
        <div className="gen__prompt-title">Train on Everything</div>
        <div className="gen__prompt-body">
          Instead of labeling data by hand, feed the model <strong>everything we can scrape</strong> and have it play the "predict the next word" game — billions of times.
        </div>
      </div>

      <div className="trainanim">
        <div className="trainanim__sources">
          {SOURCES.map((s, i) => {
            const state = i < activeCount ? "consumed" : i === activeCount ? "flying" : "queued";
            return (
              <div key={s.name} className={`trainanim__source trainanim__source--${state}`}>
                <span className="trainanim__source-icon">{s.icon}</span>
                <span className="trainanim__source-name">{s.name}</span>
              </div>
            );
          })}
        </div>

        <div className="trainanim__arrow">→</div>

        <div className="trainanim__stack">
          <div className="trainanim__model">
            <div className="trainanim__model-label">Model</div>
            <div className="trainanim__model-guts">
              <div className="trainanim__part">
                <div className="trainanim__part-label">
                  vectors <span className="trainanim__part-sub">+ <span className="trainanim__attn-swatch">attention</span></span>
                </div>
                <div className="trainanim__grid">
                  {cells.map((cell, k) => (
                    <div
                      key={k}
                      className={`trainanim__grid-cell ${cell.attended ? "trainanim__grid-cell--attn" : ""}`}
                      style={
                        cell.attended
                          ? { backgroundColor: "rgba(40, 170, 110, 0.9)" }
                          : { backgroundColor: `rgba(184, 83, 10, ${cell.vecIntensity})` }
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="trainanim__part trainanim__part--predict">
                <div className="trainanim__part-label">predict next word</div>
                <div className="trainanim__predict-word" key={wordTick}>
                  {predictWord}
                </div>
              </div>
            </div>
          </div>

          <div className="trainanim__datacenter" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="trainanim__rack">
                <div className="trainanim__rack-led" style={{ opacity: (fastTick + i) % 3 === 0 ? 1 : 0.3 }} />
                <div className="trainanim__rack-led" style={{ opacity: (fastTick + i) % 3 === 1 ? 1 : 0.3 }} />
                <div className="trainanim__rack-led" style={{ opacity: (fastTick + i) % 3 === 2 ? 1 : 0.3 }} />
              </div>
            ))}
            <div className="trainanim__datacenter-label">data center</div>
          </div>
        </div>
      </div>

      <div className="trainanim__meters">
        <Meter label="Sentences read"  value={spellBillions(sentences)}  pct={e} />
        <Meter label="GPU hours"       value={formatHours(hours)}        pct={e} />
        <Meter label="Compute cost"    value={formatDollars(dollars)}    pct={e} />
        <Meter label="Electricity"     value={formatHomesDay(homesDay)}  pct={e} />
      </div>

      <div className="gen__footer">
        {!done && (
          <button className="btn btn--ghost" onClick={skip}>Skip animation</button>
        )}
        {done && (
          <button className="btn btn--primary" onClick={onAdvance}>
            See what it learned →
          </button>
        )}
      </div>
    </div>
  );
}

function Meter({ label, value, pct }) {
  return (
    <div className="trainanim__meter">
      <div className="trainanim__meter-label">{label}</div>
      <div className="trainanim__meter-val">{value}</div>
      <div className="trainanim__bar">
        <div className="trainanim__bar-fill" style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}
