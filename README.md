# Geoportal de Conflictos por Municipio en México

Dashboard geoespacial interactivo para consultar conflictos socioambientales por municipio, con clave geoestadística, resumen y URL de fuente por registro.

## Cobertura integrada

- 2,478 municipios con geometría WGS84.
- 252 municipios con al menos un conflicto asociado.
- 393 conflictos únicos auditados.
- 412 asignaciones municipales; los casos multimunicipales se cuentan en cada territorio vinculado.
- Unión exacta mediante `CVEGEO` de cinco dígitos, sin claves faltantes.

## Inicio rápido

```bash
npm install
npm run dev
```

La aplicación usa los archivos ya procesados de `public/data/`.

## Reproducir la integración

```bash
npm run import-conflicts -- ../record_summaries.json
npm run join-municipalities -- /ruta/municipalities_simple.geojson 0.0025
npm run build
```

`import-conflicts` valida que cada `CASE_ID` sea único. `join-municipalities` detiene el proceso si una clave `CVEGEO` no tiene geometría y simplifica los polígonos con la tolerancia indicada.

## Datos publicados

| Archivo | Contenido |
|---|---|
| `public/data/conflictos_municipales.json` | 393 registros con `CASE_ID`, municipio, `CVEGEO`, resumen y URLs |
| `public/data/municipios_conflictos.geojson` | 2,478 geometrías con conteos agregados por municipio |

Ambos archivos incluyen metadatos de generación, fuente y llave de unión. El total nacional usa `CASE_ID` únicos; el total territorial usa asignaciones municipales.

## Funcionalidades

- Mapa coroplético de municipios de México.
- Búsqueda por municipio, entidad o `CVEGEO`.
- Ficha municipal con ranking y conflictos vinculados.
- Resumen breve y enlace a la fuente principal de cada registro.
- Indicadores de conflictos únicos, municipios afectados y asignaciones.
- Top 10 municipal y distribución por intensidad.

## Tecnología

React 19, Vite 8, TypeScript, MapLibre GL, Zustand, Recharts y TailwindCSS.

## Documentación

- [Arquitectura](docs/architecture.md)
- [Modelo de datos](docs/data_model.md)
- [Contexto](docs/project_context.md)
- [Historial de cambios](CHANGELOG.md)

## Fuente

Base auditada de conflictos de IGUAL y archivo municipal proporcionado para el cruce geográfico. La cobertura principal corresponde a registros 2017–2026 e incorpora correcciones históricas conservadas en el campo de año vigente.
