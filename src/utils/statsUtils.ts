// ============================================================
// Stats Utils — Statistical Calculations
// ============================================================

import type { EstadoData } from '@/types/conflicto';

export interface Stats {
  total_conflictos: number;
  estados_afectados: number;
  promedio: number;
  max: number;
  estado_max: string;
  top10: EstadoData[];
  distribucion: ConflictRange[];
}

export interface ConflictRange {
  label: string;
  count: number;
  color: string;
}

/**
 * Calculates comprehensive statistics from state data.
 */
export function calcularEstadisticas(estados: EstadoData[]): Stats {
  if (estados.length === 0) {
    return {
      total_conflictos: 0,
      estados_afectados: 0,
      promedio: 0,
      max: 0,
      estado_max: '',
      top10: [],
      distribucion: [],
    };
  }

  const total = estados.reduce((sum, e) => sum + e.total_conflictos, 0);
  const afectados = estados.filter(e => e.total_conflictos > 0).length;
  const promedio = Math.round(total / estados.length);
  const sorted = [...estados].sort((a, b) => b.total_conflictos - a.total_conflictos);
  const maxEstado = sorted[0];
  const top10 = sorted.slice(0, 10);

  const distribucion: ConflictRange[] = [
    { label: '0–5',   color: '#cfe8f7', count: estados.filter(e => e.total_conflictos <= 5).length },
    { label: '6–15',  color: '#9dd1f0', count: estados.filter(e => e.total_conflictos >= 6 && e.total_conflictos <= 15).length },
    { label: '16–30', color: '#6baed6', count: estados.filter(e => e.total_conflictos >= 16 && e.total_conflictos <= 30).length },
    { label: '31–60', color: '#2171b5', count: estados.filter(e => e.total_conflictos >= 31 && e.total_conflictos <= 60).length },
    { label: '61–150',color: '#f59e0b', count: estados.filter(e => e.total_conflictos >= 61 && e.total_conflictos <= 150).length },
    { label: '151+',  color: '#ef4444', count: estados.filter(e => e.total_conflictos > 150).length },
  ].filter(r => r.count > 0);

  return {
    total_conflictos: total,
    estados_afectados: afectados,
    promedio,
    max: maxEstado.total_conflictos,
    estado_max: maxEstado.nombre,
    top10,
    distribucion,
  };
}

/**
 * Formats a number with thousand separators.
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('es-MX');
}

/**
 * Returns percentage string.
 */
export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

/**
 * Truncates text to a max length with ellipsis.
 */
export function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}
