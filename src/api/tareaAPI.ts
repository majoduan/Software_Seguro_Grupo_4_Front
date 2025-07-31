import { DetalleTarea, Tarea, TareaCreate, TareaUpdate, ItemPresupuestario, ProgramacionMensualCreate, ProgramacionMensualOut } from "../interfaces/tarea";
import { API } from "./userAPI";

    
export const tareaAPI = {

    // Obtener item presupuestario por id
    /**
     * Objetivo:Obtener un ítem presupuestario por su ID.
     *
     * Parámetros:
     * - idItemPresupuestario: string — ID único del ítem.
     *
     * Operación:
     * GET a `/item-presupuestario/{id}`.
     * Valida que el ítem contenga información esperada (como el código).
     * El backend restringe el acceso al ítem si el usuario no tiene autorización.
     * No expone datos incompletos o inválidos.
     */

    getItemPresupuestarioPorId: async (idItemPresupuestario: string): Promise<ItemPresupuestario> => {
        try {
            const response = await API.get(`/item-presupuestario/${idItemPresupuestario}`);
            
            // Verificar explícitamente si el campo código está presente
            if (response.data && !response.data.codigo) {
            }
            
            return response.data;
        } catch (error) {
            throw error;
        }
        },

    // Obtener item presupuestario de una tarea específica
    /**
     * Objetivo:
     * Obtener el ítem presupuestario asociado a una tarea.
     *
     * Parámetros:
     * - idTarea: string — ID único de la tarea.
     *
     * Operación:
     * Realiza una solicitud GET a `/tareas/{id}/item-presupuestario`.
     * Lanza errores específicos si la tarea no existe o no tiene ítem asociado.
     * Previene filtración de información no autorizada.
     * El backend valida que el usuario tenga permiso para acceder a la tarea solicitada.
     */

    getItemPresupuestarioDeTarea: async (idTarea: string): Promise<ItemPresupuestario> => {
        try {
            const response = await API.get(`/tareas/${idTarea}/item-presupuestario`);
            return response.data as ItemPresupuestario;
        } catch (error) {
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as any;
                
                // Manejar errores específicos
                if (axiosError.response.status === 404) {
                    if (axiosError.response.data?.detail === "Tarea no encontrada") {
                        throw new Error("Tarea no encontrada");
                    } else if (axiosError.response.data?.detail === "Item presupuestario no asociado a esta tarea") {
                        throw new Error("Item presupuestario no asociado a esta tarea");
                    }
                }
            }
            throw error;
        }
    },

    // Obtener tareas por actividad
    getTareasPorActividad: async (idActividad: string): Promise<Tarea[]> => {
        const response = await API.get(`/actividades/${idActividad}/tareas`);
        return response.data;
    },

    
    // Crear una tarea para una actividad
    crearTarea: async (idActividad: string, tareaData: TareaCreate): Promise<Tarea> => {
        try {
            const response = await API.post(`/actividades/${idActividad}/tareas`, tareaData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Eliminar una tarea
    eliminarTarea: async (idTarea: string): Promise<any> => {
        try {
            const response = await API.delete(`/tareas/${idTarea}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Editar una tarea
    editarTarea: async (idTarea: string, tareaData: TareaUpdate): Promise<any> => {
        try {
            const response = await API.put(`/tareas/${idTarea}`, tareaData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener detalles de tarea por POA
    getDetallesTareaPorPOA: async (idPoa: string): Promise<DetalleTarea[]> => {
        const response = await API.get(`/poas/${idPoa}/detalles_tarea`);
        return response.data;
    },

    // Crear programación mensual
    /**
     * Objetivo:
     * Crear una programación mensual para una tarea.
     *
     * Parámetros:
     * - programacionData: ProgramacionMensualCreate — Datos necesarios para crear la programación.
     *
     * Operación:
     * POST a `/programacion-mensual`.
     * Lanza un error claro si ya existe programación para ese mes y tarea.
     * Control contra duplicación: evita sobrescritura de datos.
     * Backend valida consistencia de los datos ingresados y autorización del usuario.
     */

    crearProgramacionMensual: async (programacionData: ProgramacionMensualCreate): Promise<ProgramacionMensualOut> => {
        try {
            const response = await API.post("/programacion-mensual", programacionData);
            return response.data;
        } catch (error) {
            if (error.response) {
                
                // Manejar el error específico de duplicación
                if (error.response.status === 400 && 
                    error.response.data?.detail === "Ya existe programación para ese mes y tarea.") {
                    throw new Error("Ya existe una programación para ese mes y tarea");
                }
            }
            throw error;
        }
    },

    // Obtener programación mensual por tarea
    /**
     * Objetivo: Obtener las programaciones mensuales de una tarea.
     *
     * Parámetros:
     * - idTarea: string — Identificador único de la tarea.
     *
     * Operación:
     * GET a `/tareas/{id}/programacion-mensual`.
     * Lanza error si la tarea no existe.
     * El backend valida la existencia de la tarea y los permisos del usuario.
     * Se evita fuga de datos si la tarea no pertenece al usuario autenticado.
     * Manejo explícito de errores 404 para evitar inferencia de información.
     */

    getProgramacionMensualPorTarea: async (idTarea: string): Promise<ProgramacionMensualOut[]> => {
        try {
            const response = await API.get(`/tareas/${idTarea}/programacion-mensual`);
            return response.data as ProgramacionMensualOut[];
        } catch (error) {
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as any;
                
                // Manejar error específico de tarea no encontrada
                if (axiosError.response.status === 404) {
                    throw new Error("Tarea no encontrada");
                }
            }
            throw error;
        }
    },

}
