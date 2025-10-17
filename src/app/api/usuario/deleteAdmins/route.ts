import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/lib/db";
import logger from "@/app/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id_usuario } = body;

    if (!id_usuario) {
      logger.error("Falta id_usuario");
      return NextResponse.json({ success: false, message: "Falta id_usuario" }, { status: 400 });
    }

    await query.run("DELETE FROM usuario WHERE id_usuario = ?", [id_usuario]);
    logger.info(`Usuario eliminado ID: ${id_usuario}`);
    return NextResponse.json({ success: true, message: "Usuario eliminado correctamente" });
  } catch (err) {
    logger.error("Error al eliminar usuario:", err);
    return NextResponse.json({ success: false, message: "Error al eliminar usuario" }, { status: 500 });
  }
}
