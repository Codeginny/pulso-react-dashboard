import { useQuery } from '@tanstack/react-query';
import { useEffect, useId, useState } from 'react';
import { consultas } from '../api/consultas';
import type { Cliente, OrdenClientes } from '../api/tipos';
import { Alerta, Esqueleto, Etiqueta, Paginacion, TablaDatos, Tarjeta, type Columna, type TonoEtiqueta } from '../design-system';
import { entero, moneda, porcentaje } from '../lib/formato';
import { useFiltrosActuales } from '../store/hooks';
import estilos from './paginas.module.scss';

export const CLIENTES_INICIAL = { segmento: null, busqueda: '', orden: 'INGRESOS_DESC' as OrdenClientes, pagina: 1 };

export const TONO_SEGMENTO: Record<string, TonoEtiqueta> = {
  Campeones: 'primario',
  Leales: 'primario',
  Potenciales: 'exito',
  Nuevos: 'exito',
  'No se pueden perder': 'peligro',
  'En riesgo': 'peligro',
  Hibernando: 'acento',
  Perdidos: 'neutro',
};

function useRetrasado<T>(valor: T, ms = 300) {
  const [retrasado, setRetrasado] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setRetrasado(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return retrasado;
}

const COLUMNAS: Columna<Cliente>[] = [
  { clave: 'id', titulo: 'Cliente', render: (c) => `#${c.id}` },
  { clave: 'pais', titulo: 'País', render: (c) => c.pais },
  { clave: 'segmento', titulo: 'Segmento', render: (c) => <Etiqueta tono={TONO_SEGMENTO[c.segmento]}>{c.segmento}</Etiqueta> },
  { clave: 'rfm', titulo: 'RFM', render: (c) => c.puntajeRfm, alinear: 'derecha' },
  { clave: 'recencia', titulo: 'Días sin comprar', render: (c) => entero(c.recencia), alinear: 'derecha', orden: 'RECENCIA_ASC' },
  { clave: 'frecuencia', titulo: 'Pedidos', render: (c) => entero(c.frecuencia), alinear: 'derecha', orden: 'FRECUENCIA_DESC' },
  { clave: 'monetario', titulo: 'Ingresos', render: (c) => moneda(c.monetario), alinear: 'derecha', orden: 'INGRESOS_DESC' },
];

export function Clientes() {
  const { region } = useFiltrosActuales();
  const [segmento, setSegmento] = useState<string | null>(CLIENTES_INICIAL.segmento);
  const [texto, setTexto] = useState('');
  const [orden, setOrden] = useState<OrdenClientes>(CLIENTES_INICIAL.orden);
  const [pagina, setPagina] = useState(1);
  const busqueda = useRetrasado(texto);
  const idBusqueda = useId();

  // Cualquier cambio de filtro vuelve a la primera página.
  useEffect(() => setPagina(1), [region, segmento, busqueda, orden]);

  const segmentos = useQuery(consultas.segmentos(region));
  const clientes = useQuery(consultas.clientes({ region, segmento, busqueda, orden, pagina }));

  return (
    <>
      <Tarjeta
        titulo="Segmentos RFM"
        descripcion="Cada cliente se puntúa de 1 a 4 en recencia, frecuencia y monto. Elegí un segmento para ver sus clientes."
      >
        {segmentos.isError ? (
          <Alerta titulo="No pudimos cargar los segmentos" onReintentar={() => segmentos.refetch()} />
        ) : (
          <ul className={estilos.segmentos}>
            {segmentos.data
              ? segmentos.data.map((s) => (
                  <li key={s.nombre}>
                    <button
                      type="button"
                      className={estilos.segmento}
                      aria-pressed={segmento === s.nombre}
                      onClick={() => setSegmento(segmento === s.nombre ? null : s.nombre)}
                    >
                      <span className={estilos.segmentoCabecera}>
                        {s.nombre}
                        <Etiqueta tono={TONO_SEGMENTO[s.nombre]}>{porcentaje(s.participacionIngresos)} ingresos</Etiqueta>
                      </span>
                      <span className={estilos.segmentoDato}>{entero(s.clientes)} clientes</span>
                      <span className={estilos.barra} aria-hidden="true">
                        <span style={{ width: `${Math.max(s.participacionIngresos * 100, 1)}%` }} />
                      </span>
                      <span className={estilos.segmentoTexto}>{s.accion}</span>
                    </button>
                  </li>
                ))
              : Array.from({ length: 8 }, (_, i) => (
                  <li key={i}>
                    <Esqueleto alto={140} />
                  </li>
                ))}
          </ul>
        )}
      </Tarjeta>

      <Tarjeta titulo={segmento ? `Clientes · ${segmento}` : 'Todos los clientes'} descripcion="Ordenados por el criterio elegido. Recencia contada al 01/12/2011.">
        <div className={estilos.herramientas}>
          <div className={estilos.busqueda}>
            <label htmlFor={idBusqueda}>Buscar por número de cliente o país</label>
            <input id={idBusqueda} type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ej.: 12347 o Alemania" />
          </div>
        </div>
        {clientes.isError ? (
          <Alerta titulo="No pudimos cargar los clientes" onReintentar={() => clientes.refetch()} />
        ) : (
          <>
            <TablaDatos
              titulo="Clientes"
              columnas={COLUMNAS}
              filas={clientes.data?.items ?? []}
              claveFila={(c) => c.id}
              ordenActual={orden}
              onOrdenar={(o) => setOrden(o as OrdenClientes)}
              cargando={clientes.isFetching}
              vacio={clientes.isPending ? 'Cargando clientes…' : 'Ningún cliente coincide con la búsqueda.'}
            />
            {clientes.data && (
              <Paginacion pagina={clientes.data.pagina} porPagina={clientes.data.porPagina} total={clientes.data.total} onCambio={setPagina} />
            )}
          </>
        )}
      </Tarjeta>
    </>
  );
}
