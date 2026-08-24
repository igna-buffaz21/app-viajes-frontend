# Auditoría de MicroServicioGrupo2 (solo lectura)

Fecha: 2026-08-18. Auditoría de código real, sin modificar nada dentro de `MicroServicioGrupo2`.

**Re-auditado 2026-08-24** (ver sección 2bis): el "gap crítico" de la sección 2 sobre el contrato de chat progresivo ya no está 100% vigente — existe una implementación real en la rama remota `origin/Alejo`, todavía sin mergear a `main`.

## 1. Arquitectura general

- Stack: Node.js + Express 5 + TypeScript, MongoDB (driver nativo, sin ODM), cliente `@google/genai` para Gemini.
- Estructura en capas: `routers → controllers → services → repositorys`, más `models` (tipos + acceso a colección Mongo). Sin lógica en routers/controllers, como documenta el README del repo.
- Entry point `src/index.ts`: monta 3 routers (`/api/users`, `/api/ia`, `/api/travel-plans`), conecta Mongo al boot, expone `GET /` como healthcheck (ping Mongo + fecha + `1+1`).
- No hay separación de módulos "chat/perfil de viaje" vs "búsqueda/recomendación" — eso no existe como tal (ver punto 2).

## 2. Endpoints disponibles (reales)

| Método | Ruta | Body | Devuelve |
|---|---|---|---|
| GET | `/` | — | healthcheck |
| GET/POST/PUT/DELETE | `/api/users` (+`/:id`) | `{nombre, email, edad?}` | CRUD genérico sobre colección `usuarios`, sin relación con Clerk ni con el resto del dominio |
| POST | `/api/ia/preguntar` | `{ mensaje: string }` | `{ ok: boolean, respuesta: string }` — **una sola pregunta, sin estado, sin persistencia, sin conversacionId** |
| POST | `/api/travel-plans/generar` | `{ prompt: string }` | `{ _id, prompt, geminiPrompt, respuesta, createdAt, updatedAt }` — `respuesta` es **texto libre** de Gemini, no JSON estructurado |
| GET | `/api/travel-plans` / `/api/travel-plans/:id` | — | lista/detalle de lo ya generado |

### Gap crítico: el contrato de chat progresivo (A/B del prompt) NO existe

- No hay ningún endpoint que reciba `{ usuarioId, mensaje, conversacionId }` y devuelva `{ conversacionId, estado: "incompleto"|"listoParaBuscar", mensaje, viaje, camposFaltantesImportantes, preguntas }`.
- `POST /api/travel-plans/generar` es la ruta más cercana, pero:
  - Toma un `prompt` string suelto, sin `usuarioId` ni `conversacionId`.
  - El prompt real que arma el backend (`crearPromptTravelPlan` en `promtIA.model.ts:1-3`) es literalmente: `"Genera un plan de viaje basico para esta solicitud del usuario: ${promptUsuario}"`. Una sola línea.
  - El elaborado system prompt que se describe en el encargo (estados, preguntas con `{campo, pregunta, motivo}`, valores enum de `ritmoViaje`/`vidaNocturna`/etc.) **existe en el archivo pero como comentario muerto** (`promtIA.model.ts:6-393`) — nunca se pasa a Gemini, no está wireado a ningún controller. Ni siquiera coincide exactamente con el contrato del encargo: ese comentario usa `estado: NECESITA_INFORMACION | RECOMENDACIONES | SIN_RESULTADOS` y `camposFaltantes[]`, no `incompleto | listoParaBuscar` ni `camposFaltantesImportantes`.
  - No hay persistencia de un objeto `viaje` acumulado entre turnos. Cada llamada a `generar` es un evento aislado; no hay noción de "conversación en curso".
  - `respuesta` no es JSON parseable de forma confiable — es lo que Gemini devuelva en texto libre para ese prompt de una línea.

### El endpoint de búsqueda (contrato C del prompt) NO existe — actualización tras leer GLOSARIO_DOMINIO.md

