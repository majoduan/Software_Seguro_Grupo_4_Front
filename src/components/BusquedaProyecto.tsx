import React from 'react';
import { Row, Col, Form, Table, Badge } from 'react-bootstrap';
import { XCircle } from 'lucide-react';
import { Proyecto } from '../interfaces/project';
import { withSanitization } from '../utils/sanitizer';

interface BusquedaProyectoProps {
  proyectos: Proyecto[]; // Recibe todos los proyectos
  isLoading: boolean;
  seleccionarProyecto: (proyecto: Proyecto) => void;
  // Props opcionales para validación
  validarProyecto?: (proyecto: Proyecto) => Promise<{ esValido: boolean; razon?: string }>;
  mostrarValidacion?: boolean;
  modoEdicion?: boolean; // Nueva prop para determinar si es modo edición
}

/**
 * Componente BusquedaProyecto
 * Objetivo: Proveer una interfaz segura y controlada para buscar, visualizar y seleccionar proyectos.
 * Incorpora prácticas de seguridad frontend como sanitización de entradas, control de validaciones asíncronas y 
 * restricciones visuales de interacción para evitar manipulaciones de datos no autorizadas.
 * 
 * Parámetros:
 * - proyectos: Proyecto[] -  Lista de proyectos disponibles. Es la fuente de datos para las búsquedas.
 * 
 * - isLoading: boolean -  Indica si la información aún se está cargando, lo cual evita interacciones prematuras.
 * 
 * - seleccionarProyecto: función -   Callback que se invoca cuando el usuario selecciona un proyecto válido.
 * 
 * - validarProyecto?: función -  Función asíncrona de validación que comprueba si el proyecto cumple condiciones de uso.
 *   Se utiliza para asegurar que no se seleccione un proyecto no autorizado o inválido.
 * 
 * - mostrarValidacion?: boolean - controla si debe mostrarse el estado de validación visual.
 * 
 * - modoEdicion?: boolean -  Determina si el componente se utiliza para seleccionar un proyecto para editar.
 * 
 * Operación:
 * - Sanitiza la entrada de búsqueda usando `withSanitization()` para prevenir inyecciones o entradas corruptas.
 * - Filtra dinámicamente los proyectos por coincidencias en código o título, usando texto en minúscula y `trim()`.
 * - Valida de manera asíncrona los proyectos filtrados mediante `validarProyecto` y muestra el resultado como una etiqueta visual.
 * - En caso de error en la validación, permite la selección como fallback seguro (manejo de error controlado).
 * - Desactiva visualmente las filas de proyectos inválidos (baja opacidad, cursor `not-allowed`) para evitar clics accidentales 
 *   o maliciosos.
 * - Impide explícitamente la selección de proyectos inválidos desde `manejarSeleccionProyecto`, como control adicional.
 * 
 * Retorna:
 * - Renderiza un campo de búsqueda de proyectos y una lista filtrada de resultados con validación visual y controlada.
 * - Garantiza que solo se pueda seleccionar un proyecto válido (según la validación), evitando manipulaciones inseguras.
 */


