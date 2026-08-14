// ============================================================
// Sidebar — Left statistics & filter panel
// ============================================================

import { useConflictStore } from '@/store/conflictStore';
import StatsOverview from '@/components/stats/StatsOverview';
import Top10Chart from '@/components/stats/Top10Chart';
import DistributionChart from '@/components/stats/DistributionChart';
import StateSearch from '@/components/filters/StateSearch';
import { BarChart2, Search, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  id: string;
}

function Section({ title, icon, children, defaultOpen = true, id }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/8" id={id}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/4 transition-colors group"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-slate-300">
          <span className="text-ocean-400">{icon}</span>
          {title}
        </div>
        <span className="text-slate-600 group-hover:text-slate-400 transition-colors">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { sidebarOpen, isLoading } = useConflictStore();

  return (
    <aside
      className={`flex-shrink-0 h-full bg-surface-700 border-r border-white/8 flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
        sidebarOpen ? 'w-[340px]' : 'w-0'
      }`}
      id="main-sidebar"
    >
      <div className="w-[340px] h-full flex flex-col overflow-hidden">
        {/* Sidebar header */}
        <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2 bg-surface-800/50">
          <Layers size={14} className="text-ocean-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Panel de análisis
          </span>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto sidebar-scroll">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="w-8 h-8 border-2 border-ocean-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500">Cargando datos...</p>
            </div>
          ) : (
            <>
              {/* KPIs */}
              <Section id="section-kpis" title="Indicadores" icon={<BarChart2 size={13} />}>
                <StatsOverview />
              </Section>

              {/* State search */}
              <Section id="section-busqueda" title="Buscar estado" icon={<Search size={13} />}>
                <StateSearch />
              </Section>

              {/* Top 10 */}
              <Section id="section-top10" title="Top 10 estados" icon={<BarChart2 size={13} />}>
                <p className="text-xs text-slate-500 mb-3">
                  Estados con mayor número de conflictos
                </p>
                <Top10Chart />
              </Section>

              {/* Distribution */}
              <Section id="section-distribucion" title="Distribución" icon={<BarChart2 size={13} />} defaultOpen={false}>
                <p className="text-xs text-slate-500 mb-2">
                  Estados por rango de conflictos
                </p>
                <DistributionChart />
              </Section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/8 bg-surface-800/50">
          <p className="text-xs text-slate-600 text-center">
            Fuente: IGUAL · Período 2017–2026
          </p>
        </div>
      </div>
    </aside>
  );
}
