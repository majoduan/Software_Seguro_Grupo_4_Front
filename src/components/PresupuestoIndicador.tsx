import React from 'react';
import { Card, ProgressBar, Alert } from 'react-bootstrap';
import '../styles/PresupuestoIndicador.css';

interface PresupuestoIndicadorProps {
    titulo: string;
    presupuestoTotal: number;
    presupuestoUtilizado: number;
    presupuestoDisponible: number;
    porcentajeUtilizado: number;
    moneda?: string;
    mostrarDetalles?: boolean;
}

/**
 * Componente para mostrar indicadores visuales de presupuesto disponible
 *
 * Muestra:
 * - Presupuesto total asignado
 * - Presupuesto ya utilizado
 * - Presupuesto disponible
 * - Barra de progreso visual con código de colores
 *
 * Código de colores:
 * - Verde: < 70% utilizado (disponible)
 * - Amarillo: 70-90% utilizado (advertencia)
 * - Rojo: > 90% utilizado (crítico)
 */
const PresupuestoIndicador: React.FC<PresupuestoIndicadorProps> = ({
    titulo,
    presupuestoTotal,
    presupuestoUtilizado,
    presupuestoDisponible,
    porcentajeUtilizado,
    moneda = '$',
    mostrarDetalles = true
}) => {
    // Determinar el color de la barra según el porcentaje utilizado
    const getVariant = (): "success" | "warning" | "danger" => {
        if (porcentajeUtilizado < 70) return "success";
        if (porcentajeUtilizado < 90) return "warning";
        return "danger";
    };

    // Determinar el mensaje de estado
    const getMensajeEstado = (): { tipo: "success" | "warning" | "danger"; texto: string } => {
        if (porcentajeUtilizado < 70) {
            return {
                tipo: "success",
                texto: "Presupuesto disponible"
            };
        }
        if (porcentajeUtilizado < 90) {
            return {
                tipo: "warning",
                texto: "Advertencia: Presupuesto limitado"
            };
        }
        return {
            tipo: "danger",
            texto: "Crítico: Presupuesto casi agotado"
        };
    };

    const mensajeEstado = getMensajeEstado();

    return (
        <Card className="mb-3 presupuesto-indicador-card">
            <Card.Body>
                <Card.Title className="h6 mb-3">
                    <i className="bi bi-cash-stack me-2"></i>
                    {titulo}
                </Card.Title>

                {mostrarDetalles && (
                    <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small">Presupuesto Total:</span>
                            <span className="fw-bold">{moneda}{presupuestoTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small">Utilizado:</span>
                            <span className="text-secondary">{moneda}{presupuestoUtilizado.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted small">Disponible:</span>
                            <span className={`fw-bold ${presupuestoDisponible > 0 ? 'text-success' : 'text-danger'}`}>
                                {moneda}{presupuestoDisponible.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                )}

                <div className="mb-2">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small text-muted">Porcentaje utilizado</span>
                        <span className={`badge bg-${getVariant()}`}>
                            {porcentajeUtilizado.toFixed(1)}%
                        </span>
                    </div>
                    <ProgressBar
                        now={porcentajeUtilizado}
                        variant={getVariant()}
                        style={{ height: '20px' }}
                    />
                </div>

                {porcentajeUtilizado >= 70 && (
                    <Alert variant={mensajeEstado.tipo} className="mb-0 py-2 small">
                        <i className={`bi bi-${mensajeEstado.tipo === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2`}></i>
                        {mensajeEstado.texto}
                    </Alert>
                )}
            </Card.Body>
        </Card>
    );
};

export default PresupuestoIndicador;
