import React from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { Periodo } from '../interfaces/periodo';
import { sanitizeInput } from '../utils/sanitizer';

interface PeriodoModalProps {
  show: boolean;
  nuevoPeriodo: Partial<Periodo>;
  onHide: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
}

const CrearPeriodoModal: React.FC<PeriodoModalProps> = ({
  show,
  nuevoPeriodo,
  onHide,
  onChange,
  onSave
}) => {
  // Handler sanitizado para campos de texto
  /**
 * Objetivo:Prevenir inyecciones de código y asegurar que los datos ingresados por el usuario en los campos 
 * de texto sean seguros antes de enviarlos al backend.
 *
 * Parámetros:
 * React.ChangeEvent<HTMLInputElement> - Evento de cambio del campo de entrada, generado por el usuario.
 *
 * Operación:
 * - Utiliza la función `sanitizeInput` para limpiar el valor ingresado y eliminar cualquier carácter 
 *  potencialmente malicioso como etiquetas HTML o scripts.Elimina o escapa caracteres peligrosos como 
 * `<`, `>`, `"`, `'`, `&`, y otros usados en scripts.
 * - Se emplea antes de que el valor sea propagado al estado del componente o al backend.
 * - Protege al sistema de posibles vectores de ejecución de código malicioso en tiempo de ejecución o al renderizar HTML.
 * -Llama al callback `onChange` pasando este evento limpio, asegurando que el estado del formulario se actualice con datos validados.
 */

  const handleSanitizedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    
    // Crear evento sanitizado
    const sanitizedEvent = {
      ...e,
      target: {
        ...e.target,
        value: sanitizedValue
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(sanitizedEvent);
  };
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Crear Nuevo Periodo</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3" controlId="codigo_periodo">
          <Form.Label>Código del Periodo</Form.Label>
          <Form.Control
            type="text"
            name="codigo_periodo"
            value={nuevoPeriodo.codigo_periodo || ''}
            onChange={handleSanitizedChange}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="nombre_periodo">
          <Form.Label>Nombre del Periodo</Form.Label>
          <Form.Control
            type="text"
            name="nombre_periodo"
            value={nuevoPeriodo.nombre_periodo || ''}
            onChange={handleSanitizedChange}
            required
          />
        </Form.Group>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="fecha_inicio">
              <Form.Label>Fecha de Inicio</Form.Label>
              <Form.Control
                type="date"
                name="fecha_inicio"
                value={nuevoPeriodo.fecha_inicio || ''}
                onChange={onChange}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="fecha_fin">
              <Form.Label>Fecha de Fin</Form.Label>
              <Form.Control
                type="date"
                name="fecha_fin"
                value={nuevoPeriodo.fecha_fin || ''}
                onChange={onChange}
                required
              />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="anio">
              <Form.Label>Año</Form.Label>
              <Form.Control
                type="text"
                name="anio"
                value={nuevoPeriodo.anio || ''}
                onChange={onChange}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="mes">
              <Form.Label>Mes/es</Form.Label>
              <Form.Control
                type="text"
                name="mes"
                value={nuevoPeriodo.mes || ''}
                onChange={onChange}
                placeholder="Ej: Enero-Diciembre"
              />
            </Form.Group>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={onSave}>
          Guardar Periodo
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CrearPeriodoModal;