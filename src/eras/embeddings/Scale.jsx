import { useMemo, useState } from "react";
import { STAGE4_TRIPLETS, scaleVec } from "./data.js";
import { presentation } from "./tweetPresentation.js";

// Stage 04: Similarity game. Real 25d GloVe vectors, cosine similarity.
// Students tap 2 of 3 tweets they think are closest, then see the numbers.

const ROUNDS = 3;

function pairKey(a, b) {
  const lo = Math.min(a, b), hi = Math.max(a, b);
  return `${lo}${hi}`;
}

function fmt(n) {
  const s = n.toFixed(2);
  return n >= 0 ? `+${s}` : s;
}

function VectorStrip({ vec, revealed }) {
  if (!vec) return null;
  const scaled = scaleVec(vec);
  return (
    <div className={`emb-scale__vec ${revealed ? "emb-scale__vec--reveal" : ""}`}>
      {scaled.map((n, i) => {
        const mag = Math.min(1, Math.abs(n));
        const sign = n >= 0 ? "pos" : "neg";
        return (
          <span
            key={i}
            className={`emb-scale__vec-num emb-scale__vec-num--${sign}`}
            style={{ opacity: 0.4 + 0.6 * mag }}
          >
            {fmt(n)}
          </span>
        );
      })}
    </div>
  );
}

export default function Scale({ onAdvance }) {
  const rounds = useMemo(() => STAGE4_TRIPLETS.slice(0, ROUNDS), []);
  const [roundIdx, setRoundIdx] = useState(0);
  const [picks, setPicks] = useState([]); // indices within the current triplet
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);

  const round = rounds[roundIdx];
  if (!round) return null;

  const togglePick = (i) => {
    if (revealed) return;
    setPicks((prev) => {
      if (prev.includes(i)) return prev.filter((p) => p !== i);
      if (prev.length >= 2) return prev;
      const next = [...prev, i];
      if (next.length === 2) {
        setRevealed(true);
        const pk = pairKey(next[0], next[1]);
        if (pk === round.similar_pair) setScore((s) => s + 1);
      }
      return next;
    });
  };

  const nextRound = () => {
    if (roundIdx + 1 >= rounds.length) return;
    setRoundIdx(roundIdx + 1);
    setPicks([]);
    setRevealed(false);
  };

  const finished = revealed && roundIdx === rounds.length - 1;
  const userPair = picks.length === 2 ? pairKey(picks[0], picks[1]) : null;
  const correct = userPair === round.similar_pair;

  return (
    <div className="emb-scale">
      <div className="ml__prompt">
        <div className="ml__prompt-title">Real vectors, longer lists of numbers.</div>
        <div className="ml__prompt-body">
          Each of your word vectors is a list of <strong>2 numbers</strong>.
          Real word vectors — like the ones Google and Stanford researchers
          trained on billions of words — are lists of{" "}
          <strong>25, 50, or even 300</strong> numbers. The same averaging
          trick gives every tweet a vector that long. Which tweets land
          closest? Let's see if you can spot them.
        </div>
      </div>

      <div className="emb-scale__header">
        <span>Round {roundIdx + 1} / {rounds.length}</span>
        <span>Score: {score} / {revealed ? roundIdx + 1 : roundIdx}</span>
      </div>

      <div className="emb-scale__instruct">
        Tap the <strong>two tweets</strong> you think are most similar.
      </div>

      <div className="emb-scale__tweets">
        {round.tweets.map((t, i) => {
          const picked = picks.includes(i);
          const inCorrectPair = revealed && round.similar_pair.includes(String(i));
          const cls = [
            "emb-scale__tweet",
            picked && "emb-scale__tweet--picked",
            revealed && inCorrectPair && "emb-scale__tweet--correct",
            revealed && picked && !inCorrectPair && "emb-scale__tweet--wrong",
          ].filter(Boolean).join(" ");
          const p = presentation(t.text);
          return (
            <div key={i} className="emb-scale__slot">
              <button
                className={`${cls} tweet-card`}
                onClick={() => togglePick(i)}
                disabled={revealed && !picked}
              >
                <span className="emb-scale__tweet-num">({i + 1})</span>
                <div className="tweet-card__avatar" style={{ background: p.color }}>{p.initial}</div>
                <div className="tweet-card__body">
                  <div className="tweet-card__head">
                    <span className="tweet-card__name">{p.name}</span>
                    <span className="tweet-card__handle">@{p.handle}</span>
                  </div>
                  <div className="tweet-card__text">{t.text}</div>
                </div>
              </button>
              <VectorStrip vec={t.vec} revealed={revealed} />
            </div>
          );
        })}
      </div>

      {revealed && (
        <div className="emb-scale__reveal">
          <div className={`emb-scale__verdict emb-scale__verdict--${correct ? "pos" : "neg"}`}>
            {correct
              ? "Nice — the model agreed."
              : userPair
              ? "The model picked a different pair."
              : ""}
          </div>
          <div className="emb-scale__sims">
            <div className="emb-scale__sims-title">Similarity score (higher = more alike)</div>
            <div className="emb-scale__sims-rows">
              {["01", "02", "12"].map((k) => {
                const [i, j] = [+k[0], +k[1]];
                const isWinner = k === round.similar_pair;
                return (
                  <div
                    key={k}
                    className={`emb-scale__sim-row ${isWinner ? "emb-scale__sim-row--winner" : ""}`}
                  >
                    <span>({i + 1}) ↔ ({j + 1})</span>
                    <div className="emb-scale__sim-bar">
                      <div
                        className="emb-scale__sim-bar-fill"
                        style={{ width: `${round.similarities[k] * 100}%` }}
                      />
                    </div>
                    <span className="emb-scale__sim-num">
                      {round.similarities[k].toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ml__footer">
            {finished ? (
              <>
                <div className="ml__footer-hint">
                  You scored {score} / {rounds.length}. The model uses 25
                  numbers per tweet — no rules about sentiment, just geometry.
                </div>
                <button className="btn btn--primary" onClick={onAdvance}>
                  Use these vectors to classify →
                </button>
              </>
            ) : (
              <button className="btn btn--primary" onClick={nextRound}>
                Next round →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
