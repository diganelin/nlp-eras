import { useState } from "react";
import "./App.css";
import Rules from "./eras/Rules.jsx";
import MLLanguage from "./eras/MLLanguage.jsx";
import Embeddings from "./eras/Embeddings.jsx";
import Generalized from "./eras/Generalized.jsx";
import TrainingHard from "./eras/TrainingHard.jsx";

const ERAS = [
  { id: "rules",        label: "Rules & Dictionaries", year: "pre-2000" },
  { id: "ml",           label: "ML with Language",     year: "~2000"    },
  { id: "embeddings",   label: "Numbers & Meaning",    year: "~2013"    },
  { id: "generative",   label: "Generalized Learning", year: "~2020"    },
  { id: "traininghard", label: "Training Hard",        year: "2022–26"  },
];

function EraTab({ era, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        era-tab
        ${active ? "era-tab--active" : ""}
      `}
    >
      <span className="era-tab__year">{era.year}</span>
      <span className="era-tab__label">{era.label}</span>
    </button>
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
  const [compact, setCompact] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
        </nav>
      </aside>

      <main className={`main-content ${compact ? "main-content--compact" : ""}`}>
        <header className="main-header">
          <span className="main-header__year">{activeEra.year}</span>
          <h2 className="main-header__title">{activeEra.label}</h2>
          <button
            className="main-header__toggle"
            onClick={() => setCompact((c) => !c)}
            title={compact ? "Show description text" : "Hide description text"}
          >
            {compact ? "show text ▾" : "hide text ▴"}
          </button>
        </header>
        <div className="main-panel">
          <EraPanel era={activeEra} />
        </div>
      </main>
    </div>
  );
}
