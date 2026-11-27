# 06 · Back office

Estado: propuesta del 26-11-2026 para la **opción A** de [04](04-arquitectura-opciones.md) (Astro + Sveltia CMS sobre el repo). Si se elige otra opción, esta spec se rehace. Requisitos que cubre: R-12 a R-18 de [03](03-requisitos.md). "INV §n" = sección de la [investigación de opciones](research/options-research.md); las citas de sveltiacms.app se consultaron el 26-11-2026.

## Resumen

- El back office está en `studiobelvi.com/admin/`. Es una página estática que carga Sveltia CMS en una versión fijada (5.0.2 desde el 27-11-2026, primera versión estable tras la beta 0.x).
- Entra cada persona con **su cuenta GitHub personal**. No hay contraseñas propias que guardar.
- Lo que se edita son formularios: niveles de dirección creativa, familias con sus packs, ampliaciones, galerías, FAQ y textos de la web, en ES / EN / CA.
- Guardar crea un borrador. Publicar escribe en el repo y la web se actualiza en 1-2 minutos (estimación propia).
- Lo que no se edita desde aquí (diseño, URLs, nuevos tipos de sección) lo cambia Kevin en código.

## Quién entra y cómo

| Persona | Cuenta | Permiso en el repo | Qué puede hacer |
|---|---|---|---|
| Cada editora de Studio Belvi | GitHub personal, gratuita, con 2FA | Write | Todo el contenido |
| Kevin (mientras mantenga la web) | GitHub personal | Write o Admin | Contenido, configuración del CMS y código |
| Cuenta compartida `studiobelvi` | La actual | Owner | Solo administración (invitar, facturación). No se usa para editar, para que cada cambio tenga autora (R-15) |

Cómo se entra:
1. Ir a `studiobelvi.com/admin/` y pulsar "Sign in with GitHub".
2. GitHub pide autorizar la app OAuth de Studio Belvi (solo la primera vez).
3. El intercambio de token lo hace el Worker de Sveltia en Cloudflare (Sveltia CMS Authenticator, INV §1). El secreto de la app vive en las variables del Worker, no en el repo.

Alta y baja: Owner invita o retira a la persona como colaboradora del repo en GitHub. No hay lista de usuarios en el CMS.

**Si alguna editora no quiere cuenta GitHub:** activar *Sveltia CMS Additions* (usuario y contraseña, mismo Worker) tras probarlo en el prototipo, porque es experimental, o pasar a Pages CMS (invitación por email). Ver [04](04-arquitectura-opciones.md).

## Pantallas

Organización revisada el 27-11-2026: cada página se edita en un solo sitio, con etiquetas legibles y un separador entre catálogo y web.

| # | Colección | Tipo | Qué contiene | Ficheros |
|---|---|---|---|---|
| 1 | Dirección creativa | Ficheros (5) | Story Sparks, Chapters, Universe; tabla comparativa; textos de la página y "Expand your story" | `src/content/creative-levels/*.yaml`, `comparison.yaml`, `creative-direction.yaml` |
| 2 | Packs | Carpeta (9) | Una familia por entrada, **con sus packs y ampliaciones dentro** | `src/content/families/*.yaml` |
| 3 | Packs · condiciones | Fichero | Introducción de packs, tipos de ampliación, condiciones, nota de la home | `src/content/packs-general.yaml` |
| — | *separador* | | | |
| 4 | Páginas | Ficheros (3) | Home (campos etiquetados por sección: "Portada · titular"…), FAQ (con interruptor Publicada), Privacidad | `pages/home.yaml`, `faq.yaml`, `privacy.yaml` |
| 5 | Galerías | Ficheros (4) | Memorabilia, Scenography, Immersion, Portfolio: foto, encuadre y pie | `src/content/galleries/*.yaml` |
| 6 | Textos de la web | Fichero | Menú, botones, formulario, pie, agrupados ("Menú · Packs") | `src/content/ui.yaml` |

Decisiones de esta organización:
- **Identificador = nombre del fichero** (familias y niveles): no aparece en el panel y no se puede cambiar por error. El enlace de cada pack es de solo lectura y se deriva del nombre.
- **Textos con formato ligero** (`**negrita**`, `*cursiva*`, saltos de línea), nunca HTML; la web lo convierte (`src/lib/text.ts`).
- **Encuadre** (`object-position`) junto a cada foto que se recorta: portada de familia, fotos de galería y foto del portfolio de la home.
- **Una carpeta de subida por sección** (`public/assets/images/packs`, `galleries`, `pages`, `creative-direction`); la biblioteca general sigue mostrando todas las fotos.
- **Vista previa con el diseño de la web** para familias, niveles y galerías (`public/admin/preview.js` con `preview.css`, copia de `src/styles/global.css`).

