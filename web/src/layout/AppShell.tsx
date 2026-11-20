import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ControlSegmentado, Selector } from '../design-system';
import { filtrosAUrl, PERIODOS, REGIONES, type Densidad, type Tema } from '../store/estado';
import { useFiltrosActuales } from '../store/hooks';
import { useFiltros, usePreferencias } from '../store/StoreProvider';
import { RUTAS, rutaPorPath } from '../rutas';
import estilos from './AppShell.module.scss';

const TEMAS: { valor: Tema; etiqueta: string }[] = [
  { valor: 'sistema', etiqueta: 'Tema del sistema' },
  { valor: 'claro', etiqueta: 'Tema claro' },
  { valor: 'oscuro', etiqueta: 'Tema oscuro' },
];

const DENSIDADES: { valor: Densidad; etiqueta: string }[] = [
  { valor: 'comoda', etiqueta: 'Cómoda' },
  { valor: 'compacta', etiqueta: 'Compacta' },
];

/** Copia los filtros a la URL sin agregar entradas al historial. */
function useSincronizarUrl() {
  const filtros = useFiltrosActuales();
  const { pathname, search } = useLocation();
  const navegar = useNavigate();
  useEffect(() => {
    const nuevo = filtrosAUrl(search, filtros);
    if (nuevo !== search) navegar({ pathname, search: nuevo }, { replace: true });
  }, [filtros, pathname, search, navegar]);
}

/** Al cambiar de página el foco va al título, como haría una navegación completa. */
function useFocoAlNavegar() {
  const { pathname } = useLocation();
  const titulo = useRef<HTMLHeadingElement>(null);
  const primera = useRef(true);
  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    titulo.current?.focus();
  }, [pathname]);
  return titulo;
}

export function AppShell() {
  const { pathname, search } = useLocation();
  const ruta = rutaPorPath(pathname);
  const { periodo, region } = useFiltrosActuales();
  const setPeriodo = useFiltros((s) => s.setPeriodo);
  const setRegion = useFiltros((s) => s.setRegion);
  const tema = usePreferencias((s) => s.tema);
  const densidad = usePreferencias((s) => s.densidad);
  const setTema = usePreferencias((s) => s.setTema);
  const setDensidad = usePreferencias((s) => s.setDensidad);
  const titulo = useFocoAlNavegar();
  useSincronizarUrl();

  useEffect(() => {
    document.title = `${ruta?.titulo ?? 'Página no encontrada'} · Pulso`;
  }, [ruta]);

  return (
    <div className={estilos.app}>
      <a href="#contenido" className={estilos.saltar}>
        Saltar al contenido
      </a>

      <aside className={estilos.lateral}>
        <p className={estilos.marca}>
          <span className={estilos.logo} aria-hidden="true">
            ◆
          </span>
          Pulso
        </p>
        <nav aria-label="Secciones">
          <ul className={estilos.menu}>
            {RUTAS.map((r) => (
              <li key={r.path}>
                <NavLink
                  to={{ pathname: r.path, search }}
                  end
                  className={({ isActive }) => `${estilos.enlace} ${isActive ? estilos.activo : ''}`}
                >
                  {r.titulo}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <details className={estilos.preferencias}>
          <summary>Tema y densidad</summary>
          <div className={estilos.opciones}>
            <Selector etiqueta="Tema" opciones={TEMAS} valor={tema} onCambio={setTema} />
            <ControlSegmentado etiqueta="Densidad de tablas" opciones={DENSIDADES} valor={densidad} onCambio={setDensidad} />
          </div>
        </details>
        <p className={estilos.fuente}>
          Datos reales: Online Retail II (UCI), e-commerce mayorista del Reino Unido. Montos en libras.
        </p>
      </aside>

      <div className={estilos.principal}>
        <header className={estilos.encabezado}>
          <h1 ref={titulo} tabIndex={-1} className={estilos.titulo}>
            {ruta?.titulo ?? 'Página no encontrada'}
          </h1>
          {ruta && (
            <div className={estilos.filtros} role="group" aria-label="Filtros">
              {ruta.usaPeriodo ? (
                <ControlSegmentado etiqueta="Período" opciones={PERIODOS} valor={periodo} onCambio={setPeriodo} />
              ) : (
                <p className={estilos.nota}>
                  <span className={estilos.notaEtiqueta}>Período</span>
                  Historial completo (dic 2009 – nov 2011)
                </p>
              )}
              <Selector etiqueta="Región" opciones={REGIONES} valor={region} onCambio={setRegion} />
            </div>
          )}
        </header>
        <main id="contenido" className={estilos.contenido}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
