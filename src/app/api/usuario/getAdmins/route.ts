export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { query } from "../../../lib/db";
import { promises as fs } from "fs";
import path from "node:path";
import { UsuarioRow } from "@/app/types/usuarioType";


export async function GET() {
  const sqlPath = path.join(process.cwd(), "src", "sql", "getUsuarios.sql");
  const sql = await fs.readFile(sqlPath, "utf8");
  const rows = await query.all<UsuarioRow>(sql);

  try {
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "No hay usuarios" }, { status: 404 });
    }

    const payload = rows.map((row) => ({
      id_usuario: row.id_usuario,
      uid: row.uid,
      rut: row.rut,
      dv: row.dv,
      correo_uc: row.correo_uc,
      nombres: row.nombres,
      apellidos: row.apellidos,
    }));

    const res = NextResponse.json(payload, { status: 200 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e) {
    console.error("[DB] Error:", e);
    return NextResponse.json({ error: "Error consultando BD" }, { status: 500 });
  }
}
