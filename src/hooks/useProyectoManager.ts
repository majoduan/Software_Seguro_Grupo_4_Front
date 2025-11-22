import { useState, useEffect } from 'react';
import { Proyecto, Departamento } from '../interfaces/project';
import { projectAPI } from '../api/projectAPI';
import { actividadAPI } from '../api/actividadAPI';
import { poaAPI } from '../api/poaAPI';
import { showError, showInfo } from '../utils/toast';

export const useProyectoManager = () => {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);

  // Cargar datos iniciales
  /**
 * Objetivo:
 * Gestionar la carga segura de datos de proyectos desde el backend,
 * mostrando información al usuario y controlando estados de carga y errores.
 * 
 * Parámetros: * Ninguno (usa useEffect con dependencia vacía para cargar al montar el componente).
 * 
 * Operación:
 * - Llama a la API `projectAPI.getProyectos()` para obtener los proyectos.
 * - Maneja errores mostrando mensajes amigables con `showError`.
 * - Indica el estado de carga con `isLoading`.
 * - Actualiza el estado `proyectos` con los datos recibidos.
 */
  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true);

      try {
        // Cargar proyectos y departamentos en paralelo
        const [proyectosData, departamentosData] = await Promise.all([
          projectAPI.getProyectos(),
          projectAPI.getDepartamentos()
        ]);
        setProyectos(proyectosData);
        setDepartamentos(departamentosData);
        showInfo('Proyectos cargados exitosamente');
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Función para validar si un proyecto tiene POAs disponibles (sin actividades)
  /**
 * Objetivo:
 * Validar la disponibilidad de POAs sin actividades asignadas para un proyecto,
 * asegurando que no se trabaje con datos incompletos o inconsistentes.
 * 
 * Parámetros:
 * proyecto - Proyecto: Objeto proyecto a validar.
 * 
 * Operación:
 * - Obtiene la lista de POAs asociadas al proyecto vía `poaAPI.getPOAsByProyecto`.
 * - Para cada POA, consulta actividades asignadas con `actividadAPI.getActividadesPorPOA`.
 * - Verifica que al menos uno de los POAs no tenga actividades para considerarlo válido.
 * - Maneja posibles errores de llamada y retorna mensajes descriptivos.
 */
  const validarProyectoSinActividades = async (proyecto: Proyecto): Promise<{ esValido: boolean; razon?: string }> => {
    try {
      const poasData = await poaAPI.getPOAsByProyecto(proyecto.id_proyecto);

      if (poasData.length === 0) {
        return {
          esValido: false,
          razon: 'Este proyecto no tiene POAs asociados'
        };
      }

      let poasConActividades = 0;
      const verificaciones = await Promise.all(
        poasData.map(async (poa) => {
          try {
            const actividades = await actividadAPI.getActividadesPorPOA(poa.id_poa);
            return actividades.length > 0;
          } catch (error) {
            return false;
          }
        })
      );

      poasConActividades = verificaciones.filter(Boolean).length;

      if (poasConActividades === poasData.length) {
        return {
          esValido: false,
          razon: `Todos los POAs (${poasData.length}) de este proyecto ya tienen actividades asignadas`
        };
      }

      const poasDisponibles = poasData.length - poasConActividades;
      return {
        esValido: true,
        razon: `${poasDisponibles} de ${poasData.length} POAs disponibles`
      };

    } catch (error) {
      return {
        esValido: true,
        razon: 'Error al validar disponibilidad'
      };
    }
  };

  // Función para validar si un proyecto tiene POAs con actividades existentes
  /**
 * Objetivo:
 * Validar la existencia de POAs con actividades para un proyecto,
 * asegurando que se trabaja solo con proyectos que contienen actividades.
 * 
 * Parámetros:
 * proyecto - Proyecto: Objeto proyecto a validar.
 * 
 * Operación:
 * - Obtiene las POAs del proyecto mediante `poaAPI.getPOAsByProyecto`.
 * - Consulta actividades asociadas a cada POA con `actividadAPI.getActividadesPorPOA`.
 * - Verifica que exista al menos una actividad en alguna POA para considerar válido.
 * - Captura errores en llamadas API y devuelve mensajes adecuados.
 */
  const validarProyectoConActividades = async (proyecto: Proyecto): Promise<{ esValido: boolean; razon?: string }> => {
    try {
      const poasData = await poaAPI.getPOAsByProyecto(proyecto.id_proyecto);

      if (poasData.length === 0) {
        return {
          esValido: false,
          razon: 'Este proyecto no tiene POAs asociados'
        };
      }

      let poasConActividades = 0;
      const verificaciones = await Promise.all(
        poasData.map(async (poa) => {
          try {
            const actividades = await actividadAPI.getActividadesPorPOA(poa.id_poa);
            return actividades.length > 0;
          } catch (error) {
            return false;
          }
        })
      );

      poasConActividades = verificaciones.filter(Boolean).length;

      if (poasConActividades === 0) {
        return {
          esValido: false,
          razon: 'Este proyecto no tiene POAs con actividades creadas'
        };
      }

      return {
        esValido: true,
        razon: `${poasConActividades} de ${poasData.length} POAs con actividades`
      };

    } catch (error) {
      return {
        esValido: false,
        razon: 'Error al validar disponibilidad'
      };
    }
  };

  /**Seleccionar Proyecto
 * Objetivo:
 * Gestionar la selección segura de un proyecto para operaciones posteriores,
 * evitando inconsistencias en la interfaz o manipulación de datos errónea.
 * 
 * Parámetros:
 * proyecto - Proyecto: Proyecto a seleccionar.
 * 
 * Operación:
 * - Actualiza el estado `proyectoSeleccionado` con el proyecto recibido.
 */
  const seleccionarProyecto = (proyecto: Proyecto) => {
    setProyectoSeleccionado(proyecto);
  };

  /**limpiar Proyecto Seleccionado
 * Objetivo:
 * Limpiar la selección del proyecto actual,
 * asegurando que no se mantengan datos obsoletos o no deseados.
 * 
 * Parámetros: Ninguno.
 * 
 * Operación:
 * - Actualiza el estado `proyectoSeleccionado` a null.
 */
  const limpiarProyectoSeleccionado = () => {
    setProyectoSeleccionado(null);
  };

  return {
    // Estados
    proyectos,
    proyectoSeleccionado,
    isLoading,
    departamentos,

    // Funciones
    seleccionarProyecto,
    limpiarProyectoSeleccionado,
    validarProyectoSinActividades,
    validarProyectoConActividades
  };
};
