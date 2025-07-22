import { useState, useCallback } from 'react';
import { sanitizeInput, sanitizeObject, shouldAllowBasicFormatting } from '../utils/sanitizer';

export const useSanitizedForm = <T extends Record<string, any>>(initialState: T) => {
  const [formData, setFormData] = useState<T>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Actualiza un campo específico del formulario con sanitización automática
   
 * Objetivo:
 * Proveer un hook personalizado para manejar formularios con sanitización automática,
 * evitando la inyección de contenido malicioso y manteniendo datos limpios y seguros.
 * 
 * Parámetros:
 * initialState - T: Objeto con el estado inicial del formulario, con tipos genéricos.
 * 
 * Operación:
 * - Mantiene el estado `formData` con datos sanitizados.
 * - Mantiene un estado `errors` para almacenar mensajes de validación.
 * - Provee funciones para actualizar campos con sanitización (`updateField`), crear handlers para inputs (`createFieldHandler`),
 *   actualizar múltiples campos sanitizados (`updateFields`), resetear formulario (`resetForm`), manejar errores (`setFieldError`, `clearErrors`),
 *   y obtener datos sanitizados para envío seguro (`getSanitizedData`).
 * - Utiliza internamente `sanitizeInput` y `sanitizeObject` para limpiar datos.
 
   */
  const updateField = useCallback((fieldName: keyof T, value: string) => {
    const allowFormatting = shouldAllowBasicFormatting(String(fieldName));
    const sanitizedValue = sanitizeInput(value, allowFormatting);
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: sanitizedValue
    }));

    // Limpiar error del campo si existe
    if (errors[String(fieldName)]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[String(fieldName)];
        return newErrors;
      });
    }
  }, [errors]);

  /**
   * Crea un handler de onChange para un campo específico que automáticamente sanitiza y actualiza el estado.
 * 
 * Parámetros:
 * - fieldName: Clave del campo para el cual se genera el handler.
 * 
 * Operación:
 * - Devuelve una función que captura el evento, obtiene el valor,
 *   y llama a `updateField` para sanitizar y actualizar.
 */
  
  const createFieldHandler = useCallback((fieldName: keyof T) => {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      updateField(fieldName, event.target.value);
    };
  }, [updateField]);

  /**
   * Actualiza múltiples campos a la vez
 * 
 * Parámetros:
 * - updates: Objeto parcial con claves y valores para actualizar.
 * 
 * Operación:
 * - Sanitiza el objeto completo con `sanitizeObject`.
 * - Actualiza el estado `formData` con los valores limpios.
 */
  
  const updateFields = useCallback((updates: Partial<T>) => {
    const sanitizedUpdates = sanitizeObject(updates);
    setFormData(prev => ({ ...prev, ...sanitizedUpdates }));
  }, []);

  /**
 * Resetea el formulario al estado inicial, limpiando errores.
 * 
 * Parámetros: Ninguno.
 * 
 * Operación:
 * - Restaura `formData` al estado inicial.
 * - Limpia todos los errores.
 */
  
  const resetForm = useCallback(() => {
    setFormData(initialState);
    setErrors({});
  }, [initialState]);

  /**
   * Establece errores de validación
 * Establece un error de validación para un campo específico.
 * 
 * Parámetros:
 * - fieldName: Nombre del campo donde ocurre el error.
 * - error: Mensaje descriptivo del error.
 * 
 * Operación:
 * - Añade o actualiza el mensaje de error en el estado `errors`.
 */
   
  const setFieldError = useCallback((fieldName: string, error: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  }, []);

  /*
 * Limpia los errores de validación.
 * 
 * Parámetros: Ninguno.
 * 
 * Operación:
 * - Vacía el estado `errors`.
 */

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Obtiene datos sanitizados para envío
 * Obtiene una copia de los datos del formulario completamente sanitizados,
 * listos para ser enviados a la API o backend.
 * 
 * Parámetros: Ninguno.
 * 
 * Operación:
 * - Aplica `sanitizeObject` sobre el estado actual `formData`.
 * - Retorna el objeto sanitizado.
 */

  const getSanitizedData = useCallback(() => {
    return sanitizeObject(formData);
  }, [formData]);

  return {
    formData,
    errors,
    updateField,
    createFieldHandler,
    updateFields,
    resetForm,
    setFieldError,
    clearErrors,
    getSanitizedData,
    // Helper para verificar si hay errores
    hasErrors: Object.keys(errors).length > 0
  };
};
