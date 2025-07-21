import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { Proyecto } from '../interfaces/project';

interface InformacionProyectoProps {
  proyecto: Proyecto;
  cantidadPoas: number;
}

/**
 * Componente InformacionProyecto
 * Objetivo:
 * - Brindar una visualización clara y segura al usuario de los datos relevantes del proyecto,
 *   sin exponer información sensible ni permitir modificaciones.
 * 
 * Parámetros:
 * - proyecto: Proyecto - Objeto que contiene la información detallada del proyecto seleccionado.
 * - cantidadPoas: number - Número total de POAs asociados al proyecto.
 * 
 * Operación:
 * - Muestra la información principal del proyecto, como código, título, fechas de inicio y fin,
 *   presupuesto aprobado y cantidad de POAs vinculados.
 * 
 */
const InformacionProyecto: React.FC<InformacionProyectoProps> = ({ proyecto, cantidadPoas }) => {
  return (
    <Row className="mb-4">
      <Col md={12}>
        <Card className="bg-light">
          <Card.Body>
            <h5 className="mb-3">Información del Proyecto Seleccionado</h5>
            <Row>
              <Col md={6}>
                <p><strong>Código:</strong> {proyecto.codigo_proyecto}</p>
                <p><strong>Título:</strong> {proyecto.titulo}</p>
                <p><strong>Fecha Inicio:</strong> {proyecto.fecha_inicio}</p>
              </Col>
              <Col md={6}>
                <p><strong>Fecha Fin:</strong> {proyecto.fecha_fin}</p>
                <p><strong>Presupuesto Aprobado:</strong> ${parseFloat(proyecto.presupuesto_aprobado.toString()).toLocaleString('es-CO')}</p>
                <p><strong>POAs Asociados:</strong> {cantidadPoas}</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default InformacionProyecto;
