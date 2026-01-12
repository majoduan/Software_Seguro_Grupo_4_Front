import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

interface JustificacionModalProps {
    show: boolean;
    onHide: () => void;
    onConfirm: (justificacion: string) => void;
    title?: string;
    isLoading?: boolean;
}

/**
 * Modal para solicitar justificación de cambios
 * 
 * Objetivo:
 *   Capturar la justificación del usuario antes de guardar cambios en proyectos o POAs,
 *   garantizando trazabilidad completa en el sistema de auditoría.
 * 
 * Parámetros:
 *   - show: Controla la visibilidad del modal
 *   - onHide: Función a ejecutar al cancelar
 *   - onConfirm: Función a ejecutar al confirmar (recibe la justificación)
 *   - title: Título personalizado del modal
 *   - isLoading: Estado de carga durante el guardado
 * 
 * Validaciones:
 *   - Justificación obligatoria (mínimo 10 caracteres)
 *   - Máximo 500 caracteres
 */
export const JustificacionModal: React.FC<JustificacionModalProps> = ({
    show,
    onHide,
    onConfirm,
    title = "Justificación de Cambios",
    isLoading = false
}) => {
    const [justificacion, setJustificacion] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = () => {
        // Validar longitud mínima
        if (justificacion.trim().length < 10) {
            setError('La justificación debe tener al menos 10 caracteres');
            return;
        }

        // Validar longitud máxima
        if (justificacion.length > 500) {
            setError('La justificación no puede exceder 500 caracteres');
            return;
        }

        // Confirmar y limpiar
        onConfirm(justificacion.trim());
        setJustificacion('');
        setError(null);
    };

    const handleCancel = () => {
        setJustificacion('');
        setError(null);
        onHide();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        // Permitir Ctrl+Enter para confirmar rápidamente
        if (e.key === 'Enter' && e.ctrlKey) {
            handleConfirm();
        }
    };

    return (
        <Modal
            show={show}
            onHide={handleCancel}
            centered
            backdrop="static"
            keyboard={false}
        >
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Form.Group>
                    <Form.Label>
                        Justificación <span style={{ color: 'red' }}>*</span>
                    </Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={4}
                        placeholder="Describa el motivo de los cambios realizados (mínimo 10 caracteres)"
                        value={justificacion}
                        onChange={(e) => {
                            setJustificacion(e.target.value);
                            setError(null);
                        }}
                        onKeyDown={handleKeyPress}
                        isInvalid={!!error}
                        maxLength={500}
                        autoFocus
                        disabled={isLoading}
                    />
                    <Form.Text className="text-muted">
                        {justificacion.length}/500 caracteres {justificacion.length >= 10 && '✓'}
                    </Form.Text>
                    {error && (
                        <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                            {error}
                        </Form.Control.Feedback>
                    )}
                </Form.Group>

                <div className="mt-2 text-muted small">
                    <strong>Tip:</strong> Presiona Ctrl+Enter para confirmar rápidamente
                </div>
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={handleCancel}
                    disabled={isLoading}
                >
                    Cancelar
                </Button>
                <Button
                    variant="primary"
                    onClick={handleConfirm}
                    disabled={isLoading || justificacion.trim().length < 10}
                >
                    {isLoading ? 'Guardando...' : 'Confirmar y Guardar'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};
