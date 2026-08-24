# Estética + Estructuración del Chat (FreeVago) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the FreeVago design system (palette, typography, logo, "thinking" animation) across the chat flow, and turn MS1's free-text markdown replies into readable, well-structured messages — including a dedicated "propuesta destacada" card for the final travel plan.

**Architecture:** Pure presentation-layer work inside `app-viajes-frontend`. Design tokens live in `src/index.css` (already the project's token file — shadcn's CSS-variable convention, no new config needed). New brand/animation components are added under `src/components/brand/` and `src/modules/chat/components/`. Markdown rendering uses `react-markdown` + `remark-gfm`. Structured-proposal detection is an isolated, documented heuristic (`src/modules/chat/messageParser.ts`) that only reads `ChatMessage.contenido` — it never touches `chatService`, the adapters, or `MicroServicioGrupo2`.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4 (`@theme inline` tokens), shadcn/radix-ui components, react-markdown, remark-gfm.

**Spec:** This plan implements the user's 4-point request delivered 2026-08-19 (design system application, logo/thinking animation, dynamic bubble height + autoscroll, markdown rendering + final-proposal card). The spec text is reproduced in full in the conversation that produced this plan; the reference conversation used for manual QA is in Task 10.

## Global Constraints

- Exact palette (source: `animacion-chat/.../FreeVago - Marca y espera.html`, confirmed as the real FreeVago brand file — do **not** use the unrelated "Modernist" `_ds/` template that ships in the same export folder): `--bg:#F7F8F7 --primary:#12414F --accent:#E8955C --text:#1C2422 --line:#E4E7E3 --surface:#FFFFFF --muted:#6B7975 --accent-soft:#FBF0E7 --primary-soft:#EDF2F3`.
- Fonts: display = Plus Jakarta Sans, UI = Inter, tabular/numbers = IBM Plex Mono. Self-hosted via `@fontsource-variable/*` (same pattern already used for Geist), no Google Fonts network call.
- **Scope boundary — FreeVago only.** This codebase (`app-viajes-frontend`, package name `tp1`) hosts **two unrelated products**: FreeVago (`AccessPage` at `/login-viajes`, `ChatPage`, `ResultsPage`) and a municipal/UrbanFlow product sharing the same repo (`LoginPage` with Clerk, `panel/*`, `operator/*`, `app/*`). Only FreeVago pages get the new design system. Never touch `src/modules/auth/pages/login.tsx`, `unauthorized.page.tsx`, `inactiveAccount.page.tsx`, `src/modules/home/*`, `src/components/app-sidebar.tsx`, `src/components/layout/panelLayout.tsx`, or anything under a `panel`/`operator`/`app` route.
- **Never touch:** `chat.service.ts`, `chat.real.adapter.ts`, `chat.mock.adapter.ts`, `chat.config.ts`, or anything in `MicroServicioGrupo2`. This plan only changes how `ChatMessage.contenido` / `ChatRespuesta.mensaje` (both already `string`) get *rendered*.
- `.dark` theme tokens are out of scope — FreeVago pages don't use a dark-mode toggle today, and the user only specified a light palette.
- The two existing hardcoded amber badges (`chat.page.tsx`'s "Modo demo" chip, `results.page.tsx`'s "Datos de ejemplo" banner) are intentional semantic warnings, not part of the grayscale-default problem. Leave them as-is.
- **No test framework exists in this project** (`grep` confirms zero `*.test.*`/`vitest.config.*` files, and `package.json` has no test script). Adding one is out of scope for a presentation-layer task. Verification instead uses: `npm run build` (real `tsc -b && vite build` — a genuine type/build check that already exists as a script) for every component-creation task, a throwaway `npx tsx` fixture script for the one piece of non-trivial pure logic (`messageParser.ts`), and manual browser QA (dev server) for integration tasks. Delete throwaway scripts after use — don't commit them.
- QA in the browser uses the fixed test identity from project memory: `testfront@gmail.com` / "Test Frontend" at `/login-viajes` — real shared Mongo Atlas DB, keep test data identifiable.
- Commit after each task with `git add <files> && git commit -m "..."` (repo already exists at `C:\Proyectos\app-viajes-frontend`).

---

## File Structure

- **Modify** `src/index.css` — design tokens (hex, not oklch, to match the spec exactly), font imports, new keyframes/utility classes for the thinking animation, message-entrance animation, and `prefers-reduced-motion` overrides.
- **Create** `src/lib/motion.ts` — one function, `prefersReducedMotion()`, shared by the scroll effect and the thinking indicator.
- **Create** `src/components/brand/Logo.tsx` — the jet isotipo + wordmark, used by both `AccessPage` and `ChatPage`.
- **Modify** `src/modules/session/pages/accessPage.tsx` — swap the plain-text "FreeVago" heading for `<Logo>`.
- **Create** `src/modules/chat/thinkingMessages.ts` — adapted from the design export (`animacion-chat/.../thinkingMessages.ts`), fixing the `@ts-ignore`-global-`React` hook so it actually compiles in this project.
- **Create** `src/modules/chat/components/ThinkingIndicator.tsx` — animated plane/clouds SVG + rotating status text, mount/unmount transitions, reduced-motion support. Replaces the "Pensando..." placeholder.
- **Create** `src/modules/chat/components/MarkdownMessage.tsx` — Nivel 1: generic markdown renderer (headers, lists, bold, tables, `<hr>`) styled with the design tokens.
- **Create** `src/modules/chat/messageParser.ts` — Nivel 2: the isolated, documented heuristic. Exports `isFinalProposal(markdown)` and `parseFinalProposal(markdown)`. This is the file that gets replaced/deleted if MS1 ever returns structured JSON.
- **Create** `src/modules/chat/components/ProposalCard.tsx` — Nivel 2: the highlighted proposal card (header, budget table, day-by-day accordion via the existing `Collapsible` primitive, CTA button).
- **Create** `src/modules/chat/components/MessageBubble.tsx` — per-message branching: user bubble vs. `MarkdownMessage` bubble vs. `ProposalCard`, plus the entrance animation.
- **Modify** `src/modules/chat/pages/chat.page.tsx` — wire in `Logo`, `ThinkingIndicator`, `MessageBubble`, autoscroll.
- **Modify** `package.json` (via `npm install`) — adds `react-markdown`, `remark-gfm`, `@fontsource-variable/plus-jakarta-sans`, `@fontsource-variable/inter`, `@fontsource/ibm-plex-mono`.

---

### Task 1: Design tokens and typography

**Files:**
- Modify: `src/index.css`

