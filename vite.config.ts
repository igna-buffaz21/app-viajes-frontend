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
    // A partir de la integración de Clerk, el front deja de pegarle a los
    // microservicios directo (MS1 en :3000, MS2 en :3003, MS3 en :3004) y
    // todo pasa por TP-Grupo-1-Clerk-Gateway (Back/), que unifica las 3
    // rutas bajo un solo host y ya inyecta x-user-id + valida el token de
    // Clerk donde corresponde (ver gateway: Back/src/app.js — MS1 en
    // "Opción B" sin requireAuth todavía, MS2/MS3 sí lo exigen).
    //
    // El gateway ya trae su propio CORS (cors({origin:true, credentials:
    // true})) así que este proxy ya no es necesario para evitar el bloqueo
    // del browser — se mantiene igual por comodidad de desarrollo (mismo
    // origen, no hay que armar URLs absolutas en cada fetch) y porque
    // aísla al front de dónde corre el gateway en cada momento (local,
    // red de Grupo 1, etc.): alcanza con cambiar este único target.
    //
    // Confirmado corriendo el gateway localmente (2026-09-13) con
    // PORT=4000 (el 3000 lo ocupa MS1) y MS1_URL/MS2_URL/MS3_URL apuntando
    // a localhost — GET /api/health respondió 200 desde acá.
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
})
