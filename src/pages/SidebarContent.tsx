import React, { useEffect, useState } from 'react';
import { Nav, Button } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SidebarContentProps } from '../interfaces/bar';
import { TableProperties, FolderKanban, FileChartLine, CircleUserRound, UserPlus, LogOut, Icon, History,FileSpreadsheet, FileUp, ScrollText, DollarSign } from 'lucide-react';
import { owl } from '@lucide/lab';
import { ROLES } from '../interfaces/user';
import { rolAPI } from '../api/userAPI';

const SidebarContent: React.FC<SidebarContentProps> = ({
  usuario,
  onItemClick,
  isSidebarCollapsed,
  toggleSidebar
}) => {
  const { logout, hasAnyRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [nombreRol, setNombreRol] = useState<string>('');

  // Efecto para obtener el nombre del rol
  /* Objetivo:
 *  Consultar de forma asíncrona el nombre descriptivo del rol asignado al usuario actual 
  y almacenarlo en el estado local.
 * 
 * Parámetros:
 *  - No recibe parámetros directos, pero depende del usuario y su propiedad id_rol.
 * 
 * Operación:
 *  Realiza una llamada a la API de roles para obtener la lista completa, busca el rol 
 * que coincida con el id del usuario, y actualiza el estado 'nombreRol' con el nombre del 
 * rol encontrado o con el id en caso de error.
 */
  useEffect(() => {
    const obtenerNombreRol = async () => {
      if (usuario?.id_rol) {
        try {
          const roles = await rolAPI.getRoles();
          const rolEncontrado = roles.find(rol => rol.id_rol === usuario.id_rol);
          setNombreRol(rolEncontrado?.nombre_rol || usuario.id_rol);
        } catch (error) {
          setNombreRol(usuario.id_rol); // Fallback al ID si hay error
        }
      }
    };
    obtenerNombreRol();
  }, [usuario?.id_rol]);

  // Función para determinar si un link está activo
  const isActive = (path: string) => {
    return location.pathname === path ? "active" : "";
  };

  // Función para manejar la navegación
  /*
 * Objetivo:
 *  Controlar la navegación a una ruta específica y ejecutar una acción opcional
 *  tras el click en un elemento del menú.
 * 
 * Parámetros:
 *  @param path {string} - Ruta a la que se debe navegar.
 * 
 * Operación:
 *  Utiliza el hook navigate para cambiar la ruta actual a la especificada y, si se provee, ejecuta 
 * la función onItemClick para acciones adicionales.
 */
  const handleNavigate = (path: string) => {
    navigate(path);
    if (onItemClick) onItemClick();
  };

  // Tamaño estándar para los iconos
  const iconSize = 18;

  // Función para verificar si el usuario tiene acceso a una ruta
  /* Objetivo:
 *  Verificar si el usuario autenticado tiene al menos uno de los roles necesarios para
   acceder a una funcionalidad o ruta específica.
 * 
 * Parámetros:
 *  @param requiredRoles {string[]} - Array de roles permitidos para la ruta o función.
 * 
 * Operación:
 *  Invoca la función hasAnyRole del contexto de autenticación para determinar si 
 * el usuario posee alguno de los roles indicados,retornando un valor booleano que indica si se
 *  permite o no el acceso.
 *
 * */
  const hasAccessTo = (requiredRoles: string[]) => {
    return hasAnyRole(requiredRoles);
  };

  return (
    <React.Fragment>
      {/* Encabezado - Ajustado para mostrar/ocultar "SGP" basado en el estado colapsado */}
      <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
        <div
          className="fs-4 fw-semibold text-decoration-none text-white d-flex align-items-center"
          onClick={() => handleNavigate("/dashboard")}
          style={{ cursor: 'pointer' }}
        >
          <Icon iconNode={owl} size={24} className="me-2" />
          {!isSidebarCollapsed && "SGP"}
        </div>
      </div>

      {/* Botón de toggle separado en su propia fila */}
      <div className="d-flex justify-content-center p-2 border-bottom">
        <Button
          variant="outline-light"
          size="sm"
          onClick={toggleSidebar}
          className="d-none d-lg-block"
          style={{ width: isSidebarCollapsed ? '40px' : 'auto' }}
        >
          <TableProperties size={iconSize} />
          {!isSidebarCollapsed && <span className="ms-2">Contraer</span>}
        </Button>
      </div>

      {/* Solo mostrar estos elementos si el sidebar no está colapsado */}
      {!isSidebarCollapsed && (
        <>
          {/* Links de navegación */}
          <Nav className="flex-column mt-3">

            <div className="px-3 mb-2 text-secondary text-uppercase small">Inicio</div>

            {/* Ver Proyectos - Solo para ADMINISTRADOR y DIRECTOR_REFORMAS */}
            {hasAccessTo([
              ROLES.ADMINISTRADOR,
              ROLES.DIRECTOR_DE_REFORMAS,
              ROLES.DIRECTOR_DE_PROYECTO,
              ROLES.DIRECTOR_DE_INVESTIGACION
            ]) && (
              <Nav.Item>
                <Nav.Link
                  className={`text-white ${isActive("/ver-proyectos")}`}
                  onClick={() => handleNavigate("/ver-proyectos")}
                >
                  <FolderKanban size={iconSize} className="me-2" />
                  Ver Proyectos
                </Nav.Link>
              </Nav.Item>
            )}

            <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">Proyectos Y Actividades</div>

            {/* Nuevo Proyecto - Solo para ADMINISTRADOR y DIRECTOR_INVESTIGACION */}
            {hasAccessTo([ROLES.ADMINISTRADOR, ROLES.DIRECTOR_DE_INVESTIGACION]) && (
              <Nav.Item>
                <Nav.Link
                  className={`text-white ${isActive("/tipos-proyecto")}`}
                  onClick={() => handleNavigate("/tipos-proyecto")}
                >
                  <FolderKanban size={iconSize} className="me-2" />
                  Nuevo Proyecto
                </Nav.Link>
              </Nav.Item>
            )}

            {/* Gestión de Precios Predefinidos - Solo para ADMINISTRADOR */}
            {hasAccessTo([ROLES.ADMINISTRADOR]) && (
              <Nav.Item>
                <Nav.Link
                  className={`text-white ${isActive("/gestion-precios")}`}
                  onClick={() => handleNavigate("/gestion-precios")}
                >
                  <DollarSign size={iconSize} className="me-2" />
                  Gestión de Precios
                </Nav.Link>
              </Nav.Item>
            )}

            {/* Sección POAs - Solo mostrar si tiene acceso a alguna funcionalidad de POA */}
            {hasAccessTo([ROLES.ADMINISTRADOR, ROLES.DIRECTOR_DE_INVESTIGACION]) && (
              <>
                {/* <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">POAs</div> */}

                <Nav.Item>
                  <Nav.Link
                    className={`text-white ${isActive("/crear-poa")}`}
                    onClick={() => handleNavigate("/crear-poa")}
                  >
                    <FileChartLine size={iconSize} className="me-2" />
                    Nuevo POA
                  </Nav.Link>
                </Nav.Item>
              </>
            )}

            {/* Sección ACTIVIDADES - Solo mostrar si tiene acceso */}
            {hasAccessTo([ROLES.ADMINISTRADOR, ROLES.DIRECTOR_DE_INVESTIGACION]) && (
              <>
                {/* <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">ACTIVIDADES</div> */}

                <Nav.Item>
                  <Nav.Link
                    className={`text-white ${isActive("/agregar-actividad-tarea")}`}
                    onClick={() => handleNavigate("/agregar-actividad-tarea")}
                  >
                    <FileChartLine size={iconSize} className="me-2" />
                    Agregar Actividades y Tareas
                  </Nav.Link>
                </Nav.Item>
              </>
            )}


            <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">Editar Proyectos Y Actividades</div>

            {/* Nuevo Proyecto - Solo para ADMINISTRADOR y DIRECTOR_INVESTIGACION */}
            {hasAccessTo([
              ROLES.ADMINISTRADOR, 
              ROLES.DIRECTOR_DE_INVESTIGACION
            ]) && (
              <Nav.Item>
                <Nav.Link
                  className={`text-white ${isActive("/editar-proyecto")}`}
                  onClick={() => handleNavigate("/editar-proyecto")}
                >
                  <FolderKanban size={iconSize} className="me-2" />
                  Editar Proyecto
                </Nav.Link>
              </Nav.Item>
            )}

            {/* Sección POAs - Solo mostrar si tiene acceso a alguna funcionalidad de POA */}
            {hasAccessTo([
              ROLES.ADMINISTRADOR,
              ROLES.DIRECTOR_DE_INVESTIGACION
            ]) && (
              <>
                {/* <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">POAs</div> */}

                <Nav.Item>
                  <Nav.Link
                    className={`text-white ${isActive("/editar-poa")}`}
                    onClick={() => handleNavigate("/editar-poa")}
                  >
                    <FileChartLine size={iconSize} className="me-2" />
                    Editar POA
                  </Nav.Link>
                </Nav.Item>
              </>
            )}

            {/* Sección ACTIVIDADES - Solo mostrar si tiene acceso */}
            {hasAccessTo([
              ROLES.ADMINISTRADOR,
              ROLES.DIRECTOR_DE_INVESTIGACION,
            ]) && (
              <>
                {/* <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">ACTIVIDADES</div> */}

                <Nav.Item>
                  <Nav.Link
                    className={`text-white ${isActive("/editar-actividad-tarea")}`}
                    onClick={() => handleNavigate("/editar-actividad-tarea")}
                  >
                    <FileChartLine size={iconSize} className="me-2" />
                    Editar Actividades y Tareas
                  </Nav.Link>
                </Nav.Item>
              </>
            )}


            {/* Sección Excel - Solo mostrar si tiene acceso a alguna funcionalidad */}
            {(hasAccessTo([ROLES.ADMINISTRADOR]) || hasAccessTo([ROLES.DIRECTOR_DE_INVESTIGACION]) || hasAccessTo([ROLES.DIRECTOR_DE_REFORMAS])) && (
              <>
                <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">
                  Excel
                </div>

                {/* Subir POA desde Excel - ADMINISTRADOR y DIRECTOR_REFORMAS */}
                {hasAccessTo([
                  ROLES.ADMINISTRADOR,
                  ROLES.DIRECTOR_DE_REFORMAS,
                ]) && (
                  <Nav.Item>
                    <Nav.Link
                      className={`text-white ${isActive("/subir-excel")}`}
                      onClick={() => handleNavigate("/subir-excel")}
                    >
                      <FileUp size={iconSize} className="me-2" />
                      Subir POA desde Excel
                    </Nav.Link>
                  </Nav.Item>
                )}

                {/* Reporte Anual - ADMINISTRADOR y DIRECTOR_REFORMAS */}
                {hasAccessTo([
                  ROLES.ADMINISTRADOR,
                  ROLES.DIRECTOR_DE_REFORMAS,
                ]) && (
                  <Nav.Item>
                    <Nav.Link
                      className={`text-white ${isActive("/reporte-poa")}`}
                      onClick={() => handleNavigate("/reporte-poa")}
                    >
                      {/* <FileChartLine size={iconSize} className="me-2" /> */}
                      <FileSpreadsheet size={iconSize} className="me-2" />
                      Reporte Anual
                    </Nav.Link>
                  </Nav.Item>
                )}

                {/* Control de cambios - ADMINISTRADOR y DIRECTOR_REFORMAS */}
                {hasAccessTo([
                  ROLES.ADMINISTRADOR,
                  ROLES.DIRECTOR_DE_REFORMAS]) && (
                  <Nav.Item>
                    <Nav.Link
                      className={`text-white ${isActive("/LogsCargaExcel")}`}
                      onClick={() => handleNavigate("/LogsCargaExcel")}
                    >
                      <History size={iconSize} className="me-2" />
                      Control de cambios - Subir POA
                    </Nav.Link>
                  </Nav.Item>
                )}

                {/* Logs del Sistema - ADMINISTRADOR y DIRECTOR_REFORMAS */}
                {hasAccessTo([
                  ROLES.ADMINISTRADOR,
                  ROLES.DIRECTOR_DE_REFORMAS]) && (
                  <Nav.Item>
                    <Nav.Link
                      className={`text-white ${isActive("/logs")}`}
                      onClick={() => handleNavigate("/logs")}
                    >
                      <ScrollText size={iconSize} className="me-2" />
                      Logs del Sistema
                    </Nav.Link>
                  </Nav.Item>
                )}
              </>
            )}

            {/* Información del usuario en la parte inferior del sidebar */}

             {/* Preferencias de usuario - Siempre visible */}
            <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">Usuario</div>
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/perfil")}`}
                onClick={() => handleNavigate("/perfil")}
              >
                <CircleUserRound size={iconSize} className="me-2" />
                Perfil
              </Nav.Link>
            </Nav.Item>

            {/* Registro de usuarios - Solo para ADMINISTRADOR */}
            {hasAccessTo([ROLES.ADMINISTRADOR]) && (
              <Nav.Item>
                <Nav.Link
                  className={`text-white ${isActive("/register")}`}
                  onClick={() => handleNavigate("/register")}
                >
                  <UserPlus size={iconSize} className="me-2" />
                  Registrar usuario
                </Nav.Link>
              </Nav.Item>
            )}


            <div className="mt-auto p-3 border-top">
              <div className="d-flex align-items-center">
                <div>
                  <div className="fw-bold">{usuario.nombre}</div>
                  <small className="text-muted">{nombreRol}</small>
                </div>
              </div>
              <Button
                variant="outline-light"
                size="sm"
                className="w-100 mt-2"
                onClick={() => {
                  if (onItemClick) onItemClick();
                  logout();
                }}
              >
                <LogOut size={iconSize} className="me-2" />
                Cerrar Sesión
              </Button>
            </div>
          </Nav>
        </>
      )}

      {/* Cuando el sidebar está colapsado, mostrar solo íconos con restricciones */}
      {isSidebarCollapsed && (
        <Nav className="flex-column align-items-center mt-3">
          
          {/* Ver Proyectos */}
          {hasAccessTo([
            ROLES.ADMINISTRADOR,
            ROLES.DIRECTOR_DE_REFORMAS,
            ROLES.DIRECTOR_DE_PROYECTO,
            ROLES.DIRECTOR_DE_INVESTIGACION
          ]) && (
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/ver-proyectos")}`}
                onClick={() => handleNavigate("/ver-proyectos")}
                style={{ cursor: 'pointer' }}
                title="Ver Proyectos"
              >
                <FolderKanban size={iconSize} />
              </Nav.Link>
            </Nav.Item>
          )}

          <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">PR</div>

          {/* Nuevo Proyecto */}
          {hasAccessTo([ROLES.ADMINISTRADOR, ROLES.DIRECTOR_DE_INVESTIGACION]) && (
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/tipos-proyecto")}`}
                onClick={() => handleNavigate("/tipos-proyecto")}
                style={{ cursor: 'pointer' }}
                title="Nuevo Proyecto"
              >
                <FolderKanban size={iconSize} />
              </Nav.Link>
            </Nav.Item>
          )}

          {/* Gestión de Precios Predefinidos */}
          {hasAccessTo([ROLES.ADMINISTRADOR]) && (
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/gestion-precios")}`}
                onClick={() => handleNavigate("/gestion-precios")}
                style={{ cursor: 'pointer' }}
                title="Gestión de Precios"
              >
                <DollarSign size={iconSize} />
              </Nav.Link>
            </Nav.Item>
          )}

          {/* Nuevo POA */}
          {hasAccessTo([ROLES.ADMINISTRADOR, ROLES.DIRECTOR_DE_INVESTIGACION]) && (
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/crear-poa")}`}
                onClick={() => handleNavigate("/crear-poa")}
                title="Nuevo POA"
              >
                <FileChartLine size={iconSize} />
              </Nav.Link>
            </Nav.Item>
          )}

          {/* Agregar Actividad */}
          {hasAccessTo([ROLES.ADMINISTRADOR, ROLES.DIRECTOR_DE_INVESTIGACION]) && (
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/agregar-actividad-tarea")}`}
                onClick={() => handleNavigate("/agregar-actividad-tarea")}
                title="Agregar Actividad"
              >
                <FileChartLine size={iconSize} />
              </Nav.Link>
            </Nav.Item>
          )}



          <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">Act PR</div>

          {/* Editar Proyecto */}
          {hasAccessTo([
            ROLES.ADMINISTRADOR,
            ROLES.DIRECTOR_DE_INVESTIGACION
          ]) && (
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/editar-proyecto")}`}
                onClick={() => handleNavigate("/editar-proyecto")}
                style={{ cursor: 'pointer' }}
                title="Editar Proyecto"
              >
                <FolderKanban size={iconSize} />
              </Nav.Link>
            </Nav.Item>
          )}


          {/* Editar POA */}
          {hasAccessTo([
            ROLES.ADMINISTRADOR,
            ROLES.DIRECTOR_DE_INVESTIGACION]) && (
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/editar-poa")}`}
                onClick={() => handleNavigate("/editar-poa")}
                title="Editar POA"
              >
                <FileChartLine size={iconSize} />
              </Nav.Link>
            </Nav.Item>
          )}

          {/* Editar Actividad */}
          {hasAccessTo([
            ROLES.ADMINISTRADOR,
            ROLES.DIRECTOR_DE_INVESTIGACION,
          ]) && (
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/agregar-actividad-tarea")}`}
                onClick={() => handleNavigate("/agregar-actividad-tarea")}
                title="Editar Actividad"
              >
                <FileChartLine size={iconSize} />
              </Nav.Link>
            </Nav.Item>
          )}

          <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">XLSX</div>

          {/* Subir POA desde Excel */}
          {hasAccessTo([
            ROLES.ADMINISTRADOR,
            ROLES.DIRECTOR_DE_REFORMAS,
          ]) && (
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/subir-excel")}`}
                onClick={() => handleNavigate("/subir-excel")}
                title="Subir POA desde Excel"
              >
                <FileUp size={iconSize} className="me-2" />
                {/* Subir POA desde Excel */}
              </Nav.Link>
            </Nav.Item>
          )}

          {/* Reporte Anual */}
          {hasAccessTo([
            ROLES.ADMINISTRADOR,
            ROLES.DIRECTOR_DE_REFORMAS,
          ]) && (
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/reporte-poa")}`}
                onClick={() => handleNavigate("/reporte-poa")}
                title="Reporte Anual"
              >
                <FileSpreadsheet size={iconSize} className="me-2" />
                {/* Reporte Anual */}
              </Nav.Link>
            </Nav.Item>
          )}

          {/* Control de cambios */}
          {hasAccessTo([
            ROLES.ADMINISTRADOR,
            ROLES.DIRECTOR_DE_REFORMAS,
          ]) && (
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/LogsCargaExcel")}`}
                onClick={() => handleNavigate("/LogsCargaExcel")}
                title="Control de cambios - Subir POA"
              >
                <History size={iconSize} className="me-2" />
                {/* Control de cambios - Subir POA */}
              </Nav.Link>
            </Nav.Item>
          )}

          {/* Logs del Sistema */}
          {hasAccessTo([
            ROLES.ADMINISTRADOR,
            ROLES.DIRECTOR_DE_REFORMAS,
          ]) && (
            <Nav.Item>
              <Nav.Link
                className={`text-white ${isActive("/logs")}`}
                onClick={() => handleNavigate("/logs")}
                title="Logs del Sistema"
              >
                <ScrollText size={iconSize} className="me-2" />
                {/* Logs del Sistema */}
              </Nav.Link>
            </Nav.Item>
          )}

          <div className="px-3 mt-4 mb-2 text-secondary text-uppercase small">USR</div>


          {/* Perfil - Siempre visible */}
          <Nav.Item>
            <Nav.Link
              className={`text-white ${isActive("/perfil")}`}
              onClick={() => handleNavigate("/perfil")}
              title="Perfil"
            >
              <CircleUserRound size={iconSize} />
            </Nav.Link>
          </Nav.Item>

          {/* Registrar usuario */}
          
          <div className="mt-auto mb-5">
          {hasAccessTo([ROLES.ADMINISTRADOR]) && (
          <Nav.Item>
            <Nav.Link
              className={`text-white ${isActive("/register")}`}
              onClick={() => handleNavigate("/register")}
              title="Registrar usuario"
            >
              <UserPlus size={iconSize} />
            </Nav.Link>
          </Nav.Item>
          )}
          </div>

          <div style={{ marginBottom: '6rem' }} />

          <div className="mt-auto mb-3">
            <Nav.Item>
              <Nav.Link
                className="text-white"
                onClick={() => logout()}
                title="Cerrar Sesión"
              >
                <LogOut size={iconSize} />
              </Nav.Link>
            </Nav.Item>
          </div>
        </Nav>
      )}
    </React.Fragment>
  );
};

export default SidebarContent;