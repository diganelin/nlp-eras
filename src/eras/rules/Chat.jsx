import { useEffect, useRef, useState } from "react";
import { respond } from "./elizaEngine.js";

const SUGGESTIONS = ["I want…", "I am…", "I dreamed…"];

export default function Chat({ compiledRules, transcript, setTranscript }) {
  const [input, setInput] = useState("");
  const messagesRef = useRef(null);
  const inputRef = useRef(null);

  const prefill = (text) => {
    const stripped = text.replace(/…|\.\.\.$/g, "").trim();
    setInput(stripped + " ");
    inputRef.current?.focus();
  };

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [transcript]);

  const send = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg = { from: "user", text: trimmed };
    const result = respond(trimmed, compiledRules);
    const botMsg = { from: "bot", text: result.text, ruleId: result.ruleId };
    setTranscript([...transcript, userMsg, botMsg]);
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
      <div className="chat__suggestions">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            className="chat__suggestion"
            onClick={() => prefill(s)}
          >
            {s}
          </button>
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
          ref={inputRef}
          className="chat__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Talk to ELIZA…"
          autoFocus
        />
        <button type="submit" className="btn btn--primary">Send</button>
      </form>
    </div>
  );
}
