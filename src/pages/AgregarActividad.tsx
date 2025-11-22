import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card, Row, Col, Tabs, Tab, Spinner, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import { useProyectoManager } from '../hooks/useProyectoManager';
import { useActividadManager } from '../hooks/useActividadManager';
import { useTareaModal } from '../hooks/useTareaModal';
import { ActividadTareaService } from '../services/actividadTareaService';

import BusquedaProyecto from '../components/BusquedaProyecto';
import InformacionProyecto from '../components/InformacionProyecto';
import InformacionPOAs from '../components/InformacionPOAs';
import TareaModal from '../components/TareaModal';
import ExportarPOA from '../components/ExportarPOA';
import ActividadesPorPOA from '../components/ActividadesPorPOA';
import SidebarPresupuesto from '../components/SidebarPresupuesto';
import PresupuestoIndicador from '../components/PresupuestoIndicador';

import { showSuccess, showError } from '../utils/toast';
import { presupuestoAPI, PresupuestoPOA } from '../api/presupuestoAPI';
import '../styles/AgregarActividad.css';

const AgregarActividad: React.FC = () => {
  const navigate = useNavigate();

  // Hooks personalizados
  const {
    proyectos,
    proyectoSeleccionado,
    isLoading: proyectoLoading,
    seleccionarProyecto,
    validarProyectoSinActividades,
    departamentos
  } = useProyectoManager();

  const {
    poasProyecto,
    activePoaTab,
    poasConActividades,
    isLoading: actividadLoading,
    loadingMessage,
    setActivePoaTab,
    setPoasConActividades,
    cargarPoasSinActividades,
    getItemPresupuestarioConCache
  } = useActividadManager();

  const {
    showTareaModal,
    currentPoa,
    currentActividad,
    currentTarea,
    isEditingTarea,
    detallesFiltrados,
    cargandoDetalles,
    taskErrors,
    setShowTareaModal,
    setCurrentTarea,
    mostrarModalTarea,
    handleDetalleTareaChange,
    handleItemPresupuestarioChange,
    handleDescripcionChange,
    validarYGuardarTarea,
    clearTaskError
  } = useTareaModal();

  // Estados locales específicos del componente
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [datosGuardados, setDatosGuardados] = useState(false);
  const [actividadesYTareasCreadas, setActividadesYTareasCreadas] = useState<any[]>([]);
  const [showActividades, setShowActividades] = useState(false);
  const [presupuestoPOA, setPresupuestoPOA] = useState<PresupuestoPOA | null>(null);

  const isLoading = proyectoLoading || actividadLoading;

  // Cargar presupuesto del POA activo
  useEffect(() => {
    const cargarPresupuestoPoaActivo = async () => {
      if (activePoaTab) {
        try {
          const datos = await presupuestoAPI.getPresupuestoPOA(activePoaTab);
          setPresupuestoPOA(datos);
        } catch (error) {
          console.error('Error al cargar presupuesto del POA:', error);
          setPresupuestoPOA(null);
        }
      }
    };
    cargarPresupuestoPoaActivo();
  }, [activePoaTab, poasConActividades]); // Recargar cuando cambien las actividades

  // Función para manejar la selección de proyecto
  /**
 * handleSeleccionarProyecto
 * 
 * Objetivo: Seleccionar un proyecto y cargar sus POAs sin actividades.
 * Parámetros:
 * - proyecto: objeto con información del proyecto seleccionado.
 * Operación:
 * - Actualiza el estado del proyecto seleccionado.
 * - Carga los POAs sin actividades asociadas para el proyecto.
 * - Maneja correctamente la carga asíncrona para evitar estados inconsistentes.
 */
  const handleSeleccionarProyecto = async (proyecto: any) => {
    seleccionarProyecto(proyecto);
    await cargarPoasSinActividades(proyecto.id_proyecto);
  };

  // Función para guardar tarea en el estado local
  /**
 * handleGuardarTarea
 * 
 * Objetivo: Guardar una tarea (nueva o editada) en el estado local del POA correspondiente.
 * Parámetros:
 * - tareaCompleta: objeto con la información completa de la tarea a guardar.
 * Operación:
 * - Actualiza el arreglo de POAs con actividades y tareas, reemplazando o agregando la 
 * tarea según el modo.
  * - Mantiene la integridad del estado local.
 */
  const handleGuardarTarea = (tareaCompleta: any) => {
    setPoasConActividades(prev =>
      prev.map(poa =>
        poa.id_poa === currentPoa
          ? {
            ...poa,
            actividades: poa.actividades.map(act =>
              act.actividad_id === currentActividad
                ? {
                  ...act,
                  tareas: isEditingTarea
                    ? act.tareas.map(t => t.tempId === currentTarea?.tempId ? tareaCompleta : t)
                    : [...act.tareas, tareaCompleta]
                }
                : act
            )
          }
          : poa
      )
    );
  };

  // Función para eliminar tarea
  /**
 * eliminarTarea
 * 
 * Objetivo: Eliminar una tarea específica de una actividad dentro de un POA.
 * Parámetros:
 * - poaId: ID del POA.
 * - actividadId: ID de la actividad.
 * - tareaId: ID temporal (tempId) de la tarea a eliminar.
 * Operación:
 * - Filtra la tarea del estado local.
 * - Muestra mensaje de éxito tras eliminación.
 * - Evita modificaciones erróneas al estado usando funciones inmutables.
 */
  const eliminarTarea = (poaId: string, actividadId: string, tareaId: string) => {
    const nuevosPoasConActividades = poasConActividades.map(poa => {
      if (poa.id_poa === poaId) {
        const nuevasActividades = poa.actividades.map(act => {
          if (act.actividad_id === actividadId) {
            return {
              ...act,
              tareas: act.tareas.filter(t => t.tempId !== tareaId)
            };
          }
          return act;
        });
        return { ...poa, actividades: nuevasActividades };
      }
      return poa;
    });

    setPoasConActividades(nuevosPoasConActividades);
    showSuccess('Tarea eliminada correctamente');
  };

  // Función para mostrar modal de tarea
  /**
 * handleMostrarModalTarea
 * 
 * Objetivo: Mostrar el modal para crear o editar una tarea.
 * Parámetros:
 * - poaId, actividadId: identificadores para contextualizar la tarea.
 * - tarea (opcional): tarea a editar, si aplica.
 * Operación:
 * - Busca el POA y actividad correspondiente.
 * - Carga datos necesarios con cache para optimizar performance.
 */
  const handleMostrarModalTarea = async (poaId: string, actividadId: string, tarea?: any) => {
    const poa = poasConActividades.find(p => p.id_poa === poaId);
    const actividad = poa?.actividades.find(act => act.actividad_id === actividadId);

    await mostrarModalTarea(
      poaId,
      actividadId,
      tarea,
      poa,
      actividad,
      (id: string) => getItemPresupuestarioConCache(id, async (itemId: string) => {
        // Aquí iría la llamada a la API
        const { tareaAPI } = await import('../api/tareaAPI');
        return tareaAPI.getItemPresupuestarioPorId(itemId);
      })
    );
  };

  // Función para manejar cambios en detalle de tarea
  const handleDetalleTareaChangeWrapper = async (idDetalleTarea: string) => {
    await handleDetalleTareaChange(
      idDetalleTarea,
      poasConActividades,
      (id: string) => getItemPresupuestarioConCache(id, async (itemId: string) => {
        const { tareaAPI } = await import('../api/tareaAPI');
        return tareaAPI.getItemPresupuestarioPorId(itemId);
      })
    );
  };

  // Función para manejar cambios en item presupuestario
  const handleItemPresupuestarioChangeWrapper = async (idItemPresupuestario: string) => {
    await handleItemPresupuestarioChange(idItemPresupuestario, poasConActividades);
  };

  // Función para validar y guardar
  const handleValidarYGuardarTarea = () => {
    validarYGuardarTarea(handleGuardarTarea);
  };

  // Función para toggle de expansión de tarea
  const toggleTareaExpansion = (poaId: string, actividadId: string, tareaId: string) => {
    setPoasConActividades(prev =>
      prev.map(poa =>
        poa.id_poa === poaId
          ? {
            ...poa,
            actividades: poa.actividades.map(act =>
              act.actividad_id === actividadId
                ? {
                  ...act,
                  tareas: act.tareas.map(tarea =>
                    tarea.tempId === tareaId
                      ? { ...tarea, expanded: !tarea.expanded }
                      : tarea
                  )
                }
                : act
            )
          }
          : poa
      )
    );
  };

  // Función para calcular total de actividad
  const calcularTotalActividad = (poaId: string, actividadId: string) => {
    const poa = poasConActividades.find(p => p.id_poa === poaId);
    if (!poa) return 0;

    const actividad = poa.actividades.find(a => a.actividad_id === actividadId);
    if (!actividad) return 0;

    return actividad.tareas.reduce((sum, tarea) => sum + (tarea.total || 0), 0);
  };

  // Función para manejar el envío del formulario
  /**
 * handleSubmit
 * 
 * Objetivo: Manejar el envío del formulario principal para guardar actividades y tareas.
 * Parámetros:
 * - e: evento de envío del formulario.
 * Operación:
 * - Valida formulario completo con servicio `ActividadTareaService`.
 * - Si es válido, muestra modal de confirmación para guardar.
 * - Previene envíos inválidos.
 */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ActividadTareaService.validarFormulario(proyectoSeleccionado, poasProyecto, poasConActividades)) {
      return;
    }

    setShowConfirmModal(true);
  };

  // Función para guardar datos
  /**
 * handleGuardarDatos
 * 
 * Objetivo: Guardar actividades y tareas definitivamente en backend.
 * Operación:
 * - Llama al servicio para guardar los datos.
 * - Actualiza estados locales según el resultado.
 * - Muestra feedback visual con modales y notificaciones.
 * - Maneja errores y estados de carga para evitar datos corruptos o pérdidas.
 */
  const handleGuardarDatos = async () => {
    const result = await ActividadTareaService.guardarActividades(
      poasConActividades,
      setActivePoaTab
    );

    if (result.success) {
      setActividadesYTareasCreadas(result.data || []);
      setDatosGuardados(true);
      setShowConfirmModal(false);
      setShowSuccessModal(true);
    } else {
      setShowConfirmModal(false);
      showError(result.error || 'Error al guardar los datos');
    }
  };

  // Funciones para manejo de modales
  const handleCloseModals = () => {
    setShowConfirmModal(false);
    setShowSuccessModal(false);
  };

  const handleVolverDashboard = () => {
    navigate('/Dashboard');
  };

  return (
    <Container className="py-4 main-content-with-sidebar">
      <Card className="shadow-lg">
        <Card.Header className="bg-primary bg-gradient text-white p-3">
          <h2 className="mb-0 fw-bold text-center">Crear Actividades y Tareas para Proyecto</h2>
        </Card.Header>
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit}>
            {/* Sección de Búsqueda de Proyecto */}
            <BusquedaProyecto
              proyectos={proyectos}
              isLoading={isLoading}
              seleccionarProyecto={handleSeleccionarProyecto}
              validarProyecto={validarProyectoSinActividades}
              mostrarValidacion={true}
            />

            {/* Información del Proyecto Seleccionado */}
            {proyectoSeleccionado && (
              <InformacionProyecto
                proyecto={proyectoSeleccionado}
                cantidadPoas={poasProyecto.length}
                departamentos={departamentos}
              />
            )}

            {/* Información de los POAs del Proyecto */}
            {proyectoSeleccionado && poasProyecto.length > 0 && (
              <InformacionPOAs poas={poasProyecto} />
            )}

            {/* Sección de actividades por POA */}
            {proyectoSeleccionado && poasProyecto.length > 0 && (
              <Row className="mb-4">
                <Col md={12}>
                  <Card>
                    <Card.Header className="bg-light">
                      <h5 className="mb-0">Definición de Actividades por POA</h5>
                      <p className="text-muted small mb-0">
                        Las actividades añadidas en el primer POA se replicarán automáticamente en los demás POAs
                      </p>
                    </Card.Header>
                    <Card.Body>
                      <Tabs
                        activeKey={activePoaTab}
                        onSelect={(k) => setActivePoaTab(k || '')}
                        className="mb-4"
                      >
                        {poasConActividades.map((poa) => (
                          <Tab
                            key={poa.id_poa}
                            eventKey={poa.id_poa}
                            title={`${poa.codigo_poa} - ${poa.tipo_poa}`}
                          >
                            {/* Indicador de presupuesto del POA */}
                            {activePoaTab === poa.id_poa && presupuestoPOA && (
                              <Row className="mb-3">
                                <Col>
                                  <PresupuestoIndicador
                                    titulo={`Presupuesto del POA: ${poa.codigo_poa}`}
                                    presupuestoTotal={presupuestoPOA.presupuesto_asignado}
                                    presupuestoUtilizado={presupuestoPOA.suma_actividades}
                                    presupuestoDisponible={presupuestoPOA.presupuesto_disponible}
                                    porcentajeUtilizado={presupuestoPOA.porcentaje_utilizado}
                                    mostrarDetalles={true}
                                  />
                                </Col>
                              </Row>
                            )}

                            <ActividadesPorPOA
                              poa={poa}
                              onMostrarModalTarea={handleMostrarModalTarea}
                              onEliminarTarea={eliminarTarea}
                              onToggleTareaExpansion={toggleTareaExpansion}
                              calcularTotalActividad={calcularTotalActividad}
                              poasConActividades={poasConActividades}
                            />
                          </Tab>
                        ))}
                      </Tabs>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Botones de acción */}
            {proyectoSeleccionado && poasProyecto.length > 0 && (
              <Row className="mt-4">
                <Col className="d-flex justify-content-center">
                  <Button variant="secondary" className="me-2" onClick={() => navigate('/Dashboard')}>
                    Cancelar
                  </Button>

                  <Button variant="primary" type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                        Guardando...
                      </>
                    ) : (
                      'Guardar Actividades y Tareas'
                    )}
                  </Button>
                </Col>
              </Row>
            )}

            {/* Modal de Confirmación */}
            <Modal show={showConfirmModal} onHide={handleCloseModals} centered>
              <Modal.Header closeButton>
                <Modal.Title>Confirmar Guardado</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p>Debe guardar las actividades y tareas de TODOS los POA's, no se pueden cambiar hasta ser revisadas por la Dirección de Investigación. ¿Desea continuar?</p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="danger" onClick={handleCloseModals}>
                  Volver
                </Button>
                <Button variant="success" onClick={handleGuardarDatos} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar'
                  )}
                </Button>
              </Modal.Footer>
            </Modal>

            {/* Modal de Éxito */}
            <Modal show={showSuccessModal} onHide={handleCloseModals} centered>
              <Modal.Header closeButton>
                <Modal.Title>Éxito</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p>Actividades y Tareas guardadas exitosamente</p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="primary" onClick={handleVolverDashboard}>
                  Volver al Inicio
                </Button>
                {datosGuardados && (
                  <ExportarPOA
                    codigoProyecto={proyectoSeleccionado?.codigo_proyecto || ''}
                    poas={poasProyecto.map(poa => ({
                      id_poa: poa.id_poa,
                      codigo_poa: poa.codigo_poa,
                      anio_ejecucion: poa.anio_ejecucion,
                      presupuesto_asignado: poa.presupuesto_asignado
                    }))}
                    actividadesYTareas={actividadesYTareasCreadas}
                    onExport={() => showSuccess("POA exportado correctamente")}
                  />
                )}
              </Modal.Footer>
            </Modal>

            {/* Modal para agregar/editar tareas */}
            <TareaModal
              show={showTareaModal}
              onHide={() => setShowTareaModal(false)}
              isEditing={isEditingTarea}
              tarea={currentTarea}
              detallesFiltrados={detallesFiltrados}
              cargandoDetalles={cargandoDetalles}
              taskErrors={taskErrors}
              onTareaChange={setCurrentTarea}
              onDetalleTareaChange={handleDetalleTareaChangeWrapper}
              onItemPresupuestarioChange={handleItemPresupuestarioChangeWrapper}
              onDescripcionChange={handleDescripcionChange}
              onSave={handleValidarYGuardarTarea}
              clearTaskError={clearTaskError}
              actividadId={currentActividad?.actividad_id}
            />

            {/* Indicador de carga */}
            {isLoading && (
              <div className="position-fixed top-0 left-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75" style={{ zIndex: 1050 }}>
                <div className="text-center">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">{loadingMessage}</p>
                </div>
              </div>
            )}
          </Form>
        </Card.Body>
      </Card>

      {/* Sidebar fijo del presupuesto */}
      {proyectoSeleccionado && poasConActividades.length > 0 && (
        <SidebarPresupuesto
          poasConActividades={poasConActividades}
          activePoaTab={activePoaTab}
          calcularTotalActividad={calcularTotalActividad}
          showActividades={showActividades}
          setShowActividades={setShowActividades}
        />
      )}
    </Container>
  );
};

export default AgregarActividad;
