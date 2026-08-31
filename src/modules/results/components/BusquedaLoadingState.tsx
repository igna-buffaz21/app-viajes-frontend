/**
 * MS2 documenta que el scraper de vuelos puede tardar 20-90s (15s de espera
 * fija + reintentos de fecha) y el de hoteles suma ~12s más de espera
 * anti-WAF — nada de esto es instantáneo, así que el copy lo dice
 * explícitamente en vez de dejar un spinner ambiguo.
 */
export function BusquedaLoadingState() {
  return (
    <div
      role="status"
      className="fv-theme-transition flex flex-col items-center gap-3 rounded-lg border p-8 text-center"
    >
      <span
        aria-hidden="true"
        className="size-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary"
      />
      <p className="text-sm font-medium">Buscando vuelos, hoteles y actividades reales...</p>
      <p className="max-w-sm text-xs text-muted-foreground">
        Esto puede tardar un minuto o más — estamos consultando fuentes reales, no una base
        precargada.
      </p>
    </div>
  );
}
