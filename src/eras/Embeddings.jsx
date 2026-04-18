import { useState } from "react";
import Place from "./embeddings/Place.jsx";
import Vectorize from "./embeddings/Vectorize.jsx";
import MiniNN from "./embeddings/MiniNN.jsx";
import Scale from "./embeddings/Scale.jsx";
import Classify from "./embeddings/Classify.jsx";
import EraRecap from "../components/EraRecap.jsx";

const STEPS = [
  { id: "place",      label: "Place the Words" },
  { id: "vectorize",  label: "Words → Numbers" },
  { id: "mini",       label: "Mini Neural Network" },
  { id: "scale",      label: "Scale Up" },
  { id: "classify",   label: "Classify at Scale" },
  { id: "recap",      label: "Recap" },
];

export default function Embeddings() {
  const [stepIdx, setStepIdx] = useState(0);
  const [placements, setPlacements] = useState({});   // { word: [x, y] }
  const [axisNames, setAxisNames] = useState({ x: "", xLow: "", y: "", yLow: "" });

  const current = STEPS[stepIdx];

  const placeReady = Object.keys(placements).length === 9 && axisNames.x && axisNames.y;

  return (
    <div className="eliza">
      <div className="eliza__stepper">
        {STEPS.map((s, i) => {
          const locked =
            (i === 1 && !placeReady) ||
            (i === 2 && !placeReady) ||
            (i === 3 && !placeReady) ||
            (i === 4 && !placeReady);
          return (
            <button
              key={s.id}
              className={`eliza__step ${i === stepIdx ? "eliza__step--active" : ""}`}
              onClick={() => !locked && setStepIdx(i)}
              disabled={locked}
            >
              <span className="eliza__step-num">0{i + 1}</span>
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="eliza__stage">
        {current.id === "place" && (
          <Place
            placements={placements}
            setPlacements={setPlacements}
            axisNames={axisNames}
            setAxisNames={setAxisNames}
            onAdvance={() => setStepIdx(1)}
          />
        )}
        {current.id === "vectorize" && (
          <Vectorize
            placements={placements}
            axisNames={axisNames}
            onAdvance={() => setStepIdx(2)}
          />
        )}
        {current.id === "mini" && (
          <MiniNN
            placements={placements}
            axisNames={axisNames}
            onAdvance={() => setStepIdx(3)}
          />
        )}
        {current.id === "scale" && (
          <Scale onAdvance={() => setStepIdx(4)} />
        )}
        {current.id === "classify" && <Classify />}
        {current.id === "recap" && <EraRecap id="embeddings" />}
      </div>
    </div>
  );
}
