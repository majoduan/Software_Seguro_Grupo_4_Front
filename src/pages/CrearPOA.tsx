import React from 'react';
import { Form, Button, Container, Card, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { usePOAForm } from '../hooks/usePOAForm';
import { POAFormHeader } from '../components/POAFormHeader';
import { PeriodoSelector } from '../components/PeriodoSelector';
import { PeriodoConfigurator } from '../components/PeriodoConfigurator';
import ProyectoSeleccionadoCard from '../components/ProyectoSeleccionadoCard';
import BusquedaProyecto from '../components/BusquedaProyecto';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/NuevoPOA.css';

/**
 * Objetivo: Renderizar el formulario para crear un Plan Operativo Anual (POA),
 * incluyendo la selección y validación del proyecto, configuración de periodos
 * y manejo de presupuestos asociados.
 * 
 * Parámetros: No recibe props; usa hooks internos para manejar estado y navegación.
 * 
 * Operación: Utiliza el hook personalizado `usePOAForm` para lógica de negocio,
 * maneja el envío del formulario con validación y redirige tras éxito.
 * Controla que sólo se pueda enviar si un proyecto válido y periodos seleccionados existen.
 * Maneja estados de carga para evitar envíos repetidos.
 * Centraliza validaciones en el hook para sanitizar y validar datos antes de enviar.
 */

const CrearPOA: React.FC = () => {
  const navigate = useNavigate();
  
  // Initialize our custom hook
  const form = usePOAForm({ isEditing: false });

  // Submit form handler that performs navigation after successful submission
  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const success = await form.handleSubmit();
    if (success) {
      navigate('/agregar-actividad');
    }
  };

  return (
    <Container className="py-4">
      <Card className="shadow-lg">
        <POAFormHeader 
          error={form.error} 
          isEditing={false}
        />
        <Card.Body className="p-4">
          <Form onSubmit={onSubmit}>
            {/* Sección de Proyecto */}
            <BusquedaProyecto 
              proyectos={form.proyectos}
              isLoading={form.isLoading}
              seleccionarProyecto={form.seleccionarProyecto}
              validarProyecto={form.validarDisponibilidadProyecto}
              mostrarValidacion={true}
              modoEdicion={false}
            />
            
            {/* Información sobre el proyecto seleccionado */}
            {form.proyectoSeleccionado && (
              <ProyectoSeleccionadoCard 
                proyectoSeleccionado={form.proyectoSeleccionado} 
                periodosCalculados={form.periodosCalculados} 
              />
            )}
            
            {/* Sección de Selección de Periodos */}
            {form.proyectoSeleccionado && (
              <PeriodoSelector
                periodosCalculados={form.periodosCalculados}
                periodosSeleccionados={form.periodosSeleccionados}
                seleccionarPeriodo={form.seleccionarPeriodo}
                quitarPeriodo={form.quitarPeriodo}
                showCrearPeriodo={form.showCrearPeriodo}
                setShowCrearPeriodo={form.setShowCrearPeriodo}
                nuevoPeriodo={form.nuevoPeriodo}
                handleChangePeriodo={form.handleChangePeriodo}
                handleGuardarPeriodo={form.handleGuardarPeriodo}
                handleAbrirModalPeriodo={form.handleAbrirModalPeriodo}
                presupuestoTotalAsignado={form.presupuestoTotalAsignado}
                presupuestoRestante={form.presupuestoRestante}
                isEditing={false}
              />
            )}
              
            {/* Sección de Configuración de POA */}
            {form.proyectoSeleccionado && form.periodosSeleccionados.length > 0 && (
              <PeriodoConfigurator
                periodosSeleccionados={form.periodosSeleccionados}
                periodoActual={form.periodoActual}
                setPeriodoActual={form.setPeriodoActual}
                presupuestoPorPeriodo={form.presupuestoPorPeriodo}
                codigoPorPeriodo={form.codigoPorPeriodo}
                anioPorPeriodo={form.anioPorPeriodo}
                anioPorPeriodoError={form.anioPorPeriodoError}
                setCodigoPorPeriodo={form.setCodigoPorPeriodo}
                setAnioPorPeriodo={form.setAnioPorPeriodo}
                handlePresupuestoChange={form.handlePresupuestoChange}
                presupuestoError={form.presupuestoError}
              />
            )}
              
            {/* Botones de acción */}
            <Row>
              <Col md={12} className="d-flex justify-content-end gap-2">
                <Button variant="secondary" type="button" href="/dashboard">
                  Cancelar
                </Button>
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={form.isLoading || !form.proyectoSeleccionado || form.periodosSeleccionados.length === 0}
                >
                  {form.isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Guardando...
                    </>
                  ) : 'Crear POAs'}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};
  
  export default CrearPOA;