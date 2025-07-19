import React, { useState } from 'react';
import DOMPurify from 'dompurify';

/**
 * Configuración base de DOMPurify para aplicación de formularios
 */
const baseConfig = {
  // Permitir solo texto plano, sin HTML
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  // Mantener texto pero limpiar HTML
  KEEP_CONTENT: true,
  // Configuraciones adicionales de seguridad
  FORBID_ATTR: ['style', 'onclick', 'onload', 'onerror'],
  FORBID_TAGS: ['script', 'object', 'embed', 'base', 'link']
};

/**
 * Configuración permisiva para campos que pueden necesitar formato básico
 */
const permissiveConfig = {
  ALLOWED_TAGS: ['b', 'i', 'strong', 'em', 'br'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  FORBID_ATTR: ['style', 'onclick', 'onload', 'onerror'],
  FORBID_TAGS: ['script', 'object', 'embed', 'base', 'link']
};

/**
 * Sanitiza texto de entrada eliminando cualquier contenido malicioso
 * @param input - Texto a sanitizar
 * @param allowBasicFormatting - Si permite formato básico como negritas/cursivas
 * @param preserveWhitespace - Si preserva espacios en blanco (true por defecto para mejor UX)
 * @returns Texto sanitizado
 */
export const sanitizeInput = (
  input: string, 
  allowBasicFormatting = false, 
  preserveWhitespace = true
): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const config = allowBasicFormatting ? permissiveConfig : baseConfig;
  
  // Si preserveWhitespace es true, no hacer trim para mantener experiencia de escritura natural
  const textToSanitize = preserveWhitespace ? input : input.trim();
  
  return DOMPurify.sanitize(textToSanitize, config);
};

/**
 * Sanitiza texto para envío al servidor (elimina espacios sobrantes)
 * @param input - Texto a sanitizar
 * @param allowBasicFormatting - Si permite formato básico
 * @returns Texto sanitizado y limpio para envío
 */
export const sanitizeForSubmit = (input: string, allowBasicFormatting = false): string => {
  return sanitizeInput(input, allowBasicFormatting, false); // preserveWhitespace = false
};

/**
 * Sanitiza un objeto completo, aplicando sanitización a todas sus propiedades string
 * @param obj - Objeto a sanitizar
 * @param allowBasicFormatting - Si permite formato básico
 * @param forSubmit - Si es para envío al servidor (limpia espacios sobrantes)
 * @returns Objeto con propiedades sanitizadas
 */
export const sanitizeObject = <T extends Record<string, any>>(
  obj: T, 
  allowBasicFormatting = false,
  forSubmit = false
): T => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = { ...obj } as any;
  
  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key];
    
    if (typeof value === 'string') {
      sanitized[key] = forSubmit 
        ? sanitizeForSubmit(value, allowBasicFormatting)
        : sanitizeInput(value, allowBasicFormatting);
    } else if (Array.isArray(value)) {
      // Sanitizar arrays de strings
      sanitized[key] = value.map(item => 
        typeof item === 'string' 
          ? (forSubmit ? sanitizeForSubmit(item, allowBasicFormatting) : sanitizeInput(item, allowBasicFormatting))
          : item
      );
    } else if (value && typeof value === 'object') {
      // Recursivamente sanitizar objetos anidados
      sanitized[key] = sanitizeObject(value, allowBasicFormatting, forSubmit);
    }
  });

  return sanitized as T;
};

/**
 * Hook personalizado para manejar inputs sanitizados
 * @param initialValue - Valor inicial
 * @param allowBasicFormatting - Si permite formato básico
 * @returns [value, setter] tupla similar a useState
 */
export const useSanitizedInput = (initialValue = '', allowBasicFormatting = false) => {
  const [value, setValue] = useState(() => sanitizeInput(initialValue, allowBasicFormatting));

  const setSanitizedValue = (newValue: string) => {
    setValue(sanitizeInput(newValue, allowBasicFormatting));
  };

  return [value, setSanitizedValue] as const;
};

/**
 * Función helper para crear onChange handlers sanitizados
 * @param setter - Función setter del estado
 * @param allowBasicFormatting - Si permite formato básico
 * @returns Handler de onChange sanitizado
 */
export const createSanitizedChangeHandler = (
  setter: (value: string) => void,
  allowBasicFormatting = false
) => {
  return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const sanitizedValue = sanitizeInput(event.target.value, allowBasicFormatting);
    setter(sanitizedValue);
  };
};

/**
 * Wrapper simple para sanitizar el valor antes de llamar al setter original
 * Esta es la función más fácil de usar para reemplazar setters existentes
 * @param originalSetter - El setter original (ej: setEmail, setPassword)
 * @param fieldName - Nombre del campo (opcional, para auto-detectar formato)
 * @returns Setter que sanitiza automáticamente
 */
export const withSanitization = <T>(
  originalSetter: (value: T) => void,
  fieldName?: string
) => {
  return (value: T) => {
    if (typeof value === 'string') {
      const allowFormatting = fieldName ? shouldAllowBasicFormatting(fieldName) : false;
      const sanitizedValue = sanitizeInput(value, allowFormatting) as T;
      originalSetter(sanitizedValue);
    } else {
      originalSetter(value);
    }
  };
};

/**
 * Función simple para envolver handlers de onChange existentes
 * @param originalHandler - Handler original de onChange
 * @param fieldName - Nombre del campo (opcional, para auto-detectar formato)  
 * @returns Handler que sanitiza automáticamente
 */
export const sanitizeOnChange = (
  originalHandler: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void,
  fieldName?: string
) => {
  return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const allowFormatting = fieldName ? shouldAllowBasicFormatting(fieldName) : false;
    const sanitizedValue = sanitizeInput(event.target.value, allowFormatting);
    
    // Crear un nuevo evento con el valor sanitizado
    const sanitizedEvent = {
      ...event,
      target: {
        ...event.target,
        value: sanitizedValue
      }
    } as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;
    
    originalHandler(sanitizedEvent);
  };
};

/**
 * Campos que típicamente permiten formato básico
 */
export const FIELDS_ALLOWING_BASIC_FORMAT = [
  'descripcion',
  'description',
  'comentarios',
  'comments',
  'observaciones',
  'notes',
  'notas'
];

/**
 * Determina automáticamente si un campo debería permitir formato básico
 * @param fieldName - Nombre del campo
 * @returns boolean
 */
export const shouldAllowBasicFormatting = (fieldName: string): boolean => {
  const lowerFieldName = fieldName.toLowerCase();
  return FIELDS_ALLOWING_BASIC_FORMAT.some(field => 
    lowerFieldName.includes(field)
  );
};
