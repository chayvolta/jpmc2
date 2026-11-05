import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Search } from 'lucide-react';
import { getMapLibreColorExpression } from '@/data/colorScales';
import { useConflictStore } from '@/store/conflictStore';
import type { GeoJSONFeature } from '@/services/geojsonService';
import type { GeoJSONProperties, MunicipioData } from '@/types/conflicto';
import MunicipalityPopup from './MunicipalityPopup';

const WORKER_URL = '/maplibre-gl-worker.js';
if (maplibregl.getWorkerUrl() !== WORKER_URL) {
  maplibregl.setWorkerUrl(WORKER_URL);
  const dispatcher = (
    maplibregl as unknown as {
      getGlobalDispatcher?: () => {
        workerPool?: {
          isStarted?: () => boolean;
          restart?: () => Promise<void>;
        };
      };
    }
  ).getGlobalDispatcher?.();
  if (dispatcher?.workerPool?.isStarted?.()) {
    void dispatcher.workerPool.restart?.();
  }
}

const MAP_SOURCE_ID = 'municipios-source';
const FILL_LAYER_ID = 'municipios-fill';
const HOVER_LAYER_ID = 'municipios-hover';
const STROKE_LAYER_ID = 'municipios-stroke';
const LABEL_LAYER_ID = 'municipios-labels';

const MEXICO_BOUNDS: maplibregl.LngLatBoundsLike = [
  [-118.5, 14.5],
  [-86.7, 32.7],
];

function municipalityFromProperties(properties: GeoJSONProperties): MunicipioData {
  return {
    cvegeo: properties.CVEGEO,
    cveEnt: properties.CVE_ENT,
    cveMun: properties.CVE_MUN,
    nombre: properties.NOMMUN,
    entidad: properties.NOMGEO,
    totalConflictos: properties.total_conflictos ?? 0,
    conflictosValidados: properties.conflictos_validados ?? 0,
    conflictosPendientes: properties.conflictos_pendientes ?? 0,
    primerAnio: properties.primer_anio ?? null,
    ultimoAnio: properties.ultimo_anio ?? null,
  };
}

function getFeatureBounds(feature: GeoJSONFeature): maplibregl.LngLatBounds | null {
  const bounds = new maplibregl.LngLatBounds();
  let coordinateCount = 0;

  function addCoordinates(value: unknown): void {
    if (!Array.isArray(value)) return;
    if (
      value.length >= 2 &&
      typeof value[0] === 'number' &&
      typeof value[1] === 'number'
    ) {
      bounds.extend([value[0], value[1]]);
      coordinateCount += 1;
      return;
    }
    value.forEach(addCoordinates);
  }

  addCoordinates(feature.geometry.coordinates);
  return coordinateCount > 0 ? bounds : null;
}

