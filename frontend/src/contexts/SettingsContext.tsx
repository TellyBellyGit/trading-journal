// File: frontend/src/contexts/SettingsContext.tsx
// Trading Journal - Settings Context for Risk Management

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Settings interfaces
export interface RiskManagementSettings {
  accountSize: number;
  riskPercentPerTrade: number;
  defaultStopLossPercent: number;
  defaultTargetPercent: number;
}

export interface AppSettings {
  riskManagement: RiskManagementSettings;
  timeDisplay: 'local' | 'eastern';
}

// Default settings
const defaultSettings: AppSettings = {
  riskManagement: {
    accountSize: 100000,
    riskPercentPerTrade: 2,
    defaultStopLossPercent: 5,
    defaultTargetPercent: 10
  },
  timeDisplay: 'eastern'
};

// Settings storage key
const SETTINGS_STORAGE_KEY = 'trading-journal-settings';

// Context interface
interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: AppSettings) => void;
  updateRiskManagement: (riskSettings: RiskManagementSettings) => void;
  getRiskManagementSettings: () => RiskManagementSettings;
  
  // Time display settings
  timeDisplay: 'local' | 'eastern';
  toggleTimeDisplay: () => void;
  formatTradeTime: (timeString: string, tradeDate: string) => string;
  getEasternTime: (timeString: string, tradeDate: string) => string;
  
  // Calculated values
  getMaxRiskAmount: () => number;
  getRiskRewardRatio: () => number;
  getTradesToRisk100Percent: () => number;
  
  // Position sizing helpers
  calculatePositionSize: (entryPrice: number, stopLossPercent?: number) => number;
  calculatePlannedRisk: (capital: number, stopLossPercent?: number) => number;
  calculatePlannedReward: (capital: number, targetPercent?: number) => number;
  isRiskCompliant: (capital: number) => boolean;
}