**Interfaces:**
- Produces: Tailwind utility classes `bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`, `bg-secondary`, `bg-muted`, `text-muted-foreground`, `bg-accent`, `text-accent`, `bg-card`, `border` (already consumed everywhere in `AccessPage`, `ChatPage`, `ResultsPage` — confirmed via grep that FreeVago-scope files have almost no hardcoded gray Tailwind classes, so this task alone re-themes those three pages with no JSX changes), plus new `font-display`/`font-mono` utilities and `.fv-*` animation utility classes consumed by Tasks 4–9.

- [ ] **Step 1: Install the three fonts**

Run: `cd C:/Proyectos/app-viajes-frontend && npm install @fontsource-variable/plus-jakarta-sans @fontsource-variable/inter @fontsource/ibm-plex-mono`

- [ ] **Step 2: Replace `src/index.css` in full**

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import "@fontsource-variable/plus-jakarta-sans";
@import "@fontsource-variable/inter";
@import "@fontsource/ibm-plex-mono/400.css";
@import "@fontsource/ibm-plex-mono/500.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
    --font-heading: var(--font-display);
    --font-display: 'Plus Jakarta Sans Variable', system-ui, sans-serif;
    --font-sans: 'Inter Variable', system-ui, sans-serif;
    --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
    --color-sidebar-ring: var(--sidebar-ring);
    --color-sidebar-border: var(--sidebar-border);
    --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
    --color-sidebar-accent: var(--sidebar-accent);
    --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
    --color-sidebar-primary: var(--sidebar-primary);
    --color-sidebar-foreground: var(--sidebar-foreground);
    --color-sidebar: var(--sidebar);
    --color-chart-5: var(--chart-5);
    --color-chart-4: var(--chart-4);
    --color-chart-3: var(--chart-3);
    --color-chart-2: var(--chart-2);
    --color-chart-1: var(--chart-1);
    --color-ring: var(--ring);
    --color-input: var(--input);
    --color-border: var(--border);
    --color-destructive: var(--destructive);
    --color-accent-soft: var(--accent-soft);
    --color-accent-foreground: var(--accent-foreground);
    --color-accent: var(--accent);
    --color-muted-foreground: var(--muted-foreground);
    --color-muted: var(--muted);
    --color-primary-soft: var(--primary-soft);
    --color-secondary-foreground: var(--secondary-foreground);
    --color-secondary: var(--secondary);
    --color-primary-foreground: var(--primary-foreground);
    --color-primary: var(--primary);
    --color-popover-foreground: var(--popover-foreground);
    --color-popover: var(--popover);
    --color-card-foreground: var(--card-foreground);
    --color-card: var(--card);
    --color-foreground: var(--foreground);
    --color-background: var(--background);
    --radius-sm: calc(var(--radius) * 0.6);
    --radius-md: calc(var(--radius) * 0.8);
    --radius-lg: var(--radius);
    --radius-xl: calc(var(--radius) * 1.4);
    --radius-2xl: calc(var(--radius) * 1.8);
    --radius-3xl: calc(var(--radius) * 2.2);
    --radius-4xl: calc(var(--radius) * 2.6);
}

:root {
    --background: #F7F8F7;
    --foreground: #1C2422;
    --card: #FFFFFF;
    --card-foreground: #1C2422;
    --popover: #FFFFFF;
    --popover-foreground: #1C2422;
    --primary: #12414F;
    --primary-foreground: #FFFFFF;
    --primary-soft: #EDF2F3;
    --secondary: #EDF2F3;
    --secondary-foreground: #12414F;
    --muted: #EDF2F3;
    --muted-foreground: #6B7975;
    --accent: #E8955C;
    --accent-foreground: #1C2422;
    --accent-soft: #FBF0E7;
    --destructive: oklch(0.577 0.245 27.325);
    --border: #E4E7E3;
    --input: #E4E7E3;
    --ring: #E8955C;
    --chart-1: oklch(0.87 0 0);
    --chart-2: oklch(0.556 0 0);
    --chart-3: oklch(0.439 0 0);
    --chart-4: oklch(0.371 0 0);
    --chart-5: oklch(0.269 0 0);
    --radius: 0.875rem;
    --sidebar: oklch(0.985 0 0);
    --sidebar-foreground: oklch(0.145 0 0);
    --sidebar-primary: oklch(0.205 0 0);
    --sidebar-primary-foreground: oklch(0.985 0 0);
    --sidebar-accent: oklch(0.97 0 0);
    --sidebar-accent-foreground: oklch(0.205 0 0);
    --sidebar-border: oklch(0.922 0 0);
    --sidebar-ring: oklch(0.708 0 0);
}

.dark {
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);
    --card: oklch(0.205 0 0);
    --card-foreground: oklch(0.985 0 0);
    --popover: oklch(0.205 0 0);
    --popover-foreground: oklch(0.985 0 0);
    --primary: oklch(0.922 0 0);
    --primary-foreground: oklch(0.205 0 0);
    --secondary: oklch(0.269 0 0);
    --secondary-foreground: oklch(0.985 0 0);
    --muted: oklch(0.269 0 0);
    --muted-foreground: oklch(0.708 0 0);
    --accent: oklch(0.269 0 0);
    --accent-foreground: oklch(0.985 0 0);
    --destructive: oklch(0.704 0.191 22.216);
    --border: oklch(1 0 0 / 10%);
    --input: oklch(1 0 0 / 15%);
    --ring: oklch(0.556 0 0);
    --chart-1: oklch(0.87 0 0);
    --chart-2: oklch(0.556 0 0);
    --chart-3: oklch(0.439 0 0);
    --chart-4: oklch(0.371 0 0);
    --chart-5: oklch(0.269 0 0);
    --sidebar: oklch(0.205 0 0);
    --sidebar-foreground: oklch(0.985 0 0);
    --sidebar-primary: oklch(0.488 0.243 264.376);
    --sidebar-primary-foreground: oklch(0.985 0 0);
    --sidebar-accent: oklch(0.269 0 0);
    --sidebar-accent-foreground: oklch(0.985 0 0);
    --sidebar-border: oklch(1 0 0 / 10%);
    --sidebar-ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
    }
  body {
    @apply bg-background text-foreground;
    }
  html {
    @apply font-sans;
    }
}

/* ——— FreeVago: animación "pensando" y transiciones de mensaje ———
   Valores tomados 1:1 de animacion-chat/.../FreeVago - Marca y espera.html */
@keyframes fv-plane-glide {
  0% { transform: translate(-7px, 2.5px) rotate(-3.2deg); }
  50% { transform: translate(7px, -3.5px) rotate(2.6deg); }
  100% { transform: translate(-7px, 2.5px) rotate(-3.2deg); }
}
@keyframes fv-cloud-near { from { transform: translateX(5px); } to { transform: translateX(-7px); } }
@keyframes fv-cloud-far { from { transform: translateX(3px); } to { transform: translateX(-4px); } }
@keyframes fv-trail { 0%, 100% { stroke-opacity: .12; } 50% { stroke-opacity: .42; } }
@keyframes fv-rest-pulse { 0%, 100% { opacity: .6; } 50% { opacity: 1; } }
@keyframes fv-indicator-in { from { opacity: 0; transform: scale(.9); } to { opacity: 1; transform: scale(1); } }
@keyframes fv-indicator-out { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(.96); } }
@keyframes fv-msg-in { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: none; } }

