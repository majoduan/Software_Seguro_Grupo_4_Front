import { API } from './userAPI';

export interface HistoricoProyecto {
  id_historico: string;
  id_proyecto: string;
  campo_modificado: string;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  justificacion: string;
  fecha_modificacion: string;
  usuario: string;
  codigo_proyecto: string | null;
}

export interface HistoricoPoa {
  id_historico: string;
  id_poa: string;
  campo_modificado: string;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  justificacion: string;
  fecha_modificacion: string;
  usuario: string;
  codigo_poa: string | null;
  codigo_proyecto: string | null;
}

export const historicoAPI = {
  // Obtener histórico de proyectos
  getHistoricoProyectos: async (skip: number = 0, limit: number = 100): Promise<HistoricoProyecto[]> => {
    const response = await API.get<HistoricoProyecto[]>('/historico-proyectos/', {
      params: { skip, limit }
    });
    return response.data;
  },

  // Obtener histórico de POAs
  getHistoricoPoas: async (skip: number = 0, limit: number = 100): Promise<HistoricoPoa[]> => {
    const response = await API.get<HistoricoPoa[]>('/historico-poas/', {
      params: { skip, limit }
    });
    return response.data;
  }
};

