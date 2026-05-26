// MapBackground — abstract Battersea-ish street SVG, ported from jobs.jsx.
// Used as a lightweight placeholder behind map pins (jobs map, drawer, service area).

export function MapBackground() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, opacity: 0.7 }}
    >
      <defs>
        <pattern id="fx-map-grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#D8DAE2" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="#EDEFF5" />
      <rect width="100%" height="100%" fill="url(#fx-map-grid)" />
      {/* River — Thames-ish curve at top */}
      <path
        d="M 0 60 Q 100 100, 200 70 T 400 90 L 400 50 Q 300 60, 200 40 T 0 30 Z"
        fill="#C8D2E2"
        opacity="0.6"
      />
      {/* Streets */}
      <g stroke="#C9CDD8" strokeWidth="3" fill="none">
        <path d="M 40 0 L 80 300" />
        <path d="M 200 0 L 240 300" />
        <path d="M 360 0 L 320 300" />
        <path d="M 0 130 L 400 110" />
        <path d="M 0 200 L 400 220" />
      </g>
      <g stroke="#D5D9E3" strokeWidth="1.5" fill="none">
        <path d="M 120 0 L 140 300" />
        <path d="M 280 0 L 290 300" />
        <path d="M 0 80 L 400 70" />
        <path d="M 0 170 L 400 175" />
        <path d="M 0 250 L 400 260" />
      </g>
      {/* Park blob */}
      <ellipse cx="100" cy="220" rx="55" ry="36" fill="#CFE0CB" opacity="0.7" />
      <text x="100" y="225" textAnchor="middle" fill="#7A8C75" fontFamily="Geist" fontSize="9">
        Battersea Park
      </text>
    </svg>
  );
}
