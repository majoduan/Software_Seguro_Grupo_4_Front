import { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Usuario, AuthContextType, Rol } from '../interfaces/user'; // Agregar Rol aquí
import { API, authAPI } from '../api/userAPI';


// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props para el AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

// Componente Provider
/*
 * Objetivo:
 * - Administrar la autenticación del usuario de forma segura usando cookie HttpOnly del backend.
 * - Proteger el acceso a rutas privadas en función del estado de sesión.
 * - Validar la sesión periódicamente mediante comprobación del token con el backend.
 * - Proveer funciones auxiliares para control de roles, logout, y recuperación de identidad.
 *
 * Parámetros:
 * - children: ReactNode – Componentes hijos que necesitan acceso al contexto de autenticación.
 *
 * Operación:
 * - NO guarda tokens en cookies visibles (el backend maneja auth_token como HttpOnly).
 * - Implementa `login()` que actualiza solo el estado React y redirige al dashboard.
 * - Implementa `logout()` que llama al backend para invalidar la cookie y limpia el estado.
 * - Ejecuta `verificarToken()` periódicamente (cada 5 minutos) consultando GET /perfil.
 * - Al montar, verifica sesión consultando GET /perfil; si es válida, restaura el usuario.
 * - Utiliza un interceptor de Axios para cerrar sesión automáticamente en respuestas 401.
 * - Redirige al login si se accede a rutas privadas sin estar autenticado.
 * - Expone funciones de control de rol y datos básicos como `getUserRole`, `hasRole`, `getUserId`, etc.
*/
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Función para limpiar la autenticación
  const clearAuth = useCallback(() => {
    setToken(null);
    setUsuario(null);
  }, []);

  // Función de logout
  const logout = useCallback(async () => {
      try {
          await authAPI.logout(); // Llamar al endpoint del backend
      } catch (error) {
      }
      clearAuth();
      navigate('/login');
  }, [clearAuth, navigate]);

  // Función para obtener el rol completo
  const getUserRole = (): Rol | null => {
    return usuario?.rol || null;
  };

  // Función para verificar rol por UUID
  const hasRole = (roleId: string): boolean => {
    const result = usuario?.id_rol === roleId;
    return result;
  };

  // Función para verificar múltiples roles por UUID
  const hasAnyRole = (roleIds: string[]): boolean => {
    const result = roleIds.some(roleId => hasRole(roleId));
    return result;
  };

  // Funciones de utilidad
  const getUserId = (): string | null => {
    return usuario?.id || null;
  };

  const getRoleId = (): string | null => {
    return usuario?.id_rol || null;
  };

  // Función para verificar el token periódicamente consultando el backend
  const verificarToken = useCallback(async (): Promise<Usuario | null> => {
    try {
      // Verificar el token con el servidor y obtener datos del usuario
      const response = await API.get('/perfil');
      return response.data;
    } catch (error: any) {
      // Si es error 401 (no autorizado), el token no es válido
      if (error.response?.status === 401) {
        clearAuth();
      }
      // Para otros errores, no hacer nada (podría ser problema de red)
      return null;
    }
  }, [clearAuth]);

  // Verificar autenticación al cargar el componente consultando directamente al backend
  useEffect(() => {
    const inicializarAuth = async () => {
      try {
        // Consultar directamente al backend (usa cookie auth_token HttpOnly)
        const userData = await verificarToken();

        if (userData) {
          // Mapear respuesta del backend a interfaz Usuario
          const usuario: Usuario = {
            id: userData.id,
            nombre: userData.nombre_usuario || userData.nombre,
            email: userData.email,
            id_rol: userData.id_rol,
            rol: userData.rol
          };

          setToken('authenticated'); // Token dummy para indicar estado autenticado
          setUsuario(usuario);
        }
      } catch (error) {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    inicializarAuth();
  }, [verificarToken, clearAuth]);

  // Verificar token periódicamente (cada 5 minutos)
  useEffect(() => {
    if (!token) return;

    const intervalo = setInterval(async () => {
      const userData = await verificarToken();
      if (!userData && token) {
        // Si no hay datos del usuario, la sesión expiró
        logout();
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(intervalo);
  }, [token, verificarToken, logout]);

  // Interceptor para manejar respuestas 401
  useEffect(() => {
    const interceptor = API.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && token) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      API.interceptors.response.eject(interceptor);
    };
  }, [token, logout]);

  // Redireccionar según autenticación y ruta
  useEffect(() => {
    if (!loading) {
      const isPublicRoute = ['/login'].includes(location.pathname);

      if (!token && !isPublicRoute) {
        // Si no hay token y no es ruta pública, redirigir a login
        navigate('/login');
      } else if (token && isPublicRoute) {
        // Si hay token y es ruta pública, redirigir a la página principal
        navigate('/dashboard');
      }
    }
  }, [token, location.pathname, loading, navigate]);

  // Función de login - Solo actualiza estado React (cookie auth_token ya está configurada por backend)
  const login = useCallback((_newToken: string, userData: Usuario) => {
    // La autenticación real está en la cookie HttpOnly (auth_token) configurada por el backend
    // Aquí solo actualizamos el estado React para la UI
    setToken("authenticated"); // Token dummy para indicar estado autenticado
    setUsuario(userData);
    navigate('/dashboard');
  }, [navigate]);

  // Valor del contexto
  const value = {
    usuario,
    token,
    isAuthenticated: !!token,
    login,
    logout,
    loading,
    getUserRole,
    hasRole,
    hasAnyRole,
    getUserId,
    getRoleId
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : <div>Cargando...</div>}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};