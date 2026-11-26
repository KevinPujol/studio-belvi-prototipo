# Specs · Studio Belvi

Estado a 26-11-2026: specs completas; arquitectura decidida: opción A (Kevin, 26-11-2026).

| Spec | Estado |
|---|---|
| [01 · Web actual](01-web-actual-ingenieria-inversa.md) | Hecha |
| [02 · Catálogo y modelo de datos](02-catalogo-modelo-de-contenido.md) | Hecha; 7 incoherencias para Studio Belvi |
| [03 · Requisitos](03-requisitos.md) | Hecha (R-01 a R-24) |
| [Investigación de opciones](research/options-research.md) | Hecha 26-11-2026, fuentes oficiales con fecha |
| [04 · Arquitectura: opciones y solución por requisito](04-arquitectura-opciones.md) | **Decidida: opción A** (Astro + Sveltia CMS en GitHub Pages), 26-11-2026 |
| [05 · Frontend](05-frontend.md) | Hecha (propuesta) |
| [06 · Back office](06-backoffice.md) | Propuesta para la opción A; preguntas abiertas para Studio Belvi |
| Prototipo | Construido en local (rama `prototipo`, sin commit): 21 páginas × 3 idiomas, catálogo en ES/EN/CA, FAQ en borrador, panel Sveltia probado de punta a punta en local, formulario enviando con Web3Forms, 138 pruebas Playwright en verde. Falta crear el repo del prototipo |

## Decisiones abiertas

1. ~~¿Hace falta Vercel + Neon?~~ **Decidido el 26-11-2026: no, opción A** ([04](04-arquitectura-opciones.md)). Opciones comparadas: (A) web estática en GitHub Pages + back office que guarda en Git (CMS tipo Pages CMS / Decap / Sveltia / Keystatic / Tina), (B) CMS SaaS headless, (C) Vercel + Neon (datos) + Vercel Blob (imágenes) con back office propio, como en Atlas. Vercel Hobby no permite uso comercial (C cuesta ≥ 20 USD/mes).
   - Subdecisión: ¿las editoras aceptan cuenta GitHub personal? Si no, Pages CMS o Sveltia Additions. Más preguntas abiertas en [06](06-backoffice.md#abierto).
2. Qué precios publica Studio Belvi (FAQ 1.000 / 5.000 / 15.000 € frente a PDF 490 / 950 / 1.850 €) y las demás incoherencias de 02.
3. Cuentas: prototipo en las de Kevin; destino final en las de Studio Belvi. Necesitaremos acceso de escritura al repo público o que lo transfieran.

## Fuera de código, urgente

Borrar en GoDaddy los registros A `76.223.105.230` y `13.248.243.5` del dominio raíz (ver 01). Lo hace quien tenga acceso a GoDaddy.
