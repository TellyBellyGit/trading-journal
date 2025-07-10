import React, { useState } from 'react';
import AppShell from './AppShell';
import Dashboard from './Dashboard';
import AnalyticsDashboard from './analytics/AnalyticsDashboard';
import PerformanceIndicatorsDashboard from './PerformanceIndicatorsDashboard';
import AllTrades from './AllTrades';
import ImportTrades from './ImportTrades';
import TradingCalendar from './TradingCalendar';
import Notes from './Notes';
import Settings from './Settings';
import DatePickerModal from './DatePickerModal';

// API configuration
const API_BASE_URL = 'http://localhost:3002/api';


// Main Trading App Component (authenticated content)
const TradingApp: React.FC = () => {
  const [currentView, setCurrentView] = useState('original');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

  const handleNewTrade = () => {
    setCurrentView('all-trades');
    // Use setTimeout to ensure AllTrades component is mounted before triggering
    setTimeout(() => {
      // This will trigger the AllTrades add trade functionality
      // The AllTrades component will handle opening the EditTrade form
      const event = new CustomEvent('triggerAddTrade');
      window.dispatchEvent(event);
    }, 100);
  };

  // Show date picker modal for export
  const handleExportToAI = () => {
    setShowDatePicker(true);
  };

  // Actual export function called from date picker modal
  const performExportToAI = async (startDate: string, endDate: string) => {
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    try {
      // Use the new efficient export API endpoint that filters at the database level
      const response = await fetch(`${API_BASE_URL}/trades/export?startDate=${startDate}&endDate=${endDate}&status=Closed`);
      if (!response.ok) throw new Error('Failed to fetch trades for export');
      
      const trades = await response.json();
      
      if (!trades.length) {
        alert('No closed trades found in the selected date range.');
        return;
      }

      // Format the data for AI analysis
      const formattedData = trades.map((trade: any) => ({
        Symbol: trade.symbol,
        Direction: trade.direction,
        'Entry Price': trade.entryPrice,
        'Exit Price': trade.exitPrice,
        'P&L': trade.pnl,
        'Percent Change': trade.percentChange,
        'Entry Date': trade.entryDate,
        'Exit Date': trade.exitDate,
        Duration: trade.duration,
        Assessment: trade.assessment || 'No assessment'
      }));

      // Convert to CSV format
      const csvContent = [
        Object.keys(formattedData[0]).join(','),
        ...formattedData.map(row => Object.values(row).join(','))
      ].join('\n');

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trading-data-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert(`Exported ${trades.length} trades to CSV file.`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export trades. Please try again.');
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'original':
        return <Dashboard onViewChange={handleViewChange} onExportToAI={handleExportToAI} />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'performance-indicators':
        return <PerformanceIndicatorsDashboard />;
      case 'all-trades':
        return (
          <AllTrades
            onTradeAdd={() => {
              console.log('Add new trade');
            }}
            onTradeEdit={(trade) => {
              console.log('Edit trade:', trade);
            }}
            onTradeDelete={(tradeId) => {
              console.log('Delete trade:', tradeId);
            }}
            onExport={() => {
              console.log('Export trades');
            }}
          />
        );
      case 'import':
        return <ImportTrades />;
      case 'calendar':
        return <TradingCalendar />;
      case 'notes':
        return <Notes />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onViewChange={handleViewChange} onExportToAI={handleExportToAI} />;
    }
  };

  const getTitle = () => {
    switch (currentView) {
      case 'analytics':
        return 'Trading Analytics Dashboard';
      case 'enhanced':
        return 'Enhanced Trading Dashboard';
      case 'all-trades':
        return 'Trade List';
      case 'import':
        return 'Import Trades';
      case 'notes':
        return 'Trading Notes';
      case 'calendar':
        return 'Trading Calendar';
      case 'settings':
        return 'Settings';
      default:
        return 'Trading Dashboard';
    }
  };

  const getSubtitle = () => {
    switch (currentView) {
      case 'analytics':
        return 'Comprehensive performance analysis with advanced metrics';
      case 'enhanced':
        return 'Professional metrics with time period analysis';
      case 'all-trades':
        return 'Complete trading history with advanced filtering';
      case 'import':
        return 'Upload broker statements to automatically import trades';
      case 'notes':
        return 'Journal entries and trade reflections with rich text editing';
      case 'calendar':
        return 'Visual calendar view of your trading activity';
      case 'settings':
        return 'Configure your trading journal preferences and risk management';
      default:
        return 'Real-time trading performance';
    }
  };

  return (
    <>
      <AppShell 
        title={getTitle()} 
        subtitle={getSubtitle()}
        currentView={currentView}
        onViewChange={handleViewChange}
        onNewTrade={handleNewTrade}
      >
        {renderContent()}
      </AppShell>
      
      {/* Date Picker Modal */}
      <DatePickerModal
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onExport={performExportToAI}
      />
    </>
  );
};

export default TradingApp;