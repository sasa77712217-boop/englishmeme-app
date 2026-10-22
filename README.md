# EnglishMeme

Migración independiente de la aplicación MemeEnglish original a React + TypeScript + Supabase. El diseño conserva el tono editorial nocturno, las tarjetas con memes, los niveles y la pronunciación por voz del navegador, pero reemplaza el backend PHP/MySQL de InfinityFree por un esquema PostgreSQL seguro.

## Stack

- React 19, TypeScript y Vite.
- Supabase Auth, PostgreSQL, Row Level Security y funciones RPC `security definer`.
- Google OAuth como flujo de acceso principal.
- Web Speech API para escuchar la pronunciación.
- CSS responsive con tema nocturno y modo claro.

## Ejecutar

```bash
npm install
cp .env.example .env.local
# completar VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

El proyecto de Supabase separado se llama `EnglishMeme`. La clave publicable puede estar en variables `VITE_*`; nunca se debe colocar una clave service-role en el navegador ni en GitHub.

## Datos migrados

Las migraciones de `supabase/migrations/` crean niveles, tarjetas, perfiles, progreso, resultados, tutoriales, tienda, inventario, personalización, auditoría y ledger de puntos. La importación histórica ya fue aplicada en Supabase: 9 niveles, 38 tarjetas, 11 cuentas de compatibilidad, 6 avances por nivel y 69 respuestas. Los hashes de contraseña y tokens de verificación antiguos no se migran.

Cuando un usuario entre con Google, el trigger `handle_new_user` busca una cuenta histórica por correo y conserva su rol, puntos y racha. La asociación solo se hace por coincidencia exacta de correo.

## Seguridad de puntos

El cliente no actualiza saldos. `award_points`, `submit_quiz_answer`, `purchase_store_item` y `equip_profile_item` ejecutan las operaciones sensibles dentro de PostgreSQL. El ledger usa una clave de idempotencia por usuario y evento, y las reglas tienen límites diarios.

## Google OAuth — paso pendiente de configuración

El código ya llama a `signInWithOAuth({ provider: 'google' })`, pero Google requiere un Client ID y Client Secret pertenecientes a la cuenta del propietario. En Supabase se debe habilitar el proveedor Google, colocar esas credenciales, registrar la callback URL que muestra Supabase y añadir la URL publicada y la URL de preview a Redirect URLs. Es la única parte que no se puede completar sin acceso a Google Cloud o sin que el propietario proporcione esas credenciales.

## Publicación

El repositorio canónico es `sasa77712217-boop/englishmeme-app`. El build estático usa `npm ci && npm run build`, publica `dist` y tiene fallback SPA para las rutas declaradas en `public/manus-routes.json`.
