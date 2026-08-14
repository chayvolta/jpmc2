# Contexto del Proyecto — Geoportal Conflictos México

## Objetivo

Visualizar conflictos socioambientales por proyectos de desarrollo en México (2017–2026) mediante un geoportal web profesional e interactivo.

## Estado Actual

**v1.0.0 — Funcional** ✅

## Arquitectura

- **Frontend:** React 19 + Vite 8 + TypeScript (estricto)
- **Mapa:** MapLibre GL JS v5 (open source, sin token)
- **Estado global:** Zustand
- **Gráficas:** Recharts
- **Estilos:** TailwindCSS v3 + CSS Custom Properties
- **GIS:** proj4 para reproyección EPSG:6372→WGS84

## Datos

- **Fuente:** GeoJSON `Estados_conflictos_con_Base.geojson` (IGUAL, 2017-2026)
- **CRS original:** EPSG:6372 (México LCC, ITRF2008)
- **CRS destino:** WGS84 (EPSG:4326)
- **Procesamiento:** Script Node.js en `scripts/processGeojson.js`
- **Reducción:** 38MB → 1.6MB (96% menos)
- **Propiedades clave:** `CVEGEO`, `NOMGEO`, `total_conflictos`

## Decisiones Técnicas

| Decisión | Razón |
|----------|-------|
| MapLibre GL (no Mapbox) | Open source, sin token de pago |
| Zustand (no Redux) | Simplicidad, menos boilerplate |
| Recharts (no D3) | API declarativa, componentes React nativos |
| Inline styles en contenedor de mapa | MapLibre sobrescribe `position:relative` mediante su propio CSS, anulando Tailwind `absolute inset-0` |
| Reproyección en build time | Evita procesamiento en cliente, mejor performance |

## Problemas Conocidos

- Los labels de estados usan glyphs de `fonts.openmaptiles.org` — puede haber latencia en primera carga
- Los datos son solo totales por estado (sin detalle de proyectos individuales)

## Pendientes Principales

1. Integrar datos detallados (CSV/Excel) con proyectos individuales, años, tipos
2. Implementar filtros funcionales (año, tipo de conflicto, tipo de proyecto)
3. Gráficas adicionales (por año, por tipo)

## Rutas de Archivos Importantes

- `public/data/estados_conflictos.geojson` — GeoJSON procesado (WGS84)
- `src/components/map/MapView.tsx` — Componente principal del mapa
- `src/store/conflictStore.ts` — Estado global Zustand
- `src/data/colorScales.ts` — Escala de colores choropleth
- `scripts/processGeojson.js` — Reproyección + simplificación
