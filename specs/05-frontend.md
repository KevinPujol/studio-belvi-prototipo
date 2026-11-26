# 05 · Frontend: qué va en la web

Propuesta de contenido y pantallas. No depende de dónde se guarden los datos ([04](04-arquitectura-opciones.md)): las páginas se generan a partir del modelo de [02](02-catalogo-modelo-de-contenido.md).

## Principios

- **Extender, no rediseñar.** Se reutilizan los tokens de color, las tipografías y los componentes de [01](01-web-actual-ingenieria-inversa.md). Lo nuevo (tarjetas de pack, precios, tabla comparativa) se dibuja con ese mismo lenguaje.
- **La oferta a un clic desde cualquier página**: entrada "Packs" en el menú y bloque de oferta en la home.
- **Mismas URLs.** Las páginas actuales conservan su nombre (`sparks.html`, `faq.html`…) en inglés. Español y catalán cuelgan de `/es/` y `/ca/` con los mismos nombres. GitHub Pages no tiene redirecciones de servidor, así que no cambiar las URLs evita romper enlaces compartidos.
- **Responsive sin PWA.** Diseño desde 360 px de ancho. Sin service worker ni manifest.

## Mapa del sitio

| URL (EN; ES y CA bajo `/es/`, `/ca/`) | Estado | Contenido |
|---|---|---|
| `/` | Ampliada | Hero · **Nuestra oferta** (nuevo) · Portfolio · What we do · Process · Contacto |
| `creative-direction.html` | Nueva | Los 3 niveles lado a lado, tabla comparativa, "Expand your story" |
| `sparks.html`, `chapters.html`, `universe.html` | Reescritas | Lema, descripción, "Ideal para", qué incluye, precio, CTA |
| `packs.html` | Nueva | Las 9 familias, filtrables por área (memorabilia / scenography / immersion) |
| `packs/<familia>.html` (9) | Nuevas | Intro, "incluye en todos los niveles", un bloque por pack, ampliaciones, condiciones |
| `memorabilia.html`, `scenography.html`, `immersion.html` | Ampliadas | Galería actual + "Packs de esta área" con tarjetas de familia |
| `portfolio.html` | Igual | Sin cambios de contenido |
| `faq.html` | Revisada | Respuesta de precios reescrita (incoherencia 1 de [02](02-catalogo-modelo-de-contenido.md)) |
| `privacy.html` | Nueva | Aviso legal y privacidad, necesario si hay formulario (R-24) |

## Home: bloque "Nuestra oferta"

Va justo después del hero, para que la oferta se vea al entrar (R-02).

1. **Dirección creativa**: tres tarjetas numeradas 01 / 02 / 03 (el mismo estilo que las actuales de "How we can collaborate"), cada una con lema, 3 puntos clave y precio ("490 € IVA incluido"). Enlace a la comparativa.
2. **Production packs**: rejilla de las familias marcadas como destacadas (por defecto las 9) con foto, nombre y "Desde X € + IVA". En móvil, una columna; en escritorio, tres.
3. Nota de condiciones en una línea con enlace ("Precios desde. Transporte y montaje según proyecto.").

La sección actual "How we can collaborate" se fusiona con el punto 1 para no repetir Sparks / Chapters / Universe dos veces.

## Componentes nuevos

| Componente | Comportamiento |
|---|---|
| `PriceTag` | Compone el texto desde `price` (`Desde 750 € + IVA`, `490 € IVA incluido`, `250 €/mes`, `Presupuesto personalizado`) en el idioma activo. Formato de número español (`1.450 €`) en ES y CA, inglés (`€1,450`) en EN. |
| `FamilyCard` | Foto, nombre, lema, precio desde. Reutiliza el giro de `portfolio-card` en escritorio; en móvil, sin giro (el giro en táctil confunde), con el texto debajo. |
| `PackBlock` | Número, nombre, precio, descripción y lista "Incluye". En móvil, la lista va plegada en acordeón (mismo estilo que la FAQ). |
| `ExtrasList` | Ampliaciones con su precio o "presupuesto según…". |
| `ComparisonTable` | Tabla de 3 columnas en escritorio. En móvil, se convierte en una tarjeta por nivel (no scroll horizontal). |
| `InterestButton` | "Me interesa" en cada pack y nivel: abre el formulario de contacto con el pack ya elegido. |
| `MobileMenu` | Menú desplegable en móvil (hoy no existe: ver [01](01-web-actual-ingenieria-inversa.md)). |
| `LanguageSwitcher` | Mismo aspecto. Ahora navega a la misma página en el otro idioma y sigue guardando la elección en `localStorage` (`studioBelviLanguage`, la misma clave, para respetar la preferencia de quien ya visitó la web). |

## Contacto (R-09)

Formulario corto: nombre, email, fecha aproximada de la boda, número de invitados, qué interesa (multiselección rellenada por `InterestButton`), mensaje, casilla de privacidad. Envío a `hello@studiobelvi.com` mediante el servicio elegido en [04](04-arquitectura-opciones.md). El botón mailto actual se mantiene.

## Pruebas (R-05, R-22)

Playwright con cuatro perfiles: iPhone (WebKit), Pixel (Chromium), escritorio Chromium y escritorio WebKit/Firefox. Comprobaciones mínimas: cada página carga en los tres idiomas, sin scroll horizontal a 360 px, el menú móvil abre, el selector de idioma conserva la página, todos los precios del catálogo aparecen igual que en los datos, el formulario valida.
