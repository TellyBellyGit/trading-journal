import React, { useState } from 'react';
import AllTrades from './AllTrades';

// Sample trade data generator
const generateSampleTrades = () => {
  const symbols = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'NFLX', 'ORCL', 'CRM'];
  const directions = ['Long', 'Short'] as const;
  const assessments = ['Good', 'Excellent', 'Poor', 'Average', 'Great', ''];
  const orderTypes = ['MKT', 'LMT', 'STP'];
  
  const trades = [];
  
  for (let i = 1; i <= 50; i++) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    const quantity = Math.floor(Math.random() * 100) + 1;
    const entryPrice = Math.random() * 500 + 50;
    const isOpen = Math.random() > 0.7; // 30% open trades
    
    let exitPrice, profitLoss, percentChange;
    if (!isOpen) {
      const priceChange = (Math.random() - 0.5) * 0.2; // ±10% change
      exitPrice = entryPrice * (1 + priceChange);
      
      if (direction === 'Long') {
        profitLoss = quantity * (exitPrice - entryPrice);
      } else {
        profitLoss = quantity * (entryPrice - exitPrice);
      }
      percentChange = (profitLoss / (quantity * entryPrice)) * 100;
    }
    
    const entryDate = new Date();
    entryDate.setDate(entryDate.getDate() - Math.floor(Math.random() * 365)); // Random date within last year
    
    let exitDate;
    if (!isOpen) {
      exitDate = new Date(entryDate);
      exitDate.setHours(exitDate.getHours() + Math.floor(Math.random() * 24 * 7)); // Exit within a week
    }
    
    const duration = exitDate ? (exitDate.getTime() - entryDate.getTime()) / (1000 * 60) : undefined; // Duration in minutes
    
    trades.push({
      id: i,
      symbol,
      direction,
      quantity,
      entryPrice: Math.round(entryPrice * 100) / 100,
      exitPrice: exitPrice ? Math.round(exitPrice * 100) / 100 : undefined,
      profitLoss: profitLoss ? Math.round(profitLoss * 100) / 100 : undefined,
      percentChange: percentChange ? Math.round(percentChange * 100) / 100 : undefined,
      orderType: orderTypes[Math.floor(Math.random() * orderTypes.length)],
      assessment: assessments[Math.floor(Math.random() * assessments.length)],
      capitalDeployed: Math.round(quantity * entryPrice * 100) / 100,
      entryDate: entryDate.toISOString(),
      exitDate: exitDate?.toISOString(),
      duration,
      status: isOpen ? 'Open' : 'Closed',
      commentary: i % 5 === 0 ? `Trade #${i} commentary notes` : '',
      createdAt: entryDate.toISOString(),
      updatedAt: (exitDate || entryDate).toISOString()
    });
  }
  
  return trades.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
};

const AllTradesDemo: React.FC = () => {
  const [trades, setTrades] = useState(() => generateSampleTrades());
  const [loading, setLoading] = useState(false);

  const handleTradeEdit = (trade: any) => {
    console.log('Edit trade:', trade);
    alert(`Edit Trade: ${trade.symbol} (ID: ${trade.id})`);
  };

  const handleTradeDelete = (tradeId: number) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      setTrades(prev => prev.filter(t => t.id !== tradeId));
    }
  };

  const handleTradeAdd = () => {
    console.log('Add new trade');
    alert('Add New Trade functionality would open a form dialog');
  };

  const handleExport = () => {
    console.log('Export trades');
    alert('Export functionality would download CSV/Excel file');
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setTrades(generateSampleTrades());
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Demo Controls */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">All Trades Component Demo</h2>
        <div className="flex flex-wrap gap-4 mb-4">
          <button onClick={handleRefresh} className="btn-primary" disabled={loading}>
            {loading ? '🔄 Loading...' : '🔄 Generate New Data'}
          </button>
          <button onClick={() => setTrades([])} className="btn-secondary">
            🗑️ Clear All Trades
          </button>
          <button onClick={() => setTrades(generateSampleTrades())} className="btn-secondary">
            📊 Reset Sample Data
          </button>
        </div>
        
        <div className="text-sm text-gray-400 space-y-1">
          <p><strong>Features demonstrated:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Advanced filtering (Symbol, Direction, Status, Assessment, Date Range, P/L Range)</li>
            <li>Multi-column sorting with visual indicators</li>
            <li>Bulk selection with checkbox controls</li>
            <li>Table and Cards view modes</li>
            <li>Real-time summary statistics</li>
            <li>Responsive design for mobile/desktop</li>
            <li>Edit/Delete actions for individual trades</li>
            <li>Professional data formatting (currency, percentages, dates)</li>
            <li>Empty state handling</li>
            <li>Loading states and animations</li>
          </ul>
        </div>
      </div>

      {/* All Trades Component */}
      <AllTrades
        trades={trades}
        loading={loading}
        onTradeEdit={handleTradeEdit}
        onTradeDelete={handleTradeDelete}
        onTradeAdd={handleTradeAdd}
        onExport={handleExport}
      />
    </div>
  );
};

export default AllTradesDemo;