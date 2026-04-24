import { useMemo, useState } from "react";
import Chat from "./rules/Chat.jsx";
import MatchGame from "./rules/MatchGame.jsx";
import BuildRule from "./rules/BuildRule.jsx";
import { RULES } from "./rules/elizaRules.js";
import { compileRules } from "./rules/elizaEngine.js";
import EraRecap from "../components/EraRecap.jsx";

const STEPS = [
  { id: "chat",  label: "Chat with ELIZA" },
  { id: "match", label: "Match the Rule" },
  { id: "build", label: "Build Your Own" },
  { id: "recap", label: "Recap" },
];

export default function Rules() {
  const compiledRules = useMemo(() => compileRules(RULES), []);
  const [stepIdx, setStepIdx] = useState(0);
  const [transcript, setTranscript] = useState([]);

  const current = STEPS[stepIdx];

  return (
    <div className="eliza">
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
            onAdvance={() => setStepIdx(1)}
          />
        )}
        {current.id === "match" && (
          <MatchGame
            transcript={transcript}
            onComplete={() => setStepIdx(2)}
          />
        )}
        {current.id === "build" && <BuildRule />}
        {current.id === "recap" && <EraRecap id="rules" />}
      </div>
    </div>
  );
}
