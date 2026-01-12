import { useState, useEffect } from 'react';
import { POAConActividadesYTareas, ActividadConTareas } from '../interfaces/actividad';
import { DetalleTarea, TareaForm, ProgramacionMensualOut } from '../interfaces/tarea';
import { POA, TipoPOA } from '../interfaces/poa';
import { poaAPI } from '../api/poaAPI';
import { actividadAPI } from '../api/actividadAPI';
import { tareaAPI } from '../api/tareaAPI';
import { getActividadesPorTipoPOA } from '../utils/listaActividades';
import { showError, showInfo, showWarning } from '../utils/toast';
import { agruparDetallesDuplicados, obtenerNumeroTarea } from '../utils/tareaUtils';
import { esContratacionServiciosProfesionales } from '../utils/asignarCantidad';
import { sanitizeInput, sanitizeObject } from '../utils/sanitizer';

// Extender la interfaz POA para incluir los datos del tipo
interface POAExtendido extends POA {
  tipo_poa?: string;
  tipoPOAData?: TipoPOA;
}

/**
 * Hook personalizado que gestiona la carga, precarga y edición de POAs, actividades y tareas
 * dentro del contexto de un proyecto. Este hook incluye medidas de seguridad como:
 * - control de errores en peticiones externas
 * - sanitización de entradas
 * - control de datos presupuestarios sensibles en memoria
 * - uso de `Map` como caché temporal para reducir accesos innecesarios a la red
 */

