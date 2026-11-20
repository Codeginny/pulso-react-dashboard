import { entero } from '../../../lib/formato';
import { Boton } from '../Boton/Boton';
import estilos from './Paginacion.module.scss';

export interface PaginacionProps {
  pagina: number;
  porPagina: number;
  total: number;
  onCambio: (pagina: number) => void;
}

export function Paginacion({ pagina, porPagina, total, onCambio }: PaginacionProps) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const desde = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const hasta = Math.min(pagina * porPagina, total);
  return (
    <nav className={estilos.paginacion} aria-label="Paginación">
      <p aria-live="polite">
        {entero(desde)}–{entero(hasta)} de {entero(total)}
      </p>
      <div className={estilos.botones}>
        <Boton variante="secundario" tamanio="s" disabled={pagina <= 1} onClick={() => onCambio(pagina - 1)}>
          Anterior
        </Boton>
        <span className={estilos.pagina}>
          Página {pagina} de {entero(paginas)}
        </span>
        <Boton variante="secundario" tamanio="s" disabled={pagina >= paginas} onClick={() => onCambio(pagina + 1)}>
          Siguiente
        </Boton>
      </div>
    </nav>
  );
}
