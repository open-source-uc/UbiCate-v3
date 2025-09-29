export type Campus = {
  id_campus: number;
  nombre_campus: string;
  descripcion: string;
  piso: string | null;
  geojson: GeoJSON.FeatureCollection;
};