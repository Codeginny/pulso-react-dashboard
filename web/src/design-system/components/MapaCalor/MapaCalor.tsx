import estilos from './MapaCalor.module.scss';

export interface FilaMapaCalor {
  etiqueta: string;
  total: string;
  valores: number[];
}

export interface MapaCalorProps {
  titulo: string;
  filas: FilaMapaCalor[];
  /** Encabezados de las columnas de valores (Mes 0, Mes 1…). */
  columnas: string[];
  formato?: (v: number) => string;
  /** Valor que se considera máximo para la escala de color (por defecto, el mayor sin contar la primera columna). */
  maximo?: number;
}

/** Nivel de color de 1 a 5 según la proporción del valor contra el máximo. */
export const nivel = (valor: number, maximo: number) => Math.min(5, Math.max(1, Math.ceil((valor / maximo) * 5)));

/**
 * Tabla real con color de fondo proporcional al valor. Al ser una tabla,
 * el teclado y los lectores de pantalla la recorren celda por celda; el número
 * siempre está escrito, el color sólo refuerza.
 */
export function MapaCalor({ titulo, filas, columnas, formato = String, maximo }: MapaCalorProps) {
  const tope = maximo ?? Math.max(...filas.flatMap((f) => f.valores.slice(1)), 1);
  return (
    <div className={estilos.contenedor} tabIndex={0} role="region" aria-label={`${titulo} (se desplaza horizontalmente)`}>
      <table className={estilos.tabla}>
        <caption className="solo-lectores">{titulo}</caption>
        <thead>
          <tr>
            <th scope="col">Cohorte</th>
            <th scope="col">Clientes</th>
            {columnas.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.etiqueta}>
              <th scope="row">{f.etiqueta}</th>
              <td className={estilos.total}>{f.total}</td>
              {columnas.map((c, i) => {
                const v = f.valores[i];
                if (v === undefined) return <td key={c} className={estilos.vacia} />;
                return (
                  <td key={c} className={`${estilos.celda} ${estilos[`nivel${nivel(i === 0 ? tope : v, tope)}`]}`}>
                    {formato(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className={estilos.escala} aria-hidden="true">
        Menos
        <span className={estilos.muestras}>
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={estilos[`nivel${n}`]} />
          ))}
        </span>
        Más
      </p>
    </div>
  );
}
