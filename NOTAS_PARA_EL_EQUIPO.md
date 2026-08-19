# Notas para el equipo

**GEMINI_MODEL (bug de backend, no de este repo).** Para que `MicroServicioGrupo2` funcione en local hay que setear `GEMINI_MODEL=gemini-3.6-flash` (o el modelo vigente) como variable de entorno al levantarlo — hoy el `.env` no la define, y el default hardcodeado en `travelPlan.service.ts:37` (`gemini-2.5-flash`) ya no existe en la API de Gemini, así que sin esto el chat real falla siempre. No se puede arreglar desde acá (backend es solo lectura) — avisarle al subgrupo que mantiene MS1 para que actualicen el default o agreguen la variable a su `.env`.

**Proxy de Vite para CORS.** `vite.config.ts` proxya `/api` → `http://localhost:3000` porque MicroServicioGrupo2 no tiene middleware CORS. Esto es una solución de desarrollo únicamente (solo funciona porque front y backend corren en la misma máquina) — el día que esto se despliegue fuera de `localhost`, el backend va a necesitar `cors()` habilitado de verdad.
