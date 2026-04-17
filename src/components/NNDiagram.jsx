import { useEffect, useState } from "react";

// Shared neural-network animation. Inputs → 2 hidden layers → 1 output.
// Timeline (fractions of duration):
//   0.00  inputs fade in
//   0.10  input→h1 edges pulse (staggered across edges)
//   0.30  h1 nodes activate
//   0.35  h1→h2 edges pulse
//   0.55  h2 nodes activate
//   0.60  h2→output edges pulse
//   0.82  output node + label reveal

const HIDDEN1 = 6;
const HIDDEN2 = 5;
const W = 480;
const H = 260;
const COL_X = [50, 185, 320, 430];

export default function NNDiagram({
  inputs,   // [{ label: string, value: number 0..1 }]
  output,   // { label: string, tone: "pos" | "neg" | "spam" | "ham" | "neutral" }
  duration = 9000,
  running = true,
  onComplete,
}) {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!running) { setStarted(false); return; }
    // force reflow so CSS animations restart if component is reused
    const t = setTimeout(() => setStarted(true), 20);
    const done = setTimeout(() => onComplete?.(), duration + 40);
    return () => { clearTimeout(t); clearTimeout(done); };
  }, [running, duration]);

  const nInputs = inputs.length;
  const inputY = distribute(nInputs, H);
  const h1Y = distribute(HIDDEN1, H);
  const h2Y = distribute(HIDDEN2, H);
  const outY = H / 2;

  const dur = duration;
  const edges1 = [];
  for (let i = 0; i < nInputs; i++)
    for (let j = 0; j < HIDDEN1; j++)
      edges1.push({ x1: COL_X[0], y1: inputY[i], x2: COL_X[1], y2: h1Y[j] });
  const edges2 = [];
  for (let i = 0; i < HIDDEN1; i++)
    for (let j = 0; j < HIDDEN2; j++)
      edges2.push({ x1: COL_X[1], y1: h1Y[i], x2: COL_X[2], y2: h2Y[j] });
  const edges3 = [];
  for (let i = 0; i < HIDDEN2; i++)
    edges3.push({ x1: COL_X[2], y1: h2Y[i], x2: COL_X[3], y2: outY });

  return (
    <div
      className={`nn ${started ? "nn--running" : ""}`}
      style={{ "--nn-duration": `${dur}ms` }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="nn__svg" preserveAspectRatio="xMidYMid meet">
        <g className="nn__edges">
          {edges1.map((e, i) => (
            <line key={`e1-${i}`} className="nn__edge nn__edge--1"
              x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              style={{ animationDelay: `${0.10 * dur + (i / edges1.length) * 0.18 * dur}ms` }} />
          ))}
          {edges2.map((e, i) => (
            <line key={`e2-${i}`} className="nn__edge nn__edge--2"
              x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              style={{ animationDelay: `${0.35 * dur + (i / edges2.length) * 0.18 * dur}ms` }} />
          ))}
          {edges3.map((e, i) => (
            <line key={`e3-${i}`} className="nn__edge nn__edge--3"
              x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              style={{ animationDelay: `${0.60 * dur + (i / edges3.length) * 0.15 * dur}ms` }} />
          ))}
        </g>

        {inputs.map((inp, i) => (
          <g key={`in-${i}`} className="nn__in">
            <circle cx={COL_X[0]} cy={inputY[i]} r={12}
              className="nn__node nn__node--input"
              style={{
                animationDelay: `${i * 80}ms`,
                opacity: 0.35 + 0.65 * (inp.value ?? 0.7),
              }} />
            <text x={COL_X[0] - 18} y={inputY[i]}
              className="nn__input-label"
              textAnchor="end" dominantBaseline="middle"
              style={{ animationDelay: `${i * 80}ms` }}>
              {inp.label}
            </text>
          </g>
        ))}

        {h1Y.map((y, i) => (
          <circle key={`h1-${i}`} className="nn__node nn__node--hidden"
            cx={COL_X[1]} cy={y} r={10}
            style={{ animationDelay: `${0.28 * dur + i * 30}ms` }} />
        ))}
        {h2Y.map((y, i) => (
          <circle key={`h2-${i}`} className="nn__node nn__node--hidden"
            cx={COL_X[2]} cy={y} r={10}
            style={{ animationDelay: `${0.52 * dur + i * 30}ms` }} />
        ))}

        <g>
          <circle cx={COL_X[3]} cy={outY} r={15}
            className={`nn__node nn__node--output nn__node--${output.tone}`}
            style={{ animationDelay: `${0.82 * dur}ms` }} />
          <text x={COL_X[3]} y={outY + 42}
            className={`nn__output-label nn__output-label--${output.tone}`}
            textAnchor="middle" dominantBaseline="middle"
            style={{ animationDelay: `${0.82 * dur}ms` }}>
            {output.label}
          </text>
        </g>
      </svg>
    </div>
  );
}

function distribute(n, height) {
  const pad = 26;
  if (n === 1) return [height / 2];
  const step = (height - 2 * pad) / (n - 1);
  return Array.from({ length: n }, (_, i) => pad + i * step);
}
