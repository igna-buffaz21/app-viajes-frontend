// Escena "04 · Playa / verano" de Animaciones.html (trigger doc: theme:beach).
interface SceneProps {
  className?: string;
}

export function BeachScene({ className }: SceneProps = {}) {
  return (
    <svg width="176" height="56" viewBox="0 0 176 56" aria-hidden="true" className={className}>
      <circle
        cx={132}
        cy={16}
        r={9}
        className="fill-accent"
        opacity={0.9}
        style={{
          animation: "fv-scene-pulse 3.6s ease-in-out infinite",
          transformBox: "fill-box",
          transformOrigin: "center",
        }}
      />
      <line x1="0" y1="30" x2="176" y2="30" className="stroke-border" strokeWidth={1} />
      <g style={{ animation: "fv-scene-wave 4s linear infinite" }}>
        <path
          d="M-40 38 q10 -5 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0"
          fill="none"
          className="stroke-muted-foreground"
          strokeWidth={1.6}
        />
      </g>
      <g style={{ animation: "fv-scene-wave 6s linear infinite", animationDelay: "-1.5s" }}>
        <path
          d="M-40 45 q10 -5 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0"
          fill="none"
          className="stroke-muted-foreground"
          strokeWidth={1.6}
          opacity={0.6}
        />
      </g>
      <g
        style={{
          animation: "fv-scene-sway 5s ease-in-out infinite",
          transformBox: "fill-box",
          transformOrigin: "bottom center",
        }}
      >
        <g transform="translate(24,10)" className="stroke-primary" strokeWidth={1.6} fill="none" strokeLinecap="round">
          <path d="M8 20 L8 6" />
          <path d="M8 6 q-8 -2 -10 4" />
          <path d="M8 6 q8 -2 10 4" />
          <path d="M8 6 q-1 -7 -7 -8" />
          <path d="M8 6 q1 -7 7 -8" />
        </g>
      </g>
    </svg>
  );
}
