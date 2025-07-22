import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[]; // UUIDs de roles
  fallbackPath?: string;
}

/**
 * Componente RoleProtectedRoute
 * Objetivo:
 * - Restringir el acceso a rutas del sistema según la autenticación del usuario y sus roles autorizados.
 * - Proporcionar un control de acceso basado en roles.
 *
 * Parámetros:
 * - children: React.ReactNode – Componente(s) hijos que se renderizarán si el usuario cumple con las condiciones de seguridad.
 * - requiredRoles?: string[] – Lista opcional de UUIDs de roles requeridos para acceder a la ruta.
 * - fallbackPath?: string – Ruta a redirigir si el usuario está autenticado pero no tiene los permisos requeridos. Por defecto: `/dashboard`.
 *
 * Operación:
 * - Usa el contexto de autenticación (`useAuth`) para verificar:
 *   - Si el usuario está autenticado (`isAuthenticated`).
 *   - Si la verificación aún está en curso (`loading`).
 *   - Si el usuario tiene al menos uno de los roles necesarios (`hasAnyRole`).
 * - Si el usuario no está autenticado, es redirigido al login.
 * - Si el usuario está autenticado pero no tiene los roles requeridos, es redirigido al `fallbackPath`.
 * - Si cumple los requisitos o no se especificaron roles, se renderizan los componentes hijos.
 */

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  fallbackPath = '/dashboard'
}) => {
  const { 
    isAuthenticated, 
    hasAnyRole, 
    loading,
  } = useAuth();


  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return <div>Cargando...</div>;
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar permisos por UUID (método recomendado)
  if (requiredRoles.length > 0) {
    const hasPermission = hasAnyRole(requiredRoles);
    
    if (!hasPermission) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  // Si no se especificaron roles requeridos, permitir acceso
  if (requiredRoles.length === 0) {
    return <>{children}</>;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;