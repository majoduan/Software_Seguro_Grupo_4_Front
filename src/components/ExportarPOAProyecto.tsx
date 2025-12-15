import React, { useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { POA } from '../interfaces/poa';
import { projectAPI } from '../api/projectAPI';
import { showError, showSuccess } from '../utils/toast';

interface ExportarPOAProyectoProps {
  idProyecto: string;
  codigoProyecto: string;
  poas: POA[];
}

/**
 * Componente ExportarPOAProyecto
 *
 * Objetivo:
 * - Exportar POAs de un proyecto usando el nuevo endpoint del backend que genera
 *   archivos Excel con formato institucional compatible con re-importación.
 *
 * Parámetros:
 * - idProyecto: string - ID único que identifica el proyecto.
 * - codigoProyecto: string - Código del proyecto para el nombre del archivo.
 * - poas: POA[] - Lista de POAs asociados al proyecto (solo para validación de UI).
 *
 * Operación:
 * - Llama al endpoint POST /proyectos/{id}/exportar-poas del backend.
 * - El backend genera el archivo Excel con formato institucional usando export_excel_poa.py
 * - Descarga el archivo generado por el backend.
 *
 * Cambios (Diciembre 2024):
 * - Migrado de generación local (ExcelJS ~750 líneas) a backend.
 * - Usa nuevo endpoint que implementa formato institucional correcto.
 * - Simplifica el componente de 750 líneas a ~100 líneas.
 */
const ExportarPOAProyecto: React.FC<ExportarPOAProyectoProps> = ({
  idProyecto,
  codigoProyecto,
  poas
}) => {
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * Exporta todos los POAs del proyecto usando el backend.
   *
   * Flujo:
   * 1. Llama a POST /proyectos/{id}/exportar-poas
   * 2. El backend:
   *    - Obtiene todos los POAs del proyecto con actividades y tareas
   *    - Genera Excel usando export_excel_poa.py
   *    - Retorna archivo con formato institucional
   * 3. Descarga el archivo recibido
   */
  const exportarPOAs = async () => {
    try {
      setLoading(true);

      // Llamar al nuevo endpoint del backend
      const blob = await projectAPI.exportarPOAsProyecto(idProyecto);

      // Crear URL temporal para descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `POAs_${codigoProyecto}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess('Archivo Excel descargado exitosamente');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || 'Error al exportar POAs';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Si no hay POAs, no mostrar el botón
  if (!poas || poas.length === 0) {
    return null;
  }

  return (
    <div className="d-flex align-items-center">
      {loading && (
        <Spinner
          animation="border"
          size="sm"
          variant="success"
          className="me-2"
        />
      )}

      <Button
        variant="success"
        size="sm"
        onClick={exportarPOAs}
        disabled={loading}
        className="d-flex align-items-center"
      >
        <i className="fas fa-file-excel me-1"></i>
        {loading ? 'Exportando...' : 'Exportar Excel'}
      </Button>
    </div>
  );
};

export default ExportarPOAProyecto;