- No hay ninguna ruta, service ni modelo relacionado con `vuelos`, `hoteles`, `actividades`, scraping, ni nada que produzca la forma de `resultados.vuelos/hoteles/actividades` del contrato C.
- No hay integración con ningún proveedor de vuelos/hoteles/actividades en el código (no hay llamadas HTTP externas salvo a Gemini).
- **Corrección de framing:** esto se documentó originalmente como "gap crítico" de MicroServicioGrupo2, tratándolo como algo que a este repo le debería faltar. Con `GLOSARIO_DOMINIO.md` (arquitectura de los 3 grupos) ahora se sabe que **no es así**: `MicroServicioGrupo2` es MS1 "Encuesta", cuya responsabilidad es solo el perfil de viaje conversacional. La búsqueda/scraping es responsabilidad de MS2 "Scraping" y el armado final de propuestas (`propuesta`, con `precioEstimado`) de MS3 "Armado" — ninguno de los dos existe en código todavía, en ningún ambiente accesible. No es un bug de MS1: es un servicio que a esta fecha todavía no se construyó, corriente abajo en la cadena `MS1 → MS2 → MS3 → Frontend`.
- Conclusión (sigue vigente): **hoy no hay forma de disparar una búsqueda real de propuestas de viaje**, venga de MS1, MS2 o MS3 — por eso `modules/results/` de este front sigue siendo 100% mock (ver `results.mock.ts`), con nombres de campo de ejemplo (no el `scrapingResult`/`propuesta` reales, todavía "a definir" según el glosario).

## 2bis. Actualización 2026-08-24 — el contrato de chat progresivo SÍ existe, en una rama sin mergear

Re-auditado a pedido del usuario (solo lectura, `git fetch`/`git show`/`git grep` contra el remoto, sin tocar el working tree ni el checkout local, que sigue en `main`). El punto "Gap crítico" de la sección 2 de arriba **ya no está vigente tal cual está escrito** — hay trabajo real hecho, pero no está en `main`.

**Dónde está:** rama remota `origin/Alejo` (`git branch -r` → `origin/Alejo`, `origin/main`; nada más). `git log --oneline main..origin/Alejo` muestra 1 commit por delante de `main`: `a2f01ef ajuste de prompt, persistencia en las conversaciones`. `git diff --stat main origin/Alejo` → 11 archivos, 1023 líneas agregadas. El checkout local de este repo sigue en `main` (`git status` limpio, sin esos archivos) — o sea, si `MicroServicioGrupo2` está corriendo localmente hoy con `npm run dev` sobre `main`, esta rama **no está activa**. Al momento de esta auditoría el server local (`localhost:3000`) no respondía (`curl` sin conexión), así que no se pudo probar en vivo — todo lo de abajo sale de leer el código con `git show origin/Alejo:<path>`.

**Endpoint nuevo confirmado:**

| Método | Ruta | Body | Devuelve |
|---|---|---|---|
| POST | `/api/conversaciones/mensaje` | `{ usuarioId: string, mensaje: string, conversacionId?: string }` | El JSON completo como body de la respuesta (200), **no envuelto en ningún campo `respuesta: string`**: `{ conversacionId, estado: "incompleto"\|"listoParaBuscar", mensaje, viaje, camposFaltantesImportantes, preguntas }` |
| GET | `/api/conversaciones/:id` | — | El documento `ConversacionViaje` persistido tal cual (forma distinta: `{_id, usuarioId, mensajes[], viaje, estado: "en_progreso"\|"completo", createdAt, updatedAt}`) |

Montado en `src/index.ts` (diff `main`→`origin/Alejo`): `app.use("/api/conversaciones", conversacionRoutes)`.

