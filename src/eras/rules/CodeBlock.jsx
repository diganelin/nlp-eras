import { ruleToSource } from "./elizaEngine.js";

// Tiny token-based highlighter for Python-ish dict literals.
function highlight(source) {
  const out = [];
  let i = 0;
  let key = 0;
  while (i < source.length) {
    const ch = source[i];

    // Comments
    if (ch === "#") {
      const end = source.indexOf("\n", i);
      const stop = end === -1 ? source.length : end;
      out.push(<span key={key++} className="code-comment">{source.slice(i, stop)}</span>);
      i = stop;
      continue;
    }

    // Strings (single or double quoted, no escapes for our purposes)
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      while (j < source.length && source[j] !== quote) j++;
      out.push(<span key={key++} className="code-string">{source.slice(i, j + 1)}</span>);
      i = j + 1;
      continue;
    }

    out.push(source[i]);
    i++;
  }
  return out;
}

export default function CodeBlock({
  rule,
  source,
  onClick,
  selected = false,
  state = null, // null | "correct" | "wrong"
  readonly = false,
  draggable = false,
}) {
  const text = source ?? (rule ? ruleToSource(rule) : "");
  const classes = [
    "code-block",
    onClick && !readonly ? "code-block--clickable" : "",
    readonly ? "code-block--readonly" : "",
    draggable ? "code-block--draggable" : "",
    selected ? "code-block--selected" : "",
    state === "correct" ? "code-block--correct" : "",
    state === "wrong" ? "code-block--wrong" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const onDragStart = draggable
    ? (e) => {
        e.dataTransfer.setData("text/plain", text);
        e.dataTransfer.effectAllowed = "copy";
      }
    : undefined;

  const dragStyle = draggable
    ? { cursor: "grab", userSelect: "none" }
    : undefined;

  return (
    <pre
      className={classes}
      style={dragStyle}
      onClick={onClick}
      draggable={draggable || undefined}
      onDragStart={onDragStart}
    >
      <code style={dragStyle}>{highlight(text)}</code>
    </pre>
  );
}
