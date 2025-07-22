import React from 'react';
import { sanitizeInput, shouldAllowBasicFormatting } from '../utils/sanitizer';

/**
 * SanitizedInput
 *
 * Componente Input de React que aplica sanitización automática al valor ingresado para evitar
 * vulnerabilidades XSS u otros tipos de inyección maliciosa en los datos de entrada.
 * 
 * Parámetros:
 * - value: string – Valor controlado del input.
 * - onChange: (event: React.ChangeEvent<HTMLInputElement>) => void – Callback para cambios, recibe evento con valor sanitizado.
 * - allowBasicFormatting?: boolean – Indica si se permite un formato básico (como etiquetas HTML seguras). Por defecto, se decide según el nombre del input con `shouldAllowBasicFormatting`.
 * - autoSanitize?: boolean – Si es `true` (por defecto), activa la sanitización automática; si es `false`, pasa el valor sin modificar.
 *
 * Funcionamiento:
 * - En el evento onChange, si `autoSanitize` está activo, el valor ingresado se pasa por `sanitizeInput`
 *   para limpiar cualquier contenido peligroso, permitiendo formato básico si corresponde.
 * - Luego se genera un nuevo evento con el valor sanitizado que se envía al callback onChange.
 * - Esto asegura que el valor que se maneje en el estado y posteriormente en la UI sea seguro.
 *
 */


interface SanitizedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  allowBasicFormatting?: boolean;
  autoSanitize?: boolean; // Por defecto true, pero se puede desactivar
}

/*
 * SanitizedTextArea
 *
 * Componente TextArea que aplica sanitización automática al contenido ingresado,
 * similar a SanitizedInput pero para áreas de texto multilinea.
 * 
 * Parámetros:
 * - value: string – Valor controlado del textarea.
 * - onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void – Callback para cambios, con valor sanitizado.
 * - allowBasicFormatting?: boolean – Permite formato básico según sea necesario.
 * - autoSanitize?: boolean – Activa/desactiva sanitización automática. Por defecto `true`.
 * 
 */

interface SanitizedTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  allowBasicFormatting?: boolean;
  autoSanitize?: boolean;
}

/**
 * Input component with automatic sanitization
 */
export const SanitizedInput: React.FC<SanitizedInputProps> = ({
  value,
  onChange,
  allowBasicFormatting,
  autoSanitize = true,
  name,
  ...props
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!autoSanitize) {
      onChange(event);
      return;
    }

    const rawValue = event.target.value;
    const shouldFormat = allowBasicFormatting ?? (name ? shouldAllowBasicFormatting(name) : false);
    const sanitizedValue = sanitizeInput(rawValue, shouldFormat);
    
    // Crear un nuevo evento con el valor sanitizado
    const sanitizedEvent = {
      ...event,
      target: {
        ...event.target,
        value: sanitizedValue
      }
    };
    
    onChange(sanitizedEvent as React.ChangeEvent<HTMLInputElement>);
  };

  return <input {...props} name={name} value={value} onChange={handleChange} />;
};

/**
 * TextArea component with automatic sanitization
 */
export const SanitizedTextArea: React.FC<SanitizedTextAreaProps> = ({
  value,
  onChange,
  allowBasicFormatting,
  autoSanitize = true,
  name,
  ...props
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!autoSanitize) {
      onChange(event);
      return;
    }

    const rawValue = event.target.value;
    const shouldFormat = allowBasicFormatting ?? (name ? shouldAllowBasicFormatting(name) : false);
    const sanitizedValue = sanitizeInput(rawValue, shouldFormat);
    
    // Crear un nuevo evento con el valor sanitizado
    const sanitizedEvent = {
      ...event,
      target: {
        ...event.target,
        value: sanitizedValue
      }
    };
    
    onChange(sanitizedEvent as React.ChangeEvent<HTMLTextAreaElement>);
  };

  return <textarea {...props} name={name} value={value} onChange={handleChange} />;
};
