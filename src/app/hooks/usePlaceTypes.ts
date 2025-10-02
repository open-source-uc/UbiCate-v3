import { useState, useEffect, useRef } from 'react';
import type { PlaceName } from '@/app/types/placeNameType';

interface UsePlaceTypesResult {
  placeTypes: PlaceName[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Global cache to prevent multiple requests across component instances
const globalCache: {
  data: PlaceName[] | null;
  timestamp: number;
  loading: boolean;
  promise: Promise<PlaceName[]> | null;
} = {
  data: null,
  timestamp: 0,
  loading: false,
  promise: null
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const API_ENDPOINT = '/api/places/getTypes';

export const usePlaceTypes = (): UsePlaceTypesResult => {
  const [placeTypes, setPlaceTypes] = useState<PlaceName[]>(globalCache.data || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchPlaceTypes = async (): Promise<PlaceName[]> => {
    const now = Date.now();
    
    // Return cached data if still valid
    if (globalCache.data && (now - globalCache.timestamp) < CACHE_DURATION) {
      return globalCache.data;
    }

    // Return existing promise if already loading
    if (globalCache.loading && globalCache.promise) {
      return globalCache.promise;
    }

    // Start new request
    globalCache.loading = true;
    globalCache.promise = (async () => {
      try {
        console.log('[usePlaceTypes] Fetching place types...');
        const res = await fetch(API_ENDPOINT);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data: PlaceName[] = await res.json();
        
        // Update global cache
        globalCache.data = data;
        globalCache.timestamp = now;
        
        console.log(`[usePlaceTypes] Place types loaded (${data.length} items)`);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('[usePlaceTypes] Error fetching place types:', errorMessage);
        throw new Error(`Failed to fetch place types: ${errorMessage}`);
      } finally {
        globalCache.loading = false;
        globalCache.promise = null;
      }
    })();

    return globalCache.promise;
  };

  const refetch = async (): Promise<void> => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Force cache invalidation
      globalCache.data = null;
      globalCache.timestamp = 0;
      
      const data = await fetchPlaceTypes();
      
      if (mountedRef.current) {
        setPlaceTypes(data);
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
      if (globalCache.data) {
        setPlaceTypes(globalCache.data);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchPlaceTypes();
        
        if (mountedRef.current) {
          setPlaceTypes(data);
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
    placeTypes,
    loading,
    error,
    refetch
  };
};

// Utility function to get cached place types synchronously
export const getCachedPlaceTypes = (): PlaceName[] | null => {
  const now = Date.now();
  if (globalCache.data && (now - globalCache.timestamp) < CACHE_DURATION) {
    return globalCache.data;
  }
  return null;
};

// Utility function to invalidate the cache
export const invalidatePlaceTypesCache = (): void => {
  globalCache.data = null;
  globalCache.timestamp = 0;
  globalCache.loading = false;
  globalCache.promise = null;
};