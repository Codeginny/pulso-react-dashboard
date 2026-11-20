import { useMutation } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { preguntar } from '../api/consultas';
import type { RespuestaAsistente } from '../api/tipos';
import { Boton, MensajeChat, Sugerencias } from '../design-system';
import { useFiltrosActuales } from '../store/hooks';
import estilos from './paginas.module.scss';

type Mensaje = { id: number; rol: 'usuario' } & { texto: string } | ({ id: number; rol: 'asistente' } & RespuestaAsistente);

const INICIALES = ['¿Cuánto facturamos?', '¿Qué segmento conviene reactivar?', '¿Cuáles son los productos más vendidos?', '¿Cuántos clientes vuelven a comprar?'];

export function Asistente() {
  const filtros = useFiltrosActuales();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const idCampo = useId();
  const final = useRef<HTMLDivElement>(null);
  const contador = useRef(0);

  const consulta = useMutation({
    mutationFn: (pregunta: string) => preguntar(pregunta, filtros),
    onSuccess: (r) => setMensajes((m) => [...m, { id: ++contador.current, rol: 'asistente', ...r }]),
    onError: (e) =>
      setMensajes((m) => [
        ...m,
        { id: ++contador.current, rol: 'asistente', texto: `No pude consultar los datos: ${e.message}`, consulta: 'error', tabla: null, sugerencias: [] },
      ]),
  });

  useEffect(() => {
    final.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
  }, [mensajes, consulta.isPending]);

  const enviar = (pregunta: string) => {
    const limpia = pregunta.trim();
    if (!limpia || consulta.isPending) return;
    setMensajes((m) => [...m, { id: ++contador.current, rol: 'usuario', texto: limpia }]);
    setTexto('');
    consulta.mutate(limpia);
  };

  const alEnviar = (e: FormEvent) => {
    e.preventDefault();
    enviar(texto);
  };

  const ultima = [...mensajes].reverse().find((m) => m.rol === 'asistente') as (Mensaje & { rol: 'asistente' }) | undefined;

  return (
    <div className={estilos.chat}>
      <p className={estilos.aviso}>
        El asistente responde con las mismas consultas GraphQL que usa el tablero y respeta los filtros de período y región. Reconoce preguntas
        frecuentes; no inventa datos.
      </p>

      {/* role="log" anuncia cada respuesta nueva sin mover el foco. */}
      <ol className={estilos.mensajes} role="log" aria-live="polite" aria-label="Conversación">
        {mensajes.map((m) =>
          m.rol === 'usuario' ? (
            <MensajeChat key={m.id} rol="usuario">
              <p>{m.texto}</p>
            </MensajeChat>
          ) : (
            <MensajeChat key={m.id} rol="asistente" detalle={m.consulta !== 'sin consulta' && m.consulta !== 'error' ? <code>{m.consulta}</code> : undefined}>
              <p>{m.texto}</p>
              {m.tabla && (
                <div className={estilos.tablaChatContenedor}>
                  <table className={estilos.tablaChat}>
                    <thead>
                      <tr>
                        {m.tabla.columnas.map((c) => (
                          <th key={c} scope="col">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {m.tabla.filas.map((f) => (
                        <tr key={f[0]}>
                          {f.map((v, i) => (
                            <td key={i}>{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </MensajeChat>
          ),
        )}
        {consulta.isPending && (
          <MensajeChat rol="asistente">
            <p>Consultando los datos…</p>
          </MensajeChat>
        )}
      </ol>
      <div ref={final} />

      <Sugerencias opciones={ultima?.sugerencias.length ? ultima.sugerencias : INICIALES} onElegir={enviar} deshabilitadas={consulta.isPending} />

      <form className={estilos.formulario} onSubmit={alEnviar}>
        <label htmlFor={idCampo} className="solo-lectores">
          Escribí tu pregunta
        </label>
        <input
          id={idCampo}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Preguntá por ingresos, segmentos, productos, retención…"
          maxLength={300}
          autoComplete="off"
        />
        <Boton type="submit" cargando={consulta.isPending} disabled={!texto.trim()}>
          Preguntar
        </Boton>
      </form>
    </div>
  );
}
