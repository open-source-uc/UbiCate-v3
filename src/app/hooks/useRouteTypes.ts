import { useState, useEffect } from 'react';

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

const API_ENDPOINT = '/api/routes/getTypes';

export const useRouteTypes = (): UseRouteTypesResult => {
  const [routeTypes, setRouteTypes] = useState<RouteType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRouteTypes = async (): Promise<RouteType[]> => {
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
      const data = await fetchRouteTypes();
      setRouteTypes(data);
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
        const data = await fetchRouteTypes();
        setRouteTypes(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { routeTypes, loading, error, refetch };
};