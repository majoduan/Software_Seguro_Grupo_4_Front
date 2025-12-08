import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { DetalleTareaPrecio } from '../interfaces/tarea';

interface EditarPrecioModalProps {
    show: boolean;
    detalle: DetalleTareaPrecio | null;
    onHide: () => void;
    onSave: (id: string, nuevoPrecio: number) => Promise<void>;
}

/**
 * Modal para editar precios predefinidos de servicios profesionales
 *
 * Objetivo:
 *   Proporcionar una interfaz modal para que administradores actualicen los precios
 *   predefinidos de los 4 servicios profesionales. Incluye validación en tiempo real
 *   y confirmación antes de guardar.
 *
 * Props:
 *   - show: boolean — Controla la visibilidad del modal
 *   - detalle: DetalleTareaPrecio | null — Detalle de tarea a editar
 *   - onHide: () => void — Callback para cerrar el modal
 *   - onSave: (id, precio) => Promise<void> — Callback para guardar el nuevo precio
 *
 * Validaciones:
 *   - Precio debe ser número válido
 *   - Rango: $100 - $5,000
 *   - Formato: 2 decimales
 *   - No permite valores negativos o cero
 *
 * Estados:
 *   - precio: string — Valor del input (string para control de decimales)
 *   - error: string | null — Mensaje de error de validación
 *   - loading: boolean — Estado de guardado
 *   - showConfirm: boolean — Muestra diálogo de confirmación
 */
