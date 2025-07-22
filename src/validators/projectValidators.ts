// src/validators/projectValidators.ts
import { TipoProyecto } from '../interfaces/project';

/**
 * Validates the director name format
 * Format: 1-2 first names followed by 1-2 last names
 */

/**
 * Valida el formato del nombre del director
 * 
 * Objetivo:
 *  - Asegurar que el nombre del director tenga un formato válido para evitar datos corruptos o inyecciones.
 * Parámetros:
 *  - name: string - Nombre completo del director.
 * Operación:
 *  - Elimina espacios adicionales al inicio y final.
 *  - Verifica que el nombre no esté vacío.
 *  - Divide el nombre en palabras y verifica que tenga entre 2 y 8 palabras.
 *  - Comprueba que cada palabra contenga solo caracteres alfabéticos válidos, incluyendo letras acentuadas y caracteres especiales latinos.
 * Retorna:
 *  - true si el nombre es válido, false en caso contrario.
 */
export const validateDirectorName = (name: string): boolean => {
  // Elimina espacios adicionales al inicio y final
  const trimmedName = name.trim();
  
  // Verifica que no esté vacío
  if (!trimmedName) return false;
  
  // Divide el nombre en palabras
  const words = trimmedName.split(/\s+/);
  const wordCount = words.length;
  
  // Verifica que tenga al menos 2 palabras y máximo 8
  if (wordCount < 2 || wordCount > 8) return false;
  
  // Verifica que cada palabra contenga solo caracteres válidos para nombres
  // Incluye caracteres latinos, acentos, ñ y ü
  const validWordPattern = /^[A-Za-zÀ-ÖØ-öø-ÿ]+$/;
  
  return words.every(word => validWordPattern.test(word));
};

/*
 * Valida el presupuesto del proyecto según el tipo de proyecto
 * 
 * Objetivo:
 *  - Prevenir presupuestos inválidos o fuera de rango que puedan afectar la lógica del sistema 
 * o permitir datos erróneos.
 * Parámetros:
 *  - budget: string - Valor del presupuesto a validar.
 *  - tipoProyecto: TipoProyecto | null - Objeto que contiene el presupuesto máximo permitido.
 * Operación:
 *  - Verifica que el presupuesto sea un número válido y positivo.
 *  - Comprueba que no exceda el máximo permitido para el tipo de proyecto.
 * Retorna:
 *  - Mensaje de error en caso de incumplimiento, o null si es válido.
 */
export const validateBudget = (
  budget: string,
  tipoProyecto: TipoProyecto | null
): string | null => {
  if (!budget) return null;
  
  const budgetValue = parseFloat(budget);
  
  if (isNaN(budgetValue)) {
    return 'El presupuesto debe ser un número válido';
  }
  
  if (budgetValue <= 0) {
    return 'El presupuesto debe ser un valor positivo';
  }
  
  if (tipoProyecto?.presupuesto_maximo && budgetValue > tipoProyecto.presupuesto_maximo) {
    return `El presupuesto no puede exceder ${tipoProyecto.presupuesto_maximo.toLocaleString('es-CO')} para este tipo de proyecto`;
  }
  
  return null;
};

/*
 * Valida la fecha de fin del proyecto basándose en la fecha de inicio y duración máxima
 * 
 * Objetivo:
 *  - Garantizar que las fechas de inicio y fin sean coherentes y que el proyecto no exceda 
 * su duración máxima permitida.
 * Parámetros:
 *  - endDate: string - Fecha de fin propuesta.
 *  - startDate: string - Fecha de inicio del proyecto.
 *  - maxDurationMonths: number | undefined - Duración máxima permitida en meses.
 * Operación:
 *  - Comprueba que la fecha de fin no sea anterior a la de inicio.
 *  - Calcula la fecha máxima permitida y verifica que no se exceda.
 * Retorna:
 *  - Mensaje de error si la validación falla, o null si la fecha es válida.
 */
export const validateEndDate = (
  endDate: string,
  startDate: string,
  maxDurationMonths: number | undefined
): string | null => {
  if (!endDate || !startDate || !maxDurationMonths) return null;
  
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  
  if (endDateObj < startDateObj) {
    return 'La fecha de fin no puede ser anterior a la fecha de inicio';
  }
  
  const maxEndDateObj = new Date(startDateObj);
  maxEndDateObj.setMonth(startDateObj.getMonth() + maxDurationMonths);
  
  // Adjust for month length differences
  if (maxEndDateObj.getDate() !== startDateObj.getDate()) {
    maxEndDateObj.setDate(0);
  }
  
  if (endDateObj > maxEndDateObj) {
    return `La fecha de fin no puede exceder la duración máxima de ${maxDurationMonths} meses desde la fecha de inicio`;
  }
  
  return null;
};

/*
 * Valida que todos los campos obligatorios del formulario de proyecto estén completos y sean correctos
 * 
 * Objetivo:
 *  - Evitar el envío de formularios incompletos o con datos inválidos que puedan comprometer 
 * la integridad de la información.
 * Parámetros:
 *  - codigo_proyecto: string - Código del proyecto.
 *  - titulo: string - Título del proyecto.
 *  - tipoProyecto: TipoProyecto | null - Tipo de proyecto seleccionado.
 *  - id_estado_proyecto: string - Estado del proyecto.
 *  - id_director_proyecto: string - Nombre del director del proyecto.
 *  - fecha_inicio: string - Fecha de inicio del proyecto.
 * Operación:
 *  - Verifica que no haya campos vacíos.
 *  - Valida el formato del nombre del director usando validateDirectorName.
 * Retorna:
 *  - Mensaje de error si faltan campos o el nombre es inválido, o null si todo es correcto.
 */
export const validateProjectFormRequiredFields = (
  codigo_proyecto: string,
  titulo: string,
  tipoProyecto: TipoProyecto | null,
  id_estado_proyecto: string,
  id_director_proyecto: string,
  fecha_inicio: string
): string | null => {
  if (!codigo_proyecto || !titulo || !tipoProyecto || !id_estado_proyecto || !id_director_proyecto || !fecha_inicio) {
    return 'Por favor complete todos los campos obligatorios';
  }
  
  if (!validateDirectorName(id_director_proyecto)) {
    return 'El formato del nombre del director debe ser: Nombre Apellido o Nombre1 Nombre2 Apellido1 Apellido2';
  }
  
  return null;
};