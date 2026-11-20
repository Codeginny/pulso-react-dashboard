import type { ReactNode } from 'react';
import { Boton } from '../Boton/Boton';
import estilos from './Estados.module.scss';

/** Marcador de carga con la forma del contenido que viene, para que la página no salte. */
export function Esqueleto({ alto = 16, ancho = '100%', lineas = 1 }: { alto?: number; ancho?: number | string; lineas?: number }) {
  return (
    <div className={estilos.esqueletos} aria-hidden="true">
      {Array.from({ length: lineas }, (_, i) => (
        <span key={i} className={estilos.esqueleto} style={{ height: alto, width: i === lineas - 1 && lineas > 1 ? '60%' : ancho }} />
      ))}
    </div>
  );
}

export function EstadoVacio({ titulo, children, accion }: { titulo: string; children?: ReactNode; accion?: ReactNode }) {
  return (
    <div className={estilos.vacio}>
      <p className={estilos.tituloVacio}>{titulo}</p>
      {children && <p className={estilos.texto}>{children}</p>}
      {accion}
    </div>
  );
}

export function Alerta({ titulo, children, onReintentar }: { titulo: string; children?: ReactNode; onReintentar?: () => void }) {
  return (
    <div role="alert" className={estilos.alerta}>
      <div>
        <p className={estilos.tituloAlerta}>{titulo}</p>
        {children && <p className={estilos.texto}>{children}</p>}
      </div>
      {onReintentar && (
        <Boton variante="secundario" tamanio="s" onClick={onReintentar}>
          Reintentar
        </Boton>
      )}
    </div>
  );
}
