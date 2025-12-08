import React, { useEffect, useState } from 'react';
import { Table, Button, Alert, Spinner } from 'react-bootstrap';
import { DollarSign, Edit, AlertTriangle } from 'lucide-react';
import { DetalleTareaPrecio } from '../interfaces/tarea';
import { tareaAPI } from '../api/tareaAPI';
import EditarPrecioModal from '../components/EditarPrecioModal';
import '../styles/GestionPrecios.css';

/**
 * Componente de gestión de precios predefinidos
 *
 * Objetivo:
 *   Permitir a administradores visualizar y editar los 4 precios predefinidos de
 *   servicios profesionales (Asistente de investigación, Servicios profesionales 1/2/3).
 *
 * Funcionalidades:
 *   - Listar los 4 servicios profesionales con sus precios actuales
 *   - Editar precio individual mediante modal
 *   - Validar rango de precios ($100 - $5,000)
 *   - Mostrar advertencia sobre impacto en tareas existentes
 *   - Manejo de estados de carga y error
 *
 * Permisos:
 *   - Solo accesible para usuarios con rol ADMINISTRADOR
 *   - Verificación en frontend (RoleProtectedRoute) y backend (endpoint)
 *
 * Estados:
 *   - detalles: DetalleTareaPrecio[] — Array con los 4 servicios
 *   - loading: boolean — Estado de carga inicial
 *   - error: string | null — Mensaje de error
 *   - detalleSeleccionado: DetalleTareaPrecio | null — Detalle en edición
 *   - showModal: boolean — Visibilidad del modal
 *   - successMessage: string | null — Mensaje de éxito tras actualización
 */
