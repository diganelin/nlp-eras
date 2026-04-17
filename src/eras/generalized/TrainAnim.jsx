import { useEffect, useRef, useState } from "react";

// Between stage 1 and 2: source badges fly into a "model" box and a compute
// counter ticks up. Visual-only. Skippable. Numbers are placeholder.

const SOURCES = [
  { name: "Wikipedia",      cost: 8  },
  { name: "Reddit",         cost: 6  },
  { name: "News archives",  cost: 5  },
  { name: "GitHub code",    cost: 7  },
  { name: "Project Gutenberg", cost: 4 },
  { name: "Science papers", cost: 5  },
  { name: "Recipe sites",   cost: 2  },
  { name: "Forums",         cost: 4  },
  { name: "Q&A sites",      cost: 3  },
  { name: "Product reviews", cost: 3 },
];

const TICK_MS = 650;

export default function TrainAnim({ onAdvance }) {
  const [tick, setTick] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (done) return;
    timerRef.current = setInterval(() => {
      setTick((t) => {
        if (t >= SOURCES.length) {
          clearInterval(timerRef.current);
          setDone(true);
          return t;
        }
        return t + 1;
      });
    }, TICK_MS);
    return () => clearInterval(timerRef.current);
  }, [done]);

  const compute = SOURCES.slice(0, tick).reduce((s, x) => s + x.cost, 0);
  const totalCompute = SOURCES.reduce((s, x) => s + x.cost, 0);
  const fedCount = tick;

  const skip = () => {
    clearInterval(timerRef.current);
    setTick(SOURCES.length);
    setDone(true);
  };

  return (
    <div className="gen gen--anim">
      <div className="gen__prompt">
        <div className="gen__prompt-title">Training on the whole internet</div>
        <div className="gen__prompt-body">
          We'll feed text from everywhere we can scrape into one model and ask it to do the same task you just did — predict the next word. Over and over, billions of times.
        </div>
      </div>

      <div className="trainanim">
        <div className="trainanim__sources">
          {SOURCES.map((s, i) => {
            const state =
              i < tick - 1 ? "consumed" : i === tick - 1 ? "flying" : "queued";
            return (
              <div key={s.name} className={`trainanim__source trainanim__source--${state}`}>
                {s.name}
              </div>
            );
          })}
        </div>

        <div className="trainanim__arrow">→</div>

        <div className="trainanim__model">
          <div className="trainanim__model-label">model</div>
          <div className="trainanim__model-sub">learning next-word prediction</div>
          <div className="trainanim__pulse" style={{ animationPlayState: done ? "paused" : "running" }} />
        </div>
      </div>

      <div className="trainanim__meter">
        <div className="trainanim__meter-row">
          <span className="trainanim__meter-label">Compute used</span>
          <span className="trainanim__meter-val">{compute.toLocaleString()} units</span>
        </div>
        <div className="trainanim__bar">
          <div
            className="trainanim__bar-fill"
            style={{ width: `${(compute / totalCompute) * 100}%` }}
          />
        </div>
        <div className="trainanim__meter-row">
          <span className="trainanim__meter-label">Sources fed in</span>
          <span className="trainanim__meter-val">{fedCount} / {SOURCES.length}</span>
        </div>
      </div>

      <div className="gen__footer">
        {!done && (
          <button className="btn btn--ghost" onClick={skip}>
            Skip animation
          </button>
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
