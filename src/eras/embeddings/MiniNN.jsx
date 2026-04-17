import { useEffect, useMemo, useState } from "react";
import { STAGE3_POS, STAGE3_NEG } from "./data.js";

// Stage 03: sentiment classification on the student's own 2d vectors.
// The big idea to surface: a tweet becomes a list of numbers, and the
// model is just a weighted mix of those numbers.

const TOK = /[a-zA-Z']+/g;
function tokens(text) {
  return (text.match(TOK) || []).map((t) => t.toLowerCase());
}

function hitWords(text, hits, placements) {
  const seen = new Set();
  const out = [];
  for (const tok of tokens(text)) {
    if (hits.includes(tok) && !seen.has(tok) && placements[tok]) {
      seen.add(tok);
      out.push({ word: tok, vec: placements[tok] });
    }
  }
  return out;
}

function tweetVec(text, hits, placements) {
  const pts = hitWords(text, hits, placements);
  if (!pts.length) return null;
  const x = pts.reduce((s, p) => s + p.vec[0], 0) / pts.length;
  const y = pts.reduce((s, p) => s + p.vec[1], 0) / pts.length;
  return [x, y];
}

function round2(n) { return Math.round(n * 100) / 100; }
function fmt(n) { return round2(n).toFixed(2); }

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

function train(samples, epochs = 400, lr = 0.4) {
  let w1 = 0, w2 = 0, b = 0;
  for (let e = 0; e < epochs; e++) {
    let gw1 = 0, gw2 = 0, gb = 0;
    for (const [x, y, t] of samples) {
      const p = sigmoid(w1 * x + w2 * y + b);
      const d = p - t;
      gw1 += d * x; gw2 += d * y; gb += d;
    }
    const n = samples.length;
    w1 -= (lr / n) * gw1;
    w2 -= (lr / n) * gw2;
    b  -= (lr / n) * gb;
  }
  return { w1, w2, b };
}

function evaluate(model, samples) {
  let correct = 0;
  for (const [x, y, t] of samples) {
    const p = sigmoid(model.w1 * x + model.w2 * y + model.b);
    if ((p > 0.5 ? 1 : 0) === t) correct++;
  }
  return correct / samples.length;
}

function HighlightedTweet({ text, hits }) {
  const hitSet = new Set(hits);
  const parts = text.split(/(\s+)/);
  return (
    <span>
      {parts.map((p, i) => {
        const tok = p.toLowerCase().replace(/[^a-z']/g, "");
        if (hitSet.has(tok)) return <mark key={i} className="emb-hit">{p}</mark>;
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
}

function TinyNN({ phase }) {
  const W = 180, H = 110;
  const inX = 14, hidX = 90, outX = 166;
  const inputs = [
    { x: inX, y: 35 },
    { x: inX, y: 75 },
  ];
  const hidden = [
    { x: hidX, y: 18 },
    { x: hidX, y: 48 },
    { x: hidX, y: 72 },
    { x: hidX, y: 96 },
  ];
  const output = { x: outX, y: 55 };
  const inputsOn = phase >= 1;
  const hiddenOn = phase >= 2;
  const outputOn = phase >= 3;

  return (
    <svg className="t-nn" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      {inputs.map((i, a) =>
        hidden.map((h, b) => (
          <line
            key={`ih-${a}-${b}`}
            className={`t-nn__edge ${hiddenOn ? "t-nn__edge--on" : ""}`}
            x1={i.x + 6} y1={i.y}
            x2={h.x - 6} y2={h.y}
          />
        ))
      )}
      {hidden.map((h, b) => (
        <line
          key={`ho-${b}`}
          className={`t-nn__edge ${outputOn ? "t-nn__edge--on" : ""}`}
          x1={h.x + 6} y1={h.y}
          x2={output.x - 6} y2={output.y}
        />
      ))}
      {inputs.map((n, i) => (
        <circle key={`i${i}`} className={`t-nn__node ${inputsOn ? "t-nn__node--on" : ""}`}
          cx={n.x} cy={n.y} r={6} />
      ))}
      {hidden.map((n, i) => (
        <circle key={`h${i}`} className={`t-nn__node ${hiddenOn ? "t-nn__node--on" : ""}`}
          cx={n.x} cy={n.y} r={6} />
      ))}
      <circle className={`t-nn__node ${outputOn ? "t-nn__node--on" : ""}`}
        cx={output.x} cy={output.y} r={7} />
    </svg>
  );
}

function buildDemo(tweet, placements) {
  const pts = hitWords(tweet.text, tweet.hits, placements);
  if (pts.length < 1) return null;
  return {
    text: tweet.text,
    hits: tweet.hits,
    points: pts,
    vec: tweetVec(tweet.text, tweet.hits, placements),
    label: tweet.label,
  };
}

export default function MiniNN({ placements, axisNames, onAdvance }) {
  const dataset = useMemo(() => {
    const pos = STAGE3_POS
      .map((t) => ({ vec: tweetVec(t.text, t.hits, placements), text: t.text, hits: t.hits, label: 1 }))
      .filter((r) => r.vec);
    const neg = STAGE3_NEG
      .map((t) => ({ vec: tweetVec(t.text, t.hits, placements), text: t.text, hits: t.hits, label: 0 }))
      .filter((r) => r.vec);
    const all = [...pos, ...neg];
    let seed = 7;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    const split = Math.floor(all.length * 0.8);
    return { train: all.slice(0, split), test: all.slice(split), all };
  }, [placements]);

  // Three hand-picked demos: one unambiguously positive, one interestingly
  // mixed (negative-sounding words but labeled positive thanks to "still
  // cool"), one unambiguously negative. Students label each one themselves
  // before the animation plays out.
  const demos = useMemo(() => {
    const DEMO_SPECS = [
      {
        text: "so excited for the movie awards ;) .. new moon, transformers and harrypotter..   so pumped",
        label: "pos",
      },
      {
        text: "Tired. Bored. Slightly annoyed. But still cool.  #fb",
        label: "pos",
      },
      {
        text: "Tired cranky annoyed.....and it's not even 8:30 am.",
        label: "neg",
      },
    ];
    const pool = [
      ...STAGE3_POS.map((t) => ({ ...t, label: "pos" })),
      ...STAGE3_NEG.map((t) => ({ ...t, label: "neg" })),
    ];
    return DEMO_SPECS
      .map((spec) => {
        const found = pool.find((t) => t.text === spec.text);
        if (!found) return null;
        return buildDemo({ ...found, label: spec.label }, placements);
      })
      .filter(Boolean);
  }, [placements]);

  const [stage, setStage] = useState("idle"); // idle | picking | training | crunching | done
  const [result, setResult] = useState(null);
  const [stepIdx, setStepIdx] = useState(0); // which demo tweet we're on (0..2)
  const [phase, setPhase] = useState(0);     // 0..4 within one tweet
  const [picks, setPicks] = useState([null, null, null]);
  const [tryText, setTryText] = useState("");
  const [tryResult, setTryResult] = useState(null);

  const startTrain = () => {
    setResult(null);
    setStepIdx(0);
    setPhase(0);
    setPicks([null, null, null]);
    const samples = dataset.train.map((r) => [r.vec[0], r.vec[1], r.label]);
    const model = train(samples);
    const trainAcc = evaluate(model, samples);
    const testAcc = evaluate(model, dataset.test.map((r) => [r.vec[0], r.vec[1], r.label]));
    setResult({ model, trainAcc, testAcc });
    setStage("picking");
  };

  const pickLabel = (label) => {
    setPicks((p) => {
      const c = [...p];
      c[stepIdx] = label;
      return c;
    });
    setPhase(0);
    setStage("training");
  };

  // Training animation: cycle each demo tweet through 4 phases, slow enough
  // that students can follow. After the last tweet, enter "crunching" (a
  // brief "training on N tweets…" placeholder) and then flip to "done".
  useEffect(() => {
    if (stage !== "training" || !demos.length) return;
    const phaseGap = 850;
    const timers = [];
    for (let i = 1; i <= 4; i++) {
      timers.push(setTimeout(() => setPhase(i), i * phaseGap));
    }
    return () => { timers.forEach(clearTimeout); };
  }, [stage, stepIdx, demos.length]);

  const nextStep = () => {
    if (stepIdx < demos.length - 1) {
      setStepIdx(stepIdx + 1);
      setPhase(0);
      setStage("picking");
    } else {
      setStage("crunching");
    }
  };

  useEffect(() => {
    if (stage !== "crunching") return;
    const t = setTimeout(() => setStage("done"), 1800);
    return () => clearTimeout(t);
  }, [stage]);

  const replay = () => {
    setResult(null);
    setStepIdx(0);
    setPhase(0);
    setPicks([null, null, null]);
    setStage("idle");
    setTryResult(null);
    // kick off next tick so state resets land first
    setTimeout(startTrain, 50);
  };

  const classifyTry = () => {
    if (!result || !tryText.trim()) return;
    const toks = tokens(tryText);
    const seen = new Set();
    const recognized = [];
    for (const t of toks) {
      if (seen.has(t) || !placements[t]) continue;
      seen.add(t);
      recognized.push({ word: t, vec: placements[t] });
    }
    if (!recognized.length) {
      setTryResult({ empty: true, typed: tryText });
      return;
    }
    const avg = [
      recognized.reduce((s, r) => s + r.vec[0], 0) / recognized.length,
      recognized.reduce((s, r) => s + r.vec[1], 0) / recognized.length,
    ];
    const z = result.model.w1 * avg[0] + result.model.w2 * avg[1] + result.model.b;
    const s = sigmoid(z);
    setTryResult({ recognized, avg, score: s, mood: s >= 0.5 ? "pos" : "neg", typed: tryText });
  };

  const xName = axisNames.x || "axis 1";
  const yName = axisNames.y || "axis 2";

  const biggerAxis = stage === "done" && result
    ? (Math.abs(result.model.w1) > Math.abs(result.model.w2) ? xName : yName)
    : null;

  // Which tweet to display in the pipeline right now.
  const activeDemo = demos.length ? demos[Math.min(stepIdx, demos.length - 1)] : null;

  const logit = result && activeDemo
    ? result.model.w1 * activeDemo.vec[0] + result.model.w2 * activeDemo.vec[1] + result.model.b
    : null;
  // score is a probability in [0, 1] — the model's confidence the tweet
  // is positive. Above 0.5 → Positive, below 0.5 → Negative.
  const score = logit != null ? sigmoid(logit) : null;
  const moodLabel = score == null ? "?" : score >= 0.5 ? "Positive" : "Negative";
  const moodKey = score == null ? "neutral" : score >= 0.5 ? "pos" : "neg";

  const inputsActive = stage !== "idle" && phase >= 1;
  const scoreRevealed = stage === "done" || phase >= 4;
  const moodRevealed = stage === "done" || phase >= 4;

  return (
    <div className="emb-nn">
      <div className="ml__prompt">
        <div className="ml__prompt-title">
          Sentiment classification: positive or negative?
        </div>
        <div className="ml__prompt-body">
          The classic NLP task: given a tweet, guess the overall mood. This
          is <strong>sentiment classification</strong>. We'll do it the{" "}
          <strong>machine learning</strong> way — we have{" "}
          {dataset.all.length} labeled tweets. We'll train the model on{" "}
          <strong>{dataset.train.length}</strong> of them (the{" "}
          <strong>training set</strong>) and keep the other{" "}
          <strong>{dataset.test.length}</strong> aside (the{" "}
          <strong>test set</strong>) to check how well it really learned.
        </div>
      </div>

      {activeDemo && stage !== "idle" && (
        <div className="emb-t2m">
          <div className="emb-t2m__tweet-row">
            <div className="emb-t2m__tweet-header">
              <span className="emb-t2m__step-label">A tweet</span>
              {(stage === "training" || stage === "picking") && (
                <span className="emb-t2m__counter">
                  {stepIdx + 1} / {demos.length}
                </span>
              )}
              {picks[stepIdx] && (
                <span className={`emb-t2m__truth emb-t2m__truth--${picks[stepIdx]}`}>
                  your label: {picks[stepIdx] === "pos" ? "Positive" : "Negative"}
                </span>
              )}
            </div>
            <div key={stepIdx} className="tweet-card emb-t2m__tweet-card emb-t2m__tweet-card--fade">
              <div className="tweet-card__body">
                <div className="tweet-card__text">
                  <HighlightedTweet text={activeDemo.text} hits={activeDemo.hits} />
                </div>
              </div>
            </div>
            {stage === "picking" && (
              <div className="emb-t2m__pick">
                <div className="emb-t2m__pick-prompt">
                  What mood do you think this should be?
                </div>
                <div className="emb-t2m__pick-btns">
                  <button
                    className="btn emb-t2m__pick-btn emb-t2m__pick-btn--pos"
                    onClick={() => pickLabel("pos")}
                  >
                    Positive
                  </button>
                  <button
                    className="btn emb-t2m__pick-btn emb-t2m__pick-btn--neg"
                    onClick={() => pickLabel("neg")}
                  >
                    Negative
                  </button>
                </div>
              </div>
            )}
          </div>

          {stage !== "picking" && (
          <div className="emb-t2m__flow">
            <div className="emb-t2m__col">
              <div className="emb-t2m__step-label">Words → numbers</div>
              <div className="emb-t2m__wvecs">
                {activeDemo.points.map((p) => (
                  <div key={p.word} className="emb-t2m__wvec">
                    <span className="emb-t2m__wvec-word">{p.word}</span>
                    <span className="emb-t2m__wvec-arrow">→</span>
                    <span className="emb-t2m__wvec-nums">
                      [{fmt(p.vec[0])}, {fmt(p.vec[1])}]
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="emb-t2m__flow-arrow">
              <span className="emb-t2m__flow-arrow-label">average</span>
              <span className="emb-t2m__flow-arrow-line">→</span>
            </div>

            <div className="emb-t2m__col">
              <div className="emb-t2m__step-label">Tweet vector</div>
              <div className="emb-t2m__avg">
                [{fmt(activeDemo.vec[0])}, {fmt(activeDemo.vec[1])}]
              </div>
            </div>

            <div className="emb-t2m__flow-arrow">
              <span className="emb-t2m__flow-arrow-label">feed in</span>
              <span className="emb-t2m__flow-arrow-line">→</span>
            </div>

            <div className={`emb-t2m__col emb-t2m__col--inputs ${inputsActive ? "emb-t2m__col--active" : ""}`}>
              <div className="emb-t2m__step-label">Inputs</div>
              <div className="emb-t2m__inputs">
                <div className="emb-t2m__input">
                  <div className="emb-t2m__input-name">{xName}</div>
                  <div className="emb-t2m__input-val">{fmt(activeDemo.vec[0])}</div>
                </div>
                <div className="emb-t2m__input">
                  <div className="emb-t2m__input-name">{yName}</div>
                  <div className="emb-t2m__input-val">{fmt(activeDemo.vec[1])}</div>
                </div>
              </div>
            </div>

            <div className="emb-t2m__col emb-t2m__col--nn">
              <div className="emb-t2m__step-label">Model</div>
              <TinyNN phase={phase} />
            </div>

            <div className="emb-t2m__flow-arrow">
              <span className="emb-t2m__flow-arrow-label">score</span>
              <span className="emb-t2m__flow-arrow-line">→</span>
            </div>

            <div className={`emb-t2m__col emb-t2m__out-col ${scoreRevealed ? "emb-t2m__out-col--reveal" : ""}`}>
              <div className="emb-t2m__step-label">Mood</div>
              <div className={`emb-t2m__out emb-t2m__out--${moodKey}`}>
                <div className="emb-t2m__out-score">
                  {scoreRevealed && score != null ? fmt(score) : "?"}
                </div>
                <div className="emb-t2m__out-arrow">→</div>
                <div className="emb-t2m__out-mood">
                  {moodRevealed ? moodLabel : "?"}
                </div>
                {moodRevealed && picks[stepIdx] && (
                  <span className={`emb-t2m__match emb-t2m__match--${moodKey === picks[stepIdx] ? "ok" : "bad"}`}>
                    {moodKey === picks[stepIdx] ? "✓" : "✗"}
                  </span>
                )}
              </div>
              <div className="emb-t2m__mood-legend">
                <span className="emb-t2m__legend-scale">
                  score is between <strong>0</strong> and <strong>1</strong>
                </span>
                <span className="emb-t2m__legend-item emb-t2m__legend-item--pos">
                  &gt; 0.5 = Positive
                </span>
                <span className="emb-t2m__legend-item emb-t2m__legend-item--neg">
                  &lt; 0.5 = Negative
                </span>
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      {stage === "idle" && (
        <div className="ml__footer">
          <button className="btn btn--primary" onClick={startTrain}>
            Train the model →
          </button>
        </div>
      )}

      {stage === "training" && phase < 4 && (
        <div className="emb-nn__status">
          classifying example #{stepIdx + 1} of {demos.length}…
        </div>
      )}

      {stage === "training" && phase >= 4 && (
        <div className="ml__footer">
          <button className="btn btn--primary" onClick={nextStep}>
            {stepIdx < demos.length - 1 ? "Next →" : "Keep training →"}
          </button>
        </div>
      )}

      {stage === "crunching" && (
        <div className="emb-nn__crunch">
          <div className="emb-nn__crunch-dots">
            <span>.</span><span>.</span><span>.</span>
          </div>
          <div className="emb-nn__crunch-text">
            training on <strong>{dataset.train.length}</strong> tweets
          </div>
        </div>
      )}

      {stage === "done" && result && (
        <>
          <div className="emb-nn__stats">
            <div className="emb-nn__stat">
              <div className="emb-nn__stat-num">{dataset.train.length}</div>
              <div className="emb-nn__stat-label">tweets in the training set</div>
            </div>
            <div className="emb-nn__stat emb-nn__stat--accent">
              <div className="emb-nn__stat-num">{Math.round(result.testAcc * 100)}%</div>
              <div className="emb-nn__stat-label">
                accuracy on the test set
                <div className="emb-nn__stat-sub">
                  ({dataset.test.length} unseen tweets — random would be 50%)
                </div>
              </div>
            </div>
          </div>

          <div className="emb-nn__weights-card">
            <div className="emb-nn__weights-title">
              How the model used your vectors
            </div>
            <div className="emb-nn__weights-sub">
              The two weights it learned, one for each axis you named. Your
              "<strong>{biggerAxis}</strong>" axis mattered more — it has the
              bigger weight.
            </div>
            <div className="emb-nn__weights">
              <div className="emb-nn__weight">
                <span className="emb-nn__weight-label">{xName}</span>
                <WeightBar value={result.model.w1} />
                <span className="emb-nn__weight-num">{fmt(result.model.w1)}</span>
              </div>
              <div className="emb-nn__weight">
                <span className="emb-nn__weight-label">{yName}</span>
                <WeightBar value={result.model.w2} />
                <span className="emb-nn__weight-num">{fmt(result.model.w2)}</span>
              </div>
            </div>
          </div>

          <div className="emb-nn__try">
            <div className="emb-nn__try-title">Try a tweet of your own</div>
            <div className="emb-nn__try-sub">
              The model only knows the <strong>{Object.keys(placements).length} words</strong> you
              placed. Anything else is ignored.
            </div>
            <div className="emb-nn__try-row">
              <textarea
                className="emb-nn__try-input"
                value={tryText}
                onChange={(e) => setTryText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    classifyTry();
                  }
                }}
                placeholder="e.g. i'm so tired and bored"
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
              <div className="emb-nn__try-empty">
                None of those words are in the 12 you placed. Try using words like{" "}
                <em>{Object.keys(placements).slice(0, 4).join(", ")}</em>.
              </div>
            )}
            {tryResult && !tryResult.empty && (
              <div className="emb-nn__try-result">
                <div className="emb-nn__try-line">
                  <span className="emb-nn__try-key">recognized</span>
                  <span className="emb-nn__try-words">
                    {tryResult.recognized.map((r) => (
                      <span key={r.word} className="emb-nn__try-word">{r.word}</span>
                    ))}
                  </span>
                </div>
                <div className="emb-nn__try-line">
                  <span className="emb-nn__try-key">tweet vector</span>
                  <span className="emb-nn__try-vec">
                    [{fmt(tryResult.avg[0])}, {fmt(tryResult.avg[1])}]
                  </span>
                </div>
                <div className="emb-nn__try-line">
                  <span className="emb-nn__try-key">score</span>
                  <span className={`emb-nn__try-score emb-nn__try-score--${tryResult.mood}`}>
                    {fmt(tryResult.score)} →{" "}
                    <strong>{tryResult.mood === "pos" ? "Positive" : "Negative"}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="ml__prompt ml__prompt--quiet">
            <div className="ml__prompt-body">
              Not bad for a model that only sees two numbers per tweet. Now
              imagine giving it <em>25</em> numbers per tweet — and letting
              a computer pick what each one means.
            </div>
          </div>

          <div className="ml__footer">
            <button className="btn btn--ghost" onClick={replay}>
              ↻ Replay
            </button>
            <button className="btn btn--primary" onClick={onAdvance}>
              Scale up to real word vectors →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function WeightBar({ value }) {
  const mag = Math.min(1, Math.abs(value) / 3);
  const pct = mag * 100;
  const sign = value >= 0 ? "pos" : "neg";
  return (
    <div className="emb-nn__bar">
      <div className={`emb-nn__bar-fill emb-nn__bar-fill--${sign}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
