import { HydrationBoundary, QueryClientProvider, type DehydratedState, type QueryClient } from '@tanstack/react-query';
import { StrictMode, type ReactNode } from 'react';
import { App } from './App';
import type { Filtros } from './api/tipos';
import type { Densidad, Tema } from './store/estado';
import { StoreProvider } from './store/StoreProvider';

export interface EstadoInicial {
  consultas?: DehydratedState;
  filtros: Filtros;
  preferencias: { tema: Tema; densidad: Densidad };
}

/** Árbol común a servidor y cliente: si difieren, la hidratación falla. */
export function Raiz({ cliente, estado, router }: { cliente: QueryClient; estado: EstadoInicial; router: (app: ReactNode) => ReactNode }) {
  return (
    <StrictMode>
      <QueryClientProvider client={cliente}>
        <HydrationBoundary state={estado.consultas}>
          <StoreProvider filtros={estado.filtros} preferencias={estado.preferencias}>
            {router(<App />)}
          </StoreProvider>
        </HydrationBoundary>
      </QueryClientProvider>
    </StrictMode>
  );
}

export const opcionesConsultas = { queries: { staleTime: 5 * 60_000, retry: 1, refetchOnWindowFocus: false } };
