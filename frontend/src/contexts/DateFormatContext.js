import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
const DateFormatContext = createContext(undefined);
export const DateFormatProvider = ({ children }) => {
    const [dateFormat, setDateFormat] = useState(() => {
        const saved = localStorage.getItem('dateFormat');
        return saved || 'US';
    });
    const toggleDateFormat = () => {
        const newFormat = dateFormat === 'US' ? 'INTL' : 'US';
        setDateFormat(newFormat);
    };
    useEffect(() => {
        localStorage.setItem('dateFormat', dateFormat);
    }, [dateFormat]);
    const isUSFormat = dateFormat === 'US';
    return (_jsx(DateFormatContext.Provider, { value: { dateFormat, toggleDateFormat, isUSFormat }, children: children }));
};
export const useDateFormat = () => {
    const context = useContext(DateFormatContext);
    if (context === undefined) {
        throw new Error('useDateFormat must be used within a DateFormatProvider');
    }
    return context;
};
