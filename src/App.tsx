import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import SubirExcel from './pages/SubirExcel';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CrearPOA from './pages/CrearPOA';
import Perfil from './pages/Perfil';
import CrearProyecto from './pages/CrearProyecto';
import TiposProyecto from './pages/TiposProyecto';
import AgregarActividad from './pages/AgregarActividad';
import ReportePOA from './pages/ReportePOA';
import LogsCargaExcel from './pages/LogsCargaExcel';
import Logs from './pages/Logs';
import VerProyectos from './pages/VerProyectos';
import EditarProyecto from './pages/EditarProyecto';
import EditarPOA from './pages/EditarPOA';
import EditarActividad from './pages/EditarActividad';
import GestionPrecios from './pages/GestionPrecios';
import GestionDepartamentos from './pages/GestionDepartamentos';
import { ThemeProvider } from "@mui/material/styles";

import theme from "./theme";

// Importar ToastContainer y estilos
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import RoleProtectedRoute from './components/RoleProtectedRoute'; /* Objetivo:
 * - Proteger rutas que requieren que el usuario esté autenticado antes de acceder.*/

// Importar las funciones de roles actualizadas
import { ROLES, initializeRoles, areRolesLoaded } from './interfaces/user';
import { useState, useEffect } from 'react';


// Componente para manejar la carga de roles
/*
 * Objetivo:
 * - Inicializar y cargar los roles del usuario desde el servidor antes de renderizar la aplicación,
 *   garantizando que la información de roles esté disponible para controlar accesos.
 * 
 * Parámetros:
 * - children: React.ReactNode
 *   Contenido que se renderiza una vez los roles han sido cargados exitosamente.
 * 
 * Operación:
 * - Verifica si los roles ya están cargados mediante areRolesLoaded().
 * - Si no están cargados, llama a initializeRoles() para obtenerlos del backend.
 * - Controla el estado de carga y errores de la petición.
 * - Mientras carga muestra mensaje de espera, si falla muestra error con opción a reintentar.
 * - Solo permite renderizar hijos (children) cuando los roles están correctamente cargados.
 */
const RoleInitializer = ({ children }: { children: React.ReactNode }) => {
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        await initializeRoles();
        setRolesLoaded(true);
      } catch (error) {
        setRolesError(error instanceof Error ? error.message : 'Error desconocido');
      }
    };

    if (!areRolesLoaded()) {
      loadRoles();
    } else {
      setRolesLoaded(true);
    }
  }, []);

  if (rolesError) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: 'red',
        fontSize: '16px'
      }}>
        <h3>Error al cargar la aplicación</h3>
        <p>No se pudieron cargar los roles desde el servidor:</p>
        <p><strong>{rolesError}</strong></p>
        <button 
          onClick={() => window.location.reload()}
          style={{ 
            padding: '10px 20px', 
            marginTop: '10px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!rolesLoaded) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        fontSize: '16px'
      }}>
        <h3>Cargando aplicación...</h3>
        <p>Inicializando roles del sistema...</p>
        <div style={{ 
          marginTop: '20px',
          fontSize: '14px',
          color: '#666'
        }}>
          ⏳ Por favor espera...
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

function AppContent() {
  return (
    <AppLayout>
      <ThemeProvider theme={theme}>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          {/* <Route path="/register" element={<Register />} /> */}
          
          {/* Rutas protegidas */}

          <Route path="/register" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR
                ]}>
                  <Register />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />


          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          {/* Ruta original con RoleProtectedRoute */}
          <Route path="/tipos-proyecto" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_DE_INVESTIGACION,
              ]}>
                <TiposProyecto />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          {/* Ruta para Gestión de Precios Predefinidos (solo ADMINISTRADOR) */}
          <Route path="/gestion-precios" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[ROLES.ADMINISTRADOR]}>
                <GestionPrecios />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          {/* Ruta para Gestión de Departamentos (solo ADMINISTRADOR) */}
          <Route path="/gestion-departamentos" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[ROLES.ADMINISTRADOR]}>
                <GestionDepartamentos />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/crear-proyecto" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_DE_INVESTIGACION,
              ]}>
                <CrearProyecto />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/crear-poa" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_DE_INVESTIGACION,
              ]}>
                <CrearPOA />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/agregar-actividad-tarea" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_DE_INVESTIGACION,
                ROLES.DIRECTOR_DE_PROYECTO,
              ]}>
                <AgregarActividad />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/editar-actividad-tarea" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_DE_INVESTIGACION,
                ROLES.DIRECTOR_DE_PROYECTO,
              ]}>
                <EditarActividad />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/editar-proyecto" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_DE_INVESTIGACION,
              ]}>
                <EditarProyecto />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/editar-poa" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_DE_INVESTIGACION,
              ]}>
                <EditarPOA />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/perfil" element={
            <ProtectedRoute>
              <Perfil />
            </ProtectedRoute>
          } />

          <Route path="/subir-excel" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_DE_REFORMAS,                
              ]}>
                <SubirExcel />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/reporte-poa" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_DE_REFORMAS,
              ]}>
                <ReportePOA />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/LogsCargaExcel" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_DE_REFORMAS,
              ]}>
                <LogsCargaExcel />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/logs" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_DE_REFORMAS,
              ]}>
                <Logs />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />

          <Route path="/ver-proyectos" element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRoles={[
                ROLES.ADMINISTRADOR,
                ROLES.DIRECTOR_DE_REFORMAS,
                ROLES.DIRECTOR_DE_INVESTIGACION,
                ROLES.DIRECTOR_DE_PROYECTO,
              ]}>
              <VerProyectos />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </ThemeProvider>
    </AppLayout>
  );
}

function App() {
  return (
      <Router>
        <AuthProvider>
          <RoleInitializer>
            <AppContent />
          </RoleInitializer>
        </AuthProvider>
      </Router>
    );
}

export default App;