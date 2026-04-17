import { useState } from "react";
import { SNIPPETS } from "./predictData.js";

export default function Predict({ onAdvance }) {
  const [idx, setIdx] = useState(0);
  const [guess, setGuess] = useState("");
  const [revealed, setRevealed] = useState({});
  const snippet = SNIPPETS[idx];
  const isRevealed = revealed[snippet.id];
  const isLast = idx === SNIPPETS.length - 1;

  const handleReveal = () => {
    if (!guess.trim()) return;
    setRevealed({ ...revealed, [snippet.id]: guess });
  };

  const handleNext = () => {
    if (idx < SNIPPETS.length - 1) {
      setIdx(idx + 1);
      setGuess("");
    }
  };

  const handleBack = () => {
    if (idx > 0) {
      setIdx(idx - 1);
      setGuess(revealed[SNIPPETS[idx - 1].id] || "");
    }
  };

  return (
    <div className="gen">
      <div className="gen__prompt">
        <div className="gen__prompt-title">Predict the next word</div>
        <div className="gen__prompt-body">
          {!isRevealed && (
            <>
              Read the text. What word comes next? You only get one guess — then we'll show you the actual continuation.
            </>
          )}
          {isRevealed && (
            <>
              Here's what actually came next. How much did you have to <em>know</em> to guess well?
            </>
          )}
        </div>
      </div>

      <div className="gen__source">
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
        <span className="gen__snippet-text">{snippet.before}</span>{" "}
        {!isRevealed && <span className="gen__blank">____</span>}
        {isRevealed && (
          <span className="gen__snippet-revealed">{snippet.continuation}</span>
        )}
      </div>

      {!isRevealed && (
        <div className="gen__input-row">
          <input
            className="gen__input"
            type="text"
            value={guess}
            placeholder="your guess (one word)"
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleReveal();
            }}
            autoFocus
          />
          <button
            className="btn btn--primary"
            disabled={!guess.trim()}
            onClick={handleReveal}
          >
            Reveal →
          </button>
        </div>
      )}

      {isRevealed && (
        <div className="gen__reveal-row">
          <div className="gen__reveal-guess">
            <span className="gen__reveal-label">Your guess:</span>
            <span className="gen__reveal-word">{revealed[snippet.id]}</span>
          </div>
          <div className="gen__reveal-actual">
            <span className="gen__reveal-label">Actual:</span>
            <span className="gen__reveal-word">{snippet.answer}</span>
          </div>
        </div>
      )}

      <div className="gen__footer">
        {idx > 0 && (
          <button className="btn btn--ghost" onClick={handleBack}>
            ← Back
          </button>
        )}
        {isRevealed && !isLast && (
          <button className="btn btn--primary" onClick={handleNext}>
            Next snippet →
          </button>
        )}
        {isRevealed && isLast && (
          <button className="btn btn--primary" onClick={onAdvance}>
            Train a model on this →
          </button>
        )}
        <span className="gen__footer-hint">
          {idx + 1} / {SNIPPETS.length}
        </span>
      </div>
    </div>
  );
}
