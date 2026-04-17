import { useState } from "react";
import Place from "./embeddings/Place.jsx";
import Vectorize from "./embeddings/Vectorize.jsx";
import MiniNN from "./embeddings/MiniNN.jsx";
import Scale from "./embeddings/Scale.jsx";
import Classify from "./embeddings/Classify.jsx";

const STEPS = [
  { id: "place",      label: "Place the Words" },
  { id: "vectorize",  label: "Words → Numbers" },
  { id: "mini",       label: "Mini Neural Network" },
  { id: "scale",      label: "Scale Up" },
  { id: "classify",   label: "Classify at Scale" },
];

export default function Embeddings() {
  const [stepIdx, setStepIdx] = useState(0);
  const [placements, setPlacements] = useState({});   // { word: [x, y] }
  const [axisNames, setAxisNames] = useState({ x: "", xLow: "", y: "", yLow: "" });

  const current = STEPS[stepIdx];

  const placeReady = Object.keys(placements).length === 12 && axisNames.x && axisNames.y;

  return (
    <div className="eliza">
      <p className="eliza__intro">
        By the early 2010s, researchers found a way to turn words into <strong>numbers</strong> —
        not just counts, but numbers that captured <strong>meaning</strong>. Similar words got similar numbers.
        Suddenly, machines could do more than match text: they could compare ideas.
        <span className="eliza__intro-note">
          Based on{" "}
          <a
            href="https://nlp.stanford.edu/projects/glove/"
            target="_blank" rel="noopener noreferrer"
          >GloVe / word2vec-style word embeddings</a>. Tweets sampled from the{" "}
          <a
            href="http://help.sentiment140.com/"
            target="_blank" rel="noopener noreferrer"
          >Sentiment140 corpus</a>.
        </span>
      </p>

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
      </div>
    </div>
  );
}
