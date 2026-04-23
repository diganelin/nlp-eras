import { useState } from "react";
import { ERAS } from "../erasData.js";

function Reveal({ variant, title, prompt, body }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      className={`recap__box recap__box--${variant} ${open ? "recap__box--open" : ""}`}
      onClick={() => setOpen((v) => !v)}
    >
      <div className="recap__label">{title}</div>
      {!open && (
        <div className="recap__prompt">
          {prompt}
          <span className="recap__reveal-hint">click to reveal →</span>
        </div>
      )}
      {open && <div className="recap__body">{body}</div>}
    </button>
  );
}

export default function EraRecap({ id }) {
  const era = ERAS.find((e) => e.id === id);
  if (!era) return null;
  const isLastEra = id === "traininghard";
  return (
    <div className="recap-wrap">
      <div className="recap">
        <Reveal
          variant="idea"
          title="What have we learned to do?"
          prompt="Think back on the activity — what new capability did this era unlock?"
          body={era.newIdea}
        />
        <Reveal
          variant="problem"
          title="What problems remain?"
          prompt="What's still missing or broken at the end of this era?"
          body={era.remainingProblems}
        />
      </div>
      {isLastEra && (
        <div className="recap__next">
          <div className="recap__next-label">What comes next?</div>
          <div className="recap__next-body">We'll find out together!</div>
        </div>
      )}
    </div>
  );
}
