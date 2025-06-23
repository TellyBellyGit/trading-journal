import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
const TradeForm = () => {
    const [form, setForm] = useState({
        symbol: '',
        direction: '',
        quantity: 0,
        entryDate: '',
        entryTime: '',
        entryPrice: '',
        exitDate: '',
        exitTime: '',
        exitPrice: '',
        orderType: '',
        assessment: ''
    });
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const tradeData = {
            ...form,
            quantity: Number(form.quantity),
            entryPrice: parseFloat(form.entryPrice),
            exitPrice: parseFloat(form.exitPrice),
        };
        await fetch('/api/trades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tradeData)
        });
        alert('Trade submitted');
        setForm({
            symbol: '',
            direction: '',
            quantity: 0,
            entryDate: '',
            entryTime: '',
            entryPrice: '',
            exitDate: '',
            exitTime: '',
            exitPrice: '',
            orderType: '',
            assessment: ''
        });
    };
    return (_jsxs("form", { onSubmit: handleSubmit, children: [Object.keys(form).map((field) => (_jsxs("div", { children: [_jsx("label", { children: field }), _jsx("input", { type: "text", name: field, value: form[field], onChange: handleChange })] }, field))), _jsx("button", { type: "submit", children: "Submit Trade" })] }));
};
export default TradeForm;
