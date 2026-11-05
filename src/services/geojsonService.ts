import type {
  ConflictDataset,
  ConflictoRegistro,
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

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field.replace(/\r$/, ''));
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    if (row.length > 1 || row[0] !== '') rows.push(row);
  }

  return rows;
}

function normalizeCvegeoList(rawValue: string | undefined): string[] {
  if (!rawValue) return [];
  return String(rawValue)
    .split(/[;|,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (/^\d{4,5}$/.test(item) ? item.padStart(5, '0') : item));
}

function splitLines(value: string | undefined): string[] {
  return String(value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildSourceLabel(media?: string, title?: string): string {
  if (media && title) return `${media} — ${title}`;
  return media || title || '';
}

export function parseInventoryCSV(csvText: string): ConflictDataset {
  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    throw new Error('El archivo CSV de inventario está vacío.');
  }

  const headers = rows[0].map((header) => header.replace(/^\uFEFF/, '').trim());
  // Columna AF (índice 31) contiene la clave geoestadística CVEGEO
  const cvegeoColIndex = headers.indexOf('CVEGEO') !== -1 ? headers.indexOf('CVEGEO') : 31;

  const records: ConflictoRegistro[] = rows.slice(1).map((row) => {
    const caseId = (row[0] ?? '').trim();
    const rawYear = Number.parseFloat((row[1] ?? '').trim());
    const year = Number.isFinite(rawYear) ? Math.round(rawYear) : 0;
    const project = (row[2] ?? '').trim();
    const entity = (row[32] || row[3] || '').trim();
    const municipality = (row[34] || row[33] || row[4] || '').trim();
    const cvegeo = normalizeCvegeoList(row[cvegeoColIndex]);
    const subsector = (row[9] || row[7] || '').trim();
    const eventType = (row[8] || row[7] || '').trim();
    const sourceCoverage = (row[10] ?? '').trim();
    const summary = (row[12] ?? '').trim();
    const allUrls = splitLines(row[18]);
    const urlPrimary = (row[13] ?? '').trim() || allUrls[0] || '';
    const urlSecondary = (row[14] ?? '').trim() || allUrls[1] || '';
    const medias = splitLines(row[21]);
    const titles = splitLines(row[22]);
    const sourcePrimary = buildSourceLabel(medias[0], titles[0]);
    const sourceSecondary = buildSourceLabel(medias[1], titles[1]);
    const summaryMethod = splitLines(row[24])[0] || '';
    const verificationStatus = splitLines(row[26])[0] || '';
    const georefStatus = (row[36] ?? '').trim();
    const auditStatus = georefStatus || verificationStatus || 'REGISTRADO';

    return {
      caseId,
      year,
      project,
      summary,
      entity,
      municipality,
      cvegeo,
      geographicScope: cvegeo.length > 1 ? 'MULTIMUNICIPAL' : 'UNIMUNICIPAL',
      subsector,
      eventType,
      auditStatus,
      summaryMethod,
      sourcePrimary,
      urlPrimary,
      sourceSecondary,
      urlSecondary,
      sourceCoverage,
    };
  });

  return {
    metadata: {
      generatedAt: new Date().toISOString().slice(0, 10),
      source: 'Inventario_JPGG217-2026.csv',
      uniqueConflicts: records.length,
      municipalAssignments: records.reduce((total, record) => total + record.cvegeo.length, 0),
      joinKey: 'CVEGEO',
      notes: 'Join municipal mediante la clave geoestadística CVEGEO (columna AF de Inventario_JPGG217-2026.csv).',
    },
    records,
  };
}

export function joinGeoJSONWithConflicts(
  baseGeoJSON: GeoJSONCollection,
  conflicts: ConflictDataset
): GeoJSONCollection {
  const municipalityKeys = new Set(
    baseGeoJSON.features.map((feature) => String(feature.properties.CVEGEO ?? '').padStart(5, '0'))
  );
  const conflictsByMunicipality = new Map<string, ConflictoRegistro[]>();

  for (const conflict of conflicts.records) {
    for (const rawCvegeo of conflict.cvegeo) {
      const cvegeo = String(rawCvegeo).trim().padStart(5, '0');
      if (!cvegeo || !municipalityKeys.has(cvegeo)) continue;
      const list = conflictsByMunicipality.get(cvegeo);
      if (list) {
        list.push(conflict);
      } else {
        conflictsByMunicipality.set(cvegeo, [conflict]);
      }
    }
  }

  const features: GeoJSONFeature[] = baseGeoJSON.features.map((feature) => {
    const cvegeo = String(feature.properties.CVEGEO ?? '').padStart(5, '0');
    const municipalConflicts = conflictsByMunicipality.get(cvegeo) ?? [];
    const years = [
      ...new Set(
        municipalConflicts
          .map((conflict) => conflict.year)
          .filter((year) => Number.isFinite(year) && year > 0)
      ),
    ].sort((left, right) => left - right);

    return {
      ...feature,
      properties: {
        ...feature.properties,
        CVEGEO: cvegeo,
        CVE_ENT: String(feature.properties.CVE_ENT ?? cvegeo.slice(0, 2)),
        CVE_MUN: String(feature.properties.CVE_MUN ?? cvegeo.slice(2)),
        total_conflictos: municipalConflicts.length,
        conflictos_validados: municipalConflicts.filter((conflict) => {
          const status = String(conflict.auditStatus ?? '');
          return status.startsWith('VALIDADO') || status === 'CLAVE_ASIGNADA_MUNICIPIO_ORIGINAL';
        }).length,
        conflictos_pendientes: municipalConflicts.filter((conflict) => {
          const status = String(conflict.auditStatus ?? '');
          return status.includes('PENDIENTE') || status.includes('REVISAR');
        }).length,
        primer_anio: years[0] ?? null,
        ultimo_anio: years[years.length - 1] ?? null,
      },
    };
  });

  return {
    type: 'FeatureCollection',
    metadata: {
      ...baseGeoJSON.metadata,
      conflictsSource: conflicts.metadata.source,
      joinKey: 'CVEGEO',
      municipalities: features.length,
      municipalitiesWithConflicts: conflictsByMunicipality.size,
      uniqueConflicts: conflicts.metadata.uniqueConflicts,
      municipalAssignments: conflicts.metadata.municipalAssignments,
    },
    features,
  };
}

export async function loadMunicipalData(): Promise<MunicipalDataBundle> {
  if (cachedBundle) return cachedBundle;

  const [geojsonResponse, csvResponse] = await Promise.all([
    fetch('/data/municipios_conflictos.geojson'),
    fetch('/data/Inventario_JPGG217-2026.csv'),
  ]);

  if (!geojsonResponse.ok) {
    throw new Error(`Error cargando municipios: ${geojsonResponse.status} ${geojsonResponse.statusText}`);
  }

  const baseGeoJSON = (await geojsonResponse.json()) as GeoJSONCollection;
  let conflicts: ConflictDataset;

  if (csvResponse.ok) {
    const csvText = await csvResponse.text();
    conflicts = parseInventoryCSV(csvText);
  } else {
    const conflictsResponse = await fetch('/data/conflictos_municipales.json');
    if (!conflictsResponse.ok) {
      throw new Error(`Error cargando conflictos: ${conflictsResponse.status} ${conflictsResponse.statusText}`);
    }
    conflicts = (await conflictsResponse.json()) as ConflictDataset;
  }

  const geojson = joinGeoJSONWithConflicts(baseGeoJSON, conflicts);
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
