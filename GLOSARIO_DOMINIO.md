# Glosario y arquitectura del proyecto (fuente: Notion compartido entre equipos)

Este proyecto tiene 3 grupos + gateway/auth separados:

- Grupo 1: API Gateway (rutea, valida JWT de Clerk, inyecta header `x-user-id`) + Auth (Clerk). Ninguno de los dos está conectado todavía.
- Grupo 2 (nosotros): Frontend + MS1 "Encuesta" (repo `MicroServicioGrupo2`, en desarrollo activo por mis compañeros de backend).
- Grupo 3: MS2 "Scraping" (vuelos/hoteles/actividades crudos) + MS3 "Armado" (arma y presupuesta las propuestas finales con IA). Ninguno de los dos existe en código todavía, en ningún ambiente accesible.

Cadena de dependencia real: MS1 → MS2 → MS3 → Frontend. MS3 no le habla a MS1 directo, lee lo que necesita a través del resultado de MS2.

## Términos con nombre ya cerrado
- `propuesta`: una opción de viaje completa (destino + vuelo + hospedaje + actividades + precio estimado). La produce MS3, la consume el Frontend.
- `scrapingResult`: vuelos/hoteles/actividades crudos para 1-3 destinos. Lo produce MS2, lo consume MS3.
- `userId`: viene de Clerk vía el header `x-user-id` que inyecta el Gateway. Es un STRING con prefijo (ej. `user_2abcDEF456ghi`), nunca un ObjectId de Mongo.

## Términos todavía "a definir" (van a cambiar)
- Nombre de la salida de MS1 (respuestas crudas de la encuesta).
- Nombre de la salida de MS3 (viaje final armado) — hoy hay una colisión de nombre con lo que MS1 también llama internamente igual, sin resolver todavía.

## No confundir
- `destino` (ciudad, para mostrar en UI) ≠ `destination` (código IATA de aeropuerto, ej. `ASU`).
- `origen` (ciudad de salida) ≠ `origin` (código IATA, puede ser lista: `COR,BUE`).
- `precio` (de un ítem suelto: un vuelo, un hotel) ≠ `precioEstimado` (total de una propuesta completa).

## Regla de escritura en colecciones
Nadie escribe en una colección que no es suya. Si MS3 necesita un dato de la encuesta, lo lee o lo pide por HTTP, nunca lo modifica.