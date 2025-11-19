import { API } from './userAPI';

export interface PresupuestoProyecto {
    presupuesto_aprobado: number;
    suma_poas_asignados: number;
    presupuesto_disponible: number;
    porcentaje_utilizado: number;
    cantidad_poas: number;
}

export interface PresupuestoPOA {
    presupuesto_asignado: number;
    suma_actividades: number;
    presupuesto_disponible: number;
    porcentaje_utilizado: number;
    cantidad_actividades: number;
}

export interface PresupuestoActividad {
    total_por_actividad: number;
    suma_tareas: number;
    presupuesto_disponible: number;
    porcentaje_utilizado: number;
    cantidad_tareas: number;
}

export const presupuestoAPI = {
    /**
     * Obtiene información detallada del presupuesto disponible de un proyecto
     * @param id_proyecto UUID del proyecto
     * @returns Datos de presupuesto del proyecto
     */
    getPresupuestoProyecto: async (id_proyecto: string): Promise<PresupuestoProyecto> => {
        const response = await API.get<PresupuestoProyecto>(`/proyectos/${id_proyecto}/presupuesto-disponible`);
        return response.data;
    },

    /**
     * Obtiene información detallada del presupuesto disponible de un POA
     * @param id_poa UUID del POA
     * @returns Datos de presupuesto del POA
     */
    getPresupuestoPOA: async (id_poa: string): Promise<PresupuestoPOA> => {
        const response = await API.get<PresupuestoPOA>(`/poas/${id_poa}/presupuesto-disponible`);
        return response.data;
    },

    /**
     * Obtiene información detallada del presupuesto disponible de una actividad
     * @param id_actividad UUID de la actividad
     * @returns Datos de presupuesto de la actividad
     */
    getPresupuestoActividad: async (id_actividad: string): Promise<PresupuestoActividad> => {
        const response = await API.get<PresupuestoActividad>(`/actividades/${id_actividad}/presupuesto-disponible`);
        return response.data;
    },
};