**Cómo funciona** (`src/services/conversacion.service.ts`):
- `usuarioId` tiene que ser un `ObjectId` válido de la colección `usuarios` (`UsuariosRepository.obtenerPorId`) — compatible con el login local del frontend (`session.local.ts`), que ya guarda ese mismo `_id`.
- Si se omite `conversacionId`: busca una conversación "en_progreso" del usuario, o crea una nueva. Si se manda un `conversacionId` que no existe → 404. **El frontend debe guardar el `conversacionId` que devuelve la primera respuesta y reenviarlo en cada mensaje siguiente** — ya no hace falta reenviar el historial completo como hace hoy `chat.real.adapter.ts`.
- Si la conversación ya está `estado: "completo"` (llegó a `listoParaBuscar`) y se le manda otro mensaje con ese `conversacionId` → **409**. El frontend tiene que dejar de mandar mensajes a esa conversación una vez que llega a `listoParaBuscar`.
- Llama a Gemini con `systemInstruction: PROMPT_EXTRACCION_VIAJE` (prompt nuevo y real, no el comentario muerto — `promtIA.model.ts:9-849` en esta rama) y `responseMimeType: "application/json"` — o sea, le pide a Gemini modo JSON nativo, no espera que la IA lo envuelva en \`\`\`json. Si `JSON.parse` del texto de Gemini falla, el service tira un 500 (`"La IA devolvió una respuesta que no es JSON válido"`).
- El `viaje` acumulado (tipo `Viaje` en `viaje.model.ts`) se persiste en Mongo en la colección `conversacionesViaje` (nueva, no existía antes) y se le pasa de vuelta a Gemini en cada turno junto con el mensaje nuevo, para que lo siga completando.
- `mensaje` en la respuesta, cuando `estado` no es `listoParaBuscar`, es el resultado de unir `preguntas.map(p => p.pregunta)` con espacios — no es una respuesta conversacional libre, es literalmente la concatenación de las preguntas pendientes.
- Usa `GEMINI_MODEL || "gemini-3.1-flash-lite"` como default — distinto del default de `travelPlan.service.ts` (`"gemini-2.5-flash"`). Sin `GEMINI_MODEL` seteado, revisar si ese modelo sigue disponible (ya pasó antes con `gemini-2.5-flash`, ver punto 9bis más abajo).

**Forma exacta del `Viaje` acumulado** (`viaje.model.ts`, rama `origin/Alejo`): todos los campos hoja son nullable (`string | null`, `number | null`, etc.) — la IA manda `null` explícito en los campos que todavía no completó, no los omite. El tipo `PerfilViaje` del frontend (`chat.types.ts`) ya se actualizó para aceptar `null` en todos esos campos tras comparar 1:1 contra este archivo.

**Pregunta 2 del usuario — JSON de vuelos/hoteles con `rawText`/IATA que le pasó un compañero:** `git grep` (case-insensitive) de `rawText`, `originIata`, `destinationIata`, `scraping`, `resultados.vuelos`, `opciones[]`, y por separado `hotel|aerolinea|scraper|puppeteer|playwright`, contra **todo** `main` y **todo** `origin/Alejo` (las únicas dos ramas remotas que existen) → **cero resultados de código real**, las únicas coincidencias de "hotel"/"vuelos" son texto de ejemplo dentro del prompt de IA (mensajes de usuario simulados). **Conclusión con evidencia: ese JSON no viene de `MicroServicioGrupo2`, en ninguna rama.** Coincide con lo que ya documenta la sección de arriba: la búsqueda/scraping es responsabilidad de MS2 (Grupo 3), que no existe en código en ningún ambiente accesible desde esta auditoría.

## 3. Persistencia

- Mongo Atlas (`MONGO_URI` en `.env`, cluster `FreeVago`), DB `test` (`MONGO_DB=test`).
- Colecciones reales: `usuarios` (CRUD genérico), `travelPlans` (`{prompt, geminiPrompt, respuesta, createdAt, updatedAt}`).
- No existe colección de conversaciones, ni de perfiles de viaje acumulados, ni de resultados de búsqueda.
- `usuarioId` no se valida contra nada: `/api/ia/preguntar` ni siquiera lo recibe, y `/api/travel-plans/generar` tampoco. No hay vínculo entre un plan generado y un usuario.

## 4. Autenticación actual

- Confirmado: no hay Clerk ni ningún middleware de auth en `MicroServicioGrupo2`. Ninguna ruta valida token, ninguna ruta usa `req.headers.authorization`. Todo es público.
- No existe `/auth/me` ni nada equivalente.
- El backend no asume nada sobre usuario autenticado — de hecho no lo usa en absoluto en los endpoints de IA/travel-plans.

## 5. Formato real de respuestas vs. diseño visual

- `resultados.vuelos/hoteles/actividades` (precios string, `rawText`, ratings con coma, etc. del contrato C del encargo) **no es "dato crudo del backend"** — es un ejemplo hipotético/de otra fuente que no corresponde a ningún endpoint real de este repo. No hay nada que mapear todavía.
- Itinerario día por día, puntos de interés curados, badge de coincidencia, resumen de presupuesto unificado: no existen, y tampoco existe la data base (vuelos/hoteles/actividades) sobre la cual construirlos.
- Lo único real y usable hoy es texto libre de Gemini (`respuesta: string`), sin estructura.

## 6. Manejo de errores

- `/api/ia/preguntar`: 400 si falta `mensaje` o no es string; 500 genérico si falla Gemini.
- `/api/travel-plans/generar`: 400 si falta `prompt`; errores no controlados van a `next(err)` sin middleware de error visible en `index.ts` (Express 5 usa el manejador default → probablemente stack trace crudo).
- `/api/users`: 404 en get/put/delete si no existe; sin validación de `email`/`nombre` (puede crearse cualquier cosa).
- No hay manejo de timeouts, ni de "sin resultados dentro del presupuesto" (no aplica, no existe búsqueda).

## 7. Variables de entorno para levantar el backend local

De `.env` (ya presente en el repo, no se modifica):
```
MONGO_URI=mongodb+srv://... (cluster FreeVago, ya apunta a Atlas real)
MONGO_DB=test
GEMINI_API_KEY=...
PORT=3000
```
`BD_HOST/BD_USER/BD_PASSWORD/BD_DATABASE` (MySQL) están en el `.env` pero no se usan en ningún lado del código (commit `5d998f0` dice explícitamente que se eliminaron las dependencias de MySQL) — variables muertas, no hace falta configurarlas.

Con `npm install && npm run dev` en `MicroServicioGrupo2` el server levanta en `http://localhost:3000`, rutas bajo `/api/...`.

