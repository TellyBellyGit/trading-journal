import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
const PLChart = ({ data, totalPL }) => {
    // Prepare data for the chart
    const chartData = data.map(point => ({
        ...point,
        formattedDate: new Date(point.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        })
    }));
    // Custom tooltip component
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const value = payload[0].value;
            const date = new Date(payload[0].payload.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            return (_jsxs("div", { className: "bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg", children: [_jsx("p", { className: "text-gray-300 text-sm mb-1", children: date }), _jsxs("p", { className: `font-semibold ${value >= 0 ? 'text-green-400' : 'text-red-400'}`, children: ["Cumulative P&L: ", new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 2
                            }).format(value)] })] }));
        }
        return null;
    };
    // Custom dot component for line chart
    const CustomDot = (props) => {
        const { cx, cy, payload } = props;
        const value = payload.cumulativePL;
        return (_jsx("circle", { cx: cx, cy: cy, r: 4, fill: value >= 0 ? '#A3BE8C' : '#BF616A', stroke: "#2E3440", strokeWidth: 2, className: "drop-shadow-sm" }));
    };
    // Determine if we should show area chart (based on final P&L)
    const showAreaChart = true; // Always show area for better visual impact
    const finalPL = chartData[chartData.length - 1]?.cumulativePL || 0;
    return (_jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-6", children: [_jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-2", children: "Cumulative P&L Over Time" }), _jsx("p", { className: "text-gray-400 text-sm", children: "Track your trading performance progression" })] }), _jsxs("div", { className: "flex items-center space-x-4 mt-4 lg:mt-0", children: [_jsxs("div", { className: "bg-gray-700 rounded-lg px-4 py-2", children: [_jsx("p", { className: "text-gray-400 text-xs", children: "Current Total" }), _jsx("p", { className: `text-lg font-bold ${totalPL >= 0 ? 'text-green-400' : 'text-red-400'}`, children: new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: 'USD',
                                            minimumFractionDigits: 2
                                        }).format(totalPL) })] }), _jsxs("div", { className: "bg-gray-700 rounded-lg px-4 py-2", children: [_jsx("p", { className: "text-gray-400 text-xs", children: "Trend" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: `text-lg ${finalPL >= 0 ? 'text-green-400' : 'text-red-400'}`, children: finalPL >= 0 ? '↗️' : '↘️' }), _jsx("span", { className: `text-sm font-medium ${finalPL >= 0 ? 'text-green-400' : 'text-red-400'}`, children: finalPL >= 0 ? 'Profitable' : 'Loss' })] })] })] })] }), _jsx("div", { className: "h-80", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: showAreaChart ? (_jsxs(AreaChart, { data: chartData, margin: { top: 10, right: 30, left: 0, bottom: 0 }, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "colorPL", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: finalPL >= 0 ? "#A3BE8C" : "#BF616A", stopOpacity: 0.3 }), _jsx("stop", { offset: "95%", stopColor: finalPL >= 0 ? "#A3BE8C" : "#BF616A", stopOpacity: 0.1 })] }) }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#4C566A" }), _jsx(XAxis, { dataKey: "formattedDate", tick: { fontSize: 12, fill: '#E5E9F0' }, axisLine: { stroke: '#4C566A' } }), _jsx(YAxis, { tick: { fontSize: 12, fill: '#E5E9F0' }, axisLine: { stroke: '#4C566A' }, tickFormatter: (value) => new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                }).format(value) }), _jsx(Tooltip, { content: _jsx(CustomTooltip, {}) }), _jsx(ReferenceLine, { y: 0, stroke: "#D8DEE9", strokeDasharray: "2 2" }), _jsx(Area, { type: "monotone", dataKey: "cumulativePL", stroke: finalPL >= 0 ? "#A3BE8C" : "#BF616A", strokeWidth: 3, fillOpacity: 1, fill: "url(#colorPL)", dot: _jsx(CustomDot, {}) })] })) : (_jsxs(LineChart, { data: chartData, margin: { top: 10, right: 30, left: 0, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#4C566A" }), _jsx(XAxis, { dataKey: "formattedDate", tick: { fontSize: 12, fill: '#E5E9F0' }, axisLine: { stroke: '#4C566A' } }), _jsx(YAxis, { tick: { fontSize: 12, fill: '#E5E9F0' }, axisLine: { stroke: '#4C566A' }, tickFormatter: (value) => new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                }).format(value) }), _jsx(Tooltip, { content: _jsx(CustomTooltip, {}) }), _jsx(ReferenceLine, { y: 0, stroke: "#D8DEE9", strokeDasharray: "2 2" }), _jsx(Line, { type: "monotone", dataKey: "cumulativePL", stroke: finalPL >= 0 ? "#A3BE8C" : "#BF616A", strokeWidth: 3, dot: _jsx(CustomDot, {}), activeDot: { r: 6, fill: finalPL >= 0 ? "#A3BE8C" : "#BF616A" } })] })) }) }), _jsx("div", { className: "mt-4 pt-4 border-t border-gray-600", children: _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [_jsxs("div", { className: "flex items-center space-x-4 text-sm text-gray-400", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-3 h-3 bg-gray-300 rounded-sm" }), _jsx("span", { children: "Zero Line" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: `w-3 h-3 rounded-sm ${finalPL >= 0 ? 'bg-green-400' : 'bg-red-400'}` }), _jsx("span", { children: "Cumulative P&L" })] })] }), _jsxs("div", { className: "text-xs text-gray-500", children: ["Data points: ", chartData.length, " \u2022 Range: ", chartData[0]?.formattedDate, " to ", chartData[chartData.length - 1]?.formattedDate] })] }) })] }));
};
export default PLChart;