const EditarPrecioModal: React.FC<EditarPrecioModalProps> = ({
    show,
    detalle,
    onHide,
    onSave
}) => {
    const [precio, setPrecio] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [showConfirm, setShowConfirm] = useState<boolean>(false);

    /**
     * Convertir precio_unitario a número
     * El backend puede enviar Decimal como string o number
     */
    const normalizarPrecio = (precio: number | string | null): number | null => {
        if (precio === null) return null;
        return typeof precio === 'string' ? parseFloat(precio) : precio;
    };

    // Cargar precio actual cuando se abre el modal
    useEffect(() => {
        if (detalle && detalle.precio_unitario !== null) {
            const precioNumerico = normalizarPrecio(detalle.precio_unitario);
            if (precioNumerico !== null) {
                setPrecio(precioNumerico.toFixed(2));
                setError(null);
            }
        } else {
            setPrecio('');
        }
        setShowConfirm(false);
    }, [detalle, show]);

    /**
     * Validar precio ingresado
     *
     * Reglas:
     *   - No puede estar vacío
     *   - Debe ser número válido
     *   - Debe ser mayor a $100
     *   - Debe ser menor a $5,000
     *   - Máximo 2 decimales
     */
    const validarPrecio = (valor: string): string | null => {
        if (!valor || valor.trim() === '') {
            return 'El precio es requerido';
        }

        const precioNumerico = parseFloat(valor);

        if (isNaN(precioNumerico)) {
            return 'Debe ingresar un precio válido';
        }

        if (precioNumerico <= 100) {
            return 'El precio debe ser mayor a $100';
        }

        if (precioNumerico >= 5000) {
            return 'El precio debe ser menor a $5,000';
        }

        // Validar máximo 2 decimales
        const partes = valor.split('.');
        if (partes.length === 2 && partes[1].length > 2) {
            return 'El precio puede tener máximo 2 decimales';
        }

        return null;
    };

    /**
     * Manejar cambio en el input de precio
     * Valida en tiempo real y muestra errores
     */
    const handlePrecioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valor = e.target.value;
        setPrecio(valor);

        // Validar solo si hay contenido
        if (valor.trim() !== '') {
            const errorValidacion = validarPrecio(valor);
            setError(errorValidacion);
        } else {
            setError(null);
        }
    };

    /**
     * Manejar clic en botón Guardar
     * Muestra diálogo de confirmación
     */
    const handleGuardarClick = () => {
        const errorValidacion = validarPrecio(precio);

        if (errorValidacion) {
            setError(errorValidacion);
            return;
        }

        setShowConfirm(true);
    };

    /**
     * Confirmar y guardar el nuevo precio
     * Ejecuta callback onSave y cierra modal
     */
    const handleConfirmarGuardado = async () => {
        if (!detalle) return;

        setLoading(true);
        setError(null);

        try {
            const precioNumerico = parseFloat(precio);
            await onSave(detalle.id_detalle_tarea, precioNumerico);
            setShowConfirm(false);
            onHide(); // Cerrar modal después de guardar
        } catch (err: any) {
            setError(err.message || 'Error al actualizar el precio');
            setShowConfirm(false);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Cancelar confirmación
     */
    const handleCancelarConfirmacion = () => {
        setShowConfirm(false);
    };

    /**
     * Cerrar modal sin guardar
     * Resetea estado
     */
    const handleCerrar = () => {
        if (!loading) {
            setPrecio('');
            setError(null);
            setShowConfirm(false);
            onHide();
        }
    };

    // Formatear precio para mostrar con símbolo $
    const formatearPrecio = (valor: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(valor);
    };

    return (
        <>
            {/* Modal principal de edición */}
            <Modal show={show && !showConfirm} onHide={handleCerrar} centered>
                <Modal.Header closeButton={!loading}>
                    <Modal.Title>Editar Precio Predefinido</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {detalle && (
                        <>
                            {/* Información del servicio (readonly) */}
                            <div className="mb-3">
                                <Form.Label className="fw-bold">Servicio Profesional:</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={detalle.descripcion || detalle.nombre}
                                    readOnly
                                    disabled
                                    className="bg-light"
                                />
                            </div>

                            {/* Información del item presupuestario (readonly) */}
                            {detalle.item_presupuestario && (
                                <div className="mb-3">
                                    <Form.Label className="fw-bold">Item Presupuestario:</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={`${detalle.item_presupuestario.codigo} - ${detalle.item_presupuestario.nombre}`}
                                        readOnly
                                        disabled
                                        className="bg-light"
                                    />
                                </div>
                            )}

                            {/* Precio actual (solo informativo) */}
                            {detalle.precio_unitario !== null && (
                                <div className="mb-3">
                                    <Form.Label className="fw-bold">Precio Actual:</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formatearPrecio(normalizarPrecio(detalle.precio_unitario) || 0)}
                                        readOnly
                                        disabled
                                        className="bg-light"
                                    />
                                </div>
                            )}

                            {/* Input de nuevo precio */}
                            <div className="mb-3">
                                <Form.Label className="fw-bold">
                                    Nuevo Precio Unitario: <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min="100.01"
                                    max="4999.99"
                                    value={precio}
                                    onChange={handlePrecioChange}
                                    isInvalid={!!error}
                                    placeholder="Ej: 1250.00"
                                    disabled={loading}
                                    style={{ textAlign: 'right' }}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {error}
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                    Rango permitido: $100.01 - $4,999.99
                                </Form.Text>
                            </div>

                            {/* Advertencia sobre impacto */}
                            <Alert variant="warning" className="mt-3">
                                <Alert.Heading className="h6">⚠️ Importante:</Alert.Heading>
                                <p className="mb-0 small">
                                    Los cambios de precio <strong>solo afectan a tareas nuevas</strong> creadas
                                    después de esta modificación. Las tareas existentes mantendrán su precio original.
                                </p>
                            </Alert>
                        </>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={handleCerrar}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleGuardarClick}
                        disabled={loading || !!error || precio.trim() === ''}
                    >
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de confirmación */}
            <Modal show={showConfirm} onHide={handleCancelarConfirmacion} centered size="sm">
                <Modal.Header closeButton={!loading}>
                    <Modal.Title>Confirmar Cambio</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>¿Está seguro que desea actualizar el precio?</p>
                    {detalle && (
                        <div className="bg-light p-3 rounded">
                            <p className="mb-1">
                                <strong>Servicio:</strong> {detalle.descripcion || detalle.nombre}
                            </p>
                            <p className="mb-1">
                                <strong>Precio actual:</strong> {detalle.precio_unitario !== null
                                    ? formatearPrecio(normalizarPrecio(detalle.precio_unitario) || 0)
                                    : 'N/A'}
                            </p>
                            <p className="mb-0">
                                <strong>Nuevo precio:</strong> {formatearPrecio(parseFloat(precio))}
                            </p>
                        </div>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={handleCancelarConfirmacion}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="success"
                        onClick={handleConfirmarGuardado}
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : 'Sí, Actualizar'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default EditarPrecioModal;
