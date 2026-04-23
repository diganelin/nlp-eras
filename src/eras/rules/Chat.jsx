import { useEffect, useMemo, useRef, useState } from "react";
import { compileRules, createBot, findFirstMatch } from "./elizaEngine.js";
import { INITIALS, RULES, TEACHING_IDS } from "./elizaRules.js";

const TEACHING_SET = new Set(TEACHING_IDS);

function pickInitial() {
  return INITIALS[Math.floor(Math.random() * INITIALS.length)];
}

export default function Chat({ compiledRules, transcript, setTranscript }) {
  const [input, setInput] = useState("");
  const messagesRef = useRef(null);
  const botRef = useRef(null);
  if (botRef.current === null) botRef.current = createBot(compiledRules);

  const teachingCompiled = useMemo(
    () => compileRules(RULES.filter((r) => TEACHING_SET.has(r.id))),
    [],
  );

  // Seed the conversation with a greeting on first mount.
  useEffect(() => {
    if (transcript.length === 0) {
      setTranscript([{ from: "bot", text: pickInitial(), ruleId: "greeting" }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [transcript]);

  const send = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg = { from: "user", text: trimmed };
    const result = botRef.current.transform(trimmed);
    const teachingRuleId = findFirstMatch(trimmed, teachingCompiled);
    const botMsg = {
      from: "bot",
      text: result.text,
      ruleId: result.ruleId,
      teachingRuleId,
    };
    setTranscript([...transcript, userMsg, botMsg]);
    setInput("");
  };

  const reset = () => {
    botRef.current.reset();
    setTranscript([{ from: "bot", text: pickInitial(), ruleId: "greeting" }]);
    setInput("");
  };

  return (
    <div className="chat">
      <div className="chat__messages" ref={messagesRef}>
        {transcript.map((m, i) => (
          <div
            key={i}
            className={`chat__msg chat__msg--${m.from}`}
          >
            {m.text}
          </div>
        ))}
      </div>
      <form
        className="chat__form"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          className="chat__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Talk to ELIZA…"
          autoFocus
        />
        <button type="submit" className="btn btn--primary">Send</button>
      </form>
      <button
        type="button"
        className="btn btn--ghost"
        onClick={reset}
        style={{ alignSelf: "flex-end", fontSize: 12, marginTop: 4 }}
      >
        ↻ Reset
      </button>
    </div>
  );
}
