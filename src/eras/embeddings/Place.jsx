import { useMemo, useRef, useState } from "react";
import { STUDENT_WORDS } from "./data.js";

function shuffled(arr) {
  const a = [...arr];
  let seed = 11;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Stage 01: Name two axes, then drag the emotion words onto a 2D grid.
// Word list comes from `STUDENT_WORDS` (9 words). Grid snaps to 0.1 on [-1, 1].

const SNAP = 0.1;

function snap(n) {
  const s = Math.round(n / SNAP) * SNAP;
  return Math.max(-1, Math.min(1, +s.toFixed(1)));
}

function isSpreadEnough(positions) {
  const placed = Object.values(positions).filter(Boolean);
  if (placed.length < STUDENT_WORDS.length) return false;
  const xs = placed.map((p) => p[0]);
  const ys = placed.map((p) => p[1]);
  const std = (arr) => {
    const m = arr.reduce((a, b) => a + b, 0) / arr.length;
    return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
  };
  return std(xs) >= 0.25 && std(ys) >= 0.25;
}

export default function Place({ placements, setPlacements, axisNames, setAxisNames, onAdvance }) {
  const gridRef = useRef(null);
  const dragRef = useRef(null); // current dragging word (stable across renders)
  const placementsRef = useRef(placements);
  placementsRef.current = placements;
  const [dragging, setDragging] = useState(null); // mirror for rendering
  const [hoverPos, setHoverPos] = useState(null);

  const words = useMemo(() => shuffled(STUDENT_WORDS), []);
  const unplaced = words.filter((w) => !placements[w]);
  const allPlaced = unplaced.length === 0;

  const axesNamed = axisNames.x.trim() && axisNames.y.trim() && axisNames.xLow.trim() && axisNames.yLow.trim();

  const gridPos = (clientX, clientY) => {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const fx = (clientX - rect.left) / rect.width;
    const fy = (clientY - rect.top) / rect.height;
    const x = snap(fx * 2 - 1);
    const y = snap(1 - fy * 2);
    if (fx < -0.05 || fx > 1.05 || fy < -0.05 || fy > 1.05) return null;
    return [x, y];
  };

  const handleMove = (e) => {
    setHoverPos(gridPos(e.clientX, e.clientY));
  };

  const handleUp = (e) => {
    const p = gridPos(e.clientX, e.clientY);
    const word = dragRef.current;
    if (word && p) {
      setPlacements({ ...placementsRef.current, [word]: p });
    }
    dragRef.current = null;
    setDragging(null);
    setHoverPos(null);
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
  };

  const handlePointerDown = (word, e) => {
    e.preventDefault();
    if (!axesNamed) return;
    dragRef.current = word;
    setDragging(word);
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    handleMove(e);
  };

  const handleRemove = (word) => {
    const next = { ...placements };
    delete next[word];
    setPlacements(next);
  };

  // Each of the 9 student words has a known semantic quadrant in the
  // (energy, valence) space. We use this to infer the student's axis
  // orientation from their placements, then scatter the remaining words
  // into the matching quadrant under THEIR axes.
  //   +E = high energy, -E = low energy
  //   +V = happy,       -V = sad
  const SEMANTIC = {
    excited: { e: +1, v: +1 },
    pumped:  { e: +1, v: +1 },
    cozy:    { e: -1, v: +1 },
    content: { e: -1, v: +1 },
    tired:   { e: -1, v: -1 },
    bored:   { e: -1, v: -1 },
    drained: { e: -1, v: -1 },
    furious: { e: +1, v: -1 },
    annoyed: { e: +1, v: -1 },
  };

  // Pick a jittered position in a given quadrant (|x|, |y| in [0.4, 0.85]).
  const scatter = (quadX, quadY) => {
    const r = () => 0.4 + Math.random() * 0.45;
    return [quadX * r(), quadY * r()];
  };

  // Infer user's axis orientation from their current placements. Student
  // has placed words spanning ≥2 distinct semantic quadrants — we use the
  // means to decide which axis sign means "high energy" and which means
  // "happy". If one axis isn't pinned by placements, we default to that
  // axis's convention sign (+x = high energy, +y = happy).
  const inferSigns = () => {
    const placed = Object.entries(placements)
      .filter(([w]) => SEMANTIC[w])
      .map(([w, [x, y]]) => ({ w, x, y, ...SEMANTIC[w] }));
    if (placed.length < 2) return null;

    // Identify which semantic quadrants have a placement.
    const quads = new Set(placed.map((p) => `${p.e},${p.v}`));
    if (quads.size < 2) return null;

    // For each axis, mean of coord by semantic sign.
    let sumPosE_x = 0, nPosE = 0, sumNegE_x = 0, nNegE = 0;
    let sumPosV_y = 0, nPosV = 0, sumNegV_y = 0, nNegV = 0;
    for (const p of placed) {
      if (p.e > 0) { sumPosE_x += p.x; nPosE++; } else { sumNegE_x += p.x; nNegE++; }
      if (p.v > 0) { sumPosV_y += p.y; nPosV++; } else { sumNegV_y += p.y; nNegV++; }
    }

    // xSign: +1 if high-energy words landed on user's positive x.
    let xSign = 1;
    if (nPosE > 0 && nNegE > 0) {
      xSign = (sumPosE_x / nPosE) >= (sumNegE_x / nNegE) ? +1 : -1;
    } else if (nPosE > 0) {
      xSign = sumPosE_x / nPosE >= 0 ? +1 : -1;
    } else {
      xSign = sumNegE_x / nNegE <= 0 ? +1 : -1;
    }
    // ySign: +1 if happy words landed on user's positive y.
    let ySign = 1;
    if (nPosV > 0 && nNegV > 0) {
      ySign = (sumPosV_y / nPosV) >= (sumNegV_y / nNegV) ? +1 : -1;
    } else if (nPosV > 0) {
      ySign = sumPosV_y / nPosV >= 0 ? +1 : -1;
    } else {
      ySign = sumNegV_y / nNegV <= 0 ? +1 : -1;
    }
    return { xSign, ySign };
  };

  const canSkipAhead = !!inferSigns();

  const fillRemaining = () => {
    const signs = inferSigns();
    if (!signs) return;
    const { xSign, ySign } = signs;
    // Do NOT overwrite existing placements — only add words the student
    // hasn't placed yet.
    const next = { ...placements };
    for (const w of STUDENT_WORDS) {
      if (next[w]) continue;
      const sem = SEMANTIC[w];
      if (!sem) continue;
      const quadX = sem.e * xSign;
      const quadY = sem.v * ySign;
      next[w] = scatter(quadX, quadY);
    }
    setPlacements(next);
  };

  const spread = allPlaced && isSpreadEnough(placements);
  const canAdvance = allPlaced && spread && axesNamed;

  // Staged instruction: A = name axes (with blue highlight on words),
  // B = drag words onto grid, C = all done.
  const stage =
    !axisNames.x && !axisNames.y ? "A"
    : !axesNamed ? "A"
    : !allPlaced ? "B"
    : "C";

  return (
    <div className="emb-place">
      {stage === "A" && (
        <div className="instruct-callout">
          <span className="instruct-callout__badge">Step 1</span>
          <div className="instruct-callout__body">
            Look at the <span className="word-blue">words in blue</span> on the right. How are they different?
            Fill in <strong>"Some of these words feel…"</strong> below.
          </div>
          <span className="instruct-callout__arrow">↓</span>
        </div>
      )}
      {stage === "B" && (
        <div className="instruct-callout">
          <span className="instruct-callout__badge">Step 2</span>
          <div className="instruct-callout__body">
            Now <strong>drag each word</strong> onto the grid where it belongs on your axes.
          </div>
          <span className="instruct-callout__arrow">↓</span>
        </div>
      )}

      <div className="ml__prompt">
        <div className="ml__prompt-title">Pick two ways these words can differ.</div>
      </div>

      <div className="emb-place__axes-fields">
        <div>
          <label>Some of these words feel…</label>
          <div className="emb-axis-input">
            <input
              type="text"
              placeholder="e.g. high energy"
              value={axisNames.x}
              onChange={(e) => setAxisNames({ ...axisNames, x: e.target.value })}
            />
            <span>…and their opposites feel…</span>
            <input
              type="text"
              placeholder="e.g. low energy"
              value={axisNames.xLow}
              onChange={(e) => setAxisNames({ ...axisNames, xLow: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label>Another way they differ — some feel…</label>
          <div className="emb-axis-input">
            <input
              type="text"
              placeholder="…"
              value={axisNames.y}
              onChange={(e) => setAxisNames({ ...axisNames, y: e.target.value })}
            />
            <span>…and their opposites feel…</span>
            <input
              type="text"
              placeholder="…"
              value={axisNames.yLow}
              onChange={(e) => setAxisNames({ ...axisNames, yLow: e.target.value })}
            />
          </div>
        </div>
      </div>

      {canSkipAhead && !canAdvance && (
        <div className="emb-place__autofill">
          <button className="btn btn--ghost" onClick={fillRemaining}>
            Skip ahead — auto-place the rest →
          </button>
        </div>
      )}

      <div className="emb-place__grid-wrap">
        <div className="emb-place__axis-label emb-place__axis-label--top">
          {axisNames.y ? `↑ ${axisNames.y}` : "\u00a0"}
        </div>
        <div className="emb-place__row">
          <div className="emb-place__axis-label emb-place__axis-label--left">
            {axisNames.xLow ? `← ${axisNames.xLow}` : "\u00a0"}
          </div>

          <div ref={gridRef} className="emb-grid">
            <div className="emb-grid__axis emb-grid__axis--x" />
            <div className="emb-grid__axis emb-grid__axis--y" />
            {Object.entries(placements).map(([word, [x, y]]) => (
              <button
                key={word}
                className="emb-chip emb-chip--placed"
                style={{
                  left: `${((x + 1) / 2) * 100}%`,
                  bottom: `${((y + 1) / 2) * 100}%`,
                  transform: "translate(-50%, 50%)",
                }}
                onPointerDown={(e) => handlePointerDown(word, e)}
                onDoubleClick={() => handleRemove(word)}
                title="drag to reposition · double-click to remove"
              >
                {word}
              </button>
            ))}
            {dragging && hoverPos && (
              <div
                className="emb-grid__ghost"
                style={{
                  left: `${((hoverPos[0] + 1) / 2) * 100}%`,
                  bottom: `${((hoverPos[1] + 1) / 2) * 100}%`,
                  transform: "translate(-50%, 50%)",
                }}
              >
                {dragging}
              </div>
            )}
          </div>

          <div className="emb-place__axis-label emb-place__axis-label--right">
            {axisNames.x ? `${axisNames.x} →` : "\u00a0"}
          </div>

          {unplaced.length > 0 && (
            <div className="emb-place__pool emb-place__pool--side">
              {unplaced.map((w) => (
                <button
                  key={w}
                  className={`emb-chip ${dragging === w ? "emb-chip--dragging" : ""} ${!axesNamed ? "emb-chip--preview emb-chip--hint" : ""}`}
                  onPointerDown={(e) => handlePointerDown(w, e)}
                  disabled={!axesNamed}
                >
                  {w}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="emb-place__axis-label emb-place__axis-label--bottom">
          {axisNames.yLow ? `↓ ${axisNames.yLow}` : "\u00a0"}
        </div>
      </div>

      {!axesNamed && (
        <div className="emb-nudge emb-nudge--quiet">
          Name both axes above to start dragging.
        </div>
      )}

      {axesNamed && (
        <>
          {allPlaced && !spread && (
            <div className="emb-nudge">
              Try spreading the words out more!
            </div>
          )}

          {canAdvance && (
            <div className="ml__footer">
              <button className="btn btn--primary" onClick={onAdvance}>
                Turn words into numbers →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
