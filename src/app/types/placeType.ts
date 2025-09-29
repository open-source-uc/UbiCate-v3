export type Place = {
    id_lugar: number;
	id_campus: number;
	id_tipo_lugar: number;
	id_ubicacion_geografica: number;
	nombre_tipo_lugar: string;
	nombre_lugar: string;
	nombre_campus: string;
	descripcion: string;
	nombre_estado: string;
	nombre_tipo_geojson: string;
	id_tipo_geojson: number;
	geojson: GeoJSON.FeatureCollection;
	arquitecto: string;
	premio: string;
	fk_id_estado_ubicacion_geografica: number;
	piso_punto: number;
}
export type Image = {
  id_imagen: number;
  fk_id_ubicacion_geografica: number;
  binario: string;
  descripcion: string | null;
  mime_type: string;
};