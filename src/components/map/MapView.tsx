// ============================================================
// MapView — Main MapLibre GL Map Component
// ============================================================

import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useConflictStore } from '@/store/conflictStore';
import { getMapLibreColorExpression } from '@/data/colorScales';
import type { GeoJSONProperties } from '@/types/conflicto';
import StatePopup from './StatePopup';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';

const MAP_SOURCE_ID = 'estados-source';
const FILL_LAYER_ID = 'estados-fill';
const STROKE_LAYER_ID = 'estados-stroke';
const HOVER_LAYER_ID = 'estados-hover';
const LABEL_LAYER_ID = 'estados-labels';

// Mexico approximate bounds [west, south, east, north]
const MEXICO_BOUNDS: maplibregl.LngLatBoundsLike = [
  [-118.5, 14.5],
  [-86.7, 32.7],
];

export default function MapView() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const popupRootRef = useRef<Root | null>(null);
  const hoveredIdRef = useRef<string | null>(null);

  const {
    geojson,
    setHoveredEstado,
    setSelectedEstado,
    estados,
    hoveredEstado,
    selectedEstado,
  } = useConflictStore();

  // --- Initialize Map ---
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        // Using MapTiler's reliable glyph CDN instead of demotiles (which has 404s)
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
      fitBoundsOptions: { padding: 40 },
      attributionControl: false,
      logoPosition: 'bottom-left',
    });

    // Navigation controls
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      'top-right'
    );

    // Scale control
    map.addControl(
      new maplibregl.ScaleControl({ unit: 'metric' }),
      'bottom-right'
    );

    mapRef.current = map;

    // ResizeObserver: tells MapLibre to redraw when container size changes
    // (e.g. when sidebar opens/closes)
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // --- Add GeoJSON layer when data is ready ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geojson) return;

    function addLayers() {
      if (!map) return;

      // Remove existing layers/source
      [LABEL_LAYER_ID, HOVER_LAYER_ID, STROKE_LAYER_ID, FILL_LAYER_ID].forEach(id => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource(MAP_SOURCE_ID)) map.removeSource(MAP_SOURCE_ID);

      // Add GeoJSON source
      map.addSource(MAP_SOURCE_ID, {
        type: 'geojson',
        data: geojson as maplibregl.GeoJSONSourceSpecification['data'],
        promoteId: 'CVEGEO',
      });

      // Fill layer — choropleth
      map.addLayer({
        id: FILL_LAYER_ID,
        type: 'fill',
        source: MAP_SOURCE_ID,
        paint: {
          'fill-color': getMapLibreColorExpression() as maplibregl.ExpressionSpecification,
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.95,
            0.82,
          ],
        },
      });

      // Hover highlight layer
      map.addLayer({
        id: HOVER_LAYER_ID,
        type: 'fill',
        source: MAP_SOURCE_ID,
        paint: {
          'fill-color': '#ffffff',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.12,
            0,
          ],
        },
      });

      // State border stroke
      map.addLayer({
        id: STROKE_LAYER_ID,
        type: 'line',
        source: MAP_SOURCE_ID,
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#ffffff',
            '#1a2744',
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            2,
            0.8,
          ],
          'line-opacity': 0.8,
        },
      });

      // State name labels
      map.addLayer({
        id: LABEL_LAYER_ID,
        type: 'symbol',
        source: MAP_SOURCE_ID,
        layout: {
          'text-field': ['get', 'NOMGEO'],
          'text-font': ['Open Sans Regular'],
          'text-size': [
            'interpolate', ['linear'], ['zoom'],
            4, 8,
            7, 11,
          ],
          'text-max-width': 8,
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#e2e8f0',
          'text-halo-color': '#0f1117',
          'text-halo-width': 1.5,
          'text-opacity': ['interpolate', ['linear'], ['zoom'], 4, 0, 5, 0.8],
        },
      });

      setupEventHandlers(map);
    }

    if (map.loaded()) {
      addLayers();
    } else {
      map.on('load', addLayers);
    }

    return () => {
      map.off('load', addLayers);
    };
  }, [geojson]);

  // --- Event handlers ---
  const setupEventHandlers = useCallback((map: maplibregl.Map) => {
    // Mousemove — hover effect + tooltip
    map.on('mousemove', FILL_LAYER_ID, (e) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const cvegeo = feature.properties?.CVEGEO as string;

        if (hoveredIdRef.current && hoveredIdRef.current !== cvegeo) {
          map.setFeatureState(
            { source: MAP_SOURCE_ID, id: hoveredIdRef.current },
            { hover: false }
          );
        }

        hoveredIdRef.current = cvegeo;
        map.setFeatureState(
          { source: MAP_SOURCE_ID, id: cvegeo },
          { hover: true }
        );

        map.getCanvas().style.cursor = 'pointer';
        setHoveredEstado(cvegeo);
      }
    });

    // Mouseleave
    map.on('mouseleave', FILL_LAYER_ID, () => {
      if (hoveredIdRef.current) {
        map.setFeatureState(
          { source: MAP_SOURCE_ID, id: hoveredIdRef.current },
          { hover: false }
        );
        hoveredIdRef.current = null;
      }
      map.getCanvas().style.cursor = '';
      setHoveredEstado(null);
    });

    // Click — show popup
    map.on('click', FILL_LAYER_ID, (e) => {
      if (!e.features || e.features.length === 0) return;

      const props = e.features[0].properties as GeoJSONProperties;
      const cvegeo = props.CVEGEO;

      // Find estado data
      const estadoData = useConflictStore.getState().estados.find(
        (est) => est.cvegeo === cvegeo
      ) ?? {
        cvegeo,
        nombre: props.NOMGEO,
        total_conflictos: props.total_conflictos ?? 0,
      };

      setSelectedEstado(estadoData);

      // Remove existing popup
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      if (popupRootRef.current) {
        popupRootRef.current.unmount();
        popupRootRef.current = null;
      }

      const coordinates = e.lngLat;
      const popupNode = document.createElement('div');
      const root = createRoot(popupNode);
      root.render(
        <StatePopup
          estado={estadoData}
          onClose={() => {
            if (popupRef.current) {
              popupRef.current.remove();
              popupRef.current = null;
            }
            if (popupRootRef.current) {
              popupRootRef.current.unmount();
              popupRootRef.current = null;
            }
            setSelectedEstado(null);
          }}
        />
      );
      popupRootRef.current = root;

      const popup = new maplibregl.Popup({
        closeButton: false,
        maxWidth: '380px',
        offset: 15,
      })
        .setLngLat(coordinates)
        .setDOMContent(popupNode)
        .addTo(map);

      popupRef.current = popup;
    });
  }, [setHoveredEstado, setSelectedEstado]);

  // --- Fly to selected state when changed from sidebar ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedEstado || !geojson) return;

    // Find the feature to zoom to
    const feature = geojson.features.find(
      (f) => f.properties.CVEGEO === selectedEstado.cvegeo
    );

    if (feature) {
      // Simple centroid approximation
      try {
        const coords = feature.geometry.type === 'Polygon'
          ? (feature.geometry.coordinates as number[][][])[0]
          : (feature.geometry.coordinates as number[][][][])[0][0];

        if (coords && coords.length > 0) {
          const lons = coords.map((c) => (c as number[])[0]);
          const lats = coords.map((c) => (c as number[])[1]);
          const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;
          const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;

          map.flyTo({
            center: [centerLon, centerLat],
            zoom: 6,
            duration: 1200,
            essential: true,
          });
        }
      } catch {
        // Ignore centroid errors
      }
    }
  }, [selectedEstado, geojson]);

  // --- Hover tooltip component ---
  const hoveredData = hoveredEstado
    ? estados.find((e) => e.cvegeo === hoveredEstado)
    : null;

  return (
    <div className="relative w-full h-full">
      {/* Map container — inline style needed because MapLibre GL overrides position:absolute via its own CSS */}
      <div
        ref={mapContainerRef}
        id="map-container"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />

      {/* Hover tooltip */}
      {hoveredData && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none z-20 animate-fade-in"
          id="map-tooltip"
        >
          <div className="glass rounded-lg px-4 py-2 flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-200">
              {hoveredData.nombre}
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-sm font-bold text-amber-400">
              {hoveredData.total_conflictos.toLocaleString('es-MX')}
            </span>
            <span className="text-xs text-slate-400">conflictos</span>
          </div>
        </div>
      )}

      {/* Reset view button */}
      <button
        id="btn-reset-view"
        onClick={() => {
          mapRef.current?.fitBounds(MEXICO_BOUNDS, { padding: 40, duration: 1000 });
          setSelectedEstado(null);
          if (popupRef.current) {
            popupRef.current.remove();
            popupRef.current = null;
          }
        }}
        className="absolute bottom-12 right-4 z-10 glass rounded-lg px-3 py-2 text-xs text-slate-300 hover:text-white hover:border-ocean-500 transition-all duration-200 flex items-center gap-1.5"
        title="Restablecer vista de México"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        México
      </button>

      {/* ── Logos panel — top right corner of map ── */}
      <div
        id="map-logos-panel"
        className="absolute top-4 right-14 z-10 pointer-events-none flex flex-col items-end gap-2"
      >
        {/* IGUAL Consultores logo — arriba */}
        <div
          className="rounded-xl shadow-card border border-white/10 px-4 py-2"
          style={{
            background: 'rgba(255, 255, 255, 0.97)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
          }}
        >
          <img
            src="/logos/logo-igual.png"
            alt="IGUAL Consultores"
            style={{ display: 'block', height: '28px', width: 'auto', objectFit: 'contain' }}
          />
        </div>

        {/* UN Global Compact — full Spanish banner — abajo, más grande */}
        <div
          className="rounded-xl overflow-hidden shadow-card border border-white/10"
          style={{
            background: 'rgba(27, 45, 91, 0.95)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}
        >
          <img
            src="/logos/logo-ungc.png"
            alt="UN Global Compact — 2026 Participant"
            style={{ display: 'block', height: '110px', width: 'auto', maxWidth: '440px', objectFit: 'contain' }}
          />
        </div>
      </div>
    </div>
  );
}
