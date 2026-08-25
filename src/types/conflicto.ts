export interface MunicipioData {
  cvegeo: string;
  cveEnt: string;
  cveMun: string;
  nombre: string;
  entidad: string;
  totalConflictos: number;
  conflictosValidados: number;
  conflictosPendientes: number;
  primerAnio: number | null;
  ultimoAnio: number | null;
}

export interface GeoJSONProperties {
  CVEGEO: string;
  CVE_ENT: string;
  CVE_MUN: string;
  NOMGEO: string;
  NOMMUN: string;
  total_conflictos: number;
  conflictos_validados: number;
  conflictos_pendientes: number;
  primer_anio: number | null;
  ultimo_anio: number | null;
}

export interface ConflictoRegistro {
  caseId: string;
  year: number;
  project: string;
  summary: string;
  entity: string;
  municipality: string;
  cvegeo: string[];
  geographicScope: 'UNIMUNICIPAL' | 'MULTIMUNICIPAL';
  subsector: string;
  eventType: string;
  auditStatus: string;
  summaryMethod: string;
  sourcePrimary: string;
  urlPrimary: string;
  sourceSecondary: string;
  urlSecondary: string;
  sourceCoverage: string;
}

export interface ConflictDatasetMetadata {
  generatedAt: string;
  source: string;
  uniqueConflicts: number;
  municipalAssignments: number;
  joinKey: string;
  notes: string;
}

export interface ConflictDataset {
  metadata: ConflictDatasetMetadata;
  records: ConflictoRegistro[];
}

export interface FilterState {
  selectedMunicipio: string | null;
  searchText: string;
}

export interface ConflictColorInfo {
  color: string;
  label: string;
  min: number;
  max: number;
}

export type SortField = 'total_conflictos' | 'nombre';
export type SortOrder = 'asc' | 'desc';