## 8. Qué se puede conectar tal cual hoy vs. qué necesita al equipo de backend

**Conectable hoy, sin cambios de backend:**
- `POST /api/ia/preguntar` — pregunta/respuesta suelta, sin estado. Sirve para un chat de una sola vuelta o para mandar el prompt acumulado completo en cada mensaje (sin persistencia de servidor — el front tendría que mantener el historial y reenviarlo).
- `POST /api/travel-plans/generar` — genera y persiste un "plan" a partir de un prompt libre; se puede usar como "generar propuesta final" a partir de un resumen armado en el front, pero no hay forma de iterar sobre un JSON estructurado.
- `/api/users` CRUD — utilizable para un login básico propio (crear/buscar usuario por email), ya que no depende de Clerk.

**Bloqueado, requiere al equipo de backend:**
- Cualquier flujo de perfil de viaje progresivo con `estado: incompleto|listoParaBuscar`, `preguntas[]`, objeto `viaje` acumulado — no existe, hay que pedirlo.
- Cualquier búsqueda real de vuelos/hoteles/actividades — no existe ningún endpoint, hay que pedirlo (o mockearlo explícitamente en el front mientras tanto).
- El comentario con el system prompt "bueno" en `promtIA.model.ts` está muerto — avisar para que lo conecten o lo borren, y para que definan cuál de los dos contratos (el del comentario, o el descrito en este encargo) es el real a implementar, porque difieren entre sí.

## 9bis. Bugs reales encontrados al probar el flujo end-to-end (no se tocó el backend)

Probando el chat conectado de verdad a `POST /api/travel-plans/generar`, aparecieron dos problemas del lado del backend, esquivados solo desde el front:

