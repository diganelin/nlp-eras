// Small inline N-L-P mark: three stair-stepping tiles in graduated orange
// shades. No raster asset; scales cleanly at any size.
export default function Logo({ size = 30, className = "" }) {
  return (
    <svg
      viewBox="0 0 36 32"
      width={size}
      height={Math.round((size * 32) / 36)}
      className={`logo ${className}`}
      role="img"
      aria-label="NLP Eras Tour"
    >
      <rect x="0"  y="1"  width="14" height="14" rx="3" fill="#b8530a" />
      <rect x="11" y="9"  width="14" height="14" rx="3" fill="#d96a17" />
      <rect x="22" y="17" width="14" height="14" rx="3" fill="#f08020" />
      <text
        x="7"  y="9"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontFamily="'JetBrains Mono', ui-monospace, monospace"
        fontWeight="800"
        fontSize="10"
      >N</text>
      <text
        x="18" y="17"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontFamily="'JetBrains Mono', ui-monospace, monospace"
        fontWeight="800"
        fontSize="10"
      >L</text>
      <text
        x="29" y="25"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontFamily="'JetBrains Mono', ui-monospace, monospace"
        fontWeight="800"
        fontSize="10"
      >P</text>
    </svg>
  );
}
