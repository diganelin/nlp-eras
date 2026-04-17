import { useEffect, useMemo, useState } from "react";
import { STAGE5, CLIFFHANGER, VECTORS } from "./data.js";
import { presentation } from "./tweetPresentation.js";

// Stage 05: show a real classifier trained on 25-number vectors. Reveal
// which slot mattered most (and the human-readable words at its extremes),
// then hit the cliffhanger: "good, not bad" vs "bad, not good" average to
// the same vector.

const TOK_RE = /[a-zA-Z']+/g;

function tokens(text) {
  return (text.match(TOK_RE) || []).map((t) => t.toLowerCase());
}

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

// Average the 25d vectors for each known token, then apply weights + bias.
function classifyText(text) {
  const toks = tokens(text);
  const seen = new Set();
  const recognized = [];
  const unknown = [];
  for (const t of toks) {
    if (seen.has(t)) continue;
    seen.add(t);
    if (VECTORS[t]) recognized.push({ word: t, vec: VECTORS[t] });
    else unknown.push(t);
  }
  if (!recognized.length) return { empty: true, unknown };
  const avg = new Array(25).fill(0);
  for (const r of recognized) for (let i = 0; i < 25; i++) avg[i] += r.vec[i];
  for (let i = 0; i < 25; i++) avg[i] /= recognized.length;
  let z = STAGE5.bias;
  for (let i = 0; i < 25; i++) z += STAGE5.weights[i] * avg[i];
  const score = sigmoid(z);
  return {
    recognized,
    unknown,
    avg,
    score,
    mood: score >= 0.5 ? "pos" : "neg",
  };
}

function vecEquals(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

// Symbolic deep-ish NN: 4 visible inputs + ellipsis (representing 25),
// wider hidden layer, single output. Nothing trains — it just pulses while
// the training counter runs.
function DeepNN({ pulse }) {
  const W = 260, H = 140;
  const inX = 30, hidX = 130, outX = 230;
  const inputs = [
    { x: inX, y: 26 },
    { x: inX, y: 56 },
    { x: inX, y: 86 },
    { x: inX, y: 116 },
  ];
  const hidden = [];
  for (let i = 0; i < 7; i++) hidden.push({ x: hidX, y: 18 + i * 17 });
  const output = { x: outX, y: 70 };
  return (
    <svg className="emb-clf__nn" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      {inputs.map((i, a) =>
        hidden.map((h, b) => (
          <line
            key={`ih-${a}-${b}`}
            className={`emb-clf__nn-edge ${pulse ? "emb-clf__nn-edge--pulse" : ""}`}
            x1={i.x + 5} y1={i.y} x2={h.x - 5} y2={h.y}
          />
        ))
      )}
      {hidden.map((h, b) => (
        <line
          key={`ho-${b}`}
          className={`emb-clf__nn-edge ${pulse ? "emb-clf__nn-edge--pulse" : ""}`}
          x1={h.x + 5} y1={h.y} x2={output.x - 5} y2={output.y}
        />
      ))}
      {inputs.map((n, i) => (
        <circle key={`i${i}`} className="emb-clf__nn-node emb-clf__nn-node--in"
          cx={n.x} cy={n.y} r={5} />
      ))}
      <text className="emb-clf__nn-ellipsis" x={inX} y={H - 4} textAnchor="middle">…</text>
      {hidden.map((n, i) => (
        <circle key={`h${i}`} className="emb-clf__nn-node emb-clf__nn-node--hid"
          cx={n.x} cy={n.y} r={5} />
      ))}
      <circle className="emb-clf__nn-node emb-clf__nn-node--out"
        cx={output.x} cy={output.y} r={7} />
    </svg>
  );
}

// Small preview of a 25-vector: show 4 + ellipsis.
function VectorPreview({ vec }) {
  const shown = vec.slice(0, 4).map((n) => n.toFixed(2));
  return (
    <span className="emb-clf__vec-preview">
      [{shown.join(", ")}, <span className="emb-clf__vec-ellipsis">…</span>]
    </span>
  );
}

export default function Classify() {
  const [phase, setPhase] = useState("training"); // training | classify
  const [showLearned, setShowLearned] = useState(false);
  const [trainCount, setTrainCount] = useState(0);
  const [trainTweetIdx, setTrainTweetIdx] = useState(0);

  const samples = useMemo(() => STAGE5.display_tweets.slice(0, 10), []);
  const trainExamples = useMemo(() => STAGE5.display_tweets.slice(0, 6), []);

  // Training animation: counter ticks 0 → 1500 over ~6s, cycling through
  // example tweets for the visual flow. No actual training — the model is
  // already trained and stored in STAGE5.
  const TARGET = 1500;
  const DURATION = 11000;
  useEffect(() => {
    if (phase !== "training") return;
    const start = performance.now();
    let raf;
    const step = (now) => {
      const t = Math.min(1, (now - start) / DURATION);
      // ease out so the counter slows near the end
      const eased = 1 - Math.pow(1 - t, 2);
      setTrainCount(Math.floor(eased * TARGET));
      setTrainTweetIdx(Math.floor((now - start) / 450) % trainExamples.length);
      if (t < 1) raf = requestAnimationFrame(step);
      else setTimeout(() => setPhase("classify"), 400);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase, trainExamples.length]);

  const [tryText, setTryText] = useState("");
  const [tryResult, setTryResult] = useState(null);
  const classifyTry = () => {
    if (!tryText.trim()) return;
    setTryResult(classifyText(tryText));
  };

  const activeTraining = trainExamples[trainTweetIdx] || samples[0];
  const activeVec = activeTraining
    ? classifyText(activeTraining.text).avg
    : null;

  return (
    <div className="emb-clf">
      <div className="ml__prompt">
        <div className="ml__prompt-title">The full recipe, on real data.</div>
        <div className="ml__prompt-body">
          Take 1,500 labeled tweets. Turn each into a 25-number vector (same
          averaging trick). Train a model with one weight for each of the 25
          slots in the vector. That's it — no grammar, no rules, just numbers.
        </div>
      </div>

      {phase === "training" && (
        <div className="emb-clf__training">
          <div className="emb-clf__training-row">
            <div className="emb-clf__training-col">
              <div className="emb-clf__step-label">A tweet</div>
              <div className="emb-clf__training-tweet tweet-card">
                <div className="tweet-card__body">
                  <div className="tweet-card__text">{activeTraining.text}</div>
                </div>
              </div>
            </div>
            <div className="emb-clf__training-arrow">→</div>
            <div className="emb-clf__training-col">
              <div className="emb-clf__step-label">25-number vector</div>
              {activeVec && <VectorPreview vec={activeVec} />}
            </div>
            <div className="emb-clf__training-arrow">→</div>
            <div className="emb-clf__training-col">
              <div className="emb-clf__step-label">Model</div>
              <DeepNN pulse />
            </div>
          </div>
          <div className="emb-clf__training-progress">
            <div className="emb-clf__training-count">
              training on <strong>{trainCount.toLocaleString()}</strong> / {TARGET.toLocaleString()} tweets
            </div>
            <div className="emb-clf__training-bar">
              <div
                className="emb-clf__training-bar-fill"
                style={{ width: `${(trainCount / TARGET) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {phase !== "training" && (
        <>
          <div className="emb-clf__acc">
            <div className="emb-clf__acc-num">
              {Math.round(STAGE5.accuracy * 100)}%
            </div>
            <div className="emb-clf__acc-label">
              accuracy on the test set
              <span className="emb-clf__acc-note"> (random would be 50%)</span>
            </div>
          </div>

          <div className="emb-clf__tweets">
            {samples.map((t, i) => {
              const correct = t.predicted === t.label;
              const p = presentation(t.text);
              return (
                <div
                  key={i}
                  className={`emb-clf__tweet tweet-card emb-clf__tweet--${t.predicted} ${correct ? "emb-clf__tweet--ok" : "emb-clf__tweet--bad"}`}
                >
                  <div className="tweet-card__avatar" style={{ background: p.color }}>{p.initial}</div>
                  <div className="tweet-card__body">
                    <div className="tweet-card__head">
                      <span className="tweet-card__name">{p.name}</span>
                      <span className="tweet-card__handle">@{p.handle}</span>
                    </div>
                    <div className="tweet-card__text">{t.text}</div>
                    <div className="emb-clf__tweet-meta">
                      <div className="emb-clf__label-group">
                        <span className="emb-clf__label-key">true label</span>
                        <span className={`emb-clf__label-val emb-clf__label-val--${t.label}`}>
                          {t.label === "pos" ? "positive" : "negative"}
                        </span>
                      </div>
                      <div className="emb-clf__label-group">
                        <span className="emb-clf__label-key">model's prediction</span>
                        <span className={`emb-clf__chip emb-clf__chip--${t.predicted}`}>
                          {t.predicted === "pos" ? "positive" : "negative"}
                          <span className={`emb-clf__tick emb-clf__tick--${correct ? "ok" : "bad"}`}>
                            {correct ? "✓" : "✗"}
                          </span>
                        </span>
                      </div>
                      <span className="emb-clf__conf" title="model's confidence, 0–100%">
                        {Math.round(t.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="emb-clf__try">
            <div className="emb-clf__try-title">Try a tweet of your own</div>
            <div className="emb-clf__try-sub">
              The model reads your text, averages the 25-number vector of each
              known word, and runs it through the same 25 weights. It only
              knows <strong>{Object.keys(VECTORS).length.toLocaleString()} words</strong>{" "}
              (the most common ones on Twitter) — anything else is ignored.
            </div>
            <div className="emb-clf__try-row">
              <textarea
                className="emb-clf__try-input"
                value={tryText}
                onChange={(e) => setTryText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    classifyTry();
                  }
                }}
                placeholder="e.g. i love this movie, best day ever"
                rows={1}
              />
              <button
                className="btn btn--primary"
                onClick={classifyTry}
                disabled={!tryText.trim()}
              >
                Classify →
              </button>
            </div>
            {tryResult && tryResult.empty && (
              <div className="emb-clf__try-empty">
                None of those words are in the model's vocabulary. Try common words.
              </div>
            )}
            {tryResult && !tryResult.empty && (
              <div className="emb-clf__try-result">
                <div className="emb-clf__try-line">
                  <span className="emb-clf__try-key">recognized</span>
                  <span className="emb-clf__try-words">
                    {tryResult.recognized.map((r) => (
                      <span key={r.word} className="emb-clf__try-word">{r.word}</span>
                    ))}
                  </span>
                </div>
                {tryResult.unknown.length > 0 && (
                  <div className="emb-clf__try-line">
                    <span className="emb-clf__try-key">ignored</span>
                    <span className="emb-clf__try-words">
                      {tryResult.unknown.map((u) => (
                        <span key={u} className="emb-clf__try-word emb-clf__try-word--muted">{u}</span>
                      ))}
                    </span>
                  </div>
                )}
                <div className="emb-clf__try-line">
                  <span className="emb-clf__try-key">score</span>
                  <span className={`emb-clf__try-score emb-clf__try-score--${tryResult.mood}`}>
                    {tryResult.score.toFixed(2)} →{" "}
                    <strong>{tryResult.mood === "pos" ? "Positive" : "Negative"}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {phase === "classify" && (
        <div className="emb-clf__cliff">
          <div className="ml__prompt">
            <div className="ml__prompt-title">What's the problem?</div>
            <div className="ml__prompt-body">
              Try typing these two tweets into the box above:
              <ul className="emb-clf__cliff-suggest">
                <li>
                  <span className="emb-clf__cliff-sug">"{CLIFFHANGER[0].a}"</span>
                  <span className="emb-clf__cliff-vs">vs.</span>
                  <span className="emb-clf__cliff-sug">"{CLIFFHANGER[0].b}"</span>
                </li>
              </ul>
              Was the model able to learn the meaning of these tweets?
            </div>
          </div>

          {!showLearned && (
            <div className="ml__footer">
              <button className="btn btn--ghost" onClick={() => setShowLearned(true)}>
                Optional: what did the model learn? →
              </button>
            </div>
          )}

          {showLearned && (
            <div className="emb-clf__dim">
              <div className="ml__prompt ml__prompt--quiet">
                <div className="ml__prompt-title">
                  Of the 25 numbers, one mattered most.
                </div>
                <div className="ml__prompt-body">
                  We looked at which slot the model weighted heaviest — slot #
                  {STAGE5.top_dim + 1}. Then we asked: which words have the most
                  extreme values in that slot? Here's what came out:
                </div>
              </div>
              <div className="emb-clf__extremes">
                <div className="emb-clf__extreme emb-clf__extreme--pos">
                  <div className="emb-clf__extreme-label">pushes "positive"</div>
                  <div className="emb-clf__extreme-words">
                    {STAGE5.high_words.slice(0, 8).map((w) => (
                      <span key={w} className="emb-clf__extreme-word">{w}</span>
                    ))}
                  </div>
                  {STAGE5.high_example && (
                    <div className="emb-clf__extreme-example">
                      e.g. <em>"{STAGE5.high_example}"</em>
                    </div>
                  )}
                </div>
                <div className="emb-clf__extreme emb-clf__extreme--neg">
                  <div className="emb-clf__extreme-label">pushes "negative"</div>
                  <div className="emb-clf__extreme-words">
                    {STAGE5.low_words.slice(0, 8).map((w) => (
                      <span key={w} className="emb-clf__extreme-word">{w}</span>
                    ))}
                  </div>
                  {STAGE5.low_example && (
                    <div className="emb-clf__extreme-example">
                      e.g. <em>"{STAGE5.low_example}"</em>
                    </div>
                  )}
                </div>
              </div>
              <div className="emb-clf__dim-note">
                Nobody told the model what these words mean. It found this axis on
                its own — just by tuning 25 weights to minimize mistakes.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
