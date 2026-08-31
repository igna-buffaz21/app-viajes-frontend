import type { BusquedaResultados } from "../results.types";

function formatPrecio(precio: { monto: number; moneda: string }): string {
  return `${precio.moneda} ${precio.monto.toLocaleString("es-AR")}`;
}

interface BusquedaResultadosViewProps {
  resultados: BusquedaResultados;
}

/**
 * Grilla de vuelos/hoteles/actividades — extraída de results.page.tsx para
 * reusarla tal cual en /explorar (datos reales) sin duplicar el diseño de
 * las cards. Las diferencias entre "datos de ejemplo" (banner) y "datos
 * reales" (warnings de MS2) las maneja cada página que la usa, no este
 * componente.
 */
export function BusquedaResultadosView({ resultados }: BusquedaResultadosViewProps) {
  return (
    <>
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Vuelos</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {resultados.vuelos.map((vuelo, i) => (
            <div key={i} className="fv-theme-transition rounded-lg border p-3">
              <p className="text-lg font-bold">{formatPrecio(vuelo.precio)}</p>
              {vuelo.legs.map((leg, j) => (
                <p key={j} className="mt-1 text-xs text-muted-foreground">
                  {leg.route} · {leg.time} · {leg.airline} · {leg.stops}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Hoteles</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {resultados.hoteles.map((hotel, i) => (
            <div key={i} className="fv-theme-transition rounded-lg border p-3">
              <p className="font-medium">{hotel.nombre}</p>
              <p className="mt-1 text-sm">{formatPrecio(hotel.precio)}</p>
              {hotel.rating !== null && (
                <p className="text-xs text-muted-foreground">Rating: {hotel.rating}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Actividades</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {resultados.actividades.map((actividad, i) => (
            <div key={i} className="fv-theme-transition rounded-lg border p-3">
              <p className="font-medium">{actividad.titulo}</p>
              <p className="mt-1 text-sm text-muted-foreground">{actividad.descripcionBreve}</p>
              <p className="mt-1 text-sm">
                {formatPrecio(actividad.precio)} · {actividad.duracionEstimada}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
