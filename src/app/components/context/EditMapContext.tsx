

import React, { createContext, useContext, useRef, useEffect, ReactNode } from 'react';
import mapboxgl from 'mapbox-gl';
import type { FeatureCollection, Geometry } from 'geojson';
import { MAPBOX_STYLE_URL } from '@/themes/mapstyles';

type EditMapContextType = {
  mapRef: React.RefObject<mapboxgl.Map | null>;
  mapContainer: React.RefObject<HTMLDivElement | null>;
};

const EditMapContext = createContext<EditMapContextType | undefined>(undefined);

export const useEditMap = (): EditMapContextType => {
  const context = useContext(EditMapContext);
  if (!context) throw new Error('useEditMap must be used within EditMapProvider');
  return context;
};

interface EditMapProviderProps {
  geojson: FeatureCollection | Geometry | any;
  children: ReactNode;
  mapStyle?: string;
}


export const EditMapProvider = ({ geojson, children, mapStyle }: EditMapProviderProps) => {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    // Buscar la primera coordenada válida en cualquier tipo de geojson
    function getFirstCoordinate(gj: any): [number, number] | null {
      if (!gj) return null;
      if (gj.type === 'FeatureCollection' && Array.isArray(gj.features) && gj.features.length > 0) {
        for (const feat of gj.features) {
          const coord = getFirstCoordinate(feat);
          if (coord) return coord;
        }
      } else if (gj.type === 'Feature' && gj.geometry) {
        return getFirstCoordinate(gj.geometry);
      } else if (gj.type === 'Point' && Array.isArray(gj.coordinates)) {
        return gj.coordinates;
      } else if (gj.type === 'LineString' && Array.isArray(gj.coordinates) && gj.coordinates.length > 0) {
        return gj.coordinates[0];
      } else if (gj.type === 'Polygon' && Array.isArray(gj.coordinates) && gj.coordinates.length > 0 && Array.isArray(gj.coordinates[0]) && gj.coordinates[0].length > 0) {
        return gj.coordinates[0][0];
      }
      return null;
    }

    const centerCoord = getFirstCoordinate(geojson);
    // Si ya hay un mapa, destrúyelo antes de crear uno nuevo
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    if (!centerCoord) return;
      const mapboxApiKey = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;
      mapboxgl.accessToken = mapboxApiKey!;
      const map = new mapboxgl.Map({
        container: mapContainer.current as HTMLDivElement,
        style: mapStyle || MAPBOX_STYLE_URL,
        center: centerCoord,
        zoom: 16,
      });
    mapRef.current = map;
    map.on('load', () => {
      map.addSource('place', {
        type: 'geojson',
        data: geojson,
      });

      // Si hay polígonos, agrega capa de fill
      const hasPolygon = (() => {
        if (geojson?.type === 'FeatureCollection') {
          return geojson.features.some((f: { geometry?: Geometry }) => f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon');
        }
        if (geojson?.type === 'Feature') {
          return geojson.geometry?.type === 'Polygon' || geojson.geometry?.type === 'MultiPolygon';
        }
        return false;
      })();
      if (hasPolygon) {
        map.addLayer({
          id: 'place-fill',
          type: 'fill',
          source: 'place',
          paint: {
            'fill-color': '#0176DE',
            'fill-opacity': 0.25
          }
        });
        map.addLayer({
          id: 'place-outline',
          type: 'line',
          source: 'place',
          paint: {
            'line-color': '#0176DE',
            'line-width': 2
          }
        });
      }

      // Capa de puntos
      map.addLayer({
        id: 'place-point',
        type: 'circle',
        source: 'place',
        paint: {
          'circle-radius': 8,
          'circle-color': '#007cbf'
        },
        filter: ['==', '$type', 'Point']
      });

      // Capa de etiquetas si hay propiedades nombre
      map.addLayer({
        id: 'place-label',
        type: 'symbol',
        source: 'place',
        layout: {
          'text-field': ['coalesce', ['get', 'nombre_lugar'], ['get', 'name'], ['get', 'Nombre'], ''],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 14,
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
        },
        paint: {
          'text-color': '#0176DE',
          'text-halo-color': '#fff',
          'text-halo-width': 2
        }
      });
    });
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [geojson, mapStyle]);

  return (
    <EditMapContext.Provider value={{ mapRef, mapContainer }}>
      {children}
    </EditMapContext.Provider>
  );
};
