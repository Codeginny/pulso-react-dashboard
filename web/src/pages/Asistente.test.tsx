import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoreProvider } from '../store/StoreProvider';
import { Asistente } from './Asistente';

function renderizar() {
  const cliente = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={cliente}>
      <StoreProvider filtros={{ periodo: 'ULTIMOS_3_MESES', region: 'REINO_UNIDO' }} preferencias={{ tema: 'sistema', densidad: 'comoda' }}>
        <Asistente />
      </StoreProvider>
    </QueryClientProvider>,
  );
}

const respuesta = (preguntar: object) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ data: { preguntar } }) } as Response);

describe('Asistente', () => {
  afterEach(() => jest.restoreAllMocks());

  it('envía la pregunta con los filtros activos y muestra la respuesta con su consulta', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(() =>
      respuesta({ texto: 'Se facturaron £ 2.569.083.', consulta: 'resumen(...)', tabla: null, sugerencias: ['¿Cuál fue el mejor mes?'] }),
    );
    renderizar();

    await userEvent.type(screen.getByLabelText('Escribí tu pregunta'), '¿Cuánto facturamos?');
    await userEvent.click(screen.getByRole('button', { name: 'Preguntar' }));

    expect(await screen.findByText('Se facturaron £ 2.569.083.')).toBeInTheDocument();
    const cuerpo = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);
    expect(cuerpo.variables).toEqual({ pregunta: '¿Cuánto facturamos?', filtros: { periodo: 'ULTIMOS_3_MESES', region: 'REINO_UNIDO' } });
    expect(screen.getByText('Cómo lo calculé')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '¿Cuál fue el mejor mes?' })).toBeInTheDocument();
  });

  it('la conversación es una región log para que se anuncien las respuestas', () => {
    renderizar();
    expect(screen.getByRole('log', { name: 'Conversación' })).toHaveAttribute('aria-live', 'polite');
  });

  it('muestra un mensaje claro si la API falla', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('sin conexión'));
    renderizar();
    await userEvent.click(screen.getByRole('button', { name: '¿Cuánto facturamos?' }));
    expect(await screen.findByText(/No pude consultar los datos: sin conexión/)).toBeInTheDocument();
  });

  it('no deja enviar una pregunta vacía', () => {
    renderizar();
    expect(screen.getByRole('button', { name: 'Preguntar' })).toBeDisabled();
  });
});
