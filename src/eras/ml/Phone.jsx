import { tokenizePreserving } from "./classifier.js";

// Phone-frame card. No sender shown — the message itself is the only signal.
//
// Words become clickable when onWordClick is provided. getWordClass(lcWord)
// returns extra class names for highlighting.
export default function Phone({
  text,
  onWordClick,
  getWordClass,
  highlight,
  time = "9:41",
  compact = false,
}) {
  const parts = tokenizePreserving(text);

  return (
    <div className={`phone ${highlight ? `phone--${highlight}` : ""} ${compact ? "phone--compact" : ""}`}>
      <div className="phone__notch" />
      <div className="phone__statusbar">
        <span>{time}</span>
        <span className="phone__signal">●●● 100%</span>
      </div>
      <div className="phone__screen">
        <div className="phone__bubble">
          {parts.map((p, i) =>
            p.isWord ? (
              <span
                key={i}
                className={`phone__word ${onWordClick ? "phone__word--clickable" : ""} ${getWordClass ? getWordClass(p.key) : ""}`}
                onClick={onWordClick ? () => onWordClick(p.key) : undefined}
              >
                {p.text}
              </span>
            ) : (
              <span key={i} className="phone__space">{p.text}</span>
            )
          )}
        </div>
      </div>
    </div>
  );
}
