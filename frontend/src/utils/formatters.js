/**
 * Comprehensive formatting utilities for the Trading Journal Dashboard
 * Provides consistent formatting for currency, percentages, dates, and more
 */
// ============================================================================
// CURRENCY FORMATTING
// ============================================================================
export const formatCurrency = (value, options = {}) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '-';
    }
    const { currency = 'USD', minimumFractionDigits = 2, maximumFractionDigits = 2, showSign = false, compact = false } = options;
    // For compact notation (K, M, B)
    if (compact) {
        const absValue = Math.abs(value);
        if (absValue >= 1e9) {
            return `${showSign && value >= 0 ? '+' : ''}$${(value / 1e9).toFixed(1)}B`;
        }
        else if (absValue >= 1e6) {
            return `${showSign && value >= 0 ? '+' : ''}$${(value / 1e6).toFixed(1)}M`;
        }
        else if (absValue >= 1e3) {
            return `${showSign && value >= 0 ? '+' : ''}$${(value / 1e3).toFixed(1)}K`;
        }
    }
    const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits,
        maximumFractionDigits,
    }).format(Math.abs(value));
    if (showSign && value >= 0) {
        return `+${formatted}`;
    }
    else if (value < 0) {
        return `-${formatted}`;
    }
    return formatted;
};
// Specialized currency formatters
export const formatPnL = (value) => {
    return formatCurrency(value, { showSign: true });
};
export const formatCompactCurrency = (value) => {
    return formatCurrency(value, { compact: true });
};
// ============================================================================
// PERCENTAGE FORMATTING
// ============================================================================
export const formatPercentage = (value, options = {}) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '-';
    }
    const { minimumFractionDigits = 1, maximumFractionDigits = 2, showSign = false, multiplier = 1 } = options;
    const adjustedValue = value * multiplier;
    const formatted = new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits,
        maximumFractionDigits,
    }).format(adjustedValue / 100);
    if (showSign && adjustedValue >= 0) {
        return `+${formatted}`;
    }
    return formatted;
};
// Specialized percentage formatters
export const formatWinRate = (value) => {
    return formatPercentage(value, { minimumFractionDigits: 0, maximumFractionDigits: 1 });
};
export const formatPnLPercentage = (value) => {
    return formatPercentage(value, { showSign: true, maximumFractionDigits: 2 });
};
// ============================================================================
// NUMBER FORMATTING
// ============================================================================
export const formatNumber = (value, options = {}) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '-';
    }
    const { minimumFractionDigits = 0, maximumFractionDigits = 2, compact = false, notation = 'standard' } = options;
    if (compact) {
        const absValue = Math.abs(value);
        if (absValue >= 1e9) {
            return `${(value / 1e9).toFixed(1)}B`;
        }
        else if (absValue >= 1e6) {
            return `${(value / 1e6).toFixed(1)}M`;
        }
        else if (absValue >= 1e3) {
            return `${(value / 1e3).toFixed(1)}K`;
        }
    }
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits,
        maximumFractionDigits,
        notation: notation,
    }).format(value);
};
export const formatVolume = (value) => {
    return formatNumber(value, { compact: true, maximumFractionDigits: 1 });
};
export const formatQuantity = (value) => {
    return formatNumber(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};
// ============================================================================
// DATE & TIME FORMATTING
// ============================================================================
export const formatDate = (date, options = {}) => {
    if (!date)
        return '-';
    const { format = 'medium', includeTime = false, timeZone = 'America/New_York', // Default to EST for trading
    dateFormat = 'US' } = options;
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
        return '-';
    }
    // Relative formatting
    if (format === 'relative') {
        return formatRelativeDate(dateObj);
    }
    const baseOptions = {
        timeZone,
        ...(includeTime && {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
    };
    // Use appropriate locale based on date format
    const locale = dateFormat === 'US' ? 'en-US' : 'en-GB';
    switch (format) {
        case 'short':
            return new Intl.DateTimeFormat(locale, {
                ...baseOptions,
                month: 'short',
                day: 'numeric',
            }).format(dateObj);
        case 'long':
            return new Intl.DateTimeFormat(locale, {
                ...baseOptions,
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }).format(dateObj);
        case 'medium':
        default:
            return new Intl.DateTimeFormat(locale, {
                ...baseOptions,
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            }).format(dateObj);
    }
};
// Simple date formatter that uses global date format preference
export const formatSimpleDate = (date, dateFormat = 'US') => {
    if (!date)
        return '-';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
        return '-';
    }
    if (dateFormat === 'US') {
        return dateObj.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
    }
    else {
        return dateObj.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
};
export const formatRelativeDate = (date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1)
        return 'Just now';
    if (diffMinutes < 60)
        return `${diffMinutes}m ago`;
    if (diffHours < 24)
        return `${diffHours}h ago`;
    if (diffDays === 1)
        return 'Yesterday';
    if (diffDays < 7)
        return `${diffDays}d ago`;
    if (diffDays < 30)
        return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365)
        return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
};
export const formatTradeDate = (date) => {
    return formatDate(date, { format: 'relative' });
};
export const formatTradingTime = (date) => {
    return formatDate(date, { format: 'short', includeTime: true });
};
// ============================================================================
// DURATION FORMATTING
// ============================================================================
export const formatDuration = (minutes, options = {}) => {
    if (minutes === null || minutes === undefined || isNaN(minutes)) {
        return '-';
    }
    const { format = 'short', precision = 'rounded' } = options;
    const totalMinutes = Math.abs(minutes);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const mins = Math.floor(totalMinutes % 60);
    if (format === 'long') {
        const parts = [];
        if (days > 0)
            parts.push(`${days} day${days !== 1 ? 's' : ''}`);
        if (hours > 0)
            parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
        if (mins > 0 || parts.length === 0)
            parts.push(`${mins} minute${mins !== 1 ? 's' : ''}`);
        return parts.slice(0, 2).join(', ');
    }
    // Short format
    if (days > 0) {
        return precision === 'exact' ? `${days}d ${hours}h` : `${days}d`;
    }
    else if (hours > 0) {
        return precision === 'exact' ? `${hours}h ${mins}m` : `${hours}h`;
    }
    else {
        return `${mins}m`;
    }
};
// ============================================================================
// TRADING-SPECIFIC FORMATTERS
// ============================================================================
export const formatSymbol = (symbol) => {
    if (!symbol)
        return '-';
    return symbol.toUpperCase().trim();
};
export const formatDirection = (direction) => {
    if (!direction) {
        return { label: '-', color: 'text-gray-500', icon: '' };
    }
    const dir = direction.toLowerCase();
    if (dir === 'long' || dir === 'buy') {
        return { label: 'Long', color: 'text-green-600', icon: '↗️' };
    }
    else if (dir === 'short' || dir === 'sell') {
        return { label: 'Short', color: 'text-red-600', icon: '↘️' };
    }
    return { label: direction, color: 'text-gray-600', icon: '' };
};
export const formatProfitLoss = (value) => {
    if (value === null || value === undefined) {
        return {
            formatted: '-',
            color: 'text-gray-500',
            bgColor: 'bg-gray-100',
            textColor: 'text-gray-700'
        };
    }
    const formatted = formatCurrency(value, { showSign: true });
    if (value > 0) {
        return {
            formatted,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
            textColor: 'text-green-700'
        };
    }
    else if (value < 0) {
        return {
            formatted,
            color: 'text-red-600',
            bgColor: 'bg-red-100',
            textColor: 'text-red-700'
        };
    }
    else {
        return {
            formatted,
            color: 'text-gray-600',
            bgColor: 'bg-gray-100',
            textColor: 'text-gray-700'
        };
    }
};
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
export const getChangeColor = (value) => {
    if (value === null || value === undefined || value === 0) {
        return 'text-gray-500';
    }
    return value > 0 ? 'text-green-600' : 'text-red-600';
};
export const getChangeBgColor = (value) => {
    if (value === null || value === undefined || value === 0) {
        return 'bg-gray-100';
    }
    return value > 0 ? 'bg-green-100' : 'bg-red-100';
};
export const formatMetricValue = (value, type) => {
    switch (type) {
        case 'currency':
            return formatCurrency(Number(value));
        case 'percentage':
            return formatPercentage(Number(value));
        case 'number':
            return formatNumber(Number(value));
        case 'duration':
            return formatDuration(Number(value));
        default:
            return String(value || '-');
    }
};
// Export all formatters as a single object for easy importing
export const Formatters = {
    currency: formatCurrency,
    pnl: formatPnL,
    compactCurrency: formatCompactCurrency,
    percentage: formatPercentage,
    winRate: formatWinRate,
    pnlPercentage: formatPnLPercentage,
    number: formatNumber,
    volume: formatVolume,
    quantity: formatQuantity,
    date: formatDate,
    simpleDate: formatSimpleDate,
    relativeDate: formatRelativeDate,
    tradeDate: formatTradeDate,
    tradingTime: formatTradingTime,
    duration: formatDuration,
    symbol: formatSymbol,
    direction: formatDirection,
    profitLoss: formatProfitLoss,
    metricValue: formatMetricValue,
};
