import { useState, useEffect } from 'react';
import type { PlaceName } from '@/app/types/placeNameType';

interface UsePlaceTypesResult {
  placeTypes: PlaceName[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const API_ENDPOINT = '/api/places/getTypes';

export const usePlaceTypes = (): UsePlaceTypesResult => {
  const [placeTypes, setPlaceTypes] = useState<PlaceName[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaceTypes = async (): Promise<PlaceName[]> => {
    const res = await fetch(API_ENDPOINT);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    return res.json();
  };

  const refetch = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchPlaceTypes();
      setPlaceTypes(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchPlaceTypes();
        setPlaceTypes(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { placeTypes, loading, error, refetch };
};