import { useShallow } from 'zustand/react/shallow';
import type { Filtros } from '../api/tipos';
import { useFiltros } from './StoreProvider';

/** Filtros actuales como objeto estable (sólo cambia si cambia un valor). */
export function useFiltrosActuales(): Filtros {
  return useFiltros(useShallow((s) => ({ periodo: s.periodo, region: s.region })));
}
