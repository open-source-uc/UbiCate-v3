export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "node:path";
import { query } from "../../lib/db";
import logger from "../../lib/logger";

async function readSQL(name: string) {
  const p = path.join(process.cwd(), "src", "sql", name);
  return fs.readFile(p, "utf8");
}

export async function GET() {
  try {
    const [
      sqlTipoPunto,
      sqlPisoPunto,
      sqlCampus,
      sqlTipoGeojson,
    ] = await Promise.all([
      readSQL("getTipoPunto.sql"),
      readSQL("getPisoPunto.sql"),
      readSQL("getCampuscmb.sql"),
      readSQL("getTipoGeojson.sql"),
    ]);

    const [tipo_punto, piso_punto, campus, tipo_geojson] = [
      query.all(sqlTipoPunto),
      query.all(sqlPisoPunto),
      query.all(sqlCampus),
      query.all(sqlTipoGeojson),
    ];

    return NextResponse.json(
      { tipo_punto, piso_punto, campus, tipo_geojson },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    logger.error("[API] catalogos:", err);
    return NextResponse.json({ error: "Error consultando BD" }, { status: 500 });
  }
}
