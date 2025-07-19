// Ejemplo de cómo actualizar useProjectForm.ts para añadir sanitización

// 1. Añadir import al inicio del archivo:
import { sanitizeInput } from '../utils/sanitizer';

// 2. Modificar los setters existentes para que saniticen automáticamente:

// En lugar de estos setters normales:
const [titulo, setTitulo] = useState('');
const [descripcion, setDescripcion] = useState('');

// Usar estos con sanitización automática:
const [titulo, setTituloInternal] = useState('');
const [descripcion, setDescripcionInternal] = useState('');

const setTitulo = (value: string) => setTituloInternal(sanitizeInput(value));
const setDescripcion = (value: string) => setDescripcionInternal(sanitizeInput(value, true)); // true para permitir formato

// 3. O crear una función helper dentro del hook:
const createSanitizedSetter = (setter: (value: string) => void, fieldName: string) => {
  return (value: string) => {
    const allowFormatting = ['descripcion', 'comentarios', 'observaciones'].includes(fieldName.toLowerCase());
    setter(sanitizeInput(value, allowFormatting));
  };
};

// Y usarla así:
const [titulo, setTituloInternal] = useState('');
const setTitulo = createSanitizedSetter(setTituloInternal, 'titulo');

// 4. En el return del hook, también sanitizar los datos finales:
return {
  // ... otros campos
  titulo,
  descripcion,
  // Función para obtener datos sanitizados para envío
  getSanitizedFormData: () => ({
    codigo_proyecto: sanitizeInput(codigo_proyecto),
    titulo: sanitizeInput(titulo),
    descripcion: sanitizeInput(descripcion, true),
    presupuesto_aprobado,
    // ... otros campos
  }),
  // ... otros returns
};

// 5. En handleSubmit del hook, usar datos sanitizados:
const handleSubmit = async (): Promise<boolean> => {
  try {
    const sanitizedData = getSanitizedFormData();
    
    if (isEditing) {
      await projectAPI.updateProject(sanitizedData);
    } else {
      await projectAPI.createProject(sanitizedData);
    }
    return true;
  } catch (error) {
    // ... manejo de errores
    return false;
  }
};
