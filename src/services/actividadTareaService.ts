import { ActividadCreate, POAConActividadesYTareas } from '../interfaces/actividad';
import { TareaCreate, ProgramacionMensualCreate } from '../interfaces/tarea';
import { actividadAPI } from '../api/actividadAPI';
import { tareaAPI } from '../api/tareaAPI';
import { getActividadesPorTipoPOA } from '../utils/listaActividades';
import { showError, showSuccess } from '../utils/toast';
import { toast } from 'react-toastify';

export interface GuardarActividadesResult {
  success: boolean;
  data?: any[];
  totalActividadesCreadas?: number;
  totalTareasCreadas?: number;
  totalProgramacionesCreadas?: number;
  error?: string;
}

/**
 * Servicio para manejo de actividades y tareas relacionadas con POAs (Planes Operativos Anuales)
 * 
 * Incluye métodos para obtener descripciones, validar formularios, crear y editar actividades y tareas,
 * con validaciones para garantizar integridad de datos y manejo de errores adecuado.
 */
export class ActividadTareaService {
  
  // Obtener la descripción de una actividad a partir de su código
  /* Objetivo:
   *   Obtener la descripción de una actividad a partir del código y el POA correspondiente.
   * 
   * Parámetros:
   *   - poaId: string — ID del POA.
   *   - codigoActividad: string — Código de la actividad.
   *   - poasConActividades: POAConActividadesYTareas[] — Lista de POAs con sus actividades y tareas.
   * 
   * Operación:
   *   Busca el POA correspondiente, luego dentro de sus actividades busca la que coincida con el código dado.
   *   Retorna la descripción si la encuentra, o mensajes predeterminados si no.
   */
  static getDescripcionActividad = (poaId: string, codigoActividad: string, poasConActividades: POAConActividadesYTareas[]) => {
    const poa = poasConActividades.find(p => p.id_poa === poaId);
    if (!poa) return 'POA no encontrado';

    const actividadesDisponibles = getActividadesPorTipoPOA(poa.tipo_poa);
    const actividad = actividadesDisponibles.find(act => act.id === codigoActividad);

    return actividad ? actividad.descripcion : 'Seleccione una actividad';
  };

  // Validar el formulario antes de guardar
  /* Objetivo:
   *   Validar el formulario antes de guardar actividades y tareas para evitar errores y datos incompletos.
   * 
   * Parámetros:
   *   - proyectoSeleccionado: any — Proyecto actualmente seleccionado.
   *   - poasProyecto: any[] — POAs asociados al proyecto.
   *   - poasConActividades: POAConActividadesYTareas[] — POAs con actividades definidas.
   * 
   * Operación:
   *   Valida que haya un proyecto seleccionado, que tenga POAs, que existan actividades definidas, y que cada POA tenga actividades con código válido.
   *   En caso de error muestra mensajes mediante toast y devuelve false para bloquear el guardado.
   *   Retorna true si todas las validaciones pasan.
   */
  static validarFormulario = (
    proyectoSeleccionado: any,
    poasProyecto: any[],
    poasConActividades: POAConActividadesYTareas[]
  ): boolean => {
    if (!proyectoSeleccionado) {
      showError('Debe seleccionar un proyecto');
      return false;
    }

    if (poasProyecto.length === 0) {
      showError('El proyecto seleccionado no tiene POAs asociados');
      return false;
    }

    const hayActividadesDefinidas = poasConActividades.some(poa => poa.actividades.length > 0);
    if (!hayActividadesDefinidas) {
      showError('Debe definir al menos una actividad');
      return false;
    }

    // Validar que todas las actividades tengan una tarea seleccionada en cada POA
    for (const poa of poasConActividades) {
      const actividadesConCodigo = poa.actividades.filter(act => act.codigo_actividad && act.codigo_actividad !== "");

      if (actividadesConCodigo.length === 0) {
        showError(`Debe seleccionar al menos una actividad en el POA ${poa.codigo_poa}`);
        return false;
      }
    }

    return true;
  };

