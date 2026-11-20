import type { ReactNode } from 'react';
import estilos from './Etiqueta.module.scss';

export type TonoEtiqueta = 'neutro' | 'primario' | 'exito' | 'peligro' | 'acento';

export function Etiqueta({ tono = 'neutro', children }: { tono?: TonoEtiqueta; children: ReactNode }) {
  return <span className={`${estilos.etiqueta} ${estilos[tono]}`}>{children}</span>;
}
