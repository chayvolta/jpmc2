import { useEffect } from 'react';
import { useConflictStore } from '@/store/conflictStore';
import { extractMunicipios, loadMunicipalData } from '@/services/geojsonService';

export function useMunicipalData() {
  const {
    setGeoJSON,
    setMunicipios,
    setConflictos,
    setMetadata,
    setLoading,
    setError,
    isLoading,
    error,
    geojson,
  } = useConflictStore();

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const bundle = await loadMunicipalData();
        if (cancelled) return;
        setGeoJSON(bundle.geojson);
        setMunicipios(extractMunicipios(bundle.geojson));
        setConflictos(bundle.conflicts.records);
        setMetadata(bundle.conflicts.metadata);
      } catch (errorValue) {
        if (!cancelled) {
          setError(errorValue instanceof Error ? errorValue.message : 'Error desconocido al cargar datos');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [setGeoJSON, setMunicipios, setConflictos, setMetadata, setLoading, setError]);

  return { isLoading, error, geojson };
}
