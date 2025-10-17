import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/lib/db";
import logger from "@/app/lib/logger";

export async function DELETE(req: NextRequest, context: any) {
  try {
    const params = await context.params;
    const id = Number(params.id);
    if (isNaN(id)) {
      logger.error("ID inválido");
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    try {
      // Verificar si hay lugares asociados antes de eliminar
      const lugaresAsociados = await query.all<{ count: number }>(
        "SELECT COUNT(*) as count FROM lugar WHERE fk_id_tipo_lugar = ?;",
        [id]
      );

      if (lugaresAsociados[0]?.count > 0) {
        logger.error("No se puede eliminar el tipo de lugar porque tiene lugares asociados.");
        return NextResponse.json({
          message: "No se puede eliminar el tipo de lugar porque tiene lugares asociados.",
        }, { status: 400 });
      }

      // Intentar eliminar el tipo de lugar
      await query.run("DELETE FROM tipo_lugar WHERE id_tipo_lugar = ?;", [id]);
      logger.info(`Tipo de lugar eliminado ID: ${id}`);
      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
      if (error.code === "SQLITE_CONSTRAINT") {
        logger.error("No se puede eliminar el tipo de lugar debido a restricciones de la base de datos.");
        return NextResponse.json({
          message: "No se puede eliminar el tipo de lugar debido a restricciones de la base de datos.",
        }, { status: 400 });
      }
      throw error; // Re-lanzar otros errores
    }
  } catch (err) {
    logger.error("Error general en el endpoint DELETE:", err);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
