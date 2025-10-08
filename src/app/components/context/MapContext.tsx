import { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapManager from '@/app/lib/mapManager';
import MapUtils from '@/utils/MapUtils';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Campus } from '@/app/types/campusType';
import type { FeatureCollection } from 'geojson';
import type { PlaceName } from '@/app/types/placeNameType';
import type { Place } from '@/app/types/placeType';
import type { RouteWithGeo } from '@/app/types/routeType';
import { MAPBOX_STYLE_URL } from '@/themes/mapstyles';

type CampusWithGeo = Campus & {
  featureCollection?: FeatureCollection;
  geojson?: unknown;
};

type PlaceWithGeo = Place & {
  featureCollection?: FeatureCollection;
  geojson?: unknown;
};

type MapContextType = {
  mapRef: React.RefObject<mapboxgl.Map | null>;
  mapContainer: React.RefObject<HTMLDivElement | null>;
  currentCampus: CampusWithGeo | null;
  placeNames: PlaceName[];
  places: Place[];
  routes: RouteWithGeo[];
  campusData: CampusWithGeo[];
  activeRoute: RouteWithGeo | null;
  setActiveRoute: (route: RouteWithGeo | null) => void;
  flyToCampus: (campus: number) => void;
  showPlaces: (placeTypeId: number) => void;
  showRoute: (routeId: number) => void;
};

const MapContext = createContext<MapContextType | undefined>(undefined);

export const useMap = (): MapContextType => {
  const context = useContext(MapContext);
  if (!context) throw new Error('useMap must be used within a MapProvider');
  return context;
};

