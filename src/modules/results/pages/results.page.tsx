import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { APP_ROUTES } from "@/config/app.routes";
import type { PerfilViaje } from "@/modules/chat/chat.types";

import { resultsService } from "../results.service";
import type { BusquedaResultados } from "../results.types";

function formatPrecio(precio: { monto: number; moneda: string }): string {
  return `${precio.moneda} ${precio.monto.toLocaleString("es-AR")}`;
}

export default function ResultsPage() {
  const location = useLocation();
  const viaje = (location.state as { viaje?: PerfilViaje | null } | null)?.viaje ?? null;

  const [resultados, setResultados] = useState<BusquedaResultados | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let vigente = true;

    resultsService.buscar(viaje).then((data) => {
      if (vigente) {
        setResultados(data);
        setIsLoading(false);
      }
    });

    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fv-theme-transition mx-auto w-full max-w-3xl space-y-6 p-3 sm:p-4">
      <header className="fv-theme-transition flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <h1 className="text-lg font-bold">Tu viaje</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <Link to={APP_ROUTES.chat.root}>Volver al chat</Link>
          </Button>
        </div>
      </header>

      <div className="fv-theme-transition rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        <strong>Datos de ejemplo.</strong> El backend de búsqueda de vuelos, hoteles y
        actividades todavía no existe (ver <code>AUDITORIA_BACKEND.md</code>). Esto es un
        fixture con la forma real que se espera que tenga cuando exista.
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Buscando opciones...</p>}

      {!isLoading && resultados && (
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
                  <p className="mt-1 text-sm text-muted-foreground">
                    {actividad.descripcionBreve}
                  </p>
                  <p className="mt-1 text-sm">
                    {formatPrecio(actividad.precio)} · {actividad.duracionEstimada}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-2 border-t pt-4">
            <h2 className="text-base font-semibold text-muted-foreground">Próximamente</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Itinerario día por día",
                "Puntos de interés curados",
                "Badge de coincidencia con tu perfil",
                "Resumen de presupuesto unificado",
              ].map((titulo) => (
                <div
                  key={titulo}
                  className="fv-theme-transition rounded-lg border border-dashed p-3 text-sm text-muted-foreground"
                >
                  {titulo}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
