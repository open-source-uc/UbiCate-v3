import { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { useSearchParams } from 'next/navigation';
import { createEmergencyMarker } from '@/app/lib/emergencyMarker';
import MapManager from '@/app/lib/mapManager';
import MapUtils from '@/utils/MapUtils';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Campus } from '@/app/types/campusType';
import type { FeatureCollection } from 'geojson';
import type { PlaceName } from '@/app/types/placeNameType';
import type { Place } from '@/app/types/placeType';
import type { RouteWithGeo } from '@/app/types/routeType';
import { MAPBOX_STYLE_URL } from '@/themes/mapstyles';

// Helper function to convert various GeoJSON formats to FeatureCollection
const toFeatureCollection = (g: any): GeoJSON.FeatureCollection => {
  if (!g) return { type: "FeatureCollection", features: [] };
  if (typeof g === "string") {
    try { return JSON.parse(g); } catch { return { type: "FeatureCollection", features: [] }; }
  }
  if (g.type === "FeatureCollection") return g;
  if (g.type === "Feature") return { type: "FeatureCollection", features: [g] };
  if (Array.isArray(g)) return { type: "FeatureCollection", features: g };
  return { type: "FeatureCollection", features: [] };
};

// Helper function to get centroid of a polygon or multipolygon
const getCentroid = (geometry: any): [number, number] | null => {
  if (geometry.type === "Polygon") {
    const coords = geometry.coordinates[0];
    let x = 0, y = 0;
    for (const [lng, lat] of coords) {
      x += lng;
      y += lat;
    }
    return [x / coords.length, y / coords.length];
  } else if (geometry.type === "MultiPolygon") {
    const allCoords = geometry.coordinates.flat()[0];
    if (!allCoords) return null;
    let x = 0, y = 0;
    for (const [lng, lat] of allCoords) {
      x += lng;
      y += lat;
    }
    return [x / allCoords.length, y / allCoords.length];
  } else if (geometry.type === "LineString") {
    const coords = geometry.coordinates;
    let x = 0, y = 0;
    for (const [lng, lat] of coords) {
      x += lng;
      y += lat;
    }
    return [x / coords.length, y / coords.length];
  } else if (geometry.type === "MultiLineString") {
    const allCoords = geometry.coordinates.flat();
    if (!allCoords.length) return null;
    let x = 0, y = 0;
    for (const [lng, lat] of allCoords) {
      x += lng;
      y += lat;
    }
    return [x / allCoords.length, y / allCoords.length];
  }
  return null;
};

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
  triggerGeolocate: () => void;
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
  const [allRoutesLoaded, setAllRoutesLoaded] = useState(false);
  const searchParams = useSearchParams();
const sharedLocationRef = useRef<{ lat: number; lng: number } | null>(null);
const initialMapCenterRef = useRef<{ center: [number, number]; zoom: number } | null>(null);

useEffect(() => {
  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const placeId = searchParams.get('placeId');
  const routeId = searchParams.get('routeId');
  
  if (latParam && lngParam) {
    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);
    
    if (!isNaN(lat) && !isNaN(lng)) {
      sharedLocationRef.current = { lat, lng };
      initialMapCenterRef.current = { center: [lng, lat], zoom: 18 };
    }
  } else if (placeId || routeId) {
    // Guardar IDs para extraer coordenadas después cuando carguen los datos
    (window as any).__sharedPlaceId = placeId;
    (window as any).__sharedRouteId = routeId;
    // NO establecer centro aquí, se actualizará cuando carguen los datos
    // initialMapCenterRef.current NO se establece, el mapa esperará a los datos
  }
}, [searchParams]);

const geolocateRef = useRef<mapboxgl.GeolocateControl | null>(null);

