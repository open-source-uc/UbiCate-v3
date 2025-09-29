// src/app/api/sugerencia/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "node:path";
import { query } from "../../lib/db";

async function readSQL(file: string) {
  const p = path.join(process.cwd(), "src", "sql", file);
  return fs.readFile(p, "utf8");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, sugerencia, nombres, apellidos } = body || {};

    if (!email || !sugerencia || !nombres || !apellidos) {
      return NextResponse.json({ message: "Payload incompleto" }, { status: 400 });
    }

    // leer scripts SQL
    const [sqlInsertSugerencia, sqlGetLastSugerencia] = await Promise.all([
      readSQL("insertSugerencia.sql"),
      readSQL("getLastSugerencia.sql"),
    ]);

    query.run("BEGIN");

    query.run(sqlInsertSugerencia, [email, nombres, apellidos, sugerencia]);

    const lastSug = query.get<{ id_sugerencia: number }>(sqlGetLastSugerencia);
    if (!lastSug?.id_sugerencia) {
      query.run("ROLLBACK");
      return NextResponse.json({ message: "No se pudo guardar la sugerencia" }, { status: 500 });
    }

    query.run("COMMIT");

    return NextResponse.json(
      { id_sugerencia: lastSug.id_sugerencia },
      { status: 201 }
    );
  } catch (err: unknown) {
    try {
      query.run("ROLLBACK");
    } catch {}
    console.error("[API] sugerencia:", err);
    const message = err instanceof Error ? err.message : "Error al guardar sugerencia";
    return NextResponse.json({ message }, { status: 400 });
  }
}
