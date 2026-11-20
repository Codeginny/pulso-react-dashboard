import type { ReactNode } from 'react';
import estilos from './TablaDatos.module.scss';

export interface Columna<T> {
  clave: string;
  titulo: string;
  render: (fila: T) => ReactNode;
  alinear?: 'izquierda' | 'derecha';
  /** Si la columna se puede ordenar, el valor de orden que dispara. */
  orden?: string;
}

export interface TablaDatosProps<T> {
  /** Título de la tabla para lectores de pantalla (caption). */
  titulo: string;
  columnas: Columna<T>[];
  filas: T[];
  claveFila: (fila: T) => string;
  ordenActual?: string;
  onOrdenar?: (orden: string) => void;
  vacio?: ReactNode;
  cargando?: boolean;
}

/**
 * Tabla semántica con encabezados ordenables. En pantallas chicas cada fila
 * se apila como tarjeta y cada celda muestra su encabezado (data-titulo).
 */
export function TablaDatos<T>({ titulo, columnas, filas, claveFila, ordenActual, onOrdenar, vacio, cargando }: TablaDatosProps<T>) {
  // El contenedor es enfocable para poder desplazar la tabla con el teclado cuando no entra a lo ancho.
  return (
    <div className={estilos.contenedor} aria-busy={cargando || undefined} tabIndex={0} role="region" aria-label={titulo}>
      <table className={`${estilos.tabla} ${cargando ? estilos.cargando : ''}`}>
        <caption className="solo-lectores">{titulo}</caption>
        <thead>
          <tr>
            {columnas.map((c) => {
              const activa = c.orden !== undefined && c.orden === ordenActual;
              return (
                <th
                  key={c.clave}
                  scope="col"
                  className={c.alinear === 'derecha' ? estilos.derecha : undefined}
                  aria-sort={c.orden ? (activa ? 'descending' : 'none') : undefined}
                >
                  {c.orden && onOrdenar ? (
                    <button type="button" className={estilos.ordenar} onClick={() => onOrdenar(c.orden!)}>
                      {c.titulo}
                      <span aria-hidden="true" className={activa ? estilos.flechaActiva : estilos.flecha}>
                        ↓
                      </span>
                    </button>
                  ) : (
                    c.titulo
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {filas.length === 0 ? (
            <tr>
              <td colSpan={columnas.length} className={estilos.vacio}>
                {vacio ?? 'No hay datos para mostrar.'}
              </td>
            </tr>
          ) : (
            filas.map((fila) => (
              <tr key={claveFila(fila)}>
                {columnas.map((c) => (
                  <td key={c.clave} data-titulo={c.titulo} className={c.alinear === 'derecha' ? estilos.derecha : undefined}>
                    {c.render(fila)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
