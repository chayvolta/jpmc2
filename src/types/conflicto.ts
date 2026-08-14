// ============================================================
// Types — Conflicto
// ============================================================

export interface EstadoData {
  /** Clave geográfica del INEGI (e.g. "09") */
  cvegeo: string;
  /** Nombre del estado */
  nombre: string;
  /** Total de conflictos 2017-2026 */
  total_conflictos: number;
  /** Entidad complementaria si existe */
  entidad?: string;
}

export interface GeoJSONProperties {
  CVEGEO: string;
  NOMGEO: string;
  total_conflictos: number;
  entidad?: string;
}

export interface FilterState {
  selectedEstado: string | null;
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
