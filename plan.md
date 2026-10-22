# EnglishMeme — plan de migración y evolución

## Alcance aprobado

Migrar la aplicación PHP/MySQL entregada en el ZIP a una aplicación web separada de PetGuard, con frontend React + TypeScript para conservar con precisión el diseño web original y backend Supabase independiente. Mantener tarjetas, voz de pronunciación, niveles, pruebas, progreso, puntos, rachas, perfiles, roles, auditoría y panel Admin. Añadir Google OAuth, tutoriales en video y una tienda de recompensas con banners y artículos visuales para el perfil.

El proyecto nuevo no reutilizará el proyecto Supabase de PetGuard ni publicará el `config.php`, hashes, contraseñas SMTP, token pepper o credenciales de InfinityFree.

## Enfoque de migración

1. Inventariar las tablas y datos del SQL original.
2. Crear un esquema PostgreSQL separado para EnglishMeme.
3. Importar usuarios, perfiles, niveles, tarjetas, progreso y auditoría mediante una transformación controlada.
4. Mantener los identificadores legacy cuando sea posible para facilitar la trazabilidad.
5. Migrar imágenes de `uploads/` a Supabase Storage con bucket privado/políticas adecuadas.
6. Usar Supabase Auth con Google OAuth como acceso principal. El perfil de aplicación se crea o actualiza después del login según el correo/identidad.
7. Si existe una cuenta antigua cuyo correo coincide, asociar sus datos migrados de forma explícita y sin exponer contraseñas antiguas.

## Diseño visual

### Estilos considerados

- Brutalismo editorial: 0.07. Mantiene alto contraste, pero se aleja demasiado del tono amigable actual.
- Dashboard SaaS genérico: 0.06. Es claro, pero borraría la identidad de MemeEnglish.
- Editorial nocturno con acentos coral y tarjetas de aprendizaje: 0.87. Elegido porque coincide con `app.css`, `city-levels.css`, `city-nocturna.css` y el lenguaje visual existente.

### Decisiones del estilo elegido

- **Movimiento:** editorial nocturno / aprendizaje urbano con estaciones de niveles.
- **Principios:** expresivo sin ser infantil, lectura rápida, progreso visible y acciones claras.
- **Paleta:** fondos oscuros para dar profundidad; coral para acciones y energía; crema para lectura; verdes/azules nocturnos para estados y niveles.
- **Layout:** encabezado ligero, hero asimétrico, tarjetas apiladas y navegación inferior en móvil; el panel Admin prioriza secciones plegables y densidad controlada.
- **Firmas visuales:** etiquetas tipo sticker, tarjetas con esquinas suaves y barras de progreso/estaciones de ciudad.
- **Interacción:** microanimaciones cortas, feedback inmediato en respuestas, toast para guardados y confirmaciones antes de operaciones destructivas.
- **Tipografía:** conservar la jerarquía y tamaños del CSS original; usar una sans legible para interfaz y una display contundente para titulares si el asset está disponible.
- **Voz de marca:** directa, cálida y motivadora. Ejemplos: “Una frase. Un meme. Un paso adelante.” y “Suma práctica, desbloquea tu siguiente nivel.”

## Arquitectura

- `src/app`: router, sesión y composición general.
- `src/components`: navegación, tarjetas, modales, toasts, reproductor de voz y elementos compartidos.
- `src/features/learning`: niveles, tarjetas, quiz, progreso y pronunciación.
- `src/features/tutorials`: catálogo, filtros, reproductor y administración de videos.
- `src/features/store`: catálogo, compra, inventario, banners de perfil y administración.
- `src/features/admin`: panel, niveles, tarjetas, usuarios, tutoriales, tienda y auditoría.
- `src/lib/supabase`: cliente, tipos, consultas y funciones RPC.
- `src/styles`: tokens visuales y estilos migrados/adaptados del original.
- `supabase/migrations`: esquema, políticas, funciones, triggers e índices.
- `scripts`: importación/normalización de datos y validaciones sin secretos.
- `public`: manifiesto de rutas, favicon y assets públicos no sensibles.

## Modelo de datos nuevo

Se conservarán las entidades originales: perfiles/usuarios, niveles, tarjetas, resultados de ejercicio, progreso por nivel, progreso general y auditoría. Se añadirán:

- `tutorials`: título, descripción, URL embebible segura, miniatura, nivel, categoría, duración, publicación y orden.
- `store_items`: nombre, descripción, tipo, precio en puntos, imagen, rareza, publicación, stock opcional y metadatos.
- `user_inventory`: usuario, artículo, cantidad/estado y fecha de compra.
- `user_profile_customizations`: banner equipado y preferencias visuales.
- `points_ledger`: movimientos de puntos con tipo, cantidad, referencia idempotente, actor y fecha.
- `point_award_rules`: límites por actividad y reglas configurables por owner.

## Seguridad de puntos y compras

Los puntos no se modificarán con un `UPDATE points = points + ...` desde el navegador. Toda recompensa y compra pasará por funciones PostgreSQL/RPC con `security definer`, permisos mínimos y transacción atómica.

Cada evento premiable tendrá una clave de idempotencia única, por ejemplo usuario + actividad + tarjeta + intento. Si el mismo evento se reenvía, la segunda operación no entrega puntos. Se aplicarán límites diarios y por sesión, validación server-side de respuestas, registro inmutable en `points_ledger`, saldo derivado o reconciliable y bloqueo de compras si el saldo no alcanza. Las operaciones administrativas quedarán auditadas.

## Roles

- `owner`: administra niveles, equipo, tarjetas, tutoriales, artículos, reglas de puntos y auditoría.
- `admin`: administra contenido permitido; no modifica secretos ni reglas críticas.
- `user`: aprende, practica, consulta tutoriales, acumula puntos, compra/equipa recompensas y edita su perfil.

Las políticas RLS limitarán filas y operaciones por `auth.uid()` y rol. Las funciones RPC validarán el actor y el objeto de la operación.

## Google OAuth

Se implementará `signInWithOAuth` para web. La configuración del Client ID, Client Secret, URLs autorizadas y callback se hará en Supabase/Google Cloud cuando el proyecto esté listo para probar. Las credenciales no irán al repositorio ni al código del navegador.

## Publicación

El proyecto se guardará en un repositorio GitHub independiente, preferiblemente privado durante la migración. Se configurará un build reproducible y una publicación web separada. El preview y el build se validarán antes de publicar.

## Límites y decisiones explícitas

- Los videos se almacenarán como URLs de YouTube/Vimeo u otra fuente embebible permitida; no se copiará contenido protegido al Storage sin autorización.
- Google Login no migrará contraseñas antiguas. Los datos históricos se relacionarán por correo cuando sea seguro.
- Los datos SQL se migrarán con scripts revisables y sin imprimir información personal o secretos.
- El sistema de puntos será conservador: si una regla no puede validarse en servidor, no otorgará puntos.
