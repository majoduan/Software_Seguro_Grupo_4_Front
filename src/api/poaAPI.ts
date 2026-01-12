import { API } from './userAPI';
import { POA, EstadoPOA, TipoPOA, PoaCreate } from '../interfaces/poa';
// Ya no importamos Periodo de poa.ts

export const poaAPI = {

    /**
     * Objetivo:
     *   - Obtener todos los estados posibles para los POA.
     * Operación:
     *   - Método HTTP: GET
     *   - Endpoint: "/estados-poa/"
     *   - Autenticación: mediante token JWT
     * Parámetros: Ninguno
     */
    getEstadosPOA: async (): Promise<EstadoPOA[]> => {
        const response = await API.get<EstadoPOA[]>('/estados-poa/');
        return response.data;
    },

    /*
     * Objetivo: Obtener todos los tipos de POA definidos en el sistema.
     * Operación: GET a "/tipos-poa/"
     *           Requiere autenticación vía token JWT.
     *           Validación en backend de permisos del usuario.
     */
    getTiposPOA: async (): Promise<TipoPOA[]> => {
        const response = await API.get<TipoPOA[]>('/tipos-poa/');
        return response.data;
    },

    /**
     * Objetivo: Obtener un tipo POA específico por su ID.
     * Operación: GET a "/tipos-poa/{id}"
     *            Verificación del token JWT.
     *            Control de acceso a través de roles
     * 
     * Parámetros:
     *    - id: string – ID del tipo de POA
     */
    getTipoPOA: async (id: string): Promise<TipoPOA> => {
        const response = await API.get<TipoPOA>(`/tipos-poa/${id}`);
        return response.data;
    },

    /**
     * Objetivo: Crear un nuevo POA.
     * Operación: POST a "/poas/"
     * 
     * Parámetros:
     *    - poaData: PoaCreate
     *    - Autenticación requerida.
     *    - Validación de datos en frontend antes de envío.
     *    - Sanitización de fecha para prevenir errores por zona horaria.
     */
    crearPOA: async (poaData: PoaCreate): Promise<POA> => {
        const datosAEnviar = {
            ...poaData,
            fecha_creacion: poaData.fecha_creacion ? poaData.fecha_creacion.split('Z')[0] : new Date().toISOString().split('Z')[0], // Eliminar la información de zona horaria
            //id_estado_poa: poaData.id_estado_poa || null // Asegurarse de que este campo sea nulo si no se proporciona
        };

        try {
            const response = await API.post<POA>('/poas/', datosAEnviar);
            return response.data;
        } catch (error) {

            throw error;
        }
    },


    /**
     * Objetivo: Obtener la lista completa de POAs.
     * Operación: GET a "/poas/"
     *          Requiere token JWT.
     *          Acceso controlado desde backend según permisos del usuario.
     */
    getPOAs: async (): Promise<POA[]> => {
        const response = await API.get<POA[]>('/poas/');
        return response.data;
    },

    // Obtener un POA específico
    getPOA: async (id: string): Promise<POA> => {
        const response = await API.get<POA>(`/poas/${id}`);
        return response.data;
    },

    // Editar un POA existente
    /**
 * Objetivo: Editar un POA existente.
 * Operación: PUT a "/poas/{id}"
 * Parámetros:
 *    - id: string
 *    - poaData: PoaCreate
 *    - Requiere token JWT.
 *    - Validación previa del contenido modificado.
 *    - Sanitización de campos como fecha_creacion.
 */

    editarPOA: async (id: string, poaData: PoaCreate, justificacion: string): Promise<POA> => {
        const datosAEnviar = {
            ...poaData,
            fecha_creacion: poaData.fecha_creacion ? poaData.fecha_creacion.split('Z')[0] : new Date().toISOString().split('Z')[0], // Eliminar la información de zona horaria
            justificacion
        };

        try {
            const response = await API.put<POA>(`/poas/${id}`, datosAEnviar);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Objetivo: Obtener un tipo POA según el código de tipo de proyecto.
     * Operación: Interna (no realiza petición), usa getTiposPOA
     *            Solo se accede si previamente se ha validado el usuario.
     * Parámetros: codigo_tipo: string
     *    
     */
    // Función para obtener el tipo POA correspondiente a un tipo de proyecto
    getTipoPOAByTipoProyecto: async (codigo_tipo: string): Promise<TipoPOA | undefined> => {
        // Obtener todos los tipos de POA
        const tiposPOA = await poaAPI.getTiposPOA();

        // Buscar el tipo POA que corresponda al nombre del tipo de proyecto
        return tiposPOA.find(tipoPOA =>
            tipoPOA.codigo_tipo.toLowerCase().includes(codigo_tipo.toLowerCase())
        );
    },

    // Obtener POAs por Proyecto
    /**
     * Objetivo: Obtener todos los POA asociados a un proyecto específico.
     * Operación: GET a "/proyectos/{id}/poas"
     * Parámetros: idProyecto: string
                   Requiere token JWT.
     *             Validación de permisos del usuario sobre el proyecto.
     */
    getPOAsByProyecto: async (idProyecto: string): Promise<POA[]> => {
        try {
            const response = await API.get<POA[]>(`/proyectos/${idProyecto}/poas`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};