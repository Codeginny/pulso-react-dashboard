import { useId, useRef, type KeyboardEvent } from 'react';
import estilos from './ControlSegmentado.module.scss';

export interface Opcion<T extends string> {
  valor: T;
  etiqueta: string;
}

export interface ControlSegmentadoProps<T extends string> {
  etiqueta: string;
  opciones: Opcion<T>[];
  valor: T;
  onCambio: (valor: T) => void;
  /** Oculta la etiqueta a la vista; los lectores de pantalla la siguen leyendo. */
  ocultarEtiqueta?: boolean;
}

/**
 * Grupo de opciones excluyentes con el patrón radiogroup de ARIA:
 * Tab entra al grupo y las flechas cambian la opción.
 */
export function ControlSegmentado<T extends string>({ etiqueta, opciones, valor, onCambio, ocultarEtiqueta }: ControlSegmentadoProps<T>) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const alTeclear = (e: KeyboardEvent, indice: number) => {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const siguiente = (indice + delta + opciones.length) % opciones.length;
    onCambio(opciones[siguiente]!.valor);
    refs.current[siguiente]?.focus();
  };

  return (
    <div className={estilos.contenedor}>
      <span id={id} className={ocultarEtiqueta ? 'solo-lectores' : estilos.etiqueta}>
        {etiqueta}
      </span>
      <div role="radiogroup" aria-labelledby={id} className={estilos.grupo}>
        {opciones.map((o, i) => {
          const activa = o.valor === valor;
          return (
            <button
              key={o.valor}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={activa}
              tabIndex={activa ? 0 : -1}
              className={`${estilos.opcion} ${activa ? estilos.activa : ''}`}
              onClick={() => onCambio(o.valor)}
              onKeyDown={(e) => alTeclear(e, i)}
            >
              {o.etiqueta}
            </button>
          );
        })}
      </div>
    </div>
  );
}
