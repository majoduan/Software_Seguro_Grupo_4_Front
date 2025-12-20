import React, { useEffect, useState } from 'react';
import { Table, Button, Alert, Spinner, Modal, Form } from 'react-bootstrap';
import { Building2, Edit, Trash2, Plus, X, Check } from 'lucide-react';
import { Departamento, DepartamentoCreate, DepartamentoUpdate } from '../interfaces/project';
import { projectAPI } from '../api/projectAPI';
import '../styles/GestionDepartamentos.css';

/**
 * Componente de gestión de departamentos
 *
 * Objetivo:
 *   Permitir a administradores crear, editar y eliminar departamentos institucionales.
 *
 * Funcionalidades:
 *   - Listar todos los departamentos con nombre y descripción
 *   - Crear nuevo departamento mediante modal
 *   - Editar departamento existente mediante modal
 *   - Eliminar departamento con confirmación (valida proyectos asociados)
 *   - Validaciones frontend (nombre 3-100 chars, descripción max 500 chars)
 *
 * Permisos:
 *   - Solo accesible para usuarios con rol ADMINISTRADOR
 *   - Verificación en frontend (RoleProtectedRoute) y backend (endpoints)
 *
 * Estados:
 *   - departamentos: Departamento[] — Lista de departamentos
 *   - loading: boolean — Carga inicial
 *   - error: string | null — Mensaje de error
 *   - successMessage: string | null — Mensaje de éxito
 *   - showModal: boolean — Modal de crear/editar
 *   - showDeleteModal: boolean — Modal de confirmación de eliminación
 *   - modalMode: 'create' | 'edit' — Modo del modal
 *   - formData: DepartamentoCreate — Datos del formulario
 *   - departamentoSeleccionado: Departamento | null — Departamento en edición/eliminación
 */
