import { useMemo, useState } from "react";
import Phone from "./Phone.jsx";
import { TEST_CORPUS, TRAIN_CORPUS } from "./smsData.js";
import { classify, train, buildScoreMap, evaluate } from "./classifier.js";

const SAMPLE_SIZE = 6;

// Predictions on a balanced sample. Students can click any unhighlighted word
// to add it to the bag, then re-run to see if accuracy improves.

export default function Test({ picks, setPicks, scoreMap, setScoreMap, onAdvance }) {
  const [activeMap, setActiveMap] = useState(scoreMap);
  const [pendingPicks, setPendingPicks] = useState({});
  const [seed] = useState(() => Math.floor(Math.random() * 1000));

  const fullAcc = useMemo(() => evaluate(activeMap, TEST_CORPUS), [activeMap]);

  const samples = useMemo(() => {
    const scored = TEST_CORPUS.map((m) => ({
      msg: m,
      ...classify(m.text, activeMap),
    }));

    const seededShuffle = (arr) => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = ((seed * 31 + i * 7) & 0x7fffffff) % (i + 1);
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const withHits = seededShuffle(scored.filter((p) => p.hits.length > 0));
    const noHits   = seededShuffle(scored.filter((p) => p.hits.length === 0));
    const wrong    = seededShuffle(scored.filter((p) => p.verdict !== p.msg.label && p.hits.length > 0));

    const out = [];
    const used = new Set();
    const add = (p) => { if (!used.has(p)) { used.add(p); out.push(p); } };

    for (const p of wrong.slice(0, 2)) add(p);
    for (const p of withHits) { if (out.length >= SAMPLE_SIZE - 1) break; add(p); }
    for (const p of noHits)   { if (out.length >= SAMPLE_SIZE) break; add(p); }

    return seededShuffle(out);
  }, [activeMap, seed]);

  const wordClass = (word) => {
    if (pendingPicks[word]) return "phone__word--picked";
    const score = activeMap[word];
    if (score === undefined) return "";
    return score >= 0 ? "phone__word--spam" : "phone__word--ham";
  };

  const toggleWord = (word) => {
    // Already trained on — can't toggle.
    if (activeMap[word] !== undefined) return;
    setPendingPicks((prev) => {
      const copy = { ...prev };
      if (copy[word]) delete copy[word];
      else copy[word] = true;
      return copy;
    });
  };

  const rerun = () => {
    const merged = { ...picks, ...pendingPicks };
    const rows = train(Object.keys(merged), TRAIN_CORPUS);
    const newMap = buildScoreMap(rows);
    setPicks(merged);
    setScoreMap(newMap);
    setActiveMap(newMap);
    setPendingPicks({});
  };

  const pendingCount = Object.keys(pendingPicks).length;

  return (
    <div className="ml">
      <div className="ml__prompt">
        <div className="ml__prompt-title">
          The model on {SAMPLE_SIZE} new messages it's never seen.
        </div>
        <div className="ml__prompt-body">
          <span className="pill pill--spam">Orange</span> words push toward spam,
          <span className="pill pill--ham"> green</span> words push toward legit. The model adds them up.
          <br />
          <strong>Click any other word</strong> to add it to your bag of words, then re-run to see if accuracy improves.
        </div>
      </div>

      <div className="accuracy-box">
        <div className="accuracy-box__label">Accuracy on all {TEST_CORPUS.length} test messages</div>
        <div className="accuracy-box__value">
          {(fullAcc.accuracy * 100).toFixed(0)}%
          <span className="accuracy-box__sub"> ({fullAcc.correct} of {fullAcc.total} correct)</span>
        </div>
      </div>

      <div className="test__list">
        {samples.map(({ msg, total, verdict, hits }, i) => {
          const right = verdict === msg.label;
          return (
            <div key={i} className="test__row">
              <Phone
                text={msg.text}
                onWordClick={toggleWord}
                getWordClass={wordClass}
                compact
              />
              <div className="test__verdict">
                <div className={`test__badge test__badge--${right ? "correct" : "wrong"}`}>
                  {right ? "✓ correct" : "✗ wrong"}
                </div>
                <div className="test__score">
                  total <strong>{total >= 0 ? "+" : ""}{total.toFixed(2)}</strong> → predicted <strong>{verdict === "spam" ? "spam" : "legit"}</strong>
                </div>
                <div className="test__truth">
                  actually <strong>{msg.label === "spam" ? "spam" : "legit"}</strong>
                </div>
                {hits.length > 0 && (
                  <div className="test__hits">
                    {hits.map((h, j) => (
                      <span
                        key={j}
                        className={`word-chip word-chip--sm word-chip--${h.score >= 0 ? "spam" : "ham"}`}
                      >
                        <span className="word-chip__word">{h.word}</span>
                        <span className="word-chip__count">×{h.count} ({h.score >= 0 ? "+" : ""}{h.score.toFixed(2)})</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="ml__prompt ml__prompt--quiet">
        <div className="ml__prompt-body">
          See a word that might help? <strong>Click it</strong> in any message above to add it to your bag of words, then re-run.
        </div>
      </div>

      <div className="ml__footer">
        {pendingCount > 0 && (
          <button className="btn btn--primary" onClick={rerun}>
            Re-run with {pendingCount} more word{pendingCount === 1 ? "" : "s"} →
          </button>
        )}
        <button className="btn" onClick={onAdvance}>
          What if we used way more words? →
        </button>
      </div>
    </div>
  );
}
