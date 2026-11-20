import type { QueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { consultas } from './api/consultas';
import type { Filtros } from './api/tipos';
import { Asistente } from './pages/Asistente';
import { Clientes, CLIENTES_INICIAL } from './pages/Clientes';
import { Productos } from './pages/Productos';
import { Resumen } from './pages/Resumen';
import { Retencion } from './pages/Retencion';

export interface Ruta {
  path: string;
  titulo: string;
  elemento: ReactElement;
  /** Si es falso, el análisis usa todo el histórico y el filtro de período no aplica. */
  usaPeriodo: boolean;
  /** Lo que el servidor carga antes de renderizar, para que el HTML llegue con datos. */
  precargar: (qc: QueryClient, f: Filtros) => Promise<unknown>[];
}

export const RUTAS: Ruta[] = [
  {
    path: '/',
    titulo: 'Resumen',
    elemento: <Resumen />,
    usaPeriodo: true,
    precargar: (qc, f) => [
      qc.prefetchQuery(consultas.resumen(f)),
      qc.prefetchQuery(consultas.pareto(f.region)),
      qc.prefetchQuery(consultas.productosPaises(f)),
    ],
  },
  {
    path: '/clientes',
    titulo: 'Clientes',
    elemento: <Clientes />,
    usaPeriodo: false,
    precargar: (qc, f) => [
      qc.prefetchQuery(consultas.segmentos(f.region)),
      qc.prefetchQuery(consultas.clientes({ ...CLIENTES_INICIAL, region: f.region })),
    ],
  },
  {
    path: '/retencion',
    titulo: 'Retención',
    elemento: <Retencion />,
    usaPeriodo: false,
    precargar: (qc, f) => [qc.prefetchQuery(consultas.cohortes(f.region))],
  },
  {
    path: '/productos',
    titulo: 'Productos y países',
    elemento: <Productos />,
    usaPeriodo: true,
    precargar: (qc, f) => [qc.prefetchQuery(consultas.productosPaises(f))],
  },
  {
    path: '/asistente',
    titulo: 'Asistente de datos',
    elemento: <Asistente />,
    usaPeriodo: true,
    precargar: () => [],
  },
];

export const rutaPorPath = (path: string) => RUTAS.find((r) => r.path === path);
