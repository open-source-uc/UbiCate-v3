import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/lib/db";
import { promises as fs } from "fs";
import path from "node:path";
import { PlaceName } from "@/app/types/placeNameType";
import logger from "@/app/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const body: Omit<PlaceName, "id_tipo_lugar"> = await req.json();

    const { nombre_tipo_lugar, icono, color_icono: color } = body;

    // Validate required fields
    if (!nombre_tipo_lugar || !icono || !color) {
      logger.error("Nombre, icono y color son requeridos");
      return NextResponse.json(
        { message: "Nombre, icono y color son requeridos" },
        { status: 400 }
      );
    }

    // Read SQL file for insertion
    const insertTipoLugarSQL = await fs.readFile(
      path.join(process.cwd(), "src/sql/insertTipoLugar.sql"),
      "utf8"
    );

    // Execute the query with parameters
    query.run(insertTipoLugarSQL, [nombre_tipo_lugar, icono, color]);

    // Retrieve the last inserted ID
    const lastInsertedId = query.get<{ id_tipo_lugar: number }>(
      "SELECT last_insert_rowid() AS id_tipo_lugar;"
    );

    logger.info("Ultimo ID insertado:", lastInsertedId);
    logger.info("Tipo de lugar insertado:", { nombre_tipo_lugar, icono, color });
    return NextResponse.json(
      { id_tipo_lugar: lastInsertedId?.id_tipo_lugar, nombre_tipo_lugar, icono, color },
      { status: 201 }
    );
  } catch (err) {
    logger.error("[DB] Error insert tipo_lugar:", err);
    return NextResponse.json(
      { 
        message: "Error al insertar tipo de lugar", 
        error: typeof err === "object" && err !== null && "message" in err ? (err as { message: string }).message : String(err)
      },
      { status: 500 }
    );
  }
}
