# Notas para el equipo

**GEMINI_MODEL (bug de backend, no de este repo).** Para que `MicroServicioGrupo2` funcione en local hay que setear `GEMINI_MODEL=gemini-3.6-flash` (o el modelo vigente) como variable de entorno al levantarlo — hoy el `.env` no la define, y el default hardcodeado en `travelPlan.service.ts:37` (`gemini-2.5-flash`) ya no existe en la API de Gemini, así que sin esto el chat real falla siempre. No se puede arreglar desde acá (backend es solo lectura) — avisarle al subgrupo que mantiene MS1 para que actualicen el default o agreguen la variable a su `.env`.

**Proxy de Vite para CORS.** `vite.config.ts` proxya `/api` → `http://localhost:3000` porque MicroServicioGrupo2 no tiene middleware CORS. Esto es una solución de desarrollo únicamente (solo funciona porque front y backend corren en la misma máquina) — el día que esto se despliegue fuera de `localhost`, el backend va a necesitar `cors()` habilitado de verdad.

**Alcance de MS1 confirmado por el equipo (2026-08-19).** El chat de este front espera que MS1 solo
converse y frene en `estado: "listoParaBuscar"`, sin recomendar destinos ni armar itinerario (eso es
de MS2/MS3, ver `GLOSARIO_DOMINIO.md`). Esto vuelve más urgente el bug ya documentado en
`AUDITORIA_BACKEND.md` §2 ("Gap crítico: el contrato de chat progresivo... NO existe" — hay un system
prompt elaborado en `promtIA.model.ts` pero como comentario muerto, nunca wireado, y además NO coincide
con este contrato: usa `estado: NECESITA_INFORMACION | RECOMENDACIONES | SIN_RESULTADOS`, y ese estado
`RECOMENDACIONES` es justo el comportamiento que este alcance corregido elimina — wirearlo tal cual
reintroduciría el problema, no lo resuelve): con el alcance ahora confirmado por todo el equipo, el
comportamiento actual de `/api/travel-plans/generar` (recomienda destinos, no frena en
`listoParaBuscar`) queda confirmado fuera de contrato, no es una ambigüedad de diseño pendiente.
