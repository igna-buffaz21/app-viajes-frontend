import type { PerfilViaje } from "@/modules/chat/chat.types";

import { mapBusqueda } from "./results.mapper";
import { mockBusquedaResponse } from "./results.mock";
import type { BusquedaResultados } from "./results.types";

// TODO(backend real): MicroServicioGrupo2 no tiene ningún endpoint de
// búsqueda hoy (ver AUDITORIA_BACKEND.md, sección 2) — siempre se devuelve
// el fixture mock. Cuando exista, esta función pasa a hacer el POST real y
// mapBusqueda() absorbe el cambio de forma sin tocar la UI.
export const resultsService = {
  async buscar(_viaje: PerfilViaje | null): Promise<BusquedaResultados> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return mapBusqueda(mockBusquedaResponse);
  },
};
