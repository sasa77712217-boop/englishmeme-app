# Activar Google OAuth

1. En Google Cloud Console, crea o selecciona un proyecto y configura la pantalla de consentimiento OAuth.
2. Crea un OAuth Client ID de tipo Web application.
3. En Supabase Dashboard → Authentication → Providers → Google, habilita Google y pega Client ID y Client Secret.
4. Copia desde esa pantalla la URL exacta de callback de Supabase y agrégala como Authorized redirect URI en Google Cloud.
5. Agrega el dominio publicado de EnglishMeme y el dominio de Preview como Authorized JavaScript origins cuando Google lo solicite.
6. En Supabase Authentication → URL Configuration, define Site URL con la URL pública y agrega como Redirect URLs la URL pública más `/profile` y la URL de Preview más `/profile`.
7. Prueba una cuenta nueva y una cuenta cuyo correo exista en `legacy_accounts`; el trigger asignará el rol y restaurará puntos solo para coincidencias exactas.

No se deben committear Client Secrets, service-role keys ni credenciales de Google. El frontend solo contiene la llamada al proveedor y usa la clave publicable de Supabase.
