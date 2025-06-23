import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const TimePeriodSelector = ({ selectedPeriod, selectedDate, onPeriodChange, }) => {
    // Helper function to get current date strings
    const getCurrentDateInfo = () => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const previousYear = currentYear - 1;
        return {
            today: today.toISOString().split('T')[0],
            currentYear,
            previousYear,
            // First day of current year for YTD
            ytdStart: `${currentYear}-01-01`,
            // Last day of previous year
            previousYearEnd: `${previousYear}-12-31`,
        };
    };
    const dateInfo = getCurrentDateInfo();
    // Helper function to get the display label for the selected period
    const getPeriodLabel = () => {
        const date = new Date(selectedDate);
        switch (selectedPeriod) {
            case 'daily':
                return date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            case 'weekly':
                // Calculate week start (Monday) and end (Sunday)
                const startOfWeek = new Date(date);
                startOfWeek.setDate(date.getDate() - date.getDay() + 1);
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            case 'monthly':
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'
                });
            case 'ytd':
                return `Year to Date ${dateInfo.currentYear}`;
            case 'previous-year':
                return `Full Year ${dateInfo.previousYear}`;
            default:
                return '';
        }
    };
    // Navigation helpers
    const navigatePeriod = (direction) => {
        const currentDate = new Date(selectedDate);
        let newDate;
        switch (selectedPeriod) {
            case 'daily':
                newDate = new Date(currentDate);
                newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
                break;
            case 'weekly':
                newDate = new Date(currentDate);
                newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
                break;
            case 'monthly':
                newDate = new Date(currentDate);
                newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
                break;
            case 'ytd':
                // YTD navigation changes the year
                newDate = new Date(currentDate);
                newDate.setFullYear(currentDate.getFullYear() + (direction === 'next' ? 1 : -1));
                break;
            case 'previous-year':
                // Previous year navigation
                newDate = new Date(currentDate);
                newDate.setFullYear(currentDate.getFullYear() + (direction === 'next' ? 1 : -1));
                break;
            default:
                return;
        }
        onPeriodChange(selectedPeriod, newDate.toISOString().split('T')[0]);
    };
    // Check if navigation should be disabled
    const canNavigateNext = () => {
        if (selectedPeriod === 'ytd') {
            return new Date(selectedDate).getFullYear() < dateInfo.currentYear;
        }
        if (selectedPeriod === 'previous-year') {
            return new Date(selectedDate).getFullYear() < dateInfo.currentYear - 1;
        }
        // For daily, weekly, monthly - allow navigation to future (in case of planned trades)
        return true;
    };
    const periods = [
        { key: 'daily', label: 'Daily', icon: '📅' },
        { key: 'weekly', label: 'Weekly', icon: '📊' },
        { key: 'monthly', label: 'Monthly', icon: '📈' },
        { key: 'ytd', label: 'YTD', icon: '🗓️' },
        { key: 'previous-year', label: 'Prev Year', icon: '📋' },
    ];
    return (_jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-6", children: [_jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4", children: [_jsx("div", { className: "flex flex-wrap gap-2", children: periods.map((period) => (_jsxs("button", { onClick: () => onPeriodChange(period.key, selectedDate), className: `
                px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2
                ${selectedPeriod === period.key
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'}
              `, children: [_jsx("span", { children: period.icon }), _jsx("span", { children: period.label })] }, period.key))) }), _jsxs("div", { className: "flex items-center space-x-4", children: [(selectedPeriod === 'daily' || selectedPeriod === 'weekly' || selectedPeriod === 'monthly' || selectedPeriod === 'ytd' || selectedPeriod === 'previous-year') && (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { onClick: () => navigatePeriod('prev'), className: "p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors", title: "Previous period", children: "\u2190" }), _jsx("div", { className: "min-w-[200px] text-center", children: _jsx("p", { className: "text-white font-medium text-sm", children: getPeriodLabel() }) }), _jsx("button", { onClick: () => navigatePeriod('next'), disabled: !canNavigateNext(), className: `
                  p-2 rounded-lg transition-colors
                  ${canNavigateNext()
                                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
                `, title: "Next period", children: "\u2192" })] })), (selectedPeriod === 'daily' || selectedPeriod === 'weekly' || selectedPeriod === 'monthly') && (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("label", { className: "text-gray-400 text-sm", children: "Jump to:" }), _jsx("input", { type: "date", value: selectedDate, onChange: (e) => onPeriodChange(selectedPeriod, e.target.value), className: "px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500" })] }))] })] }), _jsx("div", { className: "mt-4 pt-4 border-t border-gray-700", children: _jsxs("p", { className: "text-gray-400 text-sm", children: [selectedPeriod === 'daily' && 'Showing trades for the selected day', selectedPeriod === 'weekly' && 'Showing trades for the week containing the selected date (Monday to Sunday)', selectedPeriod === 'monthly' && 'Showing trades for the selected month', selectedPeriod === 'ytd' && `Showing trades from January 1st through today for ${new Date(selectedDate).getFullYear()}`, selectedPeriod === 'previous-year' && `Showing trades for the complete year ${new Date(selectedDate).getFullYear()}`] }) })] }));
};
export default TimePeriodSelector;
