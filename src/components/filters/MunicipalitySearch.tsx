import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { getConflictColor } from '@/data/colorScales';
import { useConflictStore } from '@/store/conflictStore';

export default function MunicipalitySearch() {
  const [search, setSearch] = useState('');
  const { municipios, selectedMunicipio, setSelectedMunicipio, setSidebarOpen } = useConflictStore();

  const results = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es-MX');
    const filtered = query
      ? municipios.filter((municipio) =>
          municipio.nombre.toLocaleLowerCase('es-MX').includes(query) ||
          municipio.entidad.toLocaleLowerCase('es-MX').includes(query) ||
          municipio.cvegeo.includes(query)
        )
      : municipios.filter((municipio) => municipio.totalConflictos > 0);

    return filtered
      .slice()
      .sort((left, right) =>
        right.totalConflictos - left.totalConflictos ||
        left.nombre.localeCompare(right.nombre, 'es-MX')
      )
      .slice(0, 200);
  }, [municipios, search]);

  return (
    <div id="municipality-search">
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Municipio, estado o CVEGEO..."
          id="input-buscar-municipio"
          className="w-full bg-white/5 border border-white/8 rounded-lg pl-9 pr-9 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-ocean-500 focus:bg-white/8 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            aria-label="Limpiar búsqueda"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto sidebar-scroll pr-1">
        {results.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">Sin resultados</p>
        ) : (
          results.map((municipio) => {
            const color = getConflictColor(municipio.totalConflictos);
            const isSelected = selectedMunicipio?.cvegeo === municipio.cvegeo;
            return (
              <button
                key={municipio.cvegeo}
                id={`municipio-btn-${municipio.cvegeo}`}
                onClick={() => {
                  const nextSelection = isSelected ? null : municipio;
                  setSelectedMunicipio(nextSelection);
                  if (nextSelection && window.innerWidth < 768) {
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 group ${
                  isSelected
                    ? 'bg-white/12 border border-white/16'
                    : 'hover:bg-white/6 border border-transparent'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs truncate ${isSelected ? 'text-white font-semibold' : 'text-slate-300'}`}>
                    {municipio.nombre}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{municipio.entidad} · {municipio.cvegeo}</p>
                </div>
                <span className="text-xs font-bold flex-shrink-0" style={{ color }}>
                  {municipio.totalConflictos.toLocaleString('es-MX')}
                </span>
              </button>
            );
          })
        )}
      </div>

      <p className="text-xs text-slate-500 mt-2">
        {search ? `${results.length} resultado${results.length === 1 ? '' : 's'}` : 'Municipios con conflictos'}
      </p>
    </div>
  );
}
