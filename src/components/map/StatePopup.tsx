// ============================================================
// StatePopup — Detailed popup shown on state click
// ============================================================

import type { EstadoData } from '@/types/conflicto';
import { getConflictColor } from '@/data/colorScales';
import { formatNumber, formatPercent } from '@/utils/statsUtils';
import { useConflictStore } from '@/store/conflictStore';
import { X, MapPin, AlertTriangle, TrendingUp } from 'lucide-react';

interface StatePopupProps {
  estado: EstadoData;
  onClose: () => void;
}

// Total national conflicts for percentage calculation
const TOTAL_NACIONAL = 1076;

export default function StatePopup({ estado, onClose }: StatePopupProps) {
  const { estados } = useConflictStore();
  const totalNacional = estados.reduce((s, e) => s + e.total_conflictos, 0) || TOTAL_NACIONAL;
  const ranking = [...estados]
    .sort((a, b) => b.total_conflictos - a.total_conflictos)
    .findIndex((e) => e.cvegeo === estado.cvegeo) + 1;

  const color = getConflictColor(estado.total_conflictos);
  const porcentaje = formatPercent(estado.total_conflictos, totalNacional);

  return (
    <div className="w-[360px] overflow-hidden" id={`popup-estado-${estado.cvegeo}`}>
      {/* Header */}
      <div
        className="relative px-5 py-4 flex items-start justify-between"
        style={{ background: `linear-gradient(135deg, ${color}22 0%, #1a1f2e 100%)` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-10 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <MapPin size={12} className="text-slate-400" />
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                Estado
              </span>
            </div>
            <h3 className="text-base font-bold text-white leading-tight">
              {estado.nombre}
            </h3>
          </div>
        </div>
        <button
          onClick={onClose}
          id="popup-close-btn"
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors mt-0.5 flex-shrink-0"
        >
          <X size={16} className="text-slate-400" />
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/8" />

      {/* Stats */}
      <div className="px-5 py-4 space-y-4">
        {/* Main metric */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
              <AlertTriangle size={12} />
              Total de conflictos
            </p>
            <p
              className="text-4xl font-black tracking-tight"
              style={{ color }}
            >
              {formatNumber(estado.total_conflictos)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 mb-1">Del total nacional</p>
            <p className="text-2xl font-bold text-slate-300">{porcentaje}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: porcentaje,
                backgroundColor: color,
                boxShadow: `0 0 8px ${color}80`,
              }}
            />
          </div>
        </div>

        {/* Ranking & comparison */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-lg px-3 py-2.5">
            <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <TrendingUp size={11} />
              Ranking nacional
            </p>
            <p className="text-xl font-bold text-white">
              #{ranking}
              <span className="text-xs text-slate-400 font-normal ml-1">de 32</span>
            </p>
          </div>
          <div className="bg-white/5 rounded-lg px-3 py-2.5">
            <p className="text-xs text-slate-400 mb-1">Clave INEGI</p>
            <p className="text-xl font-bold font-mono text-ocean-300">{estado.cvegeo}</p>
          </div>
        </div>

        {/* Classification badge */}
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs text-slate-400">Clasificación:</span>
          <span className="text-xs font-semibold" style={{ color }}>
            {getClassificationLabel(estado.total_conflictos)}
          </span>
        </div>

        {/* Note about data */}
        <div className="bg-ocean-900/30 border border-ocean-800/40 rounded-lg px-3 py-2">
          <p className="text-xs text-ocean-300 leading-relaxed">
            <span className="font-semibold">Período:</span> 2017–2026 · Datos: GeoJSON IGUAL
          </p>
        </div>
      </div>
    </div>
  );
}

function getClassificationLabel(total: number): string {
  if (total <= 5) return 'Conflictividad muy baja';
  if (total <= 15) return 'Conflictividad baja';
  if (total <= 30) return 'Conflictividad media';
  if (total <= 60) return 'Conflictividad alta';
  if (total <= 150) return 'Conflictividad muy alta';
  return 'Conflictividad crítica';
}