export const useActividadManager = () => {
  // Estados para POAs y periodos
  const [poasProyecto, setPoasProyecto] = useState<POAExtendido[]>([]);
  const [activePoaTab, setActivePoaTab] = useState('');
  const [poasConActividades, setPoasConActividades] = useState<POAConActividadesYTareas[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Cargando datos...');
  const [modoEdicion, setModoEdicion] = useState(false); // Flag para distinguir entre crear y editar

  // Cache simple para evitar consultas repetidas
  const cacheItemsPresupuestarios = new Map<string, any>();

  /**
 * Objetivo:
 * Obtener un ítem presupuestario desde una fuente externa utilizando una caché en memoria
 * para evitar múltiples llamadas al mismo recurso.
 *
 * Parámetros:
 * param id - string: ID del ítem presupuestario que se desea consultar.
 * param getItemPresupuestarioPorId - función asíncrona que realiza la consulta a la API.
 *
 * Operación:
 * - Verifica si el ítem existe en el Map `cacheItemsPresupuestarios`.
 * - Si existe, lo devuelve directamente.
 * - Si no, realiza la consulta a la API, lo guarda en caché y luego lo retorna.
 * 
 */

  const getItemPresupuestarioConCache = async (
    id: string,
    getItemPresupuestarioPorId: (id: string) => Promise<any>
  ): Promise<any> => {
    if (cacheItemsPresupuestarios.has(id)) {
      return cacheItemsPresupuestarios.get(id)!;
    }

    const item = await getItemPresupuestarioPorId(id);
    cacheItemsPresupuestarios.set(id, item);
    return item;
  };

  // Función para cargar información del tipo de POA
  const cargarTipoPOA = async (poa: POA): Promise<POAExtendido> => {
    try {
      const tipoPOAData = await poaAPI.getTipoPOA(poa.id_tipo_poa);
      return {
        ...poa,
        tipo_poa: tipoPOAData.codigo_tipo,
        tipoPOAData: tipoPOAData
      };
    } catch (error) {
      return {
        ...poa,
        tipo_poa: 'PVIF',
        tipoPOAData: undefined
      };
    }
  };

  // Función para precargar tareas para una actividad específica
  // FUNCIONALIDAD AGREGADA: Asignación automática de precios para servicios profesionales
  /**
 * Objetivo:
 * Generar una lista de tareas precargadas (TareaForm) a partir de los detalles disponibles
 * de una actividad y un POA, con lógica adicional para asignar precios automáticamente si
 * se detectan servicios profesionales.
 *
 * Parámetros:
 * detallesTarea - DetalleTarea[]: Lista de detalles asociados al POA.
 * codigoActividad - string: Código de la actividad en ejecución.
 * tipoPOA - string: Tipo de POA (PVIF, PVV, etc.).
 * poaId - string: ID del POA en contexto.
 *
 * Operación:
 * - Filtra los detalles relacionados con la actividad seleccionada.
 * - Agrupa tareas duplicadas.
 * - Genera objetos `TareaForm`, asignando identificadores temporales.
 *
 */

  const precargarTareasParaActividad = async (
    detallesTarea: DetalleTarea[],
    codigoActividad: string,
    tipoPOA: string,
    poaId: string
  ): Promise<TareaForm[]> => {
    try {
      // ✅ FASE 2: Usar nuevo endpoint del backend que ya filtra las tareas
      // En lugar de filtrar manualmente en el frontend, el backend hace todo el trabajo
      const detallesFiltradosParaActividad = await tareaAPI.getDetallesTareaParaActividad(
        poaId,
        codigoActividad
      );

      // Crear wrapper function para getItemPresupuestarioConCache
      const getItemWrapper = async (id: string) => {
        return await getItemPresupuestarioConCache(id, async (itemId: string) => {
          return await tareaAPI.getItemPresupuestarioPorId(itemId);
        });
      };

      const detallesAgrupados = await agruparDetallesDuplicados(
        detallesFiltradosParaActividad,
        getItemWrapper
      );

      // Convertir los detalles filtrados a TareaForm para precargar
      const tareasPrecargadas: TareaForm[] = [];

      for (const detalle of detallesAgrupados) {
        const numeroTarea = obtenerNumeroTarea(detalle, tipoPOA);

        const tarea: TareaForm = {
          tempId: `pre-${poaId}-${codigoActividad}-${detalle.id_detalle_tarea}-${Date.now()}`,
          id_detalle_tarea: detalle.id_detalle_tarea,
          nombre: numeroTarea ? `${numeroTarea} - ${detalle.nombre || ''}` : (detalle.nombre || ''),
          detalle_descripcion: detalle.descripcion || '',
          lineaPaiViiv: undefined,
          cantidad: 0,
          precio_unitario: 0,
          codigo_item: detalle.item_presupuestario?.codigo || 'N/A',
          total: 0,
          gastos_mensuales: new Array(12).fill(0),
          detalle: detalle,
          itemPresupuestario: detalle.item_presupuestario,
          numero_tarea: numeroTarea,
          saldo_disponible: 0
        };

        // Manejar múltiples items si existen
        if (detalle.tiene_multiples_items && detalle.items_presupuestarios && detalle.items_presupuestarios.length > 0) {
          tarea.id_item_presupuestario_seleccionado = detalle.items_presupuestarios[0].id_item_presupuestario;
        }

        // Manejar múltiples descripciones si existen
        if (detalle.tiene_multiples_descripciones && detalle.descripciones_disponibles && detalle.descripciones_disponibles.length > 0) {
          tarea.descripcion_seleccionada = detalle.descripciones_disponibles[0];
          tarea.detalle_descripcion = detalle.descripciones_disponibles[0];

          // Aplicar precio del primer elemento si existen precios disponibles
          if (detalle.precios_disponibles && detalle.precios_disponibles.length > 0) {
            const primerPrecio = detalle.precios_disponibles[0];
            if (primerPrecio !== undefined && primerPrecio !== null) {
              tarea.precio_unitario = primerPrecio;
            }
          } else if (detalle.precio_unitario !== undefined && detalle.precio_unitario !== null) {
            tarea.precio_unitario = detalle.precio_unitario;
          }
        } else {
          // Si no tiene múltiples descripciones, aplicar precio si existe
          if (detalle.precio_unitario !== undefined && detalle.precio_unitario !== null) {
            tarea.precio_unitario = detalle.precio_unitario;
          }
        }

        tareasPrecargadas.push(tarea);
      }

      return tareasPrecargadas;

    } catch (error) {
      return [];
    }
  };

  // Función para cargar POAs sin actividades (para AgregarActividad)
  const cargarPoasSinActividades = async (proyectoId: string) => {
    try {
      setModoEdicion(false); // Modo crear
      setIsLoading(true);
      setLoadingMessage('Cargando POAs del proyecto...');

      const poasData = await poaAPI.getPOAsByProyecto(proyectoId);
      setLoadingMessage('Verificando disponibilidad de POAs...');

      const poasDisponibles: any[] = [];

      for (const poa of poasData) {
        try {
          const actividades = await actividadAPI.getActividadesPorPOA(poa.id_poa);
          if (actividades.length === 0) {
            const poaConTipo = await cargarTipoPOA(poa);
            poasDisponibles.push(poaConTipo);
          }
        } catch (error) {
          const poaConTipo = await cargarTipoPOA(poa);
          poasDisponibles.push(poaConTipo);
        }
      }

      if (poasDisponibles.length === 0) {
        showWarning('Este proyecto no tiene POAs disponibles. Todos los POAs ya tienen actividades asignadas.');
        setPoasProyecto([]);
        setPoasConActividades([]);
        setActivePoaTab('');
        return;
      }

      setPoasProyecto(poasDisponibles);
      showInfo(`Proyecto seleccionado. ${poasDisponibles.length} POAs disponibles de ${poasData.length} totales.`);

      // Limpiar cache
      cacheItemsPresupuestarios.clear();

    } catch (err) {
      showError('Error al cargar los POAs asociados al proyecto');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cargar POAs con actividades existentes (para EditarActividad)
  const cargarPoasConActividades = async (proyectoId: string) => {
    try {
      setIsLoading(true);
      setLoadingMessage('Cargando POAs del proyecto...');

      const poasData = await poaAPI.getPOAsByProyecto(proyectoId);

      const poasConActividadesExistentes: POAExtendido[] = [];

      for (const poa of poasData) {
        try {
          const actividades = await actividadAPI.getActividadesPorPOA(poa.id_poa);
          if (actividades.length > 0) {
            const poaConTipo = await cargarTipoPOA(poa);
            poasConActividadesExistentes.push(poaConTipo);
          }
        } catch (error) {
        }
      }

      if (poasConActividadesExistentes.length === 0) {
        showWarning('Este proyecto no tiene POAs con actividades creadas.');
        setPoasProyecto([]);
        setPoasConActividades([]);
        setActivePoaTab('');
        return;
      }

      setPoasProyecto(poasConActividadesExistentes);
      showInfo(`Proyecto seleccionado. ${poasConActividadesExistentes.length} POAs con actividades encontrados.`);

    } catch (err) {
      showError('Error al cargar los POAs asociados al proyecto');
    } finally {
      setIsLoading(false);
    }
  };

  // Función auxiliar para convertir valores a número de forma segura
  const toSafeNumber = (value: any): number => {
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Función para cargar POAs con actividades y tareas reales (para EditarActividad)
  const cargarPoasConActividadesYTareasReales = async (proyectoId: string) => {
    try {
      setModoEdicion(true); // Modo editar
      setIsLoading(true);
      setLoadingMessage('Cargando POAs del proyecto...');

      const poasData = await poaAPI.getPOAsByProyecto(proyectoId);

      const poasConActividadesExistentes: POAExtendido[] = [];
      const nuevosPoasConActividades: POAConActividadesYTareas[] = [];

      for (const poa of poasData) {
        try {
          const actividades = await actividadAPI.getActividadesPorPOA(poa.id_poa);
          if (actividades.length > 0) {
            const poaConTipo = await cargarTipoPOA(poa);
            poasConActividadesExistentes.push(poaConTipo);

            setLoadingMessage(`Ordenando actividades para POA ${poa.codigo_poa}...`);

            // Importar la función de ordenamiento
            const { ordenarActividadesSegunConfiguracion } = await import('../utils/ordenarActividades');

            // Ordenar las actividades según la configuración
            const actividadesOrdenadas = await ordenarActividadesSegunConfiguracion(
              actividades,
              poa.codigo_poa
            );

            setLoadingMessage(`Cargando tareas para POA ${poa.codigo_poa}...`);

            const actividadesConTareas: ActividadConTareas[] = [];

            for (const actividadReal of actividadesOrdenadas) {
              // Obtener tareas de cada actividad
              const tareasReales = await tareaAPI.getTareasPorActividad(actividadReal.id_actividad);

              // Convertir tareas reales al formato TareaForm para edición
              const tareasForm: TareaForm[] = [];

              for (const tareaReal of tareasReales) {
                try {
                  // Obtener programación mensual y item presupuestario en paralelo
                  const programacionPromise = tareaAPI.getProgramacionMensualPorTarea(tareaReal.id_tarea)
                    .catch(() => []); // Si falla, usar array vacío

                  const itemPresupuestarioPromise = tareaAPI.getItemPresupuestarioDeTarea(tareaReal.id_tarea)
                    .catch(() => ({ codigo: 'N/A' })); // Si falla, usar valor por defecto

                  // Ejecutar ambas consultas en paralelo
                  const [programacionData, itemPresupuestarioData] = await Promise.all([
                    programacionPromise,
                    itemPresupuestarioPromise
                  ]);

                  // Crear array de 12 meses inicializado en 0
                  const gastosMensuales = Array(12).fill(0);

                  // Llenar el array con los datos de programación
                  programacionData.forEach((programacion: ProgramacionMensualOut) => {
                    // El mes viene en formato "MM-YYYY", extraemos el mes
                    const mesNum = parseInt(programacion.mes.split('-')[0]) - 1; // -1 porque el array es 0-indexed
                    if (mesNum >= 0 && mesNum < 12) {
                      gastosMensuales[mesNum] = toSafeNumber(programacion.valor);
                    }
                  });

                  const tareaForm: TareaForm = {
                    tempId: `edit-${actividadReal.id_actividad}-${tareaReal.id_tarea}-${Date.now()}`,
                    id_tarea_real: tareaReal.id_tarea, // Guardar ID real para actualizaciones
                    id_detalle_tarea: tareaReal.id_detalle_tarea,
                    nombre: tareaReal.nombre,
                    detalle_descripcion: tareaReal.detalle_descripcion,
                    cantidad: toSafeNumber(tareaReal.cantidad),
                    precio_unitario: toSafeNumber(tareaReal.precio_unitario),
                    total: toSafeNumber(tareaReal.total),
                    codigo_item: itemPresupuestarioData.codigo || 'N/A', // Usar el código del item presupuestario real
                    lineaPaiViiv: tareaReal.lineaPaiViiv,
                    gastos_mensuales: gastosMensuales, // Programación mensual real
                    saldo_disponible: toSafeNumber(tareaReal.saldo_disponible),
                    expanded: false,
                    detalle: tareaReal.detalle_tarea
                  };

                  tareasForm.push(tareaForm);

                } catch (tareaError) {

                  // Si hay error, usar valores por defecto
                  const tareaForm: TareaForm = {
                    tempId: `edit-${actividadReal.id_actividad}-${tareaReal.id_tarea}-${Date.now()}`,
                    id_tarea_real: tareaReal.id_tarea,
                    id_detalle_tarea: tareaReal.id_detalle_tarea,
                    nombre: tareaReal.nombre,
                    detalle_descripcion: tareaReal.detalle_descripcion,
                    cantidad: toSafeNumber(tareaReal.cantidad),
                    precio_unitario: toSafeNumber(tareaReal.precio_unitario),
                    total: toSafeNumber(tareaReal.total),
                    codigo_item: 'Error', // Valor por defecto en caso de error
                    lineaPaiViiv: tareaReal.lineaPaiViiv,
                    gastos_mensuales: new Array(12).fill(0), // Array vacío en caso de error
                    saldo_disponible: toSafeNumber(tareaReal.saldo_disponible),
                    expanded: false,
                    detalle: tareaReal.detalle_tarea
                  };

                  tareasForm.push(tareaForm);
                }
              }

              // Determinar código de actividad basado en el tipo de POA
              const actividadesPorTipo = getActividadesPorTipoPOA(poaConTipo.tipo_poa || 'PVIF');
              const actividadTipo = actividadesPorTipo.find(act =>
                act.descripcion === actividadReal.descripcion_actividad
              );

              actividadesConTareas.push({
                actividad_id: `edit-${actividadReal.id_actividad}`,
                codigo_actividad: actividadTipo?.id || 'ACT-1',
                descripcion_actividad: actividadReal.descripcion_actividad, // Guardar descripción real
                id_actividad_real: actividadReal.id_actividad, // Guardar ID real
                tareas: tareasForm
              });
            }

            setLoadingMessage(`Cargando detalles de tareas para POA ${poa.codigo_poa}...`);

            // Cargar detalles de tarea necesarios para agregar nuevas tareas
            const detallesTarea = await tareaAPI.getDetallesTareaPorPOA(poa.id_poa);

            nuevosPoasConActividades.push({
              id_poa: poa.id_poa,
              codigo_poa: poa.codigo_poa,
              tipo_poa: poaConTipo.tipo_poa || 'PVIF',
              presupuesto_asignado: parseFloat(poa.presupuesto_asignado.toString()),
              actividades: actividadesConTareas,
              detallesTarea: detallesTarea // Necesario para agregar nuevas tareas
            });
          }
        } catch (error) {
        }
      }

      if (poasConActividadesExistentes.length === 0) {
        showWarning('Este proyecto no tiene POAs con actividades creadas.');
        setPoasProyecto([]);
        setPoasConActividades([]);
        setActivePoaTab('');
        return;
      }

      setPoasProyecto(poasConActividadesExistentes);
      setPoasConActividades(nuevosPoasConActividades);

      if (!activePoaTab && nuevosPoasConActividades.length > 0) {
        setActivePoaTab(nuevosPoasConActividades[0].id_poa);
      }

      showInfo(`${poasConActividadesExistentes.length} POAs con actividades cargados correctamente.`);

    } catch (err) {
      showError('Error al cargar los POAs con actividades y tareas');
    } finally {
      setIsLoading(false);
    }
  };

  // Inicializar la estructura de poasConActividades cuando cambian los POAs (solo para modo crear)
  useEffect(() => {
    // Solo ejecutar la precarga si no estamos en modo edición
    if (modoEdicion) return;

    const cargarDetallesTareaYPrecargar = async () => {
      if (poasProyecto.length === 0) return;

      setIsLoading(true);
      setLoadingMessage('Cargando detalles de tareas...');

      try {
        const nuevosPoasConActividades: POAConActividadesYTareas[] = [];

        for (const poa of poasProyecto) {
          const detallesTarea = await tareaAPI.getDetallesTareaPorPOA(poa.id_poa);
          const tipoPOA = poa.tipo_poa || 'PVIF';
          const actividadesPorTipo = getActividadesPorTipoPOA(tipoPOA);

          const actividadesConTareasPrecargadas: ActividadConTareas[] = [];

          for (const [index, actividad] of actividadesPorTipo.entries()) {
            const tareasPrecargadas = await precargarTareasParaActividad(
              detallesTarea,
              actividad.id,
              tipoPOA,
              poa.id_poa
            );

            actividadesConTareasPrecargadas.push({
              actividad_id: `pre-${poa.id_poa}-${actividad.id}-${Date.now()}-${index}`,
              codigo_actividad: actividad.id,
              tareas: tareasPrecargadas
            });
          }

          nuevosPoasConActividades.push({
            id_poa: poa.id_poa,
            codigo_poa: poa.codigo_poa,
            tipo_poa: tipoPOA,
            presupuesto_asignado: parseFloat(poa.presupuesto_asignado.toString()),
            actividades: actividadesConTareasPrecargadas,
            detallesTarea
          });
        }

        setPoasConActividades(nuevosPoasConActividades);

        if (!activePoaTab && nuevosPoasConActividades.length > 0) {
          setActivePoaTab(nuevosPoasConActividades[0].id_poa);
        }

      } catch (err) {
        showError('Error al cargar los detalles de tareas');
      } finally {
        setIsLoading(false);
      }
    };

    try {
      cargarDetallesTareaYPrecargar();
    } catch (err) {
      showError('Error al cargar los detalles de tareas');
      setIsLoading(false);
    }
  }, [poasProyecto, modoEdicion]);

  return {
    // Estados
    poasProyecto,
    activePoaTab,
    poasConActividades,
    isLoading,
    loadingMessage,

    // Setters
    setActivePoaTab,
    setPoasConActividades,

    // Funciones
    cargarPoasSinActividades,
    cargarPoasConActividades,
    cargarPoasConActividadesYTareasReales,
    getItemPresupuestarioConCache
  };
};
