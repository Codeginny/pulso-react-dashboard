import { useQuery } from '@tanstack/react-query';
import { consultas } from '../api/consultas';
import { Alerta, Esqueleto, MapaCalor, Tarjeta, TarjetaKpi } from '../design-system';
import { entero, mes } from '../lib/formato';
import { useFiltrosActuales } from '../store/hooks';
import estilos from './paginas.module.scss';

const promedio = (cohortes: { retencion: number[] }[], i: number) => {
  const con = cohortes.filter((c) => c.retencion.length > i);
  return con.length ? con.reduce((s, c) => s + c.retencion[i]!, 0) / con.length : 0;
};

const NOTA = 'Promedio de las cohortes con ese mes cumplido';

const pct = (v: number) => `${v.toLocaleString('es-AR', { maximumFractionDigits: 1 })} %`;

export function Retencion() {
  const { region } = useFiltrosActuales();
  const { data, isError, refetch } = useQuery(consultas.cohortes(region));

  if (isError) return <Alerta titulo="No pudimos cargar las cohortes" onReintentar={() => refetch()} />;

  const columnas = Array.from({ length: 12 }, (_, i) => `Mes ${i}`);

  return (
    <>
      <section aria-label="Retención promedio" className={estilos.resumenCohortes}>
        {data ? (
          <>
            <TarjetaKpi etiqueta="Vuelven al mes siguiente" valor={pct(promedio(data, 1))} destacada sinComparacion={NOTA} />
            <TarjetaKpi etiqueta="Siguen activos al mes 3" valor={pct(promedio(data, 3))} sinComparacion={NOTA} />
            <TarjetaKpi etiqueta="Siguen activos al mes 6" valor={pct(promedio(data, 6))} sinComparacion={NOTA} />
            <TarjetaKpi etiqueta="Clientes nuevos analizados" valor={entero(data.reduce((s, c) => s + c.clientes, 0))} sinComparacion="Primera compra entre dic 2010 y nov 2011" />
          </>
        ) : (
          Array.from({ length: 4 }, (_, i) => <Esqueleto key={i} alto={96} />)
        )}
      </section>

      <Tarjeta
        titulo="Retención por cohorte"
        descripcion="Cada fila agrupa a los clientes por el mes de su primera compra. Cada celda dice qué porcentaje volvió a comprar N meses después."
      >
        {data ? (
          <MapaCalor
            titulo="Retención por cohorte de primera compra"
            columnas={columnas}
            filas={data.map((c) => ({ etiqueta: mes(c.mes), total: entero(c.clientes), valores: c.retencion }))}
            formato={pct}
          />
        ) : (
          <Esqueleto alto={360} />
        )}
      </Tarjeta>

      <p className={estilos.pie}>
        Se muestran las cohortes desde diciembre de 2010: el dataset empieza en diciembre de 2009, así que antes no se puede distinguir un cliente
        nuevo de uno que ya compraba.
      </p>
    </>
  );
}
