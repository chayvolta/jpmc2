export interface ColorStop {
  value: number;
  color: string;
  label: string;
}

export const CONFLICT_COLOR_SCALE: ColorStop[] = [
  { value: 0, color: '#263449', label: '0' },
  { value: 1, color: '#bfdbfe', label: '1' },
  { value: 2, color: '#60a5fa', label: '2' },
  { value: 3, color: '#2563eb', label: '3–5' },
  { value: 6, color: '#f59e0b', label: '6+' },
];

export function getConflictColor(count: number): string {
  if (count === 0) return '#263449';
  if (count === 1) return '#bfdbfe';
  if (count === 2) return '#60a5fa';
  if (count <= 5) return '#2563eb';
  return '#f59e0b';
}

export function getConflictOpacity(count: number): number {
  if (count === 0) return 0.3;
  if (count <= 2) return 0.7;
  return 0.88;
}

export function getMapLibreColorExpression(): unknown[] {
  return [
    'step',
    ['get', 'total_conflictos'],
    '#263449',
    1, '#bfdbfe',
    2, '#60a5fa',
    3, '#2563eb',
    6, '#f59e0b',
  ];
}

export function getMapLibreHighlightExpression(hoveredId: string | null): unknown[] {
  if (!hoveredId) return getMapLibreColorExpression();
  return [
    'case',
    ['==', ['get', 'CVEGEO'], hoveredId],
    '#ffffff',
    getMapLibreColorExpression(),
  ];
}
