import { useState, useCallback } from 'react';
import { sanitizeInput, sanitizeObject, shouldAllowBasicFormatting } from '../utils/sanitizer';

/**
 * Hook personalizado para manejar formularios con sanitización automática
 * @param initialState - Estado inicial del formulario
 * @returns Objeto con state, handlers y utilidades
 */
export const useSanitizedForm = <T extends Record<string, any>>(initialState: T) => {
  const [formData, setFormData] = useState<T>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Actualiza un campo específico del formulario con sanitización automática
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
   * Crea un handler de onChange para un campo específico
   */
  const createFieldHandler = useCallback((fieldName: keyof T) => {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      updateField(fieldName, event.target.value);
    };
  }, [updateField]);

  /**
   * Actualiza múltiples campos a la vez
   */
  const updateFields = useCallback((updates: Partial<T>) => {
    const sanitizedUpdates = sanitizeObject(updates);
    setFormData(prev => ({ ...prev, ...sanitizedUpdates }));
  }, []);

  /**
   * Resetea el formulario al estado inicial
   */
  const resetForm = useCallback(() => {
    setFormData(initialState);
    setErrors({});
  }, [initialState]);

  /**
   * Establece errores de validación
   */
  const setFieldError = useCallback((fieldName: string, error: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  }, []);

  /**
   * Limpia errores de validación
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Obtiene datos sanitizados para envío
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
