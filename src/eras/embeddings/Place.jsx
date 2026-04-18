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

  const prefill = () => {
    setAxisNames({ x: "high energy", xLow: "low energy", y: "happy", yLow: "sad" });
    setPlacements({
      excited:  [ 0.6,  0.7],
      pumped:   [ 0.9,  0.6],
      cozy:     [-0.7,  0.5],
      content:  [-0.6,  0.6],
      tired:    [-0.8, -0.5],
      bored:    [-0.7, -0.4],
      drained:  [-0.6, -0.6],
      furious:  [ 0.8, -0.7],
      annoyed:  [ 0.5, -0.5],
    });
  };

  const spread = allPlaced && isSpreadEnough(placements);
  const canAdvance = allPlaced && spread && axesNamed;

  return (
    <div className="emb-place">
      <button className="emb-place__dev" onClick={prefill} title="dev: prefill grid for testing">
        ⚡ prefill grid
      </button>

      <div className="ml__prompt">
        <div className="ml__prompt-title">Pick two ways these words can differ.</div>
        <div className="ml__prompt-body">
          Look at the words on the right. Fill in the blanks below — only the
          first row shows an example; the second axis is up to you. The grid
          labels update as you type, and you can drag words on once both
          axes have names.
        </div>
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
                onClick={() => handleRemove(word)}
                title="click to remove"
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
                  className={`emb-chip ${dragging === w ? "emb-chip--dragging" : ""} ${!axesNamed ? "emb-chip--preview" : ""}`}
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
