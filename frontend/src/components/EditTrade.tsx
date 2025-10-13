import React, { useState, useEffect } from 'react';
import api from '../api/trades';
import type { Trade, NewTrade, Broker } from '../types/Trade';

// Helper function to detect if notes contain rich content (HTML tags, images)
const hasRichContent = (notes: string | null | undefined): boolean => {
  if (!notes) return false;
  
  // Check for common rich content indicators
  const richContentPatterns = [
    /<img[^>]*>/i,           // Images
    /<h[1-6][^>]*>/i,        // Headers
    /<strong[^>]*>/i,        // Bold
    /<em[^>]*>/i,            // Italic
    /<ul[^>]*>/i,            // Unordered lists
    /<ol[^>]*>/i,            // Ordered lists
    /<blockquote[^>]*>/i,    // Blockquotes
    /data:image/i,           // Base64 images
    /<p[^>]*>/i,             // Paragraphs (if multiple)
    /<br\s*\/?>/i,           // Line breaks
  ];
  
  return richContentPatterns.some(pattern => pattern.test(notes));
};

// Helper function to convert HTML to plain text
const htmlToPlainText = (html: string | null | undefined): string => {
  if (!html) return '';
  
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Extract text content and clean up whitespace
  return tempDiv.textContent || tempDiv.innerText || '';
};

interface EditTradeProps {
  tradeId: number | 'new';
  onBack: () => void;
  onSave?: (trade: Trade) => void;
}

const EditTrade: React.FC<EditTradeProps> = ({ tradeId, onBack, onSave }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  
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

  const [exitDateTouched, setExitDateTouched] = useState(false);
  const [exitTimeTouched, setExitTimeTouched] = useState(false);
  const [exitPriceTouched, setExitPriceTouched] = useState(false);

  const [isOpenTrade, setIsOpenTrade] = useState(false);

  const isNewTrade = tradeId === 'new';

  useEffect(() => {
    loadData();
  }, [tradeId]);

  // Lock page scroll while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

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
          exitDate: dateStr,
          exitTime: timeStr,
          brokerId: brokersData.length > 0 ? brokersData[0].id.toString() : ''
        }));
        setIsOpenTrade(true); // Default to open trade
      } else {
        // Load existing trade
        const trade = await api.trades.getById(tradeId as number);
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
    } catch (err) {
      setError('Failed to load trade data');
      console.error('Error loading trade:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };

      // Mirror entry -> exit until the specific exit field is manually edited
      if (field === 'entryDate' && !exitDateTouched) {
        next.exitDate = value;
      }
      if (field === 'entryTime' && !exitTimeTouched) {
        next.exitTime = value;
      }
      if (field === 'entryPrice' && !exitPriceTouched) {
        next.exitPrice = value;
      }

      return next;
    });

    // Mark exit fields as touched when user edits them
    if (field === 'exitDate') setExitDateTouched(true);
    if (field === 'exitTime') setExitTimeTouched(true);
    if (field === 'exitPrice') setExitPriceTouched(true);
  };

  // per-field auto-fill implemented in handleInputChange; removed combined useEffect

  // Remove explicit trade status toggle; status is inferred from exit fields

  const calculateTradeMetrics = () => {
    const entry = parseFloat(formData.entryPrice);
    const exit = parseFloat(formData.exitPrice);
    const qty = parseInt(formData.quantity);
    const isClosed = Boolean(formData.exitDate) && !!exit && exit > 0;

    if (!entry || !qty || !isClosed) {
      return { pnl: 0, percentChange: 0, duration: '0' };
    }

    // Calculate P&L based on direction
    let pnl = 0;
    if (formData.direction === 'Long') {
      pnl = (exit - entry) * qty;
    } else {
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

    if (!formData.symbol.trim()) errors.push('Symbol is required');
    if (!formData.quantity.trim() || parseInt(formData.quantity) <= 0) errors.push('Valid quantity is required');
    if (!formData.entryDate) errors.push('Entry date is required');
    if (!formData.entryPrice.trim() || parseFloat(formData.entryPrice) <= 0) errors.push('Valid entry price is required');
    // Broker and exit fields are optional now

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
      const exitVal = parseFloat(formData.exitPrice);
      const isClosed = Boolean(formData.exitDate) && !!exitVal && exitVal > 0;

      const tradeData: any = {
        symbol: formData.symbol.toUpperCase().trim(),
        direction: formData.direction,
        quantity: parseInt(formData.quantity),
        entryDate: formData.entryDate,
        entryTime: formData.entryTime || '09:30:00',
        entryPrice: parseFloat(formData.entryPrice),
        exitDate: isClosed ? formData.exitDate : null,
        exitTime: isClosed ? (formData.exitTime || '16:00:00') : null,
        exitPrice: isClosed ? parseFloat(formData.exitPrice) : null,
        duration: metrics.duration,
        pnl: metrics.pnl,
        percentChange: metrics.percentChange,
        orderType: formData.orderType,
        assessment: formData.assessment || null,
        capital: parseFloat(formData.entryPrice) * parseInt(formData.quantity),
        status: isClosed ? 'Closed' : 'Open',
        brokerId: formData.brokerId ? parseInt(formData.brokerId) : null,
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
      } else {
        console.log('🔍 Updating existing trade:', tradeId);
        savedTrade = await api.trades.update(tradeId as number, tradeData);
        console.log('🔍 Save successful:', savedTrade);
      }

      onSave?.(savedTrade);
      onBack();
    } catch (err) {
      console.error('🔍 Save failed:', err);
      console.error('🔍 Full error details:', JSON.stringify(err, null, 2));
      setError('Failed to save trade');
      console.error('Error saving trade:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const handleClearExit = () => {
    setFormData(prev => ({
      ...prev,
      exitDate: '',
      exitTime: '',
      exitPrice: ''
    }));
    // Lock out mirroring from entry fields after clearing
    setExitDateTouched(true);
    setExitTimeTouched(true);
    setExitPriceTouched(true);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-white mb-2">Loading...</h3>
          <p className="text-gray-400">Preparing trade form</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isNewTrade ? 'Add New Trade' : `Edit Trade: ${formData.symbol}`}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {isNewTrade ? 'Enter all trade details below' : 'Update trade information'}
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-red-400">⚠️</span>
            <h4 className="text-red-400 font-medium">{error}</h4>
          </div>
        </div>
      )}

      {/* Trade Form */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Trade Details</h3>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Basic Trade Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Symbol *</label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                placeholder="e.g., AAPL"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Direction *</label>
              <select
                value={formData.direction}
                onChange={(e) => handleInputChange('direction', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Long">Long</option>
                <option value="Short">Short</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Quantity *</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                placeholder="100"
                min="1"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Entry Details */}
          <div>
            <h4 className="text-white font-medium mb-3">Entry Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Entry Date *</label>
                <input
                  type="date"
                  value={formData.entryDate}
                  onChange={(e) => handleInputChange('entryDate', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Entry Time *</label>
                <input
                  type="time"
                  value={formData.entryTime}
                  onChange={(e) => handleInputChange('entryTime', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Entry Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.entryPrice}
                  onChange={(e) => handleInputChange('entryPrice', e.target.value)}
                  placeholder="150.00"
                  min="0.01"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Exit Details (always visible, optional) */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h4 className="text-white font-medium m-0">Exit Details</h4>
              <button
                type="button"
                onClick={handleClearExit}
                className="px-2 py-1 text-xs bg-gray-700 text-gray-200 rounded hover:bg-gray-600"
              >
                Not exited
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Exit Date</label>
                <input
                  type="date"
                  value={formData.exitDate}
                  onChange={(e) => handleInputChange('exitDate', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Exit Time</label>
                <input
                  type="time"
                  value={formData.exitTime}
                  onChange={(e) => handleInputChange('exitTime', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Exit Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.exitPrice}
                  onChange={(e) => handleInputChange('exitPrice', e.target.value)}
                  placeholder="155.00"
                  min="0.01"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          
          {/* Calculated Metrics Preview (moved up; shown when exit provided) */}
          {Boolean(formData.exitDate) && formData.entryPrice && formData.exitPrice && formData.quantity && (
            <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
              <h4 className="text-white font-medium mb-3">Calculated Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">P&L: </span>
                  <span className={`font-medium ${calculateTradeMetrics().pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(calculateTradeMetrics().pnl)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">% Change: </span>
                  <span className={`font-medium ${calculateTradeMetrics().percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {calculateTradeMetrics().percentChange.toFixed(2)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Capital: </span>
                  <span className="text-white font-medium">
                    {formatCurrency(parseFloat(formData.entryPrice) * parseInt(formData.quantity))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Duplicate Save Actions (placed above Additional Details) */}
          <div className="flex justify-between mb-6">
            <button
              onClick={onBack}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : (isNewTrade ? 'Create Trade' : 'Update Trade')}
            </button>
          </div>

          {/* Additional Details - Optional */}
          <div>
            <h4 className="text-white font-medium mb-3">Additional Details - Optional</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Broker</label>
                <select
                  value={formData.brokerId}
                  onChange={(e) => handleInputChange('brokerId', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Broker</option>
                  {brokers.map(broker => (
                    <option key={broker.id} value={broker.id}>{broker.displayName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Order Type</label>
                <select
                  value={formData.orderType}
                  onChange={(e) => handleInputChange('orderType', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="MKT">Market</option>
                  <option value="LMT">Limit</option>
                  <option value="STP">Stop</option>
                  <option value="STP LMT">Stop Limit</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Strategy</label>
                <input
                  type="text"
                  value={formData.strategy}
                  onChange={(e) => handleInputChange('strategy', e.target.value)}
                  placeholder="e.g., Momentum, Breakout"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Commission</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.commission}
                  onChange={(e) => handleInputChange('commission', e.target.value)}
                  placeholder="1.00"
                  min="0"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Assessment */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Assessment</label>
            <textarea
              value={formData.assessment}
              onChange={(e) => handleInputChange('assessment', e.target.value)}
              placeholder="How did this trade perform? What was learned?"
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Notes</label>
            
            {/* Check if notes contain rich content */}
            {hasRichContent(formData.notes) ? (
              <div className="space-y-3">
                {/* Warning Message */}
                <div className="bg-amber-900/30 border border-amber-600 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-amber-400">⚠️</span>
                    <div>
                      <p className="text-amber-200 text-sm font-medium">
                        Notes contain rich content (images, formatting)
                      </p>
                      <p className="text-amber-300 text-xs mt-1">
                        Edit full notes with images in Trade Details view to preserve formatting
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Plain Text Preview */}
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-2">Plain text preview:</p>
                  <div className="text-gray-300 text-sm max-h-24 overflow-y-auto">
                    {htmlToPlainText(formData.notes) || 'No text content found'}
                  </div>
                </div>
                
                {/* Disabled textarea with message */}
                <div className="relative">
                  <textarea
                    value=""
                    readOnly
                    disabled
                    placeholder="Notes editing disabled - contains rich content"
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-500 placeholder-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
            ) : (
              /* Regular textarea for plain text notes */
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional trade notes, market conditions, etc."
                rows={4}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            )}
          </div>

          
        </div>
      </div>

      
    </div>
  );
};

export default EditTrade;