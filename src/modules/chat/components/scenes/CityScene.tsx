// Escena "10 · Ciudad" de Animaciones.html (trigger doc: theme:city).
const WINDOWS = [
  { x: 45, y: 21, duration: "4s", delay: "0s" },
  { x: 53, y: 29, duration: "5.2s", delay: "-1.4s" },
  { x: 91, y: 16, duration: "4.6s", delay: "-2.1s" },
  { x: 100, y: 24, duration: "6s", delay: "-3.2s" },
  { x: 91, y: 32, duration: "5.4s", delay: "-.7s" },
  { x: 141, y: 26, duration: "4.2s", delay: "-2.8s" },
  { x: 149, y: 34, duration: "5.8s", delay: "-4.3s" },
];

interface SceneProps {
  className?: string;
}

export function CityScene({ className }: SceneProps = {}) {
  return (
    <svg width="176" height="56" viewBox="0 0 176 56" aria-hidden="true" className={className}>
      <g style={{ animation: "fv-scene-drift 32s linear infinite" }}>
        <g transform="translate(90,4)" className="fill-muted">
          <circle cx={8} cy={7} r={5} />
          <circle cx={18} cy={7} r={6.5} />
          <rect x={3} y={8} width={23} height={6} rx={3} />
        </g>
      </g>
      <rect x={16} y={26} width={20} height={20} className="fill-muted-foreground" opacity={0.55} />
      <rect x={40} y={16} width={22} height={30} className="fill-primary" />
      <rect x={66} y={30} width={16} height={16} className="fill-muted-foreground" />
      <rect x={86} y={10} width={24} height={36} className="fill-primary" />
      <rect x={114} y={24} width={18} height={22} className="fill-muted-foreground" opacity={0.55} />
      <rect x={136} y={20} width={22} height={26} className="fill-primary" />
      <g className="fill-accent">
        {WINDOWS.map((win, index) => (
          <rect
            key={index}
            x={win.x}
            y={win.y}
            width={4}
            height={4}
            style={{ animation: `fv-scene-blink ${win.duration} ease-in-out infinite`, animationDelay: win.delay }}
          />
        ))}
      </g>
      <line x1="0" y1="46" x2="176" y2="46" className="stroke-border" strokeWidth={1} />
      <g style={{ animation: "fv-scene-ride 6.5s linear infinite" }}>
        <g transform="translate(6,38)" className="fill-muted-foreground">
          <rect x={0} y={0} width={20} height={6} rx={2.5} />
          <circle cx={5} cy={7} r={1.8} />
          <circle cx={15} cy={7} r={1.8} />
        </g>
      </g>
    </svg>
  );
}
