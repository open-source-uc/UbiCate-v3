import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/lib/db";
import { promises as fs } from "fs";
import path from "node:path";

export async function PUT(req: NextRequest, context: any) {
  try {
    const params = await context.params; // Esperar la promesa de params
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    const { nombre_tipo_lugar, icono, color_icono } = body;

    if (!nombre_tipo_lugar || !icono || !color_icono) {
      return NextResponse.json({ message: "Todos los campos son requeridos" }, { status: 400 });
    }

    console.log("ID recibido:", id);

    const tipoExists = await query.get<{ id_tipo_lugar: number }>(
      "SELECT id_tipo_lugar FROM tipo_lugar WHERE id_tipo_lugar = ? LIMIT 1;",
      [id]
    );

    console.log("Resultado de la consulta tipoExists:", tipoExists);

    if (!tipoExists) {
      return NextResponse.json({ message: "Tipo de lugar no encontrado" }, { status: 404 });
    }

    const updateTipoLugarSQL = await fs.readFile(
      path.join(process.cwd(), "src/sql/updateTipoLugar.sql"),
      "utf8"
    );

    query.run(updateTipoLugarSQL, [nombre_tipo_lugar, icono, color_icono, id]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[DB] Error update tipo_lugar:", err);
    return NextResponse.json({ message: "Error al actualizar tipo de lugar" }, { status: 500 });
  }
}
