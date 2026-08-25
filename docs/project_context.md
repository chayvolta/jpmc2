# Contexto del proyecto

## Objetivo

Visualizar conflictos socioambientales de México a escala municipal y conservar la trazabilidad entre cada `CASE_ID`, su clave geoestadística, su resumen y sus URLs de respaldo.

## Estado

**v1.1.0 — Integración municipal**

## Cobertura

| Indicador | Valor |
|---|---:|
| Municipios en el GeoJSON | 2,478 |
| Municipios con conflictos | 252 |
| Conflictos únicos | 393 |
| Asignaciones municipales | 412 |
| Claves sin geometría | 0 |

La diferencia entre conflictos únicos y asignaciones se debe a siete registros multimunicipales. Cada `CASE_ID` permanece único en el total nacional, pero participa en todos los municipios indicados por su lista de `CVEGEO`.

## Decisiones

- `CVEGEO` es la llave canónica del join y se conserva como texto de cinco dígitos.
- El proceso falla si detecta claves municipales sin geometría.
- Las geometrías se publican en CRS84/WGS84 y se simplifican a `0.0025` grados para uso web.
- El detalle de conflictos permanece separado del GeoJSON para evitar duplicar texto y URLs en cada polígono.
- Los conteos municipales son asignaciones territoriales; el KPI nacional usa `CASE_ID` únicos.

## Archivos principales

- `public/data/conflictos_municipales.json`: detalle trazable por conflicto.
- `public/data/municipios_conflictos.geojson`: geometría y agregados municipales.
- `scripts/importConflictSummaries.js`: normalización del detalle auditado.
- `scripts/joinMunicipalities.js`: validación, join y simplificación geográfica.
- `src/components/map/MapView.tsx`: mapa municipal.
- `src/components/map/MunicipalityPopup.tsx`: ficha y fuentes del municipio.

## Alcance pendiente

- Añadir filtros por año, subsector y estado de auditoría.
- Mostrar la fuente secundaria cuando esté disponible.
- Incorporar una vista tabular descargable de los 393 registros.
