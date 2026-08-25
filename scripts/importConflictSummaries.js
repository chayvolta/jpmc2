import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const rootDirectory = resolve(scriptDirectory, '..');
const sourceArgument = process.argv[2];

if (!sourceArgument) {
  console.error('Uso: npm run import-conflicts -- <ruta/record_summaries.json>');
  process.exit(1);
}

const sourcePath = resolve(process.cwd(), sourceArgument);
const outputPath = resolve(rootDirectory, 'public', 'data', 'conflictos_municipales.json');
const payload = JSON.parse(readFileSync(sourcePath, 'utf8'));

if (!Array.isArray(payload.results)) {
  throw new Error('El archivo de entrada no contiene un arreglo results.');
}

const records = payload.results.map((record) => ({
  caseId: record.caseId,
  year: Number(record.currentYear),
  project: record.project,
  summary: record.shortSummary,
  entity: record.entity,
  municipality: record.municipality,
  cvegeo: String(record.cvegeo).split(';').filter(Boolean),
  geographicScope: record.geographicScope,
  subsector: record.subsector,
  eventType: record.eventType,
  auditStatus: record.auditStatus,
  summaryMethod: record.summaryMethod,
  sourcePrimary: record.sourcePrimary || '',
  urlPrimary: record.urlPrimary || '',
  sourceSecondary: record.sourceSecondary || '',
  urlSecondary: record.urlSecondary || '',
  sourceCoverage: record.sourceCoverage || '',
}));

const caseIds = new Set(records.map((record) => record.caseId));
if (records.length !== caseIds.size) {
  throw new Error(`Se detectaron CASE_ID duplicados: ${records.length - caseIds.size}`);
}

const output = {
  metadata: {
    generatedAt: '2026-08-25',
    source: basename(sourcePath),
    uniqueConflicts: records.length,
    municipalAssignments: records.reduce((total, record) => total + record.cvegeo.length, 0),
    joinKey: 'CVEGEO',
    notes: 'Los conflictos multimunicipales se vinculan con cada CVEGEO sin duplicar el CASE_ID en el total nacional.',
  },
  records,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(output), 'utf8');
console.log(JSON.stringify({ output: outputPath, ...output.metadata }, null, 2));
