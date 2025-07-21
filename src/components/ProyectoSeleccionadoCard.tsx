import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { Proyecto } from '../interfaces/project';
import { Periodo } from '../interfaces/periodo';

// Definir la interfaz para las props
interface ProyectoSeleccionadoCardProps {
  proyectoSeleccionado: Proyecto;
  periodosCalculados: Periodo[];
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
  periodosCalculados 
}) => {
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
              </Col>
              <Col md={6}>
                <p><strong>Fecha Fin:</strong> {proyectoSeleccionado.fecha_fin}</p>
                <p><strong>Presupuesto Aprobado:</strong> ${parseFloat(proyectoSeleccionado.presupuesto_aprobado.toString()).toLocaleString('es-CO')}</p>
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