import { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Usuario, AuthContextType, Rol } from '../interfaces/user'; // Agregar Rol aquí
import { API, authAPI } from '../api/userAPI';
import { cookieUtils } from '../utils/cookieUtils';


// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props para el AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

// Componente Provider
/*
 * Objetivo:
 * - Administrar la autenticación del usuario de forma segura y persistente.
 * - Proteger el acceso a rutas privadas en función del estado de sesión.
 * - Validar la sesión periódicamente mediante comprobación del token.
 * - Proveer funciones auxiliares para control de roles, logout, y recuperación de identidad.
 * - Manejar almacenamiento seguro de los datos del usuario (sin token en cookies).
 *
 * Parámetros:
 * - children: ReactNode – Componentes hijos que necesitan acceso al contexto de autenticación.
 *
 * Operación:
 * - Usa `cookieUtils` para guardar solo los datos necesarios del usuario en una cookie segura (`user_data`).
 * - Implementa `login()` que actualiza el estado local y redirige al dashboard.
 * - Implementa `logout()` que borra la cookie, limpia el estado y redirige a login.
 * - Ejecuta `verificarToken()` periódicamente (cada 5 minutos) para validar la autenticidad de la sesión.
 * - Verifica al montar si existe una sesión previa persistida en cookies y, si es válida, la restaura.
 * - Utiliza un interceptor de Axios para cerrar sesión automáticamente en respuestas 401 (no autorizado).
 * - Redirige al login si se accede a rutas privadas sin estar autenticado, y al dashboard si ya está autenticado.
 * - Expone funciones de control de rol y datos básicos como `getUserRole`, `hasRole`, `getUserId`, etc.
 * - Expone el contexto global mediante `useAuth`, rest*
*/
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Función para limpiar la autenticación
  const clearAuth = useCallback(() => {
    cookieUtils.remove('user_data');
    setToken(null);
    setUsuario(null);
    //delete API.defaults.headers.common['Authorization'];
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

  // Función para verificar el token periódicamente
  const verificarToken = useCallback(async () => {

    try {
      // Verificar el token con el servidor
      await API.get('/perfil');
      
      // Si llegamos aquí, el token es válido
      return true;
    } catch (error: any) {
      
      // Si es error 401 (no autorizado), el token no es válido
      if (error.response?.status === 401) {
        clearAuth();
        return false;
      }
      
      // Para otros errores, mantener el token (podría ser problema de red)
      return true;
    }
  }, [clearAuth]);

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const inicializarAuth = async () => {
      const storedUsuarioString = cookieUtils.get('user_data');

      //if (storedToken && storedUsuarioString) {
      if (storedUsuarioString) {
        try {
          // Verificar si el token es válido
          const tokenValido = await verificarToken();
          
          if (tokenValido) {
            const parsedUsuario = JSON.parse(storedUsuarioString);

            setToken('cookie-token'); // Token ficticio para indicar autenticación
            setUsuario(parsedUsuario);
            //API.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          }
        } catch (error) {
          clearAuth();
        }
      }

      setLoading(false);
    };

    inicializarAuth();
  }, [verificarToken, clearAuth]);

  // Verificar token periódicamente (cada 5 minutos)
  useEffect(() => {
    if (!token) return;

    const intervalo = setInterval(async () => {
      const tokenValido = await verificarToken();
      if (!tokenValido && token) {
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

  // Función de login
  const login = useCallback((newToken: string, userData: Usuario) => {
      
      try {
        // 🔧 SOLO GUARDAR DATOS BÁSICOS DEL USUARIO (sin token)
        cookieUtils.set('user_data', JSON.stringify({
            id: userData.id,
            nombre: userData.nombre,
            email: userData.email,
            id_rol: userData.id_rol,
            rol: userData.rol
        }), {
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60
        });
        
        setToken("authenticated"); // Token dummy para estado local
        setUsuario(userData);
        navigate('/dashboard');
    } catch (error) {
    }
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