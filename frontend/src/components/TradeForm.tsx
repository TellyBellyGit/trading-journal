import React, { useState } from 'react';

interface NewTrade {
  symbol: string;
  direction: 'Long' | 'Short';
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  orderType?: string;
  assessment?: string;
  entryDate?: string;
  exitDate?: string;
}

interface TradeFormProps {
  onSubmit: (trade: NewTrade) => void;
  loading?: boolean;
}

const TradeForm: React.FC<TradeFormProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<NewTrade>({
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tradeData: NewTrade = {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'entryPrice' || name === 'exitPrice' 
        ? value === '' ? '' : Number(value)
        : value
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Add New Trade</h2>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label htmlFor="symbol" className="form-label">Symbol *</label>
          <input
            type="text"
            id="symbol"
            name="symbol"
            value={formData.symbol}
            onChange={handleChange}
            className="form-input"
            required
            placeholder="e.g., AAPL"
          />
        </div>

        <div>
          <label htmlFor="direction" className="form-label">Direction *</label>
          <select
            id="direction"
            name="direction"
            value={formData.direction}
            onChange={handleChange}
            className="form-input"
            required
          >
            <option value="Long">Long</option>
            <option value="Short">Short</option>
          </select>
        </div>

        <div>
          <label htmlFor="quantity" className="form-label">Quantity *</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            className="form-input"
            required
            min="1"
          />
        </div>

        <div>
          <label htmlFor="entryPrice" className="form-label">Entry Price *</label>
          <input
            type="number"
            id="entryPrice"
            name="entryPrice"
            value={formData.entryPrice}
            onChange={handleChange}
            className="form-input"
            required
            step="0.01"
            min="0"
          />
        </div>

        <div>
          <label htmlFor="exitPrice" className="form-label">Exit Price</label>
          <input
            type="number"
            id="exitPrice"
            name="exitPrice"
            value={formData.exitPrice || ''}
            onChange={handleChange}
            className="form-input"
            step="0.01"
            min="0"
          />
        </div>

        <div>
          <label htmlFor="orderType" className="form-label">Order Type</label>
          <select
            id="orderType"
            name="orderType"
            value={formData.orderType}
            onChange={handleChange}
            className="form-input"
          >
            <option value="MKT">Market</option>
            <option value="LMT">Limit</option>
            <option value="STP">Stop</option>
          </select>
        </div>

        <div>
          <label htmlFor="entryDate" className="form-label">Entry Date/Time</label>
          <input
            type="datetime-local"
            id="entryDate"
            name="entryDate"
            value={formData.entryDate}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="exitDate" className="form-label">Exit Date/Time</label>
          <input
            type="datetime-local"
            id="exitDate"
            name="exitDate"
            value={formData.exitDate}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <label htmlFor="assessment" className="form-label">Assessment/Notes</label>
          <textarea
            id="assessment"
            name="assessment"
            value={formData.assessment}
            onChange={handleChange}
            className="form-input"
            rows={2}
            placeholder="Trade notes, strategy, lessons learned..."
          />
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full md:w-auto"
          >
            {loading ? 'Adding Trade...' : 'Add Trade'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TradeForm;