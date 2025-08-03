import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DonutChartData {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  centerText?: string;
  centerSubtext?: string;
  showLabels?: boolean;
  size?: number;
  innerRadius?: number;
  outerRadius?: number;
}

const DonutChart: React.FC<DonutChartProps> = ({
  data,
  centerText,
  centerSubtext,
  showLabels = true,
  size = 200,
  innerRadius = 60,
  outerRadius = 90
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const renderCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">{data.name}</p>
          <p className="text-gray-300 text-sm">
            {data.value} ({((data.value / total) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLabel = (entry: any) => {
    if (!showLabels) return null;
    const percent = ((entry.value / total) * 100).toFixed(0);
    return `${percent}%`;
  };

  return (
    <div className="relative">
      <ResponsiveContainer width={size} height={size}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={renderCustomTooltip} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center Text */}
      {centerText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{centerText}</div>
            {centerSubtext && (
              <div className="text-sm text-gray-600 mt-1">{centerSubtext}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DonutChart;