.fv-thinker-plane {
  transform-box: fill-box;
  transform-origin: center;
  animation: fv-plane-glide 2.6s cubic-bezier(.37,0,.63,1) infinite;
}
.fv-thinker-cloud-near { animation: fv-cloud-near 5.2s cubic-bezier(.37,0,.63,1) infinite alternate; }
.fv-thinker-cloud-far { animation: fv-cloud-far 7s cubic-bezier(.37,0,.63,1) infinite alternate; }
.fv-thinker-trail { animation: fv-trail 2.6s cubic-bezier(.37,0,.63,1) infinite; }
.fv-indicator-in { animation: fv-indicator-in .25s cubic-bezier(.16,1,.3,1) both; }
.fv-indicator-out { animation: fv-indicator-out .2s ease-in both; }
.fv-msg-in { animation: fv-msg-in .2s cubic-bezier(.16,1,.3,1) both; }

@media (prefers-reduced-motion: reduce) {
  .fv-thinker-plane { animation: fv-rest-pulse 2.6s ease-in-out infinite; }
  .fv-thinker-cloud-near,
  .fv-thinker-cloud-far,
  .fv-thinker-trail { animation: none; }
  .fv-indicator-in,
  .fv-indicator-out,
  .fv-msg-in { animation: none; }
}
```

- [ ] **Step 3: Verify the build compiles**

Run: `npm run build`
Expected: succeeds (no missing-import errors for the three new font packages).

- [ ] **Step 4: Manual visual check**

Run: `npm run dev`, open `/login-viajes` and `/chat` (mock mode). Confirm: background is off-white (`#F7F8F7`), primary buttons/user bubbles are teal (`#12414F`), no default Tailwind gray remains, headings use Plus Jakarta Sans, body text uses Inter. In mock mode, send messages until `ultimaRespuesta.estado === "listoParaBuscar"` and open **Ver resultados** (`/resultados`) — its flight/hotel/activity cards already use `border`/`text-muted-foreground` tokens, so they should already read as themed with zero code changes; confirm visually and flag it here if anything still looks gray.

- [ ] **Step 5: Commit**

```bash
git add src/index.css package.json package-lock.json
git commit -m "feat(design): apply FreeVago palette and typography tokens"
```

---

### Task 2: Logo component

**Files:**
- Create: `src/components/brand/Logo.tsx`
- Modify: `src/modules/session/pages/accessPage.tsx`
- Modify: `src/modules/chat/pages/chat.page.tsx` (header only — full rewrite happens in Task 9, so just swap the `<h1>` here to avoid Task 9 having to redo it)

**Interfaces:**
- Produces: `Logo({ variant?: "default" | "mono" | "onDark" | "micro"; size?: number; withWordmark?: boolean; className?: string })` — a React component, default export is named (`export function Logo`).
- Consumes: `cn` from `@/lib/utils` (already exists).

- [ ] **Step 1: Create the Logo component**

```tsx
// src/components/brand/Logo.tsx
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
```

- [ ] **Step 2: Wire into `accessPage.tsx`**

In `src/modules/session/pages/accessPage.tsx`, add the import:

```tsx
import { Logo } from "@/components/brand/Logo";
```

Replace:

```tsx
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">FreeVago</h1>
          <p className="mt-2 text-muted-foreground">
            Contanos quién sos para empezar a armar tu viaje.
          </p>
        </div>
```

with:

```tsx
        <div className="text-center">
          <div className="flex justify-center">
            <Logo withWordmark size={44} />
          </div>
          <p className="mt-3 text-muted-foreground">
            Contanos quién sos para empezar a armar tu viaje.
          </p>
        </div>
```

- [ ] **Step 3: Wire into `chat.page.tsx` header**

In `src/modules/chat/pages/chat.page.tsx`, add the import:

```tsx
import { Logo } from "@/components/brand/Logo";
```

Replace:

```tsx
            <h1 className="text-lg font-bold">FreeVago</h1>
```

with:

```tsx
            <Logo withWordmark size={30} />
```

- [ ] **Step 4: Verify**

Run: `npm run build`
Expected: succeeds.

Run: `npm run dev`, open `/login-viajes` and `/chat`. Confirm the jet + "FreeVago" wordmark render in teal/accent colors in both places, correctly sized.

- [ ] **Step 5: Commit**

```bash
git add src/components/brand/Logo.tsx src/modules/session/pages/accessPage.tsx src/modules/chat/pages/chat.page.tsx
git commit -m "feat(brand): add Logo component, use it on login and chat header"
```

---

### Task 3: Adapt `thinkingMessages.ts`

**Files:**
- Create: `src/modules/chat/thinkingMessages.ts` (adapted from `animacion-chat/prototipo-navegable-de-propuestas-de-viaje/project/thinkingMessages.ts`)

**Interfaces:**
- Produces: `THINKING_MESSAGES`, `THINKING_TEXTS`, `messagesFor(...)`, `nextIndex(current, length)`, `startThinkingRotator(onMessage, options?)`, `useThinkingMessage(active, options?): string` — consumed by Task 4's `ThinkingIndicator`.

- [ ] **Step 1: Copy the file with the React-import fix**

The source file (`animacion-chat/.../thinkingMessages.ts`) uses a bare global `React` with `// @ts-ignore`, which doesn't compile in this Vite project. Copy it verbatim except for that fix — full content:

