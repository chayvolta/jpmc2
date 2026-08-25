// ============================================================
// Dashboard — Main page layout
// ============================================================

import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MapView from '@/components/map/MapView';
import MapLegend from '@/components/map/MapLegend';
import { useMunicipalData } from '@/hooks/useMunicipalData';
import { useConflictStore } from '@/store/conflictStore';

export default function Dashboard() {
  const { error } = useMunicipalData();
  const { isLoading } = useConflictStore();

  // Set page title
  useEffect(() => {
    document.title = 'Conflictos por Municipio en México | Geoportal';
  }, []);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-900">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-danger-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Error al cargar datos</h2>
          <p className="text-sm text-slate-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-ocean-600 text-white rounded-lg text-sm hover:bg-ocean-500 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface-900" id="dashboard">
      {/* Header */}
      <Header />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <Sidebar />

        {/* Map area */}
        <main className="flex-1 relative overflow-hidden" id="map-area">
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-surface-900/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 border-2 border-ocean-500/30 rounded-full animate-ping absolute inset-0" />
                  <div className="w-12 h-12 border-2 border-ocean-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-200">Cargando geoportal</p>
                  <p className="text-xs text-slate-500 mt-1">Procesando municipios y conflictos...</p>
                </div>
              </div>
            </div>
          )}

          {/* Map */}
          <MapView />

          {/* Legend overlay */}
          <div className="absolute bottom-10 left-4 z-10">
            <MapLegend />
          </div>
        </main>
      </div>
    </div>
  );
}