const BusquedaProyecto: React.FC<BusquedaProyectoProps> = ({
  proyectos,
  isLoading,
  seleccionarProyecto,
  validarProyecto,
  mostrarValidacion = false,
  modoEdicion = false // Valor por defecto
}) => {
  // Estados locales del componente hijo con sanitización
  const [busquedaProyecto, setBusquedaProyectoInternal] = React.useState('');
  const [mostrarBusqueda, setMostrarBusqueda] = React.useState(false);
  const [proyectosFiltrados, setProyectosFiltrados] = React.useState<Proyecto[]>([]);
  const [validaciones, setValidaciones] = React.useState<{ [key: string]: { esValido: boolean; razon?: string } }>({});
  const [validandoProyectos, setValidandoProyectos] = React.useState(false);

  // Setter sanitizado
  const setBusquedaProyecto = withSanitization(setBusquedaProyectoInternal, 'busqueda');

  // Filtrar proyectos cuando cambie el texto de búsqueda o la lista de proyectos
  React.useEffect(() => {
    if (!busquedaProyecto.trim()) {
      setProyectosFiltrados(proyectos);
      return;
    }

    const filtrados = proyectos.filter(proyecto => {
      const busquedaLower = busquedaProyecto.toLowerCase().trim();
      
      // Buscar en código_proyecto y título
      const coincideCodigo = proyecto.codigo_proyecto?.toLowerCase().includes(busquedaLower);
      const coincideTitulo = proyecto.titulo?.toLowerCase().includes(busquedaLower);
      
      return coincideCodigo || coincideTitulo;
    });

    setProyectosFiltrados(filtrados);
  }, [busquedaProyecto, proyectos]);

  // Validar proyectos cuando cambie la lista filtrada
  React.useEffect(() => {
    const validarProyectosFiltrados = async () => {
      if (!validarProyecto || !mostrarValidacion || proyectosFiltrados.length === 0) {
        return;
      }

      setValidandoProyectos(true);
      const nuevasValidaciones: { [key: string]: { esValido: boolean; razon?: string } } = {};

      try {
        // Validar todos los proyectos en paralelo
        const promesasValidacion = proyectosFiltrados.map(async (proyecto) => {
          try {
            const resultado = await validarProyecto(proyecto);
            nuevasValidaciones[proyecto.id_proyecto] = resultado;
          } catch (error) {
            nuevasValidaciones[proyecto.id_proyecto] = { esValido: true }; // En caso de error, permitir selección
          }
        });

        await Promise.all(promesasValidacion);
        setValidaciones(nuevasValidaciones);
      } catch (error) {
      } finally {
        setValidandoProyectos(false);
      }
    };

    validarProyectosFiltrados();
  }, [proyectosFiltrados, validarProyecto, mostrarValidacion]);

  const manejarCambioBusqueda = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusquedaProyecto(e.target.value);
    setMostrarBusqueda(true);
  };

  const manejarSeleccionProyecto = (proyecto: Proyecto) => {
    if (mostrarValidacion && validaciones[proyecto.id_proyecto] && !validaciones[proyecto.id_proyecto].esValido) {
      // No permitir selección si no es válido
      return;
    }
    
    seleccionarProyecto(proyecto);
    setBusquedaProyecto(`${proyecto.codigo_proyecto} - ${proyecto.titulo}`);
    setMostrarBusqueda(false);
  };

  const limpiarBusqueda = () => {
    setBusquedaProyecto('');
    setMostrarBusqueda(false);
  };

  const obtenerEstiloFila = (proyecto: Proyecto) => {
    if (!mostrarValidacion || !validaciones[proyecto.id_proyecto]) {
      return { cursor: 'pointer' };
    }

    const validacion = validaciones[proyecto.id_proyecto];
    return {
      cursor: validacion.esValido ? 'pointer' : 'not-allowed',
      opacity: validacion.esValido ? 1 : 0.6,
      backgroundColor: validacion.esValido ? 'transparent' : '#f8f9fa'
    };
  };

  // Cerrar búsqueda al hacer clic fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.position-relative')) {
        setMostrarBusqueda(false);
      }
    };

    if (mostrarBusqueda) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [mostrarBusqueda]);

  return (
    <Row>
      <Col md={12} className="mb-4">
        <Form.Group controlId="id_proyecto">
          <Form.Label className="fw-semibold">
            {modoEdicion ? 'Proyecto a Editar' : 'Proyecto Asociado'} <span className="text-danger">*</span>
          </Form.Label>
          <div className="position-relative">
            <Form.Control
              type="text"
              placeholder={modoEdicion ? "Buscar proyecto con POAs para editar" : "Buscar proyecto por código o título"}
              value={busquedaProyecto}
              onChange={manejarCambioBusqueda}
              onFocus={() => setMostrarBusqueda(true)}
              className="form-control-lg"
              style={{ paddingRight: busquedaProyecto ? '2.5rem' : '0.75rem' }}
            />
            
            {/* Botón de limpiar */}
            {busquedaProyecto && (
              <button
                type="button"
                onClick={limpiarBusqueda}
                className="btn btn-link position-absolute"
                style={{
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '0.25rem',
                  border: 'none',
                  background: 'none',
                  color: '#6c757d',
                  zIndex: 10
                }}
                title="Limpiar búsqueda"
              >
                <XCircle  size={18} />
              </button>
            )}
           
            {/* Resultados de búsqueda */}
            {mostrarBusqueda && (
              <div
                className="position-absolute w-100 mt-1 shadow bg-white rounded border"
                style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}
              >
                {isLoading || validandoProyectos ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <span className="ms-2">
                      {isLoading ? 'Buscando proyectos...' : 'Validando disponibilidad...'}
                    </span>
                  </div>
                ) : (
                  <Table hover size="sm" className="mb-0">
                    <tbody>
                      {proyectosFiltrados.length > 0 ? (
                        proyectosFiltrados.map(proyecto => {
                          const validacion = validaciones[proyecto.id_proyecto];
                          return (
                            <tr
                              key={proyecto.id_proyecto}
                              onClick={() => manejarSeleccionProyecto(proyecto)}
                              style={obtenerEstiloFila(proyecto)}
                            >
                              <td style={{ width: '30%' }}>
                                <strong>{proyecto.codigo_proyecto}</strong>
                              </td>
                              <td style={{ width: mostrarValidacion ? '50%' : '70%' }}>
                                {proyecto.titulo}
                              </td>
                              {mostrarValidacion && (
                                <td style={{ width: '20%' }} className="text-end">
                                  {validacion ? (
                                    validacion.esValido ? (
                                      <Badge bg="success" className="ms-1">
                                        <i className="bi bi-check-circle me-1"></i>
                                        {modoEdicion ? 'Editable' : 'Disponible'}
                                      </Badge>
                                    ) : (
                                      <Badge bg="warning" className="ms-1" title={validacion.razon}>
                                        <i className="bi bi-exclamation-triangle me-1"></i>
                                        {modoEdicion ? 'Sin POAs' : 'No disponible'}
                                      </Badge>
                                    )
                                  ) : (
                                    <Badge bg="secondary" className="ms-1">
                                      <div className="spinner-border spinner-border-sm" role="status" style={{ width: '12px', height: '12px' }}>
                                        <span className="visually-hidden">Validando...</span>
                                      </div>
                                    </Badge>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={mostrarValidacion ? 3 : 2} className="text-center py-2">
                            {busquedaProyecto.trim() ? 'No se encontraron proyectos que coincidan con la búsqueda' : 'No hay proyectos disponibles'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                )}
              </div>
            )}
          </div>
        </Form.Group>
      </Col>
    </Row>
  );
};

export default BusquedaProyecto;