import { DetalleTarea, ItemPresupuestario } from '../interfaces/tarea';

// Función para obtener el número de tarea según el tipo de POA;

/**
 * Obtiene el número de tarea específico según el tipo de POA
 * objetivo: Extraer el número de tarea correcto de la cadena de características
 * parametros:
 *   detalleTarea: Objeto DetalleTarea con propiedad 'caracteristicas'
 *   tipoPoa: Tipo de POA (PIM, PTT, PVIF, etc.)
 * operacion
 *   -Valida entrada y estructura de características
 *   -Selecciona índice según tipo de POA
 *   -Retorna número correspondiente
 */
export const obtenerNumeroTarea = (detalleTarea: DetalleTarea, tipoPoa: string): string => {
  if (!detalleTarea || !detalleTarea.caracteristicas) return '';

  const numeros = detalleTarea.caracteristicas.split('; ');

  if (numeros.length !== 3) return '';

  let indice = 0;
  switch (tipoPoa) {
    case 'PIM':
      indice = 0;
      break;
    case 'PTT':
      indice = 1;
      break;
    case 'PVIF':
    case 'PVIS':
    case 'PIGR':
    case 'PIS':
    case 'PIIF':
      indice = 2;
      break;
    default:
      indice = 2;
  }

  const numero = numeros[indice];
  return numero === '0' ? '' : numero;
};

// Función para mapear códigos de actividad a números según el tipo de POA
/* Mapea códigos de actividad a números según tipo de POA
 * objetivo: Normalizar códigos de actividad a números simples
 * parametros:
 *   codigoActividad: Código original
 *   tipoPoa: Tipo de POA para seleccionar mapeo
 * operacion:
 *   - Usa diccionario de mapeo predefinido por tipo POA
 *   - Fallback a extracción básica si no encuentra en diccionario
 */
export const mapearCodigoActividadANumero = (codigoActividad: string, tipoPoa: string): string => {
  const mapeos: { [key: string]: { [key: string]: string } } = {
    'PIM': {
      'ACT-PIM-1': '1', 'ACT-PIM-2': '2', 'ACT-PIM-3': '3', 'ACT-PIM-4': '4', 'ACT-PIM-5': '5', 'ACT-PIM-6': '6',
      'ACT-PIM-7': '7', 'ACT-PIM-8': '8', 'ACT-PIM-9': '9', 'ACT-PIM-10': '10', 'ACT-PIM-11': '11', 'ACT-PIM-12': '12'
    },
    'PTT': {
      'ACT-PTT-1': '1', 'ACT-PTT-2': '2', 'ACT-PTT-3': '3', 'ACT-PTT-4': '4',
      'ACT-PTT-5': '5', 'ACT-PTT-6': '6', 'ACT-PTT-7': '7', 'ACT-PTT-8': '8'
    },
    'PVIF': {
      'ACT-1': '1', 'ACT-2': '2', 'ACT-3': '3', 'ACT-4': '4',
      'ACT-5': '5', 'ACT-6': '6', 'ACT-7': '7', 'ACT-8': '8'
    },
    'PVIS': {
      'ACT-1': '1', 'ACT-2': '2', 'ACT-3': '3', 'ACT-4': '4',
      'ACT-5': '5', 'ACT-6': '6', 'ACT-7': '7', 'ACT-8': '8'
    },
    'PIGR': {
      'ACT-1': '1', 'ACT-2': '2', 'ACT-3': '3', 'ACT-4': '4',
      'ACT-5': '5', 'ACT-6': '6', 'ACT-7': '7', 'ACT-8': '8'
    },
    'PIS': {
      'ACT-1': '1', 'ACT-2': '2', 'ACT-3': '3', 'ACT-4': '4',
      'ACT-5': '5', 'ACT-6': '6', 'ACT-7': '7', 'ACT-8': '8'
    },
    'PIIF': {
      'ACT-1': '1', 'ACT-2': '2', 'ACT-3': '3', 'ACT-4': '4',
      'ACT-5': '5', 'ACT-6': '6', 'ACT-7': '7', 'ACT-8': '8'
    }
  };

  return mapeos[tipoPoa]?.[codigoActividad] || obtenerNumeroActividad(codigoActividad);
};

