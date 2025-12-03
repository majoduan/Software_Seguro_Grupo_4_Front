// utils/asignarCantidad.ts
import { TareaForm } from '../interfaces/tarea';

/* Asignar Cantidad - Utilidad de Servicios Profesionales
 *
 * NOTA: Los precios predefinidos ahora se gestionan desde el backend en la tabla DETALLE_TAREA.
 * Este archivo se mantiene únicamente para verificar si una tarea requiere precio bloqueado.
 *
 * Objetivo:
 * - Detectar si una tarea corresponde a "Contratación de servicios profesionales"
 * - Aplicar comportamiento especial en el UI (campo precio readonly con icono de candado)
 *
 * Migración realizada: Los precios se obtienen del campo DetalleTarea.precio_unitario
 * desde el backend, eliminando el mapeo hardcodeado en el frontend.
 */

/**
 * Verifica si una tarea corresponde a "Contratación de servicios profesionales"
 *
 * Uso: Esta función se utiliza para determinar si el campo precio_unitario
 * debe ser readonly en el formulario de tareas (TareaModal.tsx)
 */
export const esContratacionServiciosProfesionales = (tarea: TareaForm | null): boolean => {
  if (!tarea || !tarea.detalle) return false;

  const nombreDetalle = tarea.detalle.nombre.toLowerCase();
  return nombreDetalle.includes('contratación de servicios profesionales') ||
         nombreDetalle === 'contratación de servicios profesionales';
};