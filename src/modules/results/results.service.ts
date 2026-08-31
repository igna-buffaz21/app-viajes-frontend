import type { PerfilViaje } from "@/modules/chat/chat.types";

import { mapBusqueda } from "./results.mapper";
import { mockBusquedaResponse } from "./results.mock";
import type { BusquedaResultados } from "./results.types";

// Desconectado de /resultados (decisión de producto 2026-08-31): esa
// pantalla pasó a ser el flujo real contra MS2 (ver busqueda.service.ts,
// resultados.desdeEncuesta.ts y pages/results.page.tsx) — ya no muestra
// este fixture. Nada importa este archivo hoy; queda para no perder el
// fixture/la forma de la respuesta mock, misma convención que
// TripThemeScene.tsx.
export const resultsService = {
  async buscar(_viaje: PerfilViaje | null): Promise<BusquedaResultados> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return mapBusqueda(mockBusquedaResponse);
  },
};
