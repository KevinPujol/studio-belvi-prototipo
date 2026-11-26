# 04 · Arquitectura: opciones y solución por requisito

Estado: **decidida la opción A** por Kevin el 26-11-2026. Fuentes: [investigación de opciones](research/options-research.md) (fuentes oficiales consultadas el 26-11-2026; se cita como "INV §n") y la documentación de Sveltia CMS consultada el mismo día para lo que la investigación no cubría. Las estimaciones de esfuerzo son mías y van marcadas como tales.

## Decisión

**Qué hay que decidir:** dónde viven los datos del catálogo y quién pone el back office.
**Quién decide:** Kevin. El tipo de login (GitHub o usuario y contraseña) conviene validarlo con Studio Belvi.

**Decisión: opción A.** Web estática generada con Astro, publicada en GitHub Pages como hoy, con **Sveltia CMS** como back office. El catálogo se guarda en ficheros YAML del propio repo y cada cambio publicado lanza un build de 1 a 2 minutos.

Por qué:
1. **Cubre los 24 requisitos (4 con algún peaje) a 0 €/mes.** C cuesta al menos 20 USD/mes porque Vercel Hobby no permite uso comercial (INV §4). B cabe en el plan gratuito de Sanity, pero añade un servicio externo y un webhook para unos 50 registros (INV §3).
2. **Es la que menos se construye.** El back office se configura, no se programa: unos 2 días frente a 2 o 3 semanas de C (estimación propia, ver [Esfuerzo](#coste-y-esfuerzo)).
3. **La migración es casi nula.** El repo de destino ya es de Studio Belvi (`studiobelvi/studiobelvi.github.io`), la web sigue en GitHub Pages y el dominio no cambia. Solo hay que crear la app OAuth y el Worker de login a su nombre.
4. **Sveltia tiene lo que el catálogo necesita:** traducción por campo con aviso de traducciones que faltan, listas reordenables, conversión de imágenes a WebP, vista previa y flujo de borradores (fuentes en [la tabla por requisito](#solución-por-requisito)).

**Alternativa si no quieren cuentas de GitHub:** misma arquitectura con **Pages CMS** (invitación por email, sin infraestructura), a cambio de modelar cada texto como `{en, es, ca}` a mano y perder el aviso de traducciones que faltan (INV §1).

## Lo que es igual en las tres opciones

La web pública se genera con **Astro 7** en las tres: mismo frontend ([05](05-frontend.md)), mismo modelo de datos ([02](02-catalogo-modelo-de-contenido.md)), mismas URLs (`build.format: 'preserve'` genera `sparks.html` y `es/index.html` para `/es/`, según la referencia de configuración de docs.astro.build, comprobada el 26-11-2026; ES y CA con prefijo `/es/`, `/ca/`, INV §2), mismo formulario (Web3Forms, INV §5) y mismas pruebas con Playwright. Lo único que cambia es **dónde se guardan los datos y quién da el back office**.

| | A · Estática + CMS sobre Git | B · CMS SaaS headless | C · Vercel + Neon + Blob |
|---|---|---|---|
| Datos | YAML en el repo | Sanity (Content Lake) | Postgres en Neon |
| Imágenes | En el repo, WebP al subir | CDN de Sanity | Vercel Blob |
| Back office | Sveltia CMS en `/admin/` (estático) | Sanity Studio (desplegado en `*.sanity.studio`) | Propio, a programar |
| Login | Cuenta GitHub con permiso de escritura, vía Cloudflare Worker OAuth | Cuentas de Sanity | Propio (p. ej. Neon Auth) |
| Hosting web | GitHub Pages | GitHub Pages | Vercel Pro |
| Cómo se publica | Commit → GitHub Actions → Pages | Webhook → Worker → `repository_dispatch` → Actions | Guardar → revalidar o rebuild en Vercel |
| Piezas que mantener | Astro, Sveltia, 1 Worker | Astro, Studio, 1 Worker, cuenta Sanity | Astro, back office, auth, BD, Blob, cuenta Vercel |

## Solución por requisito

✓ lo cubre · ◐ lo cubre con un peaje · ✗ no lo cubre. "Común" = frontend Astro, igual en las tres.

| ID | Prio | A · Estática + Sveltia | B · Sanity | C · Vercel + Neon + Blob |
|---|---|---|---|---|
| R-01 Catálogo completo | M | ✓ Común. Familias y packs en YAML validados con esquema Zod al construir | ✓ Común. Datos leídos de Sanity con GROQ al construir | ✓ Común. Datos leídos de Neon al construir |
| R-02 Oferta en home y subpáginas | M | ✓ Común | ✓ Común | ✓ Común |
| R-03 Estética actual | M | ✓ Común | ✓ Común | ✓ Común |
| R-04 Idiomas, anclas, galerías, FAQ, contacto | M | ✓ Común | ✓ Común | ✓ Común |
| R-05 Responsive, no PWA | M | ✓ Común | ✓ Común | ✓ Común |
| R-06 Dominio y URLs | M | ✓ Mismo hosting y dominio | ✓ Mismo hosting y dominio | ◐ Hay que repuntar el DNS a Vercel |
| R-07 Precios generados desde datos | M | ✓ Común (`PriceTag`). El objeto `price` es un campo estructurado en el CMS | ✓ Igual, como objeto en el esquema | ✓ Igual, como columnas |
| R-08 URL por idioma, SEO | S | ✓ Común (i18n de Astro con prefijos, INV §2) | ✓ Común | ✓ Común |
| R-09 Formulario a hello@ | S | ✓ Web3Forms | ✓ Web3Forms | ✓ Web3Forms o función propia |
| R-10 Imágenes optimizadas | S | ◐ Sveltia convierte a WebP y limita tamaño al subir (INV §1). Para `srcset` de Astro las imágenes deben estar en `src/`; que Sveltia guarde ahí **no está verificado** (su doc solo pone `/public` para Astro, docs/media/internal). Si no, WebP de un tamaño + carga diferida | ✓ CDN de imágenes de Sanity con redimensionado por URL | ✓ Variantes generadas al subir o en el build |
| R-11 Descargar PDF | C | ✓ PDF actual en el repo | ✓ Igual | ✓ Igual |
| R-12 Edición sin código | M | ✓ Formularios por colección | ✓ Formularios de Studio | ◐ Lo que se programe |
| R-13 Subir y ordenar imágenes | M | ✓ Biblioteca de medios; listas reordenables arrastrando (INV §1) | ✓ | ◐ A programar (subida, orden, borrado) |
| R-14 Ocultar, ordenar, destacar | M | ✓ Campos `visible`, `featured`; orden por arrastre en listas | ✓ | ◐ A programar |
| R-15 Acceso con cuentas individuales | M | ◐ Cada persona necesita **su propia** cuenta GitHub con escritura en el repo (hoy usan la cuenta compartida `studiobelvi`, [01](01-web-actual-ingenieria-inversa.md)). Usuario y contraseña sin GitHub existe (*Sveltia CMS Additions*) pero es experimental (INV §1) | ✓ Hasta 20 asientos (INV §3) | ◐ Auth propia a programar |
| R-16 Tres idiomas y traducciones que faltan | S | ✓ i18n por campo; "If there are any errors or missing translations, they will be indicated in the switcher" (sveltiacms.app/en/docs/ui/content-editor) | ✓ Locales ilimitados (INV §3); el aviso depende del plugin (no verificado) | ◐ A programar |
| R-17 Previsualizar y deshacer | S | ◐ Panel de vista previa con plantillas propias (`registerPreviewTemplate`) y flujo Borrador → En revisión → Listo con GitHub (docs/workflows/editorial). El historial muestra commits y diffs, pero **no hay botón de restaurar** una versión guardada (docs/ui/content-editor): deshacer es reeditar o un `git revert` de Kevin | ◐ Borradores e historial en Studio; la vista previa de la página real necesita montaje extra (no verificado) | ◐ A programar (versiones en tabla) |
| R-18 Cambio visible en minutos | S | ✓ Build de Actions, 1-2 min (estimación propia) | ✓ Igual, tras el webhook | ✓ Segundos con revalidación |
| R-19 Coste ≈ 0 € | M | ✓ 0 € | ✓ 0 € dentro de Free. La página de precios presenta Free como "For individuals experimenting or shipping smaller projects" y no prohíbe el uso comercial; los términos no los he revisado | ✗ Mínimo 20 USD/mes (Vercel Pro, INV §4) |
| R-20 Migrar sin rehacer | M | ✓ El repo destino ya es suyo; 1-2 h | ◐ Mover proyecto Sanity o exportar e importar el dataset; 3-4 h | ◐ Transferir Vercel y Neon, copiar Blob y **reescribir todas las URLs de imagen** (incluyen el store); ~1 día |
| R-21 Dominio raíz | M | ✓ Borrar 2 registros A en GoDaddy (INV §8). Fuera de código | ✓ Igual | ◐ Igual, y repuntar a Vercel |
| R-22 Playwright | M | ✓ Común | ✓ Común | ✓ Común |
| R-23 Mantenimiento bajo | S | ◐ Pocas piezas, pero Sveltia está en 0.x y saca releases casi a diario (INV §1): fijar versión y actualizar a propósito | ◐ Studio con sus dependencias + Worker | ✗ Back office, auth, BD y facturación propios |
| R-24 RGPD | S | ✓ Común: `privacy.html`, Web3Forms como encargado en EE. UU. (INV §5), sin cookies de seguimiento. El `localStorage` del idioma es técnico (interpretación propia, no asesoría legal) | ✓ Común; Sanity también trata datos del equipo | ✓ Común |

**Resumen:** A cubre todo, con cuatro peajes que no bloquean: R-15 (una cuenta GitHub por persona), R-17 (sin botón de restaurar), R-10 (`srcset` por verificar) y R-23 (Sveltia en 0.x). B empata en funcionalidad y gana en imágenes, pero pierde en piezas y en certeza sobre el uso comercial gratuito. C es la única que incumple un imprescindible (R-19) y la que más hay que construir.

## Coste y esfuerzo

| | A | B | C |
|---|---|---|---|
| Coste mensual | **0 €** (GitHub Pages, Cloudflare Worker Free, Web3Forms Free) | 0 € en Free; siguiente plan 15 USD/asiento/mes (INV §3) | **≥ 20 USD/mes** (Vercel Pro, 1 asiento de desarrollador; Neon Free y Blob dentro del crédito incluido, INV §4) |
| Coste fijo que ya pagan | Dominio en GoDaddy y Google Workspace, igual en las tres | | |
| Back office (estimación propia) | ~2 días: configurar colecciones, Worker OAuth, plantillas de vista previa | ~3-4 días: esquemas, Studio, consulta GROQ, webhook | ~10-15 días: login, formularios de 7 entidades con 3 idiomas, subidas, borradores, versiones |
| Migración a sus cuentas (estimación propia) | 1-2 h | 3-4 h | ~1 día |

El frontend ([05](05-frontend.md)) cuesta lo mismo en las tres y no está en esta tabla.

## Migración a las cuentas de Studio Belvi

**A (recomendada).** El prototipo vive en un repo de Kevin con su propia app OAuth y su Worker. Para pasar a producción, con permiso expreso de Kevin y de Studio Belvi:
1. Studio Belvi da escritura a Kevin en `studiobelvi/studiobelvi.github.io` (o Kevin les pasa la rama y la suben ellas).
2. Se sube el código a una rama, se revisa y se fusiona en `main`.
3. En Settings > Pages, el origen pasa de "rama" a **GitHub Actions** (INV §2). Desde ese momento ya no se edita HTML a mano en GitHub, solo por el CMS.
4. Se crea la app OAuth de GitHub a nombre de `studiobelvi` y el Worker de Sveltia en una cuenta Cloudflare suya. Identificadores en variables de entorno del Worker y en `admin/config.yml` (sin nada atado a Kevin).
5. Se invita a cada editora con su cuenta GitHub personal.
6. Se borran los 2 registros A de GoDaddy (R-21), si no se ha hecho ya.

**B.** Lo anterior, más mover el proyecto de Sanity a su organización o exportar e importar el dataset, recrear el token de lectura y el webhook (no verificado en esta sesión).

**C.** Transferir el proyecto de Vercel y el de Neon (o `pg_dump` y restaurar), crear un Blob store suyo, copiar los objetos y reescribir en la BD las URLs de imagen (inferencia: las URLs públicas de Blob llevan el identificador del store), recrear variables de entorno, repuntar DNS y poner su tarjeta en Vercel Pro.

## Si se elige C: reparto entre Neon y Blob

Regla: **Neon guarda todo lo que se consulta o se edita como dato; Blob guarda solo binarios.** La web pública no consulta Neon en cada visita: se genera al publicar, así que el arranque en frío de Neon (INV §4) solo afecta al back office.

| Neon (Postgres) | Vercel Blob |
|---|---|
| `line`, `family`, `pack`, `extra`, `comparison_row`, `condition`: las entidades de [02](02-catalogo-modelo-de-contenido.md) | Imagen original subida |
| Textos traducibles como `jsonb` `{es, en, ca}` (o tabla `translation` si se quiere listar lo que falta con SQL) | Variantes redimensionadas (p. ej. 640, 1280, 2400 px en WebP) |
| `price` en columnas: `amount`, `kind`, `vat_mode`, `unit` | El PDF del catálogo (R-11) |
| `asset`: URL de Blob, `alt` i18n, ancho, alto, punto focal, orden, a qué familia o pack pertenece | |
| `app_user` y sesiones (o Neon Auth), `revision` con el JSON anterior de cada cambio para deshacer (R-17), `publish_log` | |

Volumen esperado (estimación propia): unos 50 registros de catálogo y 100-200 imágenes. Cabe de sobra en Neon Free (1 GB) y Blob dentro de los límites de Hobby o del crédito de Pro (INV §4).

## Supuestos y riesgos de la recomendación

- **Supuesto:** las editoras aceptan crear una cuenta GitHub personal cada una. Si no, Pages CMS (email) o Sveltia Additions (experimental).
- **Supuesto:** un retraso de 1-2 minutos entre publicar y verlo en la web es aceptable.
- **Riesgo:** GitHub Pages prohíbe usarlo para "run your online business"; una web escaparate sin pagos es zona gris (INV §7). Si se quiere eliminar la duda, el mismo build se publica en Cloudflare Pages o Workers sin cambiar el código (INV §6).
- **Riesgo:** Sveltia en 0.x. Mitigación: versión fijada, y como lee la configuración de Decap, Decap es la salida si Sveltia se abandona (INV §1).
- **Abierto:** si Sveltia puede guardar imágenes en `src/` para el `srcset` de Astro (R-10). Se verifica en el prototipo.
- Web3Forms bloquea los navegadores automáticos sin ventana (protección anti-bots); los visitantes reales no se ven afectados. Por eso las pruebas automáticas no envían el formulario.

## Comprobaciones con Playwright (26-11-2026)

Hechas con el MCP de Playwright del repo (Chromium headless). Aún no hay prototipo que probar: se comprobó lo que estas specs dan por hecho sobre la web actual y lo que la investigación marcaba como "no verificado".

**Web actual (`www.studiobelvi.com`).** Todo coincide con [01](01-web-actual-ingenieria-inversa.md):

| Comprobación | Resultado |
|---|---|
| Las 9 páginas responden | 200 en todas |
| SEO | Sin `meta description`, sin Open Graph, sin `hreflang`, `sitemap.xml` da 404, `lang="en"` fijo |
| Móvil a 360 y 390 px | `.nav-links` oculto y sin botón de menú: no se llega a FAQ desde la barra. Sin scroll horizontal. El selector de idioma sí se ve |
| Idioma | El `<select id="language-switcher">` cambia los textos ("WHAT WE DO" → "¿QUÉ HACEMOS?"), guarda `studioBelviLanguage = es` y la FAQ abre en español |
| Precios de la FAQ | "costs start at 1,000 euros for Story Sparks, 5,000 for Story Chapters, and 15,000 for Story Universe" (incoherencia 1 de [02](02-catalogo-modelo-de-contenido.md)) |
| Contacto | Un único `mailto:hello@studiobelvi.com`, solo en `index.html`. Ningún formulario |

**Fuentes "no verificado" de la investigación:**

| Punto | Resultado |
|---|---|
| Web3Forms, 250 envíos/mes (INV §5) | `web3forms.com/pricing` devuelve 403 al navegador automático, pero la portada, abierta en Chrome normal, dice "250 submissions/month free, forever. No credit card required." **Confirmado** (26-11-2026). Envío real de prueba desde el prototipo: `success: true` |
| Definición de uso comercial en la guía de uso justo de Vercel (INV §4) | La página carga, pero no contiene la palabra "commercial". Sigue sin verificar ahí; la prohibición en Hobby ya está en los Términos (INV §4), así que la conclusión no cambia |
| Uso comercial en Sanity Free (INV §3) | Ver R-19 en la tabla: la página de precios no lo prohíbe |
| `build.format` de Astro (afirmación de esta spec) | Confirmado en la doc oficial (`'file' \| 'directory' \| 'preserve'`); el prototipo usa `'preserve'` |

No se pudo probar con Playwright el dominio raíz (`studiobelvi.com` sin `www`): el navegador elige una IP y no se puede forzar cuál. Lo que dice INV §8 sale de `dig` y `curl --resolve`.
