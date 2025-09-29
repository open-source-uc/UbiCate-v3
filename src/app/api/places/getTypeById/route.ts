import { NextResponse } from "next/server";
import { query } from "@/app/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
  }

  try {
    const result = await query.get(
      "SELECT id_tipo_lugar, nombre_tipo_lugar, icono, color_icono FROM tipo_lugar WHERE id_tipo_lugar = ?",
      [id]
    );

    if (!result) {
      return NextResponse.json({ error: "Tipo no encontrado" }, { status: 404 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error al obtener el tipo por ID:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}