import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type DateFormatType = 'US' | 'INTL';

interface DateFormatContextType {
  dateFormat: DateFormatType;
  toggleDateFormat: () => void;
  isUSFormat: boolean;
}

const DateFormatContext = createContext<DateFormatContextType | undefined>(undefined);

interface DateFormatProviderProps {
  children: ReactNode;
}

export const DateFormatProvider: React.FC<DateFormatProviderProps> = ({ children }) => {
  const [dateFormat, setDateFormat] = useState<DateFormatType>(() => {
    const saved = localStorage.getItem('dateFormat');
    return (saved as DateFormatType) || 'US';
  });

  const toggleDateFormat = () => {
    const newFormat = dateFormat === 'US' ? 'INTL' : 'US';
    setDateFormat(newFormat);
  };

  useEffect(() => {
    localStorage.setItem('dateFormat', dateFormat);
  }, [dateFormat]);

  const isUSFormat = dateFormat === 'US';

  return (
    <DateFormatContext.Provider value={{ dateFormat, toggleDateFormat, isUSFormat }}>
      {children}
    </DateFormatContext.Provider>
  );
};

export const useDateFormat = () => {
  const context = useContext(DateFormatContext);
  if (context === undefined) {
    throw new Error('useDateFormat must be used within a DateFormatProvider');
  }
  return context;
};