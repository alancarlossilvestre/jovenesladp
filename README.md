# Ministerio Nacional de Jóvenes · Demo frontend

Propuesta visual en Astro (islas de React), TypeScript y Tailwind CSS. La página se pre-renderiza como HTML estático y `App` se hidrata como isla (`client:load`); el diseño es idéntico al de la versión SPA anterior. El contenido dinámico (hero, eventos, recursos e inscripciones) viene del sistema independiente de `admin/` (ver `admin/README.md`); sin él, el sitio usa su contenido local de muestra. Las imágenes, fuentes e iconos locales se sirven desde `public/`.

## Dirección visual

Dirección editorial de festival juvenil, siguiendo `premium-frontend-ui`: azul eléctrico, titulares de gran escala, fotografías recortadas, naranja como acento y texturas discretas. La portada combina el carrusel con tipografía animada por palabras, una órbita gráfica y fotografía con parallax. Los ministerios tienen tarjetas fotográficas asimétricas, los eventos mantienen su acabado de ticket y los recursos se presentan como publicaciones de colores contrastantes. Se conservan los espacios del logotipo oficial y las advertencias de contenido ilustrativo.

La entrada visual se retira al estar listas las fuentes y la imagen principal, sin bloquear los controles. GSAP y ScrollTrigger coordinan las apariciones escalonadas, el parallax y una galería que convierte el scroll vertical en un recorrido horizontal fijado en escritorio. La galería conserva una cuadrícula normal en pantallas pequeñas, dispositivos táctiles o con movimiento reducido; el teclado lleva cada fotografía enfocada a la vista. Los botones principales responden sutilmente al cursor y la galería incorpora un indicador flotante, sin sustituir el cursor del sistema. El menú de escritorio muestra vistas previas fotográficas al pasar el cursor o enfocar sus enlaces.

## Desarrollo

Requiere Node.js 22.12+ (Astro 6, Vite 7). El código de los componentes no debe tocar `window`/`document` durante el render (solo en efectos), porque se ejecuta también en el servidor.

```sh
npm install
npm run dev
```

En Windows, si PowerShell restringe los scripts de npm, utilizar `npm.cmd` en lugar de `npm`.

```sh
npm run build
npm run lint
npm test
npm run preview
```

## Personalizar

- `src/data/content.ts`: navegación, carrusel, identidad, ministerios, eventos, recursos y galería, incluidas las fotografías de ministerios y los titulares visuales `posterLines` de los eventos. Los eventos, áreas y recursos son ilustrativos, no una agenda o estructura institucional confirmada.
- `src/components/ui.tsx`: el componente `LogoPlaceholder` reserva el espacio para el logotipo oficial. Sustituir su contenido con el archivo autorizado, conservando su proporción y `object-fit: contain`. El espacio en escritorio amplio es de 280 × 90 px.
- `src/index.css`: tipografía local y colores de marca.
- `src/experience.css`: composición, capas visuales y adaptaciones responsive.
- `src/components/MotionExperience.tsx`: secuencia de entrada y animaciones GSAP, con limpieza de efectos y adaptación a las preferencias de movimiento.
- `src/components/ContactForm.tsx`: formulario de demostración. Valida los campos en el navegador, pero no envía, persiste ni comparte información.
- `public/images`: fotografías referenciales, no fotografías del ministerio. Reemplazarlas por material institucional autorizado antes de publicar el sitio definitivo.

El carrusel cambia automáticamente cada 3,5 segundos, incluso con el cursor encima. La navegación manual con el ratón reinicia ese intervalo sin detener la reproducción. El botón permite pausar y reanudar; al navegar por el carrusel con teclado se pausa hasta pulsar reproducir. La preferencia de movimiento reducido desactiva la reproducción automática y las animaciones. Los eventos y recursos abren vistas de detalle; la galería permite ampliar las fotografías. Las ventanas usan el elemento nativo `dialog`, con cierre mediante Escape y gestión de foco del navegador.

La navegación se desliza fuera de la pantalla al bajar y reaparece al subir, sin modificar la posición del contenido. Permanece visible cerca del inicio, al recibir foco de teclado y mientras el menú móvil está abierto. Los desplazamientos mínimos no cambian su estado para evitar parpadeos; la transición respeta la preferencia de movimiento reducido.

Las estadísticas permanecen sin cifras hasta disponer de datos verificados. No se han agregado direcciones, teléfonos, correos ni perfiles sociales institucionales no confirmados. El formulario y las redes sociales están identificados como demostrativos o pendientes.

## Fotografías

Fotografías de muestra obtenidas de Unsplash bajo su [licencia de uso](https://unsplash.com/license), descargadas para no depender de un servicio de imágenes durante la navegación:

| Archivo | Fotografía de origen |
| --- | --- |
| `worship.jpg` | https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b |
| `community.jpg` | https://images.unsplash.com/photo-1529156069898-49953e39b3ac |
| `leadership.jpg` | https://images.unsplash.com/photo-1475721027785-f74eccf877e2 |
| `friends.jpg` | https://images.unsplash.com/photo-1517486808906-6ca8b3f04846 |
| `team.jpg` | https://images.unsplash.com/photo-1519389950473-47ba0277781c |

No se afirma que las personas de estas imágenes pertenezcan a la organización. La foto de portada es referencial y no documenta una actividad de adoración del ministerio.

## Pruebas de interacción

`npm test` compila el sitio, lo sirve con `astro preview` y ejecuta las pruebas de Playwright en Microsoft Edge instalado localmente (esperan a que la isla se hidrate). Para usar otro navegador Chromium, cambiar `channel` en `playwright.config.ts`.

Las pruebas cubren adaptación entre 320 y 1440 px, imágenes locales, menú móvil, carrusel y movimiento reducido, vistas de detalle, restauración del foco, galería y formulario sin envío de datos. Las animaciones intensas no se ejecutan con movimiento reducido, y los efectos del cursor solo se habilitan con un puntero preciso. Las capturas se generan en `test-results`, carpeta excluida del control de versiones.

Las pruebas del panel también verifican la publicación de enlaces de Forms, acceso mediante Drive y orden desde 1 hasta la web. Usan una base temporal y simulan la navegación externa, sin modificar datos del panel real ni enviar datos a Google. Las pruebas de API y migración se ejecutan con `npm.cmd --prefix admin test`.

## Panel y servicios externos

`src/lib/site-content.ts` lee la API pública del panel al renderizar con Astro. En desarrollo se usa `.env.development`; al compilar, configura `PUBLIC_ADMIN_API_URL` y vuelve a compilar después de publicar cambios.

Los eventos pueden abrir Google Forms o conservar el formulario del sitio. Los recursos pueden ser públicos o abrir Drive restringido; los permisos se gestionan en Drive y las respuestas externas en Forms/Sheets, no en el panel. Consulta las instrucciones en `admin/README.md`.
