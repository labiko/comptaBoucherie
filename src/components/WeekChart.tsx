import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { WeekData } from '../types';
import { formatMontant } from '../lib/format';

interface WeekChartProps {
  data: WeekData[];
}

export function WeekChart({ data }: WeekChartProps) {
  // Calculer la moyenne
  const moyenne = data.length > 0
    ? data.reduce((sum, item) => sum + item.total, 0) / data.length
    : 0;

  // Formatter les données pour le graphique
  const chartData = data.map(item => ({
    day: item.jour_court,
    date: item.date_format,
    montant: item.total,
  }));

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
          <XAxis
            dataKey="day"
            tick={{ fill: '#666666', fontSize: 12 }}
            axisLine={{ stroke: '#E0E0E0' }}
          />
          <YAxis
            tick={{ fill: '#666666', fontSize: 12 }}
            axisLine={{ stroke: '#E0E0E0' }}
            tickFormatter={(value) => `${value}€`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E0E0E0',
              borderRadius: '6px',
              padding: '8px 12px',
            }}
            formatter={(value: number) => [formatMontant(value), 'Recette']}
            labelFormatter={(label, payload) => {
              if (payload && payload.length > 0) {
                return `${label} (${payload[0].payload.date})`;
              }
              return label;
            }}
          />
          <ReferenceLine
            y={moyenne}
            stroke="#8B1538"
            strokeDasharray="5 5"
            label={{
              value: `Moy: ${formatMontant(moyenne)}`,
              position: 'right',
              fill: '#8B1538',
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="montant"
            fill="#8B1538"
            radius={[6, 6, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
