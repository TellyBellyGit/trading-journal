import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import api from '../api/trades';
const EditTrade = ({ tradeId, onBack, onSave }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [brokers, setBrokers] = useState([]);
    const [formData, setFormData] = useState({
        symbol: '',
        direction: 'Long',
        quantity: '',
        entryDate: '',
        entryTime: '',
        entryPrice: '',
        exitDate: '',
        exitTime: '',
        exitPrice: '',
        orderType: 'MKT',
        assessment: '',
        notes: '',
        brokerId: '',
        strategy: '',
        riskReward: '',
        commission: '',
        tags: '',
        tradeId: '',
        executionVenue: ''
    });
    const [isOpenTrade, setIsOpenTrade] = useState(false);
    const isNewTrade = tradeId === 'new';
    useEffect(() => {
        loadData();
    }, [tradeId]);
    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            // Load brokers
            const brokersData = await api.brokers.getAll();
            setBrokers(brokersData);
            if (isNewTrade) {
                // Set defaults for new trade
                const today = new Date();
                const dateStr = today.toISOString().split('T')[0];
                const timeStr = today.toTimeString().split(' ')[0].slice(0, 5);
                setFormData(prev => ({
                    ...prev,
                    entryDate: dateStr,
                    entryTime: timeStr,
                    brokerId: brokersData.length > 0 ? brokersData[0].id.toString() : ''
                }));
                setIsOpenTrade(true); // Default to open trade
            }
            else {
                // Load existing trade
                const trade = await api.trades.getById(tradeId);
                setFormData({
                    symbol: trade.symbol || '',
                    direction: trade.direction || 'Long',
                    quantity: trade.quantity?.toString() || '',
                    entryDate: trade.entryDate ? new Date(trade.entryDate).toISOString().split('T')[0] : '',
                    entryTime: trade.entryTime || '',
                    entryPrice: trade.entryPrice?.toString() || '',
                    exitDate: trade.exitDate ? new Date(trade.exitDate).toISOString().split('T')[0] : '',
                    exitTime: trade.exitTime || '',
                    exitPrice: trade.exitPrice?.toString() || '',
                    orderType: trade.orderType || 'MKT',
                    assessment: trade.assessment || '',
                    notes: trade.notes || '',
                    brokerId: trade.brokerId?.toString() || '',
                    strategy: trade.strategy || '',
                    riskReward: trade.riskReward || '',
                    commission: trade.commission?.toString() || '',
                    tags: trade.tags || '',
                    tradeId: trade.tradeId || '',
                    executionVenue: trade.executionVenue || ''
                });
                setIsOpenTrade(trade.status === 'Open');
            }
        }
        catch (err) {
            setError('Failed to load trade data');
            console.error('Error loading trade:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };
    const handleOpenTradeToggle = (isOpen) => {
        setIsOpenTrade(isOpen);
        if (isOpen) {
            // Clear exit data for open trades
            setFormData(prev => ({
                ...prev,
                exitDate: '',
                exitTime: '',
                exitPrice: ''
            }));
        }
    };
    const calculateTradeMetrics = () => {
        const entry = parseFloat(formData.entryPrice);
        const exit = parseFloat(formData.exitPrice);
        const qty = parseInt(formData.quantity);
        if (!entry || !qty || isOpenTrade) {
            return { pnl: 0, percentChange: 0, duration: '0' };
        }
        if (!exit) {
            return { pnl: 0, percentChange: 0, duration: '0' };
        }
        // Calculate P&L based on direction
        let pnl = 0;
        if (formData.direction === 'Long') {
            pnl = (exit - entry) * qty;
        }
        else {
            pnl = (entry - exit) * qty; // Reversed for shorts
        }
        // Calculate percentage change
        const percentChange = formData.direction === 'Long'
            ? (exit / entry - 1) * 100
            : (entry / exit - 1) * 100;
        // Calculate duration (simplified - just use 0 for now)
        const duration = '0';
        return { pnl, percentChange, duration };
    };
    const validateForm = () => {
        const errors = [];
        if (!formData.symbol.trim())
            errors.push('Symbol is required');
        if (!formData.quantity.trim() || parseInt(formData.quantity) <= 0)
            errors.push('Valid quantity is required');
        if (!formData.entryDate)
            errors.push('Entry date is required');
        if (!formData.entryPrice.trim() || parseFloat(formData.entryPrice) <= 0)
            errors.push('Valid entry price is required');
        if (!formData.brokerId)
            errors.push('Broker is required');
        if (!isOpenTrade) {
            if (!formData.exitDate)
                errors.push('Exit date is required for closed trades');
            if (!formData.exitPrice.trim() || parseFloat(formData.exitPrice) <= 0)
                errors.push('Valid exit price is required for closed trades');
        }
        return errors;
    };
    const handleSave = async () => {
        console.log('🔍 In handleSave');
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            setError(validationErrors.join(', '));
            return;
        }
        try {
            setSaving(true);
            setError(null);
            const metrics = calculateTradeMetrics();
            const tradeData = {
                symbol: formData.symbol.toUpperCase().trim(),
                direction: formData.direction,
                quantity: parseInt(formData.quantity),
                entryDate: formData.entryDate,
                entryTime: formData.entryTime || '09:30:00',
                entryPrice: parseFloat(formData.entryPrice),
                exitDate: isOpenTrade ? '2001-01-01' : formData.exitDate,
                exitTime: isOpenTrade ? '23:59:59' : (formData.exitTime || '16:00:00'),
                exitPrice: isOpenTrade ? 0 : parseFloat(formData.exitPrice),
                duration: metrics.duration,
                pnl: metrics.pnl,
                percentChange: metrics.percentChange,
                orderType: formData.orderType,
                assessment: formData.assessment || null,
                capital: parseFloat(formData.entryPrice) * parseInt(formData.quantity),
                status: isOpenTrade ? 'Open' : 'Closed',
                brokerId: parseInt(formData.brokerId),
                notes: formData.notes || null,
                strategy: formData.strategy || null,
                riskReward: formData.riskReward || null,
                commission: formData.commission ? parseFloat(formData.commission) : null,
                tags: formData.tags || null,
                tradeId: formData.tradeId || null,
                executionVenue: formData.executionVenue || null
            };
            // 🔍 ADD THE CONSOLE LOG HERE (after tradeData is created)
            console.log('🔍 Saving trade with data:', tradeData);
            let savedTrade;
            if (isNewTrade) {
                console.log('🔍 Creating new trade');
                savedTrade = await api.trades.create(tradeData);
                console.log('🔍 Save successful:', savedTrade);
            }
            else {
                console.log('🔍 Updating existing trade:', tradeId);
                savedTrade = await api.trades.update(tradeId, tradeData);
                console.log('🔍 Save successful:', savedTrade);
            }
            onSave?.(savedTrade);
            onBack();
        }
        catch (err) {
            console.error('🔍 Save failed:', err);
            console.error('🔍 Full error details:', JSON.stringify(err, null, 2));
            setError('Failed to save trade');
            console.error('Error saving trade:', err);
        }
        finally {
            setSaving(false);
        }
    };
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    };
    if (loading) {
        return (_jsx("div", { className: "p-6 space-y-6", children: _jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-8 text-center", children: [_jsx("div", { className: "animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" }), _jsx("h3", { className: "text-xl font-semibold text-white mb-2", children: "Loading..." }), _jsx("p", { className: "text-gray-400", children: "Preparing trade form" })] }) }));
    }
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsx("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: isNewTrade ? 'Add New Trade' : `Edit Trade: ${formData.symbol}` }), _jsx("p", { className: "text-gray-400 text-sm mt-1", children: isNewTrade ? 'Enter all trade details below' : 'Update trade information' })] }), _jsx("button", { onClick: onBack, className: "px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors", children: "\u2190 Back" })] }) }), error && (_jsx("div", { className: "bg-red-900/20 border border-red-700 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-red-400", children: "\u26A0\uFE0F" }), _jsx("h4", { className: "text-red-400 font-medium", children: error })] }) })), _jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg", children: [_jsx("div", { className: "p-6 border-b border-gray-700", children: _jsx("h3", { className: "text-lg font-semibold text-white", children: "Trade Details" }) }), _jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-gray-400 text-sm mb-2", children: "Symbol *" }), _jsx("input", { type: "text", value: formData.symbol, onChange: (e) => handleInputChange('symbol', e.target.value.toUpperCase()), placeholder: "e.g., AAPL", className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-400 text-sm mb-2", children: "Direction *" }), _jsxs("select", { value: formData.direction, onChange: (e) => handleInputChange('direction', e.target.value), className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500", children: [_jsx("option", { value: "Long", children: "Long" }), _jsx("option", { value: "Short", children: "Short" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-400 text-sm mb-2", children: "Quantity *" }), _jsx("input", { type: "number", value: formData.quantity, onChange: (e) => handleInputChange('quantity', e.target.value), placeholder: "100", min: "1", className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-white font-medium mb-3", children: "Entry Details" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-gray-400 text-sm mb-2", children: "Entry Date *" }), _jsx("input", { type: "date", value: formData.entryDate, onChange: (e) => handleInputChange('entryDate', e.target.value), className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-400 text-sm mb-2", children: "Entry Time" }), _jsx("input", { type: "time", value: formData.entryTime, onChange: (e) => handleInputChange('entryTime', e.target.value), className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-400 text-sm mb-2", children: "Entry Price *" }), _jsx("input", { type: "number", step: "0.01", value: formData.entryPrice, onChange: (e) => handleInputChange('entryPrice', e.target.value), placeholder: "150.00", min: "0.01", className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" })] })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-white font-medium mb-3", children: "Trade Status" }), _jsxs("div", { className: "flex space-x-4", children: [_jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "radio", checked: isOpenTrade, onChange: () => handleOpenTradeToggle(true), className: "mr-2" }), _jsx("span", { className: "text-white", children: "Open Trade" })] }), _jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "radio", checked: !isOpenTrade, onChange: () => handleOpenTradeToggle(false), className: "mr-2" }), _jsx("span", { className: "text-white", children: "Closed Trade" })] })] })] }), !isOpenTrade && (_jsxs("div", { children: [_jsx("h4", { className: "text-white font-medium mb-3", children: "Exit Details" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-gray-400 text-sm mb-2", children: "Exit Date *" }), _jsx("input", { type: "date", value: formData.exitDate, onChange: (e) => handleInputChange('exitDate', e.target.value), className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-400 text-sm mb-2", children: "Exit Time" }), _jsx("input", { type: "time", value: formData.exitTime, onChange: (e) => handleInputChange('exitTime', e.target.value), className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-400 text-sm mb-2", children: "Exit Price *" }), _jsx("input", { type: "number", step: "0.01", value: formData.exitPrice, onChange: (e) => handleInputChange('exitPrice', e.target.value), placeholder: "155.00", min: "0.01", className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" })] })] })] })), _jsxs("div", { children: [_jsx("h4", { className: "text-white font-medium mb-3", children: "Additional Details" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-gray-400 text-sm mb-2", children: "Broker *" }), _jsxs("select", { value: formData.brokerId, onChange: (e) => handleInputChange('brokerId', e.target.value), className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500", children: [_jsx("option", { value: "", children: "Select Broker" }), brokers.map(broker => (_jsx("option", { value: broker.id, children: broker.displayName }, broker.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-400 text-sm mb-2", children: "Order Type" }), _jsxs("select", { value: formData.orderType, onChange: (e) => handleInputChange('orderType', e.target.value), className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500", children: [_jsx("option", { value: "MKT", children: "Market" }), _jsx("option", { value: "LMT", children: "Limit" }), _jsx("option", { value: "STP", children: "Stop" }), _jsx("option", { value: "STP LMT", children: "Stop Limit" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-400 text-sm mb-2", children: "Strategy" }), _jsx("input", { type: "text", value: formData.strategy, onChange: (e) => handleInputChange('strategy', e.target.value), placeholder: "e.g., Momentum, Breakout", className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-400 text-sm mb-2", children: "Commission" }), _jsx("input", { type: "number", step: "0.01", value: formData.commission, onChange: (e) => handleInputChange('commission', e.target.value), placeholder: "1.00", min: "0", className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-400 text-sm mb-2", children: "Assessment" }), _jsx("textarea", { value: formData.assessment, onChange: (e) => handleInputChange('assessment', e.target.value), placeholder: "How did this trade perform? What was learned?", rows: 3, className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-400 text-sm mb-2", children: "Notes" }), _jsx("textarea", { value: formData.notes, onChange: (e) => handleInputChange('notes', e.target.value), placeholder: "Additional trade notes, market conditions, etc.", rows: 4, className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" })] }), !isOpenTrade && formData.entryPrice && formData.exitPrice && formData.quantity && (_jsxs("div", { className: "bg-gray-700/50 rounded-lg p-4", children: [_jsx("h4", { className: "text-white font-medium mb-3", children: "Calculated Metrics" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-400", children: "P&L: " }), _jsx("span", { className: `font-medium ${calculateTradeMetrics().pnl >= 0 ? 'text-green-400' : 'text-red-400'}`, children: formatCurrency(calculateTradeMetrics().pnl) })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-400", children: "% Change: " }), _jsxs("span", { className: `font-medium ${calculateTradeMetrics().percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`, children: [calculateTradeMetrics().percentChange.toFixed(2), "%"] })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-400", children: "Capital: " }), _jsx("span", { className: "text-white font-medium", children: formatCurrency(parseFloat(formData.entryPrice) * parseInt(formData.quantity)) })] })] })] }))] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("button", { onClick: onBack, className: "px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors", children: "Cancel" }), _jsx("button", { onClick: handleSave, disabled: saving, className: "px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50", children: saving ? 'Saving...' : (isNewTrade ? 'Create Trade' : 'Update Trade') })] })] }));
};
export default EditTrade;
