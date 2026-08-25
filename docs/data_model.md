# Modelo de datos

## Conflicto

Cada elemento de `conflictos_municipales.json` contiene:

| Campo | Uso |
|---|---|
| `caseId` | Identificador único y estable |
| `year` | Año vigente del registro auditado |
| `project` | Proyecto asociado |
| `summary` | Resumen breve del caso |
| `entity` | Entidad federativa reportada |
| `municipality` | Municipio o conjunto municipal reportado |
| `cvegeo` | Arreglo de claves geoestadísticas municipales |
| `geographicScope` | `UNIMUNICIPAL` o `MULTIMUNICIPAL` |
| `auditStatus` | Resultado de auditoría del caso |
| `urlPrimary` | URL principal recuperada |
| `urlSecondary` | URL secundaria, cuando existe |

## Municipio

Cada feature de `municipios_conflictos.geojson` conserva:

| Campo | Uso |
|---|---|
| `CVEGEO` | Llave municipal de cinco dígitos |
| `CVE_ENT` | Clave de entidad |
| `CVE_MUN` | Clave municipal dentro de la entidad |
| `NOMGEO` | Nombre de la entidad |
| `NOMMUN` | Nombre del municipio |
| `total_conflictos` | Asignaciones asociadas al municipio |
| `conflictos_validados` | Registros cuyo estado inicia con `VALIDADO` |
| `conflictos_pendientes` | Registros cuyo estado contiene `PENDIENTE` |
| `primer_anio` | Año mínimo asociado |
| `ultimo_anio` | Año máximo asociado |

## Regla de conteo

Un conflicto multimunicipal aparece una sola vez en el JSON de detalle y referencia varias claves en `cvegeo`. En el GeoJSON incrementa `total_conflictos` una vez por municipio asociado. Esta regla evita duplicar el total nacional y conserva la cobertura territorial completa.
