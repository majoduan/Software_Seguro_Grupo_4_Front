import { API } from './userAPI';
import { Actividad, ActividadCreate } from '../interfaces/actividad';

export const actividadAPI = {
    
    // Obtener actividades por POA
    getActividadesPorPOA: async (idPoa: string): Promise<Actividad[]> => {
        try {
            const response = await API.get(`/poas/${idPoa}/actividades`);
            return response.data as Actividad[];
        } catch (error) {
            throw error;
        }
    },


    /**
     * Crear actividades en lote para un POA
     * 
     * Objetivo:
     *     Permitir la creación masiva de actividades asociadas a un POA específico,
     *     facilitando la gestión de registros relacionados en el sistema.
     * 
     * Parámetros:
     *     - idPoa (string): Identificador del POA al que se asociarán las actividades.
     *     - actividades (ActividadCreate[]): Lista de objetos con la información de cada actividad.
     * 
     * Operación:
     *     - Envía una solicitud HTTP POST al backend con los datos de las actividades.
     *     - El servidor debe validar que el usuario tenga permisos adecuados para insertar.
     * 
     * Retorna:
     *     - Objeto con la respuesta del servidor (puede incluir confirmación o datos creados).
     */


    crearActividadesPorPOA: async (idPoa: string, actividades: ActividadCreate[]): Promise<any> => {
        try {
            const response = await API.post(`/poas/${idPoa}/actividades`, {
                actividades: actividades
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Eliminar una actividad
     * 
     * Objetivo:
     *     Permitir la eliminación de una actividad específica del sistema, 
     *     junto con sus posibles dependencias (tareas).
     * 
     * Parámetros:
     *     - idActividad (string): Identificador único de la actividad a eliminar.
     * 
     * Operación:
     *     - Realiza una solicitud HTTP DELETE al servidor con el identificador.
     *     - Se espera que el backend elimine la actividad y sus relaciones si corresponde.
     * 
     * Retorna:
     *     - Objeto de la actividad eliminada o confirmación del proceso.
     */

    eliminarActividad: async (idActividad: string): Promise<any> => {
        try {
            const response = await API.delete(`/actividades/${idActividad}`);
            return response.data as Actividad;
        } catch (error) {
            throw error;
        }
    },

      // Editar una actividad
    editarActividad: async (idActividad: string, datos: { descripcion_actividad: string }): Promise<Actividad> => {
        try {
            const response = await API.put(`/actividades/${idActividad}`, datos);
            return response.data as Actividad;
        } catch (error) {
            throw error;
        }
    },
    
};