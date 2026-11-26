# 01 · Web actual: cómo está montada

Revisado el 26-11-2026 sobre el repositorio público `github.com/studiobelvi/studiobelvi.github.io`, commit `4c19754` (último push 08-08-2026), y sobre las respuestas HTTP y DNS de `studiobelvi.com`.

## Resumen

- HTML estático escrito a mano, sin framework ni build. 9 páginas, 4.723 líneas en total.
- Alojado en **GitHub Pages** (`server: GitHub.com`, CDN Fastly). El dominio se configura con el fichero `CNAME` (`www.studiobelvi.com`).
- Se edita desde la web de GitHub ("Update index.html", "Add files via upload"): 137 commits entre el 17-05 y el 08-08-2026, todos de la cuenta `studiobelvi`. Revisado el historial completo: no hay claves, tokens ni datos personales más allá del email público de la cuenta.
- Este repo es un clon de la web (remoto `upstream`, push desactivado; `main` = web publicada, trabajo en `prototipo`). Se trabaja sobre el clon, nunca sobre el repo público.
- Coste actual: 0 € de hosting. Dominio en GoDaddy. Correo en Google Workspace (`MX aspmx.l.google.com`).

## Infraestructura y dominio

| Elemento | Valor | Fuente |
|---|---|---|
| Registrador / DNS | GoDaddy (`ns31/ns32.domaincontrol.com`) | `dig NS` |
| `www.studiobelvi.com` | `CNAME studiobelvi.github.io` | `dig CNAME` |
| `studiobelvi.com` (raíz) | 6 registros A: los 4 de GitHub Pages (`185.199.108-111.153`) **y** `76.223.105.230`, `13.248.243.5` | `dig A` |
| Correo | Google Workspace, `hello@studiobelvi.com` | `dig MX`, PDF |

**Problema detectado (dominio raíz).** Las dos IPs que no son de GitHub sirven una página de GoDaddy (HTML con assets de `wsimg.com`, título "studiobelvi.com") con un certificado que no corresponde. Comprobado con `curl --resolve` contra cada IP. Como el navegador elige una IP al azar entre las seis, aproximadamente 1 de cada 3 visitas a `studiobelvi.com` sin `www` verá un error de certificado o la página de GoDaddy en lugar de la web (estimación: 2 de 6 registros; depende de la resolución del cliente). Con `www` funciona siempre.

Arreglo: borrar esos dos registros A en GoDaddy (y desactivar "Forwarding" o el Website Builder de GoDaddy si está activo). No requiere tocar código. Ver [04](04-arquitectura-opciones.md), requisito R-21.

## Páginas

| Página | Qué es | Contenido |
|---|---|---|
| `index.html` | Home de una sola página con anclas | Hero · Portfolio (1 tarjeta) · What we do (3 áreas) · How we can collaborate (3 niveles) · Process (4 pasos) · CTA mailto · footer |
| `portfolio.html` | Proyecto "Once upon a story…" | Texto + 11 fotos `fairytale*.webp` |
| `memorabilia.html` | Galería del área 01 | 12 tarjetas `obj*.webp` con texto al girar |
| `scenography.html` | Galería del área 02 | 6 tarjetas `sceno*.webp` |
| `immersion.html` | Galería del área 03 | 5 tarjetas `imm*.webp` |
| `sparks.html`, `chapters.html`, `universe.html` | Niveles de colaboración | Un título, un párrafo y "How we do it". Sin precio ni lista de qué incluye |
| `faq.html` | 6 preguntas en acordeón | Incluye una respuesta con precios orientativos |

## Estética (lo que hay que respetar)

- Tipografías de Google Fonts: **Cormorant Garamond** (400–700) para títulos, **Inter** (300–600) para texto.
- Paleta en variables CSS (`:root`, idéntica en las 9 páginas):

| Token | Color |
|---|---|
| `--paper` | `#f7f3ee` (fondo) |
| `--bone` | `#e9dfd2` |
| `--ink` | `#1d1a18` (texto) |
| `--espresso` | `#3a2f2a` |
| `--bronze` | `#834C35` |
| `--oxblood` | `#572430` |
| `--taupe` | `#bba4a4` |
| `--soft-shadow` | `0 18px 50px rgba(45,30,25,0.12)` |

- Logo SVG `logo-bone-textoderecha.svg` y `favicon.svg`.
- Componentes: tarjetas numeradas (01/02/03), tarjetas de foto que giran (front/back) con overlay, acordeón de FAQ, botones redondeados, formas decorativas en el hero, aparición al hacer scroll (`.reveal` con `IntersectionObserver`).
- Responsive con breakpoints a 1200, 980, 768 y 640 px.

## Funcionalidades (lo que hay que mantener)

1. **Idiomas EN / ES / CA** con un selector en la barra. Implementación: cada página lleva un diccionario JS con las tres lenguas y sustituye `innerHTML` de los elementos `data-i18n`. La elección se guarda en `localStorage` (`studioBelviLanguage`, por defecto `en`). 111 claves en total.
2. Navegación por anclas en la home y enlaces a las subpáginas.
3. Contacto solo por `mailto:hello@studiobelvi.com`. No hay formulario.
4. Animación de aparición al hacer scroll y giro de tarjetas.

## Limitaciones que condicionan la propuesta

- **CSS y JS copiados en cada página.** Cambiar un color o el menú obliga a editar 9 ficheros.
- **Textos dentro de JavaScript.** Para cambiar un texto hay que editar el diccionario en el idioma correcto dentro de cada HTML. Es frágil para alguien no técnico.
- **SEO e idiomas.** Solo existe una URL por página; Google indexa el inglés. ES y CA no tienen URL propia ni `hreflang`. No hay `meta description`, Open Graph ni sitemap.
- **Imágenes en el repo** (19 MB). `mediterranean-ceremony.jpg` pesa 2,4 MB y no se usa en ninguna página.
- **Sin menú en móvil.** Por debajo de 980 px el CSS oculta `.nav-links` y no hay menú alternativo: en móvil solo se puede hacer scroll, no se llega a FAQ ni a Contact desde la barra.
- Ficheros `mainfile` vacíos en cada carpeta de `assets` (restos de crear carpetas desde la web de GitHub).

## Qué no refleja la web respecto al catálogo nuevo

Detalle en [02](02-catalogo-modelo-de-contenido.md).

- Sparks / Chapters / Universe aparecen como "formas de colaborar", sin precio ni entregables. En el PDF son **tres niveles de Dirección Creativa con precio cerrado** (490 / 950 / 1.850 € IVA incluido).
- **Contradicción de precios:** la FAQ (`answer05`) dice que empiezan en 1.000 €, 5.000 € y 15.000 €. Hay que decidir qué se publica.
- Las **9 familias de Production Packs** (25 packs: The Wedding Paper Suite, The Wedding Signs, etc.) no aparecen en ninguna parte.
