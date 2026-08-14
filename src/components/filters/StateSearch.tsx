// ============================================================
// StateSearch — Searchable state list
// ============================================================

import { useState, useMemo } from 'react';
import { useConflictStore } from '@/store/conflictStore';
import { getConflictColor } from '@/data/colorScales';
import { Search, X } from 'lucide-react';

export default function StateSearch() {
  const [search, setSearch] = useState('');
  const { estados, setSelectedEstado, selectedEstado } = useConflictStore();

  const filtered = useMemo(() => {
    if (!search.trim()) return estados;
    const q = search.toLowerCase().trim();
    return estados.filter((e) =>
      e.nombre.toLowerCase().includes(q) ||
      e.cvegeo.includes(q)
    );
  }, [search, estados]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => b.total_conflictos - a.total_conflictos),
    [filtered]
  );

  return (
    <div id="state-search">
      {/* Search input */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar estado..."
          id="input-buscar-estado"
          className="w-full bg-white/5 border border-white/8 rounded-lg pl-9 pr-9 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-ocean-500 focus:bg-white/8 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            id="btn-clear-search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* State list */}
      <div className="space-y-1 max-h-64 overflow-y-auto sidebar-scroll pr-1">
        {sorted.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">Sin resultados</p>
        ) : (
          sorted.map((estado) => {
            const color = getConflictColor(estado.total_conflictos);
            const isSelected = selectedEstado?.cvegeo === estado.cvegeo;

            return (
              <button
                key={estado.cvegeo}
                id={`estado-btn-${estado.cvegeo}`}
                onClick={() => setSelectedEstado(isSelected ? null : estado)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 group ${
                  isSelected
                    ? 'bg-white/12 border border-white/16'
                    : 'hover:bg-white/6 border border-transparent'
                }`}
              >
                {/* Color dot */}
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color, boxShadow: isSelected ? `0 0 6px ${color}` : 'none' }}
                />

                {/* Name */}
                <span className={`flex-1 text-xs truncate ${isSelected ? 'text-white font-semibold' : 'text-slate-300 group-hover:text-white'}`}>
                  {estado.nombre}
                </span>

                {/* Count */}
                <span
                  className="text-xs font-bold flex-shrink-0"
                  style={{ color }}
                >
                  {estado.total_conflictos.toLocaleString('es-MX')}
                </span>
              </button>
            );
          })
        )}
      </div>

      {search && (
        <p className="text-xs text-slate-500 mt-2">
          {sorted.length} resultado{sorted.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