```ts
// src/modules/chat/thinkingMessages.ts
/**
 * FreeVago — mensajes de estado "pensando".
 * Rotación conversacional en primera persona mientras la IA trabaja.
 */
import { useEffect, useState } from "react";

export type ThinkingCategory =
  | "analizando"
  | "destinos"
  | "fechas"
  | "presupuesto"
  | "armando"
  | "personalidad";

export interface ThinkingMessage {
  text: string;
  category: ThinkingCategory;
}

export const THINKING_MESSAGES: ThinkingMessage[] = [
  // — analizando el mensaje del usuario —
  { text: "Leyendo tu mensaje…", category: "analizando" },
  { text: "Entendiendo qué buscás…", category: "analizando" },
  { text: "Anotando tus preferencias…", category: "analizando" },
  { text: "Separando lo esencial…", category: "analizando" },
  { text: "Interpretando el tipo de viaje…", category: "analizando" },
  { text: "Detectando cuántos viajan…", category: "analizando" },
  { text: "Tomando nota del estilo…", category: "analizando" },
  { text: "Repasando lo que me contaste…", category: "analizando" },
  { text: "Poniendo tu pedido en contexto…", category: "analizando" },
  { text: "Descifrando el plan ideal…", category: "analizando" },

  // — pensando en destinos —
  { text: "Pensando destinos posibles…", category: "destinos" },
  { text: "Recorriendo la costa mentalmente…", category: "destinos" },
  { text: "Comparando playas y montañas…", category: "destinos" },
  { text: "Buscando lugares con tu onda…", category: "destinos" },
  { text: "Descartando destinos saturados…", category: "destinos" },
  { text: "Midiendo distancias de vuelo…", category: "destinos" },
  { text: "Mirando opciones cerca y lejos…", category: "destinos" },
  { text: "Sumando un destino sorpresa…", category: "destinos" },
  { text: "Evaluando qué tan turístico es…", category: "destinos" },
  { text: "Revisando qué hay alrededor…", category: "destinos" },
  { text: "Buscando joyas menos conocidas…", category: "destinos" },
  { text: "Pesando ciudad contra naturaleza…", category: "destinos" },

  // — fechas, clima, logística —
  { text: "Revisando el clima de la zona…", category: "fechas" },
  { text: "Chequeando temperatura promedio…", category: "fechas" },
  { text: "Viendo si es temporada alta…", category: "fechas" },
  { text: "Pensando el mejor momento para ir…", category: "fechas" },
  { text: "Cruzando fechas con feriados…", category: "fechas" },
  { text: "Buscando días más baratos…", category: "fechas" },
  { text: "Consultando horarios de vuelo…", category: "fechas" },
  { text: "Evitando escalas eternas…", category: "fechas" },
  { text: "Verificando requisitos de ingreso…", category: "fechas" },
  { text: "Mirando el pronóstico extendido…", category: "fechas" },
  { text: "Calculando tiempos de traslado…", category: "fechas" },
  { text: "Ajustando la cantidad de noches…", category: "fechas" },

  // — presupuesto —
  { text: "Cruzando fechas con el presupuesto…", category: "presupuesto" },
  { text: "Calculando el costo por persona…", category: "presupuesto" },
  { text: "Comparando tarifas de vuelo…", category: "presupuesto" },
  { text: "Buscando hoteles que entren…", category: "presupuesto" },
  { text: "Sumando traslados y actividades…", category: "presupuesto" },
  { text: "Convirtiendo a pesos…", category: "presupuesto" },
  { text: "Estirando cada dólar…", category: "presupuesto" },
  { text: "Chequeando qué está incluido…", category: "presupuesto" },
  { text: "Dejando margen para imprevistos…", category: "presupuesto" },
  { text: "Negociando conmigo mismo el total…", category: "presupuesto" },
  { text: "Comparando precio contra distancia…", category: "presupuesto" },

  // — armando la respuesta —
  { text: "Armando tu itinerario…", category: "armando" },
  { text: "Ordenando los días…", category: "armando" },
  { text: "Eligiendo dónde comer…", category: "armando" },
  { text: "Reservando lugar para descansar…", category: "armando" },
  { text: "Puliendo los detalles…", category: "armando" },
  { text: "Armando tres propuestas…", category: "armando" },
  { text: "Escribiendo el resumen…", category: "armando" },
  { text: "Ordenando de mejor a peor…", category: "armando" },
  { text: "Sumando puntos de interés…", category: "armando" },
  { text: "Revisando que todo cierre…", category: "armando" },
  { text: "Últimos ajustes…", category: "armando" },
  { text: "Casi listo, dame un segundo…", category: "armando" },

  // — personalidad (~18%) —
  { text: "Imaginando la playa perfecta…", category: "personalidad" },
  { text: "Sintiendo olor a protector solar…", category: "personalidad" },
  { text: "Envidiando un poco tu viaje…", category: "personalidad" },
  { text: "Consultando con mi brújula…", category: "personalidad" },
  { text: "Escuchando el mar de fondo…", category: "personalidad" },
  { text: "Preparando el mate para el vuelo…", category: "personalidad" },
  { text: "Sacudiendo la arena del mapa…", category: "personalidad" },
  { text: "Pidiendo mesa junto a la ventana…", category: "personalidad" },
  { text: "Guardando lugar en la valija…", category: "personalidad" },
  { text: "Practicando el idioma local…", category: "personalidad" },
  { text: "Haciendo lugar para una siesta…", category: "personalidad" },
];

export const THINKING_TEXTS: string[] = THINKING_MESSAGES.map((m) => m.text);

export function messagesFor(...categories: ThinkingCategory[]): string[] {
  return THINKING_MESSAGES.filter((m) => categories.includes(m.category)).map((m) => m.text);
}

/** Índice aleatorio distinto del anterior. */
export function nextIndex(current: number, length: number): number {
  if (length < 2) return 0;
  let i = current;
  while (i === current) i = Math.floor(Math.random() * length);
  return i;
}

export interface RotatorOptions {
  minDelay?: number;
  maxDelay?: number;
  pool?: string[];
}

/**
 * Rota mensajes con intervalo aleatorio (1.8–2.5s por defecto), sin repetir
 * el mismo dos veces seguidas. Devuelve la función de limpieza.
 */
export function startThinkingRotator(
  onMessage: (text: string) => void,
  { minDelay = 1800, maxDelay = 2500, pool = THINKING_TEXTS }: RotatorOptions = {}
): () => void {
  let index = Math.floor(Math.random() * pool.length);
  let timer: ReturnType<typeof setTimeout>;
  onMessage(pool[index]);
  const tick = () => {
    timer = setTimeout(() => {
      index = nextIndex(index, pool.length);
      onMessage(pool[index]);
      tick();
    }, minDelay + Math.random() * (maxDelay - minDelay));
  };
  tick();
  return () => clearTimeout(timer);
}

/** Hook de React equivalente, para usar mientras `active` sea true. */
export function useThinkingMessage(active: boolean, options: RotatorOptions = {}): string {
  const [text, setText] = useState<string>(options.pool?.[0] ?? THINKING_TEXTS[0]);
  useEffect(() => {
    if (!active) return;
    return startThinkingRotator(setText, options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  return text;
}
```

- [ ] **Step 2: Verify**

Run: `npm run build`
Expected: succeeds (no `@ts-ignore`/implicit-any errors).

- [ ] **Step 3: Commit**

```bash
git add src/modules/chat/thinkingMessages.ts
git commit -m "feat(chat): add typed thinking-message rotator"
```

---

### Task 4: `ThinkingIndicator` component

**Files:**
- Create: `src/lib/motion.ts`
- Create: `src/modules/chat/components/ThinkingIndicator.tsx`