// Función para obtener el número de actividad del código de actividad
/**
 * Extrae número de actividad de código
 * objetivo: Obtener último segmento numérico de códigos de actividad
 * parametros: codigoActividad: Código completo (ej: 'ACT-PTT-3')
 * operacion: Divide por guiones y retorna último segmento
 */
export const obtenerNumeroActividad = (codigoActividad: string): string => {
  if (codigoActividad.includes('PIM')) {
    const partes = codigoActividad.split('-');
    return partes[partes.length - 1] || '';
  } else if (codigoActividad.includes('PTT')) {
    const partes = codigoActividad.split('-');
    return partes[partes.length - 1] || '';
  } else {
    const partes = codigoActividad.split('-');
    return partes[partes.length - 1] || '';
  }
};

// Función para filtrar detalles de tarea según la actividad y tipo de POA
/* Filtra detalles de tarea por actividad con carga asíncrona
 * objetivo: Filtrar y ordenar tareas según actividad específica
 * parametros:
 *   detallesTarea: Lista de detalles de tarea
 *   codigoActividad: Código de actividad para filtrar
 *   tipoPoa: Tipo de POA para interpretar números
 *   getItemPresupuestarioPorId: Función async para obtener items
 * operacion:
 *   - Convierte código actividad a número
 *   - Paraleliza carga de items presupuestarios
 *   - Filtra tareas que coincidan con jerarquía de actividad
 *   - Ordena resultados por número de tarea
 
 */
export const filtrarDetallesPorActividadConConsultas = async (
  detallesTarea: DetalleTarea[],
  codigoActividad: string,
  tipoPoa: string,
  getItemPresupuestarioPorId: (id: string) => Promise<ItemPresupuestario>
): Promise<DetalleTarea[]> => {
  const numeroActividad = mapearCodigoActividadANumero(codigoActividad, tipoPoa);

  if (!numeroActividad || !/^\d+$/.test(numeroActividad)) {
    return detallesTarea;
  }

  const detallesConItems = await Promise.allSettled(
    detallesTarea.map(async (detalle, index) => {
      try {
        const itemPresupuestario = await getItemPresupuestarioPorId(detalle.id_item_presupuestario);

        if (!detalle.caracteristicas || typeof detalle.caracteristicas !== 'string') {
          return { detalle, incluir: false, itemPresupuestario: null };
        }

        const numeros = detalle.caracteristicas.split('; ');

        if (numeros.length !== 3) {
          return { detalle, incluir: false, itemPresupuestario };
        }

        let indice = 0;
        switch (tipoPoa) {
          case 'PIM':
            indice = 0;
            break;
          case 'PTT':
            indice = 1;
            break;
          case 'PVIF':
          case 'PVIS':
          case 'PIGR':
          case 'PIS':
          case 'PIIF':
            indice = 2;
            break;
          default:
            indice = 2;
        }

        const numeroTarea = numeros[indice];

        if (numeroTarea === '0') {
          return { detalle, incluir: false, itemPresupuestario };
        }

        const coincide = numeroTarea.startsWith(numeroActividad + '.');

        if (coincide) {
          const detalleEspecifico = {
            ...detalle,
            item_presupuestario: itemPresupuestario,
            numero_tarea_especifica: numeroTarea
          };

          return { detalle: detalleEspecifico, incluir: true, itemPresupuestario, numeroTarea };
        }

        return { detalle, incluir: false, itemPresupuestario, numeroTarea };

      } catch (error) {
        return { detalle, incluir: false, itemPresupuestario: null, error };
      }
    })
  );

  const filtrados = detallesConItems
    .filter(result => result.status === 'fulfilled' && result.value.incluir)
    .map(result => (result as PromiseFulfilledResult<any>).value);


  const filtradosOrdenados = filtrados.sort((a, b) => {
    const valorA = parseFloat(a.numeroTarea);
    const valorB = parseFloat(b.numeroTarea);
    return valorA - valorB;
  });

  return filtradosOrdenados.map(item => item.detalle);
};

