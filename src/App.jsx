import { useEffect, useState } from "react";
import "./App.css";
import Rules from "./eras/Rules.jsx";
import MLLanguage from "./eras/MLLanguage.jsx";
import Embeddings from "./eras/Embeddings.jsx";
import Generalized from "./eras/Generalized.jsx";
import TrainingHard from "./eras/TrainingHard.jsx";
import About from "./eras/About.jsx";
import Feedback from "./eras/Feedback.jsx";
import Logo from "./components/Logo.jsx";
import Landing from "./components/Landing.jsx";
import { ERAS } from "./erasData.js";

function EraTab({ era, num, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`era-tab ${active ? "era-tab--active" : ""}`}
    >
      <span className="era-tab__year">Era {num} · {era.year}</span>
      <span className="era-tab__label">{era.label}</span>
    </button>
  );
}

function EraIntro({ era }) {
  return (
    <div className="sidebar__intro">
      <div className="sidebar__intro-bigidea">{era.bigIdea}</div>
    </div>
  );
}

// Each era is rendered *once* and kept mounted. Visibility toggled with CSS
// so React state (step progress, picks, etc.) persists across tab switches.
function EraPanels({ activeId }) {
  return (
    <>
      <div className="era-slot" data-active={activeId === "rules"}><Rules /></div>
      <div className="era-slot" data-active={activeId === "ml"}><MLLanguage /></div>
      <div className="era-slot" data-active={activeId === "embeddings"}><Embeddings /></div>
      <div className="era-slot" data-active={activeId === "generative"}><Generalized /></div>
      <div className="era-slot" data-active={activeId === "traininghard"}><TrainingHard /></div>
    </>
  );
}

function BeginGate({ era, eraNum, onBegin }) {
  return (
    <div className="begin-gate">
      <div className="begin-gate__card">
        <div className="begin-gate__eyebrow">Era {eraNum} · {era.year}</div>
        <h2 className="begin-gate__title">{era.label}</h2>
        <div className="begin-gate__bigidea">{era.bigIdea}</div>
        <div className="begin-gate__text">{era.motivation}</div>
        <div className="begin-gate__activity">
          <span className="begin-gate__tag">In this era</span>
          {era.activity}
        </div>
        <button className="btn btn--primary begin-gate__btn" onClick={onBegin}>
          Begin Era {eraNum} →
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [activeId, setActiveId] = useState("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lockMsg, setLockMsg] = useState(null);
  const [gateDismissed, setGateDismissed] = useState(false);

  useEffect(() => {
    const onLocked = (e) => setLockMsg(e.detail || "Complete the previous section first.");
    window.addEventListener("nlp:locked", onLocked);
    return () => window.removeEventListener("nlp:locked", onLocked);
  }, []);

  useEffect(() => {
    if (!lockMsg) return;
    const t = setTimeout(() => setLockMsg(null), 2200);
    return () => clearTimeout(t);
  }, [lockMsg]);

  // Reset the begin-gate every time the user navigates to a different era
  // so the era's tagline shows again, even on revisit.
  useEffect(() => { setGateDismissed(false); }, [activeId]);

  const isAbout = activeId === "about";
  const isFeedback = activeId === "feedback";
  const isHome = activeId === "home";
  const activeEra = ERAS.find((e) => e.id === activeId);
  const showGate = activeEra && !isAbout && !isFeedback && !gateDismissed;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarCollapsed ? "sidebar--collapsed" : ""}`}>
        <button
          className="sidebar__collapse"
          onClick={() => setSidebarCollapsed((c) => !c)}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? "›" : "‹"}
        </button>
        <button
          type="button"
          className="sidebar__header"
          onClick={() => setActiveId("home")}
          title="Home"
        >
          <Logo size={30} className="sidebar__logo" />
          <div className="sidebar__title-block">
            <h1 className="sidebar__title">NLP Eras Tour</h1>
            <p className="sidebar__subtitle">How computers do language</p>
          </div>
        </button>
        <nav className="sidebar__nav">
          {ERAS.map((era, i) => (
            <EraTab
              key={era.id}
              era={era}
              num={i + 1}
              active={era.id === activeId}
              onClick={() => setActiveId(era.id)}
            />
          ))}
          <button
            className={`era-tab era-tab--about ${isAbout ? "era-tab--active" : ""}`}
            onClick={() => setActiveId("about")}
          >
            <span className="era-tab__label">About</span>
          </button>
          <button
            className={`era-tab era-tab--about ${isFeedback ? "era-tab--active" : ""}`}
            onClick={() => setActiveId("feedback")}
          >
            <span className="era-tab__label">Feedback</span>
          </button>
        </nav>
        {!isAbout && !isFeedback && !isHome && activeEra && <EraIntro era={activeEra} />}
      </aside>

      <main className="main-content">
        <div className="main-panel">
          {isHome && <Landing onStart={() => setActiveId(ERAS[0].id)} />}
          {isAbout && <About onGoto={setActiveId} />}
          {isFeedback && <Feedback />}
          {!isHome && !isAbout && !isFeedback && showGate && (
            <BeginGate
              era={activeEra}
              eraNum={ERAS.findIndex((e) => e.id === activeId) + 1}
              onBegin={() => setGateDismissed(true)}
            />
          )}
          <div className={`era-panels ${showGate ? "era-panels--hidden" : ""}`}
               style={{ display: isHome || isAbout || isFeedback ? "none" : undefined }}>
            <EraPanels activeId={activeId} />
          </div>
        </div>
        {lockMsg && (
          <div className="lock-toast" role="status">{lockMsg}</div>
        )}
      </main>
    </div>
  );
}
