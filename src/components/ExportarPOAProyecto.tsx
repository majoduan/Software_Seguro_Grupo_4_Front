import React, { useState } from 'react';
import { Button, Dropdown, Spinner } from 'react-bootstrap';
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
 * - Exportar POAs individuales de un proyecto usando el endpoint del backend que genera
 *   archivos Excel con formato institucional compatible con re-importación.
 *
 * Parámetros:
 * - idProyecto: string - ID único que identifica el proyecto.
 * - codigoProyecto: string - Código del proyecto para el nombre del archivo.
 * - poas: POA[] - Lista de POAs asociados al proyecto para selección.
 *
 * Operación:
 * - Permite seleccionar un POA específico del menú dropdown.
 * - Llama al endpoint POST /proyectos/{id}/poas/{id_poa}/exportar del backend.
 * - El backend genera el archivo Excel con formato institucional usando export_excel_poa.py
 * - Descarga el archivo generado por el backend.
 *
 * Cambios (Diciembre 2024):
 * - Restaurada funcionalidad de selección de POA individual.
 * - Usa formato visual exacto de la plantilla institucional.
 * - Columnas de meses visibles (no ocultas).
 */
const ExportarPOAProyecto: React.FC<ExportarPOAProyectoProps> = ({
  idProyecto,
  codigoProyecto,
  poas
}) => {
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * Exporta un POA específico del proyecto usando el backend.
   *
   * Flujo:
   * 1. Llama a POST /proyectos/{id}/poas/{id_poa}/exportar
   * 2. El backend:
   *    - Obtiene el POA con sus actividades y tareas
   *    - Si está vacío, retorna archivo con solo encabezados
   *    - Genera Excel usando export_excel_poa.py con formato institucional
   *    - Retorna archivo con formato institucional
   * 3. Descarga el archivo recibido
   */
  const exportarPOA = async (idPoa: string, anioPoa: string) => {
    try {
      setLoading(true);

      // Llamar al endpoint del backend
      const blob = await projectAPI.exportarPoaIndividual(idProyecto, idPoa);

      // Crear URL temporal para descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `POA_${anioPoa}_${codigoProyecto}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess(`Archivo Excel de POA ${anioPoa} descargado exitosamente`);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || 'Error al exportar POA';
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

      <Dropdown>
        <Dropdown.Toggle
          variant="success"
          size="sm"
          disabled={loading}
          className="d-flex align-items-center"
        >
          <i className="fas fa-file-excel me-1"></i>
          {loading ? 'Exportando...' : 'Exportar Excel'}
        </Dropdown.Toggle>

        <Dropdown.Menu>
          {poas.map((poa) => (
            <Dropdown.Item
              key={poa.id_poa}
              onClick={() => exportarPOA(poa.id_poa, poa.anio_ejecucion)}
            >
              POA {poa.anio_ejecucion}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default ExportarPOAProyecto;
