// ============================================================
// Hook — useGeoJSON
// Loads GeoJSON and populates the store
// ============================================================

import { useEffect } from 'react';
import { useConflictStore } from '@/store/conflictStore';
import { loadGeoJSON, extractEstados } from '@/services/geojsonService';

export function useGeoJSON() {
  const { setGeoJSON, setEstados, setLoading, setError, isLoading, error, geojson } =
    useConflictStore();

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const data = await loadGeoJSON();
        if (cancelled) return;
        setGeoJSON(data);
        const estados = extractEstados(data);
        setEstados(estados);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error desconocido al cargar datos');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [setGeoJSON, setEstados, setLoading, setError]);

  return { isLoading, error, geojson };
}
