# 01 · Estrategia de producto

> **Qué es real y qué es simulado.** Los datos de ventas y todos los números de negocio son reales (Online Retail II).
> La empresa, las personas, las entrevistas y la encuesta de este documento son **SIMULADAS**: las armé para practicar el
> proceso de discovery completo sobre un caso verosímil. Están marcadas así cada vez que aparecen.

## Contexto

Un mayorista online de artículos de regalo del Reino Unido vende a comercios minoristas de 40 países. Tiene 5.800 clientes
activos en dos años, factura £ 8,2 millones al año y concentra más de un tercio de la venta en tres meses (septiembre a noviembre).

Hoy los datos viven en el sistema de facturación. Cada lunes alguien del equipo comercial exporta una planilla, arma tablas
dinámicas y manda un resumen por mail. Las preguntas que no entran en esa planilla ("¿qué clientes grandes dejaron de comprar?",
"¿los que entraron en Navidad volvieron?") se responden tarde o no se responden.

## Problema

> El equipo comercial decide a quién contactar y qué campaña lanzar **sin una vista compartida y actualizada del valor de cada
> cliente**, y cuando se da cuenta de que un cliente importante se fue, ya pasaron meses.

Evidencia en los datos reales:

- 1.500 clientes que ya facturaron **£ 2,36 M** llevan en promedio más de **228 días sin comprar** (segmentos *En riesgo* y *No se pueden perder*).
- El 20 % de los clientes genera el **77 %** de los ingresos: perder a pocos impacta fuerte.
- Sólo el **21,5 %** de los clientes nuevos vuelve al mes siguiente.

## Usuarios (SIMULADO)

| Persona | Rol | Lo que necesita | Hoy |
| --- | --- | --- | --- |
| **Carla, directora comercial** | Define metas y prioridades del trimestre | Ver en 30 segundos si el negocio va mejor o peor que el año pasado y por qué | Espera el resumen del lunes |
| **Martín, analista de CRM** | Arma las campañas de mail y reactivación | Listas de clientes por segmento, con criterio claro y exportables | Filtra planillas a mano; cada campaña le lleva un día |
| **Lucía, ejecutiva de cuentas** | Atiende a los clientes grandes | Saber qué cliente suyo bajó la frecuencia antes de que se vaya | Se entera cuando el cliente ya compró a otro proveedor |

### Jobs to be done

- *Cuando* empieza la semana, *quiero* saber si vamos por encima o por debajo del año pasado, *para* decidir dónde poner al equipo.
- *Cuando* preparo una campaña, *quiero* una lista de clientes con un criterio que todos entiendan, *para* no discutir la lista sino el mensaje.
- *Cuando* un cliente importante deja de comprar, *quiero* enterarme rápido, *para* llamarlo mientras todavía hay relación.
- *Cuando* tengo una pregunta puntual, *quiero* preguntarla en lenguaje común, *para* no depender de que alguien arme una consulta.

## Discovery (SIMULADO)

**Entrevistas:** 6 entrevistas de 30 minutos (2 por perfil). Lo que más se repitió:

| Hallazgo | Menciones | Cita representativa |
| --- | ---: | --- |
| "No sé qué clientes grandes dejaron de comprar" | 5 de 6 | «Me entero cuando reviso la cuenta a fin de trimestre, y ya es tarde.» |
| Desconfianza en los números porque cada uno arma su planilla | 4 de 6 | «En la reunión discutimos de dónde salió el número en vez de qué hacemos.» |
| Las listas para campañas se arman a mano | 2 de 2 analistas | «Cada campaña es un día de filtrar Excel.» |
| Quieren preguntar sin aprender a usar la herramienta | 3 de 6 | «Si le puedo preguntar como le pregunto a Martín, lo uso.» |

**Encuesta:** 24 respuestas del área comercial y de marketing. El 79 % dijo tardar más de 2 horas por semana en armar reportes;
el 63 % dijo no confiar del todo en los números que circulan.

### Hipótesis

