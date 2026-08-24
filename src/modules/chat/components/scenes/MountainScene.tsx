// Fusión de las escenas "03 · Clima frío" (nieve, trigger doc: weather:snow)
// y "05 · Montaña" (picos, trigger doc: theme:mountain) de Animaciones.html.
// Se combinaron en un solo componente por decisión del usuario: la categoría
// "montaña fría" del detector no distingue nieve de cordillera.
const SNOWFLAKES = [
  { cx: 26, cy: 12, r: 1.6, duration: "6s", delay: "0s" },
  { cx: 48, cy: 8, r: 1.2, duration: "8s", delay: "-2s" },
  { cx: 70, cy: 10, r: 1.8, duration: "5.2s", delay: "-1.2s" },
  { cx: 96, cy: 6, r: 1.3, duration: "7.4s", delay: "-3.4s" },
  { cx: 118, cy: 11, r: 1.6, duration: "6.6s", delay: "-4.1s" },
  { cx: 140, cy: 7, r: 1.1, duration: "9s", delay: "-5.5s" },
  { cx: 158, cy: 12, r: 1.5, duration: "7s", delay: "-2.8s" },
];

interface SceneProps {
  className?: string;
}

export function MountainScene({ className }: SceneProps = {}) {
  return (
    <svg width="176" height="56" viewBox="0 0 176 56" aria-hidden="true" className={className}>
      <g style={{ animation: "fv-scene-drift 30s linear infinite" }}>
        <g transform="translate(80,6)" className="fill-muted">
          <circle cx={9} cy={8} r={5} />
          <circle cx={19} cy={8} r={7} />
          <rect x={3} y={9} width={24} height={6} rx={3} />
        </g>
      </g>
      <g style={{ animation: "fv-scene-bird 14s linear infinite" }}>
        <path
          d="M0 6 q5 -5 9 0 q4 -5 9 0"
          fill="none"
          className="stroke-muted-foreground"
          strokeWidth={1.3}
          strokeLinecap="round"
          opacity={0.7}
        />
      </g>
      <path d="M-6 50 L40 22 L82 50 Z" className="fill-muted-foreground" opacity={0.55} />
      <path d="M62 50 L108 16 L154 50 Z" className="fill-primary" />
      <path d="M108 16 L116 21 L112 23 L120 28 L96 28 Z" fill="#FFFFFF" />
      <path d="M130 50 L176 26 L182 50 Z" className="fill-muted-foreground" opacity={0.55} />
      <line x1="0" y1="50" x2="176" y2="50" className="stroke-border" strokeWidth={1} />
      {SNOWFLAKES.map((flake, index) => (
        <circle
          key={index}
          cx={flake.cx}
          cy={flake.cy}
          r={flake.r}
          className="fill-muted-foreground"
          style={{ animation: `fv-scene-fall ${flake.duration} linear infinite`, animationDelay: flake.delay }}
        />
      ))}
    </svg>
  );
}