export const MapProvider = ({ children }: { children: React.ReactNode }) => {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [campusData, setCampusData] = useState<CampusWithGeo[]>([]);
  const [placeNames, setPlaceNames] = useState<PlaceName[]>([]);
  const [places, setPlaces] = useState<PlaceWithGeo[]>([]);
  const [routes, setRoutes] = useState<RouteWithGeo[]>([]);
  const [currentCampus, setCurrentCampus] = useState<CampusWithGeo | null>(null);
  const [activeRoute, setActiveRoute] = useState<RouteWithGeo | null>(null);
  
  // Loading states to prevent duplicate API calls
  const loadingStatesRef = useRef({
    campus: false,
    placeNames: false,
    places: false
  });

const geolocateRef = useRef<mapboxgl.GeolocateControl | null>(null);

useEffect(() => {
  if (mapRef.current || !mapContainer.current) return;

    const mapboxApiKey = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;

  mapboxgl.accessToken = mapboxApiKey!;
  const map = new mapboxgl.Map({
    container: mapContainer.current!,
    style: MAPBOX_STYLE_URL,
    center: [-70.6483, -33.4569],
    zoom: 12,
  });

  const geolocate = new mapboxgl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserHeading: true,
  });

  geolocateRef.current = geolocate; 
  map.addControl(geolocate, 'bottom-right');

  mapRef.current = map;

  map.on('load', () => {
    setLoaded(true);
    console.log('[MapProvider] Mapa cargado');
  });

  return () => {
    mapRef.current?.remove();
    mapRef.current = null;
  };
}, []);


  useEffect(() => {
    // Load campus data
    (async () => {
      if (loadingStatesRef.current.campus) return;
      loadingStatesRef.current.campus = true;
      
      try {
        console.log('[MapProvider] Cargando datos de campus desde API...');
        const res = await fetch('/api/ubica', { cache: 'no-store' });

        if (!res.ok) {
          throw new Error(`Error al cargar campus: ${res.status} ${res.statusText}`);
        }

        const data: CampusWithGeo[] = await res.json();
        console.log(`[MapProvider] Datos de campus cargados (${data.length} registros).`);
        setCampusData(data);
      } catch (error) {
        console.error('[MapProvider] Error cargando datos de campus:', error);
      } finally {
        loadingStatesRef.current.campus = false;
      }
    })();

    // Load place types
    (async () => {
      if (loadingStatesRef.current.placeNames) return;
      loadingStatesRef.current.placeNames = true;
      
      try {
        console.log('[MapProvider] Cargando tipos de punto desde API...');
        const res = await fetch('/api/places/getTypes');

        if (!res.ok) {
          throw new Error(`Error al cargar tipos de punto: ${res.status} ${res.statusText}`);
        }

        const data: PlaceName[] = await res.json();
        console.log(`[MapProvider] Tipos de punto cargados (${data.length} registros).`);
        setPlaceNames(data);
        
        // Also initialize route icons
        try {
          await MapUtils.initRouteIcons();
          console.log('[MapProvider] Iconos de rutas inicializados');
        } catch (error) {
          console.error('[MapProvider] Error inicializando iconos de rutas:', error);
        }
      } catch (error) {
        console.error('[MapProvider] Error cargando tipos de punto:', error);
      } finally {
        loadingStatesRef.current.placeNames = false;
      }
    })();

    // Load places
    (async () => {
      if (loadingStatesRef.current.places) return;
      loadingStatesRef.current.places = true;
      
      try {
        console.log('[MapProvider] Cargando puntos de interés desde API...');
        const res = await fetch('/api/places/getAll', { cache: 'no-store' });

        if (!res.ok) {
          throw new Error(`Error al cargar puntos de interés: ${res.status} ${res.statusText}`);
        }

        const data: PlaceWithGeo[] = await res.json();
        setPlaces(data);
      } catch (error) {
        console.error('[MapProvider] Error cargando puntos de interés:', error);
      } finally {
        loadingStatesRef.current.places = false;
      }
    })();

    // Las rutas se cargarán cuando se seleccione un campus
    // No cargamos todas las rutas al inicio
  }, []);

  // Función para cargar rutas de un campus específico
  const loadRoutesByCampus = useCallback(async (campusId: number) => {
    try {
      console.log(`[MapProvider] Cargando rutas del campus ${campusId}...`);
      const res = await fetch('/api/routes/published', { cache: 'no-store' });

      if (!res.ok) {
        throw new Error(`Error al cargar rutas: ${res.status} ${res.statusText}`);
      }

      const allRoutes: RouteWithGeo[] = await res.json();
      
      // Filtrar rutas por campus
      const campusRoutes = allRoutes.filter(route => route.id_campus === campusId);
      
      console.log(`[MapProvider] Rutas cargadas para campus ${campusId}: ${campusRoutes.length} rutas`);
      setRoutes(campusRoutes);
    } catch (error) {
      console.error(`[MapProvider] Error cargando rutas del campus ${campusId}:`, error);
      setRoutes([]); // Limpiar rutas en caso de error
    }
  }, []);
  
  const showPlaces = (placeTypeId: number) => {
    const map = mapRef.current;
    if (!map) return;
   const toFC = (g: any): GeoJSON.FeatureCollection =>
  g?.type === "FeatureCollection" ? g
  : g?.type === "Feature" ? { type: "FeatureCollection", features: [g] }
  : Array.isArray(g) ? { type: "FeatureCollection", features: g }
  : { type: "FeatureCollection", features: [] };

const filteredPlaces = places.filter(p =>
  p.id_tipo_lugar === placeTypeId && p.id_campus === currentCampus?.id_campus
);

const placesFC: GeoJSON.FeatureCollection[] = filteredPlaces.map((p) => {
  const fc = toFC(p.featureCollection ?? p.geojson);
  fc.features = fc.features.map((f) => ({
    ...f,
    properties: {
      ...(f.properties ?? {}),
      placeId: p.id_lugar,
      placeTypeId: p.id_tipo_lugar,
      placeName: p.nombre_lugar,
    },
  }));
  return fc;
});
(map as any).__removeRoutes?.();
setActiveRoute(null); // Limpiar ruta activa cuando se muestran lugares
MapManager.drawPlaces(map, placesFC, { mode: "multi" });

  }

