import React, { useState, useEffect, useMemo } from 'react';
import { Table, Modal, Button, Form, InputGroup, Spinner, Alert, Badge } from 'react-bootstrap';
import { projectAPI } from '../api/projectAPI';
import { poaAPI } from '../api/poaAPI';
import { Proyecto, EstadoProyecto, Departamento } from '../interfaces/project';
import { POA } from '../interfaces/poa';
import VerPOA from '../components/VerPOA';
import { withSanitization } from '../utils/sanitizer';
import 'react-toastify/dist/ReactToastify.css';

//Importar funcion de exportar a excel
import ExportarPOAProyecto from '../components/ExportarPOAProyecto';

// ¡IMPORTAR LAS FUNCIONES DE TOAST!
import { showError, showInfo, showSuccess } from '../utils/toast';

// Importar el archivo CSS para el modal de pantalla completa
import '../styles/FullscreenModal.css';

// Interfaces para este componente
interface ProyectoConPOAs extends Proyecto {
  poas?: POA[];
  estadoProyecto?: EstadoProyecto;
}

interface FilterState {
  searchTerm: string;
  sortBy: 'codigo' | 'titulo' | 'estado' | 'presupuesto' | 'anio';
  sortOrder: 'asc' | 'desc';
  estadoFilter: string;
  departamentoFilter: string;
  minBudget: string;
  maxBudget: string;
  yearFilter: string;
  poaFilter: 'todos' | 'con_poas' | 'sin_poas';
}

/** Ver Proyectos
 * Objetivo:
 * Visualizar, filtrar y exportar información detallada de proyectos
 * y sus respectivos POAs, con protección frente a manipulación de datos
 * o inyecciones en los filtros del usuario.
 *
 * Parámetros:
 * - proyectos: ProyectoConPOAs[] – Lista de proyectos con sus POAs asociados.
 * - filters: FilterState – Conjunto de filtros aplicados por el usuario.
 * - estadosProyecto: EstadoProyecto[] – Estados válidos para los proyectos.
 * - selectedPOA: POA | null – POA seleccionado para ver en modal.
 * - showModal: boolean – Visibilidad del modal de detalles del POA.
 *
 * Operación: 
 * 1. Al cargar el componente:
 *    - Se consultan los proyectos, estados y POAs desde la API.
 *    - Se vinculan POAs a su respectivo proyecto.
 * 2. Se filtran y ordenan los proyectos en tiempo real usando `useMemo`.
 * 3. Las entradas del usuario (búsqueda, presupuesto) son sanitizadas antes de usarse.
 * 4. Se renderiza una tabla con la información de proyectos y sus POAs.
 * 5. El usuario puede visualizar detalles de un POA en un modal y exportarlo a Excel.
 */

