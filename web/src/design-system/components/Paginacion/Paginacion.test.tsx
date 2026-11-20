import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Paginacion } from './Paginacion';

describe('Paginacion', () => {
  it('informa el rango visible y deshabilita "Anterior" en la primera página', () => {
    render(<Paginacion pagina={1} porPagina={10} total={5824} onCambio={() => {}} />);
    expect(screen.getByText('1–10 de 5.824')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(screen.getByText('Página 1 de 583')).toBeInTheDocument();
  });

  it('avanza de página', async () => {
    const onCambio = jest.fn();
    render(<Paginacion pagina={2} porPagina={10} total={25} onCambio={onCambio} />);
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(onCambio).toHaveBeenCalledWith(3);
  });

  it('deshabilita "Siguiente" en la última página', () => {
    render(<Paginacion pagina={3} porPagina={10} total={25} onCambio={() => {}} />);
    expect(screen.getByText('21–25 de 25')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  });
});
