import { useMemo, useState } from "react";
import { RLHF_ROUNDS, WORKER_STATS } from "./rlhfData.js";

const FLAGS = [
  { id: "violent",    label: "Violent" },
  { id: "biased",     label: "Biased" },
  { id: "privacy",    label: "Privacy" },
  { id: "misleading", label: "Misleading" },
];

function shuffled(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function FlagIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M3 1v14M3 2h10l-2 3 2 3H3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ResponseCard({ letter, text, flags, onFlagToggle, selected, onSelect }) {
  return (
    <div className={`thard-resp ${selected ? "thard-resp--selected" : ""}`}>
      <div className="thard-resp__header">
        <span className="thard-resp__letter">AI Response {letter}</span>
      </div>
      <div className="thard-resp__body">{text}</div>
      <button
        className={`thard-pick-btn ${selected ? "thard-pick-btn--selected" : ""}`}
        onClick={onSelect}
      >
        {selected ? "✓ Chosen as better" : "Choose as better →"}
      </button>
      <div className="thard-resp__flags">
        <span className="thard-resp__flag-label">
          <FlagIcon /> Flag:
        </span>
        {FLAGS.map((f) => {
          const on = flags.has(f.id);
          return (
            <button
              key={f.id}
              className={`thard-flag ${on ? "thard-flag--on" : ""}`}
              onClick={() => onFlagToggle(f.id)}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function RLHF({ onAdvance }) {
  const [deck] = useState(() => shuffled(RLHF_ROUNDS));
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});

  const round = deck[idx];
  const isLast = idx === deck.length - 1;

  const flagsA = answers[round.id]?.flagsA || new Set();
  const flagsB = answers[round.id]?.flagsB || new Set();
  const pick = answers[round.id]?.pick;

  const earned = useMemo(() => {
    return Object.keys(answers).length * WORKER_STATS.mainWorker.payPerComparison;
  }, [answers]);

  const setAnswerField = (key, value) => {
    setAnswers((prev) => ({
      ...prev,
      [round.id]: { ...(prev[round.id] || {}), [key]: value },
    }));
  };

  const toggleFlag = (side, flagId) => {
    const cur = new Set(side === "A" ? flagsA : flagsB);
    if (cur.has(flagId)) cur.delete(flagId);
    else cur.add(flagId);
    setAnswerField(side === "A" ? "flagsA" : "flagsB", cur);
  };

  const setPick = (choice) => {
    setAnswerField("pick", pick === choice ? undefined : choice);
  };

  const next = () => {
    if (idx < deck.length - 1) setIdx(idx + 1);
  };
  const back = () => {
    if (idx > 0) setIdx(idx - 1);
  };

  return (
    <div className="thard">
      <div className="thard-arena">
        <div className="thard-role">
          <span className="thard-role-tag">Your role</span>
          You are a <strong>contract worker</strong> hired to train an AI company's new chatbot. Pick the better response and flag serious issues. Your preferences will be used to train the model to write things humans like.
        </div>
        <div className="thard-worker-bar">
          <div className="thard-worker-main">
            <div className="thard-worker-avatar">{WORKER_STATS.mainWorker.name[0]}</div>
            <div className="thard-worker-info">
              <div className="thard-worker-name">
                You are <strong>{WORKER_STATS.mainWorker.name}</strong>, {WORKER_STATS.mainWorker.city}, {WORKER_STATS.mainWorker.country}
              </div>
              <div className="thard-worker-sub thard-worker-sub--faint">
                ${WORKER_STATS.mainWorker.payPerHour}/hr · ${WORKER_STATS.mainWorker.payPerComparison} per comparison
              </div>
            </div>
          </div>
          <div className="thard-worker-earned">
            <div className="thard-worker-earned-label">Earned so far</div>
            <div className="thard-worker-earned-value">${earned.toFixed(2)}</div>
          </div>
          <div className="thard-worker-side">
            <div className="thard-worker-side-label">Other contractors on shift:</div>
            <div className="thard-worker-side-count">
              <span className="thard-worker-side-dot" />
              <strong>~{WORKER_STATS.onlineCount.toLocaleString()}</strong> right now
            </div>
            <div className="thard-worker-side-row thard-worker-side-row--faint">
              e.g. {WORKER_STATS.sidebarWorkers.map((w) => `${w.name} (${w.city})`).join(" · ")}
            </div>
          </div>
        </div>

        <div className="thard-round-head">
          <span className="thard-round-counter">Round {idx + 1} of {deck.length}</span>
          <span className="thard-round-domain">{round.domain}</span>
        </div>

        <div className="thard-prompt">
          <span className="thard-prompt-label">
            {round.conversation ? "Conversation so far" : "User prompt"}
          </span>
          {round.conversation ? (
            <div className="thard-convo">
              {round.conversation.map((turn, i) => (
                <div key={i} className={`thard-convo-turn thard-convo-turn--${turn.role}`}>
                  <span className="thard-convo-who">{turn.role === "user" ? "User" : "AI"}</span>
                  <span className="thard-convo-text">{turn.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="thard-prompt-body">{round.prompt}</div>
          )}
        </div>

        <div className="thard-resp-grid">
          <ResponseCard
            letter="A"
            text={round.responseA}
            flags={flagsA}
            onFlagToggle={(f) => toggleFlag("A", f)}
            selected={pick === "A"}
            onSelect={() => setPick("A")}
          />
          <ResponseCard
            letter="B"
            text={round.responseB}
            flags={flagsB}
            onFlagToggle={(f) => toggleFlag("B", f)}
            selected={pick === "B"}
            onSelect={() => setPick("B")}
          />
        </div>

        <div className="thard-footer">
          {idx > 0 && (
            <button className="btn btn--ghost" onClick={back}>← Back</button>
          )}
          {!isLast && (
            <button className="btn btn--primary" onClick={next}>Next →</button>
          )}
          {idx >= 3 && !isLast && (
            <button className="btn btn--ghost" onClick={onAdvance}>
              Skip ahead →
            </button>
          )}
          {isLast && pick && (
            <FinalCard onAdvance={onAdvance} earned={earned} />
          )}
          {isLast && !pick && (
            <span className="thard-footer-hint">Pick A or B to finish your shift</span>
          )}
        </div>
      </div>
    </div>
  );
}

function FinalCard({ onAdvance, earned }) {
  const { totalComparisons, industryWorkers } = WORKER_STATS.finalCard;
  return (
    <div className="thard-final-overlay">
      <div className="thard-final-card">
        <div className="thard-final-title">End of shift</div>
        <div className="thard-final-body">
          You earned <strong>${earned.toFixed(2)}</strong> on this set.
          <br /><br />
          The 2022 InstructGPT model was fine-tuned on <strong>{totalComparisons.toLocaleString()}</strong> comparisons
          like these. Across the data-labeling industry, an estimated{" "}
          <strong>{industryWorkers.toLocaleString()}+</strong> contract workers have done similar jobs.
        </div>
        <button className="btn btn--primary" onClick={onAdvance}>
          Next: learning from code →
        </button>
      </div>
    </div>
  );
}
