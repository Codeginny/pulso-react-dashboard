import type { ButtonHTMLAttributes, ReactNode } from 'react';
import estilos from './Boton.module.scss';

export interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario' | 'fantasma';
  tamanio?: 's' | 'm';
  icono?: ReactNode;
  cargando?: boolean;
}

export function Boton({
  variante = 'primario',
  tamanio = 'm',
  icono,
  cargando = false,
  disabled,
  children,
  className,
  type = 'button',
  ...resto
}: BotonProps) {
  return (
    <button
      type={type}
      className={[estilos.boton, estilos[variante], estilos[tamanio], className].filter(Boolean).join(' ')}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...resto}
    >
      {cargando ? <span className={estilos.spinner} aria-hidden="true" /> : icono && <span aria-hidden="true">{icono}</span>}
      {children}
    </button>
  );
}