**Packs dentro de su familia.** El modelo de [02](02-catalogo-modelo-de-contenido.md) no cambia, pero se guarda así: cada fichero de familia lleva una lista `packs` y una lista `extras`. Ventajas: una pantalla por familia, como en el PDF; el orden de los packs es el orden de la lista (se arrastra); no hay relaciones que mantener. Cada pack de la lista se pliega para que el formulario no sea eterno.

Ejemplo de una familia (resumido):

```yaml
slug: wedding-paper-suite
name: The Wedding Paper Suite
area: memorabilia
visible: true
tagline: { es: "…", en: "…", ca: "…" }
packs:
  - slug: the-invitation
    name: The Invitation
    visible: true
    featured: true
    price: { amount: 750, kind: from, vat_mode: excluded }
    inclusion_groups:
      - items: { es: ["…"], en: ["…"], ca: ["…"] }
extras:
  - kind: addon
    label: { es: "…", en: "…", ca: "…" }
    price: { kind: quote, vat_mode: excluded }
```

La forma exacta de los campos traducidos la decide la estructura i18n de Sveltia (`single_file`, ver [Idiomas](#idiomas-r-16)); el ejemplo muestra la idea.

## Cómo se edita cada cosa

### Precios (R-07)

El precio nunca se escribe como frase. Es un grupo de campos:

| Campo | Control | Valores |
|---|---|---|
| Tipo | Desplegable | "Desde" (`from`) · "Precio cerrado" (`fixed`) · "Presupuesto personalizado" (`quote`) |
| Importe | Número, sin decimales | Obligatorio salvo en "Presupuesto" |
| IVA | Desplegable | "IVA incluido" (`included`) · "+ IVA" (`excluded`). Por defecto, el de la línea: incluido en dirección creativa, excluido en packs ([02](02-catalogo-modelo-de-contenido.md)) |
| Unidad | Desplegable, opcional | ninguna · €/mes · €/unidad · €/pieza |

- El precio no se traduce: se edita una vez y vale para los tres idiomas (`i18n: duplicate`). La web compone el texto en cada idioma con `PriceTag` ([05](05-frontend.md)).
- El "desde" de cada familia se escribe a mano en la familia. Propuesta a validar: calcularlo como el mínimo de sus packs visibles, lo que resolvería la incoherencia 3 de [02](02-catalogo-modelo-de-contenido.md).
- **Red de seguridad:** al construir, Astro valida cada fichero con su esquema Zod. Si un precio queda mal (tipo "Desde" sin importe, por ejemplo), el build falla y la web **sigue mostrando la versión anterior**. Kevin recibe el aviso de GitHub Actions.

### Packs y familias (R-14)

- **Ocultar / mostrar:** interruptor "Visible" en la familia y en cada pack. Oculto = no sale en la web, pero no se borra.
- **Orden:** familias, con un campo "Orden" (número); packs, ampliaciones y condiciones, arrastrando dentro de su lista.
- **Destacados en la home:** interruptor "Mostrar en la home" en cada familia e interruptor "Destacado" en cada pack. La home muestra las familias marcadas, en su orden, y en cada tarjeta los nombres de sus packs destacados.
- **Número del pack** ("01."): lo calcula la web por su posición, no se escribe.
- **Nuevo pack:** botón "Añadir" en la lista `packs` de la familia. **Nueva familia:** "Nueva entrada" en Packs de producción; necesita también portada y área.
- **Borrar:** posible, pero la recomendación es ocultar. Un borrado se recupera solo desde el historial de Git (ver [Deshacer](#deshacer)).

### Imágenes (R-13, R-10)

- Se suben desde el propio campo (portada de la familia, fotos del pack, tarjetas de galería) o desde Medios.
- Al subir, Sveltia convierte a **WebP**, limita el ancho y comprime con calidad 85 por defecto (INV §1). Propuesta: ancho máximo 2400 px.
- Cada imagen lleva **texto alternativo en los tres idiomas**, obligatorio en ES.
- Orden de las fotos de una galería: arrastrando en la lista.
- Dónde se guardan: en el repo, en `public/assets/images/` (ya convertidas a WebP, con carga diferida), la misma carpeta de las fotos actuales. Pasar a `src/assets/` para que Astro genere varios tamaños (`srcset`) sigue por verificar con Sveltia.
- Espacio: GitHub Pages admite 1 GB por sitio (INV §7). Con unas 200 fotos WebP de ~300 KB serían unos 60 MB (estimación propia).

### Idiomas (R-16)

- Estructura i18n `single_file`: los tres idiomas de una entrada están en el mismo fichero, así no se desincronizan.
- Idioma de edición por defecto: **ES**, porque el catálogo original está en castellano ([02](02-catalogo-modelo-de-contenido.md), incoherencia 6). Inglés sigue siendo el idioma por defecto de la web pública.
- El selector de idioma del editor marca las traducciones que faltan o tienen errores (sveltiacms.app/en/docs/ui/content-editor).
- Campos que no se traducen (`i18n: duplicate`): nombres de familia y pack (se mantienen en inglés, como en el PDF), precios, visible, destacado, orden, imágenes.
- Si falta un texto en EN o CA al publicar, la web muestra el texto ES en su lugar y el build lista las traducciones pendientes. Nunca sale un hueco vacío.
- Traducción asistida: Sveltia la ofrece como opción (INV §1), pero necesita una clave de un servicio de traducción. No se activa en el prototipo; si se activa, la clave va en su configuración, no en el código.

## Cómo se publica (R-17, R-18)

Con el **flujo editorial** de Sveltia activado (requiere backend GitHub, sveltiacms.app/en/docs/workflows/editorial):

```
Guardar ──► Borrador ──► En revisión ──► Listo ──► Publicar
            (rama y PR en GitHub)                    │
                                                     ▼
                                      commit en main → GitHub Actions
                                      (build Astro + validación) → GitHub Pages
                                                     │
                                                     ▼
                                       visible en studiobelvi.com en 1-2 min
```

- **Guardar** no toca la web: crea un borrador. Se puede dejar a medias y seguir otro día.
- **En revisión** sirve para que la otra persona lo mire antes de publicar. No es obligatorio: se puede publicar desde cualquier estado.
- **Vista previa:** el panel lateral muestra la entrada con plantillas propias (`registerPreviewTemplate`) que usan el CSS de la web (`registerPreviewStyle`), así se parece a la página real. No es la página real completa: GitHub Pages solo publica una versión del sitio.
- **Publicar** fusiona el borrador en `main`. El build tarda 1-2 minutos (estimación propia). Si falla la validación, no se publica nada y la web sigue como estaba.

Recomendación: empezar con el flujo editorial activado, porque son dos personas y evita que un cambio a medias salga publicado. Si les resulta pesado, se desactiva y "Guardar" pasa a publicar directamente.

### Deshacer

- **Antes de publicar:** descartar el borrador o "Revert Changes" para los cambios sin guardar.
- **Después de publicar:** el panel Historial de cada entrada muestra los commits y qué cambió en cada uno (sveltiacms.app/en/docs/ui/content-editor). Sveltia **no tiene botón para restaurar** una versión guardada: se reescribe el valor anterior mirando el diff, o Kevin hace un `git revert`. Es el peaje principal de la opción A frente a R-17.

## Qué no se edita desde el back office

- Diseño, colores, tipografías, plantillas de página, menú y URLs: código, lo cambia Kevin.
- Configuración del propio CMS (`admin/config.yml`) y esquemas Zod: código. Si se añade un campo, se cambia en los dos sitios a la vez.
- El formulario de contacto (destino, campos): configuración en código y en Web3Forms.
- DNS y dominio: GoDaddy (R-21).

Nota: el permiso Write de GitHub también permite editar código desde github.com, como hacen hoy. Por acuerdo, las editoras solo usan `/admin/`.

## Prototipo en las cuentas de Kevin

- Repo propio de Kevin con el código y el contenido de ejemplo del catálogo; Pages en su subdominio de `github.io` (con `base` de Astro, porque no es la raíz).
- **Login en el prototipo con token personal de GitHub** (cuenta personal `KevinPujol`), sin Worker: el único editor es Kevin. Decidido el 26-11-2026.
- La app OAuth de GitHub y el Worker de Cloudflare se crean cuando las editoras empiecen a probar, directamente en las cuentas de Studio Belvi, para no tener que migrarlos. Identificadores en variables de entorno y en `admin/config.yml`, sin nada fijo en el código ([CLAUDE.md](../CLAUDE.md)).
- Pruebas en el prototipo antes de migrar: login con una segunda cuenta GitHub, flujo editorial completo, imágenes en `src/assets/`, traducciones que faltan, build fallido por precio mal puesto, y la vista de `/admin/` en móvil.
- Migración: pasos de [04](04-arquitectura-opciones.md#migración-a-las-cuentas-de-studio-belvi).

## Estado del prototipo (26-11-2026)

Construido en local en la rama `prototipo`, sin commit ni repo remoto todavía.

**Prueba de punta a punta del panel (Playwright, modo "Work with Local Repository" de Sveltia sobre una copia del contenido):** Sveltia (0.273.1, y de nuevo con 5.0.2 el 27-11-2026) abrió las 6 colecciones sin errores; se cambió el precio "desde" de The Wedding Signs de 950 a 975 €, Sveltia confirmó "Entry saved." y, con ese fichero, el build publicó "Desde 975 € + IVA" y "From €975 + VAT" con las traducciones intactas. Después se restauró el precio real (950 €).

Lo que se aprendió de cómo escribe Sveltia, ya resuelto en el código:
- Escribe los campos opcionales vacíos como `''` (`unit: ''`, `note: ''`): el esquema los trata como "sin valor".
- En los bloques `en`/`ca` rellena los campos compartidos con `null`: la web siempre los lee del castellano y la comprobación de coherencia los ignora.
- **Al guardar reescribe el fichero y borra los comentarios YAML.** Las fuentes de cada dato quedan en [02](02-catalogo-modelo-de-contenido.md), no en los ficheros.
- La carpeta de medios es `public/assets/images` (no solo `uploads`), para que el panel muestre y reutilice las fotos actuales.

**Flujo editorial en el repo real (`KevinPujol/studio-belvi-prototipo`, 26-11-2026):** entrada con token; al guardar, Sveltia creó la PR #1 en la rama `cms/families/wedding-signs` con la etiqueta `sveltia-cms/draft` y no hubo despliegue; al pasar a *Ready* y pulsar *Publish* fusionó la PR en `main`, GitHub Actions desplegó y la web mostró el precio nuevo en ES y EN. Después se restauró el precio real (commit `5381c73`).

Otras comprobaciones: validación al construir (un precio "Desde" sin importe hace fallar el build).

Manual para las editoras con capturas: `docs/manual.html`, solo en local (fuera de git).

## Publicación segura (27-11-2026, tras la auditoría independiente)

- **Flujo:** Borrador → Listo → Publicar (`publish_mode.stages: [draft, pending_publish]`). Sin "En revisión": una sola cuenta compartida.
- **Comprobación de cada borrador:** `.github/workflows/check.yml` construye cada pull request de Sveltia con las mismas validaciones que el despliegue. Con la regla de rama en `main` (check `check` obligatorio, también para administradores), un borrador inválido no se puede fusionar. Probado en el prototipo: un precio "Desde" sin importe falló la comprobación ("needs an amount greater than 0") y "Publish" quedó bloqueado (GitHub 405); un cambio correcto pasó, se publicó y llegó a la web.
- **Aviso en el panel:** `public/admin/status.js` muestra "Publicando…", "Web al día", "Hay un borrador con errores" o "La última publicación ha fallado".
- **Traducciones:** una traducción solo se usa si el texto castellano existe; las listas se emparejan solo si tienen la misma longitud (si no, se muestra la castellana) y `check-content` lo avisa.
- **Edición:** textos largos con botones de negrita y cursiva (`richtext`, guarda `**…**`, `_…_` y saltos de línea, que `src/lib/text.ts` convierte); solo el castellano es obligatorio; las familias no se borran desde el panel y las nuevas empiezan ocultas; los niveles no exponen orden ni visibilidad.

**En la migración, la dueña de la cuenta debe además activar la regla de rama en `studiobelvi/studiobelvi.github.io`:** Settings → Branches → Add rule para `main`, "Require status checks to pass" con `check`, e "Include administrators" (sin esto la cuenta compartida, que es administradora, se la saltaría).

## Abierto

1. ¿Las editoras aceptan cuenta GitHub personal? Si no: Sveltia Additions o Pages CMS.
2. ¿Quiénes son las editoras y cuántas? (cuentas a invitar).
3. ¿Flujo editorial activado o publicación directa?
4. ¿El "desde" de la familia se calcula o se escribe a mano?
5. Imágenes en `src/assets/` con Sveltia: verificar en el prototipo.
