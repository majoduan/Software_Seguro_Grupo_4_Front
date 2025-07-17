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
    getDirectoresProyecto: async (): Promise<PerfilUsuario[]> => {
        const response = await API.get<PerfilUsuario[]>('/usuarios/directores/');
        return response.data;
    },
    
    // Crear un nuevo proyecto
    crearProyecto: async (proyectoData: Omit<Proyecto, 'id_proyecto' | 'fecha_creacion' | 'id_director_proyecto'>): Promise<Proyecto> => {
        const datosAEnviar = {
          ...proyectoData,
          fecha_creacion: new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD
        };
        
        const response = await API.post<Proyecto>('/proyectos/', datosAEnviar);
        return response.data;
    },

    // Editar un proyecto existente
    editarProyecto: async (id: string, proyectoData: Omit<Proyecto, 'id_proyecto'>): Promise<Proyecto> => {
        const response = await API.put<Proyecto>(`/proyectos/${id}`, proyectoData);
        return response.data;
    },

    // Obtener un proyecto específico por ID
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
};