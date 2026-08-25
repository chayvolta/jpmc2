// ============================================================
// Header — Top navigation bar
// ============================================================

import { useConflictStore } from '@/store/conflictStore';
import { PanelLeft, AlertTriangle } from 'lucide-react';

export default function Header() {
  const { toggleSidebar, sidebarOpen, municipios, metadata } = useConflictStore();
  const affectedMunicipalities = municipios.filter((municipio) => municipio.totalConflictos > 0).length;

  return (
    <header
      className="h-[60px] flex-shrink-0 flex items-center justify-between px-4 border-b border-white/8 bg-surface-800/90 backdrop-blur-md z-30 relative"
      id="main-header"
    >
      {/* Left — Logo + Title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Toggle sidebar */}
        <button
          onClick={toggleSidebar}
          id="btn-toggle-sidebar"
          className={`p-2 rounded-lg transition-all duration-200 ${
            sidebarOpen
              ? 'bg-ocean-600/20 text-ocean-400'
              : 'hover:bg-white/8 text-slate-400 hover:text-white'
          }`}
          title={sidebarOpen ? 'Ocultar panel' : 'Mostrar panel'}
        >
          <PanelLeft size={18} />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-white/12 hidden sm:block" />

        {/* Logo + Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-amber-500 to-danger-600 flex-shrink-0 shadow-glow-amber">
            <AlertTriangle size={16} className="text-white" />
          </div>
          <div className="min-w-0 hidden sm:block">
            <h1 className="text-sm font-bold text-white leading-tight truncate">
              Conflictos por Municipio en México
            </h1>
            <p className="text-xs text-slate-500 leading-none">Registros auditados y correcciones históricas</p>
          </div>
          {/* Mobile short title */}
          <div className="sm:hidden">
            <h1 className="text-sm font-bold text-white">Conflictos MX</h1>
          </div>
        </div>
      </div>

      {/* Right — Metadata */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="hidden md:flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse-slow" />
          <span className="text-xs text-slate-400">
            {affectedMunicipalities.toLocaleString('es-MX')} municipios · {(metadata?.uniqueConflicts ?? 0).toLocaleString('es-MX')} registros
          </span>
        </div>
        <div className="hidden md:block w-px h-4 bg-white/12" />
        <div className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <AlertTriangle size={10} />
          Geoportal
        </div>
      </div>
    </header>
  );
}
