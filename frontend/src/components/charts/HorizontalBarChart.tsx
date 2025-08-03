import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

interface HorizontalBarData {
  name: string;
  value: number;
  trades?: number;
  color?: string;
}

interface HorizontalBarChartProps {
  data: HorizontalBarData[];
  height?: number;
  valueFormatter?: (value: number) => string;
  showTooltip?: boolean;
}

const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  data,
  height = 300,
  valueFormatter,
  showTooltip = true
}) => {
  const maxValue = Math.max(...data.map(d => Math.abs(d.value)));
  
  const defaultFormatter = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const formatValue = valueFormatter || defaultFormatter;

  const getBarColor = (value: number, index: number) => {
    if (data[index].color) return data[index].color;
    return value >= 0 ? '#10B981' : '#EF4444';
  };

  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">{label}</p>
          <p className="text-gray-300">
            P&L: <span className={data.value >= 0 ? 'text-green-400' : 'text-red-400'}>
              {formatValue(data.value)}
            </span>
          </p>
          {data.trades && (
            <p className="text-gray-400 text-sm">{data.trades} trades</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="horizontal"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis 
            type="number" 
            domain={[-maxValue * 1.1, maxValue * 1.1]}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickFormatter={formatValue}
          />
          <YAxis 
            type="category" 
            dataKey="name"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#E5E7EB' }}
            width={80}
          />
          {showTooltip && <Tooltip content={renderCustomTooltip} />}
          <Bar 
            dataKey="value" 
            radius={[0, 4, 4, 0]}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.value, index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HorizontalBarChart;