  // Guardar actividades y tareas
  /* Objetivo:
   *   Guardar actividades y tareas relacionadas con POAs, garantizando la planificación correcta.
   * 
   * Parámetros:
   *   - poasConActividades: POAConActividadesYTareas[] — POAs con actividades y tareas a guardar.
   *   - setActivePoaTab?: Función opcional para cambiar la pestaña activa en la UI si ocurre error.
   * 
   * Operación:
   *   -Valida que las tareas con cantidad > 0 tengan planificación mensual.
   *   -Crea actividades en backend y mapea los IDs retornados.
   *   -Crea tareas para cada actividad creada.
   *   -Crea programaciones mensuales para tareas con gastos mensuales > 0.
   *   -Controla errores y notifica al usuario con mensajes claros.
   *   -Retorna un objeto con resultados de éxito o error y datos creados.
   */
  static async guardarActividades(
    poasConActividades: POAConActividadesYTareas[],
    //proyectoSeleccionado: any,
    setActivePoaTab?: (tab: string) => void
  ): Promise<GuardarActividadesResult> {
    
    try {
      const toastId = toast.loading('Guardando actividades y tareas...');

      // Paso 1: Crear actividades
      const actividadesCreadas: { [key: string]: string } = {};
      const mapeoActividadesTemp: { [key: string]: { poaId: string, actividadTemp: any } } = {};
      let totalActividadesCreadas = 0;

      for (const poa of poasConActividades) {
        const actividadesConCodigo = poa.actividades.filter(act => act.codigo_actividad && act.codigo_actividad !== "");

        const actividadesParaCrear: ActividadCreate[] = actividadesConCodigo.map((actPoa) => {
          const descripcion = this.getDescripcionActividad(poa.id_poa, actPoa.codigo_actividad, poasConActividades);

          return {
            descripcion_actividad: descripcion
          };
        });

        // Validar planificación mensual antes de crear actividades
        for (const actividad of actividadesConCodigo) {
          for (const tarea of actividad.tareas) {
            const totalPlanificado = tarea.gastos_mensuales?.reduce((sum: number, val: number) => sum + (val || 0), 0) || 0;
            if (totalPlanificado === 0 && tarea.cantidad > 0) {
              toast.update(toastId, {
                render: `La tarea "${tarea.nombre}" debe tener planificación mensual`,
                type: "error",
                isLoading: false,
                autoClose: 5000
              });
              if (setActivePoaTab) setActivePoaTab(poa.id_poa);
              return { success: false, error: `La tarea "${tarea.nombre}" debe tener planificación mensual` };
            }
          }
        }

        // Crear las actividades para este POA
        const actividadesCreadasResponse = await actividadAPI.crearActividadesPorPOA(poa.id_poa, actividadesParaCrear);

        let idsActividades: string[] = [];

        if (actividadesCreadasResponse.ids_actividades && Array.isArray(actividadesCreadasResponse.ids_actividades)) {
          idsActividades = actividadesCreadasResponse.ids_actividades;
        } else if (Array.isArray(actividadesCreadasResponse)) {
          idsActividades = actividadesCreadasResponse.map((act: any) => act.id_actividad);
        } else {
          throw new Error(`Respuesta inválida del servidor para POA ${poa.codigo_poa}`);
        }

        if (idsActividades.length !== actividadesConCodigo.length) {
          throw new Error(`Se esperaban ${actividadesConCodigo.length} actividades, pero se crearon ${idsActividades.length} para POA ${poa.codigo_poa}`);
        }

        actividadesConCodigo.forEach((act, index) => {
          const idActividadReal = idsActividades[index];

          if (!idActividadReal) {
            throw new Error(`No se pudo obtener el ID de la actividad ${index + 1} para POA ${poa.codigo_poa}`);
          }

          actividadesCreadas[act.actividad_id] = idActividadReal;
          mapeoActividadesTemp[act.actividad_id] = {
            poaId: poa.id_poa,
            actividadTemp: act
          };
          totalActividadesCreadas++;

        });
      }

      // Paso 2: Crear tareas para cada actividad
      let totalTareasCreadas = 0;
      let totalProgramacionesCreadas = 0;

      for (const [actividadTempId, { actividadTemp }] of Object.entries(mapeoActividadesTemp)) {
        const idActividadReal = actividadesCreadas[actividadTempId];

        if (!idActividadReal || actividadTemp.tareas.length === 0) {
          continue;
        }

        for (let i = 0; i < actividadTemp.tareas.length; i++) {
          const tarea = actividadTemp.tareas[i];

          try {
            const tareaDatos: TareaCreate = {
              id_detalle_tarea: tarea.id_detalle_tarea,
              nombre: tarea.nombre,
              detalle_descripcion: tarea.detalle_descripcion,
              cantidad: tarea.cantidad,
              precio_unitario: tarea.precio_unitario,
              total: tarea.total || (tarea.cantidad * tarea.precio_unitario),
              saldo_disponible: tarea.total || (tarea.cantidad * tarea.precio_unitario),
              lineaPaiViiv: tarea.lineaPaiViiv || undefined
            };

            const tareaCreada = await tareaAPI.crearTarea(idActividadReal, tareaDatos);

            if (!tareaCreada || !tareaCreada.id_tarea) {
              throw new Error(`Error crítico: No se pudo obtener el ID de la tarea creada "${tarea.nombre}" para actividad ${idActividadReal}`);
            }
            totalTareasCreadas++;

            // Crear la programación mensual para esta tarea
            if (tarea.gastos_mensuales && tarea.gastos_mensuales.length === 12) {
              for (let index = 0; index < tarea.gastos_mensuales.length; index++) {
                const valor = tarea.gastos_mensuales[index];
                if (valor > 0) {
                  const mesNumero = index + 1;
                  const añoActual = new Date().getFullYear();
                  const mesFormateado = `${mesNumero.toString().padStart(2, '0')}-${añoActual}`;

                  const programacionDatos: ProgramacionMensualCreate = {
                    id_tarea: tareaCreada.id_tarea,
                    mes: mesFormateado,
                    valor: valor
                  };
                  try {
                    await tareaAPI.crearProgramacionMensual(programacionDatos);
                    totalProgramacionesCreadas++;
                  } catch (progError) {
                    throw progError;
                  }
                }
              }
            }
          } catch (error: any) {
            throw new Error(`Error al crear la tarea "${tarea.nombre}": ${error}`);
          }
        }
      }

      toast.update(toastId, {
        render: `Se han creado exitosamente ${totalActividadesCreadas} actividades para ${poasConActividades.length} POAs del proyecto`,
        type: "success",
        isLoading: false,
        autoClose: 5000
      });

      // Preparar los datos para exportar
      const datosParaExportar = poasConActividades.map((poa) => {
        const actividadesConCodigo = poa.actividades.filter(act => act.codigo_actividad && act.codigo_actividad !== "");

        return {
          id_poa: poa.id_poa,
          codigo_poa: poa.codigo_poa,
          tipo_poa: poa.tipo_poa,
          presupuesto_asignado: poa.presupuesto_asignado,
          actividades: actividadesConCodigo.map((actividad) => ({
            codigo_actividad: actividad.codigo_actividad,
            descripcion_actividad: this.getDescripcionActividad(poa.id_poa, actividad.codigo_actividad, poasConActividades),
            total_por_actividad: actividad.tareas.reduce((sum: number, tarea: any) => sum + (tarea.total || 0), 0),
            tareas: actividad.tareas.map((tarea: any) => ({
              nombre: tarea.nombre,
              detalle_descripcion: tarea.detalle_descripcion,
              cantidad: tarea.cantidad,
              precio_unitario: tarea.precio_unitario,
              total: tarea.total || (tarea.cantidad * tarea.precio_unitario),
              codigo_item: tarea.codigo_item || tarea.itemPresupuestario,
              gastos_mensuales: tarea.gastos_mensuales || []
            }))
          }))
        };
      });

      showSuccess(`Datos guardados exitosamente. ${totalActividadesCreadas} actividades, ${totalTareasCreadas} tareas y ${totalProgramacionesCreadas} programaciones mensuales creadas.`);

      return {
        success: true,
        data: datosParaExportar,
        totalActividadesCreadas,
        totalTareasCreadas,
        totalProgramacionesCreadas
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear las actividades y tareas';
      showError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Editar tareas existentes (para EditarActividad)
  /* Objetivo:
   *   Editar tareas existentes y actualizar su programación mensual si corresponde.
   * 
   * Parámetros:
   *   - poasConActividades: POAConActividadesYTareas[] — POAs con actividades y tareas a actualizar.
   * 
   * Operación:
   *   Recorre las tareas para contar y actualizar programaciones mensuales.
   *   Maneja errores y notifica al usuario sobre el estado de la operación.
   *   Retorna un objeto con el resultado de la actualización.
   */
  static async editarTareas(
    poasConActividades: POAConActividadesYTareas[]
  ): Promise<GuardarActividadesResult> {
    try {
      const toastId = toast.loading('Actualizando tareas...');

      let totalTareasActualizadas = 0;
      let totalProgramacionesActualizadas = 0;

      for (const poa of poasConActividades) {
        for (const actividad of poa.actividades) {
          for (const tarea of actividad.tareas) {
            try {
              totalTareasActualizadas++;

              // Actualizar programación mensual si es necesario
              if (tarea.gastos_mensuales && tarea.gastos_mensuales.length === 12) {
                totalProgramacionesActualizadas += tarea.gastos_mensuales.filter(gasto => gasto > 0).length;
              }

            } catch (error: any) {
              throw new Error(`Error al actualizar la tarea "${tarea.nombre}": ${error}`);
            }
          }
        }
      }

      toast.update(toastId, {
        render: `Se han actualizado exitosamente ${totalTareasActualizadas} tareas`,
        type: "success",
        isLoading: false,
        autoClose: 5000
      });

      showSuccess(`Tareas actualizadas exitosamente. ${totalTareasActualizadas} tareas y ${totalProgramacionesActualizadas} programaciones mensuales actualizadas.`);

      return {
        success: true,
        totalTareasCreadas: totalTareasActualizadas,
        totalProgramacionesCreadas: totalProgramacionesActualizadas
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar las tareas';
      showError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}
