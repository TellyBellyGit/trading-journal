import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
const colorSchemes = {
    blue: {
        primary: 'text-blue-400',
        bg: 'bg-blue-600/10',
        border: 'border-blue-600/30',
        hover: 'hover:border-blue-500',
        ring: 'ring-blue-500/20',
        gradient: 'from-blue-600/20 to-blue-800/10'
    },
    green: {
        primary: 'text-green-400',
        bg: 'bg-green-600/10',
        border: 'border-green-600/30',
        hover: 'hover:border-green-500',
        ring: 'ring-green-500/20',
        gradient: 'from-green-600/20 to-green-800/10'
    },
    red: {
        primary: 'text-red-400',
        bg: 'bg-red-600/10',
        border: 'border-red-600/30',
        hover: 'hover:border-red-500',
        ring: 'ring-red-500/20',
        gradient: 'from-red-600/20 to-red-800/10'
    },
    purple: {
        primary: 'text-purple-400',
        bg: 'bg-purple-600/10',
        border: 'border-purple-600/30',
        hover: 'hover:border-purple-500',
        ring: 'ring-purple-500/20',
        gradient: 'from-purple-600/20 to-purple-800/10'
    },
    orange: {
        primary: 'text-orange-400',
        bg: 'bg-orange-600/10',
        border: 'border-orange-600/30',
        hover: 'hover:border-orange-500',
        ring: 'ring-orange-500/20',
        gradient: 'from-orange-600/20 to-orange-800/10'
    },
    yellow: {
        primary: 'text-yellow-400',
        bg: 'bg-yellow-600/10',
        border: 'border-yellow-600/30',
        hover: 'hover:border-yellow-500',
        ring: 'ring-yellow-500/20',
        gradient: 'from-yellow-600/20 to-yellow-800/10'
    }
};
const timePeriodLabels = {
    daily: 'Today',
    weekly: 'This Week',
    monthly: 'This Month',
    yearly: 'This Year'
};
const EnhancedMetricsCard = ({ title, icon, color, description, data, selectedPeriod, loading = false, showProgress = false, priority = 'medium' }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [displayValue, setDisplayValue] = useState(0);
    const colorScheme = colorSchemes[color];
    const currentData = data[selectedPeriod];
    // Animate value changes when period changes
    useEffect(() => {
        if (loading)
            return;
        setIsAnimating(true);
        const duration = 800; // Slightly faster animation
        const steps = 40;
        const stepValue = (currentData.current - displayValue) / steps;
        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            setDisplayValue(prev => prev + stepValue);
            if (currentStep >= steps) {
                setDisplayValue(currentData.current);
                setIsAnimating(false);
                clearInterval(interval);
            }
        }, duration / steps);
        return () => clearInterval(interval);
    }, [currentData.current, selectedPeriod, loading]); // Added selectedPeriod as dependency
    const formatValue = (value, unit) => {
        if (loading)
            return '---';
        switch (unit) {
            case 'currency':
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                }).format(Math.abs(value) >= 1000 ? value / 1000 : value) + (Math.abs(value) >= 1000 ? 'K' : '');
            case 'percentage':
                return `${value.toFixed(1)}%`;
            case 'number':
                if (Math.abs(value) >= 1000000) {
                    return `${(value / 1000000).toFixed(1)}M`;
                }
                else if (Math.abs(value) >= 1000) {
                    return `${(value / 1000).toFixed(1)}K`;
                }
                return value.toLocaleString();
            default:
                return value.toLocaleString();
        }
    };
    const getProgressPercentage = () => {
        if (!currentData.target || currentData.target === 0)
            return 0;
        return Math.min((currentData.current / currentData.target) * 100, 100);
    };
    if (loading) {
        return (_jsxs("div", { className: `
        bg-gray-800 border ${colorScheme.border} rounded-xl p-6 
        transition-all duration-300 animate-pulse
      `, children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "h-4 bg-gray-700 rounded w-24 mb-2" }), _jsx("div", { className: "h-8 bg-gray-700 rounded w-20" })] }), _jsx("div", { className: "w-12 h-12 bg-gray-700 rounded-full" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "h-3 bg-gray-700 rounded w-16" }), _jsx("div", { className: "h-2 bg-gray-700 rounded w-full" })] })] }));
    }
    return (_jsxs("div", { className: `
      group relative bg-gray-800 border ${colorScheme.border} rounded-xl p-6
      transition-all duration-300 ${colorScheme.hover}
      hover:shadow-2xl hover:shadow-${color}-500/10 hover:scale-[1.02]
      ${priority === 'high' ? 'ring-2 ' + colorScheme.ring : ''}
    `, children: [_jsx("div", { className: `
        absolute inset-0 bg-gradient-to-br ${colorScheme.gradient} 
        opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl
      ` }), priority === 'high' && (_jsx("div", { className: "absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" })), _jsxs("div", { className: "relative flex items-start justify-between mb-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-gray-400 text-sm font-medium uppercase tracking-wide", children: title }), description && (_jsx("p", { className: "text-gray-500 text-xs mt-1", children: description }))] }), _jsx("div", { className: `
          w-12 h-12 ${colorScheme.bg} rounded-xl flex items-center justify-center
          transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12
        `, children: _jsx("span", { className: "text-2xl", children: icon }) })] }), _jsxs("div", { className: "relative mb-4", children: [_jsx("div", { className: `
          text-4xl font-bold ${colorScheme.primary} transition-all duration-300
          ${isAnimating ? 'scale-110' : 'scale-100'}
        `, children: formatValue(displayValue, currentData.unit) }), _jsxs("div", { className: "flex items-center mt-2 space-x-2", children: [_jsxs("div", { className: `
            flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium
            ${currentData.trend.isPositive
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/20 text-red-400'}
          `, children: [_jsx("span", { className: "text-sm", children: currentData.trend.isPositive ? '↗️' : '↘️' }), _jsxs("span", { children: [currentData.trend.isPositive ? '+' : '', currentData.trend.percentage.toFixed(1), "%"] })] }), _jsxs("span", { className: "text-gray-500 text-xs", children: ["vs ", currentData.trend.label] })] })] }), showProgress && currentData.target && (_jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex justify-between text-xs text-gray-400 mb-2", children: [_jsx("span", { children: "Progress" }), _jsxs("span", { children: [getProgressPercentage().toFixed(0), "% of target"] })] }), _jsx("div", { className: "w-full bg-gray-700 rounded-full h-2", children: _jsx("div", { className: `h-2 bg-gradient-to-r ${colorScheme.gradient} rounded-full transition-all duration-1000`, style: { width: `${getProgressPercentage()}%` } }) })] })), _jsx("div", { className: "absolute inset-x-0 bottom-0 bg-gray-900/95 backdrop-blur-sm rounded-b-xl p-4 \r\n                      transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100\r\n                      transition-all duration-300 border-t border-gray-700", children: _jsxs("div", { className: "grid grid-cols-2 gap-4 text-xs", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Current" }), _jsx("div", { className: `font-semibold ${colorScheme.primary}`, children: formatValue(currentData.current, currentData.unit) })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Previous" }), _jsx("div", { className: "text-gray-300 font-semibold", children: formatValue(currentData.previous, currentData.unit) })] }), currentData.target && (_jsxs("div", { className: "col-span-2", children: [_jsx("span", { className: "text-gray-500", children: "Target" }), _jsx("div", { className: "text-gray-300 font-semibold", children: formatValue(currentData.target, currentData.unit) })] }))] }) })] }));
};
export default EnhancedMetricsCard;
