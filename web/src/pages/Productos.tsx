import { useQuery } from '@tanstack/react-query';
import { consultas } from '../api/consultas';
import type { Pais, Producto } from '../api/tipos';
import { Alerta, Esqueleto, GraficoBarras, TablaDatos, Tarjeta, type Columna } from '../design-system';
import { entero, moneda, monedaCompacta } from '../lib/formato';
import { useFiltrosActuales } from '../store/hooks';
import estilos from './paginas.module.scss';

const COLUMNAS_PRODUCTOS: Columna<Producto>[] = [
  { clave: 'descripcion', titulo: 'Producto', render: (p) => <span className={estilos.descripcionProducto}>{p.descripcion}</span> },
  { clave: 'codigo', titulo: 'Código', render: (p) => p.codigo },
  { clave: 'unidades', titulo: 'Unidades', render: (p) => entero(p.unidades), alinear: 'derecha' },
  { clave: 'clientes', titulo: 'Clientes', render: (p) => entero(p.clientes), alinear: 'derecha' },
  { clave: 'ingresos', titulo: 'Ingresos', render: (p) => moneda(p.ingresos), alinear: 'derecha' },
];

const COLUMNAS_PAISES: Columna<Pais>[] = [
  { clave: 'nombre', titulo: 'País', render: (p) => p.nombre },
  { clave: 'clientes', titulo: 'Clientes', render: (p) => entero(p.clientes), alinear: 'derecha' },
  { clave: 'pedidos', titulo: 'Pedidos', render: (p) => entero(p.pedidos), alinear: 'derecha' },
  { clave: 'ticket', titulo: 'Ticket promedio', render: (p) => moneda(p.ingresos / p.pedidos), alinear: 'derecha' },
  { clave: 'ingresos', titulo: 'Ingresos', render: (p) => moneda(p.ingresos), alinear: 'derecha' },
];

export function Productos() {
  const filtros = useFiltrosActuales();
  const { data, isError, isFetching, refetch } = useQuery(consultas.productosPaises(filtros));

  if (isError) return <Alerta titulo="No pudimos cargar productos y países" onReintentar={() => refetch()} />;

  return (
    <>
      <div className={estilos.grillaDoble}>
        <Tarjeta titulo="Los 10 productos con más ingresos">
          {data ? (
            <GraficoBarras
              titulo="Los 10 productos con más ingresos"
              datos={data.productos.map((p) => ({ etiqueta: p.descripcion.length > 22 ? `${p.descripcion.slice(0, 21)}…` : p.descripcion, valor: p.ingresos }))}
              formato={monedaCompacta}
            />
          ) : (
            <Esqueleto alto={360} />
          )}
        </Tarjeta>
        <Tarjeta titulo="Países" descripcion="Los clientes internacionales hacen menos pedidos pero de mayor monto.">
          <TablaDatos
            titulo="Países por ingresos"
            columnas={COLUMNAS_PAISES}
            filas={data?.paises ?? []}
            claveFila={(p) => p.nombre}
            cargando={isFetching}
            vacio="Cargando países…"
          />
        </Tarjeta>
      </div>
      <Tarjeta titulo="Detalle de productos">
        <TablaDatos
          titulo="Productos por ingresos"
          columnas={COLUMNAS_PRODUCTOS}
          filas={data?.productos ?? []}
          claveFila={(p) => p.codigo}
          cargando={isFetching}
          vacio="Cargando productos…"
        />
      </Tarjeta>
    </>
  );
}
