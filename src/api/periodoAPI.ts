import { API } from './userAPI';
import { Periodo, PeriodoCreate } from '../interfaces/periodo';

export const periodoAPI = {
  // Obtener todos los periodos
  getPeriodos: async (): Promise<Periodo[]> => {
    const response = await API.get<Periodo[]>('/periodos/');
    return response.data;
  },

  // Obtener un periodo específico
  /**
 * Función: getPeriodos
 * Objetivo:
 *   - Obtener la lista de todos los periodos registrados en el sistema.
 *
 * Operación:
 *   - Método HTTP: GET
 *   - Endpoint: "/periodos/"
 *   - Autenticación: Sí – Token JWT enviado por defecto mediante `API`
 *
 * Parámetros: Ninguno
 *
 * Respuesta esperada:
 *   - Tipo: Periodo[]
 *   - Estructura: Lista de objetos de tipo Periodo
 * 
 */

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