import type { MunicipioData } from '@/types/conflicto';

export interface Stats {
  totalConflictos: number;
  asignacionesMunicipales: number;
  municipiosAfectados: number;
  promedioAsignaciones: number;
  max: number;
  municipioMax: string;
  top10: MunicipioData[];
  distribucion: ConflictRange[];
}

export interface ConflictRange {
  label: string;
  count: number;
  color: string;
}

export function calcularEstadisticas(municipios: MunicipioData[], totalConflictos: number): Stats {
  const afectados = municipios.filter((municipio) => municipio.totalConflictos > 0);
  if (afectados.length === 0) {
    return {
      totalConflictos,
      asignacionesMunicipales: 0,
      municipiosAfectados: 0,
      promedioAsignaciones: 0,
      max: 0,
      municipioMax: '',
      top10: [],
      distribucion: [],
    };
  }

  const asignacionesMunicipales = afectados.reduce((total, municipio) => total + municipio.totalConflictos, 0);
  const sorted = [...afectados].sort((left, right) => right.totalConflictos - left.totalConflictos);
  const maxMunicipio = sorted[0];

  return {
    totalConflictos,
    asignacionesMunicipales,
    municipiosAfectados: afectados.length,
    promedioAsignaciones: Math.round((asignacionesMunicipales / afectados.length) * 10) / 10,
    max: maxMunicipio.totalConflictos,
    municipioMax: `${maxMunicipio.nombre}, ${maxMunicipio.entidad}`,
    top10: sorted.slice(0, 10),
    distribucion: [
      { label: '1', color: '#bfdbfe', count: afectados.filter((municipio) => municipio.totalConflictos === 1).length },
      { label: '2', color: '#60a5fa', count: afectados.filter((municipio) => municipio.totalConflictos === 2).length },
      { label: '3–5', color: '#2563eb', count: afectados.filter((municipio) => municipio.totalConflictos >= 3 && municipio.totalConflictos <= 5).length },
      { label: '6+', color: '#f59e0b', count: afectados.filter((municipio) => municipio.totalConflictos >= 6).length },
    ].filter((range) => range.count > 0),
  };
}

export function formatNumber(value: number): string {
  return value.toLocaleString('es-MX');
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
