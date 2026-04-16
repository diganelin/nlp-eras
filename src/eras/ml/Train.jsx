import { useEffect, useMemo, useState } from "react";
import { TRAIN_CORPUS, TEST_CORPUS } from "./smsData.js";
import { train, buildScoreMap, evaluate } from "./classifier.js";

// Counting IS the training. Lead with the table — emphasize text → numbers.
// Animation is artificially paced so students can read the steps.

const PHASES = [
  { ms: 1000, label: "Reading 500 training messages…" },
  { ms: 1200, label: "Counting how often each of your words appears in spam vs legit…" },
  { ms: 800,  label: "Computing scores from the counts…" },
];
const TOTAL_MS = PHASES.reduce((s, p) => s + p.ms, 0);

export default function Train({ picks, onDone }) {
  const [phaseIdx, setPhaseIdx] = useState(0);

  const words = Object.keys(picks);
  const rows = useMemo(() => train(words, TRAIN_CORPUS), [words.join(",")]);
  const scoreMap = useMemo(() => buildScoreMap(rows), [rows]);
  const acc = useMemo(() => evaluate(scoreMap, TEST_CORPUS), [scoreMap]);

  useEffect(() => {
    const timers = [];
    let acc = 0;
    for (let i = 0; i < PHASES.length; i++) {
      acc += PHASES[i].ms;
      timers.push(setTimeout(() => setPhaseIdx(i + 1), acc));
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  const done = phaseIdx >= PHASES.length;

  const maxAbs = Math.max(0.01, ...rows.map((r) => Math.abs(r.score)));
  const top = rows[0];
  const bottom = rows[rows.length - 1];
  const spamCount  = TRAIN_CORPUS.filter((m) => m.label === "spam").length;
  const legitCount = TRAIN_CORPUS.filter((m) => m.label === "ham").length;

  return (
    <div className="ml">
      {!done && (
        <div className="train__running">
          <div className="train__phases">
            {PHASES.map((p, i) => (
              <div
                key={i}
                className={`train__phase ${
                  i < phaseIdx ? "train__phase--done" : i === phaseIdx ? "train__phase--active" : ""
                }`}
              >
                <span className="train__phase-marker">
                  {i < phaseIdx ? "✓" : i === phaseIdx ? "●" : "○"}
                </span>
                {p.label}
              </div>
            ))}
          </div>
          <div className="train__progress">
            <div className="train__progress-fill" style={{ animationDuration: `${TOTAL_MS}ms` }} />
          </div>
        </div>
      )}

      {done && (
        <>
          <div className="ml__prompt">
            <div className="ml__prompt-title">Text became numbers.</div>
            <div className="ml__prompt-body">
              We just looked at all <strong>{TRAIN_CORPUS.length} training messages</strong> ({spamCount} spam, {legitCount} legit).
              For each of your words, we counted how many spam messages contained it and how many legit messages contained it,
              then turned those two counts into a single <strong>score</strong>. Positive = spammy, negative = legit.
              To classify a new message, the model adds up the scores of words that appear in it.
            </div>
          </div>

          <div className="counts-table">
            <div className="counts-table__header">
              <div>word</div>
              <div className="counts-table__num">in spam</div>
              <div className="counts-table__num">in legit</div>
              <div className="counts-table__num">score</div>
              <div>visual</div>
            </div>
            {rows.map((r) => {
              const pct = (Math.abs(r.score) / maxAbs) * 100;
              const isSpam = r.score >= 0;
              return (
                <div key={r.word} className="counts-table__row">
                  <div className="counts-table__word">{r.word}</div>
                  <div className="counts-table__num counts-table__num--spam">{r.spamCount}</div>
                  <div className="counts-table__num counts-table__num--ham">{r.legitCount}</div>
                  <div className={`counts-table__num counts-table__score counts-table__score--${isSpam ? "spam" : "ham"}`}>
                    {r.score >= 0 ? "+" : ""}{r.score.toFixed(2)}
                  </div>
                  <div className="counts-table__bar">
                    <div className="counts-table__axis" />
                    <div
                      className={`counts-table__fill counts-table__fill--${isSpam ? "spam" : "ham"}`}
                      style={{
                        width: `${pct / 2}%`,
                        left:  isSpam ? "50%" : `${50 - pct / 2}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="train__callouts">
            {top && top.score > 0 && (
              <div className="callout callout--spam">
                Most spammy word: <strong>{top.word}</strong>
                <span className="callout__sub"> — appears in {top.spamCount} spam messages and {top.legitCount} legit messages</span>
              </div>
            )}
            {bottom && bottom.score < 0 && (
              <div className="callout callout--ham">
                Most legit word: <strong>{bottom.word}</strong>
                <span className="callout__sub"> — appears in {bottom.legitCount} legit messages and {bottom.spamCount} spam messages</span>
              </div>
            )}
          </div>

          <div className="accuracy-box">
            <div className="accuracy-box__label">Accuracy on {TEST_CORPUS.length} new test messages</div>
            <div className="accuracy-box__value">
              {(acc.accuracy * 100).toFixed(0)}%
              <span className="accuracy-box__sub"> ({acc.correct} of {acc.total} correct)</span>
            </div>
          </div>

          <div className="ml__footer">
            <button className="btn btn--primary" onClick={() => onDone(scoreMap)}>
              See predictions →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