const GestionDepartamentos: React.FC = () => {
    const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Estados del modal de crear/editar
    const [showModal, setShowModal] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState<DepartamentoCreate>({ nombre: '', descripcion: '' });
    const [formErrors, setFormErrors] = useState<{ nombre?: string; descripcion?: string }>({});
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Estados del modal de eliminación
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<Departamento | null>(null);
    const [deleting, setDeleting] = useState<boolean>(false);

    /**
     * Cargar departamentos al montar componente
     */
    useEffect(() => {
        cargarDepartamentos();
    }, []);

    /**
     * Auto-dismiss de mensajes de éxito/error
     */
    useEffect(() => {
        if (successMessage || error) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
                setError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, error]);

    /**
     * Obtener lista de departamentos
     */
    const cargarDepartamentos = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await projectAPI.getDepartamentos();
            setDepartamentos(data);
        } catch (err: any) {
            console.error('Error al cargar departamentos:', err);
            setError(err.response?.data?.detail || 'Error al cargar departamentos');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Validar formulario
     */
    const validarFormulario = (): boolean => {
        const errors: { nombre?: string; descripcion?: string } = {};

        // Validar nombre
        if (!formData.nombre || formData.nombre.trim().length === 0) {
            errors.nombre = 'El nombre es obligatorio';
        } else if (formData.nombre.trim().length < 3) {
            errors.nombre = 'El nombre debe tener al menos 3 caracteres';
        } else if (formData.nombre.length > 100) {
            errors.nombre = 'El nombre no puede exceder 100 caracteres';
        }

        // Validar descripción
        if (formData.descripcion && formData.descripcion.length > 500) {
            errors.descripcion = 'La descripción no puede exceder 500 caracteres';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    /**
     * Abrir modal de creación
     */
    const handleNuevoDepartamento = () => {
        setModalMode('create');
        setFormData({ nombre: '', descripcion: '' });
        setFormErrors({});
        setShowModal(true);
    };

    /**
     * Abrir modal de edición
     */
    const handleEditarDepartamento = (departamento: Departamento) => {
        setModalMode('edit');
        setFormData({
            nombre: departamento.nombre,
            descripcion: departamento.descripcion || ''
        });
        setDepartamentoSeleccionado(departamento);
        setFormErrors({});
        setShowModal(true);
    };

    /**
     * Cerrar modal de crear/editar
     */
    const handleCerrarModal = () => {
        setShowModal(false);
        setFormData({ nombre: '', descripcion: '' });
        setFormErrors({});
        setDepartamentoSeleccionado(null);
    };

    /**
     * Guardar departamento (crear o editar)
     */
    const handleGuardarDepartamento = async () => {
        if (!validarFormulario()) {
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            if (modalMode === 'create') {
                // Crear nuevo departamento
                await projectAPI.createDepartamento(formData);
                setSuccessMessage(`Departamento "${formData.nombre}" creado exitosamente`);
            } else {
                // Editar departamento existente
                if (!departamentoSeleccionado) return;

                const updateData: DepartamentoUpdate = {};
                if (formData.nombre !== departamentoSeleccionado.nombre) {
                    updateData.nombre = formData.nombre;
                }
                if (formData.descripcion !== (departamentoSeleccionado.descripcion || '')) {
                    updateData.descripcion = formData.descripcion;
                }

                await projectAPI.updateDepartamento(departamentoSeleccionado.id_departamento, updateData);
                setSuccessMessage(`Departamento "${formData.nombre}" actualizado exitosamente`);
            }

            // Recargar lista y cerrar modal
            await cargarDepartamentos();
            handleCerrarModal();
        } catch (err: any) {
            console.error('Error al guardar departamento:', err);
            setError(err.response?.data?.detail || 'Error al guardar el departamento');
        } finally {
            setSubmitting(false);
        }
    };

    /**
     * Abrir modal de confirmación de eliminación
     */
    const handleEliminarClick = (departamento: Departamento) => {
        setDepartamentoSeleccionado(departamento);
        setShowDeleteModal(true);
    };

    /**
     * Cerrar modal de eliminación
     */
    const handleCerrarDeleteModal = () => {
        setShowDeleteModal(false);
        setDepartamentoSeleccionado(null);
    };

    /**
     * Confirmar eliminación de departamento
     */
    const handleConfirmarEliminacion = async () => {
        if (!departamentoSeleccionado) return;

        setDeleting(true);
        setError(null);

        try {
            await projectAPI.deleteDepartamento(departamentoSeleccionado.id_departamento);
            setSuccessMessage(`Departamento "${departamentoSeleccionado.nombre}" eliminado exitosamente`);

            // Recargar lista y cerrar modal
            await cargarDepartamentos();
            handleCerrarDeleteModal();
        } catch (err: any) {
            console.error('Error al eliminar departamento:', err);
            setError(err.response?.data?.detail || 'Error al eliminar el departamento');
            handleCerrarDeleteModal();
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="gestion-departamentos-container">
            <div className="gestion-departamentos-header">
                <div className="header-title">
                    <Building2 size={32} />
                    <h2>Gestión de Departamentos</h2>
                </div>
                <Button
                    variant="primary"
                    onClick={handleNuevoDepartamento}
                    className="btn-nuevo-departamento"
                >
                    <Plus size={20} className="me-2" />
                    Nuevo Departamento
                </Button>
            </div>

            {/* Mensajes de éxito y error */}
            {successMessage && (
                <Alert variant="success" dismissible onClose={() => setSuccessMessage(null)}>
                    {successMessage}
                </Alert>
            )}

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Advertencia sobre impacto */}
            <Alert variant="warning" className="mb-4">
                <strong>Nota importante:</strong> Los cambios en departamentos afectan la clasificación de proyectos.
                No se pueden eliminar departamentos con proyectos asociados.
            </Alert>

            {/* Tabla de departamentos */}
            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Cargando departamentos...</p>
                </div>
            ) : (
                <div className="tabla-departamentos">
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th style={{ width: '30%' }}>Nombre</th>
                                <th style={{ width: '50%' }}>Descripción</th>
                                <th style={{ width: '20%' }} className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departamentos.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="text-center text-muted">
                                        No hay departamentos registrados
                                    </td>
                                </tr>
                            ) : (
                                departamentos.map((depto) => (
                                    <tr key={depto.id_departamento}>
                                        <td>
                                            <strong>{depto.nombre}</strong>
                                        </td>
                                        <td>
                                            {depto.descripcion || (
                                                <span className="text-muted">Sin descripción</span>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => handleEditarDepartamento(depto)}
                                                className="me-2"
                                                title="Editar departamento"
                                            >
                                                <Edit size={16} />
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleEliminarClick(depto)}
                                                title="Eliminar departamento"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </div>
            )}

            {/* Modal de Crear/Editar */}
            <Modal show={showModal} onHide={handleCerrarModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {modalMode === 'create' ? (
                            <>
                                <Plus size={24} className="me-2" />
                                Crear Nuevo Departamento
                            </>
                        ) : (
                            <>
                                <Edit size={24} className="me-2" />
                                Editar Departamento
                            </>
                        )}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>
                                Nombre del Departamento <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                isInvalid={!!formErrors.nombre}
                                maxLength={100}
                                placeholder="Ej: Departamento de Investigación"
                            />
                            <Form.Control.Feedback type="invalid">
                                {formErrors.nombre}
                            </Form.Control.Feedback>
                            <Form.Text className="text-muted">
                                {formData.nombre.length}/100 caracteres (mínimo 3)
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Descripción (opcional)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                isInvalid={!!formErrors.descripcion}
                                maxLength={500}
                                placeholder="Descripción breve del departamento..."
                            />
                            <Form.Control.Feedback type="invalid">
                                {formErrors.descripcion}
                            </Form.Control.Feedback>
                            <Form.Text className="text-muted">
                                {formData.descripcion?.length || 0}/500 caracteres
                            </Form.Text>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCerrarModal} disabled={submitting}>
                        <X size={18} className="me-2" />
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleGuardarDepartamento}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Check size={18} className="me-2" />
                                {modalMode === 'create' ? 'Crear' : 'Guardar Cambios'}
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de Confirmación de Eliminación */}
            <Modal show={showDeleteModal} onHide={handleCerrarDeleteModal}>
                <Modal.Header closeButton>
                    <Modal.Title className="text-danger">
                        <Trash2 size={24} className="me-2" />
                        Confirmar Eliminación
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        ¿Está seguro que desea eliminar el departamento{' '}
                        <strong>"{departamentoSeleccionado?.nombre}"</strong>?
                    </p>
                    <Alert variant="warning" className="mb-0">
                        <strong>Advertencia:</strong> Esta acción no se puede deshacer.
                        Si el departamento tiene proyectos asociados, la eliminación será rechazada.
                    </Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={handleCerrarDeleteModal}
                        disabled={deleting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleConfirmarEliminacion}
                        disabled={deleting}
                    >
                        {deleting ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Eliminando...
                            </>
                        ) : (
                            <>
                                <Trash2 size={18} className="me-2" />
                                Eliminar
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default GestionDepartamentos;
