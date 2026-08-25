// ============================================================
// MapLegend — Choropleth color legend
// ============================================================

import { CONFLICT_COLOR_SCALE } from '@/data/colorScales';
import { AlertTriangle } from 'lucide-react';

export default function MapLegend() {
  return (
    <div
      className="glass rounded-xl p-4 w-52"
      id="map-legend"
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={14} className="text-amber-400" />
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Conflictos por municipio
        </h4>
      </div>

      <div className="space-y-2">
        {CONFLICT_COLOR_SCALE.map((stop, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div
              className="w-8 h-4 rounded flex-shrink-0"
              style={{ backgroundColor: stop.color, opacity: 0.9 }}
            />
            <span className="text-xs text-slate-400">{stop.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-white/8">
        <p className="text-xs text-slate-500">
          Registros 2017–2026 + correcciones
        </p>
      </div>
    </div>
  );
}
