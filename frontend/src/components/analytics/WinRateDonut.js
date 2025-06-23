import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const WinRateDonut = ({ winRate, winCount, lossCount, className = '' }) => {
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
        return (_jsxs("div", { className: "relative", children: [_jsxs("svg", { width: size, height: size, className: "transform -rotate-90", children: [_jsx("circle", { cx: center, cy: center, r: radius, fill: "none", stroke: "#4C566A", strokeWidth: strokeWidth }), _jsx("circle", { cx: center, cy: center, r: radius, fill: "none", stroke: "#BF616A", strokeWidth: strokeWidth, strokeDasharray: lossStrokeDasharray, strokeDashoffset: 0, strokeLinecap: "round", style: {
                                transform: `rotate(${rotation + (winRate / 100) * 360}deg)`,
                                transformOrigin: `${center}px ${center}px`
                            } }), _jsx("circle", { cx: center, cy: center, r: radius, fill: "none", stroke: "#A3BE8C", strokeWidth: strokeWidth, strokeDasharray: winStrokeDasharray, strokeDashoffset: 0, strokeLinecap: "round", style: {
                                transform: `rotate(${rotation}deg)`,
                                transformOrigin: `${center}px ${center}px`
                            } })] }), _jsx("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsxs("p", { className: "text-2xl font-bold text-white", children: [winRate.toFixed(1), "%"] }), _jsx("p", { className: "text-sm text-gray-400", children: "Win Rate" })] }) })] }));
    };
    return (_jsx("div", { className: `bg-gray-800 border border-gray-700 rounded-lg p-6 ${className}`, children: _jsxs("div", { className: "text-center", children: [_jsx("h3", { className: "text-lg font-semibold text-green-400 mb-6", children: "Win/Loss Distribution" }), _jsx("div", { className: "flex justify-center mb-14", children: _jsx(DonutSVG, {}) }), _jsxs("div", { className: "space-y-9", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-gray-700 rounded-lg p-3", children: [_jsxs("div", { className: "flex items-center justify-center space-x-2 mb-2", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-green-400" }), _jsx("span", { className: "text-sm text-gray-300", children: "Wins" })] }), _jsx("p", { className: "text-xl font-bold text-green-400", children: winCount }), _jsxs("p", { className: "text-xs text-gray-400", children: [winRate.toFixed(1), "%"] })] }), _jsxs("div", { className: "bg-gray-700 rounded-lg p-3", children: [_jsxs("div", { className: "flex items-center justify-center space-x-2 mb-2", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-red-400" }), _jsx("span", { className: "text-sm text-gray-300", children: "Losses" })] }), _jsx("p", { className: "text-xl font-bold text-red-400", children: lossCount }), _jsxs("p", { className: "text-xs text-gray-400", children: [lossRate.toFixed(1), "%"] })] })] }), _jsxs("div", { className: "bg-gray-700 rounded-lg p-3", children: [_jsx("p", { className: "text-sm text-gray-300 mb-1", children: "Total Trades" }), _jsx("p", { className: "text-xl font-bold text-white", children: totalTrades })] })] })] }) }));
};
export default WinRateDonut;
