import { useState, useEffect, useRef } from 'react';

interface RouteType {
  id_ruta: number;
  nombre_ruta: string;
  icono: string | null;
  color_icono: string | null;
}

interface UseRouteTypesResult {
  routeTypes: RouteType[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Global cache to prevent multiple requests across component instances
const globalRouteCache: {
  data: RouteType[] | null;
  timestamp: number;
  loading: boolean;
  promise: Promise<RouteType[]> | null;
} = {
  data: null,
  timestamp: 0,
  loading: false,
  promise: null
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const API_ENDPOINT = '/api/routes/getTypes';

export const useRouteTypes = (): UseRouteTypesResult => {
  const [routeTypes, setRouteTypes] = useState<RouteType[]>(globalRouteCache.data || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchRouteTypes = async (): Promise<RouteType[]> => {
    const now = Date.now();
    
    // Return cached data if still valid
    if (globalRouteCache.data && (now - globalRouteCache.timestamp) < CACHE_DURATION) {
      return globalRouteCache.data;
    }

    // Return existing promise if already loading
    if (globalRouteCache.loading && globalRouteCache.promise) {
      return globalRouteCache.promise;
    }

    // Start new request
    globalRouteCache.loading = true;
    globalRouteCache.promise = (async () => {
      try {
        console.log('[useRouteTypes] Fetching route types...');
        const res = await fetch(API_ENDPOINT);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data: RouteType[] = await res.json();
        
        // Update global cache
        globalRouteCache.data = data;
        globalRouteCache.timestamp = now;
        
        console.log(`[useRouteTypes] Route types loaded (${data.length} items)`);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('[useRouteTypes] Error fetching route types:', errorMessage);
        throw new Error(`Failed to fetch route types: ${errorMessage}`);
      } finally {
        globalRouteCache.loading = false;
        globalRouteCache.promise = null;
      }
    })();

    return globalRouteCache.promise;
  };

  const refetch = async (): Promise<void> => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Force cache invalidation
      globalRouteCache.data = null;
      globalRouteCache.timestamp = 0;
      
      const data = await fetchRouteTypes();
      
      if (mountedRef.current) {
        setRouteTypes(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    
    const loadData = async () => {
      // If we already have cached data, use it immediately
      if (globalRouteCache.data) {
        setRouteTypes(globalRouteCache.data);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchRouteTypes();
        
        if (mountedRef.current) {
          setRouteTypes(data);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        if (mountedRef.current) {
          setError(errorMessage);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    routeTypes,
    loading,
    error,
    refetch
  };
};

// Utility function to get cached route types synchronously
export const getCachedRouteTypes = (): RouteType[] | null => {
  const now = Date.now();
  if (globalRouteCache.data && (now - globalRouteCache.timestamp) < CACHE_DURATION) {
    return globalRouteCache.data;
  }
  return null;
};

// Utility function to invalidate the cache
export const invalidateRouteTypesCache = (): void => {
  globalRouteCache.data = null;
  globalRouteCache.timestamp = 0;
  globalRouteCache.loading = false;
  globalRouteCache.promise = null;
};