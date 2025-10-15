import React, { createContext, useContext, useRef, useEffect, ReactNode } from 'react';
import mapboxgl from 'mapbox-gl';
import type { FeatureCollection, Geometry, Feature } from 'geojson';
import { MAPBOX_STYLE_URL } from '@/themes/mapstyles';
import MapUtils from '@/utils/MapUtils';
import MapManager from '@/app/lib/mapManager';

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

    let cancelled = false;
    (async () => {
      await MapUtils.initPlaceIcons();
      if (cancelled) return;

      const centerCoord = getFirstCoordinate(geojson);
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
        // Prepara el FeatureCollection para drawPlaces
        let fc: FeatureCollection = geojson;
        if (geojson?.type === 'Feature') {
          fc = { type: 'FeatureCollection', features: [geojson] };
        } else if (Array.isArray(geojson)) {
          fc = { type: 'FeatureCollection', features: geojson };
        }
        // Asegura que cada punto tenga placeTypeId como número y loguea para depuración
        fc = {
          ...fc,
          features: fc.features.map((f: Feature) => {
            if (f.geometry?.type === 'Point') {
              const rawId = f.properties?.id_tipo_lugar ?? f.properties?.placeTypeId;
              const placeTypeId = rawId !== undefined ? Number(rawId) : undefined;
              if (process.env.NODE_ENV !== 'production') {
                // Log para depuración
                console.log('[EditMapContext] id_tipo_lugar:', rawId, '->', placeTypeId);
              }
              return {
                ...f,
                properties: {
                  ...f.properties,
                  placeTypeId,
                  placeName: f.properties?.nombre_lugar ?? f.properties?.placeName,
                },
              };
            }
            return f;
          }),
        };
        if (process.env.NODE_ENV !== 'production') {
          // Log keys de iconMap
          console.log('[EditMapContext] iconMap keys:', Array.from((MapUtils as any).iconMap?.keys?.() ?? []));
        }
        MapManager.drawPlaces(map, fc, { mode: 'multi' });
      });
      // Cleanup
      return () => {
        cancelled = true;
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    })();
  }, [geojson, mapStyle]);

  return (
    <EditMapContext.Provider value={{ mapRef, mapContainer }}>
      {children}
    </EditMapContext.Provider>
  );
};
