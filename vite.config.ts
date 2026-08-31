import { defineConfig } from 'vite'
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Ninguno de los backends de Grupo 2/Grupo 3 tiene middleware CORS (son
    // solo lectura, no se pueden tocar) — este proxy hace que las llamadas a
    // /api salgan del mismo origen que el front, evitando el bloqueo de CORS
    // del browser. Grupo 3 corre ms2-scraping y ms3-armado como procesos
    // Express independientes (puertos propios, NO unificados con MS1 — ver
    // AUDITORIA_BACKEND.md), así que hace falta rutear cada prefijo al
    // puerto correcto. Las entradas específicas van ANTES del catch-all
    // "/api" (MS1): Vite matchea por el primer prefijo que calza, en el
    // orden en que están declaradas las claves acá abajo.
    proxy: {
      // ms2-scraping (Grupo 3), puerto 3003 — confirmado en runtime
      // (2026-08-31) contra el repo clonado, no solo contra la
      // documentación. /api/health es ambiguo entre los tres backends; hoy
      // el único consumidor del front es el chequeo de salud de MS2
      // (busqueda.real.adapter.ts), así que se rutea acá. Si más adelante
      // hace falta un health check de MS1/MS3 desde el front, esto necesita
      // un path propio (ej. un query param o un prefijo distinto), no se
      // puede desambiguar solo con la URL tal como está hoy.
      "/api/health": { target: "http://localhost:3003", changeOrigin: true },
      "/api/sugerencias": { target: "http://localhost:3003", changeOrigin: true },
      "/api/viaje": { target: "http://localhost:3003", changeOrigin: true },
      "/api/vuelos": { target: "http://localhost:3003", changeOrigin: true },
      "/api/hoteles": { target: "http://localhost:3003", changeOrigin: true },
      "/api/actividades": { target: "http://localhost:3003", changeOrigin: true },

      // MS3 (ms3-armado, puerto 3004) NO se proxea todavía: nada del front
      // lo consume hoy (ver explorar.page.tsx — la pantalla se detiene en
      // los resultados de MS2) y su ruta expuesta (/api/travel-plans)
      // colisiona de nombre con la de MS1 (/api/travel-plans/generar) — el
      // mismo problema de colisión que ya tenían documentado. Agregarla sin
      // necesidad real hoy solo introduce ese riesgo sin ningún beneficio.

      // MicroServicioGrupo2 (MS1), catch-all — tiene que ir último.
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
})
