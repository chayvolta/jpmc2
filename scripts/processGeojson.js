/**
 * processGeojson.js
 * -----------------
 * Reproyecta el GeoJSON de México de EPSG:6372 a WGS84 (EPSG:4326)
 * y simplifica las geometrías para reducir el tamaño del archivo.
 *
 * Uso: node scripts/processGeojson.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import proj4 from 'proj4';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// --- Definición de proyecciones ---
// EPSG:6372 — México ITRF2008 LCC
const EPSG6372 =
  '+proj=lcc +lat_0=12 +lon_0=-102 +lat_1=17.5 +lat_2=29.5 +x_0=2500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs';
const WGS84 = 'EPSG:4326';

proj4.defs('EPSG:6372', EPSG6372);

const converter = proj4('EPSG:6372', WGS84);

// --- Simplificación de coordenadas (Douglas-Peucker simplificado) ---
function simplifyCoords(coords, tolerance = 0.005) {
  if (coords.length <= 2) return coords;
  const result = [coords[0]];
  for (let i = 1; i < coords.length - 1; i++) {
    const prev = result[result.length - 1];
    const curr = coords[i];
    const dx = curr[0] - prev[0];
    const dy = curr[1] - prev[1];
    if (Math.sqrt(dx * dx + dy * dy) >= tolerance) {
      result.push(curr);
    }
  }
  result.push(coords[coords.length - 1]);
  return result;
}

// --- Reproyección de coordenadas ---
function reprojectCoord([x, y]) {
  const [lon, lat] = converter.forward([x, y]);
  return [
    Math.round(lon * 1e6) / 1e6,
    Math.round(lat * 1e6) / 1e6,
  ];
}

function processRing(ring) {
  const reprojected = ring.map(reprojectCoord);
  return simplifyCoords(reprojected, 0.005);
}

function processGeometry(geometry) {
  if (!geometry) return null;

  switch (geometry.type) {
    case 'Polygon':
      return {
        type: 'Polygon',
        coordinates: geometry.coordinates.map(processRing),
      };
    case 'MultiPolygon':
      return {
        type: 'MultiPolygon',
        coordinates: geometry.coordinates.map((poly) =>
          poly.map(processRing)
        ),
      };
    default:
      return geometry;
  }
}

// --- Procesamiento principal ---
console.log('📂 Leyendo GeoJSON original...');
const inputPath = resolve(ROOT, 'Estados_conflictos_con_Base.geojson');
const raw = readFileSync(inputPath, 'utf-8');

console.log('🔄 Parseando JSON...');
const geojson = JSON.parse(raw);

console.log(`📊 Features encontradas: ${geojson.features.length}`);
console.log('🌍 Reproyectando de EPSG:6372 a WGS84...');

let processed = 0;
const features = geojson.features.map((feature) => {
  processed++;
  process.stdout.write(`  → Feature ${processed}/${geojson.features.length}: ${feature.properties?.NOMGEO}\r`);

  // Limpiar propiedades — eliminar campos auxiliares de QGIS
  const { properties } = feature;
  const cleanProps = {
    CVEGEO: properties.CVEGEO || '',
    NOMGEO: properties.NOMGEO || 'Desconocido',
    total_conflictos: properties['2017-2026_Total de casos'] ?? 0,
    entidad: properties['2017-2026_Entidad'] || '',
  };

  return {
    type: 'Feature',
    properties: cleanProps,
    geometry: processGeometry(feature.geometry),
  };
});

console.log('\n✅ Reproyección completada.');
console.log('📐 Simplificando geometrías...');

const output = {
  type: 'FeatureCollection',
  features,
};

const outputPath = resolve(ROOT, 'public', 'data', 'estados_conflictos.geojson');
const outputStr = JSON.stringify(output);
writeFileSync(outputPath, outputStr, 'utf-8');

const inputSize = (raw.length / 1024 / 1024).toFixed(2);
const outputSize = (outputStr.length / 1024 / 1024).toFixed(2);

console.log(`\n🎉 GeoJSON procesado exitosamente:`);
console.log(`   Entrada: ${inputSize} MB`);
console.log(`   Salida:  ${outputSize} MB`);
console.log(`   Reducción: ${Math.round((1 - outputStr.length / raw.length) * 100)}%`);
console.log(`   Guardado en: ${outputPath}`);