const showRoute = (routeId: number) => {
  const map = mapRef.current; if (!map) return;

  const toFC = (g: any): GeoJSON.FeatureCollection =>
    typeof g === "string" ? JSON.parse(g) :
    g?.type === "FeatureCollection" ? g :
    g?.type === "Feature" ? { type: "FeatureCollection", features: [g] } :
    Array.isArray(g) ? { type: "FeatureCollection", features: g } :
    { type: "FeatureCollection", features: [] };

  const route = routes.find(r => r.id_ruta === routeId);
  if (!route) {
    console.warn(`[showRoute] Ruta ${routeId} no encontrada en el campus actual`);
    setActiveRoute(null);
    return;
  }

  // Verificar que la ruta pertenece al campus actual
  if (currentCampus && route.id_campus !== currentCampus.id_campus) {
    console.warn(`[showRoute] Ruta ${routeId} no pertenece al campus actual ${currentCampus.id_campus}`);
    setActiveRoute(null);
    return;
  }

  // Guardar la ruta activa
  setActiveRoute(route);

  // 🔵 toma SOLO las líneas del FC, SIN modificar coordenadas
  const fc = toFC(route.featureCollection);
  const features = (fc.features ?? [])
    .filter(f => f?.geometry && (f.geometry.type === "LineString" || f.geometry.type === "MultiLineString"))
    .map((f, i) => ({
      type: "Feature",
      id: String((f.properties as any)?.routeId ?? `${routeId}-${i}`),
      properties: {
        ...(f.properties ?? {}),
        routeId: String((f.properties as any)?.routeId ?? routeId),
        routeName: (route as any).nombre_ruta ?? `route-${routeId}`,
        routeColor: "#0176DE",
      },
      geometry: f.geometry // 👈 no swap
    })) as GeoJSON.Feature[];

  if (!features.length) return;

  (map as any).__removeRoutes?.();

  MapManager.drawRoutes(map, { type: "FeatureCollection", features }, { fit: true, showEndpoints: true });

  const filteredPlaces = places.filter(place => route?.placeIds.includes(place.id_lugar))

  const placesFC: GeoJSON.FeatureCollection[] = filteredPlaces.map((p) => {
  const fc = toFC(p.featureCollection ?? p.geojson);
    fc.features = fc.features.map((f) => ({
      ...f,
      properties: {
        ...(f.properties ?? {}),
        placeId: p.id_lugar,
        placeTypeId: p.id_tipo_lugar,
        placeName: p.nombre_lugar,
      },
    }));
    return fc;
  });
  
  MapManager.drawPlaces(map, placesFC, { mode: "multi" });
};





  const flyToCampus = useCallback(
    (id_campus: number) => {
      console.log(`[flyToCampus] Intentando volar al campus con ID: ${id_campus}`);

      if (!loaded) {
        console.warn('[flyToCampus] El mapa aún no está cargado.');
        return;
      }
      if (!mapRef.current) {
        console.error('[flyToCampus] mapRef.current es null.');
        return;
      }

      const map = mapRef.current;
      const campusInfo = campusData.find((c) => c.id_campus === id_campus);

      if (!campusInfo) {
        console.warn(`[flyToCampus] No se encontró información para el campus con ID ${id_campus}`);
        return;
      }

      console.log(`[flyToCampus] Campus encontrado: ${campusInfo.nombre_campus}`);

      setCurrentCampus(campusInfo);

      // Limpiar rutas anteriores del mapa
      (map as any).__removeRoutes?.();
      setActiveRoute(null); // Limpiar ruta activa al cambiar de campus
      (map as any).__removePlacesPolygons?.();

      const dataFC: unknown =
        campusInfo.featureCollection ?? campusInfo.geojson ?? { type: 'FeatureCollection', features: [] };

      MapManager.drawPolygons(map, id_campus.toString(), dataFC);
      
      // Cargar rutas del campus seleccionado
      loadRoutesByCampus(id_campus);

      const coords = MapManager.extractBounds(dataFC);
      if (coords.length > 0) {
        console.log(`[flyToCampus] Calculando bounds con ${coords.length} coordenadas...`);
        const bounds = coords.reduce(
          (b, coord) => b.extend(coord),
          new mapboxgl.LngLatBounds(coords[0], coords[0])
        );
        map.fitBounds(bounds, { padding: 40, duration: 1000 });
        console.log('[flyToCampus] Vista del mapa ajustada al campus.');
      } else {
        console.warn('[flyToCampus] No se encontraron coordenadas para ajustar la vista.');
      }
    },
    [loaded, campusData, loadRoutesByCampus]
  );

  useEffect(() => {
    if (loaded && campusData.length > 0) {
      console.log('[MapProvider] Mapa y datos listos. Volando al campus inicial (ID=1).');
      flyToCampus(1);
    }
  }, [loaded, campusData, flyToCampus]);

  return (
    <MapContext.Provider value={{ 
        mapRef, 
        mapContainer, 
        currentCampus, 
        routes,
        places, 
        placeNames, 
        campusData, 
        activeRoute,
        setActiveRoute,
        flyToCampus, 
        showRoute,
        showPlaces }}>
      {children}
    </MapContext.Provider>
  );
};
