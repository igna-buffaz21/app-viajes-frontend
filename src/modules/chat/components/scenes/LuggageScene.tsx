// Escena "02 · Maleta en cinta" de Animaciones.html — estado neutro/default.
export function LuggageScene() {
  return (
    <svg width="176" height="56" viewBox="0 0 176 56" aria-hidden="true">
      <g className="fv-scene-ride" style={{ animationDuration: "5.5s", animationTimingFunction: "linear", animationIterationCount: "infinite" }}>
        <g transform="translate(16,14)">
          <path d="M7 5 a7 5 0 0 1 12 0" fill="none" className="stroke-primary" strokeWidth={1.4} />
          <rect x="0" y="5" width="26" height="19" rx="4" className="fill-primary" />
          <rect x="11" y="5" width="4" height="19" fill="#FFFFFF" opacity={0.35} />
        </g>
      </g>
      <rect x="0" y="38" width="176" height="6" rx="3" className="fill-border" />
      <line
        x1="0"
        y1="41"
        x2="176"
        y2="41"
        className="fv-scene-belt stroke-muted-foreground"
        strokeWidth={2}
        strokeDasharray="6 8"
        style={{ animationDuration: "1.4s", animationTimingFunction: "linear", animationIterationCount: "infinite" }}
      />
      <rect x="10" y="46" width="6" height="4" rx="2" className="fill-primary-soft" />
      <rect x="84" y="46" width="6" height="4" rx="2" className="fill-primary-soft" />
      <rect x="158" y="46" width="6" height="4" rx="2" className="fill-primary-soft" />
    </svg>
  );
}
