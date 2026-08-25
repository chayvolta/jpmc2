# Arquitectura

## Flujo de datos

1. `record_summaries.json` se normaliza con `scripts/importConflictSummaries.js`.
2. Cada registro conserva uno o varios valores `CVEGEO`.
3. `scripts/joinMunicipalities.js` valida esas claves contra el GeoJSON municipal.
4. El script agrega conteos y años al polígono correspondiente.
5. La aplicación carga en paralelo el detalle JSON y el GeoJSON agregado.
6. Zustand relaciona mapa, búsqueda, indicadores, gráficas y fichas municipales.

## Separación de responsabilidades

| Capa | Responsabilidad |
|---|---|
| `scripts/` | Normalización, validación y generación reproducible |
| `public/data/` | Artefactos estáticos listos para publicar |
| `services/` | Carga y transformación del paquete de datos |
| `store/` | Estado compartido y selección municipal |
| `components/map/` | Visualización geográfica y fichas |
| `components/stats/` | Indicadores y distribuciones |

## Integridad

La generación verifica unicidad de `CASE_ID` y cobertura completa de `CVEGEO`. No realiza coincidencias aproximadas por nombre, por lo que no introduce asignaciones territoriales inferidas.
