import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useDateFormat } from '../contexts/DateFormatContext';
// Navigation items matching your PyQt5 app
const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', active: true },
    { id: 'trades', label: 'All Trades', icon: '📈', active: false },
    { id: 'analytics', label: 'Analytics', icon: '📊', active: false },
    { id: 'calendar', label: 'Calendar', icon: '📅', active: false },
    { id: 'playbook', label: 'PlayBook', icon: '📚', active: false },
    { id: 'import', label: 'Import', icon: '📤', active: false },
    { id: 'settings', label: 'Settings', icon: '⚙️', active: false },
];
const AppShell = ({ children, title = "Trading Journal", subtitle = "Professional Trading Management System" }) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeNav, setActiveNav] = useState('dashboard');
    const { isUSFormat, toggleDateFormat } = useDateFormat();
    return (_jsxs("div", { className: "h-screen bg-gray-900 flex overflow-hidden", children: [_jsxs("div", { className: `
        bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
      `, children: [_jsxs("div", { className: "h-16 flex items-center justify-between px-4 border-b border-gray-700", children: [!sidebarCollapsed && (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center", children: _jsx("span", { className: "text-white font-bold text-sm", children: "TJ" }) }), _jsx("span", { className: "text-white font-semibold text-lg", children: "Trading Journal" })] })), _jsx("button", { onClick: () => setSidebarCollapsed(!sidebarCollapsed), className: "text-gray-400 hover:text-white p-1 rounded transition-colors", children: sidebarCollapsed ? '→' : '←' })] }), _jsx("nav", { className: "flex-1 px-2 py-4 space-y-1 overflow-y-auto", children: navigationItems.map((item) => (_jsxs("button", { onClick: () => setActiveNav(item.id), className: `
                w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200
                ${activeNav === item.id
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                ${sidebarCollapsed ? 'justify-center' : 'justify-start'}
              `, title: sidebarCollapsed ? item.label : '', children: [_jsx("span", { className: "text-lg", children: item.icon }), !sidebarCollapsed && (_jsx("span", { className: "ml-3", children: item.label }))] }, item.id))) }), _jsx("div", { className: "p-4 border-t border-gray-700", children: _jsxs("div", { className: `
            flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer
            ${sidebarCollapsed ? 'justify-center' : ''}
          `, children: [_jsx("div", { className: "w-8 h-8 bg-green-600 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-white text-sm font-semibold", children: "U" }) }), !sidebarCollapsed && (_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-white truncate", children: "Trader" }), _jsx("p", { className: "text-xs text-gray-400 truncate", children: "Active Session" })] }))] }) })] }), _jsxs("div", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsxs("header", { className: "h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("h1", { className: "text-xl font-bold text-white", children: title }), subtitle && (_jsx("span", { className: "text-gray-400 text-sm", children: subtitle }))] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "relative", children: [_jsx("input", { type: "text", placeholder: "Search trades...", className: "w-64 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" }), _jsx("div", { className: "absolute inset-y-0 right-0 flex items-center pr-3", children: _jsx("span", { className: "text-gray-400", children: "\uD83D\uDD0D" }) })] }), _jsxs("button", { onClick: toggleDateFormat, className: "flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors", title: `Current format: ${isUSFormat ? 'MM/DD/YYYY' : 'DD/MM/YYYY'}`, children: [_jsx("span", { className: "text-xs", children: "\uD83D\uDCC5" }), _jsx("span", { className: "ml-1", children: isUSFormat ? 'MM/DD/YYYY' : 'DD/MM/YYYY' })] }), _jsx("button", { className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors", children: "+ New Trade" }), _jsxs("button", { className: "relative p-2 text-gray-400 hover:text-white transition-colors", children: [_jsx("span", { className: "text-lg", children: "\uD83D\uDD14" }), _jsx("span", { className: "absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" })] }), _jsx("button", { className: "p-2 text-gray-400 hover:text-white transition-colors", children: _jsx("span", { className: "text-lg", children: "\u2699\uFE0F" }) })] })] }), _jsx("main", { className: "flex-1 overflow-auto bg-gray-900", children: _jsx("div", { className: "h-full", children: children }) }), _jsxs("footer", { className: "h-8 bg-gray-800 border-t border-gray-700 flex items-center justify-between px-6 text-xs text-gray-400", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("span", { children: "Connected to API" }), _jsx("span", { className: "w-2 h-2 bg-green-500 rounded-full" }), _jsx("span", { children: "Last updated: 2 minutes ago" })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("span", { children: "Database: SQLite" }), _jsx("span", { children: "|" }), _jsx("span", { children: "Records: 1,247" })] })] })] })] }));
};
export default AppShell;
