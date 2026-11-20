import { render, screen } from '@testing-library/react';
import { TarjetaKpi } from './TarjetaKpi';

describe('TarjetaKpi', () => {
  it('muestra el valor y la variación con su comparación', () => {
    render(<TarjetaKpi etiqueta="Ingresos" valor="£ 8.225.000" variacion={0.034} comparaCon="dic 2009 – nov 2010" />);
    expect(screen.getByRole('heading', { name: 'Ingresos' })).toBeInTheDocument();
    expect(screen.getByText('£ 8.225.000')).toBeInTheDocument();
    expect(screen.getByText(/\+3,4/)).toBeInTheDocument();
    expect(screen.getByText('vs. dic 2009 – nov 2010')).toBeInTheDocument();
  });

  it('anuncia a los lectores de pantalla si el cambio es bueno o malo, no sólo con color', () => {
    const { rerender } = render(<TarjetaKpi etiqueta="Ingresos" valor="1" variacion={0.1} />);
    expect(screen.getByText(/Subió/)).toBeInTheDocument();
    expect(screen.getByText(/buena señal/)).toBeInTheDocument();

    rerender(<TarjetaKpi etiqueta="Devoluciones" valor="1" variacion={0.1} mejorSiSube={false} />);
    expect(screen.getByText(/señal de alerta/)).toBeInTheDocument();
  });

  it('explica por qué no hay comparación', () => {
    render(<TarjetaKpi etiqueta="Clientes nuevos" valor="1.585" variacion={null} sinComparacion="Sin historia previa" />);
    expect(screen.getByText('Sin historia previa')).toBeInTheDocument();
  });
});
