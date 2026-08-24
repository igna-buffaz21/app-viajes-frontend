import { cn } from "@/lib/utils";

export type LogoVariant = "default" | "mono" | "onDark" | "micro";

interface LogoProps {
  variant?: LogoVariant;
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

const PLANE_PATHS = [
  "M44.6 19.6c-1.6 1.7-3.9 2.7-6.6 2.9l-18-.3L7.4 12.4l7.6 4 23 .3c2.7.2 5 1.2 6.6 2.9Z",
  "M14.2 15.8 8.6 6.2h-2.2l3.3 7.2Z",
  "M4.4 6h6.2",
  "M33 22.4 18.2 29.6l-4-.2 9.8-7.1Z",
];
const ENGINE_PATH = "M17.4 14h4.2c1.6 0 1.6 3.6 0 3.6h-4.2c-1.6 0-1.6-3.6 0-3.6Z";
const COCKPIT_PATH = "M38.4 17.2 41.6 18.6l-3.2.3Z";
const WINDOW_CENTERS: Array<[number, number]> = [
  [24.2, 19.4],
  [27.6, 19.4],
  [31, 19.4],
  [34.4, 19.4],
];
const CLOUD_FAR = "M26 34.5c1-2.5 3.3-3.5 5.5-2.6 1.2.5 2 1.4 2.6 2.6";
const CLOUD_NEAR = "M4.5 39c1.6-4.2 5.6-5.9 9.6-4.6 2.3.8 3.9 2.4 5 4.6";

export function Logo({ variant = "default", size = 40, withWordmark = false, className }: LogoProps) {
  const isMicro = variant === "micro";
  const planeColor = variant === "mono" ? "text-primary" : "text-accent";
  const cloudColor = variant === "onDark" ? "text-white" : planeColor;

  return (
    <span className={cn("inline-flex items-center gap-[11px]", className)}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" role="img" aria-label="FreeVago">
        {!isMicro && (
          <path
            d={CLOUD_FAR}
            className={cn("stroke-current", cloudColor)}
            style={{ strokeOpacity: variant === "onDark" ? 0.3 : 0.4 }}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        )}
        <path
          d={CLOUD_NEAR}
          className={cn("stroke-current", cloudColor)}
          style={{ strokeOpacity: variant === "onDark" ? 0.55 : 0.75 }}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
        <g className={cn("stroke-current", planeColor)} strokeWidth={isMicro ? 3 : 1.6} strokeLinecap="round" strokeLinejoin="round">
          {PLANE_PATHS.map((d) => (
            <path key={d} d={d} />
          ))}
          {!isMicro && (
            <>
              <path d={ENGINE_PATH} />
              <path d={COCKPIT_PATH} />
            </>
          )}
        </g>
        {!isMicro && (
          <g className={cn("fill-current", planeColor)}>
            {WINDOW_CENTERS.map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={0.8} />
            ))}
          </g>
        )}
      </svg>
      {withWordmark && (
        <span
          className={cn(
            "font-display text-[26px] font-bold tracking-[-0.035em]",
            variant === "onDark" ? "text-white" : "text-primary"
          )}
        >
          FreeVago
        </span>
      )}
    </span>
  );
}
