# CHANGELOG

## [1.0.0] — 2026-07-14

### Inicial
- Proyecto creado con Vite 8 + React 19 + TypeScript
- Stack: MapLibre GL JS v5, TailwindCSS v3, Zustand, Recharts
- Script de reproyección GeoJSON EPSG:6372 → WGS84 (reducción 38MB → 1.6MB)
- Mapa choropleth interactivo con 32 estados de México
- Hover tooltip con nombre y conflictos del estado
- Popup detallado al hacer clic (ranking, %, clasificación)
- Panel lateral con KPIs, búsqueda de estados, Top 10, distribución
- Leyenda de colores choropleth
- Sidebar colapsible con transición suave
- ResizeObserver para redibujado correcto del mapa
- Fix: contenedor del mapa con inline styles (conflicto CSS Tailwind/MapLibre)

### Correcciones
- Fix: MapLibre GL sobrescribe `position:relative` en su contenedor → solución con inline styles
- Fix: GeoJSON en EPSG:6372 (México LCC) reproyectado a WGS84 para compatibilidad con MapLibre
- Fix: Source glyph URL cambiada a `fonts.openmaptiles.org` (demotiles.maplibre.org retorna 404)