useEffect(() => {
  if (mapRef.current || !mapContainer.current) return;

    const mapboxApiKey = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;
  if (!mapboxApiKey) {
    console.error('[MapProvider] NEXT_PUBLIC_MAPBOX_API_KEY no configurada en .env.local');
    return () => {};
  }

  mapboxgl.accessToken = mapboxApiKey;
  try {
    // Usar centro compartido si existe, sino usar San Joaquín por defecto
    const initialConfig = initialMapCenterRef.current || { 
      center: [-70.611, -33.498] as [number, number], 
      zoom: 16 
    };
    
    const map = new mapboxgl.Map({
      container: mapContainer.current!,
      style: MAPBOX_STYLE_URL,
      center: initialConfig.center,
      zoom: initialConfig.zoom,
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
    
      const sharedLocation = sharedLocationRef.current;
      if (sharedLocation) {
        setTimeout(() => {
          createEmergencyMarker(map, sharedLocation.lat, sharedLocation.lng);
        }, 500);
      }
    });

    map.on('error', (e) => {
      console.error('[MapProvider] Mapbox error:', e.error?.message || e);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  } catch (err) {
    console.error('[MapProvider] Error inicializando Mapbox:', err);
    return () => {};
  }
}, []);

  // Expose a trigger to programmatically invoke the GeolocateControl
  const triggerGeolocate = useCallback(() => {
    try {
      if (geolocateRef.current && typeof (geolocateRef.current as any).trigger === 'function') {
        (geolocateRef.current as any).trigger();
        return;
      }

      // Fallback: if geolocate control not available, try to use map's locate options
      const map = mapRef.current;
      if (map && 'locate' in (map as any)) {
        try { (map as any).locate(); } catch { /* ignore */ }
      }
    } catch (err) {
      console.warn('[MapProvider] triggerGeolocate failed', err);
    }
  }, []);


  useEffect(() => {
    // Ejecutar todas las llamadas en paralelo en vez de secuenciales
    let isMounted = true;

    Promise.all([
      // Cargar campus
      fetch('/api/ubica', { cache: 'no-store' })
        .then(res => res.ok ? res.json() : Promise.reject(`Campus: ${res.status}`))
        .then(data => {
          if (isMounted) {
            console.log(`[MapProvider] Campus cargados (${data.length} registros).`);
            setCampusData(data);
          }
          return data;
        }),
      
      // Cargar tipos de punto e inicializar iconos
      fetch('/api/places/getTypes', { cache: 'no-store' })
        .then(res => res.ok ? res.json() : Promise.reject(`PlaceTypes: ${res.status}`))
        .then(async (data) => {
          if (isMounted) {
            console.log(`[MapProvider] Tipos de punto cargados (${data.length} registros).`);
            setPlaceNames(data);
            // Inicializar iconos en paralelo
            try {
              await MapUtils.initPlaceIcons();
              console.log('[MapProvider] Iconos inicializados');
            } catch (err) {
              console.error('[MapProvider] Error inicializando iconos:', err);
            }
          }
          return data;
        }),
      
      // Cargar todos los lugares
      fetch('/api/places/getAll', { cache: 'no-store' })
        .then(res => res.ok ? res.json() : Promise.reject(`Places: ${res.status}`))
        .then(data => {
          if (isMounted) {
            console.log(`[MapProvider] Lugares cargados (${data.length} registros).`);
            setPlaces(data);
            
            // Si hay un placeId compartido, encontrar sus coordenadas y actualizar centro del mapa
            const sharedPlaceId = (window as any).__sharedPlaceId;
            if (sharedPlaceId && mapRef.current) {
              const place = data.find((p: any) => String(p.id_lugar) === String(sharedPlaceId));
              if (place && place.featureCollection) {
                try {
                  const fc = toFeatureCollection(place.featureCollection);
                  const firstFeature = fc.features?.[0];
                  if (firstFeature?.geometry) {
                    const coords = firstFeature.geometry.type === 'Point' 
                      ? (firstFeature.geometry as any).coordinates
                      : firstFeature.geometry.type === 'Polygon' || firstFeature.geometry.type === 'MultiPolygon'
                        ? getCentroid((firstFeature.geometry as any))
                        : null;
                    
                    if (coords) {
                      initialMapCenterRef.current = { center: [coords[0], coords[1]], zoom: 18 };
                      if (mapRef.current) {
                        mapRef.current.setCenter([coords[0], coords[1]]);
                        mapRef.current.setZoom(16);
                      }
                      console.log(`[MapProvider] Mapa centrado en lugar compartido: ${place.nombre_lugar}`);
                    }
                  }
                } catch (err) {
                  console.error('[MapProvider] Error centrando en lugar compartido:', err);
                }
              }
            }
          }
          return data;
        }),
      
      // Cargar todas las rutas (para poder buscar rutas compartidas)
      fetch('/api/routes/published', { cache: 'no-store' })
        .then(res => res.ok ? res.json() : Promise.reject(`Routes: ${res.status}`))
        .then(data => {
          if (isMounted) {
            console.log(`[MapProvider] Todas los Circuitos cargados son (${data.length} registros).`);
            // Guardar en window para poder acceder después
            (window as any).__allRoutes = data;
            setAllRoutesLoaded(true);
          }
          return data;
        })
    ]).catch(error => {
      console.error('[MapProvider] Error cargando datos iniciales:', error);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Función para cargar rutas de un campus específico
  const loadRoutesByCampus = useCallback(async (campusId: number) => {
    try {
      console.log(`[MapProvider] Cargando Cirucuitos del campus ${campusId}...`);
      // Rutas son mutables, sin caché para siempre obtener datos frescos
      const res = await fetch(`/api/routes/published?campusId=${campusId}`, { cache: 'no-store' });

      if (!res.ok) {
        throw new Error(`Error al cargar circuitos: ${res.status}`);
      }

      const campusRoutes: RouteWithGeo[] = await res.json();
      console.log(`[MapProvider] Circuitos cargados (${campusRoutes.length})`);
      setRoutes(campusRoutes);
    } catch (error) {
      console.error(`[MapProvider] Error cargando circuitos:`, error);
      setRoutes([]);
    }
  }, []);

  // Detectar y centrar en ruta compartida (ejecutar cuando las rutas estén cargadas)
  useEffect(() => {
    // Este efecto SIEMPRE setea la ruta activa si hay link compartido, después de cualquier limpieza
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sharedRouteId = params.get('routeId');
      const menu = params.get('menu');
      if (sharedRouteId && !isNaN(Number(sharedRouteId)) && menu === 'RouteDetailStep' && mapRef.current && allRoutesLoaded) {
        const allRoutes = (window as any).__allRoutes || [];
        const route = allRoutes.find((r: any) => String(r.id_ruta) === String(sharedRouteId));
        if (route && route.featureCollection) {
          try {
            const fc = toFeatureCollection(route.featureCollection);
            const firstFeature = fc.features?.[0];
            if (firstFeature?.geometry) {
              const coords = firstFeature.geometry.type === 'LineString' || firstFeature.geometry.type === 'MultiLineString'
                ? getCentroid((firstFeature.geometry as any))
                : null;
              if (coords && mapRef.current) {
                mapRef.current.setCenter([coords[0], coords[1]]);
                mapRef.current.setZoom(16);
              }
            }
            setActiveRoute(route); // <-- Setear la ruta activa para mostrar el botón flotante SIEMPRE
            console.log(`[MapProvider] Mapa centrado en circuito compartido: ${route.nombre_ruta}`);
          } catch (err) {
            console.error('[MapProvider] Error centrando en circuito compartido:', err);
          }
        }
      }
    }
  }, [allRoutesLoaded, mapRef]);
  
  const showPlaces = useCallback((placeTypeId: number) => {
    const map = mapRef.current;
    if (!map || !currentCampus) return;

    const filteredPlaces = places.filter(p =>
      p.id_tipo_lugar === placeTypeId && p.id_campus === currentCampus.id_campus
    );

    const placesFC: GeoJSON.FeatureCollection[] = filteredPlaces.map((p) => {
      const fc = toFeatureCollection(p.featureCollection ?? p.geojson);
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
    setActiveRoute(null);
    MapManager.drawPlaces(map, placesFC, { mode: "multi" });
  }, [places, currentCampus]);

  const showRoute = useCallback((routeId: number) => {
    const map = mapRef.current;
    if (!map || !currentCampus) return;

    const route = routes.find(r => r.id_ruta === routeId);
    if (!route || route.id_campus !== currentCampus.id_campus) {
      console.warn(`Circuito ${routeId} no encontrado o no pertenece al campus`);
      setActiveRoute(null);
      return;
    }

    setActiveRoute(route);

    // Dibujar geometría de la ruta
    const fc = toFeatureCollection(route.featureCollection);
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
        geometry: f.geometry
      })) as GeoJSON.Feature[];

    if (!features.length) return;

    (map as any).__removeRoutes?.();
    MapManager.drawRoutes(map, { type: "FeatureCollection", features }, { fit: true, showEndpoints: true });

    // Dibujar lugares asociados a la ruta
    const filteredPlaces = places.filter(place => route.placeIds?.includes(place.id_lugar));
    if (filteredPlaces.length > 0) {
      const placesFC: GeoJSON.FeatureCollection[] = filteredPlaces.map((p) => {
        const fc = toFeatureCollection(p.featureCollection ?? p.geojson);
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
    }
  }, [routes, places, currentCampus]);





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
      // Solo limpiar ruta activa si NO es un link compartido
      let shouldClearActiveRoute = true;
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const routeId = params.get('routeId');
        const menu = params.get('menu');
        // Si hay un link compartido de ruta, nunca limpiar activeRoute
        if (routeId && !isNaN(Number(routeId)) && menu === 'RouteDetailStep') {
          shouldClearActiveRoute = false;
        }
      }
      // Solo limpiar si NO hay link compartido de ruta
      if (shouldClearActiveRoute) {
        setActiveRoute(null); // Limpiar ruta activa al cambiar de campus
      }
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
    // Eliminado el flyToCampus(1) del load inicial para no interferir con links compartidos
    // Si quieres restaurar el comportamiento, descomenta las líneas siguientes:
    // if (loaded && campusData.length > 0) {
    //   flyToCampus(1);
    // }
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
    triggerGeolocate,
        flyToCampus, 
        showRoute,
        showPlaces }}>
      {children}
    </MapContext.Provider>
  );
};
