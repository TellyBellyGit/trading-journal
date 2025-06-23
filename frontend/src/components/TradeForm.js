import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
const TradeForm = ({ onSubmit, loading = false }) => {
    const [formData, setFormData] = useState({
        symbol: '',
        direction: 'Long',
        quantity: 1,
        entryPrice: 0,
        exitPrice: undefined,
        orderType: 'MKT',
        assessment: '',
        entryDate: new Date().toISOString().slice(0, 16),
        exitDate: '',
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        const tradeData = {
            ...formData,
            symbol: formData.symbol.toUpperCase(),
            exitPrice: formData.exitPrice || undefined,
            exitDate: formData.exitDate || undefined,
            assessment: formData.assessment || undefined,
        };
        onSubmit(tradeData);
        // Reset form
        setFormData({
            symbol: '',
            direction: 'Long',
            quantity: 1,
            entryPrice: 0,
            exitPrice: undefined,
            orderType: 'MKT',
            assessment: '',
            entryDate: new Date().toISOString().slice(0, 16),
            exitDate: '',
        });
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'quantity' || name === 'entryPrice' || name === 'exitPrice'
                ? value === '' ? '' : Number(value)
                : value
        }));
    };
    return (_jsxs("div", { className: "bg-white p-6 rounded-lg shadow-md", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Add New Trade" }), _jsxs("form", { onSubmit: handleSubmit, className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "symbol", className: "form-label", children: "Symbol *" }), _jsx("input", { type: "text", id: "symbol", name: "symbol", value: formData.symbol, onChange: handleChange, className: "form-input", required: true, placeholder: "e.g., AAPL" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "direction", className: "form-label", children: "Direction *" }), _jsxs("select", { id: "direction", name: "direction", value: formData.direction, onChange: handleChange, className: "form-input", required: true, children: [_jsx("option", { value: "Long", children: "Long" }), _jsx("option", { value: "Short", children: "Short" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "quantity", className: "form-label", children: "Quantity *" }), _jsx("input", { type: "number", id: "quantity", name: "quantity", value: formData.quantity, onChange: handleChange, className: "form-input", required: true, min: "1" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "entryPrice", className: "form-label", children: "Entry Price *" }), _jsx("input", { type: "number", id: "entryPrice", name: "entryPrice", value: formData.entryPrice, onChange: handleChange, className: "form-input", required: true, step: "0.01", min: "0" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "exitPrice", className: "form-label", children: "Exit Price" }), _jsx("input", { type: "number", id: "exitPrice", name: "exitPrice", value: formData.exitPrice || '', onChange: handleChange, className: "form-input", step: "0.01", min: "0" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "orderType", className: "form-label", children: "Order Type" }), _jsxs("select", { id: "orderType", name: "orderType", value: formData.orderType, onChange: handleChange, className: "form-input", children: [_jsx("option", { value: "MKT", children: "Market" }), _jsx("option", { value: "LMT", children: "Limit" }), _jsx("option", { value: "STP", children: "Stop" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "entryDate", className: "form-label", children: "Entry Date/Time" }), _jsx("input", { type: "datetime-local", id: "entryDate", name: "entryDate", value: formData.entryDate, onChange: handleChange, className: "form-input" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "exitDate", className: "form-label", children: "Exit Date/Time" }), _jsx("input", { type: "datetime-local", id: "exitDate", name: "exitDate", value: formData.exitDate, onChange: handleChange, className: "form-input" })] }), _jsxs("div", { className: "md:col-span-2 lg:col-span-3", children: [_jsx("label", { htmlFor: "assessment", className: "form-label", children: "Assessment/Notes" }), _jsx("textarea", { id: "assessment", name: "assessment", value: formData.assessment, onChange: handleChange, className: "form-input", rows: 2, placeholder: "Trade notes, strategy, lessons learned..." })] }), _jsx("div", { className: "md:col-span-2 lg:col-span-3", children: _jsx("button", { type: "submit", disabled: loading, className: "btn btn-primary w-full md:w-auto", children: loading ? 'Adding Trade...' : 'Add Trade' }) })] })] }));
};
export default TradeForm;
