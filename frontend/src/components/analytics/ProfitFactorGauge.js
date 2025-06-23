import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const ProfitFactorGauge = ({ profitFactor, className = '' }) => {
    // Clamp profit factor to max of 5 for display purposes
    const displayValue = Math.min(profitFactor, 5);
    // Calculate the rotation angle for the needle (0-180 degrees)
    const needleAngle = (displayValue / 5) * 180;
    // Get interpretation text
    const getInterpretation = (value) => {
        if (value < 1.0)
            return "Unprofitable Trading";
        if (value < 1.5)
            return "Break Even to Good";
        if (value < 2.0)
            return "Good Trading";
        if (value < 3.0)
            return "Very Good Trading";
        return "Excellent Trading";
    };
    // Get color based on profit factor
    const getColor = (value) => {
        if (value < 1.0)
            return "#FF0000"; // Red
        if (value < 1.5)
            return "#9ACD32"; // Chartreuse
        if (value < 2.0)
            return "#00FF00"; // Green
        if (value < 3.0)
            return "#006400"; // Dark green
        return "#004C00"; // Darker green
    };
    // SVG gauge component
    const GaugeSVG = () => {
        const centerX = 100;
        const centerY = 100;
        const radius = 80;
        const strokeWidth = 12;
        // Create arc segments with different colors
        const createArcPath = (startAngle, endAngle) => {
            const start = (startAngle * Math.PI) / 180;
            const end = (endAngle * Math.PI) / 180;
            const x1 = centerX + radius * Math.cos(Math.PI - start);
            const y1 = centerY + radius * Math.sin(Math.PI - start);
            const x2 = centerX + radius * Math.cos(Math.PI - end);
            const y2 = centerY + radius * Math.sin(Math.PI - end);
            const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
            return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
        };
        // Background arc
        const backgroundPath = createArcPath(0, 180);
        // Color segments (fixed to match interpretation thresholds)
        const segments = [
            { start: 0, end: 36, color: '#FF0000' }, // 0-1.0: Red
            { start: 36, end: 54, color: '#9ACD32' }, // 1.0-1.5: Chartreuse
            { start: 54, end: 72, color: '#00FF00' }, // 1.5-2.0: Green
            { start: 72, end: 108, color: '#006400' }, // 2.0-3.0: Dark green
            { start: 108, end: 180, color: '#004C00' } // 3.0-5.0: Darker green
        ];
        // Needle calculation (fixed coordinate system)
        const needleRadians = (180 - needleAngle) * Math.PI / 180;
        const needleLength = radius - 10;
        const needleX = centerX + needleLength * Math.cos(needleRadians);
        const needleY = centerY - needleLength * Math.sin(needleRadians);
        const needleEndX = centerX + (radius - 20) * Math.cos(needleRadians);
        const needleEndY = centerY - (radius - 20) * Math.sin(needleRadians);
        return (_jsxs("svg", { width: "200", height: "120", viewBox: "0 0 200 120", className: "mx-auto", children: [_jsx("path", { d: backgroundPath, fill: "none", stroke: "#4C566A", strokeWidth: strokeWidth, strokeLinecap: "round" }), segments.map((segment, index) => (_jsx("path", { d: createArcPath(segment.start, segment.end), fill: "none", stroke: segment.color, strokeWidth: strokeWidth, strokeLinecap: "round" }, index))), _jsx("line", { x1: centerX, y1: centerY, x2: needleEndX, y2: needleEndY, stroke: "#ECEFF4", strokeWidth: "3", strokeLinecap: "round" }), _jsx("circle", { cx: centerX, cy: centerY, r: "8", fill: "#D8DEE9" }), [0, 1, 2, 3, 4, 5].map((value) => {
                    const angle = (value / 5) * 180;
                    const markerRadians = (180 - angle) * Math.PI / 180;
                    const innerRadius = radius - 15;
                    const outerRadius = radius - 5;
                    const x1 = centerX + innerRadius * Math.cos(markerRadians);
                    const y1 = centerY - innerRadius * Math.sin(markerRadians);
                    const x2 = centerX + outerRadius * Math.cos(markerRadians);
                    const y2 = centerY - outerRadius * Math.sin(markerRadians);
                    return (_jsxs("g", { children: [_jsx("line", { x1: x1, y1: y1, x2: x2, y2: y2, stroke: "#ECEFF4", strokeWidth: "2" }), _jsx("text", { x: centerX + (radius + 15) * Math.cos(markerRadians), y: centerY - (radius + 15) * Math.sin(markerRadians) + 4, fill: "#ECEFF4", fontSize: "12", textAnchor: "middle", fontFamily: "system-ui, -apple-system, sans-serif", children: value })] }, value));
                })] }));
    };
    return (_jsx("div", { className: `bg-gray-800 border border-gray-700 rounded-lg p-6 ${className}`, children: _jsxs("div", { className: "text-center", children: [_jsx("h3", { className: "text-lg font-semibold text-blue-400 mb-6", children: "Profit Factor" }), _jsx("div", { className: "mb-4", children: _jsx(GaugeSVG, {}) }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-white", children: profitFactor >= 5.0 ? '>5.00x' : `${profitFactor.toFixed(2)}x` }), _jsx("p", { className: "text-sm text-gray-400", children: "Profit Factor" })] }), _jsx("div", { className: "bg-gray-700 rounded-lg p-3", children: _jsx("p", { className: `text-sm font-medium`, style: { color: getColor(profitFactor) }, children: getInterpretation(profitFactor) }) })] }), _jsxs("div", { className: "mt-4 text-xs text-gray-400 space-y-1", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { children: "Unprofitable" }), _jsx("span", { className: "w-3 h-3 rounded", style: { backgroundColor: '#FF0000' } })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { children: "Break Even" }), _jsx("span", { className: "w-3 h-3 rounded", style: { backgroundColor: '#9ACD32' } })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { children: "Good" }), _jsx("span", { className: "w-3 h-3 rounded", style: { backgroundColor: '#00FF00' } })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { children: "Very Good" }), _jsx("span", { className: "w-3 h-3 rounded", style: { backgroundColor: '#006400' } })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { children: "Excellent" }), _jsx("span", { className: "w-3 h-3 rounded", style: { backgroundColor: '#004C00' } })] })] }), _jsxs("div", { className: "mt-4 pt-4 border-t border-gray-600", children: [_jsx("p", { className: "text-xs text-gray-400", children: "Profit Factor = Gross Profits \u00F7 Gross Losses" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Values above 1.0 indicate profitable trading" })] })] }) }));
};
export default ProfitFactorGauge;
