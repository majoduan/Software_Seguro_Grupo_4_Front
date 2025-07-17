import { API } from './userAPI';
import { Periodo, PeriodoCreate } from '../interfaces/periodo';

export const periodoAPI = {
  // Obtener todos los periodos
  getPeriodos: async (): Promise<Periodo[]> => {
    const response = await API.get<Periodo[]>('/periodos/');
    return response.data;
  },

  // Obtener un periodo específico
  getPeriodo: async (id: string): Promise<Periodo> => {
    const response = await API.get<Periodo>(`/periodos/${id}`);
    return response.data as Periodo;
  },

  // Crear un nuevo periodo
  crearPeriodo: async (periodoData: PeriodoCreate): Promise<Periodo> => {
    const response = await API.post('/periodos/', periodoData);
    return response.data as Periodo;
  },

  // Actualizar un periodo existente
  actualizarPeriodo: async (id: string, periodoData: PeriodoCreate): Promise<Periodo> => {
    const response = await API.put(`/periodos/${id}`, periodoData);
    return response.data as Periodo;
  },

  // Eliminar un periodo
  eliminarPeriodo: async (id: string): Promise<void> => {
    await API.delete(`/periodos/${id}`);
  }
};