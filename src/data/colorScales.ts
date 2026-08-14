// ============================================================
// Color Scales — Choropleth Classification
// ============================================================

export interface ColorStop {
  value: number;
  color: string;
  label: string;
}

/**
 * Natural breaks color scale for conflict count choropleth.
 * Based on data range: 2–306 conflicts per state.
 */
export const CONFLICT_COLOR_SCALE: ColorStop[] = [
  { value: 0,   color: '#cfe8f7', label: '0–5' },
  { value: 5,   color: '#9dd1f0', label: '6–15' },
  { value: 15,  color: '#6baed6', label: '16–30' },
  { value: 30,  color: '#2171b5', label: '31–60' },
  { value: 60,  color: '#f59e0b', label: '61–150' },
  { value: 150, color: '#ef4444', label: '151+' },
];

/**
 * Returns the fill color for a given conflict count.
 */
export function getConflictColor(count: number): string {
  if (count <= 5)   return '#cfe8f7';
  if (count <= 15)  return '#9dd1f0';
  if (count <= 30)  return '#6baed6';
  if (count <= 60)  return '#2171b5';
  if (count <= 150) return '#f59e0b';
  return '#ef4444';
}

/**
 * Returns color opacity for a given count (for hover effects).
 */
export function getConflictOpacity(count: number): number {
  if (count === 0) return 0.3;
  if (count <= 10) return 0.6;
  if (count <= 50) return 0.75;
  return 0.85;
}

/**
 * MapLibre GL step expression for fill color.
 * Generates: ['step', ['get', 'total_conflictos'], ...steps]
 */
export function getMapLibreColorExpression(): unknown[] {
  return [
    'step',
    ['get', 'total_conflictos'],
    '#cfe8f7',  // default (0-5)
    6,  '#9dd1f0',
    16, '#6baed6',
    31, '#2171b5',
    61, '#f59e0b',
    151,'#ef4444',
  ];
}

/**
 * MapLibre GL step expression for highlighted state.
 */
export function getMapLibreHighlightExpression(hoveredId: string | null): unknown[] {
  if (!hoveredId) {
    return getMapLibreColorExpression();
  }
  return [
    'case',
    ['==', ['get', 'CVEGEO'], hoveredId],
    '#ffffff',
    getMapLibreColorExpression() as string,
  ];
}
