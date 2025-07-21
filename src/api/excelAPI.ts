import { API } from "./userAPI";
export const excelAPI = {
  
  /**
 * Descripción: Sube un archivo Excel al backend para procesar tareas o actividades.
 * Endpoint: /transformar_excel/
 * Objetivo:
 *    - Enviar un archivo Excel al backend para ser transformado y cargado como actividades/tareas.
 
  Operación:
 *    - Método HTTP: POST
 *    - Endpoint: "/transformar_excel/"
 *    - Autenticación: Sí – Token JWT enviado en headers por `API`
 * Parámetros:
 *    - formData: FormData – contiene el archivo Excel a enviar.
 *    - Contenido: archivo Excel bajo campo definido en el backend.
 * Cabeceras:
 *  - Content-Type: multipart/form-data asegurarse de validar el archivo antes de enviarlo.
 *  - Authorization: Bearer <token> 
 *           Requiere estar autenticado; el token JWT se incluye en la cabecera automáticamente.
 * Respuesta esperada:
 *    - Tipo: any
 *    - Estructura: respuesta procesada por el backend con resumen de la carga.
 */

  subirExcel: async (formData: FormData): Promise<any> => {
    try {
      const response = await API.post("/transformar_excel/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw error;
    }
  },
  getLogsCargaExcel: async (
    params: {
      fecha_inicio?: string;
      fecha_fin?: string;
    } = {}
  ): Promise<any[]> => {
    const response = await API.get("/logs-carga-excel/", { params });
    return response.data as any[];
  },
};
