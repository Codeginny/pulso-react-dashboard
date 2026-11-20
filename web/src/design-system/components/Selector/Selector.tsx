import { useId } from 'react';
import type { Opcion } from '../ControlSegmentado/ControlSegmentado';
import estilos from './Selector.module.scss';

export interface SelectorProps<T extends string> {
  etiqueta: string;
  opciones: Opcion<T>[];
  valor: T;
  onCambio: (valor: T) => void;
  ocultarEtiqueta?: boolean;
}

/** Select nativo con estilo propio: conserva teclado, lector de pantalla y selector del celular. */
export function Selector<T extends string>({ etiqueta, opciones, valor, onCambio, ocultarEtiqueta }: SelectorProps<T>) {
  const id = useId();
  return (
    <div className={estilos.contenedor}>
      <label htmlFor={id} className={ocultarEtiqueta ? 'solo-lectores' : estilos.etiqueta}>
        {etiqueta}
      </label>
      <select id={id} className={estilos.select} value={valor} onChange={(e) => onCambio(e.target.value as T)}>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
    </div>
  );
}
