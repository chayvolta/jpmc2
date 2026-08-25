import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const rootDirectory = resolve(scriptDirectory, '..');
const sourceArgument = process.argv[2];
const toleranceArgument = Number(process.argv[3] ?? 0.0025);
const sourcePath = sourceArgument
  ? resolve(process.cwd(), sourceArgument)
  : resolve(rootDirectory, 'data', 'municipalities_simple.geojson');
const conflictsPath = resolve(rootDirectory, 'public', 'data', 'conflictos_municipales.json');
const outputPath = resolve(rootDirectory, 'public', 'data', 'municipios_conflictos.geojson');

if (!existsSync(sourcePath)) {
  console.error('No se encontró el GeoJSON municipal.');
  console.error('Uso: npm run join-municipalities -- <ruta/municipalities_simple.geojson> [tolerancia]');
  process.exit(1);
}

const sourceGeoJSON = JSON.parse(readFileSync(sourcePath, 'utf8'));
const conflictPayload = JSON.parse(readFileSync(conflictsPath, 'utf8'));

if (!Array.isArray(sourceGeoJSON.features) || !Array.isArray(conflictPayload.records)) {
  throw new Error('Entradas inválidas: se requieren features municipales y records de conflictos.');
}

const municipalityKeys = new Set(sourceGeoJSON.features.map((feature) => String(feature.properties?.CVEGEO ?? '')));
const conflictsByMunicipality = new Map();
const missingKeys = new Set();

for (const conflict of conflictPayload.records) {
  for (const cvegeo of conflict.cvegeo) {
    if (!municipalityKeys.has(cvegeo)) {
      missingKeys.add(cvegeo);
      continue;
    }
    if (!conflictsByMunicipality.has(cvegeo)) conflictsByMunicipality.set(cvegeo, []);
    conflictsByMunicipality.get(cvegeo).push(conflict);
  }
}

if (missingKeys.size > 0) {
  throw new Error(`CVEGEO sin geometría municipal: ${[...missingKeys].join(', ')}`);
}

function squaredSegmentDistance(point, start, end) {
  let xCoordinate = start[0];
  let yCoordinate = start[1];
  let deltaX = end[0] - xCoordinate;
  let deltaY = end[1] - yCoordinate;

  if (deltaX !== 0 || deltaY !== 0) {
    const projection = ((point[0] - xCoordinate) * deltaX + (point[1] - yCoordinate) * deltaY) / (deltaX * deltaX + deltaY * deltaY);
    if (projection > 1) {
      xCoordinate = end[0];
      yCoordinate = end[1];
    } else if (projection > 0) {
      xCoordinate += deltaX * projection;
      yCoordinate += deltaY * projection;
    }
  }

  deltaX = point[0] - xCoordinate;
  deltaY = point[1] - yCoordinate;
  return deltaX * deltaX + deltaY * deltaY;
}

function simplifyDouglasPeucker(points, firstIndex, lastIndex, squaredTolerance, simplified) {
  let maximumDistance = squaredTolerance;
  let splitIndex = 0;

  for (let pointIndex = firstIndex + 1; pointIndex < lastIndex; pointIndex += 1) {
    const distance = squaredSegmentDistance(points[pointIndex], points[firstIndex], points[lastIndex]);
    if (distance > maximumDistance) {
      splitIndex = pointIndex;
      maximumDistance = distance;
    }
  }

  if (maximumDistance > squaredTolerance) {
    if (splitIndex - firstIndex > 1) simplifyDouglasPeucker(points, firstIndex, splitIndex, squaredTolerance, simplified);
    simplified.push(points[splitIndex]);
    if (lastIndex - splitIndex > 1) simplifyDouglasPeucker(points, splitIndex, lastIndex, squaredTolerance, simplified);
  }
}

function simplifyRing(ring, tolerance) {
  if (!Array.isArray(ring) || ring.length <= 5) return ring;
  const openRing = ring.slice(0, -1);
  const squaredTolerance = tolerance * tolerance;
  const simplified = [openRing[0]];
  simplifyDouglasPeucker(openRing, 0, openRing.length - 1, squaredTolerance, simplified);
  simplified.push(openRing[openRing.length - 1]);
  if (simplified.length < 3) return ring;
  simplified.push([...simplified[0]]);
  return simplified;
}

function simplifyGeometry(geometry, tolerance) {
  if (!geometry) return null;
  if (geometry.type === 'Polygon') {
    return { type: 'Polygon', coordinates: geometry.coordinates.map((ring) => simplifyRing(ring, tolerance)) };
  }
  if (geometry.type === 'MultiPolygon') {
    return {
      type: 'MultiPolygon',
      coordinates: geometry.coordinates.map((polygon) => polygon.map((ring) => simplifyRing(ring, tolerance))),
    };
  }
  return geometry;
}

const features = sourceGeoJSON.features.map((feature) => {
  const originalProperties = feature.properties ?? {};
  const cvegeo = String(originalProperties.CVEGEO ?? '');
  const conflicts = conflictsByMunicipality.get(cvegeo) ?? [];
  const years = [...new Set(conflicts.map((conflict) => conflict.year))].sort((left, right) => left - right);

  return {
    type: 'Feature',
    properties: {
      CVEGEO: cvegeo,
      CVE_ENT: String(originalProperties.CVE_ENT ?? cvegeo.slice(0, 2)),
      CVE_MUN: String(originalProperties.CVE_MUN ?? cvegeo.slice(2)),
      NOMGEO: originalProperties.NOMGEO ?? '',
      NOMMUN: originalProperties.NOMMUN ?? '',
      total_conflictos: conflicts.length,
      conflictos_validados: conflicts.filter((conflict) => String(conflict.auditStatus).startsWith('VALIDADO')).length,
      conflictos_pendientes: conflicts.filter((conflict) => String(conflict.auditStatus).includes('PENDIENTE')).length,
      primer_anio: years[0] ?? null,
      ultimo_anio: years.at(-1) ?? null,
    },
    geometry: simplifyGeometry(feature.geometry, toleranceArgument),
  };
});

const output = {
  type: 'FeatureCollection',
  metadata: {
    generatedAt: '2026-08-25',
    source: basename(sourcePath),
    conflictsSource: basename(conflictsPath),
    joinKey: 'CVEGEO',
    municipalities: features.length,
    municipalitiesWithConflicts: conflictsByMunicipality.size,
    uniqueConflicts: conflictPayload.metadata.uniqueConflicts,
    municipalAssignments: conflictPayload.metadata.municipalAssignments,
    simplificationToleranceDegrees: toleranceArgument,
  },
  features,
};

writeFileSync(outputPath, JSON.stringify(output), 'utf8');
console.log(JSON.stringify({ output: outputPath, ...output.metadata }, null, 2));
