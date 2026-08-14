// ============================================================
// GeoJSON Service — Load and normalize GeoJSON data
// ============================================================

import type { EstadoData, GeoJSONProperties } from '@/types/conflicto';

export interface GeoJSONFeature {
  type: 'Feature';
  properties: GeoJSONProperties;
  geometry: {
    type: 'MultiPolygon' | 'Polygon';
    coordinates: unknown;
  };
}

export interface GeoJSONCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

let cachedGeoJSON: GeoJSONCollection | null = null;
let cachedEstados: EstadoData[] | null = null;

/**
 * Loads and caches the processed GeoJSON from public/data.
 */
export async function loadGeoJSON(): Promise<GeoJSONCollection> {
  if (cachedGeoJSON) return cachedGeoJSON;

  const response = await fetch('/data/estados_conflictos.geojson');
  if (!response.ok) {
    throw new Error(`Error cargando GeoJSON: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as GeoJSONCollection;
  cachedGeoJSON = data;
  return data;
}

/**
 * Extracts normalized state data from GeoJSON features.
 */
export function extractEstados(geojson: GeoJSONCollection): EstadoData[] {
  if (cachedEstados) return cachedEstados;

  const estados: EstadoData[] = geojson.features.map((feature) => ({
    cvegeo: feature.properties.CVEGEO,
    nombre: normalizeStateName(feature.properties.NOMGEO),
    total_conflictos: feature.properties.total_conflictos ?? 0,
    entidad: feature.properties.entidad,
  }));

  // Sort by total conflicts descending
  estados.sort((a, b) => b.total_conflictos - a.total_conflictos);
  cachedEstados = estados;
  return estados;
}

/**
 * Normalizes state names (some may have encoding issues from QGIS).
 */
function normalizeStateName(name: string): string {
  const corrections: Record<string, string> = {
    'Ciudad de MǸxico': 'Ciudad de México',
    'MǸxico': 'Estado de México',
    'México': 'Estado de México',
    'Michoacǭn de Ocampo': 'Michoacán de Ocampo',
    'Nuevo Le\uFFFDn': 'Nuevo León',
    'San Luis Potos\uFFFD': 'San Luis Potosí',
    'Yucatǭn': 'Yucatán',
  };
  return corrections[name] ?? name;
}

/**
 * Clears the cache (useful for testing).
 */
export function clearCache(): void {
  cachedGeoJSON = null;
  cachedEstados = null;
}
