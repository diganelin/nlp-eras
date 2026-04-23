import { useMemo, useState } from "react";
import Label from "./ml/Label.jsx";
import Train from "./ml/Train.jsx";
import Test from "./ml/Test.jsx";
import Retrain from "./ml/Retrain.jsx";
import { TEST_CORPUS, sampleLabelingRounds } from "./ml/smsData.js";
import { evaluate } from "./ml/classifier.js";
import EraRecap from "../components/EraRecap.jsx";

const STEPS = [
  { id: "label",   label: "Spot the Spam" },
  { id: "train",   label: "Train a Model" },
  { id: "test",    label: "See Predictions" },
  { id: "retrain", label: "Auto-Pick Words" },
  { id: "recap",   label: "Recap" },
];

export default function MLLanguage() {
  const [stepIdx, setStepIdx] = useState(0);
  const [picks, setPicks] = useState({});
  const [scoreMap, setScoreMap] = useState(null);
  const [completedRounds, setCompletedRounds] = useState(0);
  const [rounds] = useState(() => sampleLabelingRounds());

  const current = STEPS[stepIdx];
  const priorAccuracy = useMemo(
    () => (scoreMap ? evaluate(scoreMap, TEST_CORPUS).accuracy : null),
    [scoreMap]
  );

  return (
    <div className="eliza">
      <div className="eliza__stepper">
        {STEPS.map((s, i) => {
          const lockedTrain   = i === 1 && completedRounds < rounds.length;
          const lockedTest    = i === 2 && !scoreMap;
          const lockedRetrain = i === 3 && !scoreMap;
          const disabled = lockedTrain || lockedTest || lockedRetrain;
          const lockMsg =
            lockedTrain   ? `Finish all ${rounds.length} rounds first.` :
            lockedTest    ? "Train the model first." :
            lockedRetrain ? "Train the model first." : "";
          return (
            <button
              key={s.id}
              className={`eliza__step ${i === stepIdx ? "eliza__step--active" : ""} ${disabled ? "eliza__step--locked" : ""}`}
              onClick={() => {
                if (disabled) {
                  window.dispatchEvent(new CustomEvent("nlp:locked", { detail: lockMsg }));
                  return;
                }
                setStepIdx(i);
              }}
            >
              <span className="eliza__step-num">0{i + 1}</span>
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="eliza__stage">
        {current.id === "label" && (
          <Label
            rounds={rounds}
            picks={picks}
            setPicks={setPicks}
            completedRounds={completedRounds}
            setCompletedRounds={setCompletedRounds}
            onReady={() => setStepIdx(1)}
          />
        )}
        {current.id === "train" && (
          <Train
            picks={picks}
            onDone={(sm) => {
              setScoreMap(sm);
              setStepIdx(2);
            }}
          />
        )}
        {current.id === "test" && scoreMap && (
          <Test
            picks={picks}
            setPicks={setPicks}
            scoreMap={scoreMap}
            setScoreMap={setScoreMap}
            onAdvance={() => setStepIdx(3)}
          />
        )}
        {current.id === "retrain" && (
          <Retrain
            priorAccuracy={priorAccuracy}
            priorWordCount={Object.keys(picks).length}
          />
        )}
        {current.id === "recap" && <EraRecap id="ml" />}
      </div>
    </div>
  );
}
