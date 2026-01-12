import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Container, Card, Row, Col, Tabs, Tab, Spinner, Modal, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import { useProyectoManager } from '../hooks/useProyectoManager';
import { useActividadManager } from '../hooks/useActividadManager';
import { useTareaModal } from '../hooks/useTareaModal';
import { ActividadTareaService } from '../services/actividadTareaService';

import BusquedaProyecto from '../components/BusquedaProyecto';
import InformacionProyecto from '../components/InformacionProyecto';
import InformacionPOAs from '../components/InformacionPOAs';
import TareaModal from '../components/TareaModal';
import ActividadesPorPOA from '../components/ActividadesPorPOA';
import SidebarPresupuesto from '../components/SidebarPresupuesto';
import { JustificacionModal } from '../components/JustificacionModal';

import { POAConActividadesYTareas } from '../interfaces/actividad';
import { TareaForm, ProgramacionMensualCreate } from '../interfaces/tarea';
import { Proyecto } from '../interfaces/project';
import { showError, showInfo } from '../utils/toast';
import '../styles/AgregarActividad.css';

const EditarActividad: React.FC = () => {
  const navigate = useNavigate();

  // Hooks personalizados reutilizados
  const {
    proyectos,
    proyectoSeleccionado,
    isLoading: proyectoLoading,
    seleccionarProyecto,
    validarProyectoConActividades, // Diferente validación para editar
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
    cargarPoasConActividadesYTareasReales, // Nueva función para editar
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

  // Estados específicos para editar
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showJustificacionModal, setShowJustificacionModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showActividades, setShowActividades] = useState(false);
  const [actividadesOriginales, setActividadesOriginales] = useState<POAConActividadesYTareas[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ref para scroll automático a errores
  const errorRef = useRef<HTMLDivElement>(null);

  const isLoading = proyectoLoading || actividadLoading;

  // Auto-scroll a mensaje de error cuando aparece
  useEffect(() => {
    if (errorMessage && errorRef.current) {
      errorRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }
  }, [errorMessage]);

  // Efecto para guardar actividades originales cuando se cargan
  useEffect(() => {
    if (poasConActividades.length > 0 && actividadesOriginales.length === 0) {
      setActividadesOriginales(JSON.parse(JSON.stringify(poasConActividades))); // Deep copy
    }
  }, [poasConActividades, actividadesOriginales.length]);

  /**
 * Carga segura de actividades con tareas existentes
 *
 * Objetivo:
 *     Recuperar del backend únicamente las actividades y tareas existentes del proyecto.
 *
 * Parámetros:
 *     - proyectoId (string): ID del proyecto seleccionado.
 *
 * Operación:
 *     - Invoca el servicio `cargarActividadesPorProyecto` para obtener actividades válidas.
 *     - Filtra y estructura las tareas en un formato editable.
 *     - Impide la carga de tareas inexistentes, temporales o con referencias inválidas.
 */

  // Función específica para cargar actividades y tareas existentes
  const cargarActividadesExistentes = async (proyectoId: string) => {
    try {
      showInfo('Cargando actividades y tareas existentes...');

      // Cargar POAs con actividades y tareas reales ordenadas
      await cargarPoasConActividadesYTareasReales(proyectoId);

    } catch (error) {
      showError('Error al cargar las actividades existentes');
    }
  };

  // Función para manejar la selección de proyecto
  const handleSeleccionarProyecto = async (proyecto: Proyecto) => {
    seleccionarProyecto(proyecto);
    await cargarActividadesExistentes(proyecto.id_proyecto);
  };

  // Función para guardar tarea (editada o nueva) - SOLO actualiza estado local
  const handleGuardarTarea = async (tareaCompleta: TareaForm) => {
    try {
      // Solo actualizar el estado local, NO la programación mensual aquí
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
                      : [...act.tareas, tareaCompleta] // Agregar nueva tarea
                  }
                  : act
              )
            }
            : poa
        )
      );

      showInfo('Tarea guardada exitosamente');
    } catch (error) {
      console.error('Error al guardar tarea:', error);
      showError('Error al guardar la tarea: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  // Función para manejar la actualización de actividad desde el componente hijo
  const handleActividadActualizada = (idActividadReal: string, nuevaDescripcion: string) => {
    setPoasConActividades(prev =>
      prev.map(poa => ({
        ...poa,
        actividades: poa.actividades.map(act =>
          act.id_actividad_real === idActividadReal
            ? { ...act, descripcion_actividad: nuevaDescripcion }
            : act
        )
      }))
    );

    // También actualizar actividadesOriginales para que no se detecten cambios falsos
    setActividadesOriginales(prev =>
      prev.map(poa => ({
        ...poa,
        actividades: poa.actividades.map(act =>
          act.id_actividad_real === idActividadReal
            ? { ...act, descripcion_actividad: nuevaDescripcion }
            : act
        )
      }))
    );
  };

  // Función para guardar cambios (actualizar tareas existentes)
  /**
   * Guardado controlado de tareas editadas
   *
   * Objetivo:
   *     Ejecutar la persistencia de tareas al backend solo si son válidas.
   *
   * Parámetros:
   *     - Ninguno directo; opera sobre el estado actual de tareas.
   *
   * Operación:
   *     - Prepara una lista de tareas modificadas.
   *     - Actualiza la programación mensual de tareas editadas.
   *     - Llama al servicio `editarTareas` del backend pasando el estado original para comparación.
   *     - Muestra retroalimentación de éxito o error.
   *     - Maneja errores del servidor para evitar estados inconsistentes.
   */

  // Función para mostrar modal de tarea
  /**
 * Control de apertura del modal de edición de tareas
 *
 * Objetivo:
 *     Validar que la tarea a editar esté correctamente asociada a una actividad del POA.
 *
 * Parámetros:
 *     - poaId (string): ID del POA.
 *     - actividadId (string): ID de la actividad.
 *     - tareaId (string): ID de la tarea.
 *
 * Operación:
 *     - Verifica que la tarea exista dentro del POA y la actividad correspondiente.
 *     - Prepara el modal con datos completos, incluyendo ítem presupuestario validado.
 *     - Previene intentos de edición sobre tareas ajenas o mal formadas.
 */

  const handleMostrarModalTarea = async (poaId: string, actividadId: string, tarea?: TareaForm) => {
    const poa = poasConActividades.find(p => p.id_poa === poaId);
    const actividad = poa?.actividades.find(act => act.actividad_id === actividadId);

    await mostrarModalTarea(
      poaId,
      actividadId,
      tarea,
      poa,
      actividad,
      (id: string) => getItemPresupuestarioConCache(id, async (itemId: string) => {
        const { tareaAPI } = await import('../api/tareaAPI');
        return tareaAPI.getItemPresupuestarioPorId(itemId);
      })
    );
  };

  // Wrappers para compatibilidad
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

  const handleItemPresupuestarioChangeWrapper = async (idItemPresupuestario: string) => {
    await handleItemPresupuestarioChange(idItemPresupuestario, poasConActividades);
  };

  const handleValidarYGuardarTarea = () => {
    validarYGuardarTarea(handleGuardarTarea);
  };

  // Función para eliminar tareas (solo nuevas tareas agregadas en esta sesión)
  /**
 * Eliminación controlada de tareas nuevas
 *
 * Objetivo:
 *     Permitir únicamente la eliminación de tareas agregadas en esta sesión.
 *
 * Parámetros:
 *     - poaId (string): ID del POA.
 *     - actividadId (string): ID de la actividad.
 *     - tareaId (string): ID de la tarea a eliminar.
 *
 * Operación:
 *     - Verifica si la tarea no tiene ID (tarea nueva).
 *     - La elimina del estado temporal sin afectar la base de datos.
 *     - Protege las tareas persistidas de ser eliminadas desde el cliente.
 *     - Asegura que la integridad de datos en base no se vea afectada por errores del usuario.
 */

  const eliminarTarea = (poaId: string, actividadId: string, tareaId: string) => {
    const poa = poasConActividades.find(p => p.id_poa === poaId);
    const actividad = poa?.actividades.find(act => act.actividad_id === actividadId);
    const tarea = actividad?.tareas.find(t => t.tempId === tareaId);

    // Solo permitir eliminar tareas que no tienen id_tarea_real (tareas nuevas)
    if (tarea && !tarea.id_tarea_real) {
      setPoasConActividades(prev =>
        prev.map(p =>
          p.id_poa === poaId
            ? {
              ...p,
              actividades: p.actividades.map(act =>
                act.actividad_id === actividadId
                  ? {
                    ...act,
                    tareas: act.tareas.filter(t => t.tempId !== tareaId)
                  }
                  : act
              )
            }
            : p
        )
      );
      showInfo('Tarea eliminada correctamente');
    } else {
      showError('No se pueden eliminar tareas existentes en modo edición. Solo se pueden eliminar tareas agregadas en esta sesión.');
    }
  };

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

  const calcularTotalActividad = (poaId: string, actividadId: string) => {
    const poa = poasConActividades.find(p => p.id_poa === poaId);
    if (!poa) return 0;

    const actividad = poa.actividades.find(a => a.actividad_id === actividadId);
    if (!actividad) return 0;

    return actividad.tareas.reduce((sum, tarea) => sum + (tarea.total || 0), 0);
  };

  // Función para verificar si hay cambios
  /**
 * Detección de modificaciones en tareas
 *
 * Objetivo:
 *     Determinar si existen cambios reales en las tareas editadas.
 *
 * Parámetros:
 *     - Ninguno directo; se evalúa el estado de las tareas actuales.
 *
 * Operación:
 *     - Compara los campos clave: detalle, cantidad, precio, ítem presupuestario, etc.
 *     - Retorna true si alguna tarea fue modificada o agregada.
 *     - Evita que el backend reciba solicitudes sin cambios válidos.
 */

  const hayTareasCambiadas = (): boolean => {
    if (actividadesOriginales.length === 0) return false;

    for (const poa of poasConActividades) {
      const poaOriginal = actividadesOriginales.find(p => p.id_poa === poa.id_poa);
      if (!poaOriginal) continue;

      for (const actividad of poa.actividades) {
        const actividadOriginal = poaOriginal.actividades.find(a => a.actividad_id === actividad.actividad_id);
        if (!actividadOriginal) continue;

        // Verificar si hay nuevas tareas agregadas (sin id_tarea_real)
        const tareasNuevas = actividad.tareas.filter(t => !t.id_tarea_real);
        if (tareasNuevas.length > 0) {
          return true;
        }

        // Verificar cambios en tareas existentes
        for (const tarea of actividad.tareas) {
          // Solo verificar tareas que tienen id_tarea_real (existentes)
          if (!tarea.id_tarea_real) continue;

          const tareaOriginal = actividadOriginal.tareas.find(t => t.id_tarea_real === tarea.id_tarea_real);
          if (!tareaOriginal) continue;

          // Comparar campos importantes
          if (
            tarea.cantidad !== tareaOriginal.cantidad ||
            tarea.precio_unitario !== tareaOriginal.precio_unitario ||
            tarea.lineaPaiViiv !== tareaOriginal.lineaPaiViiv
          ) {
            return true;
          }
        }
      }
    }

    return false;
  };

  // Función para manejar el envío del formulario (solo validar cambios)
  /**
 * Validación previa al envío de edición
 *
 * Objetivo:
 *     Confirmar que existe un proyecto y que hay tareas cambiadas antes de proceder.
 *
 * Parámetros:
 *     - e (React.FormEvent): Evento del formulario para prevenir el envío automático.
 *
 * Operación:
 *     - Llama a `hayTareasCambiadas` para confirmar existencia de cambios.
 *     - Si es válido, abre el modal de confirmación.
 *     - Previene operaciones sin propósito.
 *     - Evita manipulaciones del formulario para guardar tareas sin editar.
 */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!proyectoSeleccionado) {
      showError('Debe seleccionar un proyecto');
      return;
    }

    if (!hayTareasCambiadas()) {
      showError('No se detectaron cambios en las tareas');
      return;
    }

    setShowJustificacionModal(true);
  };

  // Nueva función para actualizar todas las programaciones mensuales
  /**
   * Actualización masiva de programaciones mensuales
   *
   * Objetivo:
   *     Actualizar la programación mensual de todas las tareas que han sido editadas.
   *
   * Operación:
   *     - Identifica tareas con gastos_mensuales modificados.
   *     - Actualiza la programación mensual de cada tarea editada.
   *     - Maneja errores por tarea individual sin afectar las demás.
   */
  const actualizarProgramacionesMensuales = async (justificacion: string) => {
    const tareasConProgramacionEditada = [];

    // Recopilar todas las tareas que tienen programación mensual modificada
    for (const poa of poasConActividades) {
      const poaOriginal = actividadesOriginales.find(p => p.id_poa === poa.id_poa);
      if (!poaOriginal) continue;

      for (const actividad of poa.actividades) {
        const actividadOriginal = poaOriginal.actividades.find(a => a.actividad_id === actividad.actividad_id);
        if (!actividadOriginal) continue;

        for (const tarea of actividad.tareas) {
          // Solo procesar tareas existentes con programación mensual
          if (!tarea.id_tarea_real || !tarea.gastos_mensuales) continue;

          const tareaOriginal = actividadOriginal.tareas.find(t => t.id_tarea_real === tarea.id_tarea_real);
          if (!tareaOriginal) continue;

          // Verificar si la programación mensual cambió
          const programacionCambio = JSON.stringify(tarea.gastos_mensuales) !== JSON.stringify(tareaOriginal.gastos_mensuales);

          if (programacionCambio) {
            tareasConProgramacionEditada.push(tarea);
          }
        }
      }
    }

    // Actualizar programación mensual de cada tarea
    if (tareasConProgramacionEditada.length > 0) {
      showInfo(`Actualizando programación mensual de ${tareasConProgramacionEditada.length} tarea(s)...`);

      for (const tarea of tareasConProgramacionEditada) {
        try {
          await actualizarProgramacionMensual(tarea, justificacion);
        } catch (error) {
          console.error(`Error al actualizar programación de tarea ${tarea.nombre}:`, error);
          // Continuar con las demás tareas
        }
      }
    }
  };

  // Función para actualizar programación mensual de una tarea específica
  /**
   * Actualización de programación mensual en tareas editadas
   *
   * Objetivo:
   *     Reemplazar completamente la programación mensual de una tarea cuando se edita.
   *
   * Parámetros:
   *     - tareaCompleta: TareaForm — Tarea con los nuevos datos incluyendo gastos_mensuales.
   *
   * Operación:
   *     - Convierte el array gastos_mensuales a formato ProgramacionMensualCreate.
   *     - Utiliza la API para eliminar la programación anterior y crear la nueva.
   *     - Maneja errores específicos y proporciona retroalimentación al usuario.
   */
  const actualizarProgramacionMensual = async (tareaCompleta: TareaForm, justificacionUsuario: string) => {
    if (!tareaCompleta.id_tarea_real || !tareaCompleta.gastos_mensuales) {
      return;
    }

    try {
      // Convertir gastos_mensuales array a formato de programación mensual
      // El backend espera formato "MM-YYYY", no nombres de meses
      const añoActual = new Date().getFullYear();

      const programacionesMensuales: ProgramacionMensualCreate[] = tareaCompleta.gastos_mensuales
        .map((valor: number, index: number) => {
          const mesNumero = index + 1; // Enero = 1, Diciembre = 12
          const mesFormateado = `${mesNumero.toString().padStart(2, '0')}-${añoActual}`;

          return {
            id_tarea: tareaCompleta.id_tarea_real!,
            mes: mesFormateado, // Formato "01-2025", "02-2025", etc.
            valor: valor || 0
          };
        })
        .filter((prog: ProgramacionMensualCreate) => prog.valor > 0); // Solo crear programaciones con valor > 0

      if (programacionesMensuales.length > 0) {
        const { tareaAPI } = await import('../api/tareaAPI');
        await tareaAPI.actualizarProgramacionMensualCompleta(
          tareaCompleta.id_tarea_real,
          programacionesMensuales,
          justificacionUsuario
        );
      } else {
        // Si no hay valores, solo eliminar programación existente
        const { tareaAPI } = await import('../api/tareaAPI');

        // Construir la justificación combinada según el requerimiento del usuario
        const justificacionBackend = `Eliminación completa de programación mensual de la tarea: ${tareaCompleta.nombre}`;
        const justificacionFinal = `${justificacionBackend} - ${justificacionUsuario}`;

        await tareaAPI.eliminarProgramacionMensualCompleta(tareaCompleta.id_tarea_real, justificacionFinal);
      }
    } catch (error) {
      console.error('Error al actualizar programación mensual:', error);
      throw new Error('Error al actualizar la programación mensual: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  // Función para guardar cambios (actualizar tareas existentes)
  const handleGuardarCambios = async (justificacion: string) => {
    try {
      // Limpiar errores previos
      setErrorMessage(null);
      setShowJustificacionModal(false);

      // Primero actualizar programaciones mensuales de tareas editadas
      await actualizarProgramacionesMensuales(justificacion);

      // Luego ejecutar el guardado normal de las tareas
      const result = await ActividadTareaService.editarTareas(poasConActividades, actividadesOriginales, justificacion);

      if (result.success) {
        setShowConfirmModal(false);
        setShowSuccessModal(true);
      } else {
        setShowConfirmModal(false);
        setErrorMessage(result.error || 'Error al actualizar las tareas');
        showError(result.error || 'Error al actualizar las tareas');
      }
    } catch (error: any) {
      setShowConfirmModal(false);

      // Capturar errores HTTP 400 del backend (presupuesto excedido, etc.)
      let displayError = 'Error al actualizar las tareas';

      if (error.response && error.response.status === 400 && error.response.data?.detail) {
        displayError = error.response.data.detail;
      } else if (error instanceof Error) {
        displayError = error.message;
      }

      setErrorMessage(displayError);
      showError(displayError);
    }
  };

  // Funciones para manejo de modales
  const handleCloseModals = () => {
    setShowConfirmModal(false);
    setShowJustificacionModal(false);
    setShowSuccessModal(false);
  };

  const handleVolverDashboard = () => {
    navigate('/Dashboard');
  };

  return (
    <Container className="py-4 main-content-with-sidebar">
      <Card className="shadow-lg">
        <Card.Header className="bg-warning bg-gradient text-dark p-3">
          <h2 className="mb-0 fw-bold text-center">Editar Actividades y Tareas de Proyecto</h2>
        </Card.Header>
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit}>
            {/* Mensaje de error con scroll automático */}
            {errorMessage && (
              <div ref={errorRef}>
                <Alert variant="danger" dismissible onClose={() => setErrorMessage(null)} className="mb-4">
                  <Alert.Heading>Error al actualizar tareas</Alert.Heading>
                  <p className="mb-0">{errorMessage}</p>
                </Alert>
              </div>
            )}

            {/* Sección de Búsqueda de Proyecto */}
            <BusquedaProyecto
              proyectos={proyectos}
              isLoading={isLoading}
              seleccionarProyecto={handleSeleccionarProyecto}
              validarProyecto={validarProyectoConActividades} // Validación diferente
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
                      <h5 className="mb-0">Editar Tareas por POA</h5>
                      <p className="text-muted small mb-0">
                        Se pueden modificar las tareas existentes. Las actividades pueden ser renombradas haciendo clic en el ícono del lápiz.
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
                            <ActividadesPorPOA
                              poa={poa}
                              onMostrarModalTarea={handleMostrarModalTarea}
                              onEliminarTarea={eliminarTarea} // Función deshabilitada
                              onToggleTareaExpansion={toggleTareaExpansion}
                              calcularTotalActividad={calcularTotalActividad}
                              poasConActividades={poasConActividades}
                              onActividadActualizada={handleActividadActualizada}
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

                  <Button
                    variant="warning"
                    type="submit"
                    disabled={isLoading || !hayTareasCambiadas()}
                  >
                    {isLoading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                        Actualizando...
                      </>
                    ) : (
                      'Actualizar Tareas'
                    )}
                  </Button>
                </Col>
              </Row>
            )}

            {/* Modal de Confirmación */}
            <Modal show={showConfirmModal} onHide={handleCloseModals} centered>
              <Modal.Header closeButton>
                <Modal.Title>Confirmar Actualización</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p>¿Está seguro de que desea actualizar las tareas modificadas? Los cambios se aplicarán inmediatamente.</p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseModals}>
                  Cancelar
                </Button>
                <Button variant="warning" onClick={() => {
                  setShowConfirmModal(false);
                  setShowJustificacionModal(true);
                }} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Actualizando...
                    </>
                  ) : (
                    'Confirmar Actualización'
                  )}
                </Button>
              </Modal.Footer>
            </Modal>

            {/* Modal de Éxito */}
            <Modal show={showSuccessModal} onHide={handleCloseModals} centered>
              <Modal.Header closeButton>
                <Modal.Title>Actualización Exitosa</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p>Las tareas han sido actualizadas exitosamente</p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="primary" onClick={handleVolverDashboard}>
                  Volver al Inicio
                </Button>
              </Modal.Footer>
            </Modal>

            {/* Modal para editar tareas */}
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
            />

            {/* Modal de Justificación para tareas */}
            <JustificacionModal
              show={showJustificacionModal}
              onHide={() => setShowJustificacionModal(false)}
              onConfirm={handleGuardarCambios}
              title="Justificación de Cambio en Tareas"
              isLoading={isLoading}
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

export default EditarActividad;
