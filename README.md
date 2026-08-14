# Geoportal de Conflictos por Proyectos en México

> Dashboard geoespacial interactivo que visualiza conflictos socioambientales por estado en México (2017–2026).

## 🗺️ Vista previa

Mapa choropleth de México con simbología basada en número de conflictos, panel lateral de estadísticas e indicadores KPI en tiempo real.

## 🚀 Inicio rápido

```bash
# Instalar dependencias
npm install

# Procesar GeoJSON (reproyectar de EPSG:6372 a WGS84)
npm run process-geojson

# Iniciar servidor de desarrollo
npm run dev
```

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | React 19 + Vite 8 + TypeScript |
| Mapa | MapLibre GL JS v5 |
| Estilos | TailwindCSS v3 |
| Estado | Zustand |
| Gráficas | Recharts |
| GIS | proj4 (reproyección) |

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── map/          # MapView, MapLegend, StatePopup
│   ├── stats/        # StatsOverview, Top10Chart, DistributionChart
│   ├── filters/      # StateSearch
│   └── layout/       # Header, Sidebar
├── data/             # colorScales.ts
├── hooks/            # useGeoJSON.ts
├── pages/            # Dashboard.tsx
├── services/         # geojsonService.ts
├── store/            # conflictStore.ts (Zustand)
├── types/            # conflicto.ts
└── utils/            # statsUtils.ts
```

## 🗃️ Datos

El GeoJSON original (`Estados_conflictos_con_Base.geojson`) usa **EPSG:6372** (Sistema de referencia oficial de México).
El script `scripts/processGeojson.js` lo reproyecta a **WGS84** y simplifica geometrías:
- **Entrada:** 38 MB (EPSG:6372)
- **Salida:** ~1.6 MB (WGS84, listo para MapLibre)

## ✨ Funcionalidades

- ✅ Mapa choropleth interactivo de 32 estados
- ✅ Tooltip en hover con nombre y total de conflictos
- ✅ Popup detallado al hacer clic (ranking, porcentaje, clasificación)
- ✅ Panel lateral con KPIs, búsqueda y gráficas
- ✅ Top 10 estados con mayor conflictividad
- ✅ Leyenda de escala de colores
- ✅ Responsive (desktop, tablet, móvil)

## 🗺️ Roadmap

Ver [ROADMAP.md](ROADMAP.md) para funcionalidades futuras planificadas.

## 📝 Changelog

Ver [CHANGELOG.md](CHANGELOG.md) para el historial de versiones.

## 🏛️ Documentación

- [Arquitectura](docs/architecture.md)
- [Modelo de datos](docs/data_model.md)
- [Contexto del proyecto](docs/project_context.md)

## 📄 Fuente de datos

**IGUAL** — Información y Análisis para la Justicia Ambiental y el Territorio
Período: 2017–2026
