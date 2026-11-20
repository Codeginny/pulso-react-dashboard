# 02 · Diseño de producto, UX/UI y design system

> Los resultados del test de usabilidad de este documento son **SIMULADOS** (marcados así). Todo lo demás —pantallas,
> decisiones, tokens, componentes y resultados de accesibilidad— es real y se puede verificar en el código y en Storybook.

## Arquitectura de información

Las secciones salen de los *jobs to be done* de [01-producto](../01-producto/README.md), una por pregunta:

| Sección | Pregunta que responde | Usuario principal |
| --- | --- | --- |
| **Resumen** | ¿Vamos mejor o peor que el año pasado? | Dirección |
| **Clientes** | ¿Quién vale más y a quién hay que contactar? | CRM y cuentas |
| **Retención** | ¿Los clientes nuevos vuelven? | Dirección y CRM |
| **Productos y países** | ¿Qué se vende y dónde? | Comercial |
| **Asistente de datos** | Lo que no entra en las anteriores | Todos |

Los filtros (período y región) son **globales** y viven en la URL: si Carla manda el link de "últimos 3 meses, internacional",
Martín ve exactamente lo mismo. Cuando una sección usa todo el histórico (RFM y cohortes), el control de período se reemplaza por
el texto "Historial completo" en lugar de quedar deshabilitado sin explicación.

## Decisiones de diseño (y por qué)

| Decisión | Por qué |
| --- | --- |
| El color de la variación dice si es **buena o mala**, no si sube o baja | En "Devoluciones por pedido" una suba es mala noticia. Pintarla de verde sería mentir con el color. |
| Flecha + texto + color en cada variación | El color no puede ser la única señal (WCAG 1.4.1) y el 8 % de los hombres tiene alguna forma de daltonismo. |
| El KPI principal (Ingresos) destacado con borde | Es el primero que mira la dirección; el resto se lee después. |
| KPIs sin comparación dicen **por qué** | "Sin comparación: antes de dic 2009 no hay historia" evita que alguien saque conclusiones de un −62 % que era un artefacto del dataset. |
| Barras horizontales para rankings, nunca tortas | Con más de 3 categorías el ojo compara longitudes mucho mejor que ángulos. |
| Mapa de calor con **5 niveles sólidos** en vez de transparencias | Con transparencias, los tonos intermedios no tenían contraste suficiente ni con texto claro ni oscuro (lo detectó axe en CI). |
| Segmentos como tarjetas-botón con `aria-pressed` | Funcionan a la vez como resumen y como filtro de la tabla: un clic menos y se entiende qué está filtrado. |
| Tabla que se vuelve tarjetas en celular | Una tabla de 7 columnas con scroll horizontal en 375 px es ilegible; cada fila pasa a ser una tarjeta con etiqueta + valor. |
| Asistente con sugerencias siempre visibles | Hace visible qué sabe responder (reconocer antes que recordar) y evita la página en blanco. |
| "Cómo lo calculé" plegable en cada respuesta | Responde a la desconfianza que apareció en discovery sin cargar la respuesta de detalle técnico. |
| Preferencias en un desplegable | En celular el tema y la densidad empujaban el contenido hacia abajo; son ajustes que se tocan una vez. |

## Design system

### Cómo decidí la estructura

Empecé por los **tokens** y no por los componentes, porque el requisito más caro de agregar después era el modo oscuro.
La estructura tiene tres capas:

1. **Primitivos** — la paleta cruda (`verde-700`, `ambar-400`, `noche-900`). Sólo existen dentro de `_tokens.scss`.
2. **Semánticos** — lo que significa cada color (`--color-texto`, `--color-peligro`, `--grafico-1`, `--calor-3`). Son variables CSS y
   cambian con el tema.
3. **De componente** — decisiones locales dentro de cada `.module.scss` (por ejemplo, la sombra interna de la tarjeta destacada).

Un componente **nunca** usa un primitivo. Así el modo oscuro, la densidad compacta o un futuro tema de alto contraste se resuelven
redefiniendo la capa 2, sin tocar ningún componente.

Para los componentes no seguí *atomic design* al pie de la letra (átomos, moléculas, organismos), porque en un tablero la frontera
entre molécula y organismo se discute más de lo que ayuda. Los agrupé por **qué problema resuelven**:

| Grupo | Componentes | Criterio |
| --- | --- | --- |
| Base | Boton, Etiqueta, Selector, ControlSegmentado, Tarjeta | Sirven en cualquier producto |
| Datos | TarjetaKpi, TablaDatos, Paginacion, Graficos, MapaCalor | Saben mostrar números: formato tabular, alineación, tablas accesibles |
| Patrones | Estados (carga, vacío, error), MensajeChat | Resuelven situaciones, no piezas |

### Tokens

Contraste medido sobre la superficie de las tarjetas (blanco en claro, `#111d1d` en oscuro):

