import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { APP_ROUTES } from "@/config/app.routes";

import { BusquedaLoadingState } from "../components/BusquedaLoadingState";
import { BusquedaResultadosView } from "../components/BusquedaResultadosView";
import { DestinoAutocomplete } from "../components/DestinoAutocomplete";
import { busquedaService } from "../busqueda.service";
import type { BusquedaResultados, Sugerencia } from "../results.types";

type EstadoServicio = "chequeando" | "disponible" | "noDisponible";
type EstadoBusqueda = "idle" | "buscando" | "error";

const HOY = new Date().toISOString().slice(0, 10);

/**
 * A diferencia de /resultados (mock), acá el objetivo específico es
 * demostrar la conexión real a MS2 — así que no hay modo simulado: si el
 * servicio no responde, se ve claramente que no responde, con este mismo
 * estado (ver ServicioNoDisponible más abajo). Hoy (2026-08-31) va a ser
 * el único estado visible, porque MS2 no está corriendo en ningún puerto
 * accesible todavía (ver busqueda.real.adapter.ts).
 */
function ServicioNoDisponible({ onReintentar }: { onReintentar: () => void }) {
  return (
    <div
      role="status"
      className="fv-theme-transition flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center"
    >
      <p className="text-sm font-semibold">El servicio de búsqueda todavía no está disponible</p>
      <p className="max-w-sm text-xs text-muted-foreground">
        No pudimos conectar con el servicio que busca vuelos, hoteles y actividades reales.
        Puede que todavía no esté levantado — probá de nuevo en un rato.
      </p>
      <Button variant="outline" size="sm" onClick={onReintentar}>
        Reintentar
      </Button>
    </div>
  );
}

export default function ExplorarPage() {
  const [estadoServicio, setEstadoServicio] = useState<EstadoServicio>("chequeando");

  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState<Sugerencia | null>(null);
  const [fechaIda, setFechaIda] = useState("");
  const [fechaVuelta, setFechaVuelta] = useState("");
  const [pasajeros, setPasajeros] = useState(1);
  const [presupuesto, setPresupuesto] = useState(0);

  const [estadoBusqueda, setEstadoBusqueda] = useState<EstadoBusqueda>("idle");
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const [resultados, setResultados] = useState<BusquedaResultados | null>(null);

  async function chequearDisponibilidad() {
    setEstadoServicio("chequeando");
    const disponible = await busquedaService.estaDisponible();
    setEstadoServicio(disponible ? "disponible" : "noDisponible");
  }

  useEffect(() => {
    chequearDisponibilidad();
  }, []);

  const formularioValido = origen.trim() && destino && fechaIda && fechaVuelta && pasajeros > 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!formularioValido || !destino || estadoBusqueda === "buscando") return;

    setEstadoBusqueda("buscando");
    setErrorBusqueda(null);
    setResultados(null);

    const resultado = await busquedaService.buscar({
      originName: origen,
      destinationName: destino.cityName,
      destinationSlug: destino.slug,
      destinationIata: destino.iata,
      departDate: fechaIda,
      returnDateStr: fechaVuelta,
      passengers: pasajeros,
      budget: presupuesto,
    });

    if (resultado.estado === "ok") {
      setResultados(resultado.datos);
      setEstadoBusqueda("idle");
    } else if (resultado.estado === "servicioNoDisponible") {
      // El servicio pudo estar arriba en el chequeo inicial y caerse justo
      // ahora, o al revés (ver estaDisponible() en busqueda.service.ts) —
      // en cualquier caso, refleja el mismo estado claro en vez de un error genérico.
      setEstadoServicio("noDisponible");
      setEstadoBusqueda("idle");
    } else {
      setErrorBusqueda(resultado.mensaje);
      setEstadoBusqueda("error");
    }
  }

  return (
    <div className="fv-theme-transition mx-auto w-full max-w-3xl space-y-6 p-3 sm:p-4">
      <header className="fv-theme-transition flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <h1 className="text-lg font-bold">Explorar (datos reales)</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <Link to={APP_ROUTES.chat.root}>Volver al chat</Link>
          </Button>
        </div>
      </header>

      <p className="text-sm text-muted-foreground">
        Esta pantalla busca vuelos, hoteles y actividades reales (sin datos de ejemplo) — es un
        explorador, todavía no la propuesta final armada.
      </p>

      {estadoServicio === "chequeando" && (
        <p className="text-sm text-muted-foreground">Chequeando disponibilidad del servicio...</p>
      )}

      {estadoServicio === "noDisponible" && (
        <ServicioNoDisponible onReintentar={chequearDisponibilidad} />
      )}

      {estadoServicio === "disponible" && (
        <>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="explorar-origen">Origen</Label>
                <Input
                  id="explorar-origen"
                  className="mt-1 h-11"
                  value={origen}
                  onChange={(e) => setOrigen(e.target.value)}
                  placeholder="Ciudad de salida"
                  disabled={estadoBusqueda === "buscando"}
                />
              </div>

              <DestinoAutocomplete
                disabled={estadoBusqueda === "buscando"}
                onSeleccionar={setDestino}
              />

              <div>
                <Label htmlFor="explorar-ida">Fecha de ida</Label>
                <Input
                  id="explorar-ida"
                  type="date"
                  className="mt-1 h-11"
                  min={HOY}
                  value={fechaIda}
                  onChange={(e) => setFechaIda(e.target.value)}
                  disabled={estadoBusqueda === "buscando"}
                />
              </div>

              <div>
                <Label htmlFor="explorar-vuelta">Fecha de vuelta</Label>
                <Input
                  id="explorar-vuelta"
                  type="date"
                  className="mt-1 h-11"
                  min={fechaIda || HOY}
                  value={fechaVuelta}
                  onChange={(e) => setFechaVuelta(e.target.value)}
                  disabled={estadoBusqueda === "buscando"}
                />
              </div>

              <div>
                <Label htmlFor="explorar-pasajeros">Pasajeros</Label>
                <Input
                  id="explorar-pasajeros"
                  type="number"
                  min={1}
                  className="mt-1 h-11"
                  value={pasajeros}
                  onChange={(e) => setPasajeros(Number(e.target.value) || 1)}
                  disabled={estadoBusqueda === "buscando"}
                />
              </div>

              <div>
                <Label htmlFor="explorar-presupuesto">Presupuesto por persona</Label>
                <Input
                  id="explorar-presupuesto"
                  type="number"
                  min={0}
                  className="mt-1 h-11"
                  value={presupuesto}
                  onChange={(e) => setPresupuesto(Number(e.target.value) || 0)}
                  disabled={estadoBusqueda === "buscando"}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="h-11 w-full sm:w-auto"
              disabled={!formularioValido || estadoBusqueda === "buscando"}
            >
              Buscar
            </Button>
          </form>

          {estadoBusqueda === "buscando" && <BusquedaLoadingState />}

          {estadoBusqueda === "error" && errorBusqueda && (
            <p className="text-sm text-destructive">{errorBusqueda}</p>
          )}

          {estadoBusqueda === "idle" && resultados && (
            <div className="space-y-6">
              {resultados.warnings.length > 0 && (
                <div className="fv-theme-transition rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  <strong>Algunas fuentes no respondieron:</strong>
                  <ul className="mt-1 list-inside list-disc">
                    {resultados.warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              <BusquedaResultadosView resultados={resultados} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
