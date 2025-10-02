import { FeatureCollection } from "geojson";

export type Route = {
    id_ruta: number;
	nombre_ruta: string;
	id_ubicacion_geografica: number;
	geojson: GeoJSON.FeatureCollection;
	descripcion: string;
    id_campus: number;
	nombre_campus: string;
	estado_ubicacion_geografica?: number;
	icono?: string;
	color_icono?: string;
}

export type RouteWithGeo = Route & {
  featureCollection?: FeatureCollection;
  placeIds: number[];
  color?: string;
  icon?: string;
};

export type RoutePlaces = {
    id_lugar_ruta: number;
    id_ruta: number;
    id_lugar: number;
}