// Función para agrupar detalles de tarea con el mismo nombre y item presupuestario
/* Agrupa detalles duplicados consolidando items
 * objetivo: Reducir duplicados y consolidar información relacionada
 * parametros:
 *   detallesFiltrados: Lista filtrada de detalles
 *   getItemPresupuestarioPorId: Función async para obtener items
 * operacion:
 *  -Agrupa por nombre+descripción y consolida items
 *  -Agrupa por nombre+item y maneja descripciones múltiples

 */
export const agruparDetallesDuplicados = async (
  detallesFiltrados: DetalleTarea[],
  getItemPresupuestarioPorId: (id: string) => Promise<ItemPresupuestario>
): Promise<DetalleTarea[]> => {
  // PRIMERA FASE: Agrupar por nombre y descripción
  const gruposPorNombre = new Map<string, DetalleTarea[]>();

  detallesFiltrados.forEach(detalle => {
    const clave = `${detalle.nombre}|${detalle.descripcion || ''}`;
    if (!gruposPorNombre.has(clave)) {
      gruposPorNombre.set(clave, []);
    }
    gruposPorNombre.get(clave)!.push(detalle);
  });

  const detallesConItemsProcessados: DetalleTarea[] = [];

  for (const [, detallesGrupo] of gruposPorNombre.entries()) {
    if (detallesGrupo.length === 1) {
      const detalle = detallesGrupo[0];
      try {
        const item = await getItemPresupuestarioPorId(detalle.id_item_presupuestario);
        detallesConItemsProcessados.push({
          ...detalle,
          item_presupuestario: item,
          tiene_multiples_items: false
        });
      } catch (error) {
        detallesConItemsProcessados.push({
          ...detalle,
          tiene_multiples_items: false
        });
      }
    } else {
      const items: ItemPresupuestario[] = [];

      for (const detalle of detallesGrupo) {
        try {
          const item = await getItemPresupuestarioPorId(detalle.id_item_presupuestario);
          items.push(item);
        } catch (error) {
          throw error;
        }
      }

      const detalleBase = detallesGrupo[0];
      detallesConItemsProcessados.push({
        ...detalleBase,
        items_presupuestarios: items,
        tiene_multiples_items: true,
        item_presupuestario: items[0]
      });
    }
  }

  // SEGUNDA FASE: Agrupar por nombre e item presupuestario
  const gruposPorNombreEItem = new Map<string, DetalleTarea[]>();

  detallesConItemsProcessados.forEach(detalle => {
    const itemId = detalle.tiene_multiples_items
      ? detalle.items_presupuestarios?.[0]?.id_item_presupuestario || detalle.id_item_presupuestario
      : detalle.id_item_presupuestario;
    const clave = `${detalle.nombre}|${itemId}`;

    if (!gruposPorNombreEItem.has(clave)) {
      gruposPorNombreEItem.set(clave, []);
    }
    gruposPorNombreEItem.get(clave)!.push(detalle);
  });

  const detallesFinales: DetalleTarea[] = [];

  for (const [, detallesGrupo] of gruposPorNombreEItem.entries()) {
    if (detallesGrupo.length === 1) {
      detallesFinales.push({
        ...detallesGrupo[0],
        tiene_multiples_descripciones: false
      });
    } else {
      const descripciones = detallesGrupo
        .map(d => d.descripcion || '')
        .filter((desc, index, arr) => arr.indexOf(desc) === index)
        .filter(desc => desc.trim() !== '');

      if (descripciones.length > 1) {
        const detalleBase = detallesGrupo[0];
        detallesFinales.push({
          ...detalleBase,
          descripciones_disponibles: descripciones,
          tiene_multiples_descripciones: true,
          descripcion: descripciones[0]
        });
      } else {
        detallesFinales.push({
          ...detallesGrupo[0],
          tiene_multiples_descripciones: false
        });
      }
    }
  }

  return detallesFinales;
};