const GestionPrecios: React.FC = () => {
    const [detalles, setDetalles] = useState<DetalleTareaPrecio[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [detalleSeleccionado, setDetalleSeleccionado] = useState<DetalleTareaPrecio | null>(null);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    /**
     * Cargar detalles con precios predefinidos al montar componente
     */
    useEffect(() => {
        console.log('🔵 [GestionPrecios] Componente montado, ejecutando useEffect inicial');
        cargarDetallesConPrecios();
    }, []);

    /**
     * Obtener lista de servicios profesionales con precios predefinidos
     */
    const cargarDetallesConPrecios = async () => {
        console.log('🔵 [GestionPrecios] Iniciando carga de detalles con precios...');
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            console.log('🔵 [GestionPrecios] Llamando a tareaAPI.getDetallesConPrecios()...');
            const data = await tareaAPI.getDetallesConPrecios();
            console.log('✅ [GestionPrecios] Respuesta recibida:', data);
            console.log(`✅ [GestionPrecios] Total de detalles recibidos: ${data?.length || 0}`);

            if (data && data.length > 0) {
                console.log('📋 [GestionPrecios] Primer detalle:', data[0]);
                console.log('📋 [GestionPrecios] Campos del primer detalle:', Object.keys(data[0]));
                data.forEach((detalle, index) => {
                    console.log(`📋 [GestionPrecios] Detalle ${index + 1}:`, {
                        id: detalle.id_detalle_tarea,
                        descripcion: detalle.descripcion,
                        nombre: detalle.nombre,
                        precio_unitario: detalle.precio_unitario,
                        item_presupuestario: detalle.item_presupuestario
                    });
                });
            } else {
                console.warn('⚠️ [GestionPrecios] No se recibieron detalles (array vacío)');
            }

            setDetalles(data);
        } catch (err: any) {
            console.error('❌ [GestionPrecios] Error al cargar precios:', err);
            console.error('❌ [GestionPrecios] Tipo de error:', typeof err);
            console.error('❌ [GestionPrecios] Error completo:', JSON.stringify(err, null, 2));
            if (err.response) {
                console.error('❌ [GestionPrecios] Response status:', err.response.status);
                console.error('❌ [GestionPrecios] Response data:', err.response.data);
            }
            setError(err.message || 'Error al cargar los precios predefinidos');
        } finally {
            setLoading(false);
            console.log('🔵 [GestionPrecios] Carga finalizada (loading = false)');
        }
    };

    /**
     * Abrir modal de edición con el detalle seleccionado
     */
    const handleEditarClick = (detalle: DetalleTareaPrecio) => {
        setDetalleSeleccionado(detalle);
        setShowModal(true);
        setSuccessMessage(null); // Limpiar mensaje de éxito al abrir modal
    };

    /**
     * Cerrar modal de edición
     */
    const handleCerrarModal = () => {
        setShowModal(false);
        setDetalleSeleccionado(null);
    };

    /**
     * Guardar nuevo precio
     * Actualiza el precio en backend y recarga la lista
     */
    const handleGuardarPrecio = async (idDetalleTarea: string, nuevoPrecio: number) => {
        try {
            await tareaAPI.updatePrecioDetalleTarea(idDetalleTarea, nuevoPrecio);

            // Recargar lista para mostrar cambios
            await cargarDetallesConPrecios();

            // Mostrar mensaje de éxito
            const detalleActualizado = detalles.find(d => d.id_detalle_tarea === idDetalleTarea);
            const nombreServicio = detalleActualizado?.descripcion || detalleActualizado?.nombre || 'Servicio';
            setSuccessMessage(`Precio de "${nombreServicio}" actualizado exitosamente a ${formatearPrecio(nuevoPrecio)}`);

            // Ocultar mensaje después de 5 segundos
            setTimeout(() => {
                setSuccessMessage(null);
            }, 5000);
        } catch (err: any) {
            // El error se maneja en el modal
            throw err;
        }
    };

    /**
     * Formatear precio con símbolo $ y 2 decimales
     */
    const formatearPrecio = (valor: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(valor);
    };

    // Log del estado actual en cada render
    console.log('🎨 [GestionPrecios] RENDER:', {
        loading,
        detallesCount: detalles.length,
        error,
        successMessage,
        tieneDetalles: detalles.length > 0
    });

    return (
        <div className="gestion-precios-wrapper">
            {/* Encabezado */}
            <div className="gestion-precios-header">
                <div className="d-flex align-items-center">
                    <DollarSign size={32} className="me-3 text-success" />
                    <h1 className="gestion-precios-title mb-0">Gestión de Precios Predefinidos</h1>
                </div>
                <p className="text-muted mt-2">
                    Administre los precios de los servicios profesionales del sistema
                </p>
            </div>

            {/* Advertencia sobre impacto */}
            <Alert variant="warning" className="d-flex align-items-start">
                <AlertTriangle size={20} className="me-2 mt-1 flex-shrink-0" />
                <div>
                    <strong>Importante:</strong> Los cambios de precios solo afectan a tareas creadas
                    <strong> después</strong> de la modificación. Las tareas existentes mantendrán
                    sus precios originales.
                </div>
            </Alert>

            {/* Mensaje de éxito */}
            {successMessage && (
                <Alert variant="success" dismissible onClose={() => setSuccessMessage(null)}>
                    {successMessage}
                </Alert>
            )}

            {/* Mensaje de error */}
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Estado de carga */}
            {loading && (
                <div className="loading-container text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Cargando precios predefinidos...</p>
                </div>
            )}

            {/* Tabla de precios */}
            {!loading && !error && (
                <div className="gestion-precios-table-container">
                    {(() => {
                        console.log('📊 [GestionPrecios] Renderizando sección tabla');
                        console.log('📊 [GestionPrecios] detalles.length:', detalles.length);
                        console.log('📊 [GestionPrecios] detalles:', detalles);
                        return null;
                    })()}
                    {detalles.length === 0 ? (
                        <>
                            {console.log('⚠️ [GestionPrecios] Mostrando mensaje: No hay servicios')}
                            <Alert variant="info">
                                No se encontraron servicios profesionales con precios predefinidos.
                            </Alert>
                        </>
                    ) : (
                        <>
                            {console.log('✅ [GestionPrecios] Renderizando tabla con', detalles.length, 'filas')}
                            <Table bordered hover responsive className="gestion-precios-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '15%' }}>Código Item</th>
                                        <th style={{ width: '30%' }}>Item Presupuestario</th>
                                        <th style={{ width: '30%' }}>Descripción Servicio</th>
                                        <th style={{ width: '15%' }} className="text-end">Precio Unitario</th>
                                        <th style={{ width: '10%' }} className="text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detalles.map((detalle, index) => {
                                        console.log(`🔢 [GestionPrecios] Renderizando fila ${index + 1}:`, {
                                            id: detalle.id_detalle_tarea,
                                            codigo: detalle.item_presupuestario?.codigo,
                                            nombre: detalle.item_presupuestario?.nombre || detalle.nombre,
                                            descripcion: detalle.descripcion,
                                            precio: detalle.precio_unitario
                                        });
                                        return (
                                            <tr key={detalle.id_detalle_tarea}>
                                                <td>
                                                    {detalle.item_presupuestario?.codigo || 'N/A'}
                                                </td>
                                                <td>
                                                    {detalle.item_presupuestario?.nombre || detalle.nombre}
                                                </td>
                                                <td>
                                                    {detalle.descripcion || 'Sin descripción'}
                                                </td>
                                                <td className="text-end precio-cell">
                                                    {detalle.precio_unitario !== null
                                                        ? formatearPrecio(detalle.precio_unitario)
                                                        : <span className="text-muted">No definido</span>
                                                    }
                                                </td>
                                                <td className="text-center">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => handleEditarClick(detalle)}
                                                        className="btn-editar"
                                                    >
                                                        <Edit size={16} className="me-1" />
                                                        Editar
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </>
                    )}
                </div>
            )}

            {/* Modal de edición */}
            <EditarPrecioModal
                show={showModal}
                detalle={detalleSeleccionado}
                onHide={handleCerrarModal}
                onSave={handleGuardarPrecio}
            />
        </div>
    );
};

export default GestionPrecios;
