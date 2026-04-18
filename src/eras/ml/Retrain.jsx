import { useEffect, useMemo, useState } from "react";
import { TRAIN_CORPUS, TEST_CORPUS, STOPWORDS } from "./smsData.js";
import { topCommonWords, train, buildScoreMap, evaluate } from "./classifier.js";

const TRAIN_MS = 1500;
const N_WORDS = 100;
const SAMPLE_SHOWN = 12;

export default function Retrain({ priorAccuracy, priorWordCount }) {
  const [phase, setPhase] = useState("running"); // "running" | "done"
  const [showAll, setShowAll] = useState(false);

  const words = useMemo(() => topCommonWords(TRAIN_CORPUS, STOPWORDS, N_WORDS), []);
  const rows = useMemo(() => train(words, TRAIN_CORPUS), [words]);
  const scoreMap = useMemo(() => buildScoreMap(rows), [rows]);
  const acc = useMemo(() => evaluate(scoreMap, TEST_CORPUS), [scoreMap]);

  useEffect(() => {
    const t = setTimeout(() => setPhase("done"), TRAIN_MS);
    return () => clearTimeout(t);
  }, []);

  const topSpam  = rows.slice(0, 10);
  const topLegit = [...rows].reverse().slice(0, 10);
  const sample   = words.slice(0, SAMPLE_SHOWN);

  const delta = priorAccuracy != null ? acc.accuracy - priorAccuracy : null;

  return (
    <div className="ml">
      {phase === "running" && (
        <div className="train__running">
          <div className="train__running-label">
            Picking the {N_WORDS} most common words from training messages…
            <br />
            (skipping stopwords like "the", "and", "to")
          </div>
          <div className="train__progress">
            <div className="train__progress-fill" />
          </div>
        </div>
      )}

      {phase === "done" && (
        <>
          <div className="ml__prompt">
            <div className="ml__prompt-title">
              What if we just used the {N_WORDS} most common words instead of picking by hand?
            </div>
            <div className="ml__prompt-body">
              We grabbed the top {N_WORDS} non-stopwords from the training set, counted spam vs legit
              for each, and turned them into scores — same recipe, just way more words.
            </div>
          </div>

          <div className="retrain__words">
            <div className="retrain__words-title">Sample of the {N_WORDS} words we used:</div>
            <div className="retrain__words-list">
              {(showAll ? words : sample).map((w) => (
                <span key={w} className="word-chip word-chip--neutral">
                  <span className="word-chip__word">{w}</span>
                </span>
              ))}
            </div>
            {!showAll && (
              <button className="btn btn--ghost retrain__show-all" onClick={() => setShowAll(true)}>
                Show all {N_WORDS} →
              </button>
            )}
          </div>

          <div className="retrain__compare">
            <div className="retrain__cell">
              <div className="retrain__cell-label">your bag of words</div>
              <div className="retrain__cell-value">
                {priorAccuracy != null ? `${(priorAccuracy * 100).toFixed(0)}%` : "—"}
              </div>
              <div className="retrain__cell-sub">
                {priorWordCount} word{priorWordCount === 1 ? "" : "s"}
              </div>
            </div>
            <div className="retrain__arrow">→</div>
            <div className="retrain__cell retrain__cell--highlight">
              <div className="retrain__cell-label">{N_WORDS} most common words</div>
              <div className="retrain__cell-value">
                {(acc.accuracy * 100).toFixed(0)}%
              </div>
              <div className="retrain__cell-sub">
                {acc.correct} of {acc.total} correct
                {delta != null && (
                  <span className={`retrain__delta ${delta >= 0 ? "retrain__delta--up" : "retrain__delta--down"}`}>
                    {" "}({delta >= 0 ? "+" : ""}{(delta * 100).toFixed(0)}pts)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="retrain__cols">
            <div className="retrain__col">
              <div className="retrain__col-title">most spammy words now</div>
              <div className="retrain__col-list">
                {topSpam.map((r) => (
                  <div key={r.word} className="word-chip word-chip--spam">
                    <span className="word-chip__word">{r.word}</span>
                    <span className="word-chip__count">
                      <span className="word-chip__count--spam">{r.spamCount} spam</span>
                      <span className="word-chip__count--ham"> · {r.legitCount} legit</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="retrain__col">
              <div className="retrain__col-title">most legit words now</div>
              <div className="retrain__col-list">
                {topLegit.map((r) => (
                  <div key={r.word} className="word-chip word-chip--ham">
                    <span className="word-chip__word">{r.word}</span>
                    <span className="word-chip__count">
                      <span className="word-chip__count--spam">{r.spamCount} spam</span>
                      <span className="word-chip__count--ham"> · {r.legitCount} legit</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </>
      )}
    </div>
  );
}
