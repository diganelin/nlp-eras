import { useEffect, useMemo, useState } from "react";
import { STAGE2_TWEETS, STUDENT_WORDS } from "./data.js";
import { presentation } from "./tweetPresentation.js";

// Stage 02: show students that their placements ARE vectors (two numbers
// per word), then average them across a tweet to get a tweet vector.

const TOK = /[a-zA-Z']+/g;
function tokens(text) {
  return (text.match(TOK) || []).map((t) => t.toLowerCase());
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
function fmt(n) {
  return round2(n).toFixed(2);
}

function HighlightedTweet({ text, hits }) {
  const hitSet = new Set(hits);
  const parts = text.split(/(\s+)/);
  return (
    <span>
      {parts.map((p, i) => {
        const tok = p.toLowerCase().replace(/[^a-z']/g, "");
        if (hitSet.has(tok)) return <mark key={i} className="emb-hit">{p}</mark>;
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
}

// Grid showing all word placements, with crosshair + coord readout for the
// selected word.
function WordGrid({ points, axisNames, selected, onSelect, alwaysLabel }) {
  const sel = selected ? points.find((p) => p.word === selected) : null;
  const alwaysSet = new Set(alwaysLabel || []);

  // Assign a label direction per word based on its quadrant, so labels fan
  // out from the centre instead of always sitting on the right.
  const labelDir = (x, y) => {
    if (x >= 0 && y >= 0) return "tr";
    if (x < 0 && y >= 0) return "tl";
    if (x >= 0 && y < 0) return "br";
    return "bl";
  };

  return (
    <div className="emb-wgrid">
      <div className="emb-wgrid__label emb-wgrid__label--top">
        {axisNames.y ? `↑ ${axisNames.y}` : "\u00a0"}
      </div>
      <div className="emb-wgrid__row">
        <div className="emb-wgrid__label emb-wgrid__label--left">
          {axisNames.xLow ? `← ${axisNames.xLow}` : "\u00a0"}
        </div>
        <div className="emb-wgrid__plot">
          <div className="emb-wgrid__axis emb-wgrid__axis--x" />
          <div className="emb-wgrid__axis emb-wgrid__axis--y" />

          {/* math-class axis ticks on the axes themselves */}
          {[-1, -0.5, 0.5, 1].map((v) => (
            <span
              key={`xt${v}`}
              className="emb-wgrid__tickmark emb-wgrid__tickmark--x"
              style={{ left: `${((v + 1) / 2) * 100}%` }}
            >{v}</span>
          ))}
          {[-1, -0.5, 0.5, 1].map((v) => (
            <span
              key={`yt${v}`}
              className="emb-wgrid__tickmark emb-wgrid__tickmark--y"
              style={{ bottom: `${((v + 1) / 2) * 100}%` }}
            >{v}</span>
          ))}
          <span className="emb-wgrid__tickmark emb-wgrid__tickmark--origin">0</span>

          {sel && (
            <>
              <div
                className="emb-wgrid__guide emb-wgrid__guide--v"
                style={{ left: `${((sel.x + 1) / 2) * 100}%` }}
              />
              <div
                className="emb-wgrid__guide emb-wgrid__guide--h"
                style={{ bottom: `${((sel.y + 1) / 2) * 100}%` }}
              />
            </>
          )}

          {points.map(({ word, x, y }) => {
            const isSel = word === selected;
            const showLabel = isSel || alwaysSet.has(word);
            const dir = labelDir(x, y);
            return (
              <button
                key={word}
                className={`emb-wgrid__dot emb-wgrid__dot--${dir} ${isSel ? "emb-wgrid__dot--selected" : ""} ${showLabel ? "emb-wgrid__dot--labeled" : ""}`}
                style={{
                  left: `${((x + 1) / 2) * 100}%`,
                  bottom: `${((y + 1) / 2) * 100}%`,
                }}
                onClick={() => onSelect(word)}
                title={word}
              >
                <span className="emb-wgrid__dot-label">
                  {word}
                  {isSel && (
                    <span className="emb-wgrid__dot-coord">
                      ({fmt(x)}, {fmt(y)})
                    </span>
                  )}
                </span>
              </button>
            );
          })}

        </div>
        <div className="emb-wgrid__label emb-wgrid__label--right">
          {axisNames.x ? `${axisNames.x} →` : "\u00a0"}
        </div>
      </div>
      <div className="emb-wgrid__label emb-wgrid__label--bottom">
        {axisNames.yLow ? `↓ ${axisNames.yLow}` : "\u00a0"}
      </div>
    </div>
  );
}

// Small grid shown in the Averaging section: plots only the tweet's hit
// words and the average-vector star.
function AvgMiniGrid({ points, avgPoint, axisNames }) {
  // Position the coord label opposite the grid's outside edge so it stays
  // inside the plot. Star stays pinned exactly on the avg coordinate.
  const labelSide = avgPoint && avgPoint.x >= 0 ? "left" : "right";

  return (
    <div className="emb-minigrid-wrap">
      <div className="emb-minigrid-wrap__ylabel">
        {axisNames.y ? `↑ ${axisNames.y}` : ""}
      </div>
      <div className="emb-minigrid">
        <div className="emb-minigrid__axis emb-minigrid__axis--x" />
        <div className="emb-minigrid__axis emb-minigrid__axis--y" />

        {[-1, 1].map((v) => (
          <span
            key={`xt${v}`}
            className="emb-minigrid__tick emb-minigrid__tick--x"
            style={{ left: `${((v + 1) / 2) * 100}%` }}
          >{v}</span>
        ))}
        {[-1, 1].map((v) => (
          <span
            key={`yt${v}`}
            className="emb-minigrid__tick emb-minigrid__tick--y"
            style={{ bottom: `${((v + 1) / 2) * 100}%` }}
          >{v}</span>
        ))}

        {points.map(({ word, x, y }) => (
          <div
            key={word}
            className="emb-minigrid__dot"
            style={{
              left: `${((x + 1) / 2) * 100}%`,
              bottom: `${((y + 1) / 2) * 100}%`,
            }}
          >
            <span className="emb-minigrid__dot-label">{word}</span>
          </div>
        ))}
        {avgPoint && (
          <div
            className="emb-minigrid__avg"
            style={{
              left: `${((avgPoint.x + 1) / 2) * 100}%`,
              bottom: `${((avgPoint.y + 1) / 2) * 100}%`,
            }}
          >
            <span className="emb-minigrid__avg-star" title="tweet average">★</span>
            <span className={`emb-minigrid__avg-coord emb-minigrid__avg-coord--${labelSide}`}>
              ({fmt(avgPoint.x)}, {fmt(avgPoint.y)})
            </span>
          </div>
        )}
      </div>
      <div className="emb-minigrid-wrap__xlabel">
        {axisNames.x ? `${axisNames.x} →` : ""}
      </div>
    </div>
  );
}

export default function Vectorize({ placements, axisNames, onAdvance }) {
  const wordPoints = useMemo(
    () =>
      STUDENT_WORDS.filter((w) => placements[w]).map((w) => ({
        word: w,
        x: placements[w][0],
        y: placements[w][1],
      })),
    [placements]
  );

  // Pick two table cells (one x-coord, one y-coord on different words) the
  // student must fill in by reading off the grid. Deterministic from their
  // placements: pick the words with the largest |coord| on each axis. Both
  // need |coord| >= 0.2 to be readable.
  const puzzleCells = useMemo(() => {
    if (wordPoints.length < 2) return null;
    const cand = wordPoints.filter(
      (p) => Math.abs(p.x) >= 0.2 || Math.abs(p.y) >= 0.2
    );
    if (cand.length < 2) return null;
    const byX = [...cand].sort(
      (a, b) => Math.abs(b.x) - Math.abs(a.x) || a.word.localeCompare(b.word)
    );
    const xPick = byX.find((p) => Math.abs(p.x) >= 0.2);
    if (!xPick) return null;
    const byY = [...cand].sort(
      (a, b) => Math.abs(b.y) - Math.abs(a.y) || a.word.localeCompare(b.word)
    );
    const yPick = byY.find((p) => Math.abs(p.y) >= 0.2 && p.word !== xPick.word);
    if (!yPick) return null;
    return { xWord: xPick.word, yWord: yPick.word };
  }, [wordPoints]);

  const [puzzleInputs, setPuzzleInputs] = useState({ x: "", y: "" });
  const [puzzleStatus, setPuzzleStatus] = useState({ x: "pending", y: "pending" });

  useEffect(() => {
    setPuzzleInputs({ x: "", y: "" });
    setPuzzleStatus({ x: "pending", y: "pending" });
  }, [puzzleCells?.xWord, puzzleCells?.yWord]);

  const checkPuzzle = () => {
    if (!puzzleCells) return;
    const xActual = placements[puzzleCells.xWord]?.[0];
    const yActual = placements[puzzleCells.yWord]?.[1];
    const norm = (s) => parseFloat(String(s).replace(/[−–—]/g, "-"));
    const xVal = norm(puzzleInputs.x);
    const yVal = norm(puzzleInputs.y);
    const xOk = !isNaN(xVal) && Math.abs(xVal - xActual) < 0.06;
    const yOk = !isNaN(yVal) && Math.abs(yVal - yActual) < 0.06;
    setPuzzleStatus({ x: xOk ? "correct" : "wrong", y: yOk ? "correct" : "wrong" });
  };

  const puzzleSolved =
    !puzzleCells || (puzzleStatus.x === "correct" && puzzleStatus.y === "correct");

  const sampleTweets = useMemo(() => {
    // De-dupe by text, then pick with variety: one tweet per unique hit-set,
    // multi-word pairs first, so students don't see the same word-pair three
    // times in a row.
    const seen = new Set();
    const uniq = STAGE2_TWEETS.filter((t) => {
      if (seen.has(t.text)) return false;
      seen.add(t.text);
      return t.hits && t.hits.length > 0;
    });
    const byCombo = new Map();
    for (const t of uniq) {
      const key = [...t.hits].sort().join("+");
      if (!byCombo.has(key)) byCombo.set(key, []);
      byCombo.get(key).push(t);
    }
    const combos = [...byCombo.entries()].sort((a, b) => {
      const aMulti = a[1][0].hits.length;
      const bMulti = b[1][0].hits.length;
      if (aMulti !== bMulti) return bMulti - aMulti;
      return b[1].length - a[1].length;
    });
    const picks = [];
    const usedWords = new Set();
    const remaining = combos.map(([, arr]) => [...arr]);
    // round 1: one per distinct combo (prefer combos whose words are all new)
    for (let i = 0; i < combos.length && picks.length < 6; i++) {
      const arr = remaining[i];
      if (!arr.length) continue;
      const [key] = combos[i];
      const words = key.split("+");
      if (words.every((w) => usedWords.has(w))) continue;
      picks.push(arr.shift());
      words.forEach((w) => usedWords.add(w));
    }
    // round 2: fill remaining slots with singletons from buckets we haven't
    // drawn heavily from, preferring single-word tweets so we don't repeat
    // a word-pair.
    while (picks.length < 6) {
      let best = -1;
      let bestScore = -Infinity;
      for (let i = 0; i < combos.length; i++) {
        if (!remaining[i].length) continue;
        const [key] = combos[i];
        const words = key.split("+");
        const size = words.length;
        // prefer smaller combos (singletons), then buckets we haven't picked
        const already = combos[i][1].length - remaining[i].length;
        const score = -size * 10 - already;
        if (score > bestScore) { bestScore = score; best = i; }
      }
      if (best < 0) break;
      picks.push(remaining[best].shift());
    }
    return picks.slice(0, 6);
  }, []);

  const [selectedWord, setSelectedWord] = useState(null);
  const [selectedTweet, setSelectedTweet] = useState(null);
  const [revealedTweets, setRevealedTweets] = useState(new Set());

  const pickTweet = (i) => {
    setSelectedTweet(i);
    setSelectedWord(null);
    setRevealedTweets((prev) => new Set(prev).add(i));
  };

  const activeTweet = selectedTweet !== null ? sampleTweets[selectedTweet] : null;

  const activeHits = useMemo(() => {
    if (!activeTweet) return [];
    const toks = tokens(activeTweet.text);
    const seen = new Set();
    const out = [];
    for (const tok of toks) {
      if (activeTweet.hits.includes(tok) && !seen.has(tok) && placements[tok]) {
        seen.add(tok);
        out.push({ word: tok, x: placements[tok][0], y: placements[tok][1] });
      }
    }
    return out;
  }, [activeTweet, placements]);

  const avg = useMemo(() => {
    if (activeHits.length === 0) return null;
    const sx = activeHits.reduce((s, h) => s + h.x, 0);
    const sy = activeHits.reduce((s, h) => s + h.y, 0);
    return { x: sx / activeHits.length, y: sy / activeHits.length };
  }, [activeHits]);

  const canAdvance = revealedTweets.size >= 3;

  const selPoint = selectedWord ? wordPoints.find((p) => p.word === selectedWord) : null;

  const renderCell = (word, axis, value) => {
    const isPuzzle = puzzleCells && (
      (axis === "x" && puzzleCells.xWord === word) ||
      (axis === "y" && puzzleCells.yWord === word)
    );
    if (!isPuzzle) {
      return <span className="emb-vec__num">{fmt(value)}</span>;
    }
    const status = puzzleStatus[axis];
    if (status === "correct") {
      return (
        <span className="emb-vec__num emb-vec__num--ok">
          {fmt(value)} <span className="emb-vec__num-tick">✓</span>
        </span>
      );
    }
    return (
      <span className="emb-vec__num emb-vec__num--puzzle">
        <input
          type="text"
          inputMode="decimal"
          className={`emb-vec__puzzle-input ${status === "wrong" ? "emb-vec__puzzle-input--bad" : ""}`}
          value={puzzleInputs[axis]}
          onChange={(e) => {
            const v = e.target.value;
            setPuzzleInputs((a) => ({ ...a, [axis]: v }));
            setPuzzleStatus((s) => ({ ...s, [axis]: "pending" }));
          }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") { e.preventDefault(); checkPuzzle(); }
          }}
          placeholder="?"
        />
      </span>
    );
  };

  return (
    <div className="emb-vec">
      <div className="ml__prompt">
        <div className="ml__prompt-title">You just built word vectors.</div>
        <div className="ml__prompt-body">
          Each word's place on the grid is really <strong>two numbers</strong>{" "}
          — one for each axis you named. Together, those two numbers are a{" "}
          <strong>vector</strong>. Machines love numbers, so your words are
          now machine-readable. Click a word to see its vector.
        </div>
      </div>

      {puzzleCells && !puzzleSolved && (
        <div className="instruct-callout">
          <span className="instruct-callout__badge">Try this</span>
          <div className="instruct-callout__body">
            Two numbers are missing from the table on the right —{" "}
            <strong>read them off the grid</strong> and fill them in.
          </div>
        </div>
      )}

      <div className="emb-vec__split">
        <WordGrid
          points={wordPoints}
          axisNames={axisNames}
          selected={selectedWord}
          onSelect={setSelectedWord}
          alwaysLabel={activeHits.map((h) => h.word)}
        />

        <div className="emb-vec__table">
          <div className="emb-vec__table-head">
            <span>word</span>
            <span>{axisNames.x || "axis 1"}</span>
            <span>{axisNames.y || "axis 2"}</span>
          </div>
          {wordPoints.map(({ word, x, y }) => {
            const isSel = word === selectedWord;
            return (
              <div
                key={word}
                role="button"
                tabIndex={0}
                className={`emb-vec__table-row ${isSel ? "emb-vec__table-row--selected" : ""}`}
                onClick={() => setSelectedWord(isSel ? null : word)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedWord(isSel ? null : word);
                  }
                }}
              >
                <span className="emb-vec__word">{word}</span>
                {renderCell(word, "x", x)}
                {renderCell(word, "y", y)}
              </div>
            );
          })}
        </div>
      </div>

      {puzzleCells && !puzzleSolved && (
        <div className="emb-vec__puzzle-actions">
          <button className="btn btn--primary" onClick={checkPuzzle}>
            Check
          </button>
          {(puzzleStatus.x === "wrong" || puzzleStatus.y === "wrong") && (
            <span className="emb-vec__puzzle-msg">
              Not quite — read carefully and try again.
            </span>
          )}
        </div>
      )}

      {selPoint && (
        <div className="emb-vec__readout">
          <strong>{selPoint.word}</strong>
          <span>
            {axisNames.x || "axis 1"}: <code>{fmt(selPoint.x)}</code>
          </span>
          <span>
            {axisNames.y || "axis 2"}: <code>{fmt(selPoint.y)}</code>
          </span>
        </div>
      )}

      {puzzleSolved && (
      <>
      <div className="ml__prompt ml__prompt--quiet">
        <div className="ml__prompt-title">Now — what about a whole tweet?</div>
        <div className="ml__prompt-body">
          A tweet has many words. One simple trick: take the vectors of the
          words you know, and <strong>average them</strong>. The result is a
          vector for the whole tweet. Click a tweet to try it.
        </div>
      </div>

      <div className="emb-vec__tweets">
        {sampleTweets.map((t, i) => {
          const p = presentation(t.text);
          return (
            <button
              key={i}
              className={`emb-vec__tweet tweet-card ${selectedTweet === i ? "emb-vec__tweet--active" : ""} ${revealedTweets.has(i) ? "emb-vec__tweet--seen" : ""}`}
              onClick={() => pickTweet(i)}
            >
              <div className="tweet-card__avatar" style={{ background: p.color }}>{p.initial}</div>
              <div className="tweet-card__body">
                <div className="tweet-card__head">
                  <span className="tweet-card__name">{p.name}</span>
                  <span className="tweet-card__handle">@{p.handle}</span>
                </div>
                <div className="tweet-card__text">
                  <HighlightedTweet text={t.text} hits={t.hits} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {activeTweet && (
        <div className="emb-vec__calc">
          <div className="emb-vec__calc-title">
            Averaging {activeHits.length} word{activeHits.length === 1 ? "" : "s"}:
          </div>
          <div className="emb-vec__calc-body">
            <div className="emb-vec__calc-rows">
              <div className="emb-vec__calc-head">
                <span>word</span>
                <span>{axisNames.x || "axis 1"}</span>
                <span>{axisNames.y || "axis 2"}</span>
              </div>
              {activeHits.map(({ word, x, y }) => (
                <div key={word} className="emb-vec__calc-row">
                  <span className="emb-vec__word">{word}</span>
                  <span className="emb-vec__num">{fmt(x)}</span>
                  <span className="emb-vec__num">{fmt(y)}</span>
                </div>
              ))}
              <div className="emb-vec__calc-divider" />
              <div className="emb-vec__calc-row emb-vec__calc-row--avg">
                <span className="emb-vec__word">average</span>
                <span className="emb-vec__num">{avg ? fmt(avg.x) : "—"}</span>
                <span className="emb-vec__num">{avg ? fmt(avg.y) : "—"}</span>
              </div>
            </div>
            <AvgMiniGrid points={activeHits} avgPoint={avg} axisNames={axisNames} />
          </div>
          <div className="emb-vec__calc-hint">
            ★ is the tweet's vector — the average of its words.
          </div>
        </div>
      )}

      <div className="ml__footer">
        <div className="ml__footer-hint">
          {canAdvance
            ? "Nice — you've seen how any tweet becomes one vector."
            : `Try ${3 - revealedTweets.size} more tweet${revealedTweets.size === 2 ? "" : "s"} to see the pattern.`}
        </div>
        <button
          className="btn btn--primary"
          disabled={!canAdvance}
          onClick={onAdvance}
        >
          Train a tiny model on these vectors →
        </button>
      </div>
      </>
      )}
    </div>
  );
}
