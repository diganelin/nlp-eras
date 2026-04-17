import { useEffect, useState } from "react";
import { STARTERS } from "./generateData.js";

// Stage 3 — "One model, many tasks". Student picks a starter. The preselected
// sample is streamed word-by-word to give the feel of autoregressive
// generation. No live model; samples are verbatim real char-RNN outputs
// from Karpathy (2015) plus one modern-LLM Python sample for contrast.

const WORD_MS = 45;

function tokenize(text) {
  // split on whitespace but keep whitespace so we can render verbatim
  return text.split(/(\s+)/);
}

export default function Generate() {
  const [starterId, setStarterId] = useState(null);
  const [sampleIdx, setSampleIdx] = useState(0);
  const [streamed, setStreamed] = useState("");
  const [streaming, setStreaming] = useState(false);

  const starter = STARTERS.find((s) => s.id === starterId);
  const sampleText = starter ? starter.samples[sampleIdx % starter.samples.length] : "";

  useEffect(() => {
    if (!starter) return;
    const tokens = tokenize(sampleText);
    setStreamed("");
    setStreaming(true);
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setStreamed(tokens.slice(0, i).join(""));
      if (i >= tokens.length) {
        clearInterval(interval);
        setStreaming(false);
      }
    }, WORD_MS);
    return () => clearInterval(interval);
  }, [starterId, sampleIdx]);

  const pickStarter = (id) => {
    setStarterId(id);
    setSampleIdx(0);
  };

  return (
    <div className="gen">
      <div className="gen__prompt">
        <div className="gen__prompt-title">One model, many tasks</div>
        <div className="gen__prompt-body">
          We didn't train a Shakespeare model, a code model, a Wikipedia model. We trained <strong>one</strong> next-word predictor and fed it different starting text. Pick a starter and watch it continue.
        </div>
      </div>

      <div className="gen__starters">
        {STARTERS.map((s) => (
          <button
            key={s.id}
            className={`gen__starter ${starterId === s.id ? "gen__starter--active" : ""}`}
            onClick={() => pickStarter(s.id)}
          >
            <span className="gen__starter-label">{s.label}</span>
            <span className="gen__starter-blurb">{s.blurb}</span>
          </button>
        ))}
      </div>

      {starter && (
        <div className="gen__generated">
          <div className="gen__source">
            <span className="gen__source-label">Source:</span>
            <a
              href="https://karpathy.github.io/2015/05/21/rnn-effectiveness/"
              target="_blank"
              rel="noopener noreferrer"
            >
              {starter.blurb}
            </a>
          </div>
          <div className={`gen__output ${starter.mono ? "gen__output--mono" : ""}`}>
            {streamed}
            {streaming && <span className="gen__cursor">▍</span>}
          </div>
          {starter.samples.length > 1 && (
            <div className="gen__generate-row">
              <button
                className="btn btn--ghost"
                disabled={streaming}
                onClick={() => setSampleIdx(sampleIdx + 1)}
              >
                Sample again
              </button>
            </div>
          )}
        </div>
      )}

      {!starter && (
        <div className="gen__placeholder">Pick a starter to watch the model generate.</div>
      )}

      <div className="gen__takeaway">
        <strong>Takeaway:</strong> locally the text looks like it came from the right source — Shakespeare sounds Shakespearean, C code has braces and comments. Globally it's nonsense. Fix that, and you get modern LLMs. (Hint: more data, more compute, better architecture. Next era.)
      </div>
    </div>
  );
}