**Interfaces:**
- Consumes: `useThinkingMessage` from `../thinkingMessages` (Task 3). CSS classes `fv-thinker-plane`, `fv-thinker-cloud-near`, `fv-thinker-cloud-far`, `fv-thinker-trail`, `fv-indicator-in`, `fv-indicator-out` from `src/index.css` (Task 1).
- Produces: `ThinkingIndicator({ active: boolean })` — mounts itself when `active` becomes `true`, animates out and unmounts ~200ms after `active` becomes `false`. `prefersReducedMotion()` from `src/lib/motion.ts`, reused by Task 5's autoscroll effect.

- [ ] **Step 1: Create the shared reduced-motion helper**

```ts
// src/lib/motion.ts
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
```

- [ ] **Step 2: Create `ThinkingIndicator.tsx`**

```tsx
// src/modules/chat/components/ThinkingIndicator.tsx
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
  const exitTimer = useRef<ReturnType<typeof setTimeout>>();

  const rawText = useThinkingMessage(mounted && !leaving);
  const [displayText, setDisplayText] = useState(rawText);
  const [textFading, setTextFading] = useState(false);
  const fadeTimer = useRef<ReturnType<typeof setTimeout>>();

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
```

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/lib/motion.ts src/modules/chat/components/ThinkingIndicator.tsx
git commit -m "feat(chat): add animated ThinkingIndicator"
```

(Wiring into `chat.page.tsx` — replacing the "Pensando..." placeholder — happens in Task 9, together with `MessageBubble` and autoscroll, to avoid touching the page's render section three separate times.)

---

### Task 5: `MarkdownMessage` component (Nivel 1)

**Files:**
- Create: `src/modules/chat/components/MarkdownMessage.tsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils`.
- Produces: `MarkdownMessage({ content: string; className?: string })` — consumed by `ProposalCard` (Task 8) and `MessageBubble` (Task 9).

- [ ] **Step 1: Install markdown deps**

Run: `cd C:/Proyectos/app-viajes-frontend && npm install react-markdown remark-gfm`

- [ ] **Step 2: Create the component**

```tsx
// src/modules/chat/components/MarkdownMessage.tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  return (
    <div className={cn("text-[14.5px] leading-[1.55]", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-3 mb-1.5 font-display text-lg font-semibold tracking-[-0.02em] first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-3 mb-1.5 font-display text-base font-semibold tracking-[-0.02em] first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-2.5 mb-1 font-display text-sm font-semibold tracking-[-0.015em] first:mt-0">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
          li: ({ children }) => <li className="pl-0.5">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          hr: () => <hr className="my-3 border-border" />,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto rounded-[var(--radius-md)] border border-border">
              <table className="w-full border-collapse text-[13.5px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-secondary">{children}</thead>,
          th: ({ children }) => (
            <th className="border-b border-border px-3 py-2 text-left text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border px-3 py-2 tabular-nums last:border-b-0">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/modules/chat/components/MarkdownMessage.tsx
git commit -m "feat(chat): add MarkdownMessage renderer (Nivel 1)"
```

---

### Task 6: `messageParser.ts` heuristic (Nivel 2, detection + extraction)

**Files:**
- Create: `src/modules/chat/messageParser.ts`

**Interfaces:**
- Produces:
  - `interface BudgetRow { label: string; value: string }`
  - `interface DayBlock { day: number; content: string }`
  - `interface ParsedProposal { title: string; dateRange: string | null; budget: BudgetRow[] | null; days: DayBlock[]; introMarkdown: string; outroMarkdown: string }`
  - `isFinalProposal(markdown: string): boolean`
  - `parseFinalProposal(markdown: string): ParsedProposal`
  - Consumed by `ProposalCard` (Task 8) and `MessageBubble` (Task 9).

- [ ] **Step 1: Create the parser**

```ts
// src/modules/chat/messageParser.ts
/**
 * Heurística FRÁGIL para detectar y extraer la "propuesta final" de viaje a
 * partir del markdown en texto libre que devuelve MS1 (Gemini). MS1 no
 * expone un contrato estructurado para esto — solo prosa con formato
 * reconocible (tabla de presupuesto + días "Día N"). Si el día de mañana
 * MS1 empieza a devolver JSON real, este archivo es el que se reemplaza o
 * se elimina: el resto del chat solo depende de `isFinalProposal` y
 * `parseFinalProposal`, nunca de los detalles internos de acá.
 */

export interface BudgetRow {
  label: string;
  value: string;
}

export interface DayBlock {
  day: number;
  content: string;
}

export interface ParsedProposal {
  title: string;
  dateRange: string | null;
  budget: BudgetRow[] | null;
  days: DayBlock[];
  introMarkdown: string;
  outroMarkdown: string;
}

const BUDGET_HEADER_RE = /presupuesto|costo/i;
const VALUE_COLUMN_RE = /usd|ars|monto|precio|costo|\$/i;
const TITLE_SIGNAL_RE = /plan\s+definitivo/i;
const DAY_LINE_RE =
  /^[ \t]*(?:#{1,4}[ \t]*)?(?:\*{1,2}|_{1,2})?[ \t]*Día[ \t]+(\d+)[ \t]*[:.\-]?[ \t]*(?:\*{1,2}|_{1,2})?[ \t]*(.*)$/gim;
const HEADING_LINE_RE = /^#{1,4}[ \t]+/m;
const DATE_RANGE_RE = /\b\d{1,2}\s*(?:al|-|–|a)\s*\d{1,2}\s+de\s+[a-záéíóúñ]+(?:\s+de\s+\d{4})?\b/i;

function findMarkdownTable(markdown: string): string | null {
  const lines = markdown.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isHeaderRow = line.trim().startsWith("|");
    const nextLine = lines[i + 1] ?? "";
    const isSeparatorRow = /^\s*\|?[\s:|-]+\|?\s*$/.test(nextLine) && nextLine.includes("-");

    if (isHeaderRow && isSeparatorRow && BUDGET_HEADER_RE.test(line)) {
      const blockLines = [line, nextLine];
      let j = i + 2;
      while (j < lines.length && lines[j].trim().startsWith("|")) {
        blockLines.push(lines[j]);
        j++;
      }
      return blockLines.join("\n");
    }
  }
  return null;
}

function parseTableRows(block: string): BudgetRow[] {
  const rows = block
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));

  const cellsOf = (line: string) =>
    line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim().replace(/\*\*/g, ""));

  const [headerLine, separatorLine, ...dataLines] = rows;
  if (!headerLine || !separatorLine) return [];

  const headerCells = cellsOf(headerLine);
  const valueColIndex = headerCells.findIndex((cell) => VALUE_COLUMN_RE.test(cell));
  const resolvedValueCol = valueColIndex === -1 ? headerCells.length - 1 : valueColIndex;
  const labelColIndex = resolvedValueCol === 0 ? 1 : 0;

  return dataLines
    .map(cellsOf)
    .filter((cells) => cells.length > Math.max(labelColIndex, resolvedValueCol))
    .map((cells) => ({
      label: cells[labelColIndex] ?? "",
      value: cells[resolvedValueCol] ?? "",
    }))
    .filter((row) => row.label && row.value);
}

