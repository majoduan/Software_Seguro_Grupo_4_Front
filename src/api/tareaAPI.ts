import { DetalleTarea, Tarea, TareaCreate, TareaUpdate, ItemPresupuestario, ProgramacionMensualCreate, ProgramacionMensualOut, DetalleTareaPrecio, DetalleTareaUpdatePrecio } from "../interfaces/tarea";
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

    // Eliminar toda la programación mensual de una tarea
    /**
     * Objetivo:
     * Eliminar toda la programación mensual asociada a una tarea específica.
     *
     * Parámetros:
     * - idTarea: string — Identificador único de la tarea.
     *
     * Operación:
     * DELETE a `/tareas/{id}/programacion-mensual`.
     * Elimina todos los registros de programación mensual de la tarea.
     * El backend valida que la tarea exista y que el usuario tenga permisos.
     * Registra la operación en el historial para auditoría.
     * Útil para resetear la programación antes de crear una nueva.
     */
    eliminarProgramacionMensualCompleta: async (idTarea: string): Promise<{ message: string; registros_eliminados: number }> => {
        try {
            const response = await API.delete(`/tareas/${idTarea}/programacion-mensual`);
            return response.data as { message: string; registros_eliminados: number };
        } catch (error) {
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response: { status: number; data?: { detail?: string } } };
                
                // Manejar errores específicos
                if (axiosError.response.status === 404) {
                    throw new Error("Tarea no encontrada");
                } else if (axiosError.response.status === 403) {
                    throw new Error("No tiene permisos para eliminar esta programación");
                }
            }
            throw error;
        }
    },

    // Actualizar programación mensual (eliminar anterior y crear nueva)
    /**
     * Objetivo:
     * Reemplazar completamente la programación mensual de una tarea.
     *
     * Parámetros:
     * - idTarea: string — Identificador único de la tarea.
     * - programacionesMensuales: ProgramacionMensualCreate[] — Array con las nuevas programaciones.
     *
     * Operación:
     * 1. Elimina toda la programación mensual existente.
     * 2. Crea las nuevas programaciones mensuales.
     * Operación atómica: si falla alguna creación, se mantiene consistencia.
     * Control de transacciones para evitar estados intermedios inválidos.
     */
    actualizarProgramacionMensualCompleta: async (
        idTarea: string, 
        programacionesMensuales: ProgramacionMensualCreate[]
    ): Promise<{ message: string; programaciones_creadas: number }> => {
        // 1. Eliminar programación existente
        await tareaAPI.eliminarProgramacionMensualCompleta(idTarea);
        
        // 2. Crear nuevas programaciones
        const programacionesCreadas = [];
        for (const programacion of programacionesMensuales) {
            const nuevaProgramacion = await tareaAPI.crearProgramacionMensual({
                ...programacion,
                id_tarea: idTarea
            });
            programacionesCreadas.push(nuevaProgramacion);
        }

        return {
            message: "Programación mensual actualizada exitosamente",
            programaciones_creadas: programacionesCreadas.length
        };
    },

    // ==================== GESTIÓN DE PRECIOS PREDEFINIDOS ====================

    /**
     * Objetivo:
     * Obtener todos los detalles de tarea que tienen precios predefinidos.
     *
     * Operación:
     * GET a `/detalles-tarea/con-precios`.
     * Retorna únicamente los 4 servicios profesionales con precio predefinido.
     * Incluye información del item presupuestario asociado.
     * Solo accesible para usuarios con rol ADMINISTRADOR.
     *
     * Retorna:
     * - DetalleTareaPrecio[] — Array con los 4 servicios profesionales
     *
     * Errores:
     * - 401: Usuario no autenticado
     * - 403: Usuario no es ADMINISTRADOR
     */
    getDetallesConPrecios: async (): Promise<DetalleTareaPrecio[]> => {
        console.log('🌐 [tareaAPI] Iniciando petición GET /detalles-tarea/con-precios');

        try {
            console.log('🌐 [tareaAPI] Endpoint completo:', `${API.defaults.baseURL}/detalles-tarea/con-precios`);
            console.log('🌐 [tareaAPI] Enviando petición...');

            const response = await API.get('/detalles-tarea/con-precios');

            console.log('✅ [tareaAPI] Respuesta HTTP recibida:', response.status);
            console.log('✅ [tareaAPI] Headers de respuesta:', response.headers);
            console.log('✅ [tareaAPI] Data recibida (tipo):', typeof response.data);
            console.log('✅ [tareaAPI] Data recibida (es array):', Array.isArray(response.data));
            console.log('✅ [tareaAPI] Data recibida (contenido):', response.data);
            console.log(`✅ [tareaAPI] Cantidad de items en data: ${response.data?.length || 0}`);

            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                console.log('✅ [tareaAPI] Primer item recibido:', response.data[0]);
            }

            return response.data as DetalleTareaPrecio[];
        } catch (error) {
            console.error('❌ [tareaAPI] Error capturado:', error);

            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as any;

                console.error('❌ [tareaAPI] Error HTTP status:', axiosError.response?.status);
                console.error('❌ [tareaAPI] Error HTTP data:', axiosError.response?.data);
                console.error('❌ [tareaAPI] Error HTTP headers:', axiosError.response?.headers);

                if (axiosError.response?.status === 403) {
                    console.error('❌ [tareaAPI] Error 403: Acceso prohibido');
                    throw new Error('Solo los administradores pueden acceder a la gestión de precios');
                }

                if (axiosError.response?.status === 401) {
                    console.error('❌ [tareaAPI] Error 401: No autenticado');
                    throw new Error('Debe iniciar sesión para acceder a esta función');
                }

                if (axiosError.response?.status === 404) {
                    console.error('❌ [tareaAPI] Error 404: Endpoint no encontrado');
                    throw new Error('El endpoint de gestión de precios no está disponible');
                }
            }

            console.error('❌ [tareaAPI] Lanzando error original');
            throw error;
        }
    },

    /**
     * Objetivo:
     * Obtener un detalle de tarea específico con información de precio.
     *
     * Parámetros:
     * - idDetalleTarea: string — ID único del detalle de tarea
     *
     * Operación:
     * GET a `/detalles-tarea/{id}`.
     * Retorna información completa del detalle incluyendo item presupuestario.
     *
     * Retorna:
     * - DetalleTareaPrecio — Objeto con información completa
     *
     * Errores:
     * - 401: Usuario no autenticado
     * - 404: Detalle de tarea no encontrado
     */
    getDetalleTareaPrecio: async (idDetalleTarea: string): Promise<DetalleTareaPrecio> => {
        try {
            const response = await API.get(`/detalles-tarea/${idDetalleTarea}`);
            return response.data as DetalleTareaPrecio;
        } catch (error) {
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as any;

                if (axiosError.response?.status === 404) {
                    throw new Error('Detalle de tarea no encontrado');
                }
            }
            throw error;
        }
    },

    /**
     * Objetivo:
     * Actualizar el precio predefinido de un servicio profesional.
     *
     * Parámetros:
     * - idDetalleTarea: string — ID único del detalle de tarea
     * - precio: number — Nuevo precio (rango: $100 - $5,000)
     *
     * Operación:
     * PUT a `/detalles-tarea/{id}/precio`.
     * Actualiza el campo precio_unitario en la base de datos.
     * Solo afecta tareas creadas DESPUÉS del cambio.
     * Valida que el precio esté en el rango permitido.
     *
     * Retorna:
     * - DetalleTareaPrecio — Detalle actualizado con el nuevo precio
     *
     * Errores:
     * - 401: Usuario no autenticado
     * - 403: Usuario no es ADMINISTRADOR
     * - 404: Detalle de tarea no encontrado
     * - 400: Precio fuera de rango o detalle no es servicio profesional
     * - 422: Validación de precio fallida (formato incorrecto)
     */
    updatePrecioDetalleTarea: async (idDetalleTarea: string, precio: number): Promise<DetalleTareaPrecio> => {
        try {
            const data: DetalleTareaUpdatePrecio = {
                precio_unitario: precio
            };

            const response = await API.put(`/detalles-tarea/${idDetalleTarea}/precio`, data);
            return response.data as DetalleTareaPrecio;
        } catch (error) {
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as any;

                // Manejar errores específicos
                if (axiosError.response?.status === 403) {
                    throw new Error('Solo los administradores pueden actualizar precios predefinidos');
                } else if (axiosError.response?.status === 404) {
                    throw new Error('Detalle de tarea no encontrado');
                } else if (axiosError.response?.status === 400) {
                    // El backend puede retornar mensajes específicos
                    const detail = axiosError.response?.data?.detail;
                    if (detail) {
                        throw new Error(detail);
                    }
                    throw new Error('Precio inválido o detalle no es un servicio profesional');
                } else if (axiosError.response?.status === 422) {
                    // Errores de validación de Pydantic
                    const detail = axiosError.response?.data?.detail;
                    if (Array.isArray(detail) && detail.length > 0) {
                        // Pydantic retorna array de errores
                        const firstError = detail[0];
                        throw new Error(firstError.msg || 'Error de validación en el precio');
                    }
                    throw new Error('El precio debe estar entre $100 y $5,000');
                }
            }
            throw error;
        }
    },

}
