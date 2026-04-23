import { useMemo, useState } from "react";
import Phone from "./Phone.jsx";
import { tokenize } from "./classifier.js";

// Each round: pick which phone is spam, then click words across either phone
// to add them to the bag of words. Picks persist across rounds.

export default function Label({ rounds, picks, setPicks, completedRounds, setCompletedRounds, onReady }) {
  const [roundIdx, setRoundIdx] = useState(0);
  // Per-round state kept in arrays so back/next preserves it.
  const [pickedSides, setPickedSides] = useState({});         // {roundIdx: "spam"|"ham"}
  const [roundStartCounts, setRoundStartCounts] = useState({}); // {roundIdx: number}
  const layouts = useMemo(
    () => rounds.map(() => (Math.random() < 0.5 ? "LR" : "RL")),
    []
  );

  const round = rounds[roundIdx];
  const layout = layouts[roundIdx];
  const leftLabel  = layout === "LR" ? "spam" : "ham";
  const rightLabel = layout === "LR" ? "ham"  : "spam";
  const leftText   = layout === "LR" ? round.spam : round.ham;
  const rightText  = layout === "LR" ? round.ham  : round.spam;

  const pickedSide = pickedSides[roundIdx] || null;
  const revealed = pickedSide !== null;
  const gotItRight = pickedSide === "spam";

  const pickList = Object.keys(picks);
  const startCount = roundStartCounts[roundIdx] ?? pickList.length;
  const addedThisRound = pickList.length - startCount;

  const handlePick = (side) => {
    setPickedSides({ ...pickedSides, [roundIdx]: side });
    if (roundStartCounts[roundIdx] === undefined) {
      setRoundStartCounts({ ...roundStartCounts, [roundIdx]: pickList.length });
    }
  };

  const toggleWord = (word) => {
    if (!revealed) return;
    setPicks((prev) => {
      const copy = { ...prev };
      if (copy[word]) delete copy[word];
      else copy[word] = true;
      return copy;
    });
  };

  const removeWord = (word) => {
    setPicks((prev) => {
      const copy = { ...prev };
      delete copy[word];
      return copy;
    });
  };

  const wordClass = (word) => (picks[word] ? "phone__word--picked" : "");

  // Count across the messages the student has actually seen (revealed rounds).
  const seenRoundIdxs = Object.keys(pickedSides).map(Number);
  const counts = useMemo(() => {
    const out = {};
    const seenSpam  = seenRoundIdxs.map((i) => rounds[i].spam);
    const seenLegit = seenRoundIdxs.map((i) => rounds[i].ham);
    for (const word of pickList) {
      let s = 0, l = 0;
      for (const t of seenSpam)  if (tokenize(t).includes(word)) s++;
      for (const t of seenLegit) if (tokenize(t).includes(word)) l++;
      out[word] = { spam: s, legit: l };
    }
    return out;
  }, [pickList.join(","), seenRoundIdxs.join(",")]);

  const isLast = roundIdx === rounds.length - 1;
  const canAdvance = revealed && addedThisRound >= 1;

  const next = () => {
    setCompletedRounds(Math.max(completedRounds, roundIdx + 1));
    if (roundIdx < rounds.length - 1) setRoundIdx(roundIdx + 1);
  };

  const back = () => {
    if (roundIdx > 0) setRoundIdx(roundIdx - 1);
  };

  const train = () => {
    setCompletedRounds(rounds.length);
    onReady();
  };

  const skipAhead = () => {
    // Complete remaining rounds programmatically: pick spam correctly, add a
    // sensible default bag of words (top spammy tokens from unseen rounds).
    const nextPickedSides = { ...pickedSides };
    const nextStartCounts = { ...roundStartCounts };
    const currentStart = pickList.length;
    for (let i = 0; i < rounds.length; i++) {
      if (nextPickedSides[i] === undefined) nextPickedSides[i] = "spam";
      if (nextStartCounts[i] === undefined) nextStartCounts[i] = currentStart;
    }
    setPickedSides(nextPickedSides);
    setRoundStartCounts(nextStartCounts);
    const defaultWords = ["free", "win", "txt", "urgent", "click", "prize", "call", "reply"];
    setPicks((prev) => {
      const copy = { ...prev };
      for (const w of defaultWords) copy[w] = true;
      return copy;
    });
    setCompletedRounds(rounds.length);
    onReady();
  };

  return (
    <div className="ml">
      <div className="ml__prompt">
        {!revealed && (
          <>
            <div className="ml__prompt-title">Round {roundIdx + 1} of {rounds.length}</div>
            <div className="ml__prompt-body">One of these is spam. Which one?</div>
          </>
        )}
        {revealed && (
          <>
            <div className="ml__prompt-title">
              {gotItRight ? "Nice — you got it." : "Actually, the other one was spam."}
            </div>
            <div className="ml__prompt-body">
              Now <strong>pick at least one word from either message</strong> to add to your bag of words.
            </div>
          </>
        )}
      </div>

      <div className="ml__phones">
        <div className="ml__phone-slot">
          <Phone
            text={leftText}
            onWordClick={revealed ? toggleWord : undefined}
            getWordClass={wordClass}
            highlight={revealed ? leftLabel : undefined}
          />
          {revealed && (
            <div className={`ml__label ml__label--${leftLabel}`}>
              {leftLabel === "spam" ? "spam" : "legit"}
            </div>
          )}
          {!revealed && (
            <button className="ml__pick-btn" onClick={() => handlePick(leftLabel)}>
              This one is spam
            </button>
          )}
        </div>

        <div className="ml__phone-slot">
          <Phone
            text={rightText}
            onWordClick={revealed ? toggleWord : undefined}
            getWordClass={wordClass}
            highlight={revealed ? rightLabel : undefined}
          />
          {revealed && (
            <div className={`ml__label ml__label--${rightLabel}`}>
              {rightLabel === "spam" ? "spam" : "legit"}
            </div>
          )}
          {!revealed && (
            <button className="ml__pick-btn" onClick={() => handlePick(rightLabel)}>
              This one is spam
            </button>
          )}
        </div>
      </div>

      <div className="ml__features">
        <div className="ml__features-title">Your bag of words ({pickList.length})</div>
        {pickList.length > 0 && (
          <div className="ml__features-sub">
            We count how often each of these words shows up in spam vs. legit messages — that's how
            the computer turns text into <strong>numbers</strong>.
          </div>
        )}
        {pickList.length === 0 && (
          <div className="ml__features-empty">
            No words yet. Click words in the messages above to add them.
          </div>
        )}
        {pickList.length > 0 && (
          <div className="ml__features-list">
            {pickList.map((word) => {
              const c = counts[word] || { spam: 0, legit: 0 };
              return (
                <div key={word} className="word-chip">
                  <span className="word-chip__word">{word}</span>
                  <span className="word-chip__count word-chip__count--spam">{c.spam} spam</span>
                  <span className="word-chip__count word-chip__count--ham">{c.legit} legit</span>
                  <button className="word-chip__remove" onClick={() => removeWord(word)}>×</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="ml__footer">
        {roundIdx > 0 && (
          <button className="btn btn--ghost" onClick={back}>← Back</button>
        )}
        {!isLast && (
          <button
            className="btn btn--primary"
            disabled={!canAdvance}
            onClick={next}
          >
            {!revealed ? "Pick spam first" :
             addedThisRound < 1 ? "Pick at least one word" :
             "Next round →"}
          </button>
        )}
        {isLast && (
          <button
            className="btn btn--primary"
            disabled={!canAdvance}
            onClick={train}
          >
            {!revealed ? "Pick spam first" :
             addedThisRound < 1 ? "Pick at least one word" :
             "Train the model →"}
          </button>
        )}
        {roundIdx >= 3 && !isLast && (
          <button className="btn btn--ghost" onClick={skipAhead}>
            Skip ahead →
          </button>
        )}
        <span className="ml__footer-hint">
          Round {roundIdx + 1} / {rounds.length}
        </span>
      </div>
    </div>
  );
}