interface DayAnalysis {
  days: DayBlock[];
  introEnd: number;
  outroStart: number;
}

function analyzeDayBlocks(markdown: string): DayAnalysis {
  const matches = [...markdown.matchAll(DAY_LINE_RE)];
  if (matches.length === 0) {
    return { days: [], introEnd: markdown.length, outroStart: markdown.length };
  }

  const days: DayBlock[] = [];
  let lastSectionEnd = markdown.length;

  matches.forEach((match, i) => {
    const day = Number(match[1]);
    const inlineText = match[2]?.trim() ?? "";
    const lineEnd = (match.index ?? 0) + match[0].length;
    const nextMatchStart = matches[i + 1]?.index ?? null;

    let sectionEnd: number;
    if (nextMatchStart !== null) {
      sectionEnd = nextMatchStart;
    } else {
      const restOfDoc = markdown.slice(lineEnd);
      const nextHeading = restOfDoc.search(HEADING_LINE_RE);
      sectionEnd = nextHeading === -1 ? markdown.length : lineEnd + nextHeading;
    }

    const trailingLines = markdown.slice(lineEnd, sectionEnd).trim();
    const content = [inlineText, trailingLines].filter(Boolean).join("\n\n");
    days.push({ day, content });

    if (i === matches.length - 1) lastSectionEnd = sectionEnd;
  });

  return { days, introEnd: matches[0].index ?? 0, outroStart: lastSectionEnd };
}

