import React from 'react';
import { Modal, Table, Badge, Alert } from 'react-bootstrap';
import { ResumenPoas } from '../interfaces/project';
import '../styles/ResumenPoasModal.css';

interface ResumenPoasModalProps {
  show: boolean;
  onHide: () => void;
  resumen: ResumenPoas | null;
}

const ResumenPoasModal: React.FC<ResumenPoasModalProps> = ({ show, onHide, resumen }) => {
  if (!resumen) return null;

  const formatearMoneda = (valor: number): string => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  };

  const calcularPorcentajeEjecucion = (gastado: number, asignado: number): number => {
    if (asignado === 0) return 0;
    return (gastado / asignado) * 100;
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered className="resumen-poas-modal">
      <Modal.Header closeButton className="bg-info text-white">
        <Modal.Title>
          <i className="bi bi-bar-chart-fill me-2"></i>
          Resumen de POAs - {resumen.titulo}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="resumen-poas-body">
        {/* Header del resumen con información del proyecto */}
        <div className="resumen-header mb-4">
          <div className="row align-items-center">
            <div className="col-md-6">
              <h6 className="mb-1">
                <strong>Código Proyecto:</strong> <Badge bg="secondary">{resumen.codigo_proyecto}</Badge>
              </h6>
              <p className="text-muted mb-0">Total de POAs: {resumen.poas.length}</p>
            </div>
            <div className="col-md-6 text-end">
              <h5 className="mb-0">
                <strong>Total Proyecto:</strong>{' '}
                <span className="text-primary fw-bold">{formatearMoneda(resumen.total_proyecto)}</span>
              </h5>
            </div>
          </div>
        </div>

        {/* Mensaje si no hay POAs */}
        {resumen.poas.length === 0 ? (
          <Alert variant="info" className="text-center">
            <i className="bi bi-info-circle me-2"></i>
            Este proyecto no tiene POAs asignados
          </Alert>
        ) : (
          /* Desglose por POA */
          resumen.poas.map((poa, idx) => {
            const porcentajeEjecucion = calcularPorcentajeEjecucion(poa.total_gastado, poa.presupuesto_asignado);

            return (
              <div key={poa.id_poa} className={`poa-section mb-4 ${idx !== resumen.poas.length - 1 ? 'border-bottom pb-4' : ''}`}>
                {/* Header del POA */}
                <div className="poa-header bg-light p-3 rounded mb-3">
                  <div className="row align-items-center">
                    <div className="col-md-4">
                      <h5 className="mb-0">
                        <Badge bg="primary">POA {poa.anio_poa}</Badge>
                      </h5>
                      <small className="text-muted">Código: {poa.codigo_poa}</small>
                    </div>
                    <div className="col-md-8">
                      <div className="row text-center">
                        <div className="col-4">
                          <small className="text-muted d-block">Presupuesto Asignado</small>
                          <strong>{formatearMoneda(poa.presupuesto_asignado)}</strong>
                        </div>
                        <div className="col-4">
                          <small className="text-muted d-block">Total Gastado</small>
                          <strong className="text-danger">{formatearMoneda(poa.total_gastado)}</strong>
                          <br />
                          <small className="text-muted">({porcentajeEjecucion.toFixed(1)}%)</small>
                        </div>
                        <div className="col-4">
                          <small className="text-muted d-block">Saldo Disponible</small>
                          <strong className={poa.saldo_disponible >= 0 ? 'text-success' : 'text-danger'}>
                            {formatearMoneda(poa.saldo_disponible)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabla de actividades */}
                {poa.actividades.length === 0 ? (
                  <Alert variant="warning" className="text-center mb-0">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Este POA no tiene actividades asignadas
                  </Alert>
                ) : (
                  <Table striped bordered hover size="sm" className="tabla-actividades">
                    <thead className="table-secondary">
                      <tr>
                        <th style={{ width: '8%' }} className="text-center">#</th>
                        <th style={{ width: '62%' }}>Actividad</th>
                        <th style={{ width: '15%' }} className="text-end">Total</th>
                        <th style={{ width: '15%' }} className="text-end">% del POA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {poa.actividades.map((actividad, actIdx) => {
                        const porcentajeActividad = poa.presupuesto_asignado > 0
                          ? (actividad.total_actividad / poa.presupuesto_asignado) * 100
                          : 0;

                        return (
                          <tr key={actIdx}>
                            <td className="text-center">
                              <Badge bg="secondary">{actividad.numero_actividad || actIdx + 1}</Badge>
                            </td>
                            <td>{actividad.descripcion_actividad}</td>
                            <td className="text-end fw-bold">{formatearMoneda(actividad.total_actividad)}</td>
                            <td className="text-end text-muted">{porcentajeActividad.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                      {/* Fila de total del POA */}
                      <tr className="table-info fw-bold">
                        <td colSpan={2} className="text-end">
                          <strong>Total POA {poa.anio_poa}:</strong>
                        </td>
                        <td className="text-end">{formatearMoneda(poa.total_gastado)}</td>
                        <td className="text-end">{porcentajeEjecucion.toFixed(1)}%</td>
                      </tr>
                    </tbody>
                  </Table>
                )}
              </div>
            );
          })
        )}

        {/* Footer con total general */}
        {resumen.poas.length > 0 && (
          <div className="resumen-footer bg-primary text-white p-3 rounded mt-4">
            <div className="row align-items-center">
              <div className="col-md-8">
                <h5 className="mb-0">
                  <i className="bi bi-calculator me-2"></i>
                  Total General del Proyecto
                </h5>
              </div>
              <div className="col-md-4 text-end">
                <h4 className="mb-0 fw-bold">{formatearMoneda(resumen.total_proyecto)}</h4>
              </div>
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ResumenPoasModal;
