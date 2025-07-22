import React from 'react';
import { Row, Col, Card, ListGroup } from 'react-bootstrap';

interface POAExtendido {
  id_poa: string;
  codigo_poa: string;
  anio_ejecucion: number | string;
  presupuesto_asignado: number;
  tipo_poa?: string;
  periodo?: {
    nombre_periodo: string;
  };
}

interface InformacionPOAsProps {
  poas: POAExtendido[];
}

/**
 * Componente InformacionPOAs
 * Objetivo:
 * - Proporcionar una vista clara y segura para el usuario sobre los POAs del proyecto,
 *   mostrando la información esencial sin exponer datos sensibles ni permitir modificaciones.
 * 
 * Parámetros:
 * - poas: POAExtendido[] - Lista de objetos POA extendidos que contienen información
 *   detallada de cada POA del proyecto.
 * 
 * Operación:
 * - Renderiza una lista visual de los POAs con detalles clave como código, año de ejecución,
 *   tipo, presupuesto asignado y periodo (si está disponible).
 * - Utiliza componentes de Bootstrap para estructura y estilo responsivo.
 * 
 */
const InformacionPOAs: React.FC<InformacionPOAsProps> = ({ poas }) => {
  return (
    <Row className="mb-4">
      <Col md={12}>
        <Card>
          <Card.Header className="bg-light">
            <h5 className="mb-0">POAs del Proyecto</h5>
          </Card.Header>
          <Card.Body>
            <ListGroup>
              {poas.map((poa) => (
                <ListGroup.Item key={poa.id_poa} className="mb-2">
                  <Row>
                    <Col md={6}>
                      <p className="mb-1"><strong>Código POA:</strong> {poa.codigo_poa}</p>
                      <p className="mb-1"><strong>Año Ejecución:</strong> {poa.anio_ejecucion}</p>
                      <p className="mb-1"><strong>Tipo:</strong> {poa.tipo_poa || 'No especificado'}</p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-1"><strong>Presupuesto Asignado:</strong> ${parseFloat(poa.presupuesto_asignado.toString()).toLocaleString('es-CO')}</p>
                      {poa.periodo && <p className="mb-1"><strong>Periodo:</strong> {poa.periodo.nombre_periodo}</p>}
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default InformacionPOAs;
