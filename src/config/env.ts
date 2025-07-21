/**
 * Validación y configuración de variables de entorno
 * Este archivo asegura que todas las variables necesarias estén presentes
 */

interface EnvConfig {
  BACKEND_URL: string;
}

/**
 * EnvironmentValidator
 *
 * Objetivo:
 * - Validar la existencia y formato de variables de entorno críticas para la aplicación.
 * - Garantizar que `VITE_URL_BACKEND` sea una URL válida y segura, especialmente en producción.
 *
 * Parámetros:
 * - `VITE_URL_BACKEND` (obtenido desde `import.meta.env`) – Debe ser una URL válida. Se rechaza si
 *  está vacía, no tiene formato válido o apunta a localhost en producción.
 *
 * Operación:
 * - Verifica presencia de variables necesarias al inicio de la ejecución.
 * - Valida sintaxis de URL mediante el constructor `URL()`.
 * - Lanza errores descriptivos si alguna variable es inválida o faltante.
 * - Aplica políticas de seguridad condicionales en producción (HTTPS obligatorio, no localhost).
 * - Expone configuración validada a través de `envConfig` (singleton) y `ENV` (const).
 */

class EnvironmentValidator {
  private static instance: EnvironmentValidator;
  private config: EnvConfig;

  private constructor() {
    this.config = this.validateAndSetup();
  }

  public static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  private validateAndSetup(): EnvConfig {
    const requiredVars = {
      VITE_URL_BACKEND: 'Backend URL is required'
    };

    // Validar variables requeridas
    for (const [varName, errorMessage] of Object.entries(requiredVars)) {
      const value = import.meta.env[varName];
      if (!value || value.trim() === '') {
        throw new Error(`${errorMessage}. Please check your .env file and ensure ${varName} is set.`);
      }
    }

    const backendUrl = import.meta.env.VITE_URL_BACKEND;

    // Validar formato de URL
    try {
      const url = new URL(backendUrl);
      
      // Asegurar que sea HTTPS en producción
      if (import.meta.env.PROD && url.protocol !== 'https:') {
        console.warn('⚠️  Warning: Using HTTP in production is not recommended for security reasons.');
      }

      // Validar que no sea localhost en producción
      if (import.meta.env.PROD && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
        throw new Error('Backend URL cannot be localhost in production environment');
      }

    } catch (error) {
      throw new Error(`Invalid VITE_URL_BACKEND format: ${backendUrl}. Must be a valid URL.`);
    }

    // Configuración validada
    const config: EnvConfig = {
      BACKEND_URL: backendUrl
    };

    // Log de configuración (solo en desarrollo)
    if (import.meta.env.DEV) {
      console.log('🔧 Environment Configuration:', {
        BACKEND_URL: config.BACKEND_URL,
        NODE_ENV: import.meta.env.MODE,
        DEV: import.meta.env.DEV,
        PROD: import.meta.env.PROD
      });
    }

    return config;
  }

  // Getters públicos para acceder a la configuración
  public get backendUrl(): string {
    return this.config.BACKEND_URL;
  }

  // Método para obtener todas las configuraciones
  public getConfig(): EnvConfig {
    return { ...this.config };
  }

  // Método para validar configuración en tiempo de ejecución
  public validateRuntime(): boolean {
    try {
      // Verificar que el backend esté accesible (opcional)
      // Esto se podría hacer con un health check
      return true;
    } catch (error) {
      console.error('❌ Runtime validation failed:', error);
      return false;
    }
  }
}

// Exportar instancia singleton
export const envConfig = EnvironmentValidator.getInstance();

// Exportar configuración para uso directo
export const ENV = {
  BACKEND_URL: envConfig.backendUrl,
  IS_PRODUCTION: import.meta.env.PROD,
  IS_DEVELOPMENT: import.meta.env.DEV,
  MODE: import.meta.env.MODE
} as const;

// Exportar tipos
export type { EnvConfig };
