import { queryOptions } from '@tanstack/react-query';
import { pedir } from './cliente';
import type {
  Cliente,
  Cohorte,
  Filtros,
  OrdenClientes,
  Pais,
  Pareto,
  Producto,
  Region,
  RespuestaAsistente,
  Resumen,
  Segmento,
} from './tipos';

// Cada consulta pide sólo los campos que usa su pantalla.

const RESUMEN = /* GraphQL */ `
  query Resumen($filtros: Filtros) {
    resumen(filtros: $filtros) {
      periodo { periodo etiqueta desde hasta comparaCon }
      kpis { clave etiqueta valor anterior variacion formato mejorSiSube }
      serie { mes ingresos pedidos clientes clientesNuevos }
    }
  }
`;

const SEGMENTOS = /* GraphQL */ `
  query Segmentos($region: Region) {
    segmentos(region: $region) {
      nombre orden descripcion accion clientes ingresos participacionIngresos
      recenciaPromedio frecuenciaPromedio ticketPromedio
    }
  }
`;

const CLIENTES = /* GraphQL */ `
  query Clientes($region: Region, $segmento: String, $busqueda: String, $orden: OrdenClientes, $pagina: Int, $porPagina: Int) {
    clientes(region: $region, segmento: $segmento, busqueda: $busqueda, orden: $orden, pagina: $pagina, porPagina: $porPagina) {
      total pagina porPagina
      items { id pais segmento recencia frecuencia monetario ticketPromedio ultimaCompra puntajeRfm }
    }
  }
`;

const COHORTES = /* GraphQL */ `
  query Cohortes($region: Region) {
    cohortes(region: $region) { mes clientes retencion }
  }
`;

const PRODUCTOS_PAISES = /* GraphQL */ `
  query ProductosPaises($filtros: Filtros) {
    productos(filtros: $filtros, limite: 10) { codigo descripcion ingresos unidades clientes }
    paises(filtros: $filtros, limite: 8) { nombre ingresos clientes pedidos }
  }
`;

const PARETO = /* GraphQL */ `
  query Pareto($region: Region) {
    pareto(region: $region) { top20 curva { clientes ingresos } }
  }
`;

const PREGUNTAR = /* GraphQL */ `
  query Preguntar($pregunta: String!, $filtros: Filtros) {
    preguntar(pregunta: $pregunta, filtros: $filtros) {
      texto consulta sugerencias
      tabla { columnas filas }
    }
  }
`;

export const consultas = {
  resumen: (filtros: Filtros) =>
    queryOptions({
      queryKey: ['resumen', filtros],
      queryFn: ({ signal }) => pedir<{ resumen: Resumen }>(RESUMEN, { filtros }, signal).then((d) => d.resumen),
      placeholderData: (anterior) => anterior,
    }),

  segmentos: (region: Region) =>
    queryOptions({
      queryKey: ['segmentos', region],
      queryFn: ({ signal }) => pedir<{ segmentos: Segmento[] }>(SEGMENTOS, { region }, signal).then((d) => d.segmentos),
    }),

  clientes: (args: { region: Region; segmento: string | null; busqueda: string; orden: OrdenClientes; pagina: number }) =>
    queryOptions({
      queryKey: ['clientes', args],
      queryFn: ({ signal }) =>
        pedir<{ clientes: { total: number; pagina: number; porPagina: number; items: Cliente[] } }>(
          CLIENTES,
          { ...args, porPagina: 10 },
          signal,
        ).then((d) => d.clientes),
      placeholderData: (anterior) => anterior,
    }),

  cohortes: (region: Region) =>
    queryOptions({
      queryKey: ['cohortes', region],
      queryFn: ({ signal }) => pedir<{ cohortes: Cohorte[] }>(COHORTES, { region }, signal).then((d) => d.cohortes),
    }),

  productosPaises: (filtros: Filtros) =>
    queryOptions({
      queryKey: ['productos-paises', filtros],
      queryFn: ({ signal }) => pedir<{ productos: Producto[]; paises: Pais[] }>(PRODUCTOS_PAISES, { filtros }, signal),
      placeholderData: (anterior) => anterior,
    }),

  pareto: (region: Region) =>
    queryOptions({
      queryKey: ['pareto', region],
      queryFn: ({ signal }) => pedir<{ pareto: Pareto }>(PARETO, { region }, signal).then((d) => d.pareto),
    }),
};

export const preguntar = (pregunta: string, filtros: Filtros) =>
  pedir<{ preguntar: RespuestaAsistente }>(PREGUNTAR, { pregunta, filtros }).then((d) => d.preguntar);