function extractTitle(markdown: string): string {
  const headingMatch = markdown.match(/^#{1,3}[ \t]+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();

  const firstLine = markdown.split("\n").find((line) => line.trim().length > 0);
  return (firstLine ?? "Tu plan de viaje").trim().slice(0, 80);
}

function extractDateRange(markdown: string): string | null {
  const match = markdown.match(DATE_RANGE_RE);
  return match ? match[0] : null;
}

/**
 * `true` solo cuando el mensaje trae AMBAS señales: una tabla con
 * "presupuesto"/"costo" en el header, Y (al menos 2 marcadores "Día N" O el
 * título "plan definitivo"). Exigir la tabla como ancla evita falsos
 * positivos en turnos intermedios que solo mencionan presupuesto en prosa.
 */
export function isFinalProposal(markdown: string): boolean {
  const table = findMarkdownTable(markdown);
  if (!table) return false;

  const dayMatches = markdown.match(DAY_LINE_RE);
  const hasMultipleDays = (dayMatches?.length ?? 0) >= 2;
  const hasTitleSignal = TITLE_SIGNAL_RE.test(markdown);

  return hasMultipleDays || hasTitleSignal;
}

export function parseFinalProposal(markdown: string): ParsedProposal {
  const table = findMarkdownTable(markdown);
  const { days, introEnd, outroStart } = analyzeDayBlocks(markdown);

  let intro = markdown.slice(0, introEnd);
  let outro = markdown.slice(outroStart);

  if (table) {
    intro = intro.replace(table, "");
    outro = outro.replace(table, "");
  }

  return {
    title: extractTitle(markdown),
    dateRange: extractDateRange(markdown),
    budget: table ? parseTableRows(table) : null,
    days,
    introMarkdown: intro.trim(),
    outroMarkdown: outro.trim(),
  };
}
```

- [ ] **Step 2: Write and run a throwaway verification script**

This is the one piece of pure logic worth a real correctness check. Create a temporary file (not committed):

```ts
// scratch-verify-parser.ts (temporary, delete after this step)
import { isFinalProposal, parseFinalProposal } from "./src/modules/chat/messageParser";

const FINAL_PROPOSAL_FIXTURE = `## ✈️ PLAN DEFINITIVO — Búzios, Brasil

**Fechas:** 11 al 20 de septiembre de 2026 (9 noches)
**Alojamiento:** Pousada Vento Norte, João Fernandes

Armé el plan completo con lo que charlamos. Esto es todo lo que necesitás para reservar.

### Vuelos
Córdoba (COR) → Río de Janeiro (GIG), con transfer a Búzios.

| Presupuesto | Monto por persona (USD) |
| --- | --- |
| Pasaje aéreo | 480 |
| Transfer COR-GIG-Búzios | 60 |
| Alojamiento (9 noches) | 350 |
| Gastos e imprevistos | 110 |
| **Total** | **1000** |

### Itinerario día por día

**Día 1:** Llegada a Búzios, check-in y tarde libre en Praia de João Fernandes.
**Día 2:** Día de playa en Ferradura, snorkel opcional.
**Día 3:** Recorrido por el centro y Rua das Pedras.

### Consejos finales
Llevá documentación al día (DNI o pasaporte) y algo de efectivo en reales para changos chicos.

¿Hay algo que quieras ajustar o ya quedamos listos para reservar?`;

const MID_TURN_FIXTURE = `Perfecto, con ese presupuesto y saliendo de Córdoba te arma bien Búzios.
Por persona quedaría en unos USD 500, así que llegamos justo a los 1000 para los dos.
¿Preferís que arme un itinerario tranquilo o con más recorrido?`;

console.assert(isFinalProposal(FINAL_PROPOSAL_FIXTURE) === true, "FAIL: final proposal not detected");
console.assert(isFinalProposal(MID_TURN_FIXTURE) === false, "FAIL: mid-turn message false-flagged");

const parsed = parseFinalProposal(FINAL_PROPOSAL_FIXTURE);
console.assert(parsed.title.includes("PLAN DEFINITIVO"), `FAIL: title = ${parsed.title}`);
console.assert(parsed.dateRange === "11 al 20 de septiembre de 2026", `FAIL: dateRange = ${parsed.dateRange}`);
console.assert(parsed.budget?.length === 5, `FAIL: budget rows = ${parsed.budget?.length}`);
console.assert(parsed.budget?.[4].label === "Total" && parsed.budget?.[4].value === "1000", "FAIL: total row");
console.assert(parsed.days.length === 3, `FAIL: days = ${parsed.days.length}`);
console.assert(parsed.days[0].content.includes("Llegada a Búzios"), "FAIL: day 1 content");
console.assert(!parsed.introMarkdown.includes("| Presupuesto |"), "FAIL: table not stripped from intro");
console.assert(parsed.outroMarkdown.includes("Consejos finales"), "FAIL: outro missing");

console.log("messageParser: all assertions passed");
```

Run: `cd C:/Proyectos/app-viajes-frontend && npx tsx scratch-verify-parser.ts`
Expected: `messageParser: all assertions passed` with no `FAIL:` lines.

- [ ] **Step 3: Delete the throwaway script**

Run: `rm C:/Proyectos/app-viajes-frontend/scratch-verify-parser.ts`

- [ ] **Step 4: Commit**

```bash
git add src/modules/chat/messageParser.ts
git commit -m "feat(chat): add final-proposal detection heuristic (messageParser)"
```

---

### Task 7: `ProposalCard` component (Nivel 2, rendering)

**Files:**
- Create: `src/modules/chat/components/ProposalCard.tsx`

**Interfaces:**
- Consumes: `ParsedProposal`, `DayBlock` from `../messageParser` (Task 6); `MarkdownMessage` from `./MarkdownMessage` (Task 5); `Button` from `@/components/ui/button`; `Collapsible`, `CollapsibleContent`, `CollapsibleTrigger` from `@/components/ui/collapsible` (already exists, Radix-backed); `ChevronDown` from `lucide-react` (already a dependency); `cn` from `@/lib/utils`.
- Produces: `ProposalCard({ proposal: ParsedProposal; onElegir: () => void })` — consumed by `MessageBubble` (Task 9).

- [ ] **Step 1: Create the component**

```tsx
// src/modules/chat/components/ProposalCard.tsx
import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

import type { DayBlock, ParsedProposal } from "../messageParser";
import { MarkdownMessage } from "./MarkdownMessage";

interface ProposalCardProps {
  proposal: ParsedProposal;
  onElegir: () => void;
}

function DayAccordionItem({ day }: { day: DayBlock }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-b border-border last:border-b-0">
      <CollapsibleTrigger className="flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-left">
        <span className="flex size-7 flex-none items-center justify-center rounded-full bg-secondary font-mono text-[12px] font-medium text-primary">
          {day.day}
        </span>
        <span className="flex-1 font-display text-sm font-semibold tracking-[-0.015em]">Día {day.day}</span>
        <ChevronDown className={cn("size-4 flex-none text-muted-foreground transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4 pl-[52px]">
        <MarkdownMessage content={day.content} className="text-[13.5px]" />
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ProposalCard({ proposal, onElegir }: ProposalCardProps) {
  const { title, dateRange, budget, days, introMarkdown, outroMarkdown } = proposal;

  return (
    <div className="mr-auto w-full max-w-[560px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-primary px-5 py-4">
        <div className="font-display text-lg font-semibold tracking-[-0.02em] text-white">{title}</div>
        {dateRange && (
          <span className="mt-2 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[11.5px] text-white">
            {dateRange}
          </span>
        )}
      </div>

      {introMarkdown && (
        <div className="px-5 pt-4">
          <MarkdownMessage content={introMarkdown} />
        </div>
      )}

      {budget && budget.length > 0 && (
        <div className="px-5 pt-4">
          <div className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Presupuesto</div>
          <div className="mt-2 overflow-hidden rounded-[var(--radius-md)] border border-border">
            <table className="w-full border-collapse text-[13.5px]">
              <tbody>
                {budget.map((row) => (
                  <tr key={row.label} className={cn("border-b border-border last:border-b-0", /total/i.test(row.label) && "bg-secondary")}>
                    <td className="px-3 py-2">{row.label}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {days.length > 0 && (
        <div className="px-5 pt-4">
          <div className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Itinerario día por día</div>
          <div className="mt-2 overflow-hidden rounded-[var(--radius-md)] border border-border">
            {days.map((day) => (
              <DayAccordionItem key={day.day} day={day} />
            ))}
          </div>
        </div>
      )}

      {outroMarkdown && (
        <div className="px-5 pt-4">
          <MarkdownMessage content={outroMarkdown} />
        </div>
      )}

      <div className="px-5 py-4">
        <Button onClick={onElegir} className="h-12 w-full text-[15px]">
          Elegir esta propuesta
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/modules/chat/components/ProposalCard.tsx
git commit -m "feat(chat): add ProposalCard for the final travel plan (Nivel 2)"
```

---

### Task 8: `MessageBubble` component

**Files:**
- Create: `src/modules/chat/components/MessageBubble.tsx`

**Interfaces:**
- Consumes: `isFinalProposal`, `parseFinalProposal` from `../messageParser` (Task 6); `MarkdownMessage` from `./MarkdownMessage` (Task 5); `ProposalCard` from `./ProposalCard` (Task 7); `ChatRole` from `../chat.types`.
- Produces: `MessageBubble({ role: ChatRole; content: string; onElegirPropuesta: () => void })` — consumed by `chat.page.tsx` (Task 9).

- [ ] **Step 1: Create the component**

```tsx
// src/modules/chat/components/MessageBubble.tsx
import { isFinalProposal, parseFinalProposal } from "../messageParser";
import type { ChatRole } from "../chat.types";
import { MarkdownMessage } from "./MarkdownMessage";
import { ProposalCard } from "./ProposalCard";

interface MessageBubbleProps {
  role: ChatRole;
  content: string;
  onElegirPropuesta: () => void;
}

export function MessageBubble({ role, content, onElegirPropuesta }: MessageBubbleProps) {
  if (role === "usuario") {
    return (
      <div className="fv-msg-in ml-auto max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm break-words text-primary-foreground sm:max-w-[80%]">
        {content}
      </div>
    );
  }

  if (isFinalProposal(content)) {
    return (
      <div className="fv-msg-in">
        <ProposalCard proposal={parseFinalProposal(content)} onElegir={onElegirPropuesta} />
      </div>
    );
  }

  return (
    <div className="fv-msg-in mr-auto max-w-[85%] rounded-lg border border-border bg-card px-3 py-2 sm:max-w-[80%]">
      <MarkdownMessage content={content} />
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/modules/chat/components/MessageBubble.tsx
git commit -m "feat(chat): add MessageBubble (routes to markdown bubble or ProposalCard)"
```

---

### Task 9: Wire everything into `chat.page.tsx` (autoscroll + ThinkingIndicator + MessageBubble)

**Files:**
- Modify: `src/modules/chat/pages/chat.page.tsx`

**Interfaces:**
- Consumes: `ThinkingIndicator` (Task 4), `MessageBubble` (Task 8), `prefersReducedMotion` (Task 4), `Logo` (Task 2, header already wired — this step only adds the ref/effect and swaps the message list).

- [ ] **Step 1: Replace the full file**

```tsx
// src/modules/chat/pages/chat.page.tsx
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/brand/Logo";
import { APP_ROUTES } from "@/config/app.routes";
import { prefersReducedMotion } from "@/lib/motion";
import { useAppAuth } from "@/modules/session/useAppAuth";

import { getChatMode, setChatMode } from "../chat.config";
import { OPCIONES_POR_CAMPO } from "../chat.options";
import { chatService } from "../chat.service";
import type { ChatMessage, ChatRespuesta } from "../chat.types";
import { MessageBubble } from "../components/MessageBubble";
import { ThinkingIndicator } from "../components/ThinkingIndicator";

export default function ChatPage() {
  const navigate = useNavigate();
  const { user, logout } = useAppAuth();

  const [mode, setMode] = useState(getChatMode());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [ultimaRespuesta, setUltimaRespuesta] = useState<ChatRespuesta | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "end",
    });
  }, [messages, isSending]);

  async function enviar(contenido: string) {
    if (!contenido.trim() || isSending) return;

    const historial = [...messages, { role: "usuario" as const, contenido }];

    setMessages(historial);
    setInput("");
    setError(null);
    setIsSending(true);

    try {
      const respuesta = await chatService.enviarMensaje(historial, user?.usuarioId);

      setMessages([
        ...historial,
        { role: "asistente" as const, contenido: respuesta.mensaje },
      ]);
      setUltimaRespuesta(respuesta);
    } catch {
      setError("No pudimos obtener respuesta. Probá de nuevo.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await enviar(input);
  }

  function handleToggleMode() {
    const nuevoModo = mode === "real" ? "mock" : "real";
    setChatMode(nuevoModo);
    setMode(nuevoModo);
    setMessages([]);
    setUltimaRespuesta(null);
    setError(null);
  }

  function handleVerResultados() {
    navigate(APP_ROUTES.resultados.root, {
      state: { viaje: ultimaRespuesta?.viaje ?? null },
    });
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col p-3 sm:p-4">
      <header className="mb-4 border-b pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Logo withWordmark size={30} />
            {mode === "mock" && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                Modo demo
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={handleToggleMode}>
              {mode === "real" ? "Probar modo demo" : "Volver a modo real"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout();
                navigate(APP_ROUTES.auth.loginViajes, { replace: true });
              }}
            >
              Salir
            </Button>
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {user ? `Hola, ${user.nombre}` : "Armá tu viaje charlando con la IA"}
        </p>
      </header>

      <div className="min-w-0 flex-1 space-y-3 overflow-y-auto py-2">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Contanos cuándo, con quién y con qué presupuesto querés viajar.
          </p>
        )}

        {messages.map((message, index) => (
          <MessageBubble
            key={index}
            role={message.role}
            content={message.contenido}
            onElegirPropuesta={() => enviar("Quiero elegir esta propuesta.")}
          />
        ))}

        <ThinkingIndicator active={isSending} />

        {!isSending && ultimaRespuesta && ultimaRespuesta.preguntas.length > 0 && (
          <div className="mr-auto max-w-[85%] space-y-2 sm:max-w-[80%]">
            {ultimaRespuesta.preguntas.map((pregunta) => {
              const opciones = OPCIONES_POR_CAMPO[pregunta.campo];

              return (
                <div key={pregunta.campo} className="rounded-lg border bg-background p-2">
                  <p className="text-sm">{pregunta.pregunta}</p>
                  {opciones && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {opciones.map((opcion) => (
                        <button
                          key={opcion}
                          type="button"
                          onClick={() => enviar(opcion)}
                          className="rounded-full border px-2.5 py-1 text-xs hover:bg-muted"
                        >
                          {opcion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!isSending && ultimaRespuesta?.estado === "listoParaBuscar" && (
          <div className="mr-auto max-w-[85%] rounded-lg border bg-background p-3 sm:max-w-[80%]">
            <p className="mb-2 text-sm">Ya tenemos lo necesario para buscar tu viaje.</p>
            <Button size="sm" className="h-11" onClick={handleVerResultados}>
              Ver resultados
            </Button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && <p className="mb-2 text-sm text-destructive">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2 border-t pt-3">
        <Input
          className="h-11 min-w-0 flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribí tu mensaje..."
          disabled={isSending}
        />
        <Button type="submit" className="h-11" disabled={isSending || !input.trim()}>
          Enviar
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/modules/chat/pages/chat.page.tsx
git commit -m "feat(chat): wire MessageBubble, ThinkingIndicator, and autoscroll into ChatPage"
```

---

### Task 10: Manual QA against the reference conversation

**Files:** none (verification only).

- [ ] **Step 1: Run the dev server**

Run: `cd C:/Proyectos/app-viajes-frontend && npm run dev`

- [ ] **Step 2: Log in with the fixed test identity**

Open `/login-viajes`. Use `testfront@gmail.com` / "Test Frontend" (per project memory — real shared Mongo Atlas DB, keep test data identifiable).

- [ ] **Step 3: Replay the reference conversation in real mode**

Send, in order, the 6 user turns from the reference conversation:
1. "quiero viajar el mes que viene(septiembre) , por 10 dias aprox, tengo 1000 usd de presupuesto, me interesa el calor la playa, somos 2 amigos, quiero un viaje tranquilo, sin tanto recorrido, sino mas bien disfrutar de un hotel y una playa"
2. "buenas propuestas, ya te di el presupuesto, estamos en villa maria cordoba"
3. "me parecio una buena propuesta, prefiero buzios."
4. "en cualquier momento de septiembre, opcion" (send as-is, cut off)
5. "prefiero la opcion b"
6. "finaliza el plan y dame todo lo planeado, busca y elegí la mejor, saliendo desde Córdoba.. reintentar."

- [ ] **Step 4: Confirm all 4 points visually**

- Palette/typography: no default grays anywhere, headings in Plus Jakarta Sans, teal primary / amber accent visible in buttons, user bubbles, focus rings.
- Logo + thinking animation: jet + wordmark in header; while waiting for each of the 6 responses, the animated plane/clouds indicator appears (not the old "Pensando..." text), rotates status messages, and animates out smoothly (no hard cut) right before the reply bubble appears.
- Bubbles: every assistant bubble (especially the long turn-3 and turn-6 replies) grows to fit its content with no inner scrollbar; the whole thread auto-scrolls to each new message without a jarring jump.
- Markdown + proposal card: turns 1–5 render as normal bubbles with real markdown formatting (bold, lists — no literal `**`/`###` visible). Turn 6's reply ("PLAN DEFINITIVO") renders as the highlighted **ProposalCard**: destination/date header, budget table with tabular numbers, day-by-day accordion (click to expand/collapse), and the "Elegir esta propuesta" button — clicking it sends a new chat message and continues the conversation.

- [ ] **Step 5: Reduced-motion check**

In OS/browser settings, enable "reduce motion", reload, resend a message. Confirm: the plane holds still (gentle opacity pulse only), the indicator appears/disappears without a scale/fade animation, and message bubbles appear without the slide-up entrance.

- [ ] **Step 6: Report results**

If everything above holds, the plan is complete — no further commit needed (Task 10 is verification-only). If something doesn't match (e.g. the heuristic misses a differently-worded real MS1 response), note the exact markdown MS1 returned and adjust `messageParser.ts`'s regexes in a follow-up commit — the isolation from Task 6 is exactly what makes that a contained, low-risk fix.
