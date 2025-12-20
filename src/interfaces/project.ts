export interface Proyecto {
  id_proyecto: string;
  codigo_proyecto: string;
  titulo: string;
  id_tipo_proyecto: string;
  id_estado_proyecto: string;
  id_departamento?: string;
  id_director_proyecto: string;
  presupuesto_aprobado: number;
  fecha_creacion: string;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_prorroga: string;
  fecha_prorroga_inicio: string;
  fecha_prorroga_fin: string;
  tiempo_prorroga_meses?: number;
}

export interface TipoProyecto {
  prefijo: any;
  id_tipo_proyecto: string;
  codigo_tipo: string;
  nombre: string;
  descripcion: string;
  duracion_meses: number;
  cantidad_periodos: number;
  presupuesto_maximo: number;
}

export interface EstadoProyecto {
  id_estado_proyecto: string;
  nombre: string;
  descripcion?: string;
}

export interface Departamento {
  id_departamento: string;
  nombre: string;
  descripcion?: string;
}

export interface DepartamentoCreate {
  nombre: string;
  descripcion?: string;
}

export interface DepartamentoUpdate {
  nombre?: string;
  descripcion?: string;
}

export interface DirectorProyecto {
  id_usuario: string;
  nombre_usuario: string;
}

// ==================== Resumen de POAs ====================

export interface ActividadResumen {
  numero_actividad: number | null;
  descripcion_actividad: string;
  total_actividad: number;
}

export interface PoaResumen {
  id_poa: string;
  codigo_poa: string;
  anio_poa: number;
  presupuesto_asignado: number;
  total_gastado: number;
  saldo_disponible: number;
  actividades: ActividadResumen[];
}

export interface ResumenPoas {
  id_proyecto: string;
  codigo_proyecto: string;
  titulo: string;
  poas: PoaResumen[];
  total_proyecto: number;
}