import { useState, useEffect, useRef } from 'react';
import { Proyecto, TipoProyecto, Departamento } from '../interfaces/project';
import { EstadoPOA, TipoPOA, PoaCreate, POA } from '../interfaces/poa';
import { Periodo, PeriodoCreate } from '../interfaces/periodo';
import { poaAPI } from '../api/poaAPI';
import { periodoAPI } from '../api/periodoAPI';
import { projectAPI } from '../api/projectAPI';
import { sanitizeInput, sanitizeForSubmit } from '../utils/sanitizer';
import { presupuestoAPI, PresupuestoProyecto } from '../api/presupuestoAPI';

interface UsePOAFormProps {
  initialProyecto?: Proyecto | null;
  initialPeriodos?: Periodo[];
  isEditing?: boolean;
}

export const usePOAForm = ({ initialProyecto, initialPeriodos = [], isEditing = false }: UsePOAFormProps) => {
  // Estados para campos del formulario con sanitización
  const [id_proyecto, setIdProyecto] = useState('');
  const [id_tipo_poa, setIdTipoPoa] = useState('');
  const [codigo_poa_base, setCodigoPoaBaseInternal] = useState('');

  // Setter sanitizado para código POA
  /**
 * Objetivo:
 * Sanitizar la entrada de texto para evitar inyección de código y datos maliciosos antes de
 *  almacenarlos en estado.
 *
 * Parámetros:
 * value - string: Valor de entrada capturado por el usuario.
 *
 * Operación:
 * - Aplica la función `sanitizeInput` para limpiar el valor.
 * - Actualiza el estado con el valor sanitizado.
 */
  const setCodigoPoaBase = (value: string) => setCodigoPoaBaseInternal(sanitizeInput(value));

  // Estado para periodos seleccionados
  const [periodosSeleccionados, setPeriodosSeleccionados] = useState<Periodo[]>(initialPeriodos);
  const [periodoActual, setPeriodoActual] = useState<number>(0);

  // Estados para campos específicos por periodo
  const [presupuestoPorPeriodo, setPresupuestoPorPeriodo] = useState<{ [key: string]: string }>({});
  const [codigoPorPeriodo, setCodigoPorPeriodo] = useState<{ [key: string]: string }>({});
  const [anioPorPeriodo, setAnioPorPeriodo] = useState<{ [key: string]: string }>({});
  const [anioPorPeriodoError] = useState<{ [key: string]: string }>({});

  // Estados para las listas de opciones
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [estadosPoa, setEstadosPoa] = useState<EstadoPOA[]>([]);
  const [tiposPoa, setTiposPoa] = useState<TipoPOA[]>([]);
  const [tiposProyecto, setTiposProyecto] = useState<TipoProyecto[]>([]);
  const [tipoPoaSeleccionado, setTipoPoaSeleccionado] = useState<TipoPOA | null>(null);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);

  // Estado para el proyecto seleccionado
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(initialProyecto || null);

  // Estado para los periodos calculados del proyecto
  const [periodosCalculados, setPeriodosCalculados] = useState<Periodo[]>([]);

  // Estado para presupuesto
  const [presupuestoRestante, setPresupuestoRestante] = useState<number>(0);
  const [presupuestoError, setPresupuestoError] = useState<string | null>(null);
  const [presupuestoTotalAsignado, setPresupuestoTotalAsignado] = useState<number>(0);
  const [presupuestoProyecto, setPresupuestoProyecto] = useState<PresupuestoProyecto | null>(null);

  // Estado para modal de creación de periodo
  const [showCrearPeriodo, setShowCrearPeriodo] = useState(false);
  const [nuevoPeriodo, setNuevoPeriodo] = useState<Partial<PeriodoCreate>>({
    codigo_periodo: '',
    nombre_periodo: '',
    fecha_inicio: '',
    fecha_fin: '',
    anio: '',
    mes: ''
  });

  // Estados para mostrar mensajes de carga o error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Referencia para el auto-scroll al mensaje de error
  const errorRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al mensaje de error cuando aparece
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }
  }, [error]);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Obtener proyectos desde la API
        const proyectosData = await projectAPI.getProyectos();
        setProyectos(proyectosData);

        // Cargar estados POA desde la API
        const estadosData = await poaAPI.getEstadosPOA();
        setEstadosPoa(estadosData);

        // Cargar tipos POA desde la API
        const tiposData = await poaAPI.getTiposPOA();
        setTiposPoa(tiposData);

        // Cargar tipos de proyecto desde la API
        const tiposProyectoData = await projectAPI.getTiposProyecto();
        setTiposProyecto(tiposProyectoData);

        // Cargar departamentos desde la API
        const departamentosData = await projectAPI.getDepartamentos();
        setDepartamentos(departamentosData);

        // Cargar periodos desde la API
        const periodosData = await periodoAPI.getPeriodos();
        setPeriodos(periodosData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Actualizar presupuesto total asignado cuando cambien los presupuestos por periodo
  useEffect(() => {
    let total = 0;
    Object.values(presupuestoPorPeriodo).forEach(presupuesto => {
      if (presupuesto && !isNaN(parseFloat(presupuesto))) {
        total += parseFloat(presupuesto);
      }
    });

    setPresupuestoTotalAsignado(total);

    if (proyectoSeleccionado) {
      if (isEditing) {
        // En modo edición, calculamos el presupuesto restante excluyendo los POAs que se están editando
        const calcularPresupuestoParaEdicion = async () => {
          try {
            const poasExistentes = await poaAPI.getPOAsByProyecto(proyectoSeleccionado.id_proyecto);

            // En modo edición, excluir los POAs que se están editando actualmente
            const aniosEditandose = new Set(periodosSeleccionados.map(p => p.anio));

            const presupuestoYaGastado = poasExistentes.reduce((totalGastado, poa) => {
              // Solo contar POAs que NO se están editando actualmente
              if (!aniosEditandose.has(poa.anio_ejecucion)) {
                const presupuestoAsignado = parseFloat(poa.presupuesto_asignado?.toString() || '0');
                return totalGastado + (isNaN(presupuestoAsignado) ? 0 : presupuestoAsignado);
              }
              return totalGastado;
            }, 0);

            const presupuestoAprobado = parseFloat(proyectoSeleccionado.presupuesto_aprobado.toString());
            const presupuestoRestanteCalculado = presupuestoAprobado - presupuestoYaGastado - total;

            setPresupuestoRestante(presupuestoRestanteCalculado);
          } catch (error) {
            const presupuestoAprobado = parseFloat(proyectoSeleccionado.presupuesto_aprobado.toString());
            setPresupuestoRestante(presupuestoAprobado - total);
          }
        };

        calcularPresupuestoParaEdicion();
      } else {
        // En modo creación, usamos el cálculo normal
        calcularPresupuestoRestante(proyectoSeleccionado, total)
          .then(({ presupuestoRestante }) => {
            setPresupuestoRestante(presupuestoRestante);
          });
      }
    }
  }, [presupuestoPorPeriodo, proyectoSeleccionado, isEditing, periodosSeleccionados]);

  // Función para determinar el tipo de POA basado en el tipo de proyecto
  const determinarTipoPOA = async (proyecto: Proyecto): Promise<TipoPOA | null> => {
    try {
      const tipoProyecto = tiposProyecto.find(tp => tp.id_tipo_proyecto === proyecto.id_tipo_proyecto);

      if (!tipoProyecto) {
        return null;
      }

      const tipoPOA = await poaAPI.getTipoPOAByTipoProyecto(tipoProyecto.codigo_tipo);

      if (!tipoPOA) {
        return tiposPoa.length > 0 ? tiposPoa[0] : null;
      }

      return tipoPOA;
    } catch (error) {
      return tiposPoa.length > 0 ? tiposPoa[0] : null;
    }
  };

  const calcularPresupuestoRestante = async (proyecto: Proyecto, presupuestoActualAsignado: number = 0) => {
    try {
      const poasExistentes = await poaAPI.getPOAsByProyecto(proyecto.id_proyecto);
      const presupuestoYaGastado = poasExistentes.reduce((total, poa) => {
        const presupuestoAsignado = parseFloat(poa.presupuesto_asignado?.toString() || '0');
        return total + (isNaN(presupuestoAsignado) ? 0 : presupuestoAsignado);
      }, 0);

      const presupuestoAprobado = parseFloat(proyecto.presupuesto_aprobado.toString());
      const presupuestoRestante = presupuestoAprobado - presupuestoYaGastado - presupuestoActualAsignado;

      return {
        presupuestoAprobado,
        presupuestoYaGastado,
        presupuestoRestante
      };
    } catch (error) {
      const presupuestoAprobado = parseFloat(proyecto.presupuesto_aprobado.toString());
      return {
        presupuestoAprobado,
        presupuestoYaGastado: 0,
        presupuestoRestante: presupuestoAprobado - presupuestoActualAsignado
      };
    }
  };


  /**
   * Objetivo:
   * Validar que el proyecto tiene periodos disponibles para asignar nuevos POAs,
   * evitando asignaciones duplicadas y manteniendo la integridad de los datos.
   *
   * Parámetros:
   * proyecto - Proyecto: Objeto proyecto para validar sus periodos y POAs asociados.
   *
   * Operación:
   * - Obtiene POAs existentes del proyecto.
   * - Calcula todos los periodos fiscales del proyecto incluyendo prórrogas.
   * - Compara periodos existentes con los POAs para detectar años ya asignados.
   * - Retorna validación con indicación de años disponibles o razón de bloqueo.
   */
  const validarDisponibilidadProyecto = async (proyecto: Proyecto): Promise<{ esValido: boolean; razon?: string }> => {
    try {
      const poasExistentes = await poaAPI.getPOAsByProyecto(proyecto.id_proyecto);

      if (poasExistentes.length === 0) {
        return { esValido: true };
      }

      const periodosProyecto = calcularPeriodos(proyecto.fecha_inicio, proyecto.fecha_fin);

      let periodosTotales = periodosProyecto;
      if (proyecto.fecha_prorroga_inicio && proyecto.fecha_prorroga_fin) {
        const periodosProrroga = calcularPeriodos(proyecto.fecha_prorroga_inicio, proyecto.fecha_prorroga_fin);
        const aniosExistentes = new Set(periodosProyecto.map(p => p.anio));
        const periodosNuevos = periodosProrroga.filter(p => !aniosExistentes.has(p.anio));
        periodosTotales = [...periodosProyecto, ...periodosNuevos];
      }

      const aniosPOAsExistentes = new Set(poasExistentes.map(poa => poa.anio_ejecucion));
      const aniosTotalesProyecto = new Set(periodosTotales.map(p => p.anio));

      const todosLosAniosCubiertos = [...aniosTotalesProyecto]
        .filter((anio): anio is string => typeof anio === 'string' && anio !== undefined)
        .every(anio => aniosPOAsExistentes.has(anio));

      if (todosLosAniosCubiertos) {
        return {
          esValido: false,
          razon: `Este proyecto ya tiene POAs asignados para todos sus periodos (${[...aniosPOAsExistentes].sort().join(', ')})`
        };
      }

      const aniosFaltantes = [...aniosTotalesProyecto]
        .filter((anio): anio is string => typeof anio === 'string' && anio !== undefined)
        .filter(anio => !aniosPOAsExistentes.has(anio));
      return {
        esValido: true,
        razon: `Periodos disponibles: ${aniosFaltantes.sort().join(', ')}`
      };

    } catch (error) {
      return { esValido: true, razon: 'Error al validar, proceder con precaución' };
    }
  };

  // Nueva función de validación para edición - solo permite proyectos CON POAs existentes
  /**
 * Objetivo:
 * Validar que el proyecto a editar tiene POAs existentes para evitar editar proyectos sin POAs.
 *
 * Parámetros:
 * proyecto - Proyecto: Proyecto a validar.
 *
 * Operación:
 * - Obtiene POAs existentes asociados al proyecto.
 * - Verifica si hay POAs para edición.
 * - Retorna objeto indicando si es válido editar y razón en caso contrario.
 */
  const validarProyectoParaEdicion = async (proyecto: Proyecto): Promise<{ esValido: boolean; razon?: string }> => {
    try {
      const poasExistentes = await poaAPI.getPOAsByProyecto(proyecto.id_proyecto);

      // En edición, el proyecto DEBE tener POAs existentes
      if (poasExistentes.length === 0) {
        return {
          esValido: false,
          razon: 'Este proyecto no tiene POAs creados para editar'
        };
      }

      // Si tiene POAs, mostrar cuáles están disponibles para editar
      const aniosPOAsExistentes = [...new Set(poasExistentes.map(poa => poa.anio_ejecucion))].sort();
      return {
        esValido: true,
        razon: `POAs disponibles para editar: ${aniosPOAsExistentes.join(', ')}`
      };

    } catch (error) {
      return { esValido: false, razon: 'Error al validar el proyecto' };
    }
  };

  // Calcular periodos fiscales basados en las fechas del proyecto
  const calcularPeriodos = (fechaInicio: string, fechaFin: string): Periodo[] => {
    if (!fechaInicio || !fechaFin) return [];
    const periodos: Periodo[] = [];

    // Parsear fechas como fechas locales (sin timezone) para evitar problemas con UTC
    // Esto garantiza consistencia independiente del timezone del navegador
    const [yearInicio, monthInicio, dayInicio] = fechaInicio.split('-').map(Number);
    const [yearFin, monthFin, dayFin] = fechaFin.split('-').map(Number);

    const fechaInicioObj = new Date(yearInicio, monthInicio - 1, dayInicio);
    const fechaFinObj = new Date(yearFin, monthFin - 1, dayFin);

    const anioInicio = fechaInicioObj.getFullYear();
    const anioFin = fechaFinObj.getFullYear();

    for (let anio = anioInicio; anio <= anioFin; anio++) {
      let periodoInicio: Date;
      let periodoFin: Date;

      if (anio === anioInicio) {
        periodoInicio = new Date(fechaInicioObj);
      } else {
        periodoInicio = new Date(anio, 0, 1);
      }

      if (anio === anioFin) {
        periodoFin = new Date(fechaFinObj);
      } else {
        periodoFin = new Date(anio, 11, 31);
      }

      // Convertir fechas a formato YYYY-MM-DD usando timezone local
      const formatearFechaLocal = (fecha: Date): string => {
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const inicioStr = formatearFechaLocal(periodoInicio);
      const finStr = formatearFechaLocal(periodoFin);

      const mesInicio = periodoInicio.getMonth();
      const mesFin = periodoFin.getMonth();
      const mesesNombres = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      const mesStr = mesInicio === 0 && mesFin === 11
        ? 'Enero-Diciembre'
        : `${mesesNombres[mesInicio]}-${mesesNombres[mesFin]}`;

      periodos.push({
        id_periodo: `temp-${anio}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        codigo_periodo: `PER-${anio}`,
        nombre_periodo: `Periodo Fiscal ${anio}`,
        fecha_inicio: inicioStr,
        fecha_fin: finStr,
        anio: anio.toString(),
        mes: mesStr
      });
    }

    return periodos;
  };

  const filtrarPeriodosDisponibles = (periodosCalculados: Periodo[], poasExistentes: POA[]): Periodo[] => {
    const aniosConPOA = new Set(poasExistentes.map(poa => poa.anio_ejecucion));
    return periodosCalculados.filter(periodo => !aniosConPOA.has(periodo.anio || ''));
  };

  const filtrarPeriodosExistentes = (periodosCalculados: Periodo[], poasExistentes: POA[]): Periodo[] => {
    const aniosConPOA = new Set(poasExistentes.map(poa => poa.anio_ejecucion));
    return periodosCalculados.filter(periodo => aniosConPOA.has(periodo.anio || ''));
  };

  // Seleccionar un proyecto de la búsqueda y establecer datos automáticamente
  const seleccionarProyecto = async (proyecto: Proyecto) => {
    setIdProyecto(proyecto.id_proyecto);
    setProyectoSeleccionado(proyecto);

    try {
      const tipoPOADeterminado = await determinarTipoPOA(proyecto);
      if (tipoPOADeterminado) {
        setIdTipoPoa(tipoPOADeterminado.id_tipo_poa);
        setTipoPoaSeleccionado(tipoPOADeterminado);
      } else {
        setError('No se pudo determinar el tipo de POA adecuado para este proyecto');
      }

      setCodigoPoaBase(`${proyecto.codigo_proyecto}-POA`);

      const poasExistentes = await poaAPI.getPOAsByProyecto(proyecto.id_proyecto);

      // Calcular presupuesto ya gastado diferente según el modo
      let presupuestoYaGastado = 0;
      if (isEditing) {
        // En modo edición, no restamos nada inicialmente porque se calculará dinámicamente
        presupuestoYaGastado = 0;
      } else {
        // En modo creación, restamos todo lo que ya está gastado
        presupuestoYaGastado = poasExistentes.reduce((total, poa) => {
          const presupuestoAsignado = parseFloat(poa.presupuesto_asignado?.toString() || '0');
          return total + (isNaN(presupuestoAsignado) ? 0 : presupuestoAsignado);
        }, 0);
      }

      if (proyecto.presupuesto_aprobado) {
        const presupuestoAprobado = parseFloat(proyecto.presupuesto_aprobado.toString());
        setPresupuestoTotalAsignado(0);
        const presupuestoRestanteCalculado = presupuestoAprobado - presupuestoYaGastado;
        setPresupuestoRestante(presupuestoRestanteCalculado);
      }

      // Calcular todos los períodos del proyecto (principal + prórroga si existe)
      let periodosProyecto: Periodo[] = [];
      if (proyecto.fecha_inicio && proyecto.fecha_fin) {
        periodosProyecto = calcularPeriodos(proyecto.fecha_inicio, proyecto.fecha_fin);

        if (proyecto.fecha_prorroga_inicio && proyecto.fecha_prorroga_fin) {
          const periodosProrroga = calcularPeriodos(proyecto.fecha_prorroga_inicio, proyecto.fecha_prorroga_fin);
          const aniosExistentes = new Set(periodosProyecto.map(p => p.anio));
          const periodosNuevos = periodosProrroga.filter(p => !aniosExistentes.has(p.anio));
          periodosProyecto = [...periodosProyecto, ...periodosNuevos];
        }
      }

      // En modo creación: limpiar selecciones previas
      // En modo edición: poblar con datos existentes
      if (isEditing) {
        // Poblar datos existentes de los POAs
        const presupuestosExistentes: { [key: string]: string } = {};
        const codigosExistentes: { [key: string]: string } = {};
        const aniosExistentes: { [key: string]: string } = {};
        const periodosExistentes: Periodo[] = [];

        poasExistentes.forEach(poa => {
          // Buscar el período correspondiente por año de ejecución
          const periodoCorrespondiente = periodosProyecto.find((p: Periodo) =>
            p.anio === poa.anio_ejecucion
          );

          if (periodoCorrespondiente && periodoCorrespondiente.id_periodo) {
            presupuestosExistentes[periodoCorrespondiente.id_periodo] = poa.presupuesto_asignado?.toString() || '0';
            codigosExistentes[periodoCorrespondiente.id_periodo] = poa.codigo_poa || '';
            aniosExistentes[periodoCorrespondiente.id_periodo] = poa.anio_ejecucion || '';
            periodosExistentes.push(periodoCorrespondiente);
          }
        });

        setPresupuestoPorPeriodo(presupuestosExistentes);
        setCodigoPorPeriodo(codigosExistentes);
        setAnioPorPeriodo(aniosExistentes);
        setPeriodosSeleccionados(periodosExistentes);

        // Calcular presupuesto total asignado basado en datos existentes
        const totalAsignado = Object.values(presupuestosExistentes).reduce((total, presupuesto) => {
          return total + (parseFloat(presupuesto) || 0);
        }, 0);
        setPresupuestoTotalAsignado(totalAsignado);
      } else {
        // Modo creación: limpiar selecciones previas
        setPeriodosSeleccionados([]);
        setPresupuestoPorPeriodo({});
        setCodigoPorPeriodo({});
        setAnioPorPeriodo({});
        setPresupuestoTotalAsignado(0);
      }

      // Determinar qué períodos mostrar según el modo
      if (periodosProyecto.length > 0) {
        // En modo edición, mostramos períodos que ya tienen POAs
        // En modo creación, mostramos períodos disponibles (sin POAs)
        const periodosParaMostrar = isEditing
          ? filtrarPeriodosExistentes(periodosProyecto, poasExistentes)
          : filtrarPeriodosDisponibles(periodosProyecto, poasExistentes);

        setPeriodosCalculados(periodosParaMostrar);
      }
    } catch (err) {
      setError('Error al cargar datos automáticos del proyecto');
    }
  };

  // Seleccionar un periodo para añadirlo a los seleccionados
  const seleccionarPeriodo = (periodo: Periodo) => {
    const yaSeleccionado = periodosSeleccionados.some(p => p.id_periodo === periodo.id_periodo);

    if (!yaSeleccionado) {
      const nuevosSeleccionados = [...periodosSeleccionados, periodo];
      setPeriodosSeleccionados(nuevosSeleccionados);

      setPresupuestoPorPeriodo({
        ...presupuestoPorPeriodo,
        [periodo.id_periodo]: ''
      });

      setCodigoPorPeriodo({
        ...codigoPorPeriodo,
        [periodo.id_periodo]: `${codigo_poa_base}-${periodo.anio || ''}`
      });

      setAnioPorPeriodo({
        ...anioPorPeriodo,
        [periodo.id_periodo]: periodo.anio || ''
      });

      setPeriodoActual(nuevosSeleccionados.length - 1);
    }
  };

  // Quitar un periodo de los seleccionados
  const quitarPeriodo = (index: number) => {
    const nuevosSeleccionados = [...periodosSeleccionados];
    nuevosSeleccionados.splice(index, 1);

    setPeriodosSeleccionados(nuevosSeleccionados);

    if (periodoActual >= nuevosSeleccionados.length && nuevosSeleccionados.length > 0) {
      setPeriodoActual(nuevosSeleccionados.length - 1);
    } else if (nuevosSeleccionados.length === 0) {
      setPeriodoActual(-1);
    }
  };

  // Manejar cambios en el presupuesto asignado para un periodo
  /**
 * Objetivo:
 * Validar y controlar los cambios en el campo de presupuesto por periodo para evitar valores inválidos
 * o que excedan el presupuesto aprobado, previniendo errores lógicos y vulnerabilidades.
 *
 * Parámetros:
 * e - React.ChangeEvent<HTMLInputElement>: Evento del cambio en el input.
 * idPeriodo - string: Identificador del periodo para asociar el presupuesto.
 *
 * Operación:
 * - Valida que solo se permitan números positivos con hasta dos decimales.
 * - Bloquea caracteres no numéricos o negativos.
 * - Calcula el total de presupuestos asignados y compara contra el presupuesto aprobado.
 * - Actualiza el estado y mensajes de error según validaciones.
 */

  const handlePresupuestoChange = (e: React.ChangeEvent<HTMLInputElement>, idPeriodo: string) => {
    const valor = e.target.value;

    if (valor === '') {
      setPresupuestoPorPeriodo({
        ...presupuestoPorPeriodo,
        [idPeriodo]: ''
      });
      setPresupuestoError(null);
      return;
    }

    if (/[a-zA-Z]|[^\d.-]/.test(valor)) {
      setPresupuestoError('Solo se permiten números y punto decimal');
      return;
    }

    if (valor.startsWith('-') || parseFloat(valor) <= 0) {
      setPresupuestoPorPeriodo({
        ...presupuestoPorPeriodo,
        [idPeriodo]: valor
      });
      setPresupuestoError('El presupuesto debe ser un valor positivo');
      return;
    }

    const regex = /^\d+(\.\d{0,2})?$/;
    if (!regex.test(valor)) {
      return;
    }

    const valorNumerico = parseFloat(valor);
    const presupuestoActual = proyectoSeleccionado?.presupuesto_aprobado ?
      parseFloat(proyectoSeleccionado.presupuesto_aprobado.toString()) : 0;

    let totalOtrosPeriodos = 0;
    Object.entries(presupuestoPorPeriodo).forEach(([id, presupuesto]) => {
      if (id !== idPeriodo && presupuesto && !isNaN(parseFloat(presupuesto))) {
        totalOtrosPeriodos += parseFloat(presupuesto);
      }
    });

    if (totalOtrosPeriodos + valorNumerico > presupuestoActual) {
      setPresupuestoError(`El total asignado excedería el presupuesto aprobado de ${presupuestoActual.toLocaleString('es-CO')}`);
    } else {
      setPresupuestoError(null);
    }

    setPresupuestoPorPeriodo({
      ...presupuestoPorPeriodo,
      [idPeriodo]: valor
    });
  };

  // Manejar la apertura del modal de creación de periodo
  const handleAbrirModalPeriodo = () => {
    const hoy = new Date();
    const inicioAnio = new Date(hoy.getFullYear(), 0, 1).toISOString().split('T')[0];
    const finAnio = new Date(hoy.getFullYear(), 11, 31).toISOString().split('T')[0];

    setNuevoPeriodo({
      codigo_periodo: `PER-${hoy.getFullYear()}-${Math.floor(Math.random() * 999) + 1}`,
      nombre_periodo: `Periodo Fiscal ${hoy.getFullYear()}`,
      fecha_inicio: inicioAnio,
      fecha_fin: finAnio,
      anio: hoy.getFullYear().toString(),
      mes: 'Enero-Diciembre'
    });

    setShowCrearPeriodo(true);
  };

  // Manejar cambios en el formulario de nuevo periodo
  const handleChangePeriodo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNuevoPeriodo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Guardar nuevo periodo
  const handleGuardarPeriodo = async () => {
    if (!nuevoPeriodo.codigo_periodo || !nuevoPeriodo.nombre_periodo || !nuevoPeriodo.fecha_inicio || !nuevoPeriodo.fecha_fin) {
      alert('Todos los campos son obligatorios');
      return;
    }

    try {
      setIsLoading(true);

      const periodoData: PeriodoCreate = {
        codigo_periodo: nuevoPeriodo.codigo_periodo!,
        nombre_periodo: nuevoPeriodo.nombre_periodo!,
        fecha_inicio: nuevoPeriodo.fecha_inicio!,
        fecha_fin: nuevoPeriodo.fecha_fin!,
        anio: nuevoPeriodo.anio || new Date(nuevoPeriodo.fecha_inicio!).getFullYear().toString(),
        mes: nuevoPeriodo.mes || 'Enero-Diciembre'
      };

      const periodoCreado = await periodoAPI.crearPeriodo(periodoData);

      setPeriodos(prevPeriodos => [...prevPeriodos, periodoCreado]);
      setShowCrearPeriodo(false);
      seleccionarPeriodo(periodoCreado);

      alert('Periodo creado con éxito');
    } catch (err) {
      alert('Error al crear periodo: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar el envío del formulario
  const handleSubmit = async (justificacion?: string): Promise<boolean> => {
    // Validaciones básicas
    if (!id_proyecto || !id_tipo_poa || periodosSeleccionados.length === 0) {
      setError('Debe seleccionar un proyecto, un tipo de POA y al menos un periodo');
      return false;
    }

    const periodosSinPresupuesto = periodosSeleccionados.some(
      p => !presupuestoPorPeriodo[p.id_periodo] || parseFloat(presupuestoPorPeriodo[p.id_periodo]) <= 0
    );

    if (periodosSinPresupuesto) {
      setError('Todos los periodos seleccionados deben tener un presupuesto asignado');
      return false;
    }

    if (proyectoSeleccionado && presupuestoTotalAsignado > parseFloat(proyectoSeleccionado.presupuesto_aprobado.toString())) {
      setError('El presupuesto total asignado excede el presupuesto aprobado del proyecto');
      return false;
    }

    // Validar justificación si es edición
    if (isEditing) {
      if (!justificacion || justificacion.trim().length < 10) {
        setError('Se requiere una justificación válida para editar el POA (mínimo 10 caracteres)');
        return false;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isEditing) {
        // Modo edición: actualizar POAs existentes
        return await handleEditarPOAs(justificacion!);
      } else {
        // Modo creación: crear nuevos POAs
        return await handleCrearPOAs();
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setIsLoading(false);
      return false;
    }
  };

  // Función para manejar la edición de POAs existentes
  /**
 * Objetivo:
 * Manejar la edición segura de POAs existentes, validando la existencia previa
 * y sanitizando datos antes de actualizar en backend.
 *
 * Parámetros: Ninguno (usa estados y datos seleccionados).
 *
 * Operación:
 * - Obtiene POAs existentes para el proyecto.
 * - Para cada periodo seleccionado, busca POA correspondiente y actualiza con datos sanitizados.
 * - Usa try/catch para capturar errores y evitar fallos inesperados.
 * - Maneja el estado de error y carga para evitar condiciones de carrera o inconsistencias.
 */
  const handleEditarPOAs = async (justificacion: string): Promise<boolean> => {
    try {
      const poasExistentes = await poaAPI.getPOAsByProyecto(id_proyecto);
      const poasEditados = [];

      for (const periodo of periodosSeleccionados) {
        try {
          // Buscar el POA existente que corresponde a este período por año
          const poaExistente = poasExistentes.find(poa => poa.anio_ejecucion === periodo.anio);

          if (!poaExistente) {
            setError(`No se encontró POA existente para el año ${periodo.anio}`);
            return false;
          }

          // Necesitamos usar el período real del POA existente, no el temporal
          const idPeriodoFinal = poaExistente.id_periodo; // El POA ya tiene el UUID real del período


          /**
           * Objetivo:
           * Sanitizar el código POA justo antes de enviarlo al backend para prevenir inyección
           * y asegurar la integridad de los datos enviados.
           *
           * Parámetros:
           * codigo - string: Código POA capturado o generado.
           *
           * Operación:
           * - Aplica `sanitizeForSubmit` para limpiar caracteres peligrosos.
           * - Utiliza el valor sanitizado en el objeto enviado a la API.
           */

          const codigoPoa = sanitizeForSubmit(codigoPorPeriodo[periodo.id_periodo] || poaExistente.codigo_poa);

          const datosActualizacion: PoaCreate = {
            id_proyecto,
            id_periodo: idPeriodoFinal,
            codigo_poa: codigoPoa,
            id_tipo_poa,
            anio_ejecucion: anioPorPeriodo[periodo.id_periodo] || poaExistente.anio_ejecucion || periodo.anio || '',
            presupuesto_asignado: parseFloat(presupuestoPorPeriodo[periodo.id_periodo]),
            fecha_creacion: poaExistente.fecha_creacion,
            id_estado_poa: poaExistente.id_estado_poa
          };

          const poaEditado = await poaAPI.editarPOA(poaExistente.id_poa, datosActualizacion, justificacion);
          poasEditados.push(poaEditado);
        } catch (err: any) {
          // Capturar el mensaje del backend si es un error HTTP 400
          const errorMessage = err?.response?.data?.detail || err?.message || 'Error desconocido';
          setError(`Error al editar POA: ${errorMessage}`);
          return false;
        }
      }

      if (poasEditados.length > 0) {
        alert(`Se actualizaron ${poasEditados.length} POAs correctamente`);
        return true;
      } else {
        setError('No se pudo actualizar ningún POA.');
        return false;
      }
    } catch (err: any) {
      // Capturar el mensaje del backend si es un error HTTP
      const errorMessage = err?.response?.data?.detail || err?.message || 'Error desconocido';
      setError(`Error al editar POAs: ${errorMessage}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar la creación de nuevos POAs
  /**
 * Objetivo:
 * Manejar la creación segura de nuevos POAs evitando duplicados y asegurando que
 * los datos enviados cumplen con las validaciones del frontend.
 *
 * Parámetros: Ninguno (usa estados y datos seleccionados).
 *
 * Operación:
 * - Verifica si existen periodos temporales y los crea en backend si no existen.
 * - Sanitiza códigos y datos antes de enviar.
 * - Usa bloques try/catch para capturar errores y prevenir fallos inesperados.
 * - Actualiza estados de carga y error para controlar la UI y evitar race conditions.
 */
  const handleCrearPOAs = async (): Promise<boolean> => {
    try {
      const poaCreados = [];
      const mapeoIdsPeriodos = new Map();
      const periodosACrear = periodosSeleccionados.filter(p => p.id_periodo.startsWith('temp-'));

      if (periodosACrear.length > 0) {
        for (const periodo of periodosACrear) {
          try {
            const anio = periodo.anio || new Date().getFullYear().toString();
            const codigoProyectoNormalizado = proyectoSeleccionado?.codigo_proyecto
              ? proyectoSeleccionado.codigo_proyecto
                .replace(/\s+/g, '')
                .replace(/[^a-zA-Z]/g, '')
                .toUpperCase() + Math.floor(10000 + Math.random() * 90000)
              : '';

            const nuevoCodigo = `P-${anio}-${codigoProyectoNormalizado}`;

            const todosPeriodos = await periodoAPI.getPeriodos();
            const periodoExistente = todosPeriodos.find(p => p.codigo_periodo === nuevoCodigo);

            if (periodoExistente) {
              mapeoIdsPeriodos.set(periodo.id_periodo, periodoExistente.id_periodo);
              continue;
            }

            const periodoData: PeriodoCreate = {
              codigo_periodo: `P-${anio}-${codigoProyectoNormalizado}`,
              nombre_periodo: periodo.nombre_periodo,
              fecha_inicio: periodo.fecha_inicio,
              fecha_fin: periodo.fecha_fin,
              anio: anio,
              mes: periodo.mes || 'Enero-Diciembre'
            };

            const periodoCreado = await periodoAPI.crearPeriodo(periodoData);
            mapeoIdsPeriodos.set(periodo.id_periodo, periodoCreado.id_periodo);
          } catch (err) {
            setError(`Error al crear periodo ${periodo.nombre_periodo}: ${err instanceof Error ? err.message : 'Error desconocido'}`);
            return false;
          }
        }
      }

      for (const periodo of periodosSeleccionados) {
        try {
          let periodoId = periodo.id_periodo;
          if (periodo.id_periodo.startsWith('temp-')) {
            periodoId = mapeoIdsPeriodos.get(periodo.id_periodo);
            if (!periodoId) {
              continue;
            }
          }

          try {
            await periodoAPI.getPeriodo(periodoId);
          } catch (err) {
            setError(`El periodo ${periodo.nombre_periodo} no existe en la base de datos`);
            return false;
          }

          const timestamp = new Date().getTime();
          const codigoPoa = codigoPorPeriodo[periodo.id_periodo] ||
            `${codigo_poa_base}-${periodo.anio || ''}-${timestamp.toString().slice(-5)}`;

          const datosPOA: PoaCreate = {
            id_proyecto,
            id_tipo_poa,
            codigo_poa: sanitizeForSubmit(codigoPoa),
            anio_ejecucion: anioPorPeriodo[periodo.id_periodo] || periodo.anio || '',
            presupuesto_asignado: parseFloat(presupuestoPorPeriodo[periodo.id_periodo]),
            id_periodo: periodoId,
            fecha_creacion: new Date().toISOString().split('Z')[0],
            id_estado_poa: estadosPoa.length > 0 ? estadosPoa[0].id_estado_poa : ''
          };

          const nuevoPOA = await poaAPI.crearPOA(datosPOA);
          poaCreados.push(nuevoPOA);
        } catch (err: any) {
          // Capturar el mensaje del backend si es un error HTTP 400
          const errorMessage = err?.response?.data?.detail || err?.message || 'Error desconocido';
          setError(`Error al crear POA: ${errorMessage}`);
          return false;
        }
      }

      if (poaCreados.length > 0) {
        alert(`Se crearon ${poaCreados.length} POAs correctamente`);
        return true;
      } else {
        setError('No se pudo crear ningún POA. Revise los logs para más detalles.');
        return false;
      }
    } catch (err: any) {
      // Capturar el mensaje del backend si es un error HTTP 400
      const errorMessage = err?.response?.data?.detail || err?.message || 'Error desconocido';
      setError(`Error al crear POAs: ${errorMessage}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar información de presupuesto del proyecto
  const cargarPresupuestoProyecto = async (id_proyecto: string) => {
    try {
      const datos = await presupuestoAPI.getPresupuestoProyecto(id_proyecto);
      setPresupuestoProyecto(datos);
      // También actualizar el presupuesto restante con los datos del servidor
      setPresupuestoRestante(datos.presupuesto_disponible);
    } catch (err) {
      console.error('Error al cargar presupuesto del proyecto:', err);
      // No mostrar error al usuario, es información auxiliar
    }
  };

  // Cargar presupuesto cuando se selecciona un proyecto
  useEffect(() => {
    if (proyectoSeleccionado?.id_proyecto) {
      cargarPresupuestoProyecto(proyectoSeleccionado.id_proyecto);
    }
  }, [proyectoSeleccionado?.id_proyecto]);

  return {
    // Estados del formulario
    id_proyecto,
    setIdProyecto,
    id_tipo_poa,
    setIdTipoPoa,
    codigo_poa_base,
    setCodigoPoaBase,

    // Periodos
    periodosSeleccionados,
    setPeriodosSeleccionados,
    periodoActual,
    setPeriodoActual,
    periodosCalculados,
    setPeriodosCalculados,

    // Campos por periodo
    presupuestoPorPeriodo,
    setPresupuestoPorPeriodo,
    codigoPorPeriodo,
    setCodigoPorPeriodo,
    anioPorPeriodo,
    setAnioPorPeriodo,
    anioPorPeriodoError,

    // Listas de opciones
    proyectos,
    setProyectos,
    periodos,
    setPeriodos,
    estadosPoa,
    setEstadosPoa,
    tiposPoa,
    setTiposPoa,
    tiposProyecto,
    setTiposProyecto,
    tipoPoaSeleccionado,
    setTipoPoaSeleccionado,
    departamentos,
    setDepartamentos,

    // Proyecto seleccionado
    proyectoSeleccionado,
    setProyectoSeleccionado,

    // Presupuesto
    presupuestoRestante,
    setPresupuestoRestante,
    presupuestoError,
    setPresupuestoError,
    presupuestoTotalAsignado,
    setPresupuestoTotalAsignado,
    presupuestoProyecto,
    cargarPresupuestoProyecto,

    // Modal de periodo
    showCrearPeriodo,
    setShowCrearPeriodo,
    nuevoPeriodo,
    setNuevoPeriodo,

    // Estados de carga y error
    isLoading,
    setIsLoading,
    error,
    setError,
    errorRef,

    // Funciones
    seleccionarProyecto,
    seleccionarPeriodo,
    quitarPeriodo,
    handlePresupuestoChange,
    handleAbrirModalPeriodo,
    handleChangePeriodo,
    handleGuardarPeriodo,
    handleSubmit,
    validarDisponibilidadProyecto,
    validarProyectoParaEdicion, // Nueva función para edición
    calcularPeriodos,
    filtrarPeriodosDisponibles
  };
};
