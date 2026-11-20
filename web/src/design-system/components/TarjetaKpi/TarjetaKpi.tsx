import { variacion as formatearVariacion } from '../../../lib/formato';
import estilos from './TarjetaKpi.module.scss';

export interface TarjetaKpiProps {
  etiqueta: string;
  valor: string;
  /** Variación relativa contra el período anterior (0.1 = +10 %). */
  variacion?: number | null;
  /** Si es falso, subir es malo (devoluciones, costos). Cambia el color, no el signo. */
  mejorSiSube?: boolean;
  comparaCon?: string | null;
  destacada?: boolean;
  /** Texto cuando no hay variación (por qué no se compara). */
  sinComparacion?: string;
}

export function TarjetaKpi({ etiqueta, valor, variacion, mejorSiSube = true, comparaCon, destacada = false, sinComparacion = 'Sin período de comparación' }: TarjetaKpiProps) {
  const hayVariacion = variacion !== null && variacion !== undefined;
  const sube = hayVariacion && variacion > 0;
  const plana = hayVariacion && Math.abs(variacion) < 0.0005;
  const buena = plana ? null : sube === mejorSiSube;
  const tono = buena === null ? estilos.neutra : buena ? estilos.buena : estilos.mala;

  return (
    <article className={`${estilos.kpi} ${destacada ? estilos.destacada : ''}`}>
      <h3 className={estilos.etiqueta}>{etiqueta}</h3>
      <p className={estilos.valor}>{valor}</p>
      {hayVariacion ? (
        <p className={estilos.pie}>
          <span className={`${estilos.variacion} ${tono}`}>
            <span aria-hidden="true">{plana ? '→' : sube ? '▲' : '▼'}</span>
            <span className="solo-lectores">{plana ? 'Sin cambios: ' : sube ? 'Subió ' : 'Bajó '}</span>
            {formatearVariacion(variacion)}
            {buena !== null && <span className="solo-lectores">{buena ? ', buena señal' : ', señal de alerta'}</span>}
          </span>{' '}
          <span className={estilos.comparacion}>vs. {comparaCon ?? 'período anterior'}</span>
        </p>
      ) : (
        <p className={`${estilos.pie} ${estilos.comparacion}`}>{sinComparacion}</p>
      )}
    </article>
  );
}
