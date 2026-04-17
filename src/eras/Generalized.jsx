import { useState } from "react";
import Predict from "./generalized/Predict.jsx";
import TrainAnim from "./generalized/TrainAnim.jsx";
import Tag from "./generalized/Tag.jsx";
import Generate from "./generalized/Generate.jsx";

const STEPS = [
  { id: "predict", label: "You're the Model" },
  { id: "train",   label: "Train on Everything" },
  { id: "tag",     label: "What Did It Learn?" },
  { id: "gen",     label: "Many Tasks, One Model" },
];

export default function Generalized() {
  const [stepIdx, setStepIdx] = useState(0);
  const [reachedStep, setReachedStep] = useState(0);
  const current = STEPS[stepIdx];

  const go = (i) => {
    setStepIdx(i);
    setReachedStep(Math.max(reachedStep, i));
  };

  return (
    <div className="eliza">
      <p className="eliza__intro">
        Training a new model for every new task was getting exhausting. Researchers
        noticed something simpler: when people talk, we just produce one word at a time.
        What if a machine learned to do <strong>just that</strong> — predict the next word —
        on every kind of text humans have ever written?
        <span className="eliza__intro-note">
          char-RNN samples from{" "}
          <a
            href="https://karpathy.github.io/2015/05/21/rnn-effectiveness/"
            target="_blank" rel="noopener noreferrer"
          >
            Karpathy, "The Unreasonable Effectiveness of RNNs" (2015)
          </a>. Fill-in-the-blank passages from Wikipedia, Project Gutenberg, and the CPython stdlib.
        </span>
      </p>

      <div className="eliza__stepper">
        {STEPS.map((s, i) => {
          const locked = i > reachedStep;
          return (
            <button
              key={s.id}
              className={`eliza__step ${i === stepIdx ? "eliza__step--active" : ""}`}
              onClick={() => !locked && go(i)}
              disabled={locked}
            >
              <span className="eliza__step-num">0{i + 1}</span>
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="eliza__stage">
        {current.id === "predict" && <Predict onAdvance={() => go(1)} />}
        {current.id === "train"   && <TrainAnim onAdvance={() => go(2)} />}
        {current.id === "tag"     && <Tag onAdvance={() => go(3)} />}
        {current.id === "gen"     && <Generate />}
      </div>
    </div>
  );
}
