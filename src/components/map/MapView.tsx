import { useCallback, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getMapLibreColorExpression } from '@/data/colorScales';
import { useConflictStore } from '@/store/conflictStore';
import type { GeoJSONFeature } from '@/services/geojsonService';
import type { GeoJSONProperties, MunicipioData } from '@/types/conflicto';
import MunicipalityPopup from './MunicipalityPopup';

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
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const popupRootRef = useRef<Root | null>(null);
  const hoveredIdRef = useRef<string | null>(null);

  const {
    geojson,
    municipios,
    hoveredMunicipio,
    selectedMunicipio,
    setHoveredMunicipio,
    setSelectedMunicipio,
  } = useConflictStore();

  const removePopup = useCallback(() => {
    popupRef.current?.remove();
    popupRef.current = null;
    if (popupRootRef.current) {
      const popupRoot = popupRootRef.current;
      popupRootRef.current = null;
      queueMicrotask(() => popupRoot.unmount());
    }
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

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
      fitBoundsOptions: { padding: 40 },
      attributionControl: false,
      logoPosition: 'bottom-left',
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');
    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      removePopup();
      map.remove();
      mapRef.current = null;
    };
  }, [removePopup]);

  const setupEventHandlers = useCallback((map: maplibregl.Map) => {
    map.on('mousemove', FILL_LAYER_ID, (event) => {
      const feature = event.features?.[0];
      const cvegeo = feature?.properties?.CVEGEO as string | undefined;
      if (!cvegeo) return;

      if (hoveredIdRef.current && hoveredIdRef.current !== cvegeo) {
        map.setFeatureState(
          { source: MAP_SOURCE_ID, id: hoveredIdRef.current },
          { hover: false }
        );
      }

      hoveredIdRef.current = cvegeo;
      map.setFeatureState({ source: MAP_SOURCE_ID, id: cvegeo }, { hover: true });
      map.getCanvas().style.cursor = 'pointer';
      setHoveredMunicipio(cvegeo);
    });

    map.on('mouseleave', FILL_LAYER_ID, () => {
      if (hoveredIdRef.current) {
        map.setFeatureState(
          { source: MAP_SOURCE_ID, id: hoveredIdRef.current },
          { hover: false }
        );
        hoveredIdRef.current = null;
      }
      map.getCanvas().style.cursor = '';
      setHoveredMunicipio(null);
    });

    map.on('click', FILL_LAYER_ID, (event) => {
      const feature = event.features?.[0];
      if (!feature) return;

      const properties = feature.properties as GeoJSONProperties;
      const state = useConflictStore.getState();
      const municipality = state.municipios.find(
        (candidate) => candidate.cvegeo === properties.CVEGEO
      ) ?? municipalityFromProperties(properties);
      const municipalityConflicts = state.conflictos.filter((conflict) =>
        conflict.cvegeo.includes(municipality.cvegeo)
      );

      setSelectedMunicipio(municipality);
      removePopup();

      const popupNode = document.createElement('div');
      const popupRoot = createRoot(popupNode);
      popupRoot.render(
        <MunicipalityPopup
          municipio={municipality}
          conflictos={municipalityConflicts}
          onClose={() => {
            removePopup();
            setSelectedMunicipio(null);
          }}
        />
      );
      popupRootRef.current = popupRoot;

      popupRef.current = new maplibregl.Popup({
        closeButton: false,
        maxWidth: '440px',
        offset: 15,
      })
        .setLngLat(event.lngLat)
        .setDOMContent(popupNode)
        .addTo(map);
    });
  }, [removePopup, setHoveredMunicipio, setSelectedMunicipio]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geojson) return;

    function addLayers() {
      [LABEL_LAYER_ID, HOVER_LAYER_ID, STROKE_LAYER_ID, FILL_LAYER_ID].forEach((layerId) => {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
      });
      if (map.getSource(MAP_SOURCE_ID)) map.removeSource(MAP_SOURCE_ID);

      map.addSource(MAP_SOURCE_ID, {
        type: 'geojson',
        data: geojson as maplibregl.GeoJSONSourceSpecification['data'],
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
            ['boolean', ['feature-state', 'hover'], false],
            '#ffffff',
            '#334155',
          ],
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3,
            ['case', ['boolean', ['feature-state', 'hover'], false], 1.8, 0.15],
            8,
            ['case', ['boolean', ['feature-state', 'hover'], false], 1.8, 0.7],
          ],
          'line-opacity': 0.78,
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

      setupEventHandlers(map);
    }

    if (map.loaded()) addLayers();
    else map.once('load', addLayers);
  }, [geojson, setupEventHandlers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedMunicipio || !geojson) return;

    const feature = geojson.features.find(
      (candidate) => candidate.properties.CVEGEO === selectedMunicipio.cvegeo
    );
    if (!feature) return;

    const bounds = getFeatureBounds(feature);
    if (bounds) {
      map.fitBounds(bounds, {
        padding: 100,
        maxZoom: 9,
        duration: 1000,
      });
    }
  }, [geojson, selectedMunicipio]);

  const hoveredData = hoveredMunicipio
    ? municipios.find((municipio) => municipio.cvegeo === hoveredMunicipio)
    : null;

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainerRef}
        id="map-container"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />

      {hoveredData && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none z-20 animate-fade-in">
          <div className="glass rounded-lg px-4 py-2 flex items-center gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-200">{hoveredData.nombre}</p>
              <p className="text-xs text-slate-500">{hoveredData.entidad} · {hoveredData.cvegeo}</p>
            </div>
            <span className="text-xs text-slate-600">|</span>
            <span className="text-sm font-bold text-amber-400">
              {hoveredData.totalConflictos.toLocaleString('es-MX')}
            </span>
            <span className="text-xs text-slate-400">conflictos</span>
          </div>
        </div>
      )}

      <button
        id="btn-reset-view"
        onClick={() => {
          mapRef.current?.fitBounds(MEXICO_BOUNDS, { padding: 40, duration: 1000 });
          setSelectedMunicipio(null);
          removePopup();
        }}
        className="absolute bottom-12 right-4 z-10 glass rounded-lg px-3 py-2 text-xs text-slate-300 hover:text-white hover:border-ocean-500 transition-all duration-200 flex items-center gap-1.5"
        title="Restablecer vista de México"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        México
      </button>

      <div id="map-logos-panel" className="absolute top-4 right-14 z-10 pointer-events-none flex flex-col items-end gap-2">
        <div className="rounded-xl shadow-card border border-white/10 px-4 py-2" style={{ background: 'rgba(255, 255, 255, 0.97)', backdropFilter: 'blur(12px)' }}>
          <img src="/logos/logo-igual.png" alt="IGUAL Consultores" className="block h-7 w-auto object-contain" />
        </div>
        <div className="rounded-xl overflow-hidden shadow-card border border-white/10" style={{ background: 'rgba(27, 45, 91, 0.95)', backdropFilter: 'blur(12px)' }}>
          <img src="/logos/logo-ungc.png" alt="UN Global Compact — 2026 Participant" className="block h-[110px] w-auto max-w-[440px] object-contain" />
        </div>
      </div>
    </div>
  );
}
