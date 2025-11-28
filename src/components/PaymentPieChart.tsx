import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { PaymentDistribution } from '../types';
import { formatMontantAvecDevise } from '../lib/format';

interface PaymentPieChartProps {
  data: PaymentDistribution[];
}

export function PaymentPieChart({ data }: PaymentPieChartProps) {
  // Filtrer les valeurs à 0
  const filteredData = data.filter(item => item.value > 0);

  if (filteredData.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#999999' }}>
        Aucune donnée disponible
      </div>
    );
  }

  const total = filteredData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={filteredData as any}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry: any) => {
              const percent = ((entry.value / total) * 100).toFixed(0);
              return `${percent}%`;
            }}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {filteredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatMontantAvecDevise(value)}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E0E0E0',
              borderRadius: '6px',
              padding: '8px 12px',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => {
              const percent = ((entry.payload.value / total) * 100).toFixed(1);
              return `${value} (${percent}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
