import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface SparklineData {
  value: number;
  date?: string;
}

interface SparklineChartProps {
  data: SparklineData[];
  color?: string;
  height?: number;
  showPoints?: boolean;
  animate?: boolean;
  strokeWidth?: number;
}

const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  color = '#3B82F6',
  height = 40,
  showPoints = false,
  animate = true,
  strokeWidth = 2
}) => {
  const isPositiveTrend = data.length > 1 && data[data.length - 1].value > data[0].value;
  const actualColor = color === 'auto' ? (isPositiveTrend ? '#10B981' : '#EF4444') : color;

  const minValue = Math.min(...data.map(d => d.value));
  const maxValue = Math.max(...data.map(d => d.value));
  const range = maxValue - minValue;
  const padding = range * 0.1; // 10% padding

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <YAxis 
            domain={[minValue - padding, maxValue + padding]} 
            hide 
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={actualColor}
            strokeWidth={strokeWidth}
            dot={showPoints ? { r: 2, fill: actualColor } : false}
            activeDot={showPoints ? { r: 3, fill: actualColor } : false}
            animationDuration={animate ? 800 : 0}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SparklineChart;