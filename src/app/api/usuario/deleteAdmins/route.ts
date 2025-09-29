import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id_usuario } = body;

    if (!id_usuario) {
      return NextResponse.json({ success: false, message: "Falta id_usuario" }, { status: 400 });
    }

    await query.run("DELETE FROM usuario WHERE id_usuario = ?", [id_usuario]);

    return NextResponse.json({ success: true, message: "Usuario eliminado correctamente" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Error al eliminar usuario" }, { status: 500 });
  }
}
