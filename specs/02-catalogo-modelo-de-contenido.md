# 02 · Catálogo: contenido y modelo de datos

Fuente: los dos PDFs de Studio Belvi en `specs/source/` (exportados de PowerPoint, 960×540). El texto extraído está en `creative-direction.txt` y `production-packs.txt`. Las citas "CD p.N" y "PP p.N" son la página del PDF.

El modelo de abajo es el mismo sea cual sea el almacenamiento (ficheros en Git o Postgres en Neon, ver [04](04-arquitectura-opciones.md)).

## Qué contiene el catálogo

### A. Dirección creativa (CD, 12 páginas)

Tres niveles con precio cerrado, **IVA incluido**:

| Nivel | Lema | Precio | Guía | Reunión inicial | Fuente |
|---|---|---|---|---|---|
| Story Sparks | A spark that sets the story in motion. | 490 € | ~6 págs. | 45 min | CD p.4–5 |
| Story Chapters | Every detail tells part of the story. | 950 € | ~15 págs. | 60 min | CD p.6–7 |
| Story Universe | A world of your own. | 1.850 € | ~25 págs. | 90 min | CD p.8–9 |

Cada nivel tiene: descripción, "Ideal para", lista de lo que incluye (9–14 puntos).
Además: tabla comparativa de 10 filas (CD p.10) y "Expand your story" con 4 servicios de acompañamiento (CD p.11): sesión de 60 min 90 €, revisión de propuestas desde 150 €, acompañamiento mensual desde 250 €/mes, supervisión presencial con presupuesto.

### B. Production Packs (PP, 44 páginas)

9 familias, 25 packs. Precios "desde", **IVA no incluido**, calculados para una boda de hasta 80 invitados (PP p.5).

| Familia | Desde | Packs (precio desde) | Extras | Fuente |
|---|---|---|---|---|
| The Wedding Paper Suite | 750 € | The Invitation 750 · The Day-of 850 · The Full Suite 1.450 · The Signature Suite 2.050 | 9 ampliaciones | PP p.5–10 |
| The Wedding Signs | 950 € | The Essentials 950 · The Installation 1.750 | 3 piezas adicionales, 5 ampliaciones | PP p.11–14 |
| The Photo Moment | 500 € | The Frame 500 · The Scene 1.550 · The Experience 2.500 | 6 ampliaciones | PP p.15–19 |
| The Guest Experience | 3.000 € | Un pack con tres bloques: The Gift + The Table + The Game | 1 ampliación | PP p.20–21 |
| The Ceremony Moment | 1.500 € | The Vows 1.500 · The Altar 2.400 · The Ceremony Experience 3.500 | 3 ampliaciones (The Words 250, Ritual 250, Montaje) | PP p.22–26 |
| Our Dearest People | 1.200 € | Un pack; cajas en formato Essentials Box o Signature Box | 5 ampliaciones sin precio | PP p.27–28 |
| The Couple's Memories | 550 € | Shadowbox 550 · Artwork 350 · Bouquet Keepsake 450 · Wedding Objects 250 | 3 colecciones combinadas (550 / 850 / 1.350) | PP p.29–34 |
| The Interactive Wedding | 500 € | The Mingle 500 · The Game 500 · The After 500 | Combinaciones 2 = 900, 3 = 1.300; 8 ampliaciones | PP p.35–39 |
| The Couple Details | — | Hair Atelier 250 · Jewelry Studio 250 · Couple Accessories 180 · Bedazzling the Couple 350 | Piezas para familiares | PP p.40–41 |

Comunes a todo el catálogo: tabla de tipos de ampliación More / Custom / Immersive (PP p.42) y 3 condiciones generales (PP p.43).

## Modelo de datos

Entidades y campos. `i18n` = un valor por idioma (es, en, ca).

**Line** (línea de servicio): `creative-direction` | `production-packs`. Lleva título, intro y `vat_mode` por defecto.

