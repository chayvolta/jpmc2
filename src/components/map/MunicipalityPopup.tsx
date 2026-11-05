import { AlertTriangle, ExternalLink, MapPin, TrendingUp, X } from 'lucide-react';
import { getConflictColor } from '@/data/colorScales';
import { useConflictStore } from '@/store/conflictStore';
import type { ConflictoRegistro, MunicipioData } from '@/types/conflicto';
import { formatNumber, formatPercent } from '@/utils/statsUtils';

interface MunicipalityPopupProps {
  municipio: MunicipioData;
  conflictos: ConflictoRegistro[];
  onClose: () => void;
  isHoverPreview?: boolean;
}

export default function MunicipalityPopup({
  municipio,
  conflictos,
  onClose,
  isHoverPreview = false,
}: MunicipalityPopupProps) {
  const { municipios, metadata } = useConflictStore();
  const afectados = municipios.filter((candidate) => candidate.totalConflictos > 0);
  const ranking = [...afectados]
    .sort((left, right) => right.totalConflictos - left.totalConflictos)
    .findIndex((candidate) => candidate.cvegeo === municipio.cvegeo) + 1;
  const totalNacional = metadata?.uniqueConflicts ?? 0;
  const color = getConflictColor(municipio.totalConflictos);
  const porcentaje = formatPercent(municipio.totalConflictos, totalNacional);

  return (
    <div
      className="w-full sm:w-[400px] md:w-[420px] max-w-full max-h-[inherit] flex flex-col overflow-hidden bg-surface-700 text-slate-200 rounded-xl"
      id={`popup-municipio-${municipio.cvegeo}`}
    >
      {/* Mobile handle bar when pinned */}
      {!isHoverPreview && (
        <div className="sm:hidden flex justify-center pt-2 pb-0.5 bg-surface-800/80 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
      )}

      {/* Sticky Header */}
      <div
        className="relative px-4 sm:px-5 py-3.5 sm:py-4 flex items-start justify-between gap-2 flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${color}22 0%, #1a1f2e 100%)` }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-3 h-10 sm:h-11 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <MapPin size={12} className="text-slate-400 flex-shrink-0" />
              <span className="text-[11px] sm:text-xs text-slate-400 uppercase tracking-wider font-medium">
                Municipio
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white leading-tight truncate">
              {municipio.nombre}
            </h3>
            <p className="text-xs text-slate-400 truncate">{municipio.entidad}</p>
          </div>
        </div>
        {!isHoverPreview && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors flex-shrink-0"
            aria-label="Cerrar ficha"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="h-px bg-white/8 flex-shrink-0" />

      {/* Scrollable Body */}
      <div className="px-4 sm:px-5 py-3.5 sm:py-4 space-y-3.5 sm:space-y-4 overflow-y-auto sidebar-scroll flex-1 min-h-0">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
              <AlertTriangle size={12} /> Conflictos asociados
            </p>
            <p className="text-3xl sm:text-4xl font-black tracking-tight leading-none" style={{ color }}>
              {formatNumber(municipio.totalConflictos)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 mb-1">Del total nacional único</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-300 leading-none">{porcentaje}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <div className="bg-white/5 rounded-lg px-3 py-2">
            <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1">
              <TrendingUp size={11} /> Ranking afectado
            </p>
            <p className="text-lg sm:text-xl font-bold text-white">
              {ranking > 0 ? `#${ranking}` : '—'}
              <span className="text-xs text-slate-400 font-normal ml-1">de {afectados.length}</span>
            </p>
          </div>
          <div className="bg-white/5 rounded-lg px-3 py-2">
            <p className="text-xs text-slate-400 mb-0.5">Clave geoestadística</p>
            <p className="text-lg sm:text-xl font-bold font-mono text-ocean-300">{municipio.cvegeo}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <span className="text-xs text-slate-400">Clasificación:</span>
          <span className="text-xs font-semibold truncate" style={{ color }}>
            {getClassificationLabel(municipio.totalConflictos)}
          </span>
        </div>

        {conflictos.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Registros vinculados ({conflictos.length})
            </p>
            <div
              className={`space-y-2 ${
                isHoverPreview ? 'max-h-40 overflow-hidden' : 'max-h-52 overflow-y-auto sidebar-scroll pr-1'
              }`}
            >
              {(isHoverPreview ? conflictos.slice(0, 2) : conflictos)
                .slice()
                .sort((left, right) => right.year - left.year || left.caseId.localeCompare(right.caseId))
                .map((conflicto) => (
                  <article key={conflicto.caseId} className="bg-white/5 rounded-lg p-2.5 sm:p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-mono font-semibold text-ocean-300">{conflicto.caseId}</span>
                      <span className="text-xs text-slate-500">{conflicto.year}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200 leading-snug">{conflicto.project}</p>
                    <p className={`text-xs text-slate-400 leading-relaxed mt-1 ${isHoverPreview ? 'line-clamp-2' : ''}`}>
                      {conflicto.summary}
                    </p>
                    {!isHoverPreview && (
                      conflicto.urlPrimary ? (
                        <a
                          href={conflicto.urlPrimary}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-ocean-300 hover:text-ocean-200 mt-2"
                        >
                          Fuente principal <ExternalLink size={11} />
                        </a>
                      ) : (
                        <p className="text-xs text-amber-400 mt-2">Sin URL principal disponible</p>
                      )
                    )}
                  </article>
                ))}
            </div>
            {isHoverPreview && conflictos.length > 2 && (
              <p className="text-[11px] text-ocean-300 mt-1.5 font-medium">
                Haz clic en el municipio para ver los {conflictos.length} registros y enlaces
              </p>
            )}
          </div>
        )}

        <div className="bg-ocean-900/30 border border-ocean-800/40 rounded-lg px-3 py-2">
          <p className="text-[11px] sm:text-xs text-ocean-300 leading-relaxed">
            {isHoverPreview
              ? 'Haz clic sobre el municipio para fijar esta ficha y explorar las fuentes.'
              : 'Los casos multimunicipales cuentan en cada municipio asociado; el total nacional conserva casos únicos.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function getClassificationLabel(total: number): string {
  if (total === 0) return 'Sin conflictos asociados';
  if (total === 1) return 'Un conflicto asociado';
  if (total === 2) return 'Dos conflictos asociados';
  if (total <= 5) return 'Conflictividad municipal media';
  return 'Conflictividad municipal alta';
}
