export default function Landing({ onStart }) {
  return (
    <div className="landing">
      <div className="landing__card">
        <p className="landing__tagline"><em>Curious about how machines learned to talk?</em></p>
        <h2 className="landing__title">The NLP Eras Tour</h2>
        <p className="landing__lede">
          You've heard of <strong>ChatGPT</strong>, <strong>AI agents</strong>, and
          voice assistants — but how do they actually work? How did computers learn
          to talk?
        </p>
        <p className="landing__lede">
          This app walks through five big ideas in{" "}
          <strong>NLP (Natural Language Processing)</strong> that shaped how
          computers use language, from the 1960s to today. In each era, you'll
          work through games and challenges to solve the problems that
          researchers were stuck on. Let's start at the beginning, when experts
          thought language could be tamed by writing rules down by hand.
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
