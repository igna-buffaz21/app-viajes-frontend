// Escena "08 · Gastronomía" de Animaciones.html (trigger doc: interest:food).
const STEAM_WISPS = [
  { d: "M78 30 q-5 -6 0 -12", delay: "0s" },
  { d: "M88 30 q5 -7 0 -14", delay: "-1.1s" },
  { d: "M98 30 q-5 -6 0 -12", delay: "-2.2s" },
];

interface SceneProps {
  className?: string;
}

export function FoodScene({ className }: SceneProps = {}) {
  return (
    <svg width="176" height="56" viewBox="0 0 176 56" aria-hidden="true" className={className}>
      {STEAM_WISPS.map((wisp, index) => (
        <g
          key={index}
          style={{
            animation: "fv-scene-steam 3.4s ease-out infinite",
            animationDelay: wisp.delay,
            transformBox: "fill-box",
            transformOrigin: "bottom center",
          }}
        >
          <path d={wisp.d} fill="none" className="stroke-muted-foreground" strokeWidth={1.4} strokeLinecap="round" opacity={0.7} />
        </g>
      ))}
      <path d="M64 34 q24 12 48 0 Z" className="fill-primary" />
      <ellipse cx={88} cy={34} rx={24} ry={3.4} className="fill-muted-foreground" opacity={0.55} />
      <g style={{ animation: "fv-scene-bob 5s ease-in-out infinite" }}>
        <g transform="translate(126,20)" className="fill-muted-foreground">
          <path d="M0 0 L14 0 L10 11 L4 11 Z" />
          <rect x={6} y={11} width={2} height={8} />
          <rect x={2} y={19} width={10} height={1.8} rx={0.9} />
        </g>
      </g>
      <g transform="translate(46,22)" className="stroke-muted-foreground" strokeWidth={1.5} strokeLinecap="round">
        <path d="M4 0 L4 20" />
        <path d="M12 0 L12 20" />
      </g>
      <line x1="24" y1="46" x2="152" y2="46" className="stroke-border" strokeWidth={1} />
    </svg>
  );
}
