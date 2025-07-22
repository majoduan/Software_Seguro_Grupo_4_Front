// utils/cookieUtils.ts
// Crear este archivo nuevo para manejar las cookies

export interface CookieOptions {
  expires?: Date;
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/* cookieUtils
 * Objetivo: Proporcionar una interfaz segura y consistente para el manejo de cookies 
 * en el navegador desde el frontend, incluyendo creación, lectura, eliminación 
 * y verificación de cookies.
 * 
 * parámetros:
 * - name: Nombre de la cookie (string).
 * - value: Valor de la cookie (string).
 * - options: Opciones adicionales para la cookie como expiración, dominio, 
 *   ruta, secure, sameSite, etc. (CookieOptions).
 * 
 * Operación:
 * El módulo exporta un objeto `cookieUtils` con las siguientes funciones:
 * 
 * - set(name, value, options): Crea o actualiza una cookie con configuraciones seguras por defecto.
 * - get(name): Recupera el valor de una cookie por su nombre.
 * - remove(name, options): Elimina una cookie (establece fecha de expiración pasada).
 * - exists(name): Verifica si una cookie con el nombre dado existe.
 */

export const cookieUtils = {
  // Establecer una cookie
  set: (name: string, value: string, options: CookieOptions = {}): void => {
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    // Opciones por defecto para seguridad
    const defaultOptions: CookieOptions = {
      path: '/',
      secure: window.location.protocol === 'https:', // Secure solo en HTTPS
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 días en segundos
    };

    const finalOptions = { ...defaultOptions, ...options };

    if (finalOptions.maxAge) {
      cookieString += `; Max-Age=${finalOptions.maxAge}`;
    }

    if (finalOptions.expires) {
      cookieString += `; Expires=${finalOptions.expires.toUTCString()}`;
    }

    if (finalOptions.path) {
      cookieString += `; Path=${finalOptions.path}`;
    }

    if (finalOptions.domain) {
      cookieString += `; Domain=${finalOptions.domain}`;
    }

    if (finalOptions.secure) {
      cookieString += `; Secure`;
    }

    if (finalOptions.sameSite) {
      cookieString += `; SameSite=${finalOptions.sameSite}`;
    }
    document.cookie = cookieString;
  },

  // Obtener una cookie
  get: (name: string): string | null => {
    const nameEQ = `${encodeURIComponent(name)}=`;
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }
    return null;
  },

  // Eliminar una cookie
  remove: (name: string, options: Partial<CookieOptions> = {}): void => {
    const removeOptions = {
      ...options,
      expires: new Date(0),
      maxAge: 0
    };
    cookieUtils.set(name, '', removeOptions);
  },

  // Verificar si una cookie existe
  exists: (name: string): boolean => {
    return cookieUtils.get(name) !== null;
  }
};