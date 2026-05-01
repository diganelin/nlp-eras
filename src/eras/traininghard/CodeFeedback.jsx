import { useEffect, useState } from "react";
import { CODE_ROUNDS, AUTOMATION_STATS } from "./codeFeedbackData.js";

function shuffled(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Per-round nudge fired when the student submits with a wrong verdict.
// Each one points at the actual issue without giving the answer.
function codeHint(id) {
  switch (id) {
    case 1: return <>Count the r's in <em>strawberry</em> yourself.</>;
    case 2: return <>Area of a triangle = base × height ÷ 2. Did one of these skip the ÷ 2?</>;
    case 3: return <>Both answers say 964. An approximation can still be exactly right.</>;
    case 4: return <>Is an error message the desired result?</>;
    default: return null;
  }
}

function AnswerBody({ answer }) {
  if (answer.kind === "raw") {
    return <div className="thard-panel-body">{answer.text}</div>;
  }
  return (
    <div className="thard-panel-body thard-panel-body--mono">
      <div className="thard-codebox">
        <div className="thard-codebox-label">
          <span className="thard-codebox-label-icon">▶</span>
          ran Python code
        </div>
        <pre className="thard-code">{answer.code}</pre>
        <div className={`thard-code-output ${answer.isError ? "thard-code-output--error" : ""}`}>
          <span className="thard-code-output-label">
            {answer.isError ? "error:" : "output:"}
          </span>
          <span>{answer.output}</span>
        </div>
      </div>
    </div>
  );
}

function Panel({ letter, answer, verdict, onVerdict, locked }) {
  const cls = verdict === "right" ? "thard-panel--right" : verdict === "wrong" ? "thard-panel--wrong" : "";
  const header = answer.kind === "raw" ? "plain answer" : "with code";
  return (
    <div className={`thard-panel ${cls} ${locked ? "thard-panel--locked" : ""}`}>
      <div className="thard-panel-head">
        <span className="thard-panel-letter">Answer {letter}</span>
        <span className="thard-panel-kind">{header}</span>
      </div>
      <AnswerBody answer={answer} />
      <div className="thard-panel-verdict">
        <button
          className={`btn ${verdict === "right" ? "btn--primary" : "btn--ghost"}`}
          onClick={() => onVerdict("right")}
          disabled={locked}
        >
          ✓ Right
        </button>
        <button
          className={`btn ${verdict === "wrong" ? "btn--primary" : "btn--ghost"}`}
          onClick={() => onVerdict("wrong")}
          disabled={locked}
        >
          ✗ Wrong
        </button>
      </div>
    </div>
  );
}

export default function CodeFeedback({ onAdvance }) {
  const [deck] = useState(() => shuffled(CODE_ROUNDS));
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showAutomation, setShowAutomation] = useState(false);
  const [popupRoundId, setPopupRoundId] = useState(null);

  const round = deck[idx];
  const a = answers[round.id] || {};
  const submitted = !!a.submitted;
  const isLast = idx === deck.length - 1;

  const setField = (key, value) => {
    setAnswers((prev) => ({
      ...prev,
      [round.id]: { ...prev[round.id], [key]: value },
    }));
  };

  const submit = () => {
    if (!a.verdictA || !a.verdictB) return;
    const aOk = (a.verdictA === "right") === !!round.answerA.correct;
    const bOk = (a.verdictB === "right") === !!round.answerB.correct;
    const hint = codeHint(round.id);
    if ((!aOk || !bOk) && hint) {
      setPopupRoundId(round.id);
      return;
    }
    setField("submitted", true);
  };

  const confirmSubmit = () => {
    setField("submitted", true);
    setPopupRoundId(null);
  };
  const reconsiderVerdicts = () => {
    setAnswers((prev) => ({
      ...prev,
      [round.id]: { ...prev[round.id], verdictA: undefined, verdictB: undefined },
    }));
    setPopupRoundId(null);
  };

  const next = () => { if (idx < deck.length - 1) setIdx(idx + 1); };
  const back = () => { if (idx > 0) setIdx(idx - 1); };

  const completedCount = Object.values(answers).filter((x) => x.submitted).length;
  const envProgress = completedCount / deck.length;
  const kwhSoFar = Math.round(AUTOMATION_STATS.kwhUsed * envProgress * 0.001);
  const litersSoFar = Math.round(AUTOMATION_STATS.litersWater * envProgress * 0.001);

  if (showAutomation) return <Automation onAdvance={onAdvance} />;

  return (
    <div className="thard">
      <div className="thard-arena">
        <div className="thard-role">
          <span className="thard-role-tag">Your role</span>
          You are a <strong>grader program</strong> checking two AI-generated answers to the same problem. Mark each answer right or wrong. Some answers use a tool call: the AI wrote Python code, ran it, and used the output.
        </div>
        <div className="thard-worker-bar">
          <div className="thard-worker-main">
            <div className="thard-worker-avatar thard-worker-avatar--bot">⚙</div>
            <div className="thard-worker-info">
              <div className="thard-worker-name">
                <strong>You</strong> are now grading answers
              </div>
              <div className="thard-worker-sub">
                Two answers per problem. Mark each <em>right</em> or <em>wrong</em>.
              </div>
            </div>
          </div>
          <div className="thard-worker-earned">
            <div className="thard-worker-earned-label">Problems graded</div>
            <div className="thard-worker-earned-value">{completedCount} / {deck.length}</div>
          </div>
          <div className="thard-worker-side">
            <div className="thard-worker-side-label">Data-center draw (so far):</div>
            <div className="thard-worker-side-row">⚡ {kwhSoFar.toLocaleString()} kWh</div>
            <div className="thard-worker-side-row">💧 {litersSoFar.toLocaleString()} L cooling water</div>
          </div>
        </div>

        <div className="thard-round-head">
          <span className="thard-round-counter">Problem {idx + 1} of {deck.length}</span>
        </div>

        <div className="thard-prompt">
          <span className="thard-prompt-label">Prompt</span>
          <div className="thard-prompt-body">{round.prompt}</div>
        </div>

        <div className="thard-panel-grid">
          <Panel
            letter="A"
            answer={round.answerA}
            verdict={a.verdictA}
            onVerdict={(v) => !submitted && setField("verdictA", v)}
            locked={submitted}
          />
          <Panel
            letter="B"
            answer={round.answerB}
            verdict={a.verdictB}
            onVerdict={(v) => !submitted && setField("verdictB", v)}
            locked={submitted}
          />
        </div>

        {submitted && (
          <div className="thard-truth-strip">
            <span className="thard-truth-label">Truth:</span>
            <span className="thard-truth-body">{round.correctAnswer}</span>
          </div>
        )}

        <div className="thard-footer">
          {idx > 0 && <button className="btn btn--ghost" onClick={back}>← Back</button>}
          {!submitted && (
            <button
              className="btn btn--primary"
              onClick={submit}
              disabled={!a.verdictA || !a.verdictB}
            >
              Check
            </button>
          )}
          {submitted && !isLast && <button className="btn btn--primary" onClick={next}>Next →</button>}
          {submitted && isLast && (
            <button className="btn btn--primary" onClick={() => setShowAutomation(true)}>
              This can be automated →
            </button>
          )}
        </div>

        {popupRoundId === round.id && codeHint(round.id) && (
          <div className="thard-popup-overlay" onClick={reconsiderVerdicts}>
            <div className="thard-popup" onClick={(e) => e.stopPropagation()}>
              <div className="thard-popup__label">Careful —</div>
              <div className="thard-popup__body">{codeHint(round.id)}</div>
              <div className="thard-popup__actions">
                <button className="btn btn--ghost" onClick={reconsiderVerdicts}>
                  Let me reconsider
                </button>
                <button className="btn btn--primary" onClick={confirmSubmit}>
                  That's my answer →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Automation({ onAdvance }) {
  const [tick, setTick] = useState(0);
  const target = AUTOMATION_STATS.problemsSolved;
  const currentCount = Math.min(target, Math.floor((tick / 60) * target));
  const currentKwh = Math.round(AUTOMATION_STATS.kwhUsed * Math.min(1, tick / 60));
  const currentLiters = Math.round(AUTOMATION_STATS.litersWater * Math.min(1, tick / 60));

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => {
        if (t >= 60) { clearInterval(interval); return 60; }
        return t + 1;
      });
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const done = tick >= 60;

  return (
    <div className="thard thard-automation">
      <div className="thard-arena">
        <div className="thard-automation-blurb">
          <div className="thard-automation-blurb-title">Why this scales: code grades itself</div>
          <div className="thard-automation-blurb-body">
            Human feedback is slow and expensive. Code is different: write a problem with a verifiable
            answer (arithmetic, list sums, unit tests), have the AI solve it with a tool call, and a
            program checks instantly — right or wrong. Hundreds of millions of graded attempts become
            training signal, no humans needed.
          </div>
        </div>
        <div className="thard-automation-panel">
          <div className="thard-automation-stat">
            <div className="thard-automation-stat-label">Problems auto-graded</div>
            <div className="thard-automation-stat-value">{currentCount.toLocaleString()}</div>
          </div>
          <div className="thard-automation-stat">
            <div className="thard-automation-stat-label">Electricity</div>
            <div className="thard-automation-stat-value">{currentKwh.toLocaleString()} kWh</div>
          </div>
          <div className="thard-automation-stat">
            <div className="thard-automation-stat-label">Cooling water</div>
            <div className="thard-automation-stat-value">{currentLiters.toLocaleString()} L</div>
          </div>
        </div>
        <div className="thard-automation-caption">{AUTOMATION_STATS.caption}</div>
        {done && (
          <div className="thard-footer">
            <button className="btn btn--primary" onClick={onAdvance}>
              Next: security check →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
