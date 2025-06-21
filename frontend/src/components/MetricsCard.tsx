import React from 'react';

export interface MetricsCardProps {
  title: string;
  value: string | number;
  icon?: string;
  color?: string;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  loading?: boolean;
}

const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  icon = "📊",
  color = "#3B82F6",
  subtitle,
  trend,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 animate-pulse" style={{borderLeftColor: color}}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      // Format large numbers with K, M notation
      if (Math.abs(val) >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (Math.abs(val) >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toFixed(2);
    }
    return val.toString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border-l-4" 
         style={{borderLeftColor: color}}>
      
      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            {title}
          </p>
        </div>
        <div 
          className="text-2xl p-2 rounded-full opacity-80"
          style={{ backgroundColor: `${color}20` }}
        >
          {icon}
        </div>
      </div>

      {/* Value Row */}
      <div className="mb-2">
        <p className="text-3xl font-bold text-gray-900 leading-tight">
          {formatValue(value)}
        </p>
      </div>

      {/* Subtitle and Trend Row */}
      <div className="flex items-center justify-between">
        {subtitle && (
          <p className="text-xs text-gray-500">
            {subtitle}
          </p>
        )}
        
        {trend && (
          <div className={`flex items-center text-xs font-medium ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <span className="mr-1">
              {trend.isPositive ? '↗️' : '↘️'}
            </span>
            <span>
              {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}%
            </span>
            <span className="text-gray-500 ml-1">
              {trend.label}
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar for Percentage Values */}
      {title.toLowerCase().includes('rate') && typeof value === 'string' && value.includes('%') && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min(parseFloat(value.replace('%', '')), 100)}%`,
                backgroundColor: color 
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsCard;