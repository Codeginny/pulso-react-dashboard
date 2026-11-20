import { useQuery } from '@tanstack/react-query';
import { consultas } from '../api/consultas';
import { Alerta, Esqueleto, GraficoBarras, GraficoPareto, GraficoTendencia, Tarjeta, TarjetaKpi } from '../design-system';
import { entero, formatearKpi, mes, monedaCompacta } from '../lib/formato';
import { useFiltrosActuales } from '../store/hooks';
import estilos from './paginas.module.scss';

const PRINCIPALES = ['ingresos', 'pedidos', 'clientes', 'ticket_promedio'];

export function Resumen() {
  const filtros = useFiltrosActuales();
  const resumen = useQuery(consultas.resumen(filtros));
  const pareto = useQuery(consultas.pareto(filtros.region));
  const rankings = useQuery(consultas.productosPaises(filtros));

  if (resumen.isError) {
    return <Alerta titulo="No pudimos cargar el resumen" onReintentar={() => resumen.refetch()}>{resumen.error.message}</Alerta>;
  }

  const datos = resumen.data;
  const principales = datos?.kpis.filter((k) => PRINCIPALES.includes(k.clave)) ?? [];
  const secundarios = datos?.kpis.filter((k) => !PRINCIPALES.includes(k.clave)) ?? [];

  return (
    <>
      <p className={estilos.bajada} aria-live="polite">
        {datos
          ? `${datos.periodo.etiqueta}: ${mes(datos.periodo.desde)} a ${mes(datos.periodo.hasta)}${datos.periodo.comparaCon ? `, comparado con ${datos.periodo.comparaCon}` : ''}.`
          : 'Cargando período…'}
      </p>

      <section aria-label="Indicadores principales" className={estilos.kpis}>
        {datos
          ? principales.map((k, i) => (
              <TarjetaKpi
                key={k.clave}
                etiqueta={k.etiqueta}
                valor={formatearKpi(k.valor, k.formato)}
                variacion={k.variacion}
                mejorSiSube={k.mejorSiSube}
                comparaCon={datos.periodo.comparaCon}
                destacada={i === 0}
              />
            ))
          : Array.from({ length: 4 }, (_, i) => <Esqueleto key={i} alto={112} />)}
      </section>

      <div className={estilos.grillaPrincipal}>
        <Tarjeta titulo="Ingresos y clientes nuevos por mes" descripcion="Los picos de septiembre a noviembre son las compras de los comercios para las fiestas.">
          {datos ? (
            <GraficoTendencia
              titulo="Ingresos y clientes nuevos por mes"
              datos={datos.serie}
              claveX="mes"
              series={[
                { clave: 'ingresos', nombre: 'Ingresos', tipo: 'area', color: 1 },
                { clave: 'clientesNuevos', nombre: 'Clientes nuevos', tipo: 'barra', color: 2, ejeDerecho: true },
              ]}
              formatoX={(v) => mes(v, true)}
              formatoY={monedaCompacta}
              formatoYDerecho={entero}
            />
          ) : (
            <Esqueleto alto={280} />
          )}
        </Tarjeta>

        <div className={estilos.columna}>
          {secundarios.map((k) => (
            <TarjetaKpi
              key={k.clave}
              etiqueta={k.etiqueta}
              valor={formatearKpi(k.valor, k.formato)}
              variacion={k.variacion}
              mejorSiSube={k.mejorSiSube}
              comparaCon={datos?.periodo.comparaCon}
              sinComparacion={
                k.clave === 'clientes_nuevos' && datos?.periodo.comparaCon
                  ? 'Sin comparación: antes de dic 2009 no hay historia'
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      <div className={estilos.grillaDoble}>
        <Tarjeta
          titulo="Concentración de ingresos"
          descripcion={
            pareto.data ? (
              <>
                El 20 % de los clientes genera el <strong>{pareto.data.top20.toLocaleString('es-AR')} %</strong> de los ingresos (historial completo).
              </>
            ) : undefined
          }
        >
          {pareto.data ? <GraficoPareto curva={pareto.data.curva} /> : <Esqueleto alto={220} />}
        </Tarjeta>

        <Tarjeta titulo="Países con más ingresos" descripcion="En el período y la región elegidos.">
          {rankings.data ? (
            <GraficoBarras
              titulo="Países con más ingresos"
              datos={rankings.data.paises.slice(0, 6).map((p) => ({ etiqueta: p.nombre, valor: p.ingresos }))}
              formato={monedaCompacta}
            />
          ) : (
            <Esqueleto alto={220} />
          )}
        </Tarjeta>
      </div>

      <p className={estilos.pie}>Fuente: Online Retail II (UCI). Ventas sin devoluciones, cargos de envío ni ajustes contables.</p>
    </>
  );
}
