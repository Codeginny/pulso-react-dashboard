import { createContext, useContext, useState, type ReactNode } from 'react';
import { createStore, useStore, type StoreApi } from 'zustand';
import type { Periodo, Region } from '../api/tipos';
import { atributosTema, guardarPreferencias, type Densidad, type Tema } from './estado';

export interface EstadoFiltros {
  periodo: Periodo;
  region: Region;
  setPeriodo: (p: Periodo) => void;
  setRegion: (r: Region) => void;
}

export interface EstadoPreferencias {
  tema: Tema;
  densidad: Densidad;
  setTema: (t: Tema) => void;
  setDensidad: (d: Densidad) => void;
}

interface Stores {
  filtros: StoreApi<EstadoFiltros>;
  preferencias: StoreApi<EstadoPreferencias>;
}

const StoresContext = createContext<Stores | null>(null);

function aplicarEnDocumento(tema: Tema, densidad: Densidad) {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  html.removeAttribute('data-tema');
  for (const [k, v] of Object.entries(atributosTema(tema, densidad))) html.setAttribute(k, v);
  guardarPreferencias(tema, densidad);
}

/**
 * Los stores se crean por render y no como módulos globales: en SSR un store
 * global se compartiría entre las peticiones de distintos usuarios.
 */
export function StoreProvider({
  filtros,
  preferencias,
  children,
}: {
  filtros: { periodo: Periodo; region: Region };
  preferencias: { tema: Tema; densidad: Densidad };
  children: ReactNode;
}) {
  const [stores] = useState<Stores>(() => ({
    filtros: createStore<EstadoFiltros>()((set) => ({
      ...filtros,
      setPeriodo: (periodo) => set({ periodo }),
      setRegion: (region) => set({ region }),
    })),
    preferencias: createStore<EstadoPreferencias>()((set, get) => ({
      ...preferencias,
      setTema: (tema) => {
        set({ tema });
        aplicarEnDocumento(tema, get().densidad);
      },
      setDensidad: (densidad) => {
        set({ densidad });
        aplicarEnDocumento(get().tema, densidad);
      },
    })),
  }));
  return <StoresContext.Provider value={stores}>{children}</StoresContext.Provider>;
}

function useStores() {
  const stores = useContext(StoresContext);
  if (!stores) throw new Error('Falta <StoreProvider>');
  return stores;
}

export function useFiltros<T>(selector: (s: EstadoFiltros) => T): T {
  return useStore(useStores().filtros, selector);
}

export function usePreferencias<T>(selector: (s: EstadoPreferencias) => T): T {
  return useStore(useStores().preferencias, selector);
}
