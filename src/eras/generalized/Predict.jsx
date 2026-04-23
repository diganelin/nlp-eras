import { useMemo, useState } from "react";
import { SNIPPETS } from "./predictData.js";

// Stage 1 — "You're the model": predict the next word.
// After typing a guess, students can optionally click 1–2 words in the
// text that most influenced their guess. This simulates what a model
// does while training: predict the next word, and notice which earlier
// words drove the prediction.

function normalize(s) {
  return s.trim().toLowerCase().replace(/[.,!?;:"'’]/g, "");
}

function tokenize(text) {
  // Keep whitespace + punctuation alongside words so we can render faithfully,
  // but only words (alphanumeric chunks) are clickable.
  const parts = text.split(/(\s+|[^\w'-]+)/g).filter(Boolean);
  return parts;
}

function shuffled(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const DECK_SIZE = 8;

export default function Predict({ onAdvance }) {
  const [deck] = useState(() => shuffled(SNIPPETS).slice(0, DECK_SIZE));
  const [idx, setIdx] = useState(0);
  const [guess, setGuess] = useState("");
  const [submittedGuesses, setSubmittedGuesses] = useState({}); // {snippetId: string}
  const [picks, setPicks] = useState({});    // {snippetId: Set of token indices}
  const [results, setResults] = useState({});

  const snippet = deck[idx];
  const result = results[snippet.id];
  const revealed = !!result;
  const isLast = idx === deck.length - 1;
  const myPicks = picks[snippet.id] || new Set();
  const submittedGuess = submittedGuesses[snippet.id] || null;
  const guessSubmitted = !!submittedGuess;

  const tokens = useMemo(() => tokenize(snippet.before), [snippet.id]);
  // Indices of clickable (word) tokens
  const wordIndices = useMemo(
    () => tokens.map((t, i) => ({ t, i })).filter(({ t }) => /^\w/.test(t)).map(({ i }) => i),
    [tokens]
  );

  const correctCount = useMemo(
    () => Object.values(results).filter((r) => r.correct).length,
    [results]
  );

  const togglePick = (i) => {
    if (revealed) return;
    if (!guessSubmitted) return;      // have to submit guess first
    const cur = new Set(myPicks);
    if (cur.has(i)) cur.delete(i);
    else if (cur.size < 3) cur.add(i);
    setPicks({ ...picks, [snippet.id]: cur });
  };

  const submitGuess = () => {
    const g = guess.trim();
    if (!g || guessSubmitted) return;
    setSubmittedGuesses({ ...submittedGuesses, [snippet.id]: g });
  };

  const isCorrectGuess = (g) => {
    const n = normalize(g);
    if (n === normalize(snippet.answer)) return true;
    return (snippet.acceptable || []).some((alt) => n === normalize(alt));
  };

  const handleReveal = () => {
    const g = submittedGuess || guess.trim();
    if (!g || myPicks.size < 1) return;
    setResults({
      ...results,
      [snippet.id]: { guess: g, correct: isCorrectGuess(g), pickedCount: myPicks.size },
    });
  };

  const handleNext = () => {
    if (idx < deck.length - 1) {
      setIdx(idx + 1);
      const next = deck[idx + 1];
      setGuess(submittedGuesses[next.id] || results[next.id]?.guess || "");
    }
  };
  const handleBack = () => {
    if (idx > 0) {
      setIdx(idx - 1);
      const prev = deck[idx - 1];
      setGuess(submittedGuesses[prev.id] || results[prev.id]?.guess || "");
    }
  };

  return (
    <div className="gen">
      <div className="gen__prompt">
        <div className="gen__prompt-title">Predict the next word</div>
        <div className="gen__prompt-body">
          {!revealed && !guessSubmitted && (
            <>
              Read the text. What word do you think comes next? <strong>Type your guess</strong> below and hit submit.
              <div className="gen__intro-note">
                This is what the model does during training: guess the next word, and <strong>pay attention</strong> to which earlier words helped.
              </div>
            </>
          )}
          {revealed && result.correct && <>Nailed it.</>}
        </div>
      </div>

      {guessSubmitted && !revealed && (
        <div className="instruct-callout">
          <span className="instruct-callout__badge">Next</span>
          <div className="instruct-callout__body">
            Your guess: <strong>"{submittedGuess}"</strong>. Now <strong>click 1–3 words</strong> in the text that the model would <strong>pay attention to</strong> for this prediction.
          </div>
          <span className="instruct-callout__arrow">↓</span>
        </div>
      )}

      <div className="gen__source">
        <span className="gen__source-pill">{snippet.register}</span>
        <span className="gen__source-label">Source:</span>
        {snippet.sourceUrl ? (
          <a href={snippet.sourceUrl} target="_blank" rel="noopener noreferrer">
            {snippet.source}
          </a>
        ) : (
          <span>{snippet.source}</span>
        )}
      </div>

      <div className={`gen__snippet ${snippet.mono ? "gen__snippet--mono" : ""}`}>
        {tokens.map((t, i) => {
          const clickable = /^\w/.test(t);
          const picked = myPicks.has(i);
          if (!clickable) return <span key={i}>{t}</span>;
          return (
            <span
              key={i}
              className={`gen__token ${picked ? "gen__token--picked" : ""} ${revealed ? "gen__token--locked" : ""} ${!guessSubmitted ? "gen__token--inactive" : ""}`}
              onClick={() => togglePick(i)}
              role="button"
            >{t}</span>
          );
        })}{" "}
        {!revealed && <span className="gen__blank">____</span>}
        {revealed && (
          <span className="gen__snippet-revealed">{snippet.continuation}</span>
        )}
      </div>

      {!revealed && !guessSubmitted && (
        <div className="gen__input-row">
          <input
            className="gen__input"
            type="text"
            value={guess}
            placeholder="your guess (one word)"
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submitGuess(); }}
            autoFocus
          />
          <button
            className="btn btn--primary"
            disabled={!guess.trim()}
            onClick={submitGuess}
          >
            Submit guess →
          </button>
        </div>
      )}

      {!revealed && guessSubmitted && (
        <div className="gen__input-row">
          <div className="gen__locked-guess">
            <span className="gen__locked-guess-label">Your guess:</span>
            <span className="gen__locked-guess-word">{submittedGuess}</span>
          </div>
          <button
            className="btn btn--primary"
            disabled={myPicks.size < 1}
            onClick={handleReveal}
          >
            Reveal the answer →
          </button>
          <span className="gen__pick-hint">
            {myPicks.size === 0
              ? "pick 1–3 words the model would pay attention to"
              : `${myPicks.size} word${myPicks.size > 1 ? "s" : ""} highlighted`}
          </span>
        </div>
      )}

      {revealed && (
        <div className="gen__reveal-row">
          <div className={`gen__reveal-guess ${result.correct ? "gen__reveal-guess--correct" : "gen__reveal-guess--wrong"}`}>
            <span className="gen__reveal-label">Your guess</span>
            <span className="gen__reveal-word">{result.guess}</span>
            <span className="gen__reveal-marker">{result.correct ? "✓" : "✗"}</span>
          </div>
          <div className="gen__reveal-actual">
            <span className="gen__reveal-label">Actual</span>
            <span className="gen__reveal-word">{snippet.answer}</span>
          </div>
        </div>
      )}

      <div className="gen__footer">
        {idx > 0 && (
          <button className="btn btn--ghost" onClick={handleBack}>← Back</button>
        )}
        {revealed && !isLast && (
          <button className="btn btn--primary" onClick={handleNext}>Next →</button>
        )}
        {revealed && isLast && (
          <button className="btn btn--primary" onClick={onAdvance}>
            Train a model on this →
          </button>
        )}
        {!revealed && (
          <button className="btn btn--ghost" onClick={handleNext} disabled={isLast}>
            Skip
          </button>
        )}
        {idx >= 3 && !isLast && (
          <button className="btn btn--ghost" onClick={onAdvance}>
            Skip ahead →
          </button>
        )}
        <span className="gen__footer-hint">
          {idx + 1} / {deck.length} · score {correctCount}
        </span>
      </div>
    </div>
  );
}
