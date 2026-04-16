import { useState } from "react";
import "./App.css";
import Rules from "./eras/Rules.jsx";
import MLLanguage from "./eras/MLLanguage.jsx";

const ERAS = [
  { id: "rules",      label: "Rules & Dictionaries", year: "pre-2000" },
  { id: "ml",         label: "ML with Language",     year: "~2000"    },
  { id: "embeddings", label: "Numbers & Meaning",    year: "~2013"    },
  { id: "generative", label: "Generative Language",  year: "~2015"    },
  { id: "scale",      label: "Scale & Transformers", year: "~2017"    },
  { id: "alignment",  label: "Training Right",       year: "~2022"    },
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
  return (
    <div className="era-panel-placeholder">
      <div className="era-panel-placeholder__icon">🚧</div>
      <div>"{era.label}" activities coming soon</div>
    </div>
  );
}

export default function App() {
  const [activeId, setActiveId] = useState(ERAS[0].id);
  const activeEra = ERAS.find((e) => e.id === activeId);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__header">
          <h1 className="sidebar__title">NLP Through Time</h1>
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

      <main className="main-content">
        <header className="main-header">
          <span className="main-header__year">{activeEra.year}</span>
          <h2 className="main-header__title">{activeEra.label}</h2>
        </header>
        <div className="main-panel">
          <EraPanel era={activeEra} />
        </div>
      </main>
    </div>
  );
}
