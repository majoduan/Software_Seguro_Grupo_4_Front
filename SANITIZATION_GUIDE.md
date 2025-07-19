# Implementación de Sanitización con DOMPurify

## Resumen

Esta implementación proporciona múltiples formas **eficientes** de añadir sanitización a tus formularios existentes con **cambios mínimos**.

## Archivos Creados

1. **`src/utils/sanitizer.ts`** - Utilidades principales de sanitización
2. **`src/hooks/useSanitizedForm.ts`** - Hook para formularios completos  
3. **`src/components/SanitizedInputs.tsx`** - Componentes wrapper opcionales

## Opciones de Implementación (de más fácil a más avanzada)

### Opción 1: Wrapper de Setters (MÍNIMOS CAMBIOS) ⭐ RECOMENDADA

Esta es la opción **más fácil** para tus formularios existentes:

```tsx
import { withSanitization } from '../utils/sanitizer';

const MiComponente = () => {
    const [email, setEmail] = useState('');
    const [descripcion, setDescripcion] = useState('');
    
    // Solo añade estas líneas:
    const setSanitizedEmail = withSanitization(setEmail, 'email');
    const setSanitizedDescripcion = withSanitization(setDescripcion, 'descripcion');
    
    return (
        <div>
            <input 
                value={email} 
                onChange={(e) => setSanitizedEmail(e.target.value)} // Cambio mínimo
            />
            <textarea 
                value={descripcion} 
                onChange={(e) => setSanitizedDescripcion(e.target.value)} // Cambio mínimo
            />
        </div>
    );
};
```

**Ventajas:**
- Solo 2 líneas adicionales por setter
- Solo cambiar `setXXX` por `setSanitizedXXX` en onChange
- Detecta automáticamente campos que necesitan formato (como descripcion, comentarios)

### Opción 2: Sanitización Manual Puntual

Para casos específicos donde quieres control total:

```tsx
import { sanitizeInput } from '../utils/sanitizer';

const handleSubmit = async () => {
    const sanitizedData = {
        email: sanitizeInput(email),
        descripcion: sanitizeInput(descripcion, true), // true = permitir formato básico
        nombre: sanitizeInput(nombre)
    };
    
    await api.create(sanitizedData);
};
```

### Opción 3: Hook para Formularios Completos

Para formularios nuevos o refactorización mayor:

```tsx
import { useSanitizedForm } from '../hooks/useSanitizedForm';

const MiFormulario = () => {
    const { formData, createFieldHandler, getSanitizedData } = useSanitizedForm({
        nombre: '',
        email: '',
        descripcion: ''
    });
    
    return (
        <form onSubmit={() => console.log(getSanitizedData())}>
            <input 
                value={formData.nombre}
                onChange={createFieldHandler('nombre')}
            />
            <input 
                value={formData.email}
                onChange={createFieldHandler('email')}
            />
            <textarea 
                value={formData.descripcion}
                onChange={createFieldHandler('descripcion')}
            />
        </form>
    );
};
```

### Opción 4: Componentes Wrapper (Opcional)

Si prefieres componentes que manejen todo automáticamente:

```tsx
import { SanitizedInput, SanitizedTextArea } from '../components/SanitizedInputs';

const MiComponente = () => {
    const [email, setEmail] = useState('');
    
    return (
        <SanitizedInput 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            name="email" // Auto-detecta configuración de sanitización
        />
    );
};
```

## Configuración de Sanitización

### Automática por Nombre de Campo

La librería detecta automáticamente qué campos permiten formato básico:
- `descripcion`, `description` → Permite `<b>`, `<i>`, `<strong>`, `<em>`, `<br>`
- `comentarios`, `comments` → Permite formato básico
- `observaciones`, `notas`, `notes` → Permite formato básico
- Todos los demás → Solo texto plano

### Manual

```tsx
// Solo texto plano (por defecto)
sanitizeInput("texto <script>alert(1)</script>") // → "texto alert(1)"

// Con formato básico permitido
sanitizeInput("texto <b>importante</b> <script>alert(1)</script>", true) 
// → "texto <b>importante</b> alert(1)"
```

## Implementación Sugerida para tu Proyecto

### Paso 1: Formularios Críticos (Login, Register)
- Usar **Opción 1** (withSanitization)
- Cambios: ~2 líneas por formulario

### Paso 2: Formularios de Creación/Edición
- Para formularios simples: **Opción 1**
- Para formularios complejos: **Opción 3** (useSanitizedForm)

### Paso 3: Validación en Envío
```tsx
// En cualquier handleSubmit existente:
import { sanitizeObject } from '../utils/sanitizer';

const handleSubmit = async () => {
    const sanitizedData = sanitizeObject(formData);
    await api.create(sanitizedData);
};
```

## Qué Protege

- **XSS (Cross-Site Scripting)**: Elimina `<script>`, `onclick`, etc.
- **Inyección HTML**: Limpia tags maliciosos manteniendo contenido
- **Inyección de Estilo**: Elimina `style` attributes
- **Event Handlers**: Elimina `onload`, `onerror`, etc.

## Qué NO Afecta

- **Funcionalidad existente**: Los valores siguen siendo strings normales
- **Validación**: No interfiere con validaciones de email, required, etc.
- **Performance**: Sanitización es instantánea
- **UX**: El usuario no nota diferencia en la interfaz

## Ejemplos Rápidos

### Login (ya implementado)
```tsx
const setSanitizedEmail = withSanitization(setEmail, 'email');
const setSanitizedPassword = withSanitization(setPassword, 'password');

// Cambiar onChange:
onChange={(e) => setSanitizedEmail(e.target.value)}
```

### Registro
```tsx
const setSanitizedNombre = withSanitization(setNombreUsuario, 'nombre');
const setSanitizedEmail = withSanitization(setEmail, 'email');

// En inputs:
onChange={(e) => setSanitizedNombre(e.target.value)}
```

### Crear Proyecto
```tsx
// Si usa un hook personalizado, aplicar en el hook
// O aplicar directamente en handleSubmit:
const handleSubmit = async () => {
    const sanitizedProject = sanitizeObject(projectData);
    await createProject(sanitizedProject);
};
```

## Testing

```tsx
import { sanitizeInput } from '../utils/sanitizer';

// Casos de prueba
console.log(sanitizeInput('<script>alert("hack")</script>usuario@email.com')); 
// → 'usuario@email.com'

console.log(sanitizeInput('Proyecto <b>importante</b> <script>hack</script>', true));
// → 'Proyecto <b>importante</b> hack'
```

Esta implementación es **segura**, **eficiente** y requiere **cambios mínimos** en tu código existente.
