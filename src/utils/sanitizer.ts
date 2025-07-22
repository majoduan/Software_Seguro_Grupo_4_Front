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
 * Configuración permisiva para  sanitización básica.
 * objetivo: Permitir formato básico seguro (negritas, saltos de línea).
 * parametros: Ninguno (configuración predefinida).
 * operacion: Permite tags inofensivos como <b> y <br>, bloquea scripts y atributos peligrosos.
 */

const permissiveConfig = {
  ALLOWED_TAGS: ['b', 'i', 'strong', 'em', 'br'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  FORBID_ATTR: ['style', 'onclick', 'onload', 'onerror'],
  FORBID_TAGS: ['script', 'object', 'embed', 'base', 'link']
};

/**
 * Sanitiza texto eliminando contenido malicioso.
 * objetivo: Prevenir inyección de scripts y ataques XSS.
 * parametros:
 *   input: Texto a sanitizar
 *   allowBasicFormatting: Permite formato HTML básico (default=false)
 *   preserveWhitespace: Conserva espacios originales (default=true)
 * operacion
 *   -Verifica entrada vacía
 *   -Selecciona configuración según formato permitido
 *   -Aplica DOMPurify con configuración elegida
 *   -Mantiene espacios según parámetro
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

/*Sanitiza texto para envío a servidor.
 * objetivo: Preparar datos para almacenamiento seguro.
 * parametros:
 *   input: Texto a sanitizar
 *   allowBasicFormatting: Permite formato básico
 * operacion
 *   -Llama a sanitizeInput con preserveWhitespace=false
 *   -Elimina espacios sobrantes
 */
export const sanitizeForSubmit = (input: string, allowBasicFormatting = false): string => {
  return sanitizeInput(input, allowBasicFormatting, false); // preserveWhitespace = false
};

/**
 * Sanitiza un objeto completo, aplicando sanitización a todas sus propiedades string
 * 
 * objetivo: Proteger estructuras complejas contra XSS.
 * parametros 
 *   obj: Objeto a sanitizar
 *   allowBasicFormatting: Permite formato básico
 *   forSubmit: Modo para envío (limpia espacios)
 * operacion
 *   -Recorre recursivamente el objeto
 *   -Aplica sanitización a strings y arrays de strings
 *   -Usa sanitizeForSubmit en modo envío
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
 
 * objetivo: Integrar sanitización en componentes
 * parametros 
 *   initialValue: Valor inicial (se sanitiza)
 *   allowBasicFormatting: Permite formato básico
 * operacion
 *  -Inicializa estado con valor sanitizado
 *  -Provee setter que sanitiza antes de actualizar
 */
export const useSanitizedInput = (initialValue = '', allowBasicFormatting = false) => {
  const [value, setValue] = useState(() => sanitizeInput(initialValue, allowBasicFormatting));

  const setSanitizedValue = (newValue: string) => {
    setValue(sanitizeInput(newValue, allowBasicFormatting));
  };

  return [value, setSanitizedValue] as const;
};

/* Crea manejador de eventos onChange sanitizado.
 * objetivo: Simplificar integración en formularios.
 * parametros: 
 *   setter: Función setter del estado
 *   allowBasicFormatting: Permite formato básico
 * operacion:
 *   - Recibe evento de cambio
 *   - Extrae y sanitiza el valor
 *   - Ejecuta setter con valor seguro
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
 * Envuelve un setter existente con sanitización.
 * objetivo: Añadir seguridad a lógica existente.
 * parametros:
 *   originalSetter: Setter original (ej: useState)
 *   fieldName: Nombre para auto-detectar formato
 * operacion:
 *   -Detecta automáticamente si permite formato
 *   -Sanitiza valores string antes de pasar al setter
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
 * objetivo: Refactorizar componentes existentes fácilmente.
 * parametros:
 *   originalHandler: Manejador original onChange
 *   fieldName: Nombre para auto-detectar formato
 * operacion:
 *   - Crea evento clon con valor sanitizado
 *   - Llama al manejador original con evento seguro
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
 * Determina si un campo permite formato básico.
 * objetivo: Automatizar política de formato por nombre de campo.
 * parametros: fieldName: Nombre del campo (ej: "descripcion")
 * operacion:
 *   -Compara con lista predefinida (FIELDS_ALLOWING_BASIC_FORMAT)
 *   -Permite formato si el nombre coincide
 */
export const shouldAllowBasicFormatting = (fieldName: string): boolean => {
  const lowerFieldName = fieldName.toLowerCase();
  return FIELDS_ALLOWING_BASIC_FORMAT.some(field => 
    lowerFieldName.includes(field)
  );
};
