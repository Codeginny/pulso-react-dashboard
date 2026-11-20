import type { ReactNode } from 'react';
import estilos from './MensajeChat.module.scss';

export interface MensajeChatProps {
  rol: 'usuario' | 'asistente';
  children: ReactNode;
  /** Detalle técnico plegable (por ejemplo, la consulta que respondió). */
  detalle?: ReactNode;
}

export function MensajeChat({ rol, children, detalle }: MensajeChatProps) {
  return (
    <li className={`${estilos.mensaje} ${estilos[rol]}`}>
      <span className="solo-lectores">{rol === 'usuario' ? 'Vos dijiste:' : 'El asistente respondió:'}</span>
      <div className={estilos.burbuja}>
        {children}
        {detalle && (
          <details className={estilos.detalle}>
            <summary>Cómo lo calculé</summary>
            {detalle}
          </details>
        )}
      </div>
    </li>
  );
}

export function Sugerencias({ opciones, onElegir, deshabilitadas }: { opciones: string[]; onElegir: (s: string) => void; deshabilitadas?: boolean }) {
  return (
    <ul className={estilos.sugerencias} aria-label="Preguntas sugeridas">
      {opciones.map((s) => (
        <li key={s}>
          <button type="button" className={estilos.sugerencia} onClick={() => onElegir(s)} disabled={deshabilitadas}>
            {s}
          </button>
        </li>
      ))}
    </ul>
  );
}
