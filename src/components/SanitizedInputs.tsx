import React from 'react';
import { sanitizeInput, shouldAllowBasicFormatting } from '../utils/sanitizer';

interface SanitizedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  allowBasicFormatting?: boolean;
  autoSanitize?: boolean; // Por defecto true, pero se puede desactivar
}

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
