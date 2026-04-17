import { useEffect, useRef, useState } from "react";
import { TAGS, PAIRS } from "./tagData.js";

// Merged "What did it learn / One model, many tasks" step.
// Students see a grid of example labels, pick any in any order, watch the
// model generate the output with illustrative attention highlights, then
// drag positive qualities into "Did well ✓" / "Did badly ✗". After they're
// done they can see a summary of their evaluations.

const STEP_MS = 280;

function isWhitespace(w) { return /^\s+$/.test(w); }

export default function Tag({ onAdvance }) {
  const [activeId, setActiveId] = useState(null);
  const [placements, setPlacements] = useState({});   // { [pairId]: { [tagId]: "well"|"badly" } }
  const [genStep, setGenStep] = useState({});         // { [pairId]: int }
  const [streamingId, setStreamingId] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const isComplete = (pairId) => {
    const pair = PAIRS.find((p) => p.id === pairId);
    const placed = placements[pairId] || {};
    return pair && pair.tags.every((t) => placed[t.id]);
  };
  const completedCount = PAIRS.filter((p) => isComplete(p.id)).length;

  if (showSummary) {
    return <Summary placements={placements} onAdvance={onAdvance} onBack={() => setShowSummary(false)} />;
  }

  if (!activeId) {
    return (
      <Picker
        placements={placements}
        completed={PAIRS.filter((p) => isComplete(p.id)).map((p) => p.id)}
        onPick={(id) => setActiveId(id)}
        onFinish={() => setShowSummary(true)}
        completedCount={completedCount}
      />
    );
  }

  const pair = PAIRS.find((p) => p.id === activeId);
  const placed = placements[pair.id] || {};
  const contWordCount = pair.words.length - pair.promptWordCount;
  const step = genStep[pair.id] ?? 0;
  const hasGenerated = step > 0;
  const isStreaming = streamingId === pair.id;
  const fullyStreamed = step >= contWordCount;
  const allPlaced = pair.tags.every((t) => placed[t.id]);

  const startGenerate = () => {
    clearInterval(intervalRef.current);
    setStreamingId(pair.id);
    setGenStep((s) => ({ ...s, [pair.id]: 0 }));
    intervalRef.current = setInterval(() => {
      setGenStep((s) => {
        const cur = s[pair.id] ?? 0;
        const nextStep = cur + 1;
        if (nextStep >= contWordCount) {
          clearInterval(intervalRef.current);
          setStreamingId((sid) => (sid === pair.id ? null : sid));
        }
        return { ...s, [pair.id]: nextStep };
      });
    }, STEP_MS);
  };

  const setPlacement = (tagId, bucket) => {
    setPlacements((p) => ({
      ...p,
      [pair.id]: { ...(p[pair.id] || {}), [tagId]: bucket },
    }));
  };
  const cycle = (tagId) => {
    const cur = placed[tagId];
    const nextBucket = cur === undefined ? "well" : cur === "well" ? "badly" : undefined;
    setPlacements((p) => {
      const cp = { ...(p[pair.id] || {}) };
      if (nextBucket === undefined) delete cp[tagId];
      else cp[tagId] = nextBucket;
      return { ...p, [pair.id]: cp };
    });
  };

  const backToPicker = () => {
    clearInterval(intervalRef.current);
    setStreamingId(null);
    setActiveId(null);
  };

  const latestAttention = step === 0 ? {} : (pair.attention?.[step - 1] || {});

  const onDragStart = (e, tagId) => {
    e.dataTransfer.setData("text/plain", tagId);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const onDrop = (e, bucket) => {
    e.preventDefault();
    const tagId = e.dataTransfer.getData("text/plain");
    if (tagId) setPlacement(tagId, bucket);
  };

  const renderedWords = pair.words.map((w, i) => {
    const visible = i < pair.promptWordCount + step;
    const isGenerated = i >= pair.promptWordCount;
    if (!isGenerated) {
      // Prompt words always rendered, but in prompt color
      return isWhitespace(w)
        ? <span key={i}>{w}</span>
        : <span key={i} className="tag__w tag__w--prompt">{w}</span>;
    }
    if (!visible) return null;
    const isLatestGenerated = i === pair.promptWordCount + step - 1;
    const intensity = latestAttention[i] || 0;
    const style = intensity > 0
      ? { backgroundColor: `rgba(184, 83, 10, ${Math.min(0.55, intensity * 0.55)})` }
      : undefined;
    const cls = [
      "tag__w",
      "tag__w--gen",
      isLatestGenerated ? "tag__w--latest" : "",
      intensity > 0 ? "tag__w--attended" : "",
    ].filter(Boolean).join(" ");
    if (isWhitespace(w)) return <span key={i}>{w}</span>;
    return <span key={i} className={cls} style={style}>{w}</span>;
  });

  return (
    <div className="gen">
      <div className="tag__detail-header">
        <button className="btn btn--ghost btn--sm" onClick={backToPicker}>
          ← All examples
        </button>
        <div className="tag__detail-title">{pair.label}</div>
        <div className="tag__detail-progress">
          {completedCount} of {PAIRS.length} done
        </div>
      </div>

      <div className="gen__prompt">
        <div className="gen__prompt-body">
          Click <strong>Generate</strong>. Watch the model produce its output one word at a time — highlighted words show what it's "paying attention to." Then drag each quality into <strong>Did well ✓</strong> or <strong>Did badly ✗</strong>.
        </div>
      </div>

      <div className={`tag__stream ${pair.mono ? "tag__stream--mono" : ""}`}>
        {renderedWords}
        {!hasGenerated && (
          <span className="tag__stream-placeholder"> ___</span>
        )}
        {isStreaming && <span className="gen__cursor">▍</span>}
      </div>

      <div className="tag__stream-controls">
        {!hasGenerated && (
          <button className="btn btn--primary" onClick={startGenerate}>
            Generate →
          </button>
        )}
        {hasGenerated && !isStreaming && (
          <button className="btn btn--ghost btn--sm" onClick={startGenerate}>
            ↻ Replay
          </button>
        )}
        <span className="tag__source">
          source:{" "}
          {pair.sourceUrl ? (
            <a href={pair.sourceUrl} target="_blank" rel="noopener noreferrer">{pair.source}</a>
          ) : (
            <span>{pair.source}</span>
          )}
        </span>
      </div>

      {(step >= 4 || fullyStreamed) && (
        <div className="tag__workspace">
          <div className="tag__bucket tag__bucket--well"
               onDragOver={onDragOver} onDrop={(e) => onDrop(e, "well")}>
            <div className="tag__bucket-label">Did well ✓</div>
            <div className="tag__bucket-chips">
              {pair.tags.filter((t) => placed[t.id] === "well").map((t) => (
                <Chip key={t.id} label={TAGS[t.id].label} tagId={t.id}
                      onClick={() => cycle(t.id)} onDragStart={onDragStart} />
              ))}
            </div>
          </div>

          <div className="tag__tray"
               onDragOver={onDragOver} onDrop={(e) => onDrop(e, undefined)}>
            <div className="tag__bucket-label">Qualities</div>
            <div className="tag__bucket-chips">
              {pair.tags.filter((t) => !placed[t.id]).map((t) => (
                <Chip key={t.id} label={TAGS[t.id].label} tagId={t.id}
                      onClick={() => cycle(t.id)} onDragStart={onDragStart} />
              ))}
              {pair.tags.every((t) => placed[t.id]) && (
                <span className="tag__tray-empty">all placed</span>
              )}
            </div>
          </div>

          <div className="tag__bucket tag__bucket--badly"
               onDragOver={onDragOver} onDrop={(e) => onDrop(e, "badly")}>
            <div className="tag__bucket-label">Did badly ✗</div>
            <div className="tag__bucket-chips">
              {pair.tags.filter((t) => placed[t.id] === "badly").map((t) => (
                <Chip key={t.id} label={TAGS[t.id].label} tagId={t.id}
                      onClick={() => cycle(t.id)} onDragStart={onDragStart} />
              ))}
            </div>
          </div>
        </div>
      )}

      {allPlaced && pair.takeaway && (
        <div className="tag__takeaway">
          <strong>What the model learned:</strong> {pair.takeaway}
        </div>
      )}

      <div className="gen__footer">
        <button className="btn btn--ghost" onClick={backToPicker}>
          ← All examples
        </button>
        {allPlaced && (
          <button className="btn btn--primary" onClick={backToPicker}>
            Try another →
          </button>
        )}
        <span className="gen__footer-hint">drag, or click to cycle</span>
      </div>
    </div>
  );
}

function Chip({ label, tagId, onClick, onDragStart }) {
  return (
    <button
      type="button"
      className="tag__chip"
      onClick={onClick}
      draggable
      onDragStart={(e) => onDragStart(e, tagId)}
    >
      {label}
    </button>
  );
}

function Picker({ placements, completed, onPick, onFinish, completedCount }) {
  // Running tally across everything judged so far.
  const perTag = {};
  let totalJudged = 0;
  for (const pair of PAIRS) {
    const placed = placements[pair.id] || {};
    for (const t of pair.tags) {
      const bucket = placed[t.id];
      if (!bucket) continue;
      if (!perTag[t.id]) perTag[t.id] = { well: 0, badly: 0 };
      perTag[t.id][bucket] += 1;
      totalJudged += 1;
    }
  }
  const tallyRows = Object.entries(perTag).sort((a, b) => {
    const aTot = a[1].well + a[1].badly;
    const bTot = b[1].well + b[1].badly;
    return bTot - aTot;
  });

  return (
    <div className="gen">
      <div className="gen__prompt">
        <div className="gen__prompt-title">
          One model, many tasks — what did it learn?
        </div>
        <div className="gen__prompt-body">
          We didn't train a recipe model, a history model, a code model. We trained <strong>one</strong> next-word predictor on a big pile of internet text — and it learned <strong>a lot about the world</strong> along the way. Pick any example, watch it generate, and judge what the model did well and did badly.
        </div>
      </div>

      <div className="tag__picker">
        {PAIRS.map((p) => {
          const done = completed.includes(p.id);
          return (
            <button
              key={p.id}
              className={`tag__picker-card ${done ? "tag__picker-card--done" : ""}`}
              onClick={() => onPick(p.id)}
            >
              <span className="tag__picker-label">{p.label || p.id}</span>
              {done && <span className="tag__picker-check">✓</span>}
            </button>
          );
        })}
      </div>

      {totalJudged > 0 && (
        <div className="tag__tally">
          <div className="tag__tally-title">Your rankings so far</div>
          <div className="tag__tally-rows">
            {tallyRows.map(([tagId, { well, badly }]) => (
              <div key={tagId} className="tag__tally-row">
                <span className="tag__tally-label">{TAGS[tagId]?.label || tagId}</span>
                <span className="tag__tally-counts">
                  <span className="tag__tally-well">{well} ✓</span>
                  <span className="tag__tally-sep">·</span>
                  <span className="tag__tally-badly">{badly} ✗</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="gen__footer">
        <span className="gen__footer-hint">
          {completedCount === 0
            ? "pick any example to start"
            : `${completedCount} of ${PAIRS.length} judged`}
        </span>
        {completedCount >= 3 && (
          <button className="btn btn--primary" onClick={onFinish}>
            See your evaluations →
          </button>
        )}
      </div>
    </div>
  );
}

function Summary({ placements, onAdvance, onBack }) {
  const perTag = {};
  let totalJudged = 0, totalCorrect = 0, pairsJudged = 0;
  for (const pair of PAIRS) {
    const placed = placements[pair.id] || {};
    const anyPlaced = pair.tags.some((t) => placed[t.id]);
    if (anyPlaced) pairsJudged += 1;
    for (const t of pair.tags) {
      const bucket = placed[t.id];
      if (!bucket) continue;
      const correct = (bucket === "well" && t.well) || (bucket === "badly" && !t.well);
      if (!perTag[t.id]) perTag[t.id] = { total: 0, correct: 0 };
      perTag[t.id].total += 1;
      if (correct) perTag[t.id].correct += 1;
      totalJudged += 1;
      if (correct) totalCorrect += 1;
    }
  }
  const rows = Object.entries(perTag).sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="gen">
      <div className="gen__prompt">
        <div className="gen__prompt-title">Your evaluations</div>
        <div className="gen__prompt-body">
          You judged <strong>{pairsJudged}</strong> output{pairsJudged === 1 ? "" : "s"} across <strong>{totalJudged}</strong> qualities. Here's how often you agreed with the designers' verdicts:
        </div>
      </div>

      <div className="tag__summary">
        {rows.map(([tagId, { total, correct }]) => (
          <div key={tagId} className="tag__summary-row">
            <div className="tag__summary-label">{TAGS[tagId]?.label || tagId}</div>
            <div className="tag__summary-score">{correct}/{total}</div>
            <div className="tag__summary-bar">
              <div
                className="tag__summary-bar-fill"
                style={{ width: `${(correct / Math.max(total, 1)) * 100}%` }}
              />
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="tag__placeholder">(you didn't judge any qualities)</div>
        )}
      </div>

      <div className="tag__summary-total">
        overall agreement: <strong>{totalCorrect}</strong> / {totalJudged}
      </div>

      <div className="gen__footer">
        <button className="btn btn--ghost" onClick={onBack}>← Back to examples</button>
        {onAdvance && (
          <button className="btn btn--primary" onClick={onAdvance}>
            Done →
          </button>
        )}
      </div>
    </div>
  );
}
