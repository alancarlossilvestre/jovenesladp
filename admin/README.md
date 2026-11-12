# Panel de administración MNJ

Sistema independiente del sitio. Gestiona el **hero** (imágenes, textos, descripción y colores), los **eventos** (con botón «Inscribirse»), los **recursos** (videos, archivos) y recibe las **inscripciones**. El sitio lo consume por una API pública de solo lectura.

Node 22.13+ sin dependencias externas (usa `node:sqlite`).

```sh
npm start          # http://127.0.0.1:8787/admin
npm test           # pruebas de la API
npm run seed       # contenido de muestra (solo en tablas vacías; también corre al iniciar)
```

La primera vez se crea `admin/.env` con `ADMIN_PASSWORD` y `SESSION_SECRET` aleatorios: ahí está tu contraseña.

## Eventos e inscripciones

Al crear un evento, el modo predeterminado es **Google Forms (enlace externo)**. Publica el formulario en Google y pega su enlace **para responder** (`https://forms.gle/...` o `https://docs.google.com/forms/.../viewform`), no el enlace de edición. Activa **Mostrar “Inscribirse”** para habilitar el botón de la web.

El botón abre Forms en otra pestaña. Las respuestas se consultan en Forms y, si lo vinculas, en una hoja privada de Sheets; **no llegan a este panel**. Desactiva el resumen público de resultados, limita el acceso a la hoja y explica a los participantes el uso de sus datos. Si hay aprobación o cupos, el mensaje de Forms debe decir “Solicitud recibida”, no prometer una plaza.

Los eventos existentes conservan el **Formulario del sitio**, con sus inscripciones anteriores. Puedes cambiar cada evento de modo; no se borran inscripciones al cambiarlo. Los eventos en modo externo rechazan nuevos envíos a la API interna.

## Recursos públicos y restringidos

Los recursos nuevos proponen **Restringido mediante Google Drive**. Pega el enlace del archivo o carpeta y, opcionalmente, un Google Form para **Solicitar acceso**.

**Debes configurar los permisos en Drive:** “Acceso general: Restringido”, correos autorizados o grupo administrado por el ministerio como lectores, permitiendo descargar. Elegir “Restringido” en el panel **no cambia ni verifica los permisos de Google**. La solicitud de acceso tampoco autoriza automáticamente: se revisa en Forms y se concede el permiso manualmente en Drive.

La web muestra el catálogo y abre Drive con **Acceder al material**. Drive comprueba la cuenta del visitante. Título, descripción y vista previa siguen siendo públicos; no incluyas ahí material confidencial. Una copia descargada puede reenviarse y no desaparece al revocar el acceso.

En modo restringido no se ofrece la subida local ni se publican los campos de video/descarga pública. **Cambiar de modo no elimina ni privatiza archivos ya subidos:** retira sus copias de `data/uploads` o del proveedor donde estén alojadas si ya no deben ser públicas. No se borran automáticamente porque podrían estar en uso en otros contenidos.

Los recursos existentes conservan el modo **Público**. Ese modo permite los enlaces de video y archivos habituales. No necesitas configurar almacenamiento de videos en este servidor si usas Drive.

## Orden de eventos y recursos

**1 = primero, 2 = segundo**, etc. Los nuevos elementos se proponen al final; puedes poner 1 para insertarlos al principio. Al mover o eliminar uno, las demás posiciones se ajustan automáticamente, sin empates ni huecos. El orden incluye borradores, aunque la web solo muestra los publicados.

Al iniciar el servidor actualizado, se normalizan los órdenes antiguos desde cero conservando la secuencia existente, los contenidos y las inscripciones. La migración se ejecuta una sola vez.

## Conexión con el sitio

| Dirección | Quién | Qué |
|---|---|---|
| `GET /api/v1/content` | sitio (al compilar) | hero, eventos y recursos **publicados** (contrato `version: 1`) |
| `POST /api/v1/registrations` | navegador del visitante | solo eventos con formulario del sitio; exige `Origin` autorizado, UUID del cliente (idempotente), consentimiento, límite de 10/min por IP y campo trampa |
| `/admin/api/*` | panel | requiere sesión (cookie HttpOnly, SameSite=Strict) |
| `/media/*` | todos | imágenes, videos y archivos subidos |

En desarrollo, inicia el panel y ejecuta `npm.cmd run dev` en otra terminal, desde la raíz. `.env.development` apunta al panel local; después de guardar, recarga la web.

Para compilar contra el panel en PowerShell, desde la raíz:

```powershell
$env:PUBLIC_ADMIN_API_URL='http://127.0.0.1:8787'
npm.cmd run build
```

Sin la variable, la compilación usa el contenido local. Si el panel no responde durante la compilación, también cae al contenido local.

Los cambios se ven en el sitio al **volver a compilarlo**. Define `REBUILD_WEBHOOK_URL` (p. ej. un deploy hook de Cloudflare Pages) para que el panel lo dispare solo, 5 s después del último cambio.

## Variables (`admin/.env`)

`PORT`, `HOST`, `PUBLIC_URL`, `ALLOWED_ORIGINS` (orígenes del sitio, separados por coma), `DB_PATH`, `UPLOAD_DIR`, `MAX_UPLOAD_MB`, `REBUILD_WEBHOOK_URL`.

## Cambiar de proveedor después

- **Base de datos**: todo el SQL está en `src/db.mjs`. Para PostgreSQL (Neon, Supabase, RDS…) se reimplementa ese módulo con la misma interfaz.
- **Archivos**: `src/storage.mjs` (`put` / `serve`). Para R2, S3 o Bunny basta otra implementación; las URLs públicas pasan a ser las del CDN.
- **Videos pesados**: usa YouTube/Vimeo/Cloudflare Stream y pega el enlace en el recurso en vez de subir el archivo.

## Antes de producción

HTTPS (`PUBLIC_URL` con https activa cookie `Secure`), proxy que fije límites, copias de seguridad de la base y `data/uploads`, Turnstile/captcha en el formulario, y revisión legal de datos personales (Ley 29733, posibles menores de edad).
