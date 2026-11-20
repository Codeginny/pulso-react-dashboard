import type { ReactNode } from 'react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import estilos from './Graficos.module.scss';

/**
 * Envoltorios de Recharts con los tokens del design system.
 * Cada gráfico lleva una tabla equivalente oculta a la vista: un lector de
 * pantalla no puede recorrer un SVG, pero sí una tabla (WCAG 1.1.1).
 * initialDimension permite que el servidor pinte el SVG antes de medir el contenedor.
 */

interface TablaAccesibleProps {
  titulo: string;
  columnas: string[];
  filas: (string | number)[][];
}

export function TablaAccesible({ titulo, columnas, filas }: TablaAccesibleProps) {
  return (
    <table className="solo-lectores">
      <caption>{titulo}</caption>
      <thead>
        <tr>
          {columnas.map((c) => (
            <th key={c} scope="col">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filas.map((f, i) => (
          <tr key={i}>
            {f.map((v, j) => (j === 0 ? <th key={j} scope="row">{v}</th> : <td key={j}>{v}</td>))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Lienzo({ alto, descripcion, children }: { alto: number; descripcion: string; children: ReactNode }) {
  return (
    <div className={estilos.lienzo} style={{ height: alto }} role="img" aria-label={descripcion}>
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 720, height: alto }}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

const ejes = {
  tick: { fill: 'var(--color-texto-suave)', fontSize: 12 },
  axisLine: false,
  tickLine: false,
} as const;

const estiloTooltip = {
  contentStyle: {
    background: 'var(--color-superficie)',
    border: '1px solid var(--color-borde)',
    borderRadius: 10,
    color: 'var(--color-texto)',
    fontSize: 13,
  },
  labelStyle: { color: 'var(--color-texto)', fontWeight: 600 },
  cursor: { fill: 'var(--color-superficie-2)' },
};

export interface Serie<T> {
  clave: keyof T & string;
  nombre: string;
  tipo: 'area' | 'barra' | 'linea';
  /** Índice del color de la paleta de gráficos (1 a 3). */
  color?: 1 | 2 | 3;
  ejeDerecho?: boolean;
}

export interface GraficoTendenciaProps<T> {
  titulo: string;
  datos: T[];
  claveX: keyof T & string;
  series: Serie<T>[];
  formatoX?: (v: string) => string;
  formatoY?: (v: number) => string;
  formatoYDerecho?: (v: number) => string;
  alto?: number;
}

export function GraficoTendencia<T extends object>({
  titulo,
  datos,
  claveX,
  series,
  formatoX = String,
  formatoY = String,
  formatoYDerecho = String,
  alto = 280,
}: GraficoTendenciaProps<T>) {
  const conDerecho = series.some((s) => s.ejeDerecho);
  return (
    <figure className={estilos.figura}>
      <Lienzo alto={alto} descripcion={`${titulo}. Los datos están en la tabla siguiente.`}>
        <ComposedChart data={datos} margin={{ top: 8, right: conDerecho ? 0 : 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="relleno-1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--grafico-1)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--grafico-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--grafico-grilla)" />
          <XAxis dataKey={claveX} tickFormatter={formatoX} {...ejes} minTickGap={16} />
          <YAxis yAxisId="izq" tickFormatter={formatoY} {...ejes} width={64} />
          {conDerecho && <YAxis yAxisId="der" orientation="right" tickFormatter={formatoYDerecho} {...ejes} width={48} />}
          <Tooltip
            {...estiloTooltip}
            labelFormatter={(v) => formatoX(String(v))}
            formatter={(v, nombre) => {
              const s = series.find((x) => x.nombre === nombre);
              return [(s?.ejeDerecho ? formatoYDerecho : formatoY)(Number(v)), nombre];
            }}
          />
          {series.map((s) => {
            const color = `var(--grafico-${s.color ?? 1})`;
            const comun = { dataKey: s.clave, name: s.nombre, yAxisId: s.ejeDerecho ? 'der' : 'izq', isAnimationActive: false };
            if (s.tipo === 'barra') return <Bar key={s.clave} {...comun} fill={color} radius={[4, 4, 0, 0]} maxBarSize={18} />;
            if (s.tipo === 'linea') return <Line key={s.clave} {...comun} stroke={color} strokeWidth={2} dot={false} />;
            return <Area key={s.clave} {...comun} stroke={color} strokeWidth={2} fill="url(#relleno-1)" />;
          })}
        </ComposedChart>
      </Lienzo>
      <figcaption className={estilos.leyenda}>
        {series.map((s) => (
          <span key={s.clave} className={estilos.item}>
            <span className={estilos.muestra} style={{ background: `var(--grafico-${s.color ?? 1})` }} aria-hidden="true" />
            {s.nombre}
          </span>
        ))}
      </figcaption>
      <TablaAccesible
        titulo={titulo}
        columnas={[String(claveX), ...series.map((s) => s.nombre)]}
        filas={datos.map((d) => [formatoX(String(d[claveX] as unknown)), ...series.map((s) => (s.ejeDerecho ? formatoYDerecho : formatoY)(Number(d[s.clave] as unknown)))])}
      />
    </figure>
  );
}

export interface GraficoBarrasProps {
  titulo: string;
  datos: { etiqueta: string; valor: number }[];
  formato?: (v: number) => string;
  alto?: number;
}

/** Barras horizontales: mejor que una torta para comparar más de tres categorías. */
export function GraficoBarras({ titulo, datos, formato = String, alto }: GraficoBarrasProps) {
  const h = alto ?? Math.max(160, datos.length * 36);
  return (
    <figure className={estilos.figura}>
      <Lienzo alto={h} descripcion={`${titulo}. Los datos están en la tabla siguiente.`}>
        <BarChart data={datos} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke="var(--grafico-grilla)" />
          <XAxis type="number" tickFormatter={formato} {...ejes} />
          <YAxis type="category" dataKey="etiqueta" {...ejes} width={128} />
          <Tooltip {...estiloTooltip} formatter={(v) => [formato(Number(v)), 'Valor']} />
          <Bar dataKey="valor" fill="var(--grafico-1)" radius={[0, 4, 4, 0]} maxBarSize={20} isAnimationActive={false} />
        </BarChart>
      </Lienzo>
      <TablaAccesible titulo={titulo} columnas={['Categoría', 'Valor']} filas={datos.map((d) => [d.etiqueta, formato(d.valor)])} />
    </figure>
  );
}

export interface GraficoParetoProps {
  curva: { clientes: number; ingresos: number }[];
  alto?: number;
}

export function GraficoPareto({ curva, alto = 220 }: GraficoParetoProps) {
  const top20 = curva.find((p) => p.clientes === 20)?.ingresos ?? 0;
  return (
    <figure className={estilos.figura}>
      <Lienzo alto={alto} descripcion={`Curva de concentración: el 20 % de los clientes genera el ${top20} % de los ingresos.`}>
        <LineChart data={curva} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--grafico-grilla)" vertical={false} />
          <XAxis dataKey="clientes" type="number" domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tickFormatter={(v) => `${v} %`} {...ejes} />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v} %`} {...ejes} width={48} />
          <Tooltip {...estiloTooltip} labelFormatter={(v) => `${v} % de los clientes`} formatter={(v) => [`${v} %`, 'de los ingresos']} />
          <ReferenceLine x={20} stroke="var(--grafico-2)" strokeDasharray="4 4" />
          <ReferenceLine y={top20} stroke="var(--grafico-2)" strokeDasharray="4 4" />
          <Line dataKey="ingresos" stroke="var(--grafico-1)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </Lienzo>
      <TablaAccesible
        titulo="Concentración de ingresos"
        columnas={['% de clientes', '% de ingresos']}
        filas={curva.filter((p) => p.clientes % 10 === 0).map((p) => [`${p.clientes} %`, `${p.ingresos} %`])}
      />
    </figure>
  );
}