| Token | Claro | Oscuro | Contraste claro / oscuro |
| --- | --- | --- | --- |
| `--color-texto` | `#12201f` | `#e6f0ef` | 16,8:1 / 14,8:1 |
| `--color-texto-suave` | `#4a5b5a` | `#9fb3b1` | 7,2:1 / 7,9:1 |
| `--color-primario` | `#0f766e` | `#2dd4bf` | 5,5:1 / 9,3:1 |
| `--color-peligro` | `#b91c1c` | `#f87171` | 6,5:1 / 6,2:1 |
| `--color-exito` | `#15803d` | `#4ade80` | 5,0:1 / 9,9:1 |
| `--color-foco` | `#d97706` | `#fbbf24` | 3,2:1 / 10,3:1 (contorno: alcanza con 3:1) |
| Mapa de calor, 5 niveles | `#f0fdfa` → `#134e4a` | `#172626` → `#5eead4` | el texto de cada nivel queda entre 5,5:1 y 16,1:1 |

Espaciado en grilla de 8 (`--esp-1` = 4 px … `--esp-7` = 48 px), tipografía Inter con números tabulares, radios de 6, 10 y 16 px.

### Los cinco estados

Cada vista de datos contempla **ideal, cargando, vacío, error y parcial**:

- *Cargando:* esqueletos con la forma del contenido (no un spinner en el medio), así la página no salta.
- *Vacío:* dice por qué está vacío y qué hacer ("Ningún cliente coincide con la búsqueda").
- *Error:* `role="alert"`, mensaje en lenguaje común y botón **Reintentar**.
- *Parcial:* al cambiar un filtro se muestran los datos anteriores atenuados mientras llegan los nuevos (no se vacía la pantalla).

## Accesibilidad (WCAG 2.2 AA)

| Criterio | Cómo se cumple | Verificado con |
| --- | --- | --- |
| 1.1.1 Contenido no textual | Cada gráfico tiene `role="img"`, descripción y una tabla equivalente oculta a la vista | Jest + axe |
| 1.3.1 Información y relaciones | Tablas con `caption`, `scope`, `aria-sort`; filtros en `role="group"` | Testing Library |
| 1.4.1 Uso del color | Variaciones con flecha y texto; el mapa de calor escribe cada valor | Revisión manual |
| 1.4.3 Contraste | Tokens medidos en los dos temas; mapa de calor en niveles sólidos | axe en Playwright (claro y oscuro) |
| 2.1.1 Teclado | Control segmentado con flechas (patrón radiogroup); regiones con scroll enfocables | Jest + Playwright |
| 2.4.1 Saltar bloques | Enlace "Saltar al contenido" como primer elemento enfocable | Playwright |
| 2.4.3 Orden del foco | Al cambiar de sección el foco va al `h1` | Playwright |
| 2.4.7 Foco visible | Contorno ámbar de 2 px en todo lo interactivo | Storybook |
| 2.5.8 Tamaño del objetivo | 44 px de alto en botones, selectores y campos | Revisión manual |
| 4.1.3 Mensajes de estado | Conversación del asistente con `role="log"`; paginación con `aria-live` | Jest |

**Resultado:** 0 violaciones de axe (WCAG 2.0, 2.1 y 2.2 A/AA) en las 5 secciones, en tema claro y oscuro, en escritorio y celular.
Lo corre la CI en cada push; además, cada historia de Storybook pasa por el addon de accesibilidad.

## Responsive

- **≥ 1100 px:** barra lateral fija, KPIs en 4 columnas, gráfico principal con columna de KPIs secundarios al costado.
- **768–1099 px:** menú horizontal arriba, grillas que se reacomodan con `auto-fit`.
- **< 768 px:** una columna, tablas como tarjetas, menú deslizable. Playwright verifica que no haya desplazamiento horizontal.

## Test de usabilidad (SIMULADO)

**Formato:** moderado, remoto, 5 participantes (2 dirección/comercial, 2 CRM, 1 cuentas), prototipo navegable con datos reales.

| Tarea | Éxito | Tiempo medio | Observación |
| --- | ---: | ---: | --- |
| 1. ¿Facturamos más o menos que el año anterior? | 5/5 | 9 s | Todos leyeron primero la tarjeta destacada |
| 2. Encontrá cuántos clientes están "En riesgo" | 5/5 | 14 s | — |
| 3. Mostrá la lista de clientes "No se pueden perder" | 4/5 | 31 s | Una persona buscó un botón "Filtrar"; no vio que la tarjeta era clickeable |
| 4. ¿Qué porcentaje de nuevos vuelve al mes siguiente? | 3/5 | 48 s | Dos personas buscaron el dato en Resumen antes que en Retención |
| 5. Preguntale al asistente cuál fue el mejor mes | 5/5 | 12 s | Usaron la sugerencia, nadie escribió |

**SUS simulado:** 81/100.

**Cambios que salieron del test:**
- Tarea 3 → las tarjetas de segmento muestran estado presionado con fondo y borde, y el título de la tabla cambia a "Clientes · {segmento}".
- Tarea 4 → pendiente: sumar "Vuelven al mes siguiente" como KPI secundario en Resumen con enlace a Retención.

## Figma

El UI kit (tokens como variables de Figma, componentes con variantes y las 5 pantallas en claro/oscuro) se arma a partir de este
mismo design system. Pendiente: link al archivo.
