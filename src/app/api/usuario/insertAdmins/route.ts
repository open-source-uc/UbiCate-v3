export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/lib/db"; // 👈 ajusta si tu path es distinto

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    type UserCheckRow = { count: number };
    
    const {
      rut,
      dv,
      nombres,
      primerApellido,
      segundoApellido,
      nombreUsuario,
      roles
    } = body || {};

    const apellidos = `${primerApellido ?? ""} ${segundoApellido ?? ""}`.trim();

    console.log(`rut: ${rut} `);
    console.log(`dv: ${dv}`);
    console.log(`nombres: ${nombres}`);
    console.log(`apellido: ${primerApellido}`);
    console.log(`apellido M: ${segundoApellido}`);
    console.log(`uid: ${nombreUsuario}`);
    console.log(`roles: ${roles}`);
    console.log(`apellidos: ${apellidos}`);

    // INSERT INTO usuario (rut, dv, email, uid, nombres, apellidos)

    // 🔹 Validación mínima
    if (!rut || !dv || !nombres || !apellidos || !nombreUsuario) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Se ha producido un error al momento de ingresar al usuario",
          type: "error" // 👈 nuevo campo
        },
        { status: 200 } // ✅ 200 porque no es un error técnico
      );
    }

    // 🔹 Verificar si ya existe ese usuario
    const rows = (await query.all(`SELECT COUNT(*) as count FROM usuario WHERE uid = ?`, [nombreUsuario])) as UserCheckRow[];

    if (rows[0].count > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "El usuario ya existe en la Plataforma Central de Datos",
          type: "warning" // 👈 nuevo campo
        },
        { status: 200 } // ✅ 200 porque no es un error técnico
      );
    }else {
      const sql = `
        INSERT INTO usuario (rut, dv, email, uid, nombres, apellidos)
        VALUES (?, ?, ?, ?, ?, ?);
      `;

      await query.run(sql, [
        rut,
        dv,
        `${nombreUsuario}@uc.cl`,
        nombreUsuario,
        nombres,
        apellidos,
      ]);

      return NextResponse.json(
        { success: true, message: "Usuario insertado correctamente" },
        { status: 201 }
      );
    }

  } catch (err: unknown) {
    console.error("[API] insertAdmins error:", err);

    let message = "Error al guardar usuario";

    if (typeof err === "object" && err !== null && "message" in err) {
      message = String((err as { message: unknown }).message);
    } else if (typeof err === "string") {
      message = err;
    }

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