1. **Sin CORS.** `MicroServicioGrupo2` no tiene ningún middleware CORS. El browser bloquea toda llamada cross-origin desde `localhost:5173`. Se resolvió agregando un proxy de Vite (`vite.config.ts` → `server.proxy["/api"]`) que redirige `/api/*` a `http://localhost:3000` del lado del servidor de desarrollo, y cambiando `VITE_API_URL` a `/api` (relativo) en el `.env` del front. **Para producción, el backend va a necesitar `cors()` (o headers equivalentes) si el front no se sirve desde el mismo origen.**
2. **Modelo de Gemini deprecado.** El default hardcodeado en `travelPlan.service.ts:37` (`process.env.GEMINI_MODEL || "gemini-2.5-flash"`) apunta a un modelo que Google ya no ofrece a usuarios nuevos (`404 NOT_FOUND`, sugiere `models/gemini-3.6-flash`). No hay `GEMINI_MODEL` seteado en el `.env` real. Para poder probar, se corrió el backend con `GEMINI_MODEL=gemini-3.6-flash` como variable de entorno de shell (no se modificó ningún archivo del repo — al reiniciar sin esa variable, vuelve a fallar). **El equipo de backend debería actualizar el default o setear `GEMINI_MODEL` en su `.env`.**

Con ambos esquivados, la respuesta de Gemini llega completa y coherente, incorporando el historial de la conversación reenviado en el `prompt`.

## 9. Nota sobre el frontend existente (afecta directamente el punto 2.2 del encargo)

`app-viajes-frontend` no es un esqueleto neutro: es el frontend de **otra app** (gestión de incidentes municipales — roles `superadmin/admin/operator/citizen`, rutas `panel/operator/app`, entidades `municipalities/incidents`), ya completamente wireado a **Clerk** (`ClerkProvider` en `main.tsx`, `useAuth`/`getToken` en `App.tsx`, interceptor de axios que inyecta el JWT de Clerk, `protectedRoute.tsx` que redirige según `isSignedIn`/rol, y `authService.getAuth()` que llama a `GET /auth/me` — endpoint que tampoco existe en este backend). No hay ni un componente de chat ni una pantalla de resultados de viaje: cero código relacionado a "viaje", "chat", "vuelo", "hotel" en todo `src/`. El "diseño de referencia en Claude Design" mencionado en el encargo no está en el repo (no hay mockups, ni archivos de diseño, ni componentes de chat/resultados).

## 10. Bug real: `crearPromptTravelPlan` borrada por una edición local sin commitear — 500 en `/api/travel-plans/generar` (RESUELTO)

**Fecha: 2026-08-19/20.** Reportado como "el chat en modo real tira 500 al mandar un mensaje". No era el prompt viejo de matching/catálogo que se sospechaba en un principio — era peor: una edición local sin commitear que dejó el archivo del prompt sin ninguna función exportada.

**Causa raíz, confirmada con `git diff`/`git log` en `MicroServicioGrupo2` (solo lectura, sin tocar nada):**
- El HEAD commiteado en ese momento (`d7f209a`, "se agrego prompt ia") tenía intacta la función real `export function crearPromptTravelPlan(promptUsuario: string)` en `promtIA.model.ts:1-3`, con el prompt viejo de "matching contra catálogo de la agencia" pegado abajo como comentario muerto (ver punto 8, tercer ítem — eso sigue vigente, ese comentario no se tocó).
- Pero el **working tree tenía un cambio local sin commitear** en ese mismo archivo: alguien reemplazó el comentario muerto viejo por uno nuevo (correctamente encaminado hacia el contrato de perfil de viaje progresivo — "construir progresivamente el perfil, sin recomendar destinos todavía", coincide con lo que ya usa `chat.mock.adapter.ts` de este front) — pero **en el proceso borró por completo la función `crearPromptTravelPlan`**. El archivo entero (461 líneas) quedó siendo un solo bloque `/** ... */`, sin un solo `export`.
- Como el script `dev` de `MicroServicioGrupo2` corre `ts-node-dev --respawn --transpile-only`, no hay chequeo de tipos — el import roto en `travelPlan.service.ts:2` nunca se detectó hasta el primer POST en runtime.

**Reproducción:** se levantó el backend local (`npm run dev`, con el cambio sin commitear todavía en el working tree) y se mandó el mismo POST que hace el front (`{"prompt": "..."}` a `/api/travel-plans/generar`). Devolvió 500. El stack trace real (visible en el *body* de la respuesta HTTP, no en la consola del server — `index.ts` no tiene middleware de error propio, así que Express 5 usa su handler default y filtra el stack crudo):

