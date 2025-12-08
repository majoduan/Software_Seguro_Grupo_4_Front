import React from 'react';
import { Card } from 'react-bootstrap';

interface POAFormHeaderProps {
  error: string | null;
  isEditing?: boolean;
  poaId?: string;
  errorRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Componente POAFormHeader
 * 
 * Objetivo:
 * - Proporcionar contexto claro al usuario sobre la acción actual (crear o editar POA).
 * - Mostrar mensajes de error de forma para facilitar la identificación y corrección de problemas.
 * 
 * Parámetros:
 * - error: string | null – Mensaje de error que se mostrará en caso de fallo al cargar o
 *  procesar datos del formulario.
 * - isEditing: booleano opcional – Determina si el formulario está en modo edición (true) o creación (false).
 * - poaId: string opcional – Identificador del POA que se está editando (si aplica).
 * 
 * Operación:
 * - Renderiza un encabezado visual con estilo distinto dependiendo si se está creando o editando un POA.
 * - Si existe un error, lo muestra de forma visible en una alerta para informar al usuario.
 */

export const POAFormHeader: React.FC<POAFormHeaderProps> = ({
  error,
  isEditing = false,
  poaId,
  errorRef
}) => {
  const headerClass = isEditing
    ? "bg-warning bg-gradient text-dark p-3"
    : "bg-primary bg-gradient text-white p-3";

  const title = isEditing
    ? `Editar POA ${poaId ? `#${poaId}` : ''}`
    : 'Crear Nuevo POA';

  return (
    <Card.Header className={headerClass}>
      <h2 className="mb-0 fw-bold text-center">{title}</h2>
      {error && (
        <div ref={errorRef} className="alert alert-danger mt-3 mb-0" role="alert">
          {error}
        </div>
      )}
    </Card.Header>
  );
};
