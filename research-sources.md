# Referencias de configuración

- Supabase Auth rate limits: https://supabase.com/docs/guides/auth/rate-limits
- Supabase Google OAuth: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase social login: https://supabase.com/docs/guides/auth/social-login
- InfinityFree SMTP/PHPMailer: https://forum.infinityfree.com/t/send-mail-with-phpmailer/107015

Notas: el proveedor de correo integrado de Supabase documenta 2 emails por hora por proyecto; Google OAuth evita depender de ese envío para iniciar sesión. El proyecto usa un backend Supabase separado y no reutiliza secretos del ZIP.
