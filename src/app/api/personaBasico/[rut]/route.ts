import logger from "@/app/lib/logger";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ rut: string }> }
) {
  try {
    // 👇 await obligatorio para rutas dinámicas
    const { rut } = await context.params;

    if (!rut) {
      logger.error("Falta RUT");
      return NextResponse.json({ error: "Falta RUT" }, { status: 400 });
    }

    const apiUrl = process.env.MDI_PERSONA_BASICO;

    if (!apiUrl) {
      logger.error("API URL no definida");
      return NextResponse.json({ error: "API URL no definida" }, { status: 500 });
    }

    const res = await fetch(apiUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    return NextResponse.json(data);
  } catch (error: unknown) {
    let message = "Error al consultar la API";

    if (typeof error === "object" && error !== null && "message" in error) {
      message = String((error as { message: unknown }).message);
    } else if (typeof error === "string") {
      message = error;
    }
    logger.error("[API] personaBasico:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
