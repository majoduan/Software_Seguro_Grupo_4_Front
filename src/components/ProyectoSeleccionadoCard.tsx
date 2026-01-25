import React from 'react';
import { Row, Col, Card, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Proyecto, Departamento } from '../interfaces/project';
import { Periodo } from '../interfaces/periodo';

// Definir la interfaz para las props
interface ProyectoSeleccionadoCardProps {
  proyectoSeleccionado: Proyecto;
  periodosCalculados: Periodo[];
  departamentos?: Departamento[];
}

/**
 * Componente ProyectoSeleccionadoCard
 * Objetivo:
 * - Presentar datos del proyecto de manera clara y legible sin exponerlos a manipulaciones indebidas
 * 
 * Parámetros:
 * - proyectoSeleccionado: Proyecto – Objeto que contiene los datos del proyecto a visualizar.
 * - periodosCalculados: Periodo[] – Lista de periodos derivados del proyecto.
 * 
 * Operación:
 * - Se accede y muestra información sensible del proyecto como código, título, fechas y presupuesto.
 * - Se convierte el presupuesto a string y se formatea usando `toLocaleString`, lo que implica 
 * transformación de datos antes de renderizar.
 */

const ProyectoSeleccionadoCard: React.FC<ProyectoSeleccionadoCardProps> = ({
  proyectoSeleccionado,
  periodosCalculados,
  departamentos = []
}) => {
  // Obtener el nombre del departamento
  const departamento = departamentos.find(d => d.id_departamento === proyectoSeleccionado.id_departamento);
  const nombreDepartamento = departamento?.nombre || 'No asignado';

  return (
    <Row className="mb-4">
      <Col md={12}>
        <Card className="bg-light">
          <Card.Body>
            <h5 className="mb-3">Información del Proyecto Seleccionado</h5>
            <Row>
              <Col md={6}>
                <p><strong>Código:</strong> {proyectoSeleccionado.codigo_proyecto}</p>
                <p><strong>Título:</strong> {proyectoSeleccionado.titulo}</p>
                <p><strong>Fecha Inicio:</strong> {proyectoSeleccionado.fecha_inicio}</p>
                <p><strong>Departamento:</strong> {nombreDepartamento}</p>
              </Col>
              <Col md={6}>
                <p><strong>Fecha Fin:</strong> {proyectoSeleccionado.fecha_fin}</p>
                <p className="d-flex align-items-center">
                  <strong>Presupuesto Total del Proyecto:</strong>
                  <span className="ms-1">${parseFloat(proyectoSeleccionado.presupuesto_aprobado.toString()).toLocaleString('es-CO')}</span>
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip id="tooltip-presupuesto-proyecto">
                        Monto total aprobado para el proyecto. Los POAs deben asignarse dentro de este límite.
                      </Tooltip>
                    }
                  >
                    <i className="bi bi-info-circle ms-2 text-primary" style={{ cursor: 'pointer' }}></i>
                  </OverlayTrigger>
                </p>
                <p><strong>Periodos Calculados:</strong> {periodosCalculados.length}</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default ProyectoSeleccionadoCard;