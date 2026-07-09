import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LogsCargaExcel from '../pages/LogsCargaExcel';
import { excelAPI } from '../api/excelAPI';

vi.mock('../api/excelAPI', () => ({
  excelAPI: {
    getLogsCargaExcel: vi.fn(),
  },
}));

describe('Componente LogsCargaExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el título y los filtros', () => {
    (excelAPI.getLogsCargaExcel as any).mockResolvedValueOnce([]);
    
    render(<LogsCargaExcel />);
    
    expect(screen.getByRole('heading', { name: /Logs de Carga de Excel/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Usuario/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Filtrar/i })).toBeInTheDocument();
  });

  it('debe cargar y mostrar los registros de auditoría desde el API', async () => {
    const mockLogs = [
      {
        id_log: 1,
        fecha_carga: '2024-03-15T10:00:00',
        usuario: 'jdoe',
        nombre_archivo: 'poa_2024.xlsx',
        estado: 'Exito',
        errores: null
      }
    ];
    (excelAPI.getLogsCargaExcel as any).mockResolvedValueOnce(mockLogs);

    render(<LogsCargaExcel />);

    await waitFor(() => {
      expect(screen.getByText('jdoe')).toBeInTheDocument();
      expect(screen.getByText('poa_2024.xlsx')).toBeInTheDocument();
      expect(screen.getByText('Exito')).toBeInTheDocument();
    });
  });

  it('debe aplicar filtrado por usuario correctamente', async () => {
    (excelAPI.getLogsCargaExcel as any).mockResolvedValueOnce([]);

    render(<LogsCargaExcel />);

    const userInput = screen.getByLabelText(/Usuario/i);
    const filterButton = screen.getByRole('button', { name: /Filtrar/i });

    fireEvent.change(userInput, { target: { value: 'admin' } });
    fireEvent.click(filterButton);

    await waitFor(() => {
      expect(excelAPI.getLogsCargaExcel).toHaveBeenCalledWith(
        expect.objectContaining({ usuario: 'admin' })
      );
    });
  });

  it('debe manejar la paginación correctamente', async () => {
    // Simulamos más de 10 registros para forzar paginación
    const mockLogs = Array.from({ length: 15 }, (_, i) => ({
      id_log: i,
      fecha_carga: '2024-03-15T10:00:00',
      usuario: `user${i}`,
      nombre_archivo: `file${i}.xlsx`,
      estado: 'Exito',
      errores: null
    }));
    
    (excelAPI.getLogsCargaExcel as any).mockResolvedValue(mockLogs);

    render(<LogsCargaExcel />);

    await waitFor(() => {
      expect(screen.getByText('user0')).toBeInTheDocument();
    });

    // Material-UI TablePagination usa title "Go to next page"
    const nextPageButton = screen.getByRole('button', { name: /Go to next page|Next page/i });
    fireEvent.click(nextPageButton);

    await waitFor(() => {
      expect(screen.getByText('user10')).toBeInTheDocument();
    });
  });
});
