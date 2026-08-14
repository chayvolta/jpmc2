// ============================================================
// DistributionChart — Pie chart for conflict distribution
// ============================================================

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useConflictStore } from '@/store/conflictStore';
import { calcularEstadisticas } from '@/utils/statsUtils';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg px-3 py-2 text-xs">
        <p className="text-slate-300 font-semibold">{payload[0].name}</p>
        <p style={{ color: payload[0].payload.color }} className="font-bold">
          {payload[0].value} estados
        </p>
      </div>
    );
  }
  return null;
}

export default function DistributionChart() {
  const { estados } = useConflictStore();

  const data = useMemo(() => {
    const stats = calcularEstadisticas(estados);
    return stats.distribucion.map((d) => ({
      name: d.label,
      value: d.count,
      color: d.color,
    }));
  }, [estados]);

  if (data.length === 0) {
    return (
      <div className="h-36 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-ocean-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div id="chart-distribution">
      <ResponsiveContainer width="100%" height={170}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={42}
            outerRadius={64}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} stroke="none" fillOpacity={0.9} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: '#94a3b8', fontSize: 10 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
