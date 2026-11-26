# studiobelvi.com: opciones para catálogo editable con back office (investigación)

Fecha de comprobación de todas las fuentes: **2026-11-26** (salvo que se indique otra). Las fechas de release salen de la API de GitHub (`gh api repos/<repo>/releases`) y de `npm view`, consultadas ese mismo día.
"No verificado" = no lo he podido confirmar en una página oficial.

## Resumen y recomendación (propuesta)

| Pregunta | Recomendación |
|---|---|
| 1. CMS Git | **Sveltia CMS** (i18n nativo por campo, relaciones, conversión a WebP, gratis; requiere un Cloudflare Worker gratuito para el login OAuth con GitHub) o **Pages CMS** (cero infraestructura, login con GitHub o invitación por email, gratis; pero sin i18n nativo: hay que modelar campos por idioma a mano). |
| 2. Generador | **Astro 7** (actual: 7.4.13) con salida estática, content collections con esquema Zod + `reference()`, i18n `/es/` `/ca/`, desplegado con `withastro/action` a GitHub Pages. |
| 3. SaaS headless | Solo **Sanity Free** encaja (locales ilimitados, 20 asientos, 2 webhooks). Storyblok, Contentful y Hygraph limitan a **2 locales** en el plan gratuito y necesitamos 3. Todos requieren webhook de rebuild. No recomendado frente a un CMS Git. |
| 4. Vercel | **Sorpresa: Hobby es solo para uso personal o no comercial** según los Términos. Una web de negocio debería ir en Pro (20 USD/mes por asiento de desarrollador). Descarta la arquitectura Vercel+Neon+Blob a coste 0 de forma limpia. |
| 5. Formulario | **Web3Forms** (250 envíos/mes gratis según fuentes secundarias, no almacena envíos, hCaptcha gratis; servidores en EE. UU.) o un **Google Form** del Workspace que ya pagan si se prefiere tener los datos en Google. Formspree y Basin: solo 50 envíos/mes gratis. |
| 6. Hosts alternativos | **Cloudflare** (Pages o Workers static assets): peticiones a estáticos gratis e ilimitadas, sin cláusula no comercial encontrada. Netlify Free: 300 créditos/mes con tope duro. |
| 7. GitHub Pages | 1 GB por sitio, 100 GB/mes de ancho de banda (blando). Prohíbe usarlo para "run your online business, e-commerce site" o sitios "primarily directed at facilitating commercial transactions". Una web escaparate sin transacciones es zona gris (interpretación propia). |
| 8. DNS | Las IPs 76.223.105.230 y 13.248.243.5 sirven una página **"Próximo lanzamiento" de GoDaddy Website Builder**. Hay que borrar esos dos A y dejar solo los 4 A de GitHub (+ 4 AAAA opcionales). Ahora mismo una parte de las visitas ve la página de GoDaddy. |

**Supuestos de los que depende la recomendación:** las dueñas aceptan un login con GitHub (ya tienen cuenta); el catálogo cabe en ficheros YAML/JSON/Markdown del repo; un rebuild de 1-2 minutos tras guardar es aceptable.
**Qué podría fallar:** Sveltia está en 0.x (cambia casi a diario); la cláusula comercial de GitHub Pages es ambigua; Web3Forms trata datos en EE. UU.

---

## 1. CMS basados en Git

### Comparativa

