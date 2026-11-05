// ============================================================
// Top10Chart — Horizontal bar chart for top municipalities
// ============================================================

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useConflictStore } from '@/store/conflictStore';
import { calcularEstadisticas, truncate } from '@/utils/statsUtils';
import { getConflictColor } from '@/data/colorScales';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { name: string; entity: string } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg px-3 py-2 text-xs">
        <p className="text-slate-300 font-semibold">{payload[0].payload.name}</p>
        <p className="text-slate-500">{payload[0].payload.entity}</p>
        <p className="text-amber-400 font-bold">{payload[0].value.toLocaleString('es-MX')} conflictos</p>
      </div>
    );
  }
  return null;
}

export default function Top10Chart() {
  const { municipios, conflictos, setSelectedMunicipio } = useConflictStore();

  const data = useMemo(() => {
    const stats = calcularEstadisticas(municipios, conflictos.length);
    return stats.top10.map((municipio) => ({
      name: municipio.nombre,
      entity: municipio.entidad,
      shortName: truncate(municipio.nombre, 14),
      value: municipio.totalConflictos,
      color: getConflictColor(municipio.totalConflictos),
      cvegeo: municipio.cvegeo,
    }));
  }, [conflictos.length, municipios]);

  if (data.length === 0) {
    return (
      <div className="h-52 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-ocean-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div id="chart-top10">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            width={95}
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            cursor="pointer"
            onClick={(entry) => {
              const item = entry as { cvegeo?: string; payload?: { cvegeo?: string } };
              const targetCvegeo = item?.payload?.cvegeo ?? item?.cvegeo;
              if (!targetCvegeo) return;
              const municipio = municipios.find((candidate) => candidate.cvegeo === targetCvegeo);
              if (municipio) setSelectedMunicipio(municipio);
            }}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
