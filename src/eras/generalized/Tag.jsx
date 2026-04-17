import { useMemo, useState } from "react";
import { PAIRS, TAGS } from "./tagData.js";

// Drag (or click) each tag into "Did well" or "Did badly".
// Click-to-cycle fallback so it works without a mouse: click a tag to cycle
// tray → well → badly → tray.

export default function Tag({ onAdvance }) {
  const [idx, setIdx] = useState(0);
  // placements: { [pairId]: { [tagId]: "tray" | "well" | "badly" } }
  const [placements, setPlacements] = useState({});
  const [checked, setChecked] = useState({}); // { [pairId]: true }

  const pair = PAIRS[idx];
  const isLast = idx === PAIRS.length - 1;

  const pairPlacements = placements[pair.id] || {};
  const isChecked = !!checked[pair.id];

  const allPlaced = pair.tags.every(
    (t) => pairPlacements[t.id] === "well" || pairPlacements[t.id] === "badly"
  );

  const setTag = (tagId, bucket) => {
    if (isChecked) return;
    setPlacements({
      ...placements,
      [pair.id]: { ...pairPlacements, [tagId]: bucket },
    });
  };

  const clickCycle = (tagId) => {
    const cur = pairPlacements[tagId] || "tray";
    const next =
      cur === "tray" ? "well" : cur === "well" ? "badly" : "tray";
    setTag(tagId, next);
  };

  const onDragStart = (e, tagId) => {
    if (isChecked) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", tagId);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e) => {
    if (isChecked) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (e, bucket) => {
    if (isChecked) return;
    e.preventDefault();
    const tagId = e.dataTransfer.getData("text/plain");
    if (tagId) setTag(tagId, bucket);
  };

  const handleCheck = () => {
    setChecked({ ...checked, [pair.id]: true });
  };

  const handleNext = () => {
    if (!isLast) setIdx(idx + 1);
  };
  const handleBack = () => {
    if (idx > 0) setIdx(idx - 1);
  };

  // For feedback: compare placement to designer's verdict
  const verdictFor = (tagId) => pair.tags.find((t) => t.id === tagId).verdict;
  const correctFor = (tagId) =>
    isChecked && pairPlacements[tagId] === verdictFor(tagId);
  const wrongFor = (tagId) =>
    isChecked && pairPlacements[tagId] !== verdictFor(tagId);

  const bucketTags = (bucket) =>
    pair.tags.filter((t) => pairPlacements[t.id] === bucket);
  const trayTags = pair.tags.filter((t) => !pairPlacements[t.id] || pairPlacements[t.id] === "tray");

  // stable ordering: after check, also show the "correct bucket" tags
  const correctBucketTags = (bucket) =>
    isChecked ? pair.tags.filter((t) => t.verdict === bucket) : [];

  return (
    <div className="gen">
      <div className="gen__prompt">
        <div className="gen__prompt-title">
          What did the model learn? ({idx + 1} / {PAIRS.length})
        </div>
        <div className="gen__prompt-body">
          We gave our trained model this prompt. It produced the continuation below. Drag each tag into <strong>Did well</strong> or <strong>Did badly</strong>.
        </div>
      </div>

      <div className="tag__exchange">
        <div className="tag__prompt">
          <div className="tag__role">prompt</div>
          <div className={`tag__text ${pair.mono ? "tag__text--mono" : ""}`}>{pair.prompt}</div>
        </div>
        <div className="tag__cont">
          <div className="tag__role">model output</div>
          <div className={`tag__text ${pair.mono ? "tag__text--mono" : ""}`}>{pair.continuation}</div>
        </div>
      </div>

      <div className="tag__workspace">
        <div
          className="tag__bucket tag__bucket--well"
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, "well")}
        >
          <div className="tag__bucket-label">Did well ✓</div>
          <div className="tag__bucket-chips">
            {bucketTags("well").map((t) => (
              <TagChip
                key={t.id}
                tag={TAGS[t.id]}
                tagId={t.id}
                onClick={() => clickCycle(t.id)}
                onDragStart={(e) => onDragStart(e, t.id)}
                draggable={!isChecked}
                correct={correctFor(t.id)}
                wrong={wrongFor(t.id)}
              />
            ))}
          </div>
        </div>

        <div className="tag__tray"
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, "tray")}
        >
          <div className="tag__bucket-label">Tags</div>
          <div className="tag__bucket-chips">
            {trayTags.map((t) => (
              <TagChip
                key={t.id}
                tag={TAGS[t.id]}
                tagId={t.id}
                onClick={() => clickCycle(t.id)}
                onDragStart={(e) => onDragStart(e, t.id)}
                draggable={!isChecked}
              />
            ))}
            {trayTags.length === 0 && (
              <span className="tag__tray-empty">
                {isChecked ? "–" : "all placed"}
              </span>
            )}
          </div>
        </div>

        <div
          className="tag__bucket tag__bucket--badly"
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, "badly")}
        >
          <div className="tag__bucket-label">Did badly ✗</div>
          <div className="tag__bucket-chips">
            {bucketTags("badly").map((t) => (
              <TagChip
                key={t.id}
                tag={TAGS[t.id]}
                tagId={t.id}
                onClick={() => clickCycle(t.id)}
                onDragStart={(e) => onDragStart(e, t.id)}
                draggable={!isChecked}
                correct={correctFor(t.id)}
                wrong={wrongFor(t.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="gen__footer">
        {idx > 0 && (
          <button className="btn btn--ghost" onClick={handleBack}>← Back</button>
        )}
        {!isChecked && (
          <button
            className="btn btn--primary"
            disabled={!allPlaced}
            onClick={handleCheck}
          >
            {allPlaced ? "Check →" : "Place every tag"}
          </button>
        )}
        {isChecked && !isLast && (
          <button className="btn btn--primary" onClick={handleNext}>
            Next example →
          </button>
        )}
        {isChecked && isLast && (
          <button className="btn btn--primary" onClick={onAdvance}>
            One model, many tasks →
          </button>
        )}
        <span className="gen__footer-hint">drag, or click to cycle</span>
      </div>
    </div>
  );
}

function TagChip({ tag, tagId, onClick, onDragStart, draggable, correct, wrong }) {
  const cls = [
    "tag__chip",
    `tag__chip--${tag.polarity}`,
    correct ? "tag__chip--correct" : "",
    wrong ? "tag__chip--wrong" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type="button"
      className={cls}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      {tag.label}
    </button>
  );
}
