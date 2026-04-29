import { ERAS } from "../erasData.js";

export default function Landing({ onStart }) {
  return (
    <div className="landing">
      <div className="landing__card">
        <p className="landing__tagline"><em>Curious about how machines learned to talk?</em></p>
        <h2 className="landing__title">The NLP Eras Tour</h2>
        <p className="landing__lede">
          A walk through <strong>five big ideas</strong> in <strong>NLP (Natural
          Language Processing)</strong> that shaped how computers use language,
          from the 1960s to today.
        </p>
        <ol className="landing__list">
          {ERAS.map((era, i) => (
            <li key={era.id}>
              <span className="landing__num">{i + 1}</span>
              <span className="landing__year">{era.year}</span>
              <span className="landing__label">{era.label}</span>
            </li>
          ))}
        </ol>
        <p className="landing__how">
          You'll work through each era's challenges and solutions through a
          series of games and activities.
        </p>
        <div className="landing__cta-row">
          <span className="landing__arrow" aria-hidden="true">←</span>
          <button className="btn btn--primary landing__btn" onClick={onStart}>
            Start with Era 1
          </button>
        </div>
        <p className="landing__hint">
          You can also click <strong>Era 1</strong> in the sidebar to begin.
        </p>
      </div>
    </div>
  );
}