| # | Creemos que… | Lo sabremos si… |
| --- | --- | --- |
| H1 | Un tablero compartido con una sola fuente de datos baja el tiempo de reporte semanal | El resumen del lunes deja de armarse a mano en 4 semanas |
| H2 | Segmentar por RFM con una acción sugerida acelera las campañas | El tiempo para armar una lista de campaña baja de 1 día a menos de 1 hora |
| H3 | Ver a los clientes "No se pueden perder" hace que el equipo los contacte antes | Al menos el 30 % de ese segmento recibe un contacto en el primer mes |
| H4 | Un asistente que responde preguntas frecuentes suma uso de perfiles no técnicos | El 40 % de los usuarios semanales usa el asistente al menos una vez |

## North Star y métricas

**North Star:** *clientes de alto valor recuperados por mes* (clientes de *En riesgo* o *No se pueden perder* que vuelven a comprar
dentro de los 60 días posteriores a un contacto).

| Tipo | Métrica | Meta inicial |
| --- | --- | --- |
| Adopción | Usuarios activos semanales / usuarios con acceso | ≥ 70 % |
| Eficiencia | Horas por semana armando reportes | De 2+ h a < 30 min |
| Resultado | Ingresos de clientes reactivados | £ 120.000 por trimestre (≈ 5 % del valor en riesgo) |
| Calidad | Preguntas del asistente sin respuesta | < 15 % |
| Guardrail | Tiempo de carga del tablero (LCP) | < 2,5 s |

## Priorización (RICE)

Alcance = usuarios por trimestre; impacto 0,25–3; confianza en %; esfuerzo en semanas-persona.

| Funcionalidad | Alcance | Impacto | Confianza | Esfuerzo | RICE | Decisión |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| KPIs con comparación interanual | 25 | 2 | 90 % | 1 | 45 | MVP |
| Segmentos RFM con acción sugerida | 15 | 3 | 80 % | 1,5 | 24 | MVP |
| Tabla de clientes filtrable por segmento | 15 | 2 | 80 % | 1 | 24 | MVP |
| Retención por cohorte | 10 | 2 | 70 % | 1 | 14 | MVP |
| Asistente de preguntas frecuentes | 25 | 1 | 50 % | 1,5 | 8,3 | MVP acotado (reglas, sin texto libre) |
| Exportar lista a CSV | 15 | 1 | 90 % | 0,5 | 27 | Siguiente |
| Alertas por mail cuando un cliente cambia de segmento | 10 | 3 | 50 % | 2 | 7,5 | Siguiente |
| Pronóstico de demanda por producto | 5 | 2 | 30 % | 4 | 0,75 | Más adelante |

**Por qué el asistente entra al MVP aunque su RICE es bajo:** es la hipótesis más incierta (H4) y la más barata de validar si se
acota a preguntas frecuentes con respuestas fijas. Si nadie lo usa, se descarta sin haber invertido en un modelo de lenguaje.

## Alcance del MVP

**Dentro:** resumen con 7 KPIs y tendencia; segmentos RFM y tabla de clientes; cohortes; productos y países; asistente con 10
intenciones; filtros de período y región compartibles por URL; tema claro/oscuro; accesible y usable en celular.

**Fuera (a propósito):** login y permisos (la herramienta es interna), edición de datos, exportaciones, alertas, pronósticos.

## Roadmap

| Ahora (MVP) | Siguiente | Más adelante |
| --- | --- | --- |
| Tablero, RFM, cohortes, asistente | Exportar listas a CSV y al CRM | Pronóstico de demanda por temporada |
| Design system documentado | Alertas de cambio de segmento | Asistente con lenguaje libre (con respuestas auditables) |
| CI con tests y accesibilidad | Login con roles (dirección / comercial) | Datos en tiempo real desde el sistema de facturación |

## Riesgos de producto

| Riesgo | Mitigación |
| --- | --- |
| Que el equipo no confíe en los números | Una sola fuente (`pulso.db`); el asistente muestra la consulta que usó; reglas de limpieza documentadas |
| Que RFM se lea como "verdad" y no como criterio | Cada segmento dice su regla y su acción; se revisa con el equipo cada trimestre |
| Que el asistente prometa más de lo que sabe | Responde sólo lo que reconoce y lo dice cuando no sabe; sugiere preguntas que sí puede contestar |