```
TypeError: (0 , promtIA_model_1.crearPromptTravelPlan) is not a function
    at TravelPlanService.generarDesdePrompt (travelPlan.service.ts:36:47)
    at generarDesdePrompt (travelPlan.controller.ts:42:50)
```

**Causa descartada:** el `GEMINI_MODEL` deprecado (punto 9bis, ítem 2) seguía sin estar seteado en `.env`, pero **no era la causa de este 500 en particular** — el código explota en `travelPlan.service.ts:36` (la llamada a `crearPromptTravelPlan`), antes de llegar a la línea 37 donde se resuelve el modelo. Es un segundo problema, independiente, que solo se manifestaría después de resolver este.

**Frontend descartado como causa:** se revisó `chat.real.adapter.ts` — body (`{ prompt }`), endpoint (`/api/travel-plans/generar` vía proxy de Vite) y headers coinciden exactamente con lo que espera el controller. Nada para arreglar del lado del front.

**Estado: RESUELTO.** El dueño del cambio revirtió manualmente su edición local (working tree volvió a `d7f209a` limpio, sin cambios sin commitear). Se reprodujo el mismo POST contra ese estado y devolvió `201` con una respuesta completa de Gemini — confirmado sin tocar nada del backend.

## 11. Pendientes para próxima sesión (sin resolver todavía)

Notados durante la QA en modo mock del 2026-08-20, ninguno bloquea nada hoy — quedan documentados para retomar:

**(a) Las regex de `chat.mock.adapter.ts` no toleran fraseo natural del usuario — riesgo real en una demo en vivo.** `extraerPerfil` depende de patrones rígidos (`el <día> de <mes>`, `salimos desde X`, `somos N`, etc.). Frases perfectamente naturales y razonables no matchean: por ejemplo "estamos en villa maria cordoba" (en vez de "salimos desde villa maria cordoba") no seteó `lugarSalida`, y "el mes que viene" no seteó `fechaSalida` (la regex exige un día numérico explícito, no fechas relativas). Si alguien improvisa texto libre en una demo en vivo en vez de seguir un guion ensayado, el mock puede quedarse repitiendo la misma pregunta sin avanzar, lo cual se ve mal frente a audiencia. No se tocó nada todavía — decidir si vale la pena flexibilizar las regex antes de la próxima demo en vivo, o si alcanza con seguir un guion de preguntas/respuestas ensayado.

**(b) Decidir si el mock debe preguntar los campos enum que hoy quedan sin uso.** `chat.options.ts`/`QuestionCard` soportan chips para `socializar`, `vidaNocturna`, `naturaleza`, `gastronomia`, `cultura` y los campos de `transporte.vuelo` — pero `PREGUNTAS_CANDIDATAS` en `chat.mock.adapter.ts` nunca los incluye como pregunta candidata, así que esos chips **nunca se muestran en modo demo hoy**, aunque el código que los renderiza funciona (confirmado con `ritmoViaje` e `intereses`, que sí están en la lista de candidatas). Es una decisión de producto/alcance, no un bug: ¿vale la pena sumarlos a `PREGUNTAS_CANDIDATAS` para que el modo demo muestre la variedad completa de chips, o se deja así hasta que MS1 real los pregunte?

**(c) Bug preexistente en `extraerPerfil`: no reconoce "dólares" con tilde.** En `chat.mock.adapter.ts`, el regex de presupuesto captura tanto `dolares` como `dólares`, pero la resolución de moneda inmediatamente después solo chequea `presupuesto[2].startsWith("dolar")` (sin tilde) — así que si el usuario escribe "dólares" (con tilde), el monto se extrae bien pero la moneda cae al `else` final y queda mal seteada como `"ARS"` en vez de `"USD"`. Preexistente a este plan (no se tocó `extraerPerfil` salvo agregar las dos líneas de `gastronomia`/`vida nocturna` documentadas en el commit `feat: encuesta con chips...`). No se tocó todavía.
