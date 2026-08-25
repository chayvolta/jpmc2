// ============================================================
// StatsOverview — KPI Cards
// ============================================================

import { useMemo } from 'react';
import { useConflictStore } from '@/store/conflictStore';
import { calcularEstadisticas, formatNumber } from '@/utils/statsUtils';
import { AlertTriangle, Map, TrendingUp, BarChart2 } from 'lucide-react';
import { getConflictColor } from '@/data/colorScales';

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accentColor?: string;
  id: string;
}

function KPICard({ icon, label, value, sub, accentColor = '#3b82f6', id }: KPICardProps) {
  return (
    <div
      id={id}
      className="card rounded-xl p-4 flex items-start gap-3 hover:border-white/16 transition-all duration-200"
      style={{ borderColor: `${accentColor}22` }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: `${accentColor}22` }}
      >
        <span style={{ color: accentColor }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 mb-0.5 uppercase tracking-wider font-medium">{label}</p>
        <p
          className="text-2xl font-black leading-none truncate"
          style={{ color: accentColor }}
        >
          {value}
        </p>
        {sub && <p className="text-xs text-slate-500 mt-1 leading-tight">{sub}</p>}
      </div>
    </div>
  );
}

export default function StatsOverview() {
  const { municipios, conflictos, metadata } = useConflictStore();

  const stats = useMemo(
    () => calcularEstadisticas(municipios, conflictos.length),
    [conflictos.length, municipios]
  );

  if (municipios.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="card rounded-xl p-4 animate-pulse">
            <div className="h-3 bg-white/10 rounded mb-2 w-3/4" />
            <div className="h-6 bg-white/10 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  const maxColor = getConflictColor(stats.max);

  return (
    <div className="grid grid-cols-2 gap-2">
      <KPICard
        id="kpi-total-conflictos"
        icon={<AlertTriangle size={16} />}
        label="Total conflictos"
        value={formatNumber(stats.totalConflictos)}
        sub="casos únicos auditados"
        accentColor="#f59e0b"
      />
      <KPICard
        id="kpi-municipios-afectados"
        icon={<Map size={16} />}
        label="Municipios"
        value={formatNumber(stats.municipiosAfectados)}
        sub={`de ${formatNumber(municipios.length)} con conflictos`}
        accentColor="#3b82f6"
      />
      <KPICard
        id="kpi-asignaciones"
        icon={<BarChart2 size={16} />}
        label="Asignaciones"
        value={formatNumber(metadata?.municipalAssignments ?? stats.asignacionesMunicipales)}
        sub="vínculos territoriales"
        accentColor="#8b5cf6"
      />
      <KPICard
        id="kpi-municipio-max"
        icon={<TrendingUp size={16} />}
        label="Máximo"
        value={formatNumber(stats.max)}
        sub={stats.municipioMax}
        accentColor={maxColor}
      />
    </div>
  );
}
