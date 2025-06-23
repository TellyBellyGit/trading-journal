import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const TradingAssessment = ({ assessment, profitFactor, className = '' }) => {
    // Get assessment level based on content
    const getAssessmentLevel = (text) => {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('excellent') || lowerText.includes('strong edge')) {
            return 'excellent';
        }
        if (lowerText.includes('good') || lowerText.includes('solid')) {
            return 'good';
        }
        if (lowerText.includes('critical') || lowerText.includes('back to school')) {
            return 'critical';
        }
        return 'warning';
    };
    // Get icon based on assessment level
    const getAssessmentIcon = (level) => {
        switch (level) {
            case 'excellent': return '🎯';
            case 'good': return '👍';
            case 'warning': return '⚠️';
            case 'critical': return '🚨';
            default: return '📊';
        }
    };
    // Get color classes based on assessment level
    const getColorClasses = (level) => {
        switch (level) {
            case 'excellent':
                return {
                    border: 'border-green-500',
                    title: 'text-green-400',
                    text: 'text-green-100',
                    bg: 'bg-green-900/20'
                };
            case 'good':
                return {
                    border: 'border-blue-500',
                    title: 'text-blue-400',
                    text: 'text-blue-100',
                    bg: 'bg-blue-900/20'
                };
            case 'warning':
                return {
                    border: 'border-orange-500',
                    title: 'text-orange-400',
                    text: 'text-orange-100',
                    bg: 'bg-orange-900/20'
                };
            case 'critical':
                return {
                    border: 'border-red-500',
                    title: 'text-red-400',
                    text: 'text-red-100',
                    bg: 'bg-red-900/20'
                };
            default:
                return {
                    border: 'border-gray-500',
                    title: 'text-gray-400',
                    text: 'text-gray-100',
                    bg: 'bg-gray-900/20'
                };
        }
    };
    const assessmentLevel = getAssessmentLevel(assessment);
    const colors = getColorClasses(assessmentLevel);
    const icon = getAssessmentIcon(assessmentLevel);
    // Split assessment into sentences for better formatting
    const sentences = assessment.split('. ').filter(sentence => sentence.trim());
    return (_jsx("div", { className: `bg-gray-800 border border-gray-700 rounded-lg p-6 ${className}`, children: _jsxs("div", { className: "h-full flex flex-col", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-8", children: [_jsx("span", { className: "text-2xl", children: icon }), _jsx("h3", { className: "text-lg font-semibold text-orange-400", children: "Trading Assessment" })] }), _jsx("div", { className: `flex-1 ${colors.bg} ${colors.border} border rounded-lg p-4`, children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("span", { className: `inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colors.title} bg-gray-700`, children: [assessmentLevel.charAt(0).toUpperCase() + assessmentLevel.slice(1), " Performance"] }), _jsxs("span", { className: "text-sm text-gray-400", children: ["PF: ", profitFactor >= 5 ? '>5.00x' : `${profitFactor.toFixed(2)}x`] })] }), _jsx("div", { className: "space-y-2", children: sentences.map((sentence, index) => (_jsxs("p", { className: `text-sm leading-relaxed ${colors.text}`, children: [sentence.trim(), index < sentences.length - 1 ? '.' : ''] }, index))) })] }) }), _jsx("div", { className: "mt-8 pt-7 border-t border-gray-600", children: _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "bg-gray-700 rounded p-6 text-center", children: [_jsx("p", { className: "text-xs text-gray-400", children: "Performance" }), _jsx("p", { className: `text-sm font-semibold ${colors.title}`, children: assessmentLevel.charAt(0).toUpperCase() + assessmentLevel.slice(1) })] }), _jsxs("div", { className: "bg-gray-700 rounded p-6 text-center", children: [_jsx("p", { className: "text-xs text-gray-400", children: "Profit Factor" }), _jsx("p", { className: `text-sm font-semibold ${profitFactor >= 2.0 ? 'text-green-400' :
                                            profitFactor >= 1.0 ? 'text-orange-400' :
                                                'text-red-400'}`, children: profitFactor >= 5 ? '>5.00x' : `${profitFactor.toFixed(2)}x` })] })] }) }), _jsx("div", { className: "mt-8", children: _jsxs("div", { className: "bg-gray-700 rounded-lg p-6", children: [_jsx("p", { className: "text-xs text-gray-400 mb-2", children: "Recommendation:" }), _jsxs("p", { className: "text-xs text-gray-300", children: [assessmentLevel === 'excellent' && 'Maintain your strategy and position sizing. Consider scaling up gradually.', assessmentLevel === 'good' && 'Focus on letting winners run longer to improve profit factor.', assessmentLevel === 'warning' && 'Review your risk management and trade selection criteria.', assessmentLevel === 'critical' && 'Stop trading immediately. Review and revise your strategy completely.'] })] }) })] }) }));
};
export default TradingAssessment;
