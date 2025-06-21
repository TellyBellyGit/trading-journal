// components/analytics/PLChart.tsx
import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine
} from 'recharts';

interface PLChartProps {
  data: Array<{
    date: string;
    cumulativePL: number;
  }>;
  totalPL: number;
}

interface ChartDataPoint {
  date: string;
  cumulativePL: number;
  formattedDate: string;
}

const PLChart: React.FC<PLChartProps> = ({ data, totalPL }) => {
  // Prepare data for the chart
  const chartData: ChartDataPoint[] = data.map(point => ({
    ...point,
    formattedDate: new Date(point.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const date = new Date(payload[0].payload.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm mb-1">{date}</p>
          <p className={`font-semibold ${value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            Cumulative P&L: {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2
            }).format(value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom dot component for line chart
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const value = payload.cumulativePL;
    
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={value >= 0 ? '#A3BE8C' : '#BF616A'}
        stroke="#2E3440"
        strokeWidth={2}
        className="drop-shadow-sm"
      />
    );
  };

  // Determine if we should show area chart (based on final P&L)
  const showAreaChart = true; // Always show area for better visual impact
  const finalPL = chartData[chartData.length - 1]?.cumulativePL || 0;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Cumulative P&L Over Time</h3>
          <p className="text-gray-400 text-sm">
            Track your trading performance progression
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <div className="bg-gray-700 rounded-lg px-4 py-2">
            <p className="text-gray-400 text-xs">Current Total</p>
            <p className={`text-lg font-bold ${totalPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2
              }).format(totalPL)}
            </p>
          </div>
          
          <div className="bg-gray-700 rounded-lg px-4 py-2">
            <p className="text-gray-400 text-xs">Trend</p>
            <div className="flex items-center space-x-2">
              <span className={`text-lg ${finalPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {finalPL >= 0 ? '↗️' : '↘️'}
              </span>
              <span className={`text-sm font-medium ${finalPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {finalPL >= 0 ? 'Profitable' : 'Loss'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {showAreaChart ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPL" x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset="5%" 
                    stopColor={finalPL >= 0 ? "#A3BE8C" : "#BF616A"} 
                    stopOpacity={0.3}
                  />
                  <stop 
                    offset="95%" 
                    stopColor={finalPL >= 0 ? "#A3BE8C" : "#BF616A"} 
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#4C566A" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12, fill: '#E5E9F0' }}
                axisLine={{ stroke: '#4C566A' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#E5E9F0' }}
                axisLine={{ stroke: '#4C566A' }}
                tickFormatter={(value) => 
                  new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(value)
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#D8DEE9" strokeDasharray="2 2" />
              <Area
                type="monotone"
                dataKey="cumulativePL"
                stroke={finalPL >= 0 ? "#A3BE8C" : "#BF616A"}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPL)"
                dot={<CustomDot />}
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4C566A" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12, fill: '#E5E9F0' }}
                axisLine={{ stroke: '#4C566A' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#E5E9F0' }}
                axisLine={{ stroke: '#4C566A' }}
                tickFormatter={(value) => 
                  new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(value)
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#D8DEE9" strokeDasharray="2 2" />
              <Line
                type="monotone"
                dataKey="cumulativePL"
                stroke={finalPL >= 0 ? "#A3BE8C" : "#BF616A"}
                strokeWidth={3}
                dot={<CustomDot />}
                activeDot={{ r: 6, fill: finalPL >= 0 ? "#A3BE8C" : "#BF616A" }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Chart Legend and Info */}
      <div className="mt-4 pt-4 border-t border-gray-600">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-300 rounded-sm"></div>
              <span>Zero Line</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-sm ${finalPL >= 0 ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span>Cumulative P&L</span>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            Data points: {chartData.length} • 
            Range: {chartData[0]?.formattedDate} to {chartData[chartData.length - 1]?.formattedDate}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PLChart;