import React, { useState } from 'react';
import { tradesApi } from '../api/trades';
import type { NewTrade } from '../types/Trade';

const TradeForm = () => {
  const [form, setForm] = useState({
    symbol: '',
    direction: 'Long' as 'Long' | 'Short',
    quantity: 0,
    entryDate: '',
    entryTime: '',
    entryPrice: '',
    exitDate: '',
    exitTime: '',
    exitPrice: '',
    orderType: 'MKT',
    assessment: '',
    brokerId: 1, // Default broker
    notes: '',
    strategy: '',
    commission: '',
    tags: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const entryPrice = parseFloat(form.entryPrice) || 0;
      const exitPrice = form.exitPrice ? parseFloat(form.exitPrice) : null;
      const quantity = Number(form.quantity) || 0;
      const capital = entryPrice * quantity;
      
      // Calculate PnL
      let pnl = 0;
      let percentChange = 0;
      if (exitPrice !== null) {
        if (form.direction === 'Long') {
          pnl = (exitPrice - entryPrice) * quantity;
        } else {
          pnl = (entryPrice - exitPrice) * quantity;
        }
        percentChange = entryPrice > 0 ? ((exitPrice - entryPrice) / entryPrice) * 100 : 0;
        if (form.direction === 'Short') {
          percentChange = entryPrice > 0 ? ((entryPrice - exitPrice) / entryPrice) * 100 : 0;
        }
      }

      // Calculate duration in minutes
      let duration = '0';
      if (form.entryDate && form.exitDate) {
        const entryDateTime = new Date(form.entryDate);
        const exitDateTime = new Date(form.exitDate);
        const durationMs = exitDateTime.getTime() - entryDateTime.getTime();
        duration = Math.max(0, Math.round(durationMs / (1000 * 60))).toString();
      }

      const tradeData: NewTrade = {
        symbol: form.symbol.toUpperCase(),
        direction: form.direction,
        quantity,
        entryDate: form.entryDate,
        entryTime: form.entryTime,
        entryPrice,
        exitDate: form.exitDate || null,
        exitTime: form.exitTime || null,
        exitPrice,
        duration,
        pnl: Math.round(pnl * 100) / 100,
        percentChange: Math.round(percentChange * 100) / 100,
        orderType: form.orderType,
        assessment: form.assessment || undefined,
        capital,
        status: form.exitDate && exitPrice !== null ? 'Closed' : 'Open',
        brokerId: form.brokerId,
        notes: form.notes || undefined,
        strategy: form.strategy || undefined,
        commission: form.commission ? parseFloat(form.commission) : undefined,
        tags: form.tags || undefined,
      };

      console.log('🔍 Creating trade with data:', tradeData);
      await tradesApi.create(tradeData);
      console.log('✅ Trade created successfully');
      alert('Trade submitted successfully!');
      
      // Reset form
      setForm({
        symbol: '',
        direction: 'Long',
        quantity: 0,
        entryDate: '',
        entryTime: '',
        entryPrice: '',
        exitDate: '',
        exitTime: '',
        exitPrice: '',
        orderType: 'MKT',
        assessment: '',
        brokerId: 1,
        notes: '',
        strategy: '',
        commission: '',
        tags: '',
      });
    } catch (error: any) {
      console.error('❌ Error submitting trade:', error);
      
      // Show more useful error message
      const errorMessage = error?.response?.data?.error 
        || error?.response?.data?.message 
        || error?.message 
        || 'Failed to submit trade. Please try again.';
      
      alert(`Failed to submit trade: ${errorMessage}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Add New Trade</h2>
      
      <div style={{ marginBottom: '10px' }}>
        <label>Symbol *</label>
        <input type="text" name="symbol" value={form.symbol} onChange={handleChange} required placeholder="e.g., AAPL" />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>Direction *</label>
        <select name="direction" value={form.direction} onChange={handleChange} required>
          <option value="Long">Long</option>
          <option value="Short">Short</option>
        </select>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>Quantity *</label>
        <input type="number" name="quantity" value={form.quantity} onChange={handleChange} required min="1" />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>Entry Price *</label>
        <input type="number" name="entryPrice" value={form.entryPrice} onChange={handleChange} required step="0.01" min="0" />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>Exit Price</label>
        <input type="number" name="exitPrice" value={form.exitPrice} onChange={handleChange} step="0.01" min="0" />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>Entry Date/Time</label>
        <input type="datetime-local" name="entryDate" value={form.entryDate} onChange={handleChange} />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>Exit Date/Time</label>
        <input type="datetime-local" name="exitDate" value={form.exitDate} onChange={handleChange} />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>Order Type</label>
        <select name="orderType" value={form.orderType} onChange={handleChange}>
          <option value="MKT">Market</option>
          <option value="LMT">Limit</option>
          <option value="STP">Stop</option>
        </select>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>Strategy</label>
        <input type="text" name="strategy" value={form.strategy} onChange={handleChange} placeholder="e.g., Breakout, Trend Follow" />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>Commission</label>
        <input type="number" name="commission" value={form.commission} onChange={handleChange} step="0.01" min="0" placeholder="e.g., 5.00" />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>Tags</label>
        <input type="text" name="tags" value={form.tags} onChange={handleChange} placeholder="e.g., earnings, swing-trade" />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>Assessment/Notes</label>
        <textarea
          name="assessment"
          value={form.assessment}
          onChange={handleChange}
          rows={3}
          placeholder="Trade notes, lessons learned..."
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>Detailed Notes</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Additional trade details..."
        />
      </div>

      <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>
        Submit Trade
      </button>
    </form>
  );
};

export default TradeForm;