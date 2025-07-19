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
          console.error('Error en logout:', error);
      }
      clearAuth();
      navigate('/login');
  }, [clearAuth, navigate]);

  // Función para obtener el rol completo
  const getUserRole = (): Rol | null => {
    console.log('getUserRole() - usuario:', usuario);
    console.log('getUserRole() - usuario.rol:', usuario?.rol);
    return usuario?.rol || null;
  };

  // Función para verificar rol por UUID
  const hasRole = (roleId: string): boolean => {
    const result = usuario?.id_rol === roleId;
    console.log(`hasRole(${roleId}):`, result);
    console.log('usuario?.id_rol:', usuario?.id_rol);
    return result;
  };

  // Función para verificar múltiples roles por UUID
  const hasAnyRole = (roleIds: string[]): boolean => {
    const result = roleIds.some(roleId => hasRole(roleId));
    console.log(`hasAnyRole(${roleIds.join(', ')}):`, result);
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
      const response = await API.get('/perfil');
      
      // Si llegamos aquí, el token es válido
      return true;
    } catch (error: any) {
      console.log('Error al verificar token:', error);
      
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

      console.log('=== Inicializando Auth ===');
      //console.log('storedToken:', storedToken ? 'Existe' : 'No existe');
      console.log('storedUsuario:', storedUsuarioString ? 'Existe' : 'No existe');

      //if (storedToken && storedUsuarioString) {
      if (storedUsuarioString) {
        try {
          // Verificar si el token es válido
          const tokenValido = await verificarToken();
          
          if (tokenValido) {
            const parsedUsuario = JSON.parse(storedUsuarioString);
            console.log('Usuario parseado:', parsedUsuario);

            setToken('cookie-token'); // Token ficticio para indicar autenticación
            setUsuario(parsedUsuario);
            //API.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          }
        } catch (error) {
          console.error('Error al parsear datos del usuario:', error);
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
        console.log('Token inválido detectado, cerrando sesión');
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
          console.log('Respuesta 401 detectada, cerrando sesión');
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
      console.log('=== Login ===');
      
      try {
        // 🔧 SOLO GUARDAR DATOS BÁSICOS DEL USUARIO (sin token)
        cookieUtils.set('user_data', JSON.stringify({
            id: userData.id,
            nombre: userData.nombre,
            email: userData.email,
            id_rol: userData.id_rol,
            rol: userData.rol
        }), {
            secure: window.location.protocol === 'https:',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60
        });
        
        setToken("authenticated"); // Token dummy para estado local
        setUsuario(userData);
        navigate('/dashboard');
    } catch (error) {
        console.error('Error guardando datos de autenticación:', error);
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