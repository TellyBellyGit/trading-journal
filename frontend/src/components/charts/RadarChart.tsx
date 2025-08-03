import React from 'react';
import { Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface RadarMetric {
  metric: string;
  value: number;
  max: number;
  fullMark?: number;
}

interface RadarChartProps {
  metrics: RadarMetric[];
  size?: number;
  color?: string;
  fillOpacity?: number;
}

const RadarChart: React.FC<RadarChartProps> = ({
  metrics,
  size = 300,
  color = '#3B82F6',
  fillOpacity = 0.2
}) => {
  const processedData = metrics.map(metric => ({
    metric: metric.metric,
    value: metric.value,
    normalizedValue: (metric.value / metric.max) * 100,
    fullMark: 100
  }));

  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">{label}</p>
          <p className="text-gray-300 text-sm">
            Value: {data.value} / {metrics.find(m => m.metric === label)?.max}
          </p>
          <p className="text-gray-400 text-xs">
            Performance: {data.normalizedValue.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <ResponsiveContainer width={size} height={size}>
        <RechartsRadarChart data={processedData}>
          <PolarGrid 
            stroke="#E5E7EB" 
            gridType="polygon"
          />
          <PolarAngleAxis 
            dataKey="metric" 
            tick={{ fontSize: 12, fill: '#6B7280' }}
            className="text-sm"
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            tickCount={6}
          />
          <Radar
            name="Performance"
            dataKey="normalizedValue"
            stroke={color}
            fill={color}
            fillOpacity={fillOpacity}
            strokeWidth={2}
            animationDuration={1000}
            animationEasing="ease-out"
          />
          <Tooltip content={renderCustomTooltip} />
        </RechartsRadarChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-medium text-gray-900 text-center">Performance Metrics</h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          {metrics.map((metric, index) => (
            <div key={index} className="flex justify-between">
              <span>{metric.metric}:</span>
              <span className="font-medium">{metric.value}/{metric.max}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RadarChart;