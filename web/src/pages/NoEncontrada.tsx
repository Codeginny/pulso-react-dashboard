import { Link } from 'react-router-dom';
import estilos from './paginas.module.scss';

export function NoEncontrada() {
  return (
    <div className={estilos.noEncontrada}>
      <p>La dirección no corresponde a ninguna sección del tablero.</p>
      <Link to="/">Volver al resumen</Link>
    </div>
  );
}