export default function MapView() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const hoverCardRef = useRef<HTMLDivElement>(null);
  const cursorPointRef = useRef<{ x: number; y: number }>({ x: 24, y: 24 });
  const mapRef = useRef<maplibregl.Map | null>(null);
  const styleLoadedRef = useRef<boolean>(false);
  const hoveredIdRef = useRef<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const {
    geojson,
    municipios,
    conflictos,
    hoveredMunicipio,
    selectedMunicipio,
    sidebarOpen,
    setHoveredMunicipio,
    setSelectedMunicipio,
    setSidebarOpen,
  } = useConflictStore();

  const updateHoverCardPosition = useCallback((pointX: number, pointY: number) => {
    cursorPointRef.current = { x: pointX, y: pointY };
    const container = mapContainerRef.current;
    const card = hoverCardRef.current;
    if (!container || !card) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const cardWidth = card.offsetWidth || 410;
    const cardHeight = card.offsetHeight || 340;
    const margin = 12;
    const cursorGap = 20;

    let left = pointX + cursorGap;
    if (left + cardWidth > containerWidth - margin) {
      left = pointX - cardWidth - cursorGap;
    }
    left = Math.max(margin, Math.min(left, containerWidth - cardWidth - margin));

    let top = pointY - cardHeight / 2;
    top = Math.max(margin, Math.min(top, containerHeight - cardHeight - margin));

    card.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    styleLoadedRef.current = false;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
        sources: {},
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 'background-color': '#0f1117' },
          },
        ],
      },
      bounds: MEXICO_BOUNDS,
      fitBoundsOptions: { padding: 32 },
      attributionControl: false,
      logoPosition: 'bottom-left',
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');
    mapRef.current = map;

    const markStyleLoaded = () => {
      styleLoadedRef.current = true;
    };
    map.on('style.load', markStyleLoaded);
    map.on('load', markStyleLoaded);

    map.on('dragstart', () => {
      isDraggingRef.current = true;
      map.getCanvas().style.cursor = 'grabbing';
      if (hoveredIdRef.current) {
        if (map.getSource(MAP_SOURCE_ID)) {
          map.setFeatureState(
            { source: MAP_SOURCE_ID, id: hoveredIdRef.current },
            { hover: false }
          );
        }
        hoveredIdRef.current = null;
      }
      setHoveredMunicipio(null);
    });

    map.on('dragend', () => {
      isDraggingRef.current = false;
      map.getCanvas().style.cursor = hoveredIdRef.current ? 'pointer' : '';
    });

    map.on('mousemove', FILL_LAYER_ID, (event: maplibregl.MapLayerMouseEvent) => {
      if (isDraggingRef.current || event.originalEvent.buttons !== 0) {
        return;
      }

      // Skip hover state on touch-only viewports so taps go straight to click
      if (window.innerWidth < 768) {
        return;
      }

      const feature = event.features?.[0];
      const properties = feature?.properties as unknown as GeoJSONProperties | undefined;
      const cvegeo = properties?.CVEGEO;
      if (!cvegeo || !properties) return;

      updateHoverCardPosition(event.point.x, event.point.y);

      if (hoveredIdRef.current !== cvegeo) {
        if (hoveredIdRef.current && map.getSource(MAP_SOURCE_ID)) {
          map.setFeatureState(
            { source: MAP_SOURCE_ID, id: hoveredIdRef.current },
            { hover: false }
          );
        }

        hoveredIdRef.current = cvegeo;
        map.setFeatureState({ source: MAP_SOURCE_ID, id: cvegeo }, { hover: true });
        map.getCanvas().style.cursor = 'pointer';
        setHoveredMunicipio(cvegeo);
      }
    });

    map.on('mouseleave', FILL_LAYER_ID, () => {
      if (hoveredIdRef.current && map.getSource(MAP_SOURCE_ID)) {
        map.setFeatureState(
          { source: MAP_SOURCE_ID, id: hoveredIdRef.current },
          { hover: false }
        );
        hoveredIdRef.current = null;
      }
      if (!isDraggingRef.current) {
        map.getCanvas().style.cursor = '';
      }
      setHoveredMunicipio(null);
    });

    map.on('click', FILL_LAYER_ID, (event: maplibregl.MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature) return;

      const properties = feature.properties as unknown as GeoJSONProperties;
      const state = useConflictStore.getState();
      const municipality =
        state.municipios.find((candidate) => candidate.cvegeo === properties.CVEGEO) ??
        municipalityFromProperties(properties);

      setSelectedMunicipio(municipality);
    });

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      styleLoadedRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, [setHoveredMunicipio, setSelectedMunicipio, updateHoverCardPosition]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geojson) return;

    let added = false;

    function addLayers() {
      if (added || !map || !geojson) return;
      added = true;

      const cleanGeoJSON = {
        type: 'FeatureCollection' as const,
        features: geojson.features,
      };

      [LABEL_LAYER_ID, HOVER_LAYER_ID, STROKE_LAYER_ID, FILL_LAYER_ID].forEach((layerId) => {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
      });
      if (map.getSource(MAP_SOURCE_ID)) map.removeSource(MAP_SOURCE_ID);

      map.addSource(MAP_SOURCE_ID, {
        type: 'geojson',
        data: cleanGeoJSON as maplibregl.GeoJSONSourceSpecification['data'],
        promoteId: 'CVEGEO',
      });

      map.addLayer({
        id: FILL_LAYER_ID,
        type: 'fill',
        source: MAP_SOURCE_ID,
        paint: {
          'fill-color': getMapLibreColorExpression() as maplibregl.ExpressionSpecification,
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            0.98,
            ['boolean', ['feature-state', 'hover'], false],
            0.96,
            ['==', ['get', 'total_conflictos'], 0],
            0.28,
            0.84,
          ],
        },
      });

      map.addLayer({
        id: HOVER_LAYER_ID,
        type: 'fill',
        source: MAP_SOURCE_ID,
        paint: {
          'fill-color': '#ffffff',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            0.16,
            ['boolean', ['feature-state', 'hover'], false],
            0.12,
            0,
          ],
        },
      });

      map.addLayer({
        id: STROKE_LAYER_ID,
        type: 'line',
        source: MAP_SOURCE_ID,
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#f59e0b',
            ['boolean', ['feature-state', 'hover'], false],
            '#ffffff',
            '#334155',
          ],
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3,
            [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              2.4,
              ['boolean', ['feature-state', 'hover'], false],
              1.8,
              0.15,
            ],
            8,
            [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              2.6,
              ['boolean', ['feature-state', 'hover'], false],
              1.8,
              0.7,
            ],
          ],
          'line-opacity': 0.85,
        },
      });

      map.addLayer({
        id: LABEL_LAYER_ID,
        type: 'symbol',
        source: MAP_SOURCE_ID,
        minzoom: 6,
        filter: ['>', ['get', 'total_conflictos'], 0],
        layout: {
          'text-field': ['get', 'NOMMUN'],
          'text-font': ['Open Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 6, 8, 10, 11],
          'text-max-width': 7,
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#f8fafc',
          'text-halo-color': '#0f1117',
          'text-halo-width': 1.25,
          'text-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0.3, 7, 0.88],
        },
      });
    }

    if (styleLoadedRef.current || map.isStyleLoaded()) {
      addLayers();
    } else {
      map.once('style.load', addLayers);
      map.once('load', addLayers);
      return () => {
        map.off('style.load', addLayers);
        map.off('load', addLayers);
      };
    }
  }, [geojson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geojson) return;

    if (selectedIdRef.current && map.getSource(MAP_SOURCE_ID)) {
      map.setFeatureState(
        { source: MAP_SOURCE_ID, id: selectedIdRef.current },
        { selected: false }
      );
      selectedIdRef.current = null;
    }

    if (!selectedMunicipio) {
      return;
    }

    selectedIdRef.current = selectedMunicipio.cvegeo;
    if (map.getSource(MAP_SOURCE_ID)) {
      map.setFeatureState(
        { source: MAP_SOURCE_ID, id: selectedMunicipio.cvegeo },
        { selected: true }
      );
    }

    const feature = geojson.features.find(
      (candidate) => candidate.properties.CVEGEO === selectedMunicipio.cvegeo
    );
    if (!feature) return;

    const bounds = getFeatureBounds(feature);
    if (bounds) {
      const container = mapContainerRef.current;
      const width = container?.clientWidth ?? window.innerWidth;
      const height = container?.clientHeight ?? window.innerHeight;
      const isMobile = width < 640;

      const padding = isMobile
        ? {
            top: 56,
            bottom: Math.min(Math.round(height * 0.56), 420),
            left: 24,
            right: 24,
          }
        : {
            top: 72,
            bottom: 72,
            left: Math.min(450, Math.round(width * 0.42)),
            right: 96,
          };

      map.fitBounds(bounds, {
        padding,
        maxZoom: 9,
        duration: 900,
      });
    }
  }, [geojson, selectedMunicipio]);

  const hoveredData = useMemo(
    () =>
      hoveredMunicipio
        ? municipios.find((municipio) => municipio.cvegeo === hoveredMunicipio) ?? null
        : null,
    [hoveredMunicipio, municipios]
  );

  const hoveredConflicts = useMemo(
    () =>
      hoveredData
        ? conflictos.filter((conflict) => conflict.cvegeo.includes(hoveredData.cvegeo))
        : [],
    [conflictos, hoveredData]
  );

  const selectedConflicts = useMemo(
    () =>
      selectedMunicipio
        ? conflictos.filter((conflict) => conflict.cvegeo.includes(selectedMunicipio.cvegeo))
        : [],
    [conflictos, selectedMunicipio]
  );

  // Re-clamp hover card position whenever hovered municipality changes (since height may change)
  useEffect(() => {
    if (hoveredData && !selectedMunicipio) {
      updateHoverCardPosition(cursorPointRef.current.x, cursorPointRef.current.y);
    }
  }, [hoveredData, selectedMunicipio, updateHoverCardPosition]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        ref={mapContainerRef}
        id="map-container"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />

      {/* Mobile quick button to open Sidebar (Search & Stats) */}
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="md:hidden absolute top-3 left-3 z-20 glass rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white shadow-lg flex items-center gap-2 border border-white/15 active:scale-95 transition-all"
        >
          <Search size={14} className="text-ocean-400" />
          <span>Buscar / Datos</span>
        </button>
      )}

      {/* Desktop Hover Popup Card — clamped strictly inside map container */}
      {hoveredData && !selectedMunicipio && (
        <div
          ref={hoverCardRef}
          className="hidden md:flex fixed-hover-card absolute top-0 left-0 z-20 pointer-events-none max-h-[calc(100%-24px)] rounded-xl shadow-2xl border border-white/15"
          style={{
            willChange: 'transform',
            transform: `translate3d(${cursorPointRef.current.x + 20}px, 16px, 0)`,
          }}
        >
          <MunicipalityPopup
            municipio={hoveredData}
            conflictos={hoveredConflicts}
            onClose={() => {}}
            isHoverPreview
          />
        </div>
      )}

      {/* Clicked / Selected Municipality Popup Card — guaranteed 100% visible on Desktop & Mobile */}
      {selectedMunicipio && (
        <div
          className="
            absolute z-30 flex flex-col
            inset-x-2.5 bottom-2.5 max-h-[65dvh]
            sm:inset-auto sm:top-4 sm:left-4 sm:max-h-[calc(100%-32px)]
            rounded-xl shadow-2xl border border-white/15 animate-fade-in
          "
        >
          <MunicipalityPopup
            municipio={selectedMunicipio}
            conflictos={selectedConflicts}
            onClose={() => setSelectedMunicipio(null)}
          />
        </div>
      )}

      {/* Reset Mexico View button */}
      <button
        id="btn-reset-view"
        onClick={() => {
          mapRef.current?.fitBounds(MEXICO_BOUNDS, { padding: 32, duration: 900 });
          setSelectedMunicipio(null);
        }}
        className={`absolute right-3 sm:right-4 z-10 glass rounded-lg px-3 py-2 text-xs text-slate-300 hover:text-white hover:border-ocean-500 transition-all duration-200 flex items-center gap-1.5 ${
          selectedMunicipio ? 'bottom-[calc(65dvh+16px)] sm:bottom-12' : 'bottom-12'
        }`}
        title="Restablecer vista de México"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        México
      </button>

      {/* Logos panel — scaled for mobile & desktop */}
      <div
        id="map-logos-panel"
        className="absolute top-3 right-12 sm:top-4 sm:right-14 z-10 pointer-events-none flex flex-col items-end gap-1.5 sm:gap-2"
      >
        <div
          className="rounded-lg sm:rounded-xl shadow-card border border-white/10 px-2.5 py-1 sm:px-4 sm:py-2"
          style={{ background: 'rgba(255, 255, 255, 0.97)', backdropFilter: 'blur(12px)' }}
        >
          <img
            src="/logos/logo-igual.png"
            alt="IGUAL Consultores"
            className="block h-4 sm:h-6 md:h-7 w-auto object-contain"
          />
        </div>
        <div
          className="rounded-lg sm:rounded-xl overflow-hidden shadow-card border border-white/10"
          style={{ background: 'rgba(27, 45, 91, 0.95)', backdropFilter: 'blur(12px)' }}
        >
          <img
            src="/logos/logo-ungc.png"
            alt="UN Global Compact — 2026 Participant"
            className="block h-11 sm:h-20 md:h-[110px] w-auto max-w-[180px] sm:max-w-[320px] md:max-w-[440px] object-contain"
          />
        </div>
      </div>
    </div>
  );
}
