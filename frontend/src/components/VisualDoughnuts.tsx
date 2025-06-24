// components/VisualDoughnuts.tsx
import React from 'react';

interface DoughnutProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

interface ProfitFactorDoughnutProps extends DoughnutProps {
  grossProfit: number;
  grossLoss: number;
}

interface TradesDoughnutProps extends DoughnutProps {
  winningTrades: number;
  losingTrades: number;
}

interface PLDoughnutProps extends DoughnutProps {
  totalPL: number;
  totalCapital: number;
}

// Profit Factor Doughnut: Gross Profit vs Gross Loss
export const ProfitFactorDoughnut: React.FC<ProfitFactorDoughnutProps> = ({
  grossProfit,
  grossLoss,
  size = 'medium',
  className = ''
}) => {
  const sizeConfig = {
    small: { radius: 25, strokeWidth: 8, fontSize: '10px' },
    medium: { radius: 35, strokeWidth: 10, fontSize: '12px' },
    large: { radius: 45, strokeWidth: 12, fontSize: '14px' }
  };

  const config = sizeConfig[size];
  const total = grossProfit + Math.abs(grossLoss);
  const profitPercentage = total > 0 ? (grossProfit / total) * 100 : 0;
  const lossPercentage = 100 - profitPercentage;
  
  const circumference = 2 * Math.PI * config.radius;
  const profitOffset = circumference - (profitPercentage / 100) * circumference;
  const lossOffset = circumference - (lossPercentage / 100) * circumference;

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
          
          {/* Profit arc (green) */}
          <circle
            cx={config.radius + config.strokeWidth}
            cy={config.radius + config.strokeWidth}
            r={config.radius}
            fill="none"
            stroke="#10B981"
            strokeWidth={config.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={profitOffset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
          
          {/* Loss arc (red) - starts where profit ends */}
          <circle
            cx={config.radius + config.strokeWidth}
            cy={config.radius + config.strokeWidth}
            r={config.radius}
            fill="none"
            stroke="#EF4444"
            strokeWidth={config.strokeWidth}
            strokeDasharray={`${(lossPercentage / 100) * circumference} ${circumference}`}
            strokeDashoffset={-((profitPercentage / 100) * circumference)}
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
            {(grossProfit / Math.abs(grossLoss)).toFixed(2)}x
          </span>
          <span className="text-xs text-gray-400">Factor</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-3 mt-2 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded"></div>
          <span className="text-gray-400">Profit</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded"></div>
          <span className="text-gray-400">Loss</span>
        </div>
      </div>
    </div>
  );
};

// Total Trades Doughnut: Winning vs Losing Trades
export const TradesDoughnut: React.FC<TradesDoughnutProps> = ({
  winningTrades,
  losingTrades,
  size = 'medium',
  className = ''
}) => {
  const sizeConfig = {
    small: { radius: 25, strokeWidth: 8, fontSize: '10px' },
    medium: { radius: 35, strokeWidth: 10, fontSize: '12px' },
    large: { radius: 45, strokeWidth: 12, fontSize: '14px' }
  };

  const config = sizeConfig[size];
  const totalTrades = winningTrades + losingTrades;
  const winPercentage = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const lossPercentage = 100 - winPercentage;
  
  const circumference = 2 * Math.PI * config.radius;
  const winOffset = circumference - (winPercentage / 100) * circumference;

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
          
          {/* Winning trades arc (green) */}
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
          
          {/* Losing trades arc (red) */}
          <circle
            cx={config.radius + config.strokeWidth}
            cy={config.radius + config.strokeWidth}
            r={config.radius}
            fill="none"
            stroke="#EF4444"
            strokeWidth={config.strokeWidth}
            strokeDasharray={`${(lossPercentage / 100) * circumference} ${circumference}`}
            strokeDashoffset={-((winPercentage / 100) * circumference)}
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
            {totalTrades}
          </span>
          <span className="text-xs text-gray-400">Trades</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-3 mt-2 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded"></div>
          <span className="text-gray-400">Wins ({winningTrades})</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded"></div>
          <span className="text-gray-400">Losses ({losingTrades})</span>
        </div>
      </div>
    </div>
  );
};

// P&L Doughnut: Profit vs Capital at Risk
export const PLDoughnut: React.FC<PLDoughnutProps> = ({
  totalPL,
  totalCapital,
  size = 'medium',
  className = ''
}) => {
  const sizeConfig = {
    small: { radius: 25, strokeWidth: 8, fontSize: '10px' },
    medium: { radius: 35, strokeWidth: 10, fontSize: '12px' },
    large: { radius: 45, strokeWidth: 12, fontSize: '14px' }
  };

  const config = sizeConfig[size];
  const isProfit = totalPL >= 0;
  const absProfit = Math.abs(totalPL);
  const maxValue = Math.max(absProfit, totalCapital * 0.1); // Show relative to 10% of capital
  const plPercentage = Math.min((absProfit / maxValue) * 100, 100);
  
  const circumference = 2 * Math.PI * config.radius;
  const plOffset = circumference - (plPercentage / 100) * circumference;

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
          
          {/* P&L arc */}
          <circle
            cx={config.radius + config.strokeWidth}
            cy={config.radius + config.strokeWidth}
            r={config.radius}
            fill="none"
            stroke={isProfit ? "#10B981" : "#EF4444"}
            strokeWidth={config.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={plOffset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span 
            className={`font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}
            style={{ fontSize: config.fontSize }}
          >
            {isProfit ? '+' : ''}{totalPL.toFixed(2)}
          </span>
          <span className="text-xs text-gray-400">P&L</span>
        </div>
      </div>
      
      <div className="flex items-center justify-center mt-2 text-xs">
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded ${isProfit ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-gray-400">{isProfit ? 'Profit' : 'Loss'}</span>
        </div>
      </div>
    </div>
  );
};

export default {
  ProfitFactorDoughnut,
  TradesDoughnut,
  PLDoughnut
};