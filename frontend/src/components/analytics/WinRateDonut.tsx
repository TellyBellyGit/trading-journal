// components/analytics/WinRateDonut.tsx
import React from 'react';

interface WinRateDonutProps {
  winRate: number;
  winCount: number;
  lossCount: number;
  className?: string;
}

const WinRateDonut: React.FC<WinRateDonutProps> = ({ 
  winRate, 
  winCount, 
  lossCount,
  className = '' 
}) => {
  const lossRate = 100 - winRate;
  const totalTrades = winCount + lossCount;

  // SVG donut chart
  const DonutSVG = () => {
    const size = 160;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const center = size / 2;

    // Calculate stroke dash array for win percentage
    const winStrokeDasharray = `${(winRate / 100) * circumference} ${circumference}`;
    const lossStrokeDasharray = `${(lossRate / 100) * circumference} ${circumference}`;
    
    // Calculate rotation to start from top
    const rotation = -90;

    return (
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#4C566A"
            strokeWidth={strokeWidth}
          />
          
          {/* Loss arc (shown first, starts from top) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#BF616A"
            strokeWidth={strokeWidth}
            strokeDasharray={lossStrokeDasharray}
            strokeDashoffset={0}
            strokeLinecap="round"
            style={{
              transform: `rotate(${rotation + (winRate / 100) * 360}deg)`,
              transformOrigin: `${center}px ${center}px`
            }}
          />
          
          {/* Win arc (shown second, starts from top) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#A3BE8C"
            strokeWidth={strokeWidth}
            strokeDasharray={winStrokeDasharray}
            strokeDashoffset={0}
            strokeLinecap="round"
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: `${center}px ${center}px`
            }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {winRate.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-400">Win Rate</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-6 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-green-400 mb-6">Win/Loss Distribution</h3>
        
        {/* Donut Chart */}
        <div className="flex justify-center mb-14">
          <DonutSVG />
        </div>
        
        {/* Stats */}
        <div className="space-y-9">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-sm text-gray-300">Wins</span>
              </div>
              <p className="text-xl font-bold text-green-400">{winCount}</p>
              <p className="text-xs text-gray-400">{winRate.toFixed(1)}%</p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <span className="text-sm text-gray-300">Losses</span>
              </div>
              <p className="text-xl font-bold text-red-400">{lossCount}</p>
              <p className="text-xs text-gray-400">{lossRate.toFixed(1)}%</p>
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-3">
            <p className="text-sm text-gray-300 mb-1">Total Trades</p>
            <p className="text-xl font-bold text-white">{totalTrades}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WinRateDonut;