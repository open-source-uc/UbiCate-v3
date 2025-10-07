/**
 * Sistema de Auditoría para Ubicaciones Geográficas
 * Registra todos los cambios realizados en lugares y rutas
 */

import { query } from './db';

export type TipoOperacion = 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR' | 'APROBAR' | 'RECHAZAR';

interface RegistrarHistoricoParams {
  idUbicacion: number;
  nombreUsuario: string;
  tipoOperacion: TipoOperacion;
  nombreElemento: string;
}

/**
 * Genera un mensaje descriptivo dinámico según la operación
 */
function generarMensaje(params: RegistrarHistoricoParams): string {
  const { nombreUsuario, tipoOperacion, nombreElemento } = params;

  const mensajes: Record<TipoOperacion, string> = {
    CREAR: `El usuario ${nombreUsuario} añadió el punto "${nombreElemento}"`,
    ACTUALIZAR: `El usuario ${nombreUsuario} actualizó el punto "${nombreElemento}"`,
    ELIMINAR: `El usuario ${nombreUsuario} eliminó el punto "${nombreElemento}"`,
    APROBAR: `El usuario ${nombreUsuario} aprobó el punto "${nombreElemento}"`,
    RECHAZAR: `El usuario ${nombreUsuario} rechazó el punto "${nombreElemento}"`
  };

  return mensajes[tipoOperacion];
}

/**
 * Registra una operación en el histórico de ubicaciones geográficas
 */
export async function registrarHistorico(params: RegistrarHistoricoParams): Promise<void> {
  const mensaje = generarMensaje(params);

  try {
    await query.run(
      `INSERT INTO historico_ubicacion_geografica 
       (nombre_usuario, tipo_operacion, mensaje, fk_id_ubicacion_geografica, fecha)
       VALUES (?, ?, ?, ?, datetime('now', 'localtime'))`,
      [
        params.nombreUsuario,
        params.tipoOperacion,
        mensaje,
        params.idUbicacion
      ]
    );
  } catch (error) {
    console.error('[AUDIT] Error registrando en histórico:', error);
    // No lanzamos el error para no interrumpir la operación principal
  }
}

/**
 * Obtiene el histórico de una ubicación geográfica específica
 */
export async function obtenerHistorico(idUbicacion: number) {
  try {
    const rows = await query.all<{
      id_historico_ubicacion: number;
      nombre_usuario: string;
      tipo_operacion: string;
      mensaje: string;
      fecha: string;
    }>(
      `SELECT 
        id_historico_ubicacion,
        nombre_usuario,
        tipo_operacion,
        mensaje,
        fecha
       FROM historico_ubicacion_geografica
       WHERE fk_id_ubicacion_geografica = ?
       ORDER BY fecha DESC`,
      [idUbicacion]
    );
    return rows;
  } catch (error) {
    console.error('[AUDIT] Error obteniendo histórico:', error);
    return [];
  }
}

/**
 * Obtiene todo el histórico con paginación
 */
export async function obtenerHistoricoCompleto(
  limit: number = 100,
  offset: number = 0
) {
  try {
    const rows = await query.all<{
      id_historico_ubicacion: number;
      nombre_usuario: string;
      tipo_operacion: string;
      mensaje: string;
      fecha: string;
      id_ubicacion_geografica: number;
      nombre_lugar: string | null;
      nombre_campus: string | null;
    }>(
      `SELECT 
        h.id_historico_ubicacion,
        h.nombre_usuario,
        h.tipo_operacion,
        h.mensaje,
        h.fecha,
        h.fk_id_ubicacion_geografica as id_ubicacion_geografica,
        l.nombre_lugar,
        c.nombre_campus
       FROM historico_ubicacion_geografica h
       LEFT JOIN lugar l ON h.fk_id_ubicacion_geografica = l.fk_id_ubicacion_geografica
       LEFT JOIN campus c ON l.fk_id_campus = c.id_campus
       ORDER BY h.fecha DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows;
  } catch (error) {
    console.error('[AUDIT] Error obteniendo histórico completo:', error);
    return [];
  }
}

/**
 * Obtiene estadísticas del histórico por usuario
 */
export async function obtenerEstadisticasUsuario() {
  try {
    const rows = await query.all<{
      nombre_usuario: string;
      total_cambios: number;
      ultimo_cambio: string;
    }>(
      `SELECT 
        nombre_usuario,
        COUNT(*) as total_cambios,
        MAX(fecha) as ultimo_cambio
       FROM historico_ubicacion_geografica
       GROUP BY nombre_usuario
       ORDER BY total_cambios DESC`
    );
    return rows;
  } catch (error) {
    console.error('[AUDIT] Error obteniendo estadísticas:', error);
    return [];
  }
}
