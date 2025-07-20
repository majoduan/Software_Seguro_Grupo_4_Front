import { API } from './userAPI';

export const reporteAPI = {
  // Generar reporte POA
  generarReportePOA: async (anio: string, tipoProyecto: string): Promise<any> => {
    const formData = new URLSearchParams();
    formData.append('anio', anio);
    formData.append('tipo_proyecto', tipoProyecto);
    
    const response = await API.post('/reporte-poa/', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response.data;
  },

  // Descargar reporte en Excel
  descargarReporteExcel: async (reporteData: any): Promise<Blob> => {
    const response = await API.post('/reporte-poa/excel/', reporteData, {
      headers: {
        'Content-Type': 'application/json'
      },
      responseType: 'blob'
    });
    return response.data as Blob;
  },

  // Descargar reporte en PDF
  descargarReportePDF: async (reporteData: any): Promise<Blob> => {
    const response = await API.post('/reporte-poa/pdf/', reporteData, {
      headers: {
        'Content-Type': 'application/json'
      },
      responseType: 'blob'
    });
    return response.data as Blob;
  }
};
