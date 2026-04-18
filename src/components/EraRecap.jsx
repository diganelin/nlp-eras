import { ERAS } from "../erasData.js";

export default function EraRecap({ id }) {
  const era = ERAS.find((e) => e.id === id);
  if (!era) return null;
  return (
    <div className="recap">
      <div className="recap__box recap__box--idea">
        <div className="recap__label">Our new idea</div>
        <div className="recap__body">{era.newIdea}</div>
      </div>
      <div className="recap__box recap__box--problem">
        <div className="recap__label">Remaining problems</div>
        <div className="recap__body">{era.remainingProblems}</div>
      </div>
    </div>
  );
}
