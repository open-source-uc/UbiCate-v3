// utils/geojsonErrorFormatter.ts
export function formatGeojsonError(err: unknown): string {
  if (!(err instanceof Error)) {
    return "Ha ocurrido un error inesperado al validar el GeoJSON.";
  }

  const msg = err.message;

  if (msg.includes("Unexpected token")) {
    return "El GeoJSON no es válido. Asegúrese de que el texto sea un JSON con el formato deseado.";
  }
  if (msg.includes("Debe ser un Feature o FeatureCollection")) {
    return "El GeoJSON debe ser de tipo Feature o FeatureCollection.";
  }
  if (msg.includes("Tipo de geometría no soportado")) {
    return "El tipo de geometría no es compatible. Use Point, Polygon o LineString.";
  }
  if (msg.includes("Falta geometría")) {
    return "El objeto GeoJSON no contiene geometría. Verifique el campo 'geometry'.";
  }
  if (msg.includes("No se encontraron coordenadas")) {
    return "El GeoJSON no contiene coordenadas válidas.";
  }

  // fallback
  return "Error: " + msg;
}
