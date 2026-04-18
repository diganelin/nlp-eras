import { useState } from "react";
import Predict from "./generalized/Predict.jsx";
import TrainAnim from "./generalized/TrainAnim.jsx";
import Tag from "./generalized/Tag.jsx";
import EraRecap from "../components/EraRecap.jsx";

const STEPS = [
  { id: "predict", label: "You're the Model" },
  { id: "train",   label: "Train on Everything" },
  { id: "tag",     label: "What Did It Learn?" },
  { id: "recap",   label: "Recap" },
];

export default function Generalized() {
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
          </button>
        ))}
      </div>

      <div className="eliza__stage">
        {current.id === "predict" && <Predict onAdvance={() => go(1)} />}
        {current.id === "train"   && <TrainAnim onAdvance={() => go(2)} />}
        {current.id === "tag"     && <Tag />}
        {current.id === "recap"   && <EraRecap id="generative" />}
      </div>
    </div>
  );
}
