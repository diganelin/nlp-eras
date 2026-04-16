import { useMemo, useState } from "react";
import Chat from "./rules/Chat.jsx";
import MatchGame from "./rules/MatchGame.jsx";
import BuildRule from "./rules/BuildRule.jsx";
import { RULES } from "./rules/elizaRules.js";
import { compileRules } from "./rules/elizaEngine.js";

const STEPS = [
  { id: "chat",  label: "Chat with ELIZA" },
  { id: "match", label: "Match the Rule" },
  { id: "build", label: "Build Your Own" },
];

export default function Rules() {
  const compiledRules = useMemo(() => compileRules(RULES), []);
  const [stepIdx, setStepIdx] = useState(0);
  const [transcript, setTranscript] = useState([]);

  const current = STEPS[stepIdx];

  return (
    <div className="eliza">
      <p className="eliza__intro">
        In 1966, MIT professor Joseph Weizenbaum created <strong>ELIZA</strong> —
        one of the first programs people could have a conversation with. She
        played the role of a therapist. Some users were so convinced she
        understood them that Weizenbaum spent the rest of his career warning
        people about trusting computers too much.
        <span className="eliza__intro-note">
          <a href="https://www.masswerk.at/elizabot/" target="_blank" rel="noopener noreferrer">Try the original</a>.
        </span>
      </p>

      <div className="eliza__stepper">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            className={`eliza__step ${i === stepIdx ? "eliza__step--active" : ""}`}
            onClick={() => setStepIdx(i)}
          >
            <span className="eliza__step-num">0{i + 1}</span>
            {s.label}
          </button>
        ))}
      </div>

      <div className="eliza__stage">
        {current.id === "chat" && (
          <Chat
            compiledRules={compiledRules}
            transcript={transcript}
            setTranscript={setTranscript}
          />
        )}
        {current.id === "match" && (
          <MatchGame
            transcript={transcript}
            onComplete={() => setStepIdx(2)}
          />
        )}
        {current.id === "build" && <BuildRule />}
      </div>
    </div>
  );
}
