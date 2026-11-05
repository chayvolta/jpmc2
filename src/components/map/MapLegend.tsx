// ============================================================
// MapLegend — Choropleth color legend
// ============================================================

import { useState } from 'react';
import { CONFLICT_COLOR_SCALE } from '@/data/colorScales';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

export default function MapLegend() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className="glass rounded-xl p-2.5 sm:p-4 w-auto sm:w-52 transition-all duration-200"
      id="map-legend"
    >
      <button
        type="button"
        onClick={() => setMobileOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 sm:cursor-default"
        aria-expanded={mobileOpen}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider text-left">
            <span className="sm:hidden">Leyenda</span>
            <span className="hidden sm:inline">Conflictos por municipio</span>
          </h4>
        </div>
        <span className="sm:hidden text-slate-400">
          {mobileOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </span>
      </button>

      <div className={`${mobileOpen ? 'block mt-3 w-48' : 'hidden'} sm:block sm:mt-3 sm:w-auto`}>
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
    </div>
  );
}
