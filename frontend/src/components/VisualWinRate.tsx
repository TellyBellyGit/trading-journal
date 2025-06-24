// components/VisualWinRate.tsx
import React from 'react';

interface VisualWinRateProps {
  winRate: number; // 0-100
  size?: 'small' | 'medium' | 'large';
  showPercentage?: boolean;
  className?: string;
}

// Win Rate Doughnut - matching other doughnut components style
export const PieChartWinRate: React.FC<VisualWinRateProps> = ({
  winRate,
  size = 'medium',
  showPercentage = true,
  className = ''
}) => {
  const sizeConfig = {
    small: { radius: 25, strokeWidth: 8, fontSize: '10px' },
    medium: { radius: 35, strokeWidth: 10, fontSize: '12px' },
    large: { radius: 45, strokeWidth: 12, fontSize: '14px' }
  };

  const config = sizeConfig[size];
  const lossPercentage = 100 - winRate;
  
  const circumference = 2 * Math.PI * config.radius;
  const winOffset = circumference - (winRate / 100) * circumference;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        <svg
          width={(config.radius + config.strokeWidth) * 2}
          height={(config.radius + config.strokeWidth) * 2}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={config.radius + config.strokeWidth}
            cy={config.radius + config.strokeWidth}
            r={config.radius}
            fill="none"
            stroke="#374151"
            strokeWidth={config.strokeWidth}
          />
          
          {/* Win rate arc (green) */}
          <circle
            cx={config.radius + config.strokeWidth}
            cy={config.radius + config.strokeWidth}
            r={config.radius}
            fill="none"
            stroke="#10B981"
            strokeWidth={config.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={winOffset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
          
          {/* Loss rate arc (red) */}
          <circle
            cx={config.radius + config.strokeWidth}
            cy={config.radius + config.strokeWidth}
            r={config.radius}
            fill="none"
            stroke="#EF4444"
            strokeWidth={config.strokeWidth}
            strokeDasharray={`${(lossPercentage / 100) * circumference} ${circumference}`}
            strokeDashoffset={-((winRate / 100) * circumference)}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span 
            className="font-bold text-white"
            style={{ fontSize: config.fontSize }}
          >
            {winRate.toFixed(1)}%
          </span>
          <span className="text-xs text-gray-400">Win Rate</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-3 mt-2 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded"></div>
          <span className="text-gray-400">Wins</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded"></div>
          <span className="text-gray-400">Losses</span>
        </div>
      </div>
    </div>
  );
};

export default PieChartWinRate;