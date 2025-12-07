import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { WeekData } from '../types';
import { formatMontantAvecDevise } from '../lib/format';

interface WeekChartProps {
  data: WeekData[];
  previousWeekData?: WeekData[];
}

export function WeekChart({ data, previousWeekData = [] }: WeekChartProps) {
  // Calculer la moyenne de la semaine actuelle
  const moyenne = data.length > 0
    ? data.reduce((sum, item) => sum + item.total, 0) / data.length
    : 0;

  // Créer une map des jours de la semaine (Lun, Mar, Mer...)
  const daysOrder = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Fusionner les données des deux semaines par jour de la semaine
  const chartData = daysOrder.map(day => {
    const currentDayData = data.find(item => item.jour_court === day);
    const previousDayData = previousWeekData.find(item => item.jour_court === day);

    const currentTotal = currentDayData?.total || 0;
    const previousTotal = previousDayData?.total || 0;
    const evolution = currentTotal - previousTotal;
    const evolutionPercent = previousTotal > 0
      ? ((evolution / previousTotal) * 100)
      : (currentTotal > 0 ? 100 : 0);

    return {
      day,
      date: currentDayData?.date_format || '',
      currentWeek: currentTotal,
      previousWeek: previousTotal,
      evolution,
      evolutionPercent
    };
  });

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #E0E0E0',
          borderRadius: '6px',
          padding: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
            {data.day} ({data.date})
          </div>
          <div style={{ marginBottom: '4px', color: '#8B1538', fontWeight: '600' }}>
            Cette semaine : {formatMontantAvecDevise(data.currentWeek)}
          </div>
          <div style={{ marginBottom: '8px', color: '#999' }}>
            Semaine dernière : {formatMontantAvecDevise(data.previousWeek)}
          </div>
          <div style={{
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: data.evolution >= 0 ? '#E8F5E9' : '#FFEBEE',
            color: data.evolution >= 0 ? '#2D7D4C' : '#D32F2F',
            fontWeight: 'bold',
            fontSize: '12px'
          }}>
            {data.evolution >= 0 ? '↑' : '↓'} {formatMontantAvecDevise(Math.abs(data.evolution))} ({data.evolutionPercent >= 0 ? '+' : ''}{data.evolutionPercent.toFixed(1)}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%' }}>
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
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={moyenne}
              stroke="#8B1538"
              strokeDasharray="5 5"
              label={{
                value: `Moy: ${formatMontantAvecDevise(moyenne)}`,
                position: 'right',
                fill: '#8B1538',
                fontSize: 12,
              }}
            />
            {/* Barre semaine précédente (gris clair, en arrière-plan) */}
            <Bar
              dataKey="previousWeek"
              fill="#D0D0D0"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
              opacity={0.6}
            />
            {/* Barre semaine actuelle (rouge bordeaux, au premier plan) */}
            <Bar
              dataKey="currentWeek"
              fill="#8B1538"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Affichage des informations sous le graphique */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px',
        marginTop: '16px',
        paddingLeft: '40px',
        paddingRight: '10px'
      }}>
        {chartData.map((item, index) => (
          <div key={index} style={{
            textAlign: 'center',
            fontSize: '11px'
          }}>
            <div style={{
              color: '#666',
              marginBottom: '4px',
              fontWeight: '500'
            }}>
              {item.date}
            </div>
            <div style={{
              color: '#8B1538',
              fontWeight: 'bold',
              fontSize: '13px',
              marginBottom: '4px'
            }}>
              {item.currentWeek > 0 ? `${item.currentWeek}€` : '-'}
            </div>
            <div style={{
              color: item.evolutionPercent >= 0 ? '#2D7D4C' : '#D32F2F',
              fontWeight: '600',
              fontSize: '12px'
            }}>
              {item.currentWeek > 0 || item.previousWeek > 0
                ? `${item.evolutionPercent >= 0 ? '+' : ''}${item.evolutionPercent.toFixed(0)}%`
                : '-'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
