import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Componente ProtectedRoute
 * Objetivo:
 * - Asegurar que ciertas rutas solo puedan ser accedidas por usuarios autenticados.
 * - Impedir el acceso no autorizado a recursos o pantallas sensibles.
 * 
 * Parámetros:
 * - children: ReactNode – El contenido que se desea proteger y mostrar solo a usuarios autenticados.
 *
 * Operación:
 * - Usa el contexto `AuthContext` para verificar si el usuario está autenticado (`isAuthenticated`)
 *   y si la verificación aún está en proceso (`loading`).
 * - Mientras `loading` es verdadero, muestra un mensaje de carga simple.
 * - Si el usuario no está autenticado:
 *    - Redirige automáticamente a la ruta `/login`.
 *    - Preserva la ubicación original (`location`) en el estado de navegación para una posible 
 * redirección posterior al login.
 * - Si el usuario está autenticado:
 *    - Renderiza los `children` proporcionados como contenido protegido.
 *
 */

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return <div>Cargando...</div>;
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    // Guardar la ubicación actual para redirigir después del login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si está autenticado, mostrar el componente
  return <>{children}</>;
};

export default ProtectedRoute;