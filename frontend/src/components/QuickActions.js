import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const QuickActions = ({ onNewTrade, onAnalytics, onImport, onPlayBook, onCalendar, onExport, customActions = [], layout = 'grid' }) => {
    const getColorClasses = (color, isHovered = false) => {
        const colorMap = {
            primary: {
                bg: 'bg-blue-600 hover:bg-blue-700',
                text: 'text-white',
                ring: 'focus:ring-blue-500',
                light: 'bg-blue-50 hover:bg-blue-100 text-blue-700'
            },
            secondary: {
                bg: 'bg-gray-600 hover:bg-gray-700',
                text: 'text-white',
                ring: 'focus:ring-gray-500',
                light: 'bg-gray-50 hover:bg-gray-100 text-gray-700'
            },
            success: {
                bg: 'bg-green-600 hover:bg-green-700',
                text: 'text-white',
                ring: 'focus:ring-green-500',
                light: 'bg-green-50 hover:bg-green-100 text-green-700'
            },
            warning: {
                bg: 'bg-orange-600 hover:bg-orange-700',
                text: 'text-white',
                ring: 'focus:ring-orange-500',
                light: 'bg-orange-50 hover:bg-orange-100 text-orange-700'
            },
            info: {
                bg: 'bg-purple-600 hover:bg-purple-700',
                text: 'text-white',
                ring: 'focus:ring-purple-500',
                light: 'bg-purple-50 hover:bg-purple-100 text-purple-700'
            }
        };
        return colorMap[color];
    };
    // Default actions
    const defaultActions = [
        {
            id: 'new-trade',
            label: 'New Trade',
            icon: '📝',
            description: 'Record a new trade',
            color: 'primary',
            onClick: onNewTrade
        },
        ...(onAnalytics ? [{
                id: 'analytics',
                label: 'Analytics',
                icon: '📊',
                description: 'View performance metrics',
                color: 'info',
                onClick: onAnalytics
            }] : []),
        ...(onImport ? [{
                id: 'import',
                label: 'Import',
                icon: '📤',
                description: 'Import trade data',
                color: 'secondary',
                onClick: onImport
            }] : []),
        ...(onPlayBook ? [{
                id: 'playbook',
                label: 'PlayBook',
                icon: '📚',
                description: 'Trading strategies',
                color: 'warning',
                onClick: onPlayBook
            }] : []),
        ...(onCalendar ? [{
                id: 'calendar',
                label: 'Calendar',
                icon: '📅',
                description: 'Trade calendar view',
                color: 'success',
                onClick: onCalendar
            }] : []),
        ...(onExport ? [{
                id: 'export',
                label: 'Export',
                icon: '💾',
                description: 'Export trade data',
                color: 'secondary',
                onClick: onExport
            }] : [])
    ];
    const allActions = [...defaultActions, ...customActions];
    const ActionButton = ({ action, isPrimary = false }) => {
        const colors = getColorClasses(action.color);
        const isNewTrade = action.id === 'new-trade';
        return (_jsxs("button", { onClick: action.onClick, disabled: action.disabled, className: `
          relative group w-full p-4 rounded-lg font-medium transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.ring}
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isNewTrade || isPrimary
                ? `${colors.bg} ${colors.text} shadow-md hover:shadow-lg transform hover:-translate-y-0.5`
                : `${colors.light} border border-gray-200 hover:border-gray-300 hover:shadow-md`}
        `, children: [action.badge && (_jsx("span", { className: "absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center", children: action.badge })), _jsxs("div", { className: "flex flex-col items-center space-y-2", children: [_jsx("div", { className: `text-2xl ${isNewTrade || isPrimary ? 'transform group-hover:scale-110' : ''} transition-transform duration-200`, children: action.icon }), _jsx("div", { className: "text-sm font-semibold", children: action.label }), action.description && (_jsx("div", { className: `text-xs opacity-75 text-center ${layout === 'list' ? 'block' : 'hidden group-hover:block'}`, children: action.description }))] }), _jsx("div", { className: "absolute inset-0 rounded-lg opacity-0 group-active:opacity-20 bg-white transition-opacity duration-150" })] }));
    };
    if (layout === 'list') {
        return (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Quick Actions" }), _jsx("div", { className: "space-y-3", children: allActions.map((action) => (_jsx(ActionButton, { action: action }, action.id))) })] }));
    }
    // Grid layout
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Quick Actions" }), _jsx("p", { className: "text-sm text-gray-500", children: "Common trading tasks" })] }), _jsx("div", { className: "text-2xl", children: "\u26A1" })] }), _jsx("div", { className: "grid grid-cols-2 gap-4", children: allActions.map((action) => (_jsx(ActionButton, { action: action }, action.id))) }), _jsx("div", { className: "mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200", children: _jsxs("div", { className: "flex items-start space-x-2", children: [_jsx("div", { className: "text-blue-500 text-sm", children: "\uD83D\uDCA1" }), _jsxs("div", { className: "text-xs text-blue-700", children: [_jsx("span", { className: "font-medium", children: "Pro tip:" }), " Use keyboard shortcuts for faster navigation"] })] }) })] }));
};
export default QuickActions;
