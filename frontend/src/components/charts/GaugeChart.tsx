import React from 'react';

interface GaugeChartProps {
  value: number;
  min: number;
  max: number;
  target?: number;
  label: string;
  color?: 'green' | 'orange' | 'red' | 'blue';
  size?: number;
}

const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  min,
  max,
  target,
  label,
  color = 'blue',
  size = 160
}) => {
  const normalizedValue = Math.max(min, Math.min(max, value));
  const percentage = (normalizedValue - min) / (max - min);
  const targetPercentage = target ? (target - min) / (max - min) : null;
  
  const colorMap = {
    green: '#10B981',
    orange: '#F59E0B',
    red: '#EF4444',
    blue: '#3B82F6'
  };

  const getColor = () => {
    if (color === 'green') return '#10B981';
    if (color === 'orange') return '#F59E0B';
    if (color === 'red') return '#EF4444';
    return '#3B82F6';
  };

  const strokeWidth = 8;
  const radius = (size / 2) - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference * 0.75; // 270 degrees
  const strokeDashoffset = strokeDasharray * (1 - percentage);

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size * 0.75 }}>
        <svg
          width={size}
          height={size * 0.75}
          className="transform -rotate-45"
          style={{ overflow: 'visible' }}
        >
          {/* Background Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={0}
            strokeLinecap="round"
          />
          
          {/* Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.4))'
            }}
          />
          
          {/* Target Indicator */}
          {target && targetPercentage && (
            <circle
              cx={size / 2 + radius * Math.cos(-Math.PI / 4 + (targetPercentage * 1.5 * Math.PI))}
              cy={size / 2 + radius * Math.sin(-Math.PI / 4 + (targetPercentage * 1.5 * Math.PI))}
              r={4}
              fill="#F59E0B"
              className="animate-pulse"
            />
          )}
        </svg>
        
        {/* Center Value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {value.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600 text-center">
            {label}
          </div>
        </div>
      </div>
      
      {/* Scale Labels */}
      <div className="flex justify-between w-full mt-2 text-xs text-gray-500">
        <span>{min}</span>
        {target && <span className="text-yellow-600 font-medium">Target: {target}</span>}
        <span>{max}</span>
      </div>
    </div>
  );
};

export default GaugeChart;