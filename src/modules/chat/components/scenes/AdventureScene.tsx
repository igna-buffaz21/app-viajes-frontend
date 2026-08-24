// Escena "09 · Aventura / mochilero" de Animaciones.html (trigger doc: style:backpacking).
interface SceneProps {
  className?: string;
}

export function AdventureScene({ className }: SceneProps = {}) {
  return (
    <svg width="176" height="56" viewBox="0 0 176 56" aria-hidden="true" className={className}>
      <g style={{ animation: "fv-scene-drift 34s linear infinite" }}>
        <g transform="translate(60,4)" className="fill-muted">
          <circle cx={8} cy={7} r={5} />
          <circle cx={18} cy={7} r={6.5} />
          <rect x={3} y={8} width={23} height={6} rx={3} />
        </g>
      </g>
      <path d="M104 44 L140 18 L176 44 Z" className="fill-muted-foreground" opacity={0.55} />
      <path d="M0 44 q44 -6 88 0 t88 0" fill="none" className="stroke-border" strokeWidth={1.4} strokeDasharray="4 6" />
      <g style={{ animation: "fv-scene-ride 7s linear infinite" }}>
        <g style={{ animation: "fv-scene-bob 1s ease-in-out infinite" }}>
          <g transform="translate(10,20)" className="fill-primary">
            <rect x={0} y={4} width={16} height={18} rx={5} />
            <rect x={4} y={0} width={8} height={6} rx={3} className="fill-muted-foreground" />
            <rect x={3} y={12} width={10} height={2.4} rx={1.2} fill="#FFFFFF" opacity={0.5} />
          </g>
        </g>
      </g>
    </svg>
  );
}
