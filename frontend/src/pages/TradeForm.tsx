import React, { useState } from 'react';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tradeData = {
      ...form,
      quantity: Number(form.quantity),
      entryPrice: parseFloat(form.entryPrice),
      exitPrice: parseFloat(form.exitPrice),
    };

    const token = sessionStorage.getItem('auth_token');
    await fetch('https://trading-journal-backend-5fi2.onrender.com/api/trades', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
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

  return (
    <form onSubmit={handleSubmit}>
      {Object.keys(form).map((field) => (
        <div key={field}>
          <label>{field}</label>
          <input
            type="text"
            name={field}
            value={(form as any)[field]}
            onChange={handleChange}
          />
        </div>
      ))}
      <button type="submit">Submit Trade</button>
    </form>
  );
};

export default TradeForm;