**Family**
- `slug`, `line`, `order`, `visible`
- `name` (los nombres en inglés se mantienen en los tres idiomas, como en el PDF), `tagline` i18n, `intro` i18n
- `price_from`, `vat_mode` (`included` | `excluded`)
- `area`: `memorabilia` | `scenography` | `immersion` (para enlazar con las secciones actuales de la web)
- `common_inclusions` i18n[] ("Incluye en todos los niveles")
- `notes` i18n[] (p. ej. "precios orientados a una boda de hasta 80 invitados")
- `cover_image`, `gallery[]`

**Pack**
- `slug`, `family`, `order`, `number` ("01."), `visible`, `featured` (para la home)
- `name`, `tagline` i18n, `description` i18n, `ideal_for` i18n (solo dirección creativa)
- `price`: `{ amount, kind: from | fixed | quote, vat_mode, unit? }`. `unit` cubre "€/mes", "€/unidad", "€/pieza".
- `inclusion_groups[]`: `{ title? i18n, items i18n[] }`. Un grupo sin título para la mayoría; tres grupos para The Guest Experience (Gift / Table / Game).
- `possibilities` i18n[] (Artwork, Wedding Objects, The After)
- `images[]`

**Extra** (ampliaciones, piezas adicionales, combinaciones, acompañamiento)
- `scope`: `family` (con `family`) | `global`
- `kind`: `addon` | `additional_piece` | `combo` | `support`
- `label` i18n, `description` i18n?, `price` (mismo objeto que Pack; `kind: quote` para "presupuesto según…")

**ComparisonTable** (solo dirección creativa): filas con `label` i18n y un valor por nivel (`✓`, `—` o texto como "Básica / Completa / Extensa").

**Condition**: `order`, `text` i18n.

**Asset** (imagen): `url`, `alt` i18n, `width`, `height`, `focal_point?`.

Formato de precio en pantalla: `Desde 750 € + IVA`, `490 € IVA incluido`, `Presupuesto personalizado`. El sistema compone el texto a partir de `price`; nadie escribe el precio a mano en una frase.

## Encaje con la web actual (propuesta, pendiente de validar)

Inferencia mía a partir de los textos de las secciones actuales:

| Sección actual | Familias que encajan |
|---|---|
| 01 memorabilia ("mementos", detalles simbólicos) | Paper Suite, Our Dearest People, Couple's Memories, Couple Details |
| 02 scenography (espacios, arco, altar, photo booth) | Wedding Signs, Photo Moment, Ceremony Moment |
| 03 immersion (juegos, bingo, búsqueda del tesoro) | Interactive Wedding, Guest Experience |

The Guest Experience mezcla las tres áreas (regalo, centros de mesa, juego). La pongo en immersion por el peso del juego.

Sparks / Chapters / Universe pasan de "formas de colaborar" a "niveles de dirección creativa", que es lo que dice el PDF.

## Incoherencias a resolver con Studio Belvi antes de publicar

1. **Precios de Sparks / Chapters / Universe.** La FAQ actual (`faq.html`, `answer05`) dice desde 1.000 / 5.000 / 15.000 €. El PDF dice 490 / 950 / 1.850 € IVA incluido. Posible lectura: la FAQ hablaba del proyecto completo y el PDF solo de la dirección creativa. Hay que reescribir la respuesta.
2. **IVA mixto.** Dirección creativa con IVA incluido; packs sin IVA. Sin indicación en: combinaciones de Interactive Wedding, colecciones combinadas de Couple's Memories, Couple Details y "Expand your story". Hay que confirmar cada uno.
3. **The Couple's Memories "desde 550 €"** pero Artwork (350 €) y Wedding Objects (250 €) son más baratos. ¿El "desde" de la familia debería ser 250 €?
4. **"The Game"** es a la vez un bloque de The Guest Experience y un pack de The Interactive Wedding, con alcances distintos. En la web conviene distinguirlos.
5. **"The Essentials"** es un pack de Wedding Signs y también un formato de caja de Our Dearest People.
6. **Idiomas.** El PDF está solo en castellano (con nombres en inglés). La web es EN / ES / CA: faltan las traducciones al inglés y al catalán. Propuesta: traducción asistida y revisión por ellos.
7. **Imágenes.** El PDF tiene fotos por familia; hay que decidir si se reutilizan las de los PDF, las de las galerías actuales o fotos nuevas.
