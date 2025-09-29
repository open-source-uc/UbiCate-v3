import { Feature, FeatureCollection, Geometry, LineString, MultiLineString } from "geojson";

export type Route = {
    id_ruta: number;
	nombre_ruta: string;
	id_ubicacion_geografica: number;
	geojson: GeoJSON.FeatureCollection;
	descripcion: string;
    id_campus: number;
	nombre_campus: string;
}

export type RouteWithGeo = Route & {
  featureCollection?: FeatureCollection;
  placeIds: number[];
};

export type RoutePlaces = {
    id_lugar_ruta: number;
    id_ruta: number;
    id_lugar: number;
}