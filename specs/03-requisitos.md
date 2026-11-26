# 03 · Requisitos

Origen: petición de Kevin del 26-11-2026, la web actual ([01](01-web-actual-ingenieria-inversa.md)) y el catálogo ([02](02-catalogo-modelo-de-contenido.md)). Cómo se resuelve cada uno: [04](04-arquitectura-opciones.md).

Prioridad: **M** = imprescindible para salir, **S** = conviene, **C** = más adelante.

## Web pública

| ID | Requisito | Prio |
|---|---|---|
| R-01 | Mostrar el catálogo completo: 3 niveles de dirección creativa y 9 familias / 25 packs, con precio, qué incluye, ampliaciones, tabla comparativa y condiciones. Sustituye al PDF. | M |
| R-02 | La oferta se ve desde la home (resumen con precios "desde" y enlaces) y en las subpáginas (Sparks / Chapters / Universe y las 3 áreas). | M |
| R-03 | Respetar la estética actual: paleta, tipografías, logo, tarjetas numeradas, tarjetas que giran, acordeón, animación al hacer scroll. | M |
| R-04 | Mantener las funcionalidades actuales: selector EN / ES / CA que recuerda la elección, navegación por anclas, galerías, FAQ, contacto. | M |
| R-05 | Responsive: móvil (iOS Safari, Android Chrome) y escritorio (Chrome, Safari, Firefox, Edge). **No PWA**: sin service worker, sin manifest de instalación, sin modo offline. | M |
| R-06 | Mantener el dominio `studiobelvi.com` y las URLs actuales (`sparks.html`, `faq.html`…) o redirigirlas. | M |
| R-07 | Precios mostrados de forma coherente: "Desde X € + IVA" o "X € IVA incluido", generados desde los datos. | M |
| R-08 | Cada idioma con URL propia (`/es/…`, `/ca/…`) para que Google indexe los tres. Metadatos básicos (title, description, Open Graph, sitemap). | S |
| R-09 | Contacto con un formulario que llegue a `hello@studiobelvi.com`, indicando qué pack o nivel interesa. Mantener también el mailto. | S |
| R-10 | Imágenes optimizadas (tamaños responsive, carga diferida) para que el móvil vaya rápido. | S |
| R-11 | Permitir descargar el catálogo en PDF (el actual o uno generado). | C |

## Back office

| ID | Requisito | Prio |
|---|---|---|
| R-12 | El equipo de Studio Belvi (perfil no técnico) edita sin tocar código: precios, textos, lo que incluye cada pack, ampliaciones, condiciones, FAQ. | M |
| R-13 | Subir, cambiar y ordenar imágenes de cada familia, pack y galería. | M |
| R-14 | Ocultar / mostrar un pack o familia, cambiar el orden, marcar packs destacados en la home. | M |
| R-15 | Acceso restringido a las personas autorizadas, con cuentas individuales. | M |
| R-16 | Editar los textos de los tres idiomas y ver qué traducciones faltan. | S |
| R-17 | Previsualizar antes de publicar y poder deshacer un cambio. | S |
| R-18 | Que un cambio publicado se vea en la web en pocos minutos. | S |

## Técnicos y de operación

| ID | Requisito | Prio |
|---|---|---|
| R-19 | Coste recurrente lo más cercano a 0 € (web de una empresa pequeña con poco tráfico). | M |
| R-20 | Prototipo en las cuentas de Kevin y migración posterior a las de Studio Belvi sin rehacer nada. | M |
| R-21 | Arreglar el dominio raíz: hoy 2 de los 6 registros A apuntan a GoDaddy y dan error de certificado o la página de GoDaddy. | M |
| R-22 | Playwright para probar la web en móvil y escritorio (MCP instalado en el repo). | M |
| R-23 | Mantenimiento bajo: pocas piezas, sin servidores que vigilar, actualizaciones de dependencias poco frecuentes. | S |
| R-24 | Cumplir RGPD si se recogen datos (formulario): aviso legal, política de privacidad, sin cookies de seguimiento sin consentimiento. | S |
