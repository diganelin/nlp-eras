import { useMemo, useState } from "react";
import CodeBlock from "./CodeBlock.jsx";
import { RULES } from "./elizaRules.js";

const ROUNDS = 3;

function pickRounds(transcript) {
  const exchanges = [];
  for (let i = 0; i < transcript.length - 1; i++) {
    const a = transcript[i];
    const b = transcript[i + 1];
    if (a.from === "user" && b.from === "bot" && b.ruleId) {
      exchanges.push({ user: a.text, bot: b.text, ruleId: b.ruleId });
    }
  }
  const interesting = exchanges.filter(
    (e) => e.ruleId !== "fallback" && e.ruleId !== "greeting"
  );
  const pool = interesting.length >= ROUNDS ? interesting : exchanges;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, ROUNDS);
}

export default function MatchGame({ transcript, onComplete }) {
  const rounds = useMemo(() => pickRounds(transcript), [transcript]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  if (rounds.length === 0) {
    return (
      <div className="match">
        <div className="match__prompt">
          <div className="match__line" style={{ color: "var(--text-muted)" }}>
            Have a chat with ELIZA in Step 1 first, then come back here.
          </div>
        </div>
      </div>
    );
  }

  const round = rounds[roundIdx];
  const correctId = round.ruleId;
  const isCorrect = submitted && selectedId === correctId;

  const submit = () => {
    if (!selectedId) return;
    setSubmitted(true);
  };

  const next = () => {
    if (roundIdx < rounds.length - 1) {
      setRoundIdx(roundIdx + 1);
      setSelectedId(null);
      setSubmitted(false);
    } else {
      onComplete();
    }
  };

  const tryAgain = () => {
    setSelectedId(null);
    setSubmitted(false);
  };

  return (
    <div className="match">
      <div className="match__prompt" style={{ position: "sticky", top: 0, zIndex: 1 }}>
        <div className="match__prompt-label">
          Round {roundIdx + 1} of {rounds.length} — Which rule produced this response?
        </div>
        <div className="match__exchange">
          <div className="match__line">
            <span className="match__line-label">YOU</span>
            {round.user}
          </div>
          <div className="match__line">
            <span className="match__line-label">ELIZA</span>
            {round.bot}
          </div>
        </div>

        {submitted && (
          <div
            className={`match__feedback ${
              isCorrect ? "match__feedback--correct" : "match__feedback--wrong"
            }`}
            style={{ marginTop: 12 }}
          >
            <span>{isCorrect ? "Correct!" : "Not quite — try again!"}</span>
            {isCorrect ? (
              <button className="btn btn--primary" onClick={next}>
                {roundIdx < rounds.length - 1 ? "Next round" : "Continue"}
              </button>
            ) : (
              <button className="btn" onClick={tryAgain}>
                Try again
              </button>
            )}
          </div>
        )}
      </div>

      <div className="match__rules">
        {RULES.map((rule) => (
          <CodeBlock
            key={rule.id}
            rule={rule}
            selected={selectedId === rule.id}
            onClick={!submitted ? () => setSelectedId(rule.id) : undefined}
            readonly={submitted}
          />
        ))}
      </div>

      {!submitted && (
        <div className="stage-footer" style={{ position: "sticky", bottom: 0, background: "var(--bg)", paddingBottom: 8, paddingTop: 12 }}>
          <span />
          <button
            className="btn btn--primary"
            onClick={submit}
            disabled={!selectedId}
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
}
