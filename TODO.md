# EnglishMeme — resultados de implementación

## 1. Migración separada y segura — avanzado

- [x] EnglishMeme usa un proyecto Supabase independiente de PetGuard (`EnglishMeme`, activo y saludable).
- [x] El repositorio y la publicación web son independientes (`sasa77712217-boop/englishmeme-app`).
- [x] El `config.php` antiguo, contraseñas, claves SMTP, token pepper y credenciales de InfinityFree no se subieron al repositorio.
- [x] Se transformaron niveles, 38 tarjetas, 11 cuentas históricas, 6 registros de progreso por nivel y 69 respuestas a PostgreSQL; las cuentas antiguas se conservan sin hashes de contraseña.
- [ ] Migrar los assets a un bucket de Storage privado/firmado para las imágenes administrables; por ahora los assets visuales del ZIP se sirven desde `public/legacy-images` como respaldo de la primera versión.

## 2. Experiencia visual y responsive — avanzado

- [x] Se conserva el lenguaje visual original de MemeEnglish: tema nocturno/editorial, coral, tarjetas, etiquetas y estaciones de niveles.
- [x] La interfaz funciona en móvil, tableta y escritorio con navegación inferior en móvil.
- [x] Las tarjetas mantienen proporción y placeholder cuando falta una imagen.
- [x] El modo claro/oscuro conserva la preferencia del usuario.

## 3. Acceso y perfiles — parcial

- [x] El flujo de frontend está preparado para Google OAuth mediante Supabase Auth.
- [x] El trigger de usuario crea/actualiza el perfil de aplicación y restaura rol, puntos y racha si el correo coincide con una cuenta histórica.
- [x] Los roles owner, admin y user se conservan en datos de compatibilidad y se protegen con RLS.
- [x] La vista de perfil muestra progreso, racha, puntos, inventario y banner equipado; falta validar con una cuenta Google real.
- [ ] Configurar en Supabase/Google Cloud el Client ID, Client Secret, callback autorizado y Site URL con los datos del usuario.

## 4. Aprendizaje y pronunciación — avanzado

- [x] Se conservaron niveles, tarjetas, preguntas, opciones y contenido histórico; el estudio consulta las tarjetas migradas desde Supabase.
- [x] La respuesta correcta no se expone antes de responder y el RPC valida la respuesta en servidor cuando hay sesión.
- [x] Las tarjetas mantienen el botón de escuchar pronunciación usando la voz del navegador.
- [ ] Completar la lógica de porcentaje mínimo, bloqueo/desbloqueo y cierre de quiz por nivel tomando el progreso real de cada usuario.

## 5. Tutoriales de inglés — parcial

- [x] El usuario dispone de una sección de videos tutoriales con título, descripción, miniatura y categoría.
- [x] Los videos publicados se pueden reproducir en un modal mediante URL embebible.
- [x] Admin ya puede crear, editar, publicar y retirar tutoriales desde Supabase.
- [ ] Añadir filtros activos por categoría/nivel y validación estricta de hosts de video antes de publicar.

## 6. Puntos seguros — avanzado

- [x] Los puntos se otorgan desde funciones server-side/RPC validadas.
- [x] Cada evento de recompensa es idempotente y no puede duplicarse al repetir una petición.
- [x] Existen límites diarios por actividad para evitar acumulación por bugs.
- [x] Cada movimiento queda en un ledger auditable y el saldo se bloquea durante la transacción.
- [x] El cliente no puede enviar un saldo arbitrario para comprar.

## 7. Tienda y personalización — parcial

- [x] El usuario puede consultar artículos/banners publicados y su precio en puntos.
- [x] Una compra valida saldo, descuenta puntos y crea inventario en una operación atómica.
- [x] La misma compra no se repite accidentalmente por doble clic o reintento.
- [x] Admin ya puede crear, editar, publicar, retirar y cambiar precios de artículos.
- [ ] Conectar la acción de equipar banner y refrescar el perfil desde `profile_customizations`/`user_inventory`.

## 8. Panel Admin y auditoría — parcial

- [x] El panel permite editar tarjetas, tutoriales y artículos/banners; muestra niveles y contadores reales para roles administrativos.
- [ ] Añadir confirmación explícita antes de retirar o borrar contenido.
- [ ] Completar escritura de `audit_logs` para las operaciones administrativas importantes.
- [x] Owner conserva la administración de reglas críticas; admin secundario no accede a secretos ni configuración sensible por RLS.

## 9. Validación y entrega — avanzado

- [x] `npm run typecheck` y `npm run build` pasan en producción.
- [x] Las rutas declaradas están disponibles en `public/manus-routes.json` y el servidor responde HTTP 200.
- [x] La clave publicable se mantiene solo en el entorno local ignorado y no hay credenciales de InfinityFree en el código.
- [x] Se preparó el build estático y el fallback SPA de publicación.
- [ ] Guardar checkpoint remoto y publicar la versión estable después de configurar Google OAuth.
