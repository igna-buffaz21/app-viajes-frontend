import type { RawBusquedaResponse } from "./results.types";

// Desconectado (decisión de producto 2026-08-31): solo lo usa
// results.service.ts, que a su vez ya no lo llama nadie (/resultados es el
// flujo real ahora). Se mantiene por su valor de referencia: resultó ser
// casi idéntico a la forma real de MS2 (confirmado en runtime), útil como
// ejemplo de la forma "sucia" (precios como string, rating con coma,
// rawText) sin tener que levantar ms2-scraping para verla.
export const mockBusquedaResponse: RawBusquedaResponse = {
  metadata: {
    origen: { input: "Córdoba, Argentina", iata: "COR", nombreIngles: "Córdoba, Argentina" },
    destino: {
      input: "Miami, Estados Unidos",
      oficial: "Miami, Estados Unidos",
      slug: "Miami_Estados_Unidos",
      iata: "MIA",
      nombreIngles: "Miami, Estados Unidos",
    },
    viaje: { ida: "2026-10-20", vuelta: "2026-10-28", pasajeros: 1, presupuestoPorPersona: 1500000 },
  },
  resultados: {
    vuelos: {
      totalEncontrados: 10,
      dentroDelPresupuesto: 10,
      opciones: [
        {
          price: "$575",
          legs: [
            {
              time: "5:10 am – 3:20 pm",
              airline: "LATAM Airlines",
              stops: "1 stop",
              layover: "LIM 1h 05m layover, Lima J Chavez Intl",
              duration: "11h 10m",
              route: "COR-MIA",
            },
            {
              time: "9:35 pm – 6:45 pm+1",
              airline: "LATAM Airlines",
              stops: "1 stop",
              layover: "SCL 10h 11m layover, Santiago Arturo Merino Benitez",
              duration: "20h 10m",
              route: "MIA-COR",
            },
          ],
          rawText: "Best | Cheapest | ... | $575 | Light | Select",
        },
        {
          price: "$642",
          legs: [
            {
              time: "11:40 pm – 1:15 pm+1",
              airline: "Aerolíneas Argentinas",
              stops: "1 stop",
              layover: "GRU 2h 20m layover, São Paulo Guarulhos",
              duration: "13h 35m",
              route: "COR-MIA",
            },
            {
              time: "8:05 pm – 8:50 am+1",
              airline: "Aerolíneas Argentinas",
              stops: "1 stop",
              layover: "GRU 3h 05m layover, São Paulo Guarulhos",
              duration: "12h 45m",
              route: "MIA-COR",
            },
          ],
          rawText: "Best | ... | $642 | Standard | Select",
        },
      ],
    },
    hoteles: {
      totalEncontrados: 15,
      dentroDelPresupuesto: 6,
      opciones: [
        {
          name: "Holiday Inn Express & Suites Miami Intl Airport - 36th St by IHG",
          price: "$ 1.468.134",
          rating: "9,4",
          rawText:
            "Holiday Inn Express... | 8 noches, 1 adulto | $ 1.468.134 | + $ 190.857 de impuestos y cargos | Ver disponibilidad",
        },
        {
          name: "Hampton Inn by Hilton Miami Airport South Blue Lagoon",
          price: "$ 1.312.980",
          rating: "8,9",
          rawText:
            "Hampton Inn by Hilton... | 8 noches, 1 adulto | $ 1.312.980 | + $ 171.230 de impuestos y cargos | Ver disponibilidad",
        },
      ],
    },
    actividades: {
      totalEncontrados: 35,
      dentroDelPresupuesto: 18,
      opciones: [
        {
          origen: "Turismocity",
          titulo: "Tour de compras por los outlets de Miami",
          duracionEstimada: "8hs",
          franjaHoraria: "No especificada",
          precioPorPersona: "$31.926",
          descripcionBreve:
            "¿Sois aficionados al shopping? Disfrutaréis de un día de compras por los mejores outlets de la ciudad.",
        },
        {
          origen: "Turismocity",
          titulo: "Excursión en catamarán por la bahía de Miami",
          duracionEstimada: "3hs",
          franjaHoraria: "Tarde",
          precioPorPersona: "$18.450",
          descripcionBreve:
            "Recorré la costa de Miami en catamarán, con vistas a Downtown y las mansiones de Star Island.",
        },
      ],
    },
  },
};
