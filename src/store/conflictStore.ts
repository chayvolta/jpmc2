// ============================================================
// Zustand Store — Global Application State
// ============================================================

import { create } from 'zustand';
import type { EstadoData, FilterState } from '@/types/conflicto';
import type { GeoJSONCollection } from '@/services/geojsonService';

interface ConflictStore {
  // Data
  geojson: GeoJSONCollection | null;
  estados: EstadoData[];
  isLoading: boolean;
  error: string | null;

  // UI State
  hoveredEstado: string | null;
  selectedEstado: EstadoData | null;
  sidebarOpen: boolean;
  filters: FilterState;

  // Actions
  setGeoJSON: (geojson: GeoJSONCollection) => void;
  setEstados: (estados: EstadoData[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHoveredEstado: (cvegeo: string | null) => void;
  setSelectedEstado: (estado: EstadoData | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
}

const initialFilters: FilterState = {
  selectedEstado: null,
  searchText: '',
};

export const useConflictStore = create<ConflictStore>((set) => ({
  // Initial state
  geojson: null,
  estados: [],
  isLoading: true,
  error: null,
  hoveredEstado: null,
  selectedEstado: null,
  sidebarOpen: true,
  filters: initialFilters,

  // Actions
  setGeoJSON: (geojson) => set({ geojson }),
  setEstados: (estados) => set({ estados }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setHoveredEstado: (hoveredEstado) => set({ hoveredEstado }),
  setSelectedEstado: (selectedEstado) => set({ selectedEstado }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: initialFilters }),
}));
