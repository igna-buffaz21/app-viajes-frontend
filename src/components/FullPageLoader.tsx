import { ThinkingIndicator } from "@/modules/chat/components/ThinkingIndicator";

/**
 * Reemplaza al viejo `<div>Cargando...</div>` (arriba a la izquierda, resto
 * de la pantalla vacía) que aparecía en los 3 gates de carga de la app:
 * App.tsx (mientras Clerk todavía no cargó), RequireSession.tsx (mientras
 * useAppAuth resuelve el usuario) y protectedRoute.tsx. Mismo
 * ThinkingIndicator del chat, sin el mensaje rotativo (no hay ningún
 * "pensando..." real que mostrar acá) y centrado en toda la pantalla.
 *
 * Se pudo reusar tal cual: ThinkingIndicator no depende de ningún contexto
 * de la app (Clerk, sesión, etc.) — solo de sus propios estados internos
 * (useThinkingSlide) — así que funciona incluso en App.tsx, que se
 * renderiza antes de que Clerk termine de resolver la sesión.
 */
export function FullPageLoader() {
  return (
    <div className="fv-theme-transition flex min-h-screen items-center justify-center bg-background">
      <ThinkingIndicator active theme="default" mostrarTexto={false} />
    </div>
  );
}
