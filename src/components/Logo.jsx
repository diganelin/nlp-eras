// N-L-P neural-net mark: three input nodes labeled in Courier New feeding
// into a single output node. ViewBox trimmed to the content bounding box
// so no extra whitespace around the logo.
export default function Logo({ size = 30, className = "" }) {
  // Content bounds (from the source SVG):
  //   inputs: cx 64, cy 64/128/192, r 34   -> x:[30,98]  y:[30,226]
  //   output: cx 190, cy 128, r 22         -> x:[168,212] y:[106,150]
  // Trimmed viewBox: "28 28 186 200" with 2px padding.
  const viewW = 186;
  const viewH = 200;
  const w = size;
  const h = Math.round((size * viewH) / viewW);
  return (
    <svg
      viewBox={`28 28 ${viewW} ${viewH}`}
      width={w}
      height={h}
      className={`logo ${className}`}
      role="img"
      aria-label="NLP Eras Tour"
    >
      <g stroke="#b8530a" strokeWidth="3" fill="none">
        <line x1="78" y1="64"  x2="190" y2="128" />
        <line x1="78" y1="128" x2="190" y2="128" />
        <line x1="78" y1="192" x2="190" y2="128" />
      </g>
      <g fill="#b8530a">
        <circle cx="64"  cy="64"  r="34" />
        <circle cx="64"  cy="128" r="34" />
        <circle cx="64"  cy="192" r="34" />
        <circle cx="190" cy="128" r="22" />
      </g>
      <g fill="#fff8ef" fontFamily="'Courier New', Courier, monospace" fontWeight="900" fontSize="64" textAnchor="middle">
        <text x="64" y="64"  dy=".35em">N</text>
        <text x="64" y="128" dy=".30em">L</text>
        <text x="64" y="192" dy=".40em">P</text>
      </g>
    </svg>
  );
}