const VerProyectos: React.FC = () => {
  const [proyectos, setProyectos] = useState<ProyectoConPOAs[]>([]);
  const [estadosProyecto, setEstadosProyecto] = useState<EstadoProyecto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para filtros
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    sortBy: 'codigo',
    sortOrder: 'asc',
    estadoFilter: '',
    departamentoFilter: '',
    minBudget: '',
    maxBudget: '',
    yearFilter: '',
    poaFilter: 'todos'
  });

  // Estado para departamentos
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);

  // Estados para modal
  const [showModal, setShowModal] = useState(false);
  const [selectedPOA, setSelectedPOA] = useState<POA | null>(null);

  // Estados para modal de confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [proyectoAEliminar, setProyectoAEliminar] = useState<ProyectoConPOAs | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Obtener proyectos, estados y departamentos en paralelo
        const [proyectosResponse, estadosResponse, departamentosResponse] = await Promise.all([
          projectAPI.getProyectos(),
          projectAPI.getEstadosProyecto(),
          projectAPI.getDepartamentos()
        ]);

        setDepartamentos(departamentosResponse);

        // Crear estados proyecto con descripción vacía para evitar errores de tipo
        const estadosConDescripcion: EstadoProyecto[] = estadosResponse.map(estado => ({
          ...estado,
          descripcion: '' // Agregar descripción vacía
        }));

        setEstadosProyecto(estadosConDescripcion);

        // Obtener POAs para cada proyecto
        const poas = await poaAPI.getPOAs(); // ← todos los POAs de todos los proyectos

        const proyectosConPOAs: ProyectoConPOAs[] = proyectosResponse.map(proyecto => {
          const poasDeEsteProyecto = poas.filter(poa => poa.id_proyecto === proyecto.id_proyecto);
          return {
            ...proyecto,
            poas: poasDeEsteProyecto,
            estadoProyecto: estadosConDescripcion.find(e => e.id_estado_proyecto === proyecto.id_estado_proyecto)
          };
        });

        setProyectos(proyectosConPOAs);
      } catch (err) {
        setError('Error al cargar los datos de proyectos');
        showError(err instanceof Error ? err.message : 'Error al cargar los datos de proyectos');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Función para actualizar filtros con sanitización
  const updateFilter = (filterKey: keyof FilterState, value: string) => {
    // Crear un setter temporal para aplicar sanitización solo a los campos de texto
    const sanitizedSetter = (newValue: string) => {
      setFilters(prev => ({
        ...prev,
        [filterKey]: newValue
      }));
    };

    // Aplicar sanitización a campos que pueden contener entrada de usuario
    if (filterKey === 'searchTerm' || filterKey === 'minBudget' || filterKey === 'maxBudget') {
      const sanitizedSetValue = withSanitization(sanitizedSetter, filterKey);
      sanitizedSetValue(value);
    } else {
      // Para otros campos (selects), aplicar directamente
      sanitizedSetter(value);
    }
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      sortBy: 'codigo',
      sortOrder: 'asc',
      estadoFilter: '',
      departamentoFilter: '',
      minBudget: '',
      maxBudget: '',
      yearFilter: '',
      poaFilter: 'todos'
    });
  };

  // Filtrar y ordenar proyectos con memoización
  const filteredProyectos = useMemo(() => {
    let filteredProyectos = [...proyectos];

    // Aplicar búsqueda por texto
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredProyectos = filteredProyectos.filter(proyecto =>
        proyecto.titulo.toLowerCase().includes(searchLower) ||
        proyecto.codigo_proyecto.toLowerCase().includes(searchLower)
      );
    }

    // Aplicar filtro por estado
    if (filters.estadoFilter) {
      filteredProyectos = filteredProyectos.filter(proyecto =>
        proyecto.id_estado_proyecto === filters.estadoFilter
      );
    }

    // Aplicar filtro por departamento
    if (filters.departamentoFilter) {
      filteredProyectos = filteredProyectos.filter(proyecto =>
        proyecto.id_departamento === filters.departamentoFilter
      );
    }

    // Aplicar filtro por presupuesto mínimo
    if (filters.minBudget) {
      const minBudget = parseFloat(filters.minBudget);
      filteredProyectos = filteredProyectos.filter(proyecto =>
        (proyecto.presupuesto_aprobado || 0) >= minBudget
      );
    }

    // Aplicar filtro por presupuesto máximo
    if (filters.maxBudget) {
      const maxBudget = parseFloat(filters.maxBudget);
      filteredProyectos = filteredProyectos.filter(proyecto =>
        (proyecto.presupuesto_aprobado || 0) <= maxBudget
      );
    }

    // Aplicar filtro por año (basado en años de los POAs)
    if (filters.yearFilter) {
      filteredProyectos = filteredProyectos.filter(proyecto =>
        proyecto.poas?.some(poa => poa.anio_ejecucion === filters.yearFilter)
      );
    }

    // Aplicar filtro por POAs asignados
    if (filters.poaFilter === 'sin_poas') {
      filteredProyectos = filteredProyectos.filter(proyecto =>
        !proyecto.poas || proyecto.poas.length === 0
      );
    } else if (filters.poaFilter === 'con_poas') {
      filteredProyectos = filteredProyectos.filter(proyecto =>
        proyecto.poas && proyecto.poas.length > 0
      );
    }

    // Aplicar ordenamiento
    filteredProyectos.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'codigo':
          comparison = a.codigo_proyecto.localeCompare(b.codigo_proyecto);
          break;
        case 'titulo':
          comparison = a.titulo.localeCompare(b.titulo);
          break;
        case 'estado':
          comparison = (a.estadoProyecto?.nombre || '').localeCompare(b.estadoProyecto?.nombre || '');
          break;
        case 'presupuesto':
          comparison = (a.presupuesto_aprobado || 0) - (b.presupuesto_aprobado || 0);
          break;
        case 'anio':
          const aYear = Math.max(...(a.poas?.map(poa => parseInt(poa.anio_ejecucion)) || [0]));
          const bYear = Math.max(...(b.poas?.map(poa => parseInt(poa.anio_ejecucion)) || [0]));
          comparison = aYear - bYear;
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filteredProyectos;
  }, [proyectos, filters]);

  // Obtener años únicos para el filtro
  const getUniqueYears = useMemo(() => {
    const years = new Set<string>();
    proyectos.forEach(proyecto => {
      proyecto.poas?.forEach(poa => {
        years.add(poa.anio_ejecucion);
      });
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [proyectos]);

  // Función para abrir modal con POA seleccionado
  const openPOAModal = (poa: POA) => {
    setSelectedPOA(poa);
    setShowModal(true);
    showSuccess('Actividades y tareas del POA');
  };

  // Función para cerrar modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedPOA(null);
  };

  // Función para abrir modal de confirmación de eliminación
  const openDeleteModal = (proyecto: ProyectoConPOAs) => {
    setProyectoAEliminar(proyecto);
    setShowDeleteModal(true);
  };

  // Función para cerrar modal de eliminación
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setProyectoAEliminar(null);
  };

  // Función para eliminar proyecto
  const handleEliminarProyecto = async () => {
    if (!proyectoAEliminar) return;

    try {
      setEliminando(true);
      const response = await projectAPI.eliminarProyecto(proyectoAEliminar.id_proyecto);
      showSuccess(response.msg);

      // Actualizar la lista de proyectos removiendo el eliminado
      setProyectos(prev => prev.filter(p => p.id_proyecto !== proyectoAEliminar.id_proyecto));
      closeDeleteModal();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Error al eliminar el proyecto');
    } finally {
      setEliminando(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error</Alert.Heading>
        <p>{error}</p>
      </Alert>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Gestión de Proyectos</h1>
        <Badge bg="info" className="fs-6">
          {filteredProyectos.length} proyecto{filteredProyectos.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            {/* Búsqueda */}
            <div className="col-md-4">
              <Form.Label>Buscar</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar por proyecto o código..."
                  value={filters.searchTerm}
                  onChange={(e) => updateFilter('searchTerm', e.target.value)}
                />
              </InputGroup>
            </div>

            {/* Filtro por estado */}
            <div className="col-md-2">
              <Form.Label>Estado</Form.Label>
              <Form.Select
                value={filters.estadoFilter}
                onChange={(e) => updateFilter('estadoFilter', e.target.value)}
              >
                <option value="">Todos los estados</option>
                {estadosProyecto.map(estado => (
                  <option key={estado.id_estado_proyecto} value={estado.id_estado_proyecto}>
                    {estado.nombre}
                  </option>
                ))}
              </Form.Select>
            </div>

            {/* Filtro por departamento */}
            <div className="col-md-2">
              <Form.Label>Departamento</Form.Label>
              <Form.Select
                value={filters.departamentoFilter}
                onChange={(e) => updateFilter('departamentoFilter', e.target.value)}
              >
                <option value="">Todos los departamentos</option>
                {departamentos.map(depto => (
                  <option key={depto.id_departamento} value={depto.id_departamento}>
                    {depto.nombre}
                  </option>
                ))}
              </Form.Select>
            </div>

            {/* Filtro por año */}
            <div className="col-md-2">
              <Form.Label>Año</Form.Label>
              <Form.Select
                value={filters.yearFilter}
                onChange={(e) => updateFilter('yearFilter', e.target.value)}
              >
                <option value="">Todos los años</option>
                {getUniqueYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </Form.Select>
            </div>

            {/* Filtro por POAs */}
            <div className="col-md-2">
              <Form.Label>POAs</Form.Label>
              <Form.Select
                value={filters.poaFilter}
                onChange={(e) => updateFilter('poaFilter', e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="con_poas">Con POAs</option>
                <option value="sin_poas">Sin POAs</option>
              </Form.Select>
            </div>

            {/* Ordenamiento */}
            <div className="col-md-2">
              <Form.Label>Ordenar por</Form.Label>
              <Form.Select
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
              >
                <option value="codigo">Código</option>
                <option value="titulo">Título</option>
                <option value="estado">Estado</option>
                <option value="presupuesto">Presupuesto</option>
                <option value="anio">Año</option>
              </Form.Select>
            </div>

            {/* Orden */}
            <div className="col-md-1">
              <Form.Label>Orden</Form.Label>
              <Form.Select
                value={filters.sortOrder}
                onChange={(e) => updateFilter('sortOrder', e.target.value)}
              >
                <option value="asc">↑</option>
                <option value="desc">↓</option>
              </Form.Select>
            </div>

            {/* Botón limpiar */}
            <div className="col-md-1 d-flex align-items-end">
              <Button variant="outline-secondary" onClick={clearFilters} className="w-100">
                <i className="bi bi-x-circle"></i>
              </Button>
            </div>
          </div>

          {/* Filtros de presupuesto */}
          <div className="row g-3 mt-2">
            <div className="col-md-3">
              <Form.Label>Presupuesto mínimo</Form.Label>
              <Form.Control
                type="number"
                placeholder="0"
                value={filters.minBudget}
                onChange={(e) => updateFilter('minBudget', e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <Form.Label>Presupuesto máximo</Form.Label>
              <Form.Control
                type="number"
                placeholder="Sin límite"
                value={filters.maxBudget}
                onChange={(e) => updateFilter('maxBudget', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="card-body p-0">
          <Table responsive hover className="mb-0">
            <thead className="table-dark">
              <tr>
                <th>Proyecto</th>
                <th>Código del Proyecto</th>
                <th>Departamento</th>
                <th>Estado del Proyecto</th>
                <th>POA's Asignados</th>
                <th>Año de Ejecución</th>
                <th>Presupuesto Aprobado</th>
                <th>Exportar Excel</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProyectos.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-4">
                    <div className="text-muted">
                      {filters.searchTerm || filters.estadoFilter || filters.departamentoFilter || filters.yearFilter || filters.minBudget || filters.maxBudget || filters.poaFilter !== 'todos'
                        ? 'No hay proyectos que coincidan con los filtros aplicados'
                        : 'No hay proyectos disponibles'
                      }
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProyectos.map((proyecto) => {
                  const yearsRange = proyecto.poas && proyecto.poas.length > 0
                    ? Array.from(new Set(proyecto.poas.map(poa => poa.anio_ejecucion))).sort().join(', ')
                    : 'N/A';

                  // Obtener el nombre del departamento
                  const departamento = departamentos.find(d => d.id_departamento === proyecto.id_departamento);
                  const nombreDepartamento = departamento?.nombre || 'No asignado';

                  return (
                    <tr key={proyecto.id_proyecto}>
                      <td>
                        <div className="fw-semibold">{proyecto.titulo}</div>
                      </td>
                      <td>
                        <code className="bg-light px-2 py-1 rounded">{proyecto.codigo_proyecto}</code>
                      </td>
                      <td>
                        <span className="text-muted">{nombreDepartamento}</span>
                      </td>
                      <td>
                        <Badge
                          bg={proyecto.estadoProyecto?.nombre === 'Activo' ? 'success' :
                            proyecto.estadoProyecto?.nombre === 'Inactivo' ? 'danger' : 'secondary'}
                        >
                          {proyecto.estadoProyecto?.nombre || 'Sin estado'}
                        </Badge>
                      </td>
                      <td>
                        {proyecto.poas && proyecto.poas.length > 0 ? (
                          <div className="d-flex flex-wrap gap-1">
                            {proyecto.poas.map((poa) => (
                              <Button
                                key={poa.id_poa}
                                variant="outline-primary"
                                size="sm"
                                onClick={() => openPOAModal(poa)}
                                className="text-decoration-none"
                              >
                                {poa.codigo_poa}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted">Sin POAs asignados</span>
                        )}
                      </td>
                      <td>{yearsRange}</td>
                      <td>
                        <span className="fw-semibold text-success">
                          ${proyecto.presupuesto_aprobado?.toLocaleString() || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <ExportarPOAProyecto
                          codigoProyecto={proyecto.codigo_proyecto}
                          poas={proyecto.poas || []}
                        />
                      </td>
                      <td>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => openDeleteModal(proyecto)}
                          title="Eliminar proyecto y todos sus POAs"
                        >
                          <i className="bi bi-trash"></i> Eliminar
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>
      </div>

      {/* Modal para mostrar detalles del POA - ACTUALIZADO */}
      <Modal
        show={showModal}
        onHide={closeModal}
        dialogClassName="modal-90w"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Detalles del POA</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPOA && <VerPOA poa={selectedPOA} onClose={closeModal} />}
        </Modal.Body>
      </Modal>

      {/* Modal de confirmación para eliminar proyecto */}
      <Modal
        show={showDeleteModal}
        onHide={closeDeleteModal}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Confirmar Eliminación
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {proyectoAEliminar && (
            <div>
              <Alert variant="danger">
                <Alert.Heading>¡Advertencia! Esta acción no se puede deshacer.</Alert.Heading>
                <p>
                  Está a punto de eliminar permanentemente el proyecto <strong>{proyectoAEliminar.titulo}</strong>
                  (Código: <code>{proyectoAEliminar.codigo_proyecto}</code>).
                </p>
              </Alert>
              <p><strong>Se eliminarán también:</strong></p>
              <ul>
                <li><strong>{proyectoAEliminar.poas?.length || 0}</strong> POA(s) asociados</li>
                <li>Todas las actividades y tareas de cada POA</li>
                <li>Toda la programación mensual</li>
                <li>Todo el historial de cambios del proyecto y sus POAs</li>
                <li>Todas las reformas y logs de carga</li>
              </ul>
              <p className="text-muted">
                <small>
                  Presupuesto del proyecto: <strong>${proyectoAEliminar.presupuesto_aprobado?.toLocaleString() || 'N/A'}</strong>
                </small>
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeDeleteModal} disabled={eliminando}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleEliminarProyecto}
            disabled={eliminando}
          >
            {eliminando ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Eliminando...
              </>
            ) : (
              <>
                <i className="bi bi-trash me-2"></i>
                Sí, eliminar proyecto
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default VerProyectos;