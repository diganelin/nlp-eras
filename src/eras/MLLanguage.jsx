import { useMemo, useState } from "react";
import Label from "./ml/Label.jsx";
import Train from "./ml/Train.jsx";
import Test from "./ml/Test.jsx";
import Retrain from "./ml/Retrain.jsx";
import { TEST_CORPUS, sampleLabelingRounds } from "./ml/smsData.js";
import { evaluate } from "./ml/classifier.js";

const STEPS = [
  { id: "label",   label: "Spot the Spam" },
  { id: "train",   label: "Train a Model" },
  { id: "test",    label: "See Predictions" },
  { id: "retrain", label: "Use 100 Words" },
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
      <p className="eliza__intro">
        By the late 1990s, inboxes drowned in <strong>spam</strong>. Hand-written rules
        couldn't keep up. So researchers tried something new: turn text into <strong>numbers</strong>,
        and let math sort it out.
        <span className="eliza__intro-note">
          Messages based on the <a href="https://archive.ics.uci.edu/dataset/228/sms+spam+collection" target="_blank" rel="noopener noreferrer">UCI SMS Spam Collection</a>.
        </span>
      </p>

      <div className="eliza__stepper">
        {STEPS.map((s, i) => {
          const lockedTrain   = i === 1 && completedRounds < rounds.length;
          const lockedTest    = i === 2 && !scoreMap;
          const lockedRetrain = i === 3 && !scoreMap;
          const disabled = lockedTrain || lockedTest || lockedRetrain;
          return (
            <button
              key={s.id}
              className={`eliza__step ${i === stepIdx ? "eliza__step--active" : ""}`}
              onClick={() => !disabled && setStepIdx(i)}
              disabled={disabled}
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
      </div>
    </div>
  );
}
