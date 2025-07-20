import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[]; // UUIDs de roles
  fallbackPath?: string;
}

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