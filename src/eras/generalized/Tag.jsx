import { useEffect, useRef, useState } from "react";
import { PAIRS } from "./tagData.js";

// Stage 2 — pick an example, watch the model generate it, then give it
// a single thumbs-up / thumbs-down. A short "things to notice" list
// suggests what to look for. After voting, the designer's note explains.

const STEP_MS = 280;

const FACES = [
  { id: "awful",     emoji: "😢", label: "Awful"  },
  { id: "bad",       emoji: "😕", label: "Bad"    },
  { id: "mixed",     emoji: "😐", label: "Mixed"  },
  { id: "good",      emoji: "🙂", label: "Good"   },
  { id: "great",     emoji: "😄", label: "Great"  },
];
const POSITIVE_FACES = new Set(["good", "great"]);

function isWhitespace(w) { return /^\s+$/.test(w); }

export default function Tag({
  onAdvance,
  votes, setVotes,
  activeId, setActiveId,
  genStep, setGenStep,
}) {
  const [streamingId, setStreamingId] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const judgedCount = Object.keys(votes).length;

  if (!activeId) {
    return (
      <Picker
        votes={votes}
        onPick={(id) => setActiveId(id)}
        onAdvance={onAdvance}
        judgedCount={judgedCount}
      />
    );
  }

  const pair = PAIRS.find((p) => p.id === activeId);
  const contWordCount = pair.words.length - pair.promptWordCount;
  const step = genStep[pair.id] ?? 0;
  const hasGenerated = step > 0;
  const isStreaming = streamingId === pair.id;
  const fullyStreamed = step >= contWordCount;
  const myVote = votes[pair.id];

  const startGenerate = () => {
    clearInterval(intervalRef.current);
    setStreamingId(pair.id);
    setGenStep((s) => ({ ...s, [pair.id]: 0 }));
    intervalRef.current = setInterval(() => {
      setGenStep((s) => {
        const cur = s[pair.id] ?? 0;
        const nextStep = cur + 1;
        if (nextStep >= contWordCount) {
          clearInterval(intervalRef.current);
          setStreamingId((sid) => (sid === pair.id ? null : sid));
        }
        return { ...s, [pair.id]: nextStep };
      });
    }, STEP_MS);
  };

  const vote = (v) => {
    setVotes((prev) => ({ ...prev, [pair.id]: prev[pair.id] === v ? undefined : v }));
  };

  const backToPicker = () => {
    clearInterval(intervalRef.current);
    setStreamingId(null);
    setActiveId(null);
  };

  const latestAttention = step === 0 ? {} : (pair.attention?.[step - 1] || {});

  const renderedWords = pair.words.map((w, i) => {
    const visible = i < pair.promptWordCount + step;
    const isGenerated = i >= pair.promptWordCount;
    if (!isGenerated) {
      return isWhitespace(w)
        ? <span key={i}>{w}</span>
        : <span key={i} className="tag__w tag__w--prompt">{w}</span>;
    }
    if (!visible) return null;
    const isLatestGenerated = i === pair.promptWordCount + step - 1;
    const intensity = latestAttention[i] || 0;
    const style = intensity > 0
      ? { backgroundColor: `rgba(184, 83, 10, ${Math.min(0.55, intensity * 0.55)})` }
      : undefined;
    const cls = [
      "tag__w",
      "tag__w--gen",
      isLatestGenerated ? "tag__w--latest" : "",
      intensity > 0 ? "tag__w--attended" : "",
    ].filter(Boolean).join(" ");
    if (isWhitespace(w)) return <span key={i}>{w}</span>;
    return <span key={i} className={cls} style={style}>{w}</span>;
  });

  return (
    <div className="gen">
      <div className="tag__detail-header">
        <button className="btn btn--ghost btn--sm" onClick={backToPicker}>
          ← All examples
        </button>
        <div className="tag__detail-title">{pair.label}</div>
        <div className="tag__detail-progress">
          {judgedCount} of {PAIRS.length} rated
        </div>
      </div>

      <div className={`tag__stream ${pair.mono ? "tag__stream--mono" : ""}`}>
        {renderedWords}
        {!hasGenerated && (
          <span className="tag__stream-placeholder"> ___</span>
        )}
        {isStreaming && <span className="gen__cursor">▍</span>}
      </div>

      <div className="tag__stream-controls">
        {!hasGenerated && (
          <button className="btn btn--primary" onClick={startGenerate}>
            Generate →
          </button>
        )}
        {hasGenerated && !isStreaming && (
          <button className="btn btn--ghost btn--sm" onClick={startGenerate}>
            ↻ Replay
          </button>
        )}
        <span className="tag__source">
          source:{" "}
          {pair.sourceUrl ? (
            <a href={pair.sourceUrl} target="_blank" rel="noopener noreferrer">{pair.source}</a>
          ) : (
            <span>{pair.source}</span>
          )}
        </span>
      </div>

      {hasGenerated && pair.notice && pair.notice.length > 0 && (
        <div className="tag__notice">
          <ul className="tag__notice-list">
            {pair.notice.map((q, i) => <li key={i}>{q}</li>)}
          </ul>
        </div>
      )}

      {(fullyStreamed || step >= 6) && (
        <div className="tag__vote">
          <div className="tag__vote-q">Overall, how did the model do?</div>
          <div className="tag__vote-faces">
            {FACES.map((f) => (
              <button
                key={f.id}
                className={`tag__face ${myVote === f.id ? "tag__face--active" : ""}`}
                onClick={() => vote(f.id)}
                aria-label={f.label}
                title={f.label}
              >
                <span className="tag__face-emoji">{f.emoji}</span>
                <span className="tag__face-label">{f.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {myVote && pair.takeaway && (
        <div className="tag__takeaway">
          <div className="tag__takeaway-label">What the model actually did</div>
          <div className="tag__takeaway-body">{pair.takeaway}</div>
        </div>
      )}

      <div className="gen__footer">
        <button className="btn btn--ghost" onClick={backToPicker}>
          ← All examples
        </button>
        {myVote && (
          <button className="btn btn--primary" onClick={backToPicker}>
            Try another →
          </button>
        )}
      </div>
    </div>
  );
}

function Picker({ votes, onPick, onAdvance, judgedCount }) {
  return (
    <div className="gen">
      <div className="gen__prompt">
        <div className="gen__prompt-title">
          One model, many tasks — what did it learn?
        </div>
        <div className="gen__prompt-body">
          We didn't train a recipe model, a history model, a code model. The pretrained
          Transformer is <strong>one</strong> next-word predictor, trained on a big pile
          of text. Pick any example below. As each new word appears, highlighted words show what the model <strong>pays attention to</strong> from earlier in the text.
        </div>
      </div>

      <div className="tag__picker">
        {PAIRS.map((p) => {
          const v = votes[p.id];
          const face = v ? FACES.find((f) => f.id === v) : null;
          return (
            <button
              key={p.id}
              className={`tag__picker-card ${v ? "tag__picker-card--done" : ""}`}
              onClick={() => onPick(p.id)}
            >
              <span className="tag__picker-label">{p.label || p.id}</span>
              {face && <span className="tag__picker-check">{face.emoji}</span>}
            </button>
          );
        })}
      </div>

      <div className="gen__footer">
        <span className="gen__footer-hint">
          {judgedCount === 0
            ? "pick any example to start"
            : `${judgedCount} of ${PAIRS.length} rated`}
        </span>
        {judgedCount >= 3 && onAdvance && (
          <button className="btn btn--primary" onClick={onAdvance}>
            Done →
          </button>
        )}
      </div>
    </div>
  );
}
