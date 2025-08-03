// File: frontend/src/components/Settings.tsx
// Trading Journal - Settings Management Component

import React, { useState } from 'react';
import { useSettings, type RiskManagementSettings } from '../contexts/SettingsContext';

const Settings: React.FC = () => {
  const {
    settings,
    updateRiskManagement,
    getMaxRiskAmount,
    getRiskRewardRatio,
    getTradesToRisk100Percent
  } = useSettings();
  
  const [localSettings, setLocalSettings] = useState(settings.riskManagement);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Handle form input changes
  const handleRiskManagementChange = (field: keyof RiskManagementSettings, value: number) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  // Save settings
  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      updateRiskManagement(localSettings);
      setHasChanges(false);
      setSaveStatus('saved');
      
      // Reset save status after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    const defaultRiskSettings = {
      accountSize: 100000,
      riskPercentPerTrade: 2,
      defaultStopLossPercent: 5,
      defaultTargetPercent: 10
    };
    setLocalSettings(defaultRiskSettings);
    setHasChanges(true);
  };

  // Calculate derived values for preview (use current settings or local changes)
  const previewSettings = hasChanges ? localSettings : settings.riskManagement;
  const maxRiskAmount = (previewSettings.accountSize * previewSettings.riskPercentPerTrade) / 100;
  const riskRewardRatio = previewSettings.defaultTargetPercent / previewSettings.defaultStopLossPercent;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Configure your trading journal preferences and risk management settings</p>
      </div>

      {/* Risk Management Settings */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Risk Management</h2>
            <p className="text-gray-400 text-sm mt-1">Set your account size and default risk parameters</p>
          </div>
          <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">⚠️</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Size */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Account Size
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                value={localSettings.accountSize}
                onChange={(e) => handleRiskManagementChange('accountSize', Number(e.target.value))}
                className="w-full pl-8 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="100000"
                min="1000"
                step="1000"
              />
            </div>
            <p className="text-gray-500 text-xs mt-1">Your total trading account value</p>
          </div>

          {/* Risk Percent Per Trade */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Risk Per Trade
            </label>
            <div className="relative">
              <input
                type="number"
                value={localSettings.riskPercentPerTrade}
                onChange={(e) => handleRiskManagementChange('riskPercentPerTrade', Number(e.target.value))}
                className="w-full pr-8 pl-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="2"
                min="0.1"
                max="10"
                step="0.1"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
            </div>
            <p className="text-gray-500 text-xs mt-1">Percentage of account to risk per trade</p>
          </div>

          {/* Default Stop Loss */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Default Stop Loss
            </label>
            <div className="relative">
              <input
                type="number"
                value={localSettings.defaultStopLossPercent}
                onChange={(e) => handleRiskManagementChange('defaultStopLossPercent', Number(e.target.value))}
                className="w-full pr-8 pl-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="5"
                min="0.5"
                max="20"
                step="0.5"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
            </div>
            <p className="text-gray-500 text-xs mt-1">Default stop loss percentage from entry</p>
          </div>

          {/* Default Target */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Default Target
            </label>
            <div className="relative">
              <input
                type="number"
                value={localSettings.defaultTargetPercent}
                onChange={(e) => handleRiskManagementChange('defaultTargetPercent', Number(e.target.value))}
                className="w-full pr-8 pl-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="10"
                min="1"
                max="50"
                step="0.5"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
            </div>
            <p className="text-gray-500 text-xs mt-1">Default profit target percentage from entry</p>
          </div>
        </div>

        {/* Risk Preview Panel */}
        <div className="mt-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <h3 className="text-sm font-semibold text-white mb-3">Risk Management Preview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-red-400">${maxRiskAmount.toLocaleString()}</div>
              <div className="text-xs text-gray-400">Max Risk Per Trade</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{riskRewardRatio.toFixed(1)}:1</div>
              <div className="text-xs text-gray-400">Risk/Reward Ratio</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">
                {(100 / previewSettings.riskPercentPerTrade).toFixed(0)}
              </div>
              <div className="text-xs text-gray-400">Trades to Risk 100%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500 hover:text-white transition-colors"
        >
          Reset to Defaults
        </button>
        
        <div className="flex items-center space-x-4">
          {saveStatus === 'saved' && (
            <div className="flex items-center space-x-2 text-green-400">
              <span className="text-sm">✓ Settings saved</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center space-x-2 text-red-400">
              <span className="text-sm">✗ Error saving settings</span>
            </div>
          )}
          
          <button
            onClick={handleSave}
            disabled={!hasChanges || saveStatus === 'saving'}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              hasChanges && saveStatus !== 'saving'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saveStatus === 'saving' ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-400 mb-2">💡 Risk Management Tips</h3>
        <ul className="text-sm text-blue-300 space-y-1">
          <li>• Risk no more than 1-2% of your account per trade</li>
          <li>• Maintain a risk/reward ratio of at least 1:2</li>
          <li>• Never risk more than you can afford to lose</li>
          <li>• These settings will be used in trade performance calculations</li>
        </ul>
      </div>
    </div>
  );
};

export default Settings;