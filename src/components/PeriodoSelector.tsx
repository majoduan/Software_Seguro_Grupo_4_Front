import React, { useState } from 'react';
import { Row, Col, Card, ListGroup, Badge, Button, Collapse } from 'react-bootstrap';
import { Periodo } from '../interfaces/periodo';
import CrearPeriodoModal from './CrearPeriodoModal';

interface PeriodoSelectorProps {
  periodosCalculados: Periodo[];
  periodosSeleccionados: Periodo[];
  seleccionarPeriodo: (periodo: Periodo) => void;
  quitarPeriodo: (index: number) => void;
  // Props para modal de creación de periodo
  showCrearPeriodo: boolean;
  setShowCrearPeriodo: (show: boolean) => void;
  nuevoPeriodo: any;
  handleChangePeriodo: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGuardarPeriodo: () => void;
  handleAbrirModalPeriodo: () => void;
  presupuestoTotalAsignado: number;
  presupuestoRestante: number;
  isEditing?: boolean;
}

/**
 * Componente PeriodoSelector
 *  Objetivo:
 * - Facilitar una selección controlada y segura de periodos por parte del usuario.
 * - Prevenir duplicación de datos y garantizar la consistencia de las operaciones mediante
 *  validaciones visuales y lógicas.
 * - Minimizar errores del usuario y asegurar la integridad del presupuesto mediante indicaciones 
 * visuales del total y del remanente.
 * 
 * Parámetros:
 * - periodosCalculados: Periodo[] – Periodos existentes en el sistema que pueden ser seleccionados.
 * - periodosSeleccionados: Periodo[] – Periodos actualmente seleccionados por el usuario.
 * - seleccionarPeriodo: función para agregar un periodo a la lista seleccionada.
 * - quitarPeriodo: función para eliminar un periodo seleccionado.
 * - showCrearPeriodo: controla la visibilidad del modal para crear un nuevo periodo.
 * - setShowCrearPeriodo: función que actualiza el estado de visibilidad del modal.
 * - nuevoPeriodo: objeto con los datos del nuevo periodo a crear.
 * - handleChangePeriodo: función para manejar los cambios en los campos del nuevo periodo.
 * - handleGuardarPeriodo: función para guardar el nuevo periodo creado.
 * - handleAbrirModalPeriodo: función para abrir el modal de creación de periodo.
 * - presupuestoTotalAsignado: número que representa el presupuesto total asignado.
 * - presupuestoRestante: número que representa el presupuesto aún disponible.
 * - isEditing: booleano opcional que define si el componente se utiliza en modo edición.
 * 
 * Operación:
 * - Permite seleccionar y quitar periodos dentro de un proyecto, asegurando que no se repitan.
 * - Los datos mostrados son renderizados de forma condicional para evitar operaciones 
 * innecesarias si no hay datos disponibles.
 * 
 */

