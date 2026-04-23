import { useState } from "react";
import RLHF from "./traininghard/RLHF.jsx";
import CodeFeedback from "./traininghard/CodeFeedback.jsx";
import Jailbreak from "./traininghard/Jailbreak.jsx";
import EraRecap from "../components/EraRecap.jsx";

const STEPS = [
  { id: "rlhf",      label: "Fine-tune with humans",  year: "2022" },
  { id: "code",      label: "Fine-tune with code",    year: "2024" },
  { id: "jailbreak", label: "Security check",                 year: "2026" },
  { id: "recap",     label: "Recap",                  year: "" },
];

export default function TrainingHard() {
  const [stepIdx, setStepIdx] = useState(0);
  const current = STEPS[stepIdx];
  const go = (i) => setStepIdx(i);

  return (
    <div className="eliza">
      <div className="eliza__stepper">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            className={`eliza__step ${i === stepIdx ? "eliza__step--active" : ""}`}
            onClick={() => go(i)}
          >
            <span className="eliza__step-num">0{i + 1}</span>
            {s.label}
            {s.year && <span className="thard-step-year">{s.year}</span>}
          </button>
        ))}
      </div>

      <div className="eliza__stage">
        {current.id === "rlhf"      && <RLHF onAdvance={() => go(1)} />}
        {current.id === "code"      && <CodeFeedback onAdvance={() => go(2)} />}
        {current.id === "jailbreak" && <Jailbreak onAdvance={() => go(3)} />}
        {current.id === "recap"     && <EraRecap id="traininghard" />}
      </div>
    </div>
  );
}
