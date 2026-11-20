import { useId, type ReactNode } from 'react';
import estilos from './Tarjeta.module.scss';

export interface TarjetaProps {
  titulo?: string;
  descripcion?: ReactNode;
  acciones?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Nivel del título para respetar la jerarquía de la página. */
  nivel?: 2 | 3;
}

/** Contenedor base. Con título se vuelve una región con nombre accesible. */
export function Tarjeta({ titulo, descripcion, acciones, children, className, nivel = 2 }: TarjetaProps) {
  const id = useId();
  const Titulo = `h${nivel}` as const;
  return (
    <section className={[estilos.tarjeta, className].filter(Boolean).join(' ')} aria-labelledby={titulo ? id : undefined}>
      {(titulo || acciones) && (
        <header className={estilos.encabezado}>
          <div>
            {titulo && (
              <Titulo id={id} className={estilos.titulo}>
                {titulo}
              </Titulo>
            )}
            {descripcion && <p className={estilos.descripcion}>{descripcion}</p>}
          </div>
          {acciones && <div className={estilos.acciones}>{acciones}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
