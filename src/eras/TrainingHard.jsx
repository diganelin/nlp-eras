import { useState } from "react";
import RLHF from "./traininghard/RLHF.jsx";
import CodeFeedback from "./traininghard/CodeFeedback.jsx";
import Jailbreak from "./traininghard/Jailbreak.jsx";
import Credits from "./traininghard/Credits.jsx";

const STEPS = [
  { id: "rlhf",    label: "Learning from Humans",  year: "2022" },
  { id: "code",    label: "Learning From Code",    year: "2024" },
  { id: "jailbreak", label: "Breaking the Defenses", year: "2026" },
  { id: "credits",   label: "Credits",             year: "" },
];

export default function TrainingHard() {
  const [stepIdx, setStepIdx] = useState(0);
  const current = STEPS[stepIdx];
  const go = (i) => setStepIdx(i);

  return (
    <div className="eliza">
      <p className="eliza__intro">
        The model works — it predicts the next word better than anyone expected.
        But left alone, it also happily writes fake news, bad medical advice, or
        how to hurt someone. So the next question: how do we <strong>shape</strong> what it says?
        2022 to today, three answers in sequence.
      </p>

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
        {current.id === "credits"   && <Credits />}
      </div>
    </div>
  );
}