export const PeriodoSelector: React.FC<PeriodoSelectorProps> = ({
  periodosCalculados,
  periodosSeleccionados,
  seleccionarPeriodo,
  quitarPeriodo,
  showCrearPeriodo,
  setShowCrearPeriodo,
  nuevoPeriodo,
  handleChangePeriodo,
  handleGuardarPeriodo,
  handleAbrirModalPeriodo,
  presupuestoTotalAsignado,
  presupuestoRestante,
  isEditing = false
}) => {
  const [nuevoPeriodoOpen, setNuevoPeriodoOpen] = useState(false);
  
  const tituloSeccion = isEditing ? 'Periodos Existentes' : 'Periodos Disponibles';

  return (
    <Row className="mb-4">
      <Col md={6}>
        <Card>
          <Card.Header className="bg-light">
            <h5 className="mb-0">{tituloSeccion}</h5>
          </Card.Header>
          <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <ListGroup>
              {periodosCalculados.length > 0 ? (
                <>
                  <div className="mb-2 fw-bold text-primary">Periodos del Proyecto</div>
                  {periodosCalculados.map((periodo, index) => (
                    <ListGroup.Item
                      key={`calc-${periodo.id_periodo || index}`}
                      action
                      onClick={() => seleccionarPeriodo(periodo)}
                      disabled={periodosSeleccionados.some(p => p.id_periodo === periodo.id_periodo)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{periodo.nombre_periodo}</strong> - {periodo.anio}
                          <div className="small text-muted">{periodo.fecha_inicio} al {periodo.fecha_fin}</div>
                        </div>
                        <Badge bg="info">{periodo.mes || 'Anual'}</Badge>
                      </div>
                    </ListGroup.Item>
                  ))}
                </>
              ) : (
                <div className="text-center py-3 text-muted">
                  No hay periodos calculados para este proyecto
                </div>
              )}
            </ListGroup>

            {/* Sección para crear periodo colapsable */}
            <div className="nuevo-periodo-section mt-3">
              <h6
                className="nuevo-periodo-title d-flex align-items-center justify-content-between"
                onClick={() => setNuevoPeriodoOpen(!nuevoPeriodoOpen)}
                style={{ cursor: 'pointer', padding: '8px', border: '1px solid #dee2e6', borderRadius: '4px' }}
              >
                <span>Crear periodo por prórroga <span className="text-muted fs-6">(Opcional)</span></span>
                <span className="ms-2">
                  {nuevoPeriodoOpen ? (
                    <i className="bi bi-chevron-up"></i>
                  ) : (
                    <i className="bi bi-chevron-down"></i>
                  )}
                </span>
              </h6>
              
              <Collapse in={nuevoPeriodoOpen}>
                <div className="mt-2">
                  <div className="d-grid gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={handleAbrirModalPeriodo}
                    >
                      <i className="bi bi-plus-circle me-1"></i> Crear Nuevo Periodo
                    </Button>
                    <small className="text-muted">
                      Utilice esta opción únicamente en caso de prórroga del proyecto.
                    </small>
                  </div>
                </div>
              </Collapse>
            </div>
          </Card.Body>
        </Card>
      </Col>
      
      <Col md={6}>
        <Card>
          <Card.Header className="bg-light">
            <h5 className="mb-0">Periodos Seleccionados</h5>
          </Card.Header>
          <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {periodosSeleccionados.length > 0 ? (
              <ListGroup>
                {periodosSeleccionados.map((periodo, index) => (
                  <ListGroup.Item key={periodo.id_periodo} className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{periodo.nombre_periodo}</strong> - {periodo.anio}
                      <div className="small text-muted">{periodo.fecha_inicio} al {periodo.fecha_fin}</div>
                    </div>
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      onClick={() => quitarPeriodo(index)}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            ) : (
              <div className="text-center py-3 text-muted">
                No hay periodos seleccionados
              </div>
            )}
          </Card.Body>
          {periodosSeleccionados.length > 0 && (
            <Card.Footer className="bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <span>Total Periodos: <strong>{periodosSeleccionados.length}</strong></span>
                <span>
                  Presupuesto Total: <strong>${presupuestoTotalAsignado.toLocaleString('es-CO')}</strong>
                </span>
              </div>
              <div className="mt-2">
                Presupuesto Restante: 
                <span className={`fw-bold ${presupuestoRestante < 0 ? 'text-danger' : 'text-success'}`}>
                  ${presupuestoRestante.toLocaleString('es-CO')}
                </span>
              </div>
            </Card.Footer>
          )}
        </Card>
      </Col>

      {/* Modal para crear nuevo periodo */}
      <CrearPeriodoModal 
        show={showCrearPeriodo}
        nuevoPeriodo={nuevoPeriodo}
        onHide={() => setShowCrearPeriodo(false)}
        onChange={handleChangePeriodo}
        onSave={handleGuardarPeriodo}
      />
    </Row>
  );
};