// Create context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Provider component
export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        const mergedSettings = {
          riskManagement: {
            ...defaultSettings.riskManagement,
            ...parsed.riskManagement
          },
          timeDisplay: parsed.timeDisplay || defaultSettings.timeDisplay
        };
        setSettings(mergedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setSettings(defaultSettings);
    }
  }, []);

  // Update settings and save to localStorage
  const updateSettings = (newSettings: AppSettings) => {
    try {
      setSettings(newSettings);
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  // Update only risk management settings
  const updateRiskManagement = (riskSettings: RiskManagementSettings) => {
    const newSettings = {
      ...settings,
      riskManagement: riskSettings
    };
    updateSettings(newSettings);
  };

  // Get risk management settings
  const getRiskManagementSettings = () => {
    return settings.riskManagement;
  };

  // Calculate maximum risk amount per trade
  const getMaxRiskAmount = () => {
    const { accountSize, riskPercentPerTrade } = settings.riskManagement;
    return (accountSize * riskPercentPerTrade) / 100;
  };

  // Calculate risk/reward ratio
  const getRiskRewardRatio = () => {
    const { defaultTargetPercent, defaultStopLossPercent } = settings.riskManagement;
    return defaultTargetPercent / defaultStopLossPercent;
  };

  // Calculate how many trades it would take to risk 100% of account
  const getTradesToRisk100Percent = () => {
    const { riskPercentPerTrade } = settings.riskManagement;
    return Math.floor(100 / riskPercentPerTrade);
  };

  // Calculate position size based on risk rules
  const calculatePositionSize = (entryPrice: number, stopLossPercent?: number) => {
    const { accountSize, riskPercentPerTrade, defaultStopLossPercent } = settings.riskManagement;
    const stopLoss = stopLossPercent || defaultStopLossPercent;
    
    const maxRiskAmount = (accountSize * riskPercentPerTrade) / 100;
    const riskPerShare = entryPrice * (stopLoss / 100);
    
    return Math.floor(maxRiskAmount / riskPerShare);
  };

  // Calculate planned risk amount
  const calculatePlannedRisk = (capital: number, stopLossPercent?: number) => {
    const { defaultStopLossPercent } = settings.riskManagement;
    const stopLoss = stopLossPercent || defaultStopLossPercent;
    return capital * (stopLoss / 100);
  };

  // Calculate planned reward amount
  const calculatePlannedReward = (capital: number, targetPercent?: number) => {
    const { defaultTargetPercent } = settings.riskManagement;
    const target = targetPercent || defaultTargetPercent;
    return capital * (target / 100);
  };

  // Check if trade capital is compliant with risk rules
  const isRiskCompliant = (capital: number) => {
    const maxRiskAmount = getMaxRiskAmount();
    const plannedRisk = calculatePlannedRisk(capital);
    return plannedRisk <= maxRiskAmount;
  };

  // Toggle time display between local and eastern
  const toggleTimeDisplay = () => {
    const newTimeDisplay = settings.timeDisplay === 'local' ? 'eastern' : 'local';
    const newSettings = {
      ...settings,
      timeDisplay: newTimeDisplay
    };
    updateSettings(newSettings);
  };

  // Convert UK time to Eastern time for display
  const convertUKToEastern = (ukTimeString: string, tradeDate: string): string => {
    try {
      // Handle different date formats and ensure we have a valid date
      let dateStr = tradeDate;
      
      // If tradeDate is already an ISO string, extract just the date part
      if (tradeDate.includes('T')) {
        dateStr = tradeDate.split('T')[0];
      }
      
      // Create a datetime object in UK timezone
      // Format: YYYY-MM-DD + T + HH:MM:SS
      const ukDateTime = new Date(`${dateStr}T${ukTimeString}`);
      
      // Check if the date is valid
      if (isNaN(ukDateTime.getTime())) {
        console.error('Invalid date created:', `${dateStr}T${ukTimeString}`);
        return ukTimeString; // Fallback to original
      }
      
      // Convert to Eastern time with automatic DST handling
      const easternTime = ukDateTime.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      // Extract just the time part (HH:MM:SS)
      const timePart = easternTime.split(', ')[1] || easternTime;
      
      // Additional validation
      if (timePart.includes('Invalid')) {
        console.error('Invalid time conversion result:', timePart);
        return ukTimeString; // Fallback to original
      }
      
      return timePart;
    } catch (error) {
      console.error('Error converting time:', error, 'Input:', ukTimeString, tradeDate);
      return ukTimeString; // Fallback to original
    }
  };

  // Format trade time based on current display setting
  const formatTradeTime = (timeString: string, tradeDate: string): string => {
    if (!timeString) return '—';
    
    if (settings.timeDisplay === 'local') {
      return timeString; // Show UK time as-is
    } else {
      return convertUKToEastern(timeString, tradeDate); // Convert to Eastern
    }
  };

  // Always convert to Eastern time (for market session calculations)
  const getEasternTime = (timeString: string, tradeDate: string): string => {
    if (!timeString) return '—';
    return convertUKToEastern(timeString, tradeDate);
  };

  const contextValue: SettingsContextType = {
    settings,
    updateSettings,
    updateRiskManagement,
    getRiskManagementSettings,
    timeDisplay: settings.timeDisplay,
    toggleTimeDisplay,
    formatTradeTime,
    getEasternTime,
    getMaxRiskAmount,
    getRiskRewardRatio,
    getTradesToRisk100Percent,
    calculatePositionSize,
    calculatePlannedRisk,
    calculatePlannedReward,
    isRiskCompliant
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

// Hook to use settings context
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Export utilities for standalone use (backward compatibility)
export const settingsUtils = {
  loadSettings: (): AppSettings => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          riskManagement: {
            ...defaultSettings.riskManagement,
            ...parsed.riskManagement
          },
          timeDisplay: parsed.timeDisplay || defaultSettings.timeDisplay
        };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    return defaultSettings;
  },

  saveSettings: (settings: AppSettings): void => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },

  getRiskManagementSettings: (): RiskManagementSettings => {
    return settingsUtils.loadSettings().riskManagement;
  }
};

export default SettingsContext;