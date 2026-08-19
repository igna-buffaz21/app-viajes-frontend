// TODO(glosario compartido): estos nombres de campo (price, legs, rawText,
// name, rating, precioPorPersona, etc.) son el ejemplo tal cual lo dio el
// encargo original, no un contrato confirmado por MicroServicioGrupo1 (MS1)
// — hoy MS1 ni siquiera expone este endpoint (ver AUDITORIA_BACKEND.md,
// sección 2). Cuando se cierre el glosario compartido de campos entre front
// y backend, es probable que estos nombres cambien; ajustar acá y en
// results.mapper.ts cuando eso pase, sin tocar los tipos limpios de más
// abajo ni los componentes visuales.
export interface RawVueloLeg {
  time: string;
  airline: string;
  stops: string;
  layover?: string;
  duration: string;
  route: string;
}

export interface RawVueloOpcion {
  price: string;
  legs: RawVueloLeg[];
  rawText: string;
}

export interface RawHotelOpcion {
  name: string;
  price: string;
  rating: string;
  rawText: string;
}

export interface RawActividadOpcion {
  origen: string;
  titulo: string;
  duracionEstimada: string;
  franjaHoraria: string;
  precioPorPersona: string;
  descripcionBreve: string;
}

export interface RawBusquedaResponse {
  metadata: {
    origen: { input: string; iata: string; nombreIngles: string };
    destino: { input: string; oficial: string; slug: string; iata: string; nombreIngles: string };
    viaje: { ida: string; vuelta: string; pasajeros: number; presupuestoPorPersona: number };
  };
  resultados: {
    vuelos: { totalEncontrados: number; dentroDelPresupuesto: number; opciones: RawVueloOpcion[] };
    hoteles: { totalEncontrados: number; dentroDelPresupuesto: number; opciones: RawHotelOpcion[] };
    actividades: { totalEncontrados: number; dentroDelPresupuesto: number; opciones: RawActividadOpcion[] };
  };
}

// Tipos limpios: lo que consumen los componentes visuales, ya parseado.
export interface Precio {
  monto: number;
  moneda: string;
}

export interface Vuelo {
  precio: Precio;
  legs: RawVueloLeg[];
}

export interface Hotel {
  nombre: string;
  precio: Precio;
  rating: number | null;
}

export interface Actividad {
  titulo: string;
  origen: string;
  duracionEstimada: string;
  precio: Precio;
  descripcionBreve: string;
}

export interface BusquedaResultados {
  vuelos: Vuelo[];
  hoteles: Hotel[];
  actividades: Actividad[];
}
