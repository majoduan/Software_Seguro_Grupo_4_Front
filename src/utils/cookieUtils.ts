// utils/cookieUtils.ts
// Crear este archivo nuevo para manejar las cookies

export interface CookieOptions {
  expires?: Date;
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  httpOnly?: boolean;
}

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

    if (finalOptions.httpOnly) {
      cookieString += `; HttpOnly`;
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