| | Pages CMS | Decap CMS | Sveltia CMS | TinaCMS | Keystatic | CloudCannon |
|---|---|---|---|---|---|---|
| Coste | 100% gratis (hosted, Vercel o self-host) | Gratis (OSS); Decap Turbo Free = 1 sitio, 1 asiento; Pro 19 €/mes | Gratis (MIT) | TinaCloud Free: 2 usuarios | Gratis en modo GitHub; Keystatic Cloud Free: 3 usuarios/equipo | Sin plan gratis; Standard 49-55 USD/mes |
| Login editores | GitHub, o **invitación por email** (colaboradores sin cuenta GitHub) | GitHub con push al repo | GitHub con write; o usuario/contraseña con *Sveltia CMS Additions* | Credenciales TinaCloud | GitHub con write (modo GitHub); sin GitHub con Keystatic Cloud | Usuarios CloudCannon |
| Infra extra fuera de Netlify | Ninguna con app.pagescms.org | Servidor OAuth propio o Decap Turbo | Cloudflare Worker gratis (Sveltia CMS Authenticator) o token personal | TinaCloud (SaaS) o backend propio | **Servidor Node** (adapter Astro): no vale para GitHub Pages puro | Su propio hosting/editor |
| i18n por campo | **No nativo** (issue #398 abierto) | Sí (`i18n: true/duplicate`) | Sí, el más completo (switcher, traducción con IA) | No verificado | No verificado | No verificado |
| Imágenes | Carpeta del repo | Carpeta del repo | Carpeta del repo, con conversión opcional a WebP y redimensionado | Repo por defecto o proveedor externo | Repo; Cloud Images es Pro | No verificado |
| Relaciones | Campo `reference` (simple o múltiple) | Campo relation (no verificado en esta sesión) | Campo `relation` (simple o múltiple, reordenable) | No verificado | No verificado | No verificado |
| Último release | 2.1.8 (2026-06-08); último push 2026-10-16 | 3.18.0 (2026-11-18) | v0.273.1 (2026-11-25); aún 0.x | tinacms 3.15.2 (2026-11-09) | @keystatic/core 0.6.10 (2026-11-17) | n/a (SaaS) |

### Detalle y fuentes

**Pages CMS**
- "100% free, whether you want to use the online version" en app.pagescms.org, desplegarlo en Vercel o self-host. Solo soporta GitHub. Fuente: https://pagescms.org/ (2026-11-26).
- Edita los ficheros del repo directamente, sin base de datos de contenido; configuración en `.pages.yml`. Fuente: https://pagescms.org/docs/ (2026-11-26).
- Colaboradores: "Collaborators are invited by email", pensado para quien "does not have a GitHub account". No pueden tocar `.pages.yml` ni gestionar colaboradores. Por defecto sus commits van con la identidad de la GitHub App. Los colaboradores viven en la base de datos de la instancia, no en el repo. Fuente: https://pagescms.org/docs/configuration/collaborators/ (2026-11-26).
- Release 2.1.7 (2026-06-04) simplificó el login de invitados con OTP por email. Fuente: https://github.com/pages-cms/pages-cms/releases (2026-11-26).
- Campo `reference`: `collection`, `multiple`, `min`/`max`, `search`, `value`/`label`. Fuente: https://pagescms.org/docs/configuration/fields/reference/ (2026-11-26).
- Media en carpeta del repo (`input`/`output`), filtro de extensiones, renombrado. No menciona límite de tamaño ni almacenamiento externo. Fuente: https://pagescms.org/docs/configuration/media/ (2026-11-26).
- `list: true` repite campos (min/max/collapsible). La doc no dice si se puede reordenar por arrastre (**no verificado**). Fuente: https://pagescms.org/docs/configuration/content/list/ (2026-11-26).
- i18n: no aparece en la doc. Issues abiertos #398 "Adding multi language availability" (2026-05-29) y #405 (i18n de la UI). Fuente: API de issues de GitHub (2026-11-26). Workaround: un objeto por campo traducible con claves `en`/`es`/`ca`, o una colección por idioma.

**Decap CMS**
- Backend GitHub: "requires a server for authentication"; Netlify lo da hecho. "All users must have push access to your content repository". Alternativa: Decap Turbo. Fuente: https://decapcms.org/docs/github-backend/ (2026-11-26).
- Decap Turbo: auth hospedada, "no auth server or OAuth app for you to run". Free 0 € = 1 sitio y **1 asiento**; Pro 19 €/mes = 1 sitio y 5 asientos. La página no dice si permite login sin GitHub. Fuente: https://decapcms.org/turbo/ (2026-11-26). Con dos dueñas, el Free de Turbo no basta.
- i18n: estructuras `multiple_folders`, `multiple_files`, `single_file`; campo `i18n: true` o `duplicate`. Fuente: https://decapcms.org/docs/i18n/ (2026-11-26).

**Sveltia CMS** (sustituto compatible con la configuración de Decap)
- Fuera de Netlify, el flujo OAuth necesita un cliente: Sveltia CMS Authenticator (Cloudflare Workers), un cliente de terceros para Decap, o Netlify. También se puede entrar con token personal (recomendado solo para desarrolladores). Requiere cuenta GitHub con write, salvo con *Sveltia CMS Additions*. Fuente: https://sveltiacms.app/en/docs/backends/github (2026-11-26).
- Sveltia CMS Additions: gratis, MIT, en Cloudflare Worker (plan Free), añade roles, login con usuario y contraseña sin GitHub, bloqueos y comentarios. Requiere Sveltia ≥ v0.271.0. Fuente: https://sveltiacms.app/en/docs/additions (2026-11-26). Es muy reciente (inferencia por el requisito de versión): tratar como experimental.
- i18n: global, por colección y por campo (`i18n: true`/`duplicate`, también dentro de listas y objetos), selector de idioma en el editor, traducción con IA opcional. Fuente: https://sveltiacms.app/en/docs/i18n (2026-11-26).
- Campo `relation`: `collection`, `value_field`, `display_fields`, `search_fields`, `multiple`; los elementos se reordenan arrastrando. Fuente: https://sveltiacms.app/en/docs/fields/relation (2026-11-26).
- Imágenes en `media_folder` del repo; conversión opcional a WebP, límites de ancho/alto, calidad 85 por defecto. Fuente: https://sveltiacms.app/en/docs/media/internal (2026-11-26).
- Actividad: 3 releases el 2026-11-25, sigue en 0.x. Fuente: https://github.com/sveltia/sveltia-cms/releases (2026-11-26).

**TinaCMS**
- TinaCloud Free: 0 USD, 2 usuarios, 3 roles, 100 GB/mes de ancho de banda, "For trying TinaCMS". Team: 24 USD/proyecto/mes. La página no menciona locales. Fuente: https://tina.io/pricing (2026-11-26).
- Media en el repo por defecto, o un proveedor externo (no ambos). Fuente: https://tina.io/docs/reference/media/overview (2026-11-26).
- Cómo se invitan editores y si requiere GitHub: **no verificado** (la doc de usuarios no lo explica).

**Keystatic**
- Modo GitHub: GitHub App propia; los colaboradores necesitan write en el repo; "Make sure the host can run Node.js for Keystatic's API routes". Fuente: https://keystatic.com/docs/github-mode (2026-11-26).
- Con Astro: "Keystatic needs to run serverside code", hace falta un adapter. Fuente: https://keystatic.com/docs/installation-astro (2026-11-26). Conclusión (inferencia): no funciona en GitHub Pages puro.
- Keystatic Cloud: gratis hasta 3 usuarios por equipo, editores sin cuenta GitHub; Pro desde 10 USD/mes; Cloud Images es Pro. Fuente: https://keystatic.com/docs/cloud (2026-11-26).

**CloudCannon**
- Sin plan gratuito, prueba de 21 días. Standard 49 USD/mes (anual) o 55 USD/mes, 3 usuarios. Fuente: https://cloudcannon.com/pricing/ (2026-11-26). Descartado por presupuesto.

### Recomendación para este caso (propuesta)

1. **Sveltia CMS + Cloudflare Worker para OAuth.** Es el que mejor cubre el modelo: i18n por campo para EN/ES/CA, packs relacionados con familias, listas reordenables, WebP automático, todo en el repo. Coste 0 €. Riesgo: versión 0.x y un Worker que mantener (pequeño).
2. **Pages CMS hosted.** Cero infraestructura y la UI más sencilla para no técnicos, invitaciones por email. Coste 0 €. Peaje: sin i18n nativo, así que cada campo traducible se modela como objeto `{en, es, ca}`; funciona, pero el formulario se alarga. Dependencia de un servicio gratuito mantenido básicamente por una persona (inferencia por el repo).

Descartados: Keystatic (necesita servidor), CloudCannon (de pago), Decap (OAuth propio o Turbo de pago para 2 asientos), TinaCMS (más pesado, 2 usuarios en Free, i18n no verificado).

## 2. Astro

- Versión actual: **astro 7.4.13** (2026-11-18). Fuente: `npm view astro` y https://github.com/withastro/astro/releases (2026-11-26).
- Despliegue a GitHub Pages: workflow `.github/workflows/deploy.yml` con `actions/checkout@v7`, `withastro/action@v6` y `actions/deploy-pages@v5`; permisos `contents: read`, `pages: write`, `id-token: write`; en Settings > Pages elegir **GitHub Actions** como origen. Fuente: https://docs.astro.build/en/guides/deploy/github/ (2026-11-26).
- Dominio propio: `public/CNAME` con el dominio, `site: 'https://studiobelvi.com'` y sin `base`. Como el repo se llama `studiobelvi.github.io`, tampoco haría falta `base` sin dominio. Misma fuente.
- Gotchas del despliegue (misma fuente): hay que commitear el lockfile (la action detecta el gestor de paquetes por él); Node 24 por defecto; variables públicas en `env:` del workflow.
- Content collections: `src/content.config.ts`, `defineCollection()` con `loader` obligatorio (`glob()` para muchos ficheros, `file()` para un fichero con varias entradas; soporta Markdown, MDX, JSON, YAML, TOML), esquema con `z` de `astro/zod` (Zod 4), relaciones con `reference("collection")` resueltas con `getEntry()`/`getEntries()`. El orden de `getCollection()` no es determinista: hay que ordenar a mano (relevante para el orden de packs). Fuente: https://docs.astro.build/en/guides/content-collections/ (2026-11-26).
- i18n: `locales`, `defaultLocale`, `prefixDefaultLocale` (por defecto `false`), `fallback`, `getRelativeLocaleUrl()`. Cada locale necesita su carpeta en `src/pages/`. Las rutas de locale personalizadas y `domains` requieren `output: "server"`; con salida estática hay que quedarse con prefijos simples (`/es/`, `/ca/`). Fuente: https://docs.astro.build/en/guides/internationalization/ (2026-11-26).

**Gotchas a tener en cuenta (inferencia propia, salvo cita):**
- Pasar del diccionario JS en cliente a rutas `/es/` y `/ca/` cambia URLs. GitHub Pages no tiene redirecciones de servidor: si hay enlaces o SEO que mantener, hacen falta páginas con meta refresh.
- Imágenes subidas por el CMS a `public/` no pasan por la optimización de Astro (solo las importadas desde `src/`). O se suben ya en WebP (Sveltia lo hace) o el CMS apunta a `src/assets`.
- Al cambiar Pages de "rama" a "GitHub Actions", el contenido del repo deja de ser HTML editable directamente: las dueñas pasan a editar solo vía CMS.
- `prefixDefaultLocale: false` deja inglés en `/` y 404 en rutas sin traducir salvo `fallback`.

## 3. CMS headless SaaS (plan gratuito)

| | Sanity Free | Storyblok Starter | Contentful Free | Hygraph Hobby |
|---|---|---|---|---|
| Usuarios | 20 asientos, 2 roles | 1 (máx. 2) | 10, 2 roles | 3 |
| Locales | **Ilimitados** | **2** | **2** | **2** |
| Registros | 10k documentos | 20.000 stories | 10.000 records, 25 tipos | 1.000 entradas (los assets cuentan) |
| Assets | 100 GB, 100 GB/mes | 2.000 assets, 100 GB/mes | 50 MB por asset, 50 GB/mes | 50 MB por asset, 100 GB tráfico |
| API | 250k/mes (1M CDN) | 100k/mes | 100k/mes, tope sin excedentes | 500k operaciones |
| Uso comercial | No dice | "testing and personal projects" | "learning and exploring" | "personal projects" |
| Siguiente plan | Growth 15 USD/asiento/mes | Growth 99 USD/mes | Lite 300 €/mes | Growth 199 USD/mes |

Fuentes (2026-11-26): https://www.sanity.io/pricing y https://www.sanity.io/pricing.md (incluye 2 webhooks GROQ en Free); https://www.storyblok.com/pricing; https://www.contentful.com/pricing/; https://hygraph.com/pricing.

- **Rebuild:** con un sitio estático en GitHub Pages, cualquier SaaS necesita que un webhook dispare el workflow de GitHub Actions (`repository_dispatch`). GitHub no acepta el webhook del CMS tal cual sin un token y un formato concreto, así que en la práctica hace falta un pequeño intermediario (Worker o función). Inferencia propia; no verificado para cada proveedor.
- Storyblok, Contentful y Hygraph se quedan cortos por los **2 locales** (necesitamos EN/ES/CA) y su Free está planteado para pruebas o uso personal.
- Sanity encaja en límites, pero añade una dependencia externa, un webhook y un Studio que desplegar, para un catálogo de unos 50 registros. Un CMS Git es más simple.

## 4. Vercel y Neon

- **Uso comercial en Hobby: no permitido.** Términos de Vercel: "You shall only use the Services under a Hobby plan for your personal or non-commercial use." Fuente: https://vercel.com/legal/terms (2026-11-26).
- Definición de uso comercial citada en el foro de Vercel: "any Deployment that is used for the purpose of financial gain of anyone involved in any part of the production of the project". Fuente: https://community.vercel.com/t/question-about-commercial-usage/23321 (2026-11-26). **No verificado** en la página oficial actual (las secciones de ejemplos de https://vercel.com/docs/limits/fair-use-guidelines no se renderizaron). Una web de un estudio que vende servicios encaja en esa definición (interpretación propia).
- Hobby (gratis): 100 GB Fast Data Transfer, 1M invocaciones, 4 h CPU activa, 100 deploys/día; al pasarse, se espera 30 días. Fuente: https://vercel.com/docs/plans/hobby (actualizada 2026-11-12, consultada 2026-11-26).
- Pro: 20 USD/mes, cada asiento de desarrollador 20 USD/mes, asientos viewer gratis, incluye 20 USD de crédito de uso. Fuente: https://vercel.com/pricing y https://vercel.com/docs/plans/hobby (2026-11-26).
- **Vercel Blob**, incluido en Hobby: 1 GB/mes de almacenamiento, 10.000 operaciones simples, 2.000 avanzadas, 10 GB de transferencia. Pasado el límite en Hobby no se cobra pero se bloquea 30 días. Precios de ejemplo (iad1): 0,023 USD/GB almacenamiento, 0,40 USD/1M ops simples, 5 USD/1M avanzadas, 0,05 USD/GB transferencia. Navegar el store desde el dashboard cuenta como operaciones avanzadas. Fuente: https://vercel.com/docs/vercel-blob/usage-and-pricing (actualizada 2026-09-23, consultada 2026-11-26).
- **Neon Free:** 100 proyectos, 1 GB por proyecto (20 GB en total), 100 CU-horas por proyecto, 5 GB de egress por proyecto, scale-to-zero a los 5 minutos sin poder desactivarlo. Plan Launch: 0,106 USD/CU-hora y 0,35 USD/GB-mes, sin mínimo mensual. Fuente: https://neon.com/pricing (2026-11-26).
- Arranque en frío de Neon: reactiva "within a few hundred milliseconds". Fuente: https://neon.com/docs/introduction/scale-to-zero (2026-11-26).

Conclusión: la pila Vite+React+Vercel functions+Neon+Blob técnicamente cabe en los límites gratuitos, pero el Hobby de Vercel no permite uso comercial. Hacerlo bien cuesta al menos 20 USD/mes (Pro). Además obliga a construir y mantener un back office propio (login, CRUD, subidas).

## 5. Formulario de contacto sin backend

| | Web3Forms | Formspree | Basin | Google Forms |
|---|---|---|---|---|
| Free | 250 envíos/mes, formularios ilimitados (**no verificado en página oficial**: devuelve 403) | 50 envíos/mes, formularios ilimitados | 1 endpoint, 50 envíos/mes, 30 días de retención | Incluido en Workspace (límites no verificados) |
| Antispam | Firewall y filtro propio; hCaptcha gratis; reCAPTCHA/Turnstile es Pro; honeypot "NOT RECOMMENDED" | Formshield básico, reCAPTCHA propio | Básico | El de Google |
| Datos | "We do not store any form submissions"; servidores en US-East; "We are not based on Europe" | Procesa en EE. UU.; la política no menciona DPA ni mecanismo de transferencia | Enlaza páginas de GDPR y DPA (no revisadas) | En el Workspace de la empresa |
| Siguiente plan | Pro ~12-18 USD/mes (fuentes secundarias, no verificado) | Personal 10-15 USD/mes | Starter 12,50 USD/mes (anual) | n/a |

Fuentes (2026-11-26): Web3Forms FAQ https://docs.web3forms.com/getting-started/faq.md, índice de docs https://docs.web3forms.com/llms.txt, cifra de 250/mes por búsqueda web (https://web3forms.com/pricing bloqueó la descarga con 403); Formspree https://formspree.io/plans y https://formspree.io/legal/privacy-policy/; Basin https://usebasin.com/pricing.

Notas RGPD (inferencia, no asesoría legal): con cualquier servicio de EE. UU. hay que mencionarlo en la política de privacidad como encargado del tratamiento y transferencia internacional. Web3Forms no guarda los envíos (solo los reenvía por email), lo que reduce exposición. Google Forms deja los datos dentro del Workspace que ya tienen contratado, con su DPA (**no verificado** en esta sesión). Netlify Forms no aplica (hosting en GitHub Pages).

## 6. Hosts alternativos

- **Cloudflare Pages (Free):** 500 builds/mes, 1 build concurrente, hasta 20.000 ficheros por sitio, 25 MiB por fichero, 100 dominios por proyecto. Fuente: https://developers.cloudflare.com/pages/platform/limits/ (2026-11-26).
- **Cloudflare Workers static assets:** "Requests to static assets are free and unlimited." Fuente: https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/ (2026-11-26).
- Uso comercial en Cloudflare: no encontré cláusula de uso no comercial (búsqueda de texto en https://www.cloudflare.com/website-terms/, 2026-11-26). **No verificado** en los términos de servicio de pago/autoservicio.
- **Netlify Free:** 300 créditos/mes con tope duro y sin recarga; ancho de banda a 20 créditos/GB, cada deploy de producción 15 créditos. Personal: 9 USD/mes. Fuentes: https://www.netlify.com/pricing/ y https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/ (2026-11-26). Con 300 créditos salen unos 20 deploys al mes si no hay tráfico (cálculo propio: 300/15); cada guardado del CMS es un deploy, así que se puede quedar corto. Uso comercial: no encontré cláusula no comercial en https://www.netlify.com/legal/terms-of-use/ (búsqueda de texto, **no verificado** a fondo).

## 7. GitHub Pages

- Límites: sitio publicado ≤ 1 GB, repo recomendado ≤ 1 GB, 100 GB/mes de ancho de banda (límite blando), 10 builds/hora (no aplica si se publica con un workflow propio de Actions), timeout de 10 minutos por deploy. Fuente: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits (2026-11-26). El sitio actual (19 MB) está muy lejos.
- Uso comercial, cita literal: "GitHub Pages is not intended for or allowed to be used as a free web-hosting service to run your online business, e-commerce site, or any other website that is primarily directed at either facilitating commercial transactions or providing commercial software as a service (SaaS)." Misma fuente.
- Interpretación propia: la web de Belvi es un escaparate sin pagos ni reservas online, así que no está "primarily directed at facilitating commercial transactions", pero "run your online business" es ambiguo. Riesgo bajo pero real. Si se quiere eliminar la duda, Cloudflare es la alternativa gratuita con el mismo flujo (build desde el repo).

## 8. Dominio y DNS (GoDaddy)

Estado actual (consulta `dig` del 2026-11-26): el apex `studiobelvi.com` tiene 6 registros A: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (GitHub Pages), más `76.223.105.230` y `13.248.243.5`. `www` es CNAME a `studiobelvi.github.io`. Nameservers `ns31/ns32.domaincontrol.com` (GoDaddy).

**Qué son las dos IPs extra** (comprobación propia, 2026-11-26):
- Ambas son de Amazon (whois: `Amazon.com, Inc.` y `Amazon Technologies Inc.`), con reverse DNS `a16e665f42988324c.awsglobalaccelerator.com` (AWS Global Accelerator).
- Al pedirles `studiobelvi.com` responden con cabecera `Server: DPS/2.0.0`, CSP que permite `godaddy.com`, recursos de `img1.wsimg.com/.../website-builder-data-prod/` y un HTML con el texto "Próximo lanzamiento", un formulario "Contact Us" y "Copyright © 2026 studiobelvi.com".
- Conclusión: es la página **"coming soon" del GoDaddy Website Builder** (Websites + Marketing) asociada al dominio. No encontré una página oficial de GoDaddy que liste esas IPs (**no verificado en fuente oficial**; la identificación sale de la respuesta del propio servidor).
- Efecto (inferencia): el navegador elige uno de los 6 A, así que una parte de las visitas puede ver la página de GoDaddy en lugar de la web real. También puede interferir con la emisión del certificado HTTPS de GitHub Pages.

**Configuración correcta** (fuente: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site, 2026-11-26):
1. Borrar los A `76.223.105.230` y `13.248.243.5` (y desactivar/desvincular el sitio de Website Builder en GoDaddy para que no los vuelva a crear; esto último es inferencia).
2. Dejar solo los 4 A: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
3. Opcional, AAAA: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` (GitHub recomienda tener A además de AAAA).
4. `www` CNAME a `studiobelvi.github.io` (ya está).
5. Verificar el dominio en GitHub (recomendado contra secuestros de dominio) y no usar registros comodín `*`. "If your DNS provider automatically sets a default record, remove it before continuing."
6. No tocar los registros MX/TXT de Google Workspace.

## Abierto

- Límites de Google Forms y DPA de Workspace: no verificados.
- Cifra oficial de Web3Forms (250/mes): la página oficial bloquea la descarga automática.
- i18n y relaciones en TinaCMS, Keystatic y CloudCannon: no verificados (descartados por otros motivos).
- Decap Turbo: si permite login sin GitHub, no verificado.
