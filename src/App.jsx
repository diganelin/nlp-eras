import { useState } from "react";
import "./App.css";
import Rules from "./eras/Rules.jsx";
import MLLanguage from "./eras/MLLanguage.jsx";
import Embeddings from "./eras/Embeddings.jsx";
import Generalized from "./eras/Generalized.jsx";
import TrainingHard from "./eras/TrainingHard.jsx";
import About from "./eras/About.jsx";
import { ERAS } from "./erasData.js";

function EraTab({ era, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`era-tab ${active ? "era-tab--active" : ""}`}
    >
      <span className="era-tab__year">{era.year}</span>
      <span className="era-tab__label">{era.label}</span>
    </button>
  );
}

function EraIntro({ era }) {
  return (
    <div className="sidebar__intro">
      <div className="sidebar__intro-bigidea">{era.bigIdea}</div>
      <div className="sidebar__intro-text">{era.motivation}</div>
      <div className="sidebar__intro-activity">
        <span className="sidebar__intro-tag">In this era</span>
        {era.activity}
      </div>
    </div>
  );
}

function EraPanel({ era }) {
  if (era.id === "rules") return <Rules />;
  if (era.id === "ml") return <MLLanguage />;
  if (era.id === "embeddings") return <Embeddings />;
  if (era.id === "generative") return <Generalized />;
  if (era.id === "traininghard") return <TrainingHard />;
  return (
    <div className="era-panel-placeholder">
      <div className="era-panel-placeholder__icon">🚧</div>
      <div>"{era.label}" activities coming soon</div>
    </div>
  );
}

export default function App() {
  const [activeId, setActiveId] = useState(ERAS[0].id);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isAbout = activeId === "about";
  const activeEra = ERAS.find((e) => e.id === activeId);

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
        <div className="sidebar__header">
          <h1 className="sidebar__title">NLP Eras Tour</h1>
          <p className="sidebar__subtitle">interactive lesson</p>
        </div>
        <nav className="sidebar__nav">
          {ERAS.map((era) => (
            <EraTab
              key={era.id}
              era={era}
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
        </nav>
        {!isAbout && activeEra && <EraIntro era={activeEra} />}
      </aside>

      <main className="main-content">
        <header className="main-header">
          {isAbout ? (
            <h2 className="main-header__title">About</h2>
          ) : (
            <>
              <span className="main-header__year">{activeEra.year}</span>
              <h2 className="main-header__title">{activeEra.label}</h2>
            </>
          )}
        </header>
        <div className="main-panel">
          {isAbout ? <About /> : <EraPanel era={activeEra} />}
        </div>
      </main>
    </div>
  );
}
