import { useEffect, useRef, useState } from "react";

import { prefersReducedMotion } from "@/lib/motion";

import { useThinkingMessage } from "../thinkingMessages";

interface ThinkingIndicatorProps {
  active: boolean;
}

const EXIT_MS = 200;
const TEXT_FADE_MS = 220;

export function ThinkingIndicator({ active }: ThinkingIndicatorProps) {
  const [mounted, setMounted] = useState(active);
  const [leaving, setLeaving] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const rawText = useThinkingMessage(mounted && !leaving);
  const [displayText, setDisplayText] = useState(rawText);
  const [textFading, setTextFading] = useState(false);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (active) {
      clearTimeout(exitTimer.current);
      setLeaving(false);
      setMounted(true);
      return;
    }
    if (!mounted) return;
    setLeaving(true);
    exitTimer.current = setTimeout(() => setMounted(false), EXIT_MS);
    return () => clearTimeout(exitTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    if (displayText === rawText) return;
    if (prefersReducedMotion()) {
      setDisplayText(rawText);
      return;
    }
    setTextFading(true);
    fadeTimer.current = setTimeout(() => {
      setDisplayText(rawText);
      setTextFading(false);
    }, TEXT_FADE_MS);
    return () => clearTimeout(fadeTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawText]);

  if (!mounted) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex min-h-[46px] items-center gap-[11px] pl-0.5 ${leaving ? "fv-indicator-out" : "fv-indicator-in"}`}
    >
      <svg width="64" height="42" viewBox="0 0 64 42" fill="none" aria-hidden="true">
        <path
          className="fv-thinker-cloud-far stroke-current text-accent"
          style={{ strokeOpacity: 0.4 }}
          strokeWidth={1.3}
          strokeLinecap="round"
          d="M40 35c1.3-3.2 4.2-4.4 6.8-3.3 1.5.6 2.4 1.8 3.2 3.3"
        />
        <path
          className="fv-thinker-cloud-near stroke-current text-accent"
          style={{ strokeOpacity: 0.7 }}
          strokeWidth={1.5}
          strokeLinecap="round"
          d="M6 40.5c2.4-6 7.4-8.2 12.4-6.3 2.9 1.1 4.9 3.2 6.4 6.3"
        />
        <path
          className="fv-thinker-trail stroke-current text-accent"
          style={{ strokeOpacity: 0.28, strokeDasharray: "3 5" }}
          strokeWidth={1.3}
          strokeLinecap="round"
          d="M2 17h11"
        />
        <g transform="translate(-1.8 -3.25) scale(1.05)">
          <g className="fv-thinker-plane stroke-current text-accent" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M44.6 19.6c-1.6 1.7-3.9 2.7-6.6 2.9l-18-.3L7.4 12.4l7.6 4 23 .3c2.7.2 5 1.2 6.6 2.9Z" />
            <path d="M14.2 15.8 8.6 6.2h-2.2l3.3 7.2Z" />
            <path d="M4.4 6h6.2" />
            <path d="M33 22.4 18.2 29.6l-4-.2 9.8-7.1Z" />
            <path d="M17.4 14h4.2c1.6 0 1.6 3.6 0 3.6h-4.2c-1.6 0-1.6-3.6 0-3.6Z" />
            <path d="M38.4 17.2 41.6 18.6l-3.2.3Z" />
            <g className="fill-current text-accent">
              <circle cx={24.2} cy={19.4} r={0.85} />
              <circle cx={27.6} cy={19.4} r={0.85} />
              <circle cx={31} cy={19.4} r={0.85} />
              <circle cx={34.4} cy={19.4} r={0.85} />
            </g>
          </g>
        </g>
      </svg>
      <span
        className="min-h-[20px] text-[13.5px] text-muted-foreground transition-opacity duration-[220ms] ease-out"
        style={{ opacity: textFading ? 0 : 1 }}
      >
        {displayText}
      </span>
    </div>
  );
}
