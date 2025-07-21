
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Offcanvas } from 'react-bootstrap';
import { useAuth } from './context/AuthContext';
import SidebarContent from './pages/SidebarContent';
import './styles/Screen.css';

/**
 * Componente AppLayout
 * 
 * Objetivo:
 * - Proveer la estructura general de la aplicación con sidebar y contenido principal,
 *   controlando la visibilidad y estado del sidebar según la autenticación y la ruta actual.
 * 
 * Parámetros:
 * - children: React.ReactNode
 *   Contenido que se renderiza dentro del layout (páginas, componentes, etc.).
 * 
 * Operación:
 * - Obtiene el estado de autenticación y usuario desde el contexto AuthContext.
 * - Detecta la ruta actual para determinar si es pública
 * - Controla el estado de colapso del sidebar para adaptar la UI según preferencias o tamaño de pantalla.
 * - Aplica clases CSS condicionales para ajustar el layout y evitar que contenido quede inaccesible
 *  o mal distribuido.
 **/

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  // Estado para el sidebar móvil
  const [showSidebar, setShowSidebar] = useState(false);
  // Estado para controlar si el sidebar está colapsado (en pantallas grandes)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const { usuario, isAuthenticated } = useAuth();
  const location = useLocation();
  
  const handleCloseSidebar = () => setShowSidebar(false);
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
  
  // Determinar si estamos en una ruta pública
  const isPublicRoute = ['/login'].includes(location.pathname);
  
  // 🌌 Cambiar el fondo del body solo en login
  useEffect(() => {
    if (isPublicRoute) {
      document.body.style.backgroundColor = '#01050E';
    } else {
      document.body.style.backgroundColor = ''; // Reset (usa lo que tengas por defecto)
    }
  }, [isPublicRoute]);

  // Función para determinar las clases del contenido principal
  const getMainContentClasses = () => {
    if (isPublicRoute) {
      return 'main-content main-content-public';
    }
    if (isAuthenticated) {
      return isSidebarCollapsed 
        ? 'main-content main-content-authenticated-collapsed'
        : 'main-content main-content-authenticated-expanded';
    }
    return 'main-content main-content-public';
  };

  return (
    <div className="app-layout">
      {/* Sidebar para pantallas grandes - solo se muestra en rutas protegidas */}
      {isAuthenticated && !isPublicRoute && (
        <div 
          className={`sidebar-desktop custom-scrollbar ${
            isSidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'
          }`}
        >
          {usuario && (
            <SidebarContent 
              usuario={usuario} 
              isSidebarCollapsed={isSidebarCollapsed}
              toggleSidebar={toggleSidebar}
            />
          )}
        </div>
      )}
      
      {/* Contenido principal con margen para compensar el sidebar fijo */}
      <div className={getMainContentClasses()}>
        {/* Sidebar como Offcanvas para pantallas pequeñas */}
        <Offcanvas 
          show={showSidebar} 
          onHide={handleCloseSidebar} 
          className="sidebar-mobile custom-scrollbar" 
        >
          <Offcanvas.Header closeButton closeVariant="white">
            <Offcanvas.Title>Menú</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="sidebar-mobile">
            {usuario && (
              <SidebarContent 
                usuario={usuario} 
                onItemClick={handleCloseSidebar} 
                isSidebarCollapsed={false}
                toggleSidebar={() => {}}
              />
            )}
          </Offcanvas.Body>
        </Offcanvas>
        
        {/* Contenido de la página */}
        <Container fluid className="container-fluid-custom">
          {children}
        </Container>
      </div>
    </div>
  );
};

export default AppLayout;