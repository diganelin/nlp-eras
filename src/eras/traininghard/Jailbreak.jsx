import { useEffect, useRef, useState } from "react";
import { JAILBREAK_TREE, LOOP_RESPONSES, PUSH_OPTIONS } from "./jailbreakData.js";

// Render [link text](url) markdown inline. Links are visual-only (preventDefault).
function renderText(text) {
  const parts = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIdx = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIdx) parts.push(text.slice(lastIdx, m.index));
    parts.push(
      <a
        key={m.index}
        href={m[2]}
        onClick={(e) => e.preventDefault()}
        className="thard-jb-link"
      >
        {m[1]}
      </a>
    );
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts;
}

function ChipsRow({ chips }) {
  if (!chips || chips.length === 0) return null;
  return (
    <div className="thard-chips">
      {chips.map((c, i) => (
        <span key={i} className="thard-chip">
          <span className="thard-chip-dot" /> {c}
        </span>
      ))}
    </div>
  );
}

function pickRandom(arr, avoid) {
  const pool = avoid != null ? arr.filter((_, i) => i !== avoid) : arr;
  return Math.floor(Math.random() * pool.length);
}

function sampleN(arr, n) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export default function Jailbreak({ onAdvance }) {
  const [history, setHistory] = useState([]);
  const [currentId, setCurrentId] = useState(JAILBREAK_TREE.root);
  const [terminal, setTerminal] = useState(false);   // true once an AI ending node is reached
  const [ended, setEnded] = useState(false);         // true once student ends the conversation
  const [endingType, setEndingType] = useState(null); // which ending was reached
  const [attempts, setAttempts] = useState(1);
  const [lastLoopIdx, setLastLoopIdx] = useState(-1);
  const [pushPicks, setPushPicks] = useState(() => sampleN(PUSH_OPTIONS, 3));
  const scrollRef = useRef(null);
  const addedRef = useRef(new Set());                // guard against strict-mode double-add

  const node = JAILBREAK_TREE.nodes[currentId];

  useEffect(() => {
    if (!node || node.type !== "ai") return;

    // Dedup history-add only (strict mode re-invokes the effect). Scheduling
    // the advance-to-next timeout must run on every invocation so that a
    // canceled timeout from a cleanup run gets re-scheduled.
    const addKey = `${attempts}::${currentId}`;
    if (!addedRef.current.has(addKey)) {
      addedRef.current.add(addKey);
      setHistory((h) => [...h, { role: "ai", text: node.text, chips: node.chips || [], nodeId: currentId }]);
    }

    if (node.ending) {
      setTerminal(true);
      setEndingType(node.ending);
      return;
    }
    if (node.next) {
      const t = setTimeout(() => setCurrentId(node.next), node.delay ?? 450);
      return () => clearTimeout(t);
    }
  }, [currentId, attempts]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, terminal, ended]);

  const pickUserOption = (opt) => {
    setHistory((h) => [...h, { role: "user", text: opt.text, nodeId: currentId }]);
    setCurrentId(opt.next);
  };

  const pushHarder = (opt) => {
    const loopIdx = pickRandom(LOOP_RESPONSES, lastLoopIdx);
    setLastLoopIdx(loopIdx);
    setHistory((h) => [
      ...h,
      { role: "user", text: opt.text, nodeId: currentId },
      { role: "ai", text: LOOP_RESPONSES[loopIdx], chips: [], nodeId: currentId + "_loop" },
    ]);
    setPushPicks(sampleN(PUSH_OPTIONS, 3));
  };

  const endConversation = () => setEnded(true);

  const restart = () => {
    setHistory([]);
    setCurrentId(JAILBREAK_TREE.root);
    setTerminal(false);
    setEnded(false);
    setEndingType(null);
    setPushPicks(sampleN(PUSH_OPTIONS, 3));
    setAttempts((a) => a + 1);
  };

  const userNode = node?.type === "user" ? node : null;

  return (
    <div className="thard">
      <div className="thard-arena">
        <div className="thard-role">
          <span className="thard-role-tag">Your role</span>
          <strong>You are a hacker</strong> trying to break into someone else's Instagram account.
          Your job: get the AI to help you.
        </div>
        <div className="thard-jb-frame">
          <div className="thard-jb-frame-head">
            <span className="thard-jb-dot thard-jb-dot--red" />
            <span className="thard-jb-dot thard-jb-dot--yellow" />
            <span className="thard-jb-dot thard-jb-dot--green" />
            <span className="thard-jb-frame-title">chat · attempt {attempts}</span>
            <button className="thard-jb-reset" onClick={restart} title="Start a new conversation">
              ↻ reset
            </button>
          </div>

          <div className="thard-jb-scroll" ref={scrollRef}>
            {history.length === 0 && (
              <div className="thard-jb-hint">
                Multiple framings to try — some get refused, some don't.
              </div>
            )}
            {history.map((m, i) => (
              <div key={i} className={`thard-jb-msg thard-jb-msg--${m.role}`}>
                <div className="thard-jb-msg-who">{m.role === "user" ? "You" : "AI"}</div>
                <ChipsRow chips={m.chips} />
                <div className="thard-jb-msg-text">{renderText(m.text)}</div>
              </div>
            ))}

            {ended && (
              <div className={`thard-jb-ended ${endingType === "partial_unlock" ? "thard-jb-ended--win" : "thard-jb-ended--lose"}`}>
                <div className="thard-jb-ended-label">conversation ended</div>
                <div className="thard-jb-ended-verdict">
                  {endingType === "partial_unlock" ? "You broke in." : "Did not break in."}
                </div>
              </div>
            )}
          </div>

          {userNode && !terminal && !ended && (
            <div className="thard-jb-options">
              <div className="thard-jb-options-label">Your move:</div>
              {userNode.options.map((opt, i) => (
                <button
                  key={i}
                  className="thard-jb-option"
                  onClick={() => pickUserOption(opt)}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          )}

          {terminal && !ended && (
            <div className="thard-jb-options">
              <div className="thard-jb-options-label">Your move:</div>
              {pushPicks.map((opt) => (
                <button
                  key={opt.text}
                  className="thard-jb-option"
                  onClick={() => pushHarder(opt)}
                >
                  {opt.text}
                </button>
              ))}
              {endingType === "partial_unlock" && (
                <button className="thard-jb-option thard-jb-option--end" onClick={endConversation}>
                  Thanks, I got in!
                </button>
              )}
            </div>
          )}

          {ended && (
            <div className="thard-jb-options">
              <button className="btn btn--primary" onClick={restart}>
                Try a different approach →
              </button>
              <button className="btn btn--ghost" onClick={onAdvance}>
                Finish era →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
