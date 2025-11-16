import { API } from './userAPI';
import { Proyecto, TipoProyecto } from '../interfaces/project';
import { PerfilUsuario } from '../interfaces/user';

export const projectAPI = {
    // Obtener todos los tipos de proyecto
    getTiposProyecto: async (): Promise<TipoProyecto[]> => {
        const response = await API.get<TipoProyecto[]>('/tipos-proyecto/');
        return response.data;
    },
    
    // Obtener estados de proyecto
    getEstadosProyecto: async (): Promise<{ id_estado_proyecto: string, nombre: string }[]> => {
        const response = await API.get<{ id_estado_proyecto: string, nombre: string }[]>('/estados-proyecto/');
        return response.data;
    },
    
    // Obtener usuarios que pueden ser directores
/* Objetivo:
Obtener la lista de usuarios con rol de director de proyecto.
El endpoint requiere autenticación.

Parámetros:
Sin parámetros explícitos. El token se envía implícitamente mediante API.
Requiere autenticación (Token JWT en encabezado Authorization).
El acceso está restringido a usuarios.
*/
    getDirectoresProyecto: async (): Promise<PerfilUsuario[]> => {
        const response = await API.get<PerfilUsuario[]>('/usuarios/directores/');
        return response.data;
    },
    
    // Crear un nuevo proyecto
/*
Objetivo:
Crear un nuevo proyecto. El endpoint puede estar restringido a usuarios con permisos de
gestión de proyectos.

Parámetros:
    proyectoData: Omit<Proyecto, 'id_proyecto' | 'fecha_creacion' | 'id_director_proyecto'>
    Requiere autenticación (uso de token JWT).
    Restricción por rol
*/
    crearProyecto: async (proyectoData: Omit<Proyecto, 'id_proyecto' | 'fecha_creacion' | 'id_director_proyecto'>): Promise<Proyecto> => {
        const datosAEnviar = {
          ...proyectoData,
          fecha_creacion: new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD
        };
        
        const response = await API.post<Proyecto>('/proyectos/', datosAEnviar);
        return response.data;
    },

    // Editar un proyecto existente
    /*
    Objetivo:
    Editar la información de un proyecto existente. Implica autorización sobre el recurso.

    Parámetros:
    id: string — identificador del proyecto a editar.
    proyectoData: objeto Proyecto sin el campo id_proyecto.
    Autenticación mediante token JWT.
    Validación de permisos para modificar proyectos específicos.
    */
    editarProyecto: async (id: string, proyectoData: Omit<Proyecto, 'id_proyecto'>): Promise<Proyecto> => {
        const response = await API.put<Proyecto>(`/proyectos/${id}`, proyectoData);
        return response.data;
    },

    // Obtener un proyecto específico por ID
    /*
    Objetivo:Obtener los datos detallados de un proyecto individual por ID.
    Operación: GET /proyectos/{id}
    Parámetros:
        id: string — ID del proyecto.
        Requiere autenticación (JWT).
    */
    obtenerProyecto: async (id: string): Promise<Proyecto> => {
        const response = await API.get<Proyecto>(`/proyectos/${id}`);
        return response.data;
    },

    // Obtener proyectos (para asociar al POA)
    //TODO: Realizar el filtrado de proyecto en el servidor
    getProyectos: async (filtro?: { codigo?: string, titulo?: string }): Promise<Proyecto[]> => {
    const response = await API.get<Proyecto[]>('/proyectos/');

    // Filtrado en el cliente
    let proyectos: Proyecto[] = response.data;
    if (filtro) {
        proyectos = proyectos.filter((proyecto: any) => {
            const matchCodigo = !filtro.codigo ||
                proyecto.codigo_proyecto.toLowerCase().includes(filtro.codigo.toLowerCase());
            const matchTitulo = !filtro.titulo ||
                proyecto.titulo.toLowerCase().includes(filtro.titulo.toLowerCase());
            return matchCodigo && matchTitulo;
        });
    }
    return proyectos;
    },

    // Eliminar un proyecto y todos sus POAs
    /*
    Objetivo:
    Eliminar un proyecto completo junto con todos sus POAs, actividades y tareas asociadas.
    Esta es una operación destructiva que requiere confirmación del usuario.

    Parámetros:
    id: string — identificador del proyecto a eliminar.
    Autenticación mediante token JWT.
    Validación de permisos para eliminar proyectos.
    */
    eliminarProyecto: async (id: string): Promise<{ msg: string }> => {
        const response = await API.delete<{ msg: string }>(`/proyectos/${id}`);
        return response.data;
    },
};