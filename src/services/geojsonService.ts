import type {
  ConflictDataset,
  GeoJSONProperties,
  MunicipioData,
} from '@/types/conflicto';

export interface GeoJSONFeature {
  type: 'Feature';
  properties: GeoJSONProperties;
  geometry: {
    type: 'MultiPolygon' | 'Polygon';
    coordinates: unknown;
  };
}

export interface GeoJSONMetadata {
  generatedAt: string;
  source: string;
  conflictsSource: string;
  joinKey: string;
  municipalities: number;
  municipalitiesWithConflicts: number;
  uniqueConflicts: number;
  municipalAssignments: number;
  simplificationToleranceDegrees: number;
}

export interface GeoJSONCollection {
  type: 'FeatureCollection';
  metadata: GeoJSONMetadata;
  features: GeoJSONFeature[];
}

export interface MunicipalDataBundle {
  geojson: GeoJSONCollection;
  conflicts: ConflictDataset;
}

let cachedBundle: MunicipalDataBundle | null = null;
let cachedMunicipios: MunicipioData[] | null = null;

export async function loadMunicipalData(): Promise<MunicipalDataBundle> {
  if (cachedBundle) return cachedBundle;

  const [geojsonResponse, conflictsResponse] = await Promise.all([
    fetch('/data/municipios_conflictos.geojson'),
    fetch('/data/conflictos_municipales.json'),
  ]);

  if (!geojsonResponse.ok) {
    throw new Error(`Error cargando municipios: ${geojsonResponse.status} ${geojsonResponse.statusText}`);
  }
  if (!conflictsResponse.ok) {
    throw new Error(`Error cargando conflictos: ${conflictsResponse.status} ${conflictsResponse.statusText}`);
  }

  const geojson = await geojsonResponse.json() as GeoJSONCollection;
  const conflicts = await conflictsResponse.json() as ConflictDataset;
  cachedBundle = { geojson, conflicts };
  return cachedBundle;
}

export function extractMunicipios(geojson: GeoJSONCollection): MunicipioData[] {
  if (cachedMunicipios) return cachedMunicipios;

  cachedMunicipios = geojson.features.map((feature) => ({
    cvegeo: feature.properties.CVEGEO,
    cveEnt: feature.properties.CVE_ENT,
    cveMun: feature.properties.CVE_MUN,
    nombre: feature.properties.NOMMUN,
    entidad: normalizeStateName(feature.properties.NOMGEO),
    totalConflictos: feature.properties.total_conflictos ?? 0,
    conflictosValidados: feature.properties.conflictos_validados ?? 0,
    conflictosPendientes: feature.properties.conflictos_pendientes ?? 0,
    primerAnio: feature.properties.primer_anio ?? null,
    ultimoAnio: feature.properties.ultimo_anio ?? null,
  }));

  cachedMunicipios.sort((left, right) =>
    right.totalConflictos - left.totalConflictos ||
    left.entidad.localeCompare(right.entidad, 'es-MX') ||
    left.nombre.localeCompare(right.nombre, 'es-MX')
  );
  return cachedMunicipios;
}

function normalizeStateName(name: string): string {
  const corrections: Record<string, string> = {
    'México': 'Estado de México',
    'Michoacán de Ocampo': 'Michoacán',
    'Veracruz de Ignacio de la Llave': 'Veracruz',
  };
  return corrections[name] ?? name;
}

export function clearCache(): void {
  cachedBundle = null;
  cachedMunicipios = null;
}
