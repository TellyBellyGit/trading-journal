import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import api from '../api/trades';
import { Formatters } from '../utils/formatters';
const TradingCalendar = ({ onDateClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarData, setCalendarData] = useState({});
    const [weeklyTotals, setWeeklyTotals] = useState({});
    const [loading, setLoading] = useState(true);
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Extract current year and month for consistent calculations throughout component
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    useEffect(() => {
        loadCalendarData();
    }, [currentDate]);
    const loadCalendarData = async () => {
        setLoading(true);
        try {
            // Get first and last day of month
            const firstDay = new Date(currentYear, currentMonth, 1);
            const lastDay = new Date(currentYear, currentMonth + 1, 0);
            // Fetch all trades for the month
            const trades = await api.trades.getAllLegacy();
            // Filter trades for current month
            const monthTrades = trades.filter(trade => {
                const tradeDate = new Date(trade.entryDate);
                return tradeDate >= firstDay && tradeDate <= lastDay;
            });
            // Group trades by date
            const dailyData = {};
            const weeklyData = {};
            monthTrades.forEach(trade => {
                const dateKey = new Date(trade.entryDate).toISOString().split('T')[0];
                if (!dailyData[dateKey]) {
                    dailyData[dateKey] = {
                        trades: 0,
                        pnl: 0,
                        wins: 0,
                        losses: 0,
                        winRate: 0,
                        totalWinAmount: 0,
                        totalLossAmount: 0,
                        riskReward: 0,
                        capitalDeployed: 0
                    };
                }
                dailyData[dateKey].trades++;
                dailyData[dateKey].pnl += trade.pnl || 0;
                dailyData[dateKey].capitalDeployed += trade.capital || 0;
                if ((trade.pnl || 0) > 0) {
                    dailyData[dateKey].wins++;
                    dailyData[dateKey].totalWinAmount += trade.pnl || 0;
                }
                else if ((trade.pnl || 0) < 0) {
                    dailyData[dateKey].losses++;
                    dailyData[dateKey].totalLossAmount += Math.abs(trade.pnl || 0);
                }
            });
            // Calculate win rates and risk/reward ratios
            Object.keys(dailyData).forEach(dateKey => {
                const data = dailyData[dateKey];
                data.winRate = data.trades > 0 ? (data.wins / data.trades) * 100 : 0;
                // Calculate risk/reward ratio (average win / average loss)
                const avgWin = data.wins > 0 ? data.totalWinAmount / data.wins : 0;
                const avgLoss = data.losses > 0 ? data.totalLossAmount / data.losses : 0;
                data.riskReward = avgLoss > 0 ? avgWin / avgLoss : 0;
            });
            // Calculate weekly totals
            Object.keys(dailyData).forEach(dateKey => {
                const date = new Date(dateKey);
                const day = date.getDate();
                const weekNumber = getWeekNumber(day);
                if (!weeklyData[weekNumber]) {
                    weeklyData[weekNumber] = {
                        trades: 0,
                        pnl: 0,
                        wins: 0,
                        losses: 0,
                        winRate: 0,
                        totalWinAmount: 0,
                        totalLossAmount: 0,
                        riskReward: 0,
                        capitalDeployed: 0
                    };
                }
                const data = dailyData[dateKey];
                weeklyData[weekNumber].trades += data.trades;
                weeklyData[weekNumber].pnl += data.pnl;
                weeklyData[weekNumber].wins += data.wins;
                weeklyData[weekNumber].losses += data.losses;
                weeklyData[weekNumber].totalWinAmount += data.totalWinAmount;
                weeklyData[weekNumber].totalLossAmount += data.totalLossAmount;
                weeklyData[weekNumber].capitalDeployed += data.capitalDeployed;
            });
            // Calculate weekly win rates and risk/reward ratios
            Object.keys(weeklyData).forEach(weekKey => {
                const week = weeklyData[parseInt(weekKey)];
                week.winRate = week.trades > 0 ? (week.wins / week.trades) * 100 : 0;
                // Calculate weekly risk/reward ratio
                const avgWin = week.wins > 0 ? week.totalWinAmount / week.wins : 0;
                const avgLoss = week.losses > 0 ? week.totalLossAmount / week.losses : 0;
                week.riskReward = avgLoss > 0 ? avgWin / avgLoss : 0;
            });
            setCalendarData(dailyData);
            setWeeklyTotals(weeklyData);
        }
        catch (error) {
            console.error('Error loading calendar data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const getWeekNumber = (day) => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const firstDayOfWeek = (firstDay.getDay() + 6) % 7; // Convert to Monday = 0
        return Math.floor((day + firstDayOfWeek - 1) / 7);
    };
    const getDaysInMonth = () => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const firstDayOfWeek = (firstDay.getDay() + 6) % 7; // Convert to Monday = 0
        const days = [];
        // Add empty cells for days before month starts
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null);
        }
        // Add all days of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            days.push(day);
        }
        return days;
    };
    const formatDateKey = (day) => {
        // Use local date formatting to avoid timezone issues
        const date = new Date(currentYear, currentMonth, day);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const dayStr = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${dayStr}`;
    };
    const handleDateDoubleClick = async (day) => {
        if (!onDateClick)
            return;
        const dateKey = formatDateKey(day);
        console.log(`Clicked day ${day}, formatted as: ${dateKey}`);
        try {
            const trades = await api.trades.getAllLegacy();
            const dayTrades = trades.filter(trade => {
                // Use consistent date formatting for comparison
                const tradeDate = new Date(trade.entryDate);
                const tradeDateKey = `${tradeDate.getFullYear()}-${String(tradeDate.getMonth() + 1).padStart(2, '0')}-${String(tradeDate.getDate()).padStart(2, '0')}`;
                console.log(`Comparing trade date ${tradeDateKey} with clicked date ${dateKey}`);
                return tradeDateKey === dateKey;
            });
            console.log(`Found ${dayTrades.length} trades for ${dateKey}`);
            onDateClick(dateKey, dayTrades);
        }
        catch (error) {
            console.error('Error fetching trades for date:', error);
        }
    };
    const goToPreviousMonth = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1);
            console.log('Going to previous month:', newDate.toISOString().split('T')[0]);
            return newDate;
        });
    };
    const goToNextMonth = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1);
            console.log('Going to next month:', newDate.toISOString().split('T')[0]);
            return newDate;
        });
    };
    const isToday = (day) => {
        const today = new Date();
        return (today.getDate() === day &&
            today.getMonth() === currentMonth &&
            today.getFullYear() === currentYear);
    };
    const isSaturday = (day) => {
        const date = new Date(currentYear, currentMonth, day);
        return date.getDay() === 6; // Saturday = 6
    };
    const getGridPosition = (day) => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const firstDayOfWeek = (firstDay.getDay() + 6) % 7; // Convert to Monday = 0
        return (day + firstDayOfWeek - 1) % 7;
    };
    const days = getDaysInMonth();
    console.log('Rendering calendar for:', currentYear, currentMonth, currentDate.toISOString());
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6 border-b border-gray-700 pb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: "Trading Calendar" }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("button", { onClick: goToPreviousMonth, className: "p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white", disabled: loading, children: _jsx("span", { className: "text-lg", children: "\u25C0" }) }), _jsxs("h4", { className: "text-xl font-bold text-white min-w-[180px] text-center", children: [monthNames[currentMonth], " ", currentYear] }), _jsx("button", { onClick: goToNextMonth, className: "p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white", disabled: loading, children: _jsx("span", { className: "text-lg", children: "\u25B6" }) })] })] }), _jsx("div", { className: "grid grid-cols-7 gap-1 mb-2", children: dayNames.map(day => (_jsx("div", { className: "p-2 text-center text-sm font-semibold text-blue-400 bg-gray-700 rounded", children: day }, day))) }), _jsx("div", { className: "grid grid-cols-7 gap-1", children: days.map((day, index) => {
                    if (!day) {
                        return _jsx("div", { className: "h-24" }, index);
                    }
                    const dateKey = formatDateKey(day);
                    const dayData = calendarData[dateKey];
                    const weekNumber = getWeekNumber(day);
                    const weekData = weeklyTotals[weekNumber];
                    // Use extracted year and month for consistent calculations
                    const actualDate = new Date(currentYear, currentMonth, day);
                    const dayOfWeek = (actualDate.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0 format
                    // Debug: Show if this is actually a Saturday AND if we have weekly data
                    const isSaturday = dayOfWeek === 5;
                    const hasWeeklyData = weekData && weekData.trades > 0;
                    const isWeeklyCell = isSaturday && hasWeeklyData;
                    // Debug only for problem days
                    if (isSaturday || hasWeeklyData) {
                        console.log(`Day ${day}: dayOfWeek=${dayOfWeek}, isSaturday=${isSaturday}, hasWeeklyData=${hasWeeklyData}, isWeeklyCell=${isWeeklyCell}`);
                    }
                    return (_jsx("div", { className: `
                h-24 p-1 border rounded cursor-pointer transition-all hover:shadow-md
                ${isToday(day) ? 'border-blue-500 bg-blue-900/30' : 'border-gray-600 bg-gray-700/50 hover:bg-gray-600/50'}
              `, onDoubleClick: () => handleDateDoubleClick(day), children: _jsxs("div", { className: "h-full flex flex-col text-xs", children: [_jsxs("div", { className: `font-semibold mb-1 ${isToday(day) ? 'text-blue-400' : 'text-white'}`, children: [day, isWeeklyCell && _jsx("span", { className: "ml-1 text-orange-400", children: "W" })] }), loading ? (_jsxs("div", { className: "animate-pulse", children: [_jsx("div", { className: "h-2 bg-gray-200 rounded mb-1" }), _jsx("div", { className: "h-2 bg-gray-200 rounded w-3/4" })] })) : isWeeklyCell && weekData ? (
                                // Weekly totals display
                                _jsxs("div", { className: "flex-1 grid grid-cols-2 gap-1 text-orange-400", children: [_jsxs("div", { children: [_jsx("div", { className: "font-semibold text-[10px] mb-1", children: "WEEK TOTAL" }), _jsx("div", { className: `font-bold text-[10px] ${weekData.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`, children: Formatters.compactCurrency(weekData.pnl) }), _jsxs("div", { className: "text-[9px] text-gray-300", children: [weekData.trades, "T | ", weekData.winRate.toFixed(0), "%"] })] }), _jsxs("div", { children: [_jsxs("div", { className: "text-[8px] text-blue-400 cursor-help relative group", children: [_jsxs("span", { children: ["Payoff Ratio: ", weekData.riskReward > 0 ? weekData.riskReward.toFixed(1) : '-'] }), _jsxs("div", { className: "absolute bottom-full left-0 mb-1 hidden group-hover:block z-50 w-48 p-2 bg-gray-900 border border-gray-600 rounded-lg shadow-lg text-white text-xs", children: [_jsx("div", { className: "font-semibold mb-1", children: "Weekly Payoff Ratio" }), _jsx("div", { children: "Average Win \u00F7 Average Loss" }), _jsx("div", { className: "text-gray-400 mt-1", children: "Shows weekly trading efficiency. Higher is better." })] })] }), _jsxs("div", { className: "text-[8px] text-purple-400", children: ["Cap. Deployed: ", Formatters.compactCurrency(weekData.capitalDeployed)] })] })] })) : dayData ? (
                                // Daily data display
                                _jsxs("div", { className: "flex-1 grid grid-cols-2 gap-1", children: [_jsxs("div", { children: [_jsx("div", { className: `font-bold text-[10px] mb-1 ${dayData.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`, children: Formatters.compactCurrency(dayData.pnl) }), _jsxs("div", { className: "text-[9px] text-gray-300", children: [dayData.trades, " trades"] }), _jsxs("div", { className: "text-[9px] text-gray-300", children: [_jsxs("span", { className: "text-green-400", children: [dayData.wins, "W"] }), " | ", _jsxs("span", { className: "text-red-400", children: [dayData.losses, "L"] })] }), _jsxs("div", { className: "text-[9px] font-semibold text-orange-400", children: [dayData.winRate.toFixed(0), "%"] })] }), _jsxs("div", { children: [_jsxs("div", { className: "text-[8px] text-blue-400 cursor-help relative group", children: [_jsxs("span", { children: ["Payoff Ratio: ", dayData.riskReward > 0 ? dayData.riskReward.toFixed(1) : '-'] }), _jsxs("div", { className: "absolute bottom-full left-0 mb-1 hidden group-hover:block z-50 w-48 p-2 bg-gray-900 border border-gray-600 rounded-lg shadow-lg text-white text-xs", children: [_jsx("div", { className: "font-semibold mb-1", children: "Payoff Ratio" }), _jsx("div", { children: "Average Win \u00F7 Average Loss" }), _jsx("div", { className: "text-gray-400 mt-1", children: "Shows how much you typically make versus lose per trade. Higher is better." })] })] }), _jsxs("div", { className: "text-[8px] text-purple-400", children: ["Cap. Deployed: ", Formatters.compactCurrency(dayData.capitalDeployed)] })] })] })) : null] }) }, `${currentYear}-${currentMonth}-${day}`));
                }) }), _jsx("div", { className: "mt-4 text-xs text-gray-400 text-center", children: "Double-click on any day to view detailed trades" })] }));
};
export default TradingCalendar;
