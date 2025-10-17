export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "node:path";
import { query } from "../../../lib/db";
import type { PlaceName } from "@/app/types/placeNameType";
import logger from "@/app/lib/logger";

export async function GET() {
  try {
    const sqlPath = path.join(process.cwd(), "src", "sql", "getPlaceTypes.sql");
    const sql = await fs.readFile(sqlPath, "utf8");

    const rows = await query.all<PlaceName>(sql);
    logger.info("Tipos de lugar obtenidos:", rows);
    return NextResponse.json(rows, {
      status: 200,
    });
  } catch (err) {
    logger.error("[DB] Error place types:", err);
    return NextResponse.json({ error: "Error consultando BD" }, { status: 500 });
  }
}
