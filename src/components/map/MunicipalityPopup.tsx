import { AlertTriangle, ExternalLink, MapPin, TrendingUp, X } from 'lucide-react';
import { getConflictColor } from '@/data/colorScales';
import { useConflictStore } from '@/store/conflictStore';
import type { ConflictoRegistro, MunicipioData } from '@/types/conflicto';
import { formatNumber, formatPercent } from '@/utils/statsUtils';

interface MunicipalityPopupProps {
  municipio: MunicipioData;
  conflictos: ConflictoRegistro[];
  onClose: () => void;
}

export default function MunicipalityPopup({ municipio, conflictos, onClose }: MunicipalityPopupProps) {
  const { municipios, metadata } = useConflictStore();
  const afectados = municipios.filter((candidate) => candidate.totalConflictos > 0);
  const ranking = [...afectados]
    .sort((left, right) => right.totalConflictos - left.totalConflictos)
    .findIndex((candidate) => candidate.cvegeo === municipio.cvegeo) + 1;
  const totalNacional = metadata?.uniqueConflicts ?? 0;
  const color = getConflictColor(municipio.totalConflictos);
  const porcentaje = formatPercent(municipio.totalConflictos, totalNacional);

  return (
    <div className="w-[420px] max-w-[calc(100vw-32px)] overflow-hidden" id={`popup-municipio-${municipio.cvegeo}`}>
      <div
        className="relative px-5 py-4 flex items-start justify-between"
        style={{ background: `linear-gradient(135deg, ${color}22 0%, #1a1f2e 100%)` }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-3 h-11 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <MapPin size={12} className="text-slate-400" />
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Municipio</span>
            </div>
            <h3 className="text-base font-bold text-white leading-tight truncate">{municipio.nombre}</h3>
            <p className="text-xs text-slate-400 truncate">{municipio.entidad}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" aria-label="Cerrar ficha">
          <X size={16} className="text-slate-400" />
        </button>
      </div>

      <div className="h-px bg-white/8" />

      <div className="px-5 py-4 space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
              <AlertTriangle size={12} /> Conflictos asociados
            </p>
            <p className="text-4xl font-black tracking-tight" style={{ color }}>
              {formatNumber(municipio.totalConflictos)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 mb-1">Del total nacional único</p>
            <p className="text-2xl font-bold text-slate-300">{porcentaje}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-lg px-3 py-2.5">
            <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <TrendingUp size={11} /> Ranking afectado
            </p>
            <p className="text-xl font-bold text-white">
              {ranking > 0 ? `#${ranking}` : '—'}
              <span className="text-xs text-slate-400 font-normal ml-1">de {afectados.length}</span>
            </p>
          </div>
          <div className="bg-white/5 rounded-lg px-3 py-2.5">
            <p className="text-xs text-slate-400 mb-1">Clave geoestadística</p>
            <p className="text-xl font-bold font-mono text-ocean-300">{municipio.cvegeo}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs text-slate-400">Clasificación:</span>
          <span className="text-xs font-semibold" style={{ color }}>
            {getClassificationLabel(municipio.totalConflictos)}
          </span>
        </div>

        {conflictos.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Registros vinculados</p>
            <div className="space-y-2 max-h-56 overflow-y-auto sidebar-scroll pr-1">
              {conflictos
                .slice()
                .sort((left, right) => right.year - left.year || left.caseId.localeCompare(right.caseId))
                .map((conflicto) => (
                  <article key={conflicto.caseId} className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-mono font-semibold text-ocean-300">{conflicto.caseId}</span>
                      <span className="text-xs text-slate-500">{conflicto.year}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200 leading-snug">{conflicto.project}</p>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">{conflicto.summary}</p>
                    {conflicto.urlPrimary ? (
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
                    )}
                  </article>
                ))}
            </div>
          </div>
        )}

        <div className="bg-ocean-900/30 border border-ocean-800/40 rounded-lg px-3 py-2">
          <p className="text-xs text-ocean-300 leading-relaxed">
            Los casos multimunicipales cuentan en cada municipio asociado; el total nacional conserva casos únicos.
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
