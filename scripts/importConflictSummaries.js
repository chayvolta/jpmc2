import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const rootDirectory = resolve(scriptDirectory, '..');
const defaultCsvPath = resolve(rootDirectory, 'public', 'data', 'Inventario_JPGG217-2026.csv');
const sourceArgument = process.argv[2];
const sourcePath = sourceArgument
  ? resolve(process.cwd(), sourceArgument)
  : defaultCsvPath;

if (!existsSync(sourcePath)) {
  console.error('Uso: npm run import-conflicts -- [ruta/Inventario_JPGG217-2026.csv | ruta/record_summaries.json]');
  process.exit(1);
}

function parseCSV(text) {
  const rows = [];
  let row = [];
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

function normalizeCvegeoList(rawValue) {
  if (!rawValue) return [];
  return String(rawValue)
    .split(/[;|,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (/^\d{4,5}$/.test(item) ? item.padStart(5, '0') : item));
}

function splitLines(value) {
  return String(value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildSourceLabel(media, title) {
  if (media && title) return `${media} — ${title}`;
  return media || title || '';
}

function parseRecordsFromCSV(csvText) {
  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    throw new Error('El archivo CSV no contiene registros.');
  }

  const headers = rows[0].map((header) => header.replace(/^\uFEFF/, '').trim());
  // Column AF (index 31) is CVEGEO
  const cvegeoColIndex = headers.indexOf('CVEGEO') !== -1 ? headers.indexOf('CVEGEO') : 31;

  return rows.slice(1).map((row) => {
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
}

function parseRecordsFromJSON(jsonText) {
  const payload = JSON.parse(jsonText);
  if (!Array.isArray(payload.results)) {
    throw new Error('El archivo de entrada no contiene un arreglo results.');
  }

  return payload.results.map((record) => ({
    caseId: record.caseId,
    year: Number(record.currentYear),
    project: record.project,
    summary: record.shortSummary,
    entity: record.entity,
    municipality: record.municipality,
    cvegeo: normalizeCvegeoList(record.cvegeo),
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
}

const rawInput = readFileSync(sourcePath, 'utf8');
const isCsv = extname(sourcePath).toLowerCase() === '.csv';
const records = isCsv ? parseRecordsFromCSV(rawInput) : parseRecordsFromJSON(rawInput);

const caseIds = new Set(records.map((record) => record.caseId));
if (records.length !== caseIds.size) {
  throw new Error(`Se detectaron CASE_ID duplicados: ${records.length - caseIds.size}`);
}

const outputPath = resolve(rootDirectory, 'public', 'data', 'conflictos_municipales.json');
const output = {
  metadata: {
    generatedAt: new Date().toISOString().slice(0, 10),
    source: basename(sourcePath),
    uniqueConflicts: records.length,
    municipalAssignments: records.reduce((total, record) => total + record.cvegeo.length, 0),
    joinKey: 'CVEGEO',
    notes: 'Join municipal mediante la clave geoestadística CVEGEO (columna AF de Inventario_JPGG217-2026.csv).',
  },
  records,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(output), 'utf8');
console.log(JSON.stringify({ output: outputPath, ...output.metadata }, null, 2));
