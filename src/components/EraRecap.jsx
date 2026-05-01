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
        <Reveal
          variant="next"
          title="What comes next?"
          prompt="What can you do from here?"
          body={
            <>
              <div className="recap__next-body">
                We'll find out together. In the meantime, a few things you can do:
              </div>
              <ul className="recap__next-list">
                <li>
                  <strong>Try building with AI.</strong> Many of the tools the pros
                  use are free or low-cost — <a href="https://huggingface.co/spaces" target="_blank" rel="noopener noreferrer">Hugging Face Spaces</a> hosts thousands of demos to poke at.
                </li>
                <li>
                  <strong>Pick up coding.</strong>{" "}
                  <a href="https://www.python.org/" target="_blank" rel="noopener noreferrer">Python</a>{" "}
                  runs a huge slice of the modern world, including most AI work.
                  New to coding? <a href="https://scratch.mit.edu/" target="_blank" rel="noopener noreferrer">Scratch</a> is a friendly first stop.
                </li>
                <li>
                  <strong>Follow AI in the news with a critical eye.</strong> When
                  is it being used well? When badly?
                </li>
                <li>
                  <strong>Talk about it.</strong> With friends, with teachers, even
                  with your representatives — AI policy is being written right now
                  and your voice can shape it.
                </li>
                <li>
                  <strong>Stay curious.</strong> The next era is being written as
                  you read this.
                </li>
              </ul>
            </>
          }
        />
      )}
    </div>
  );
}
