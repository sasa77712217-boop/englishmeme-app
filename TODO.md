# EnglishMeme — resultados de implementación

## 1. Migración separada y segura

- EnglishMeme usa un proyecto Supabase independiente de PetGuard.
- El repositorio y la publicación web son independientes.
- El `config.php` antiguo, contraseñas, claves SMTP, token pepper y credenciales de InfinityFree no se suben al repositorio.
- El SQL original se transforma a PostgreSQL mediante migraciones y scripts revisables.
- Las imágenes de `uploads/` se migran a Storage sin convertirlas en archivos públicos indiscriminados.

## 2. Experiencia visual y responsive

- Se conserva el lenguaje visual original de MemeEnglish: tema nocturno/editorial, coral, tarjetas, etiquetas y estaciones de niveles.
- La interfaz funciona en móvil, tableta y escritorio.
- La navegación móvil no tapa el contenido.
- Las tarjetas conservan proporción, carga diferida y placeholder cuando falta una imagen.
- El modo claro/oscuro conserva la preferencia del usuario.

## 3. Acceso y perfiles

- El usuario puede entrar con Google OAuth mediante Supabase Auth.
- El perfil de aplicación se crea o actualiza al iniciar sesión.
- Los roles owner, admin y user se conservan y se protegen con RLS.
- El usuario puede ver su progreso, racha, puntos, inventario y personalización de perfil.

## 4. Aprendizaje y pronunciación

- Se conservan niveles, tarjetas, preguntas, opciones, porcentaje mínimo, desbloqueo progresivo y práctica de tarjetas nuevas.
- La respuesta correcta no se expone antes de responder.
- Las tarjetas mantienen el botón de escuchar pronunciación usando la voz del navegador.
- El progreso histórico no se reinicia cuando se agregan tarjetas.

## 5. Tutoriales de inglés

- El usuario dispone de una sección de videos tutoriales con título, descripción, miniatura, categoría y nivel.
- Los videos publicados se pueden filtrar y reproducir de forma segura.
- El owner puede crear, editar, publicar, retirar y ordenar tutoriales desde Admin.
- Los administradores secundarios solo pueden operar dentro de los permisos asignados.

## 6. Puntos seguros

- Los puntos se otorgan únicamente desde funciones server-side/RPC validadas.
- Cada evento de recompensa es idempotente y no puede duplicarse al repetir una petición.
- Existen límites diarios o por actividad para evitar acumulación por bugs.
- Cada movimiento queda en un ledger auditable.
- No se confía en saldos enviados por el navegador.

## 7. Tienda y personalización

- El usuario puede consultar artículos/banners publicados y su precio en puntos.
- Una compra valida saldo, descuenta puntos y crea el inventario en una operación atómica.
- La misma compra no se repite accidentalmente por doble clic o reintento.
- El usuario puede equipar un banner comprado en su perfil.
- El administrador puede crear, editar, publicar, retirar y cambiar precios de artículos.

## 8. Panel Admin y auditoría

- El panel permite editar niveles, tarjetas, tutoriales, artículos y banners.
- Las acciones destructivas requieren confirmación.
- Las operaciones importantes se registran con actor, entidad, acción y fecha.
- Owner conserva la administración de reglas críticas; admin secundario no accede a secretos ni configuración sensible.

## 9. Validación y entrega

- El proyecto compila en modo producción.
- Las rutas declaradas están disponibles en `manus-routes.json`.
- Se valida el comportamiento sin usar credenciales reales dentro del código.
- Se documentan los pasos restantes de Google Cloud y publicación.
