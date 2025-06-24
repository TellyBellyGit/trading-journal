import React from 'react';

interface RiskData {
  count: number;
  pnl: number;
}

interface RiskHeatmapProps {
  data: Record<string, RiskData>;
  colorScheme?: 'risk' | 'profit';
}

const RiskHeatmap: React.FC<RiskHeatmapProps> = ({
  data,
  colorScheme = 'risk'
}) => {
  const entries = Object.entries(data);
  const maxCount = Math.max(...entries.map(([_, value]) => value.count));
  const maxPnL = Math.max(...entries.map(([_, value]) => Math.abs(value.pnl)));

  const getIntensity = (count: number, pnl: number) => {
    const countIntensity = count / maxCount;
    const pnlIntensity = Math.abs(pnl) / maxPnL;
    return Math.max(countIntensity, pnlIntensity);
  };

  const getColorClass = (intensity: number, pnl: number) => {
    if (colorScheme === 'profit') {
      if (pnl >= 0) {
        return `bg-green-${Math.round(intensity * 5 + 1) * 100} text-white`;
      } else {
        return `bg-red-${Math.round(intensity * 5 + 1) * 100} text-white`;
      }
    } else {
      // Risk color scheme: red (high risk) to green (low risk)
      const colorScale = [
        'bg-green-100 text-green-800',
        'bg-green-200 text-green-800',
        'bg-yellow-100 text-yellow-800',
        'bg-yellow-200 text-yellow-800',
        'bg-orange-200 text-orange-800',
        'bg-red-200 text-red-800',
        'bg-red-300 text-red-900'
      ];
      return colorScale[Math.round(intensity * (colorScale.length - 1))];
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
      
      <div className="space-y-3">
        {entries.map(([riskLevel, riskData]) => {
          const intensity = getIntensity(riskData.count, riskData.pnl);
          const colorClass = getColorClass(intensity, riskData.pnl);
          
          return (
            <div
              key={riskLevel}
              className={`p-4 rounded-lg transition-all duration-300 hover:scale-105 cursor-pointer ${colorClass}`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-lg">{riskLevel}</div>
                  <div className="text-sm opacity-80">
                    {riskData.count} trades
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xl">
                    {riskData.pnl >= 0 ? '+' : ''}
                    ${riskData.pnl.toLocaleString()}
                  </div>
                  <div className="text-sm opacity-80">
                    ${(riskData.pnl / riskData.count).toFixed(0)} avg
                  </div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-3 w-full bg-black bg-opacity-10 rounded-full h-2">
                <div 
                  className="bg-black bg-opacity-30 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(riskData.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-600">
          <span>Color intensity shows relative volume and P&L impact</span>
          <span>Hover for details</span>
        </div>
      </div>
    </div>
  );
};

export default RiskHeatmap;