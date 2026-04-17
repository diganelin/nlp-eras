import { useEffect, useMemo, useRef, useState } from "react";
import { compileRules, createBot, findFirstMatch } from "./elizaEngine.js";
import { INITIALS, RULES, TEACHING_IDS } from "./elizaRules.js";

const TEACHING_SET = new Set(TEACHING_IDS);

// Test fixture: a short conversation that exercises a few teaching rules.
const PREBUILT_INPUTS = [
  "neck feels weird",
  "kind of hurts",
  "i had a massage yesterday",
  "yeah",
  "it's a big problem",
  "kind of? it's annoying",
];

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

  const prebuild = () => {
    botRef.current.reset();
    const seeded = [{ from: "bot", text: pickInitial(), ruleId: "greeting" }];
    for (const text of PREBUILT_INPUTS) {
      const result = botRef.current.transform(text);
      const teachingRuleId = findFirstMatch(text, teachingCompiled);
      seeded.push({ from: "user", text });
      seeded.push({
        from: "bot",
        text: result.text,
        ruleId: result.ruleId,
        teachingRuleId,
      });
    }
    setTranscript(seeded);
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
        onClick={prebuild}
        style={{ alignSelf: "flex-end", fontSize: 12, marginTop: 4, opacity: 0.6 }}
      >
        dev: prebuild conversation
      </button>
    </div>
  );
}
