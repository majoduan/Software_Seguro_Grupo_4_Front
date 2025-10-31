# 📋 Sistema de Gestión de POA (Plan Operativo Anual)

Sistema web integral para la gestión y seguimiento de Planes Operativos Anuales (POA), proyectos de investigación, actividades y tareas. Desarrollado con tecnologías modernas y enfoque en seguridad.

## 📑 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Seguridad](#-seguridad)
- [Despliegue](#-despliegue)
- [Desarrollo](#-desarrollo)
- [Documentación Adicional](#-documentación-adicional)
- [Contribución](#-contribución)

## ✨ Características

### Gestión de Proyectos
- ✅ Creación y edición de proyectos de investigación
- ✅ Configuración de tipos de proyecto personalizados
- ✅ Gestión de presupuestos y períodos
- ✅ Control de prórrogas y extensiones
- ✅ Búsqueda y filtrado avanzado de proyectos

### Gestión de POAs
- ✅ Creación y configuración de POAs
- ✅ Asignación de actividades y tareas
- ✅ Seguimiento de avance y cumplimiento
- ✅ Generación de reportes detallados
- ✅ Exportación a Excel

### Sistema de Usuarios y Roles
- ✅ Autenticación segura con JWT
- ✅ Control de acceso basado en roles (RBAC)
- ✅ Roles: Administrador, Director de Investigación, Director de Proyecto, Director de Reformas
- ✅ Gestión de perfiles de usuario

### Reportes y Exportación
- ✅ Dashboard con métricas y estadísticas
- ✅ Reportes de POA personalizables
- ✅ Exportación masiva a Excel
- ✅ Logs de carga de datos Excel
- ✅ Visualización gráfica de datos

### Seguridad
- ✅ Sanitización de inputs con DOMPurify
- ✅ Headers de seguridad HTTP
- ✅ Protección contra XSS, Clickjacking
- ✅ Validación de variables de entorno
- ✅ Gestión segura de sesiones

## 🛠 Tecnologías

### Core
- **React 19** - Biblioteca de UI
- **TypeScript 5.7** - Tipado estático
- **Vite 6.2** - Build tool y dev server

### UI/UX
- **Material-UI (MUI) 7.0** - Componentes UI
- **React Bootstrap 2.10** - Componentes adicionales
- **Lucide React** - Iconografía
- **React Toastify** - Notificaciones

### Routing & State
- **React Router DOM 6.30** - Enrutamiento
- **Context API** - Gestión de estado global

### Seguridad & Validación
- **DOMPurify 3.2** - Sanitización de inputs
- **Axios 1.8** - Cliente HTTP con interceptors

### Utilidades
- **ExcelJS 4.4** - Generación de archivos Excel
- **XLSX 0.18** - Procesamiento de archivos Excel

### Development
- **ESLint 9.21** - Linting
- **TypeScript ESLint 8.24** - Reglas TypeScript
- **esbuild 0.25** - Minificación y bundling

## 📋 Requisitos Previos

- **Node.js**: v20 o superior
- **npm**: v10 o superior
- **Git**: Para clonar el repositorio
- **Docker** (opcional): Para despliegue con contenedores

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/majoduan/Software_Seguro_Grupo_4_Front.git
cd Software_Seguro_Grupo_4_Front
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tu configuración:

```env
# URL del backend API
VITE_URL_BACKEND='https://tu-backend.com'

# Para desarrollo local:
# VITE_URL_BACKEND='http://localhost:8000'
```

### 4. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## ⚙️ Configuración

### Variables de Entorno

| Variable | Descripción | Requerida | Ejemplo |
|----------|-------------|-----------|---------|
| `VITE_URL_BACKEND` | URL del servidor backend | ✅ | `https://api.example.com` |

**Notas de Seguridad:**
- ✅ Usa HTTPS en producción
- ✅ No incluyas credenciales en las variables
- ✅ Las variables `VITE_*` son públicas en el bundle

### Configuración de Vite

El archivo `vite.config.ts` incluye:
- Headers de seguridad HTTP
- Optimizaciones de producción
- Eliminación de console.log en build
- Minificación con esbuild

## 💻 Uso

### Comandos Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo con HMR

# Producción
npm run build        # Compila para producción
npm run preview      # Preview del build de producción

# Calidad de Código
npm run lint         # Ejecuta ESLint
```

### Flujo de Trabajo Típico

1. **Inicio de Sesión**: Accede con credenciales proporcionadas
2. **Dashboard**: Visualiza métricas y proyectos
3. **Crear Proyecto**: Define tipo, presupuesto y fechas
4. **Crear POA**: Asocia POA al proyecto
5. **Agregar Actividades**: Define actividades y tareas
6. **Generar Reportes**: Exporta datos a Excel

## 📂 Estructura del Proyecto

```
Software_Seguro_Grupo_4_Front/
├── public/                    # Archivos estáticos
├── src/
│   ├── api/                   # Servicios de API
│   │   ├── userAPI.ts        # Autenticación y usuarios
│   │   ├── projectAPI.ts     # Gestión de proyectos
│   │   ├── poaAPI.ts         # Gestión de POAs
│   │   ├── actividadAPI.ts   # Actividades
│   │   ├── tareaAPI.ts       # Tareas
│   │   ├── excelAPI.ts       # Exportación Excel
│   │   └── reporteAPI.ts     # Reportes
│   ├── components/           # Componentes reutilizables
│   │   ├── ProtectedRoute.tsx
│   │   ├── RoleProtectedRoute.tsx
│   │   ├── SanitizedInputs.tsx
│   │   ├── ExportarPOA.tsx
│   │   └── ...
│   ├── config/               # Configuración
│   │   └── env.ts           # Validación de variables de entorno
│   ├── context/             # Context API
│   │   └── AuthContext.tsx  # Contexto de autenticación
│   ├── hooks/               # Custom hooks
│   ├── interfaces/          # Definiciones TypeScript
│   │   ├── user.ts
│   │   ├── project.ts
│   │   ├── poa.ts
│   │   ├── actividad.ts
│   │   └── tarea.ts
│   ├── pages/               # Páginas/Vistas
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── CrearProyecto.tsx
│   │   ├── CrearPOA.tsx
│   │   ├── VerProyectos.tsx
│   │   ├── ReportePOA.tsx
│   │   └── ...
│   ├── services/            # Lógica de negocio
│   ├── styles/              # Estilos globales
│   ├── utils/               # Utilidades
│   │   ├── sanitizer.ts    # Sanitización de inputs
│   │   ├── toast.ts        # Notificaciones
│   │   ├── cookieUtils.ts  # Gestión de cookies
│   │   └── ...
│   ├── validators/          # Validadores
│   ├── App.tsx             # Componente principal
│   ├── main.tsx            # Punto de entrada
│   └── theme.tsx           # Tema MUI
├── .env.example            # Ejemplo de variables de entorno
├── .dockerignore
├── Dockerfile              # Configuración Docker
├── docker-compose.yml      # Orquestación Docker
├── package.json
├── tsconfig.json
├── vite.config.ts          # Configuración Vite
└── README.md
```

## 🔒 Seguridad

### Medidas Implementadas

#### 1. Sanitización de Inputs
- **DOMPurify** integrado en todos los formularios
- Prevención de ataques XSS
- Validación en tiempo real
- Ver: `src/utils/sanitizer.ts`, `SANITIZATION_GUIDE.md`

#### 2. Headers de Seguridad HTTP
Configurados en `vite.config.ts`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

#### 3. Validación de Variables de Entorno
- Validación automática al inicio (`src/config/env.ts`)
- Verificación de formato de URLs
- Alertas para configuraciones inseguras
- Singleton pattern para configuración global

#### 4. Autenticación y Autorización
- Tokens JWT con expiración
- Almacenamiento seguro en sessionStorage
- Rutas protegidas por autenticación
- Control de acceso basado en roles (RBAC)

#### 5. Optimizaciones de Producción
- Eliminación automática de console.log
- Minificación de código
- Ofuscación de nombres de archivos
- Source maps solo en desarrollo

Ver documentación detallada en: `SECURITY_IMPROVEMENTS.md`

## 🐳 Despliegue

### Docker

#### Desarrollo con Docker Compose

```bash
# Construir y ejecutar
docker-compose up --build

# Ejecutar en segundo plano
docker-compose up -d

# Detener
docker-compose down
```

La aplicación estará disponible en `http://localhost:5173`

#### Construcción Manual

```bash
# Construir imagen
docker build -t poa-frontend .

# Ejecutar contenedor
docker run -p 5173:5173 \
  -e VITE_URL_BACKEND='https://tu-backend.com' \
  poa-frontend
```

### Despliegue en Producción

#### Build de Producción

```bash
# Generar build optimizado
npm run build

# El resultado estará en la carpeta dist/
```

#### Servir con Servidor Estático

```bash
# Instalar servidor estático
npm install -g serve

# Servir archivos
serve -s dist -l 5173
```

#### Variables de Entorno en Producción

Asegúrate de configurar:
- ✅ `VITE_URL_BACKEND` apuntando al backend de producción
- ✅ HTTPS habilitado
- ✅ CORS configurado en el backend

## 👨‍💻 Desarrollo

### Estructura de Rutas

```typescript
// Rutas públicas
/login              // Página de inicio de sesión

// Rutas protegidas (requieren autenticación)
/dashboard          // Panel principal
/perfil             // Perfil de usuario

// Rutas con control de roles
/register           // [Admin] Registro de usuarios
/tipos-proyecto     // [Admin, Dir. Investigación] Tipos de proyecto
/crear-proyecto     // [Admin, Dir. Investigación] Crear proyecto
/crear-poa          // [Admin, Dir. Investigación] Crear POA
/editar-proyecto    // [Admin, Dir. Investigación] Editar proyecto
/editar-poa         // [Admin, Dir. Investigación] Editar POA
/agregar-actividad  // [Admin, Dir. Inv., Dir. Proyecto] Actividades
/editar-actividad   // [Admin, Dir. Inv., Dir. Proyecto] Editar actividad
/ver-proyectos      // [Admin, Dir. Inv., Dir. Proyecto, Dir. Reformas]
/reporte-poa        // [Admin, Dir. Reformas] Reportes
/LogsCargaExcel     // [Admin, Dir. Reformas] Logs Excel
```

### Sistema de Roles

```typescript
ROLES = {
  ADMINISTRADOR: "Administrador",
  DIRECTOR_DE_INVESTIGACION: "Director de Investigación",
  DIRECTOR_DE_PROYECTO: "Director de Proyecto",
  DIRECTOR_DE_REFORMAS: "Director de Reformas"
}
```

### Convenciones de Código

- **TypeScript**: Tipado estricto en toda la aplicación
- **Componentes**: PascalCase (ej: `CrearProyecto.tsx`)
- **Hooks**: camelCase con prefijo `use` (ej: `useSanitizedForm.ts`)
- **Utilidades**: camelCase (ej: `sanitizer.ts`)
- **Interfaces**: PascalCase (ej: `interface Proyecto`)
- **Constantes**: UPPER_SNAKE_CASE (ej: `BACKEND_URL`)

### Testing y Linting

```bash
# Ejecutar linter
npm run lint

# Auto-fix de problemas de linting
npm run lint -- --fix
```

## 📚 Documentación Adicional

- **[SECURITY_IMPROVEMENTS.md](SECURITY_IMPROVEMENTS.md)** - Mejoras de seguridad implementadas
- **[SANITIZATION_GUIDE.md](SANITIZATION_GUIDE.md)** - Guía de sanitización de inputs
- **[REFACTORING_DOCUMENTATION.md](REFACTORING_DOCUMENTATION.md)** - Refactorizaciones realizadas
- **[IMPLEMENTACION_COMPLETA.md](IMPLEMENTACION_COMPLETA.md)** - Implementación completa del sistema
- **[HOOK_SANITIZATION_EXAMPLE.md](HOOK_SANITIZATION_EXAMPLE.md)** - Ejemplos de hooks de sanitización

## 🤝 Contribución

### Proceso de Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

### Estándares de Código

- ✅ Seguir convenciones de TypeScript
- ✅ Documentar funciones con JSDoc
- ✅ Sanitizar todos los inputs de usuario
- ✅ Implementar validaciones apropiadas
- ✅ Mantener el tipado estricto
- ✅ Pasar el linter sin errores

## 📝 Licencia

Este proyecto es propiedad del Grupo 4 - Software Seguro.

## 👥 Autores

- Grupo 4 - Software Seguro
- [GitHub: majoduan](https://github.com/majoduan)

## 🔗 Enlaces

- **Backend**: [Software_Seguro_Grupo_4_Back](https://github.com/majoduan/Software_Seguro_Grupo_4_Back)
- **Producción Backend**: https://software-seguro-grupo-4-back.onrender.com

## ⚠️ Notas Importantes

- ⚡ En desarrollo, el servidor soporta Hot Module Replacement (HMR)
- 🔒 Todas las comunicaciones con el backend deben ser HTTPS en producción
- 🛡️ Los inputs se sanitizan automáticamente para prevenir XSS
- 📊 Los reportes Excel se generan en el cliente para mejor rendimiento
- 🔐 Los tokens JWT expiran y requieren re-autenticación
- 💾 Las sesiones se almacenan en sessionStorage (se limpian al cerrar navegador)

---

**Desarrollado con ❤️ por el Grupo 4 - Software Seguro**
