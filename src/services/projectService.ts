import { projectAPI } from '../api/projectAPI';
import { EstadoProyecto, Proyecto, TipoProyecto } from '../interfaces/project';

export const projectService = {
  /**
   * Get all project states from API
   * Objetivo:
   *   Obtener todos los estados posibles de proyectos desde la API.
   * 
   * Parámetros:  Ninguno.
   * 
   * Operación:
   *   Llama a la función del API para obtener los estados y devuelve el resultado.
   *   Si ocurre un error lo propaga.
   */
  getEstadosProyecto: async (): Promise<EstadoProyecto[]> => {
    try {
      return await projectAPI.getEstadosProyecto();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Crear nuevo proyecto
   * Objetivo:
   *   Crear un nuevo proyecto enviando sus datos al backend.
   * 
   * Parámetros:
   *   - proyectoData: Proyecto — Objeto con los datos del proyecto a crear.
   * 
   * Operación:
   *   Envía el objeto proyecto al API para crear el proyecto y devuelve la respuesta.
   *   Propaga cualquier error que ocurra.
   */
   
  crearProyecto: async (proyectoData: Proyecto): Promise<Proyecto> => {
    try {
      return await projectAPI.crearProyecto(proyectoData);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Calcular fecha máxima
   * 
   * Objetivo:
   *   Calcular la fecha máxima de fin de un proyecto basado en la fecha de inicio y duración en meses.
   * 
   * Parámetros:
   *   - fechaInicio: string — Fecha de inicio del proyecto en formato ISO (YYYY-MM-DD).
   *   - duracionMeses: number — Duración máxima permitida en meses.
   * 
   * Operación:
   *   Crea un objeto Date para la fecha de inicio y le suma la duración en meses.
   *   Ajusta el día para que sea un día antes del mes siguiente.
   *   Retorna la fecha calculada en formato 'YYYY-MM-DD'.
   */
   
  calcularFechaFinMaxima: (fechaInicio: string, duracionMeses: number): string => {
    if (!fechaInicio || !duracionMeses) return '';
    
    const fechaInicioObj = new Date(fechaInicio);
    const fechaFinObj = new Date(fechaInicioObj);
    
    // Set the day before, after adding months
    fechaFinObj.setMonth(fechaInicioObj.getMonth() + duracionMeses);
    fechaFinObj.setDate(fechaFinObj.getDate() - 1);
    
    // Format to YYYY-MM-DD for date input value
    return fechaFinObj.toISOString().split('T')[0];
  },

  /**
   * Generar codigo proyecto
   * Objetivo:
   *   Generar un código identificador para un proyecto basado en el tipo y la fecha de inicio.
   * 
   * Parámetros:
   *   - tipoProyecto: TipoProyecto — Objeto con información del tipo de proyecto, incluyendo código.
   *   - fechaInicio: string — Fecha de inicio del proyecto en formato ISO.
   * 
   * Operación:
   *   Extrae el año y mes de la fecha de inicio y concatena con el código del tipo de proyecto.
   *   Retorna el código en formato `${codigo_tipo}-${AA}-${MM}`.
   */
  generarCodigoProyecto: (tipoProyecto: TipoProyecto, fechaInicio: string): string => {
    if (!fechaInicio || !tipoProyecto?.codigo_tipo) return '';
    
    const fechaObj = new Date(fechaInicio);
    const anio = fechaObj.getFullYear().toString().slice(-2);
    const mes = ("0" + (fechaObj.getMonth() + 1)).slice(-2);
    
    return `${tipoProyecto.codigo_tipo}-${anio}-${mes}`;
  },

  /**Validar Nombre Director
   * Objetivo:
   *   Validar el formato del nombre del director del proyecto.
   * 
   * Parámetros:
   *   - nombre: string — Nombre del director a validar.
   * 
   * Operación:
   *   Usa una expresión regular para validar que el nombre tenga 2 a 4 palabras con caracteres 
   * latinos permitidos.
   *   Retorna true si es válido, false si no.
   */
  validarNombreDirector: (nombre: string): boolean => {
    const pattern = /^[A-Za-zÀ-ÖØ-öø-ÿ]+ [A-Za-zÀ-ÖØ-öø-ÿ]+( [A-Za-zÀ-ÖØ-öø-ÿ]+)?( [A-Za-zÀ-ÖØ-öø-ÿ]+)?$/;
    return pattern.test(nombre.trim());
  },

 /*Validar Presupuesto
   * Objetivo:
   *   Validar que el presupuesto del proyecto sea un valor positivo y no exceda el máximo 
   * permitido por tipo de proyecto.
   * 
   * Parámetros:
   *   - presupuesto: string — Valor del presupuesto a validar.
   *   - tipoProyecto: TipoProyecto | null — Tipo de proyecto con el presupuesto máximo permitido.
   * 
   * Operación:
   *   Convierte el presupuesto a número y verifica que sea positivo y menor o igual al máximo.
   *   Retorna mensaje de error si no cumple, o null si es válido.
   */
  validarPresupuesto: (presupuesto: string, tipoProyecto: TipoProyecto | null): string | null => {
    if (!presupuesto) return null;
    
    const valorPresupuesto = parseFloat(presupuesto);
    
    if (valorPresupuesto <= 0) {
      return 'El presupuesto debe ser un valor positivo';
    }
    
    if (tipoProyecto?.presupuesto_maximo && valorPresupuesto > tipoProyecto.presupuesto_maximo) {
      return `El presupuesto no puede exceder ${tipoProyecto.presupuesto_maximo.toLocaleString('es-CO')} para este tipo de proyecto`;
    }
    
    return null;
  },
  
   /* Validar Fecha fin
   * Objetivo:
   *   Validar que la fecha de fin no exceda la duración máxima permitida desde la fecha de inicio.
   * 
   * Parámetros:
   *   - fechaFin: string — Fecha final propuesta.
   *   - fechaInicio: string — Fecha de inicio del proyecto.
   *   - duracionMeses: number — Duración máxima permitida en meses.
   * 
   * Operación:
   *   Calcula la fecha máxima permitida y compara con la fecha de fin.
   *   Retorna mensaje de error si excede, o null si es válida.
   */
  validarFechaFin: (fechaFin: string, fechaInicio: string, duracionMeses: number): string | null => {
    if (!fechaFin || !fechaInicio) return null;
    
    const fechaFinMaxima = projectService.calcularFechaFinMaxima(fechaInicio, duracionMeses);
    
    if (new Date(fechaFin) > new Date(fechaFinMaxima)) {
      return `La fecha de fin no puede exceder la duración máxima de ${duracionMeses} meses desde la fecha de inicio`;
    }
    
    return null;
  }
};