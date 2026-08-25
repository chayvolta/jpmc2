import { create } from 'zustand';
import type {
  ConflictoRegistro,
  ConflictDatasetMetadata,
  FilterState,
  MunicipioData,
} from '@/types/conflicto';
import type { GeoJSONCollection } from '@/services/geojsonService';

interface ConflictStore {
  geojson: GeoJSONCollection | null;
  municipios: MunicipioData[];
  conflictos: ConflictoRegistro[];
  metadata: ConflictDatasetMetadata | null;
  isLoading: boolean;
  error: string | null;
  hoveredMunicipio: string | null;
  selectedMunicipio: MunicipioData | null;
  sidebarOpen: boolean;
  filters: FilterState;
  setGeoJSON: (geojson: GeoJSONCollection) => void;
  setMunicipios: (municipios: MunicipioData[]) => void;
  setConflictos: (conflictos: ConflictoRegistro[]) => void;
  setMetadata: (metadata: ConflictDatasetMetadata) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHoveredMunicipio: (cvegeo: string | null) => void;
  setSelectedMunicipio: (municipio: MunicipioData | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
}

const initialFilters: FilterState = {
  selectedMunicipio: null,
  searchText: '',
};

export const useConflictStore = create<ConflictStore>((set) => ({
  geojson: null,
  municipios: [],
  conflictos: [],
  metadata: null,
  isLoading: true,
  error: null,
  hoveredMunicipio: null,
  selectedMunicipio: null,
  sidebarOpen: true,
  filters: initialFilters,
  setGeoJSON: (geojson) => set({ geojson }),
  setMunicipios: (municipios) => set({ municipios }),
  setConflictos: (conflictos) => set({ conflictos }),
  setMetadata: (metadata) => set({ metadata }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setHoveredMunicipio: (hoveredMunicipio) => set({ hoveredMunicipio }),
  setSelectedMunicipio: (selectedMunicipio) => set({ selectedMunicipio }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: initialFilters }),
}));
