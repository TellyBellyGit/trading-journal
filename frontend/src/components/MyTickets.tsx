import React, { useEffect, useState } from 'react';
import { ticketsApi } from '../api/tickets';
import type { Ticket } from '../types/Ticket';
import { useAuth } from '../contexts/AuthContext';

interface MyTicketsProps {
  onOpenDetails: (ticketId: string) => void;
}

const statusColor: Record<string, string> = {
  submitted: 'bg-blue-600',
  opened: 'bg-indigo-600',
  in_progress: 'bg-yellow-600',
  waiting_customer: 'bg-orange-600',
  resolved: 'bg-green-600',
  closed: 'bg-gray-600',
};

const MyTickets: React.FC<MyTicketsProps> = ({ onOpenDetails }) => {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!token) {
        setError('You must be logged in to view tickets.');
        setLoading(false);
        return;
      }
      const data = await ticketsApi.listMyTickets(token);
      setTickets(data);
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Failed to load tickets.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white text-lg font-semibold">My Tickets</h3>
        <button
          onClick={loadTickets}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
        >
          Refresh
        </button>
      </div>
      {loading && (
        <div className="text-gray-300 text-sm">Loading tickets…</div>
      )}
      {error && (
        <div className="mb-3 p-3 bg-red-700/30 border border-red-600 rounded text-red-200 text-sm">{error}</div>
      )}
      {!loading && !error && tickets.length === 0 && (
        <div className="text-gray-400 text-sm">No tickets yet. Submit a ticket above.</div>
      )}
      {!loading && !error && tickets.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-gray-300">
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Updated</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-t border-gray-700 hover:bg-gray-800">
                  <td className="px-3 py-2 text-white">{t.subject}</td>
                  <td className="px-3 py-2 text-gray-300 capitalize">{t.type.replace('_', ' ')}</td>
                  <td className="px-3 py-2 text-gray-300 capitalize">{t.priority}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-block px-2 py-1 rounded text-white text-xs capitalize ${statusColor[t.status] || 'bg-gray-600'}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-400">{new Date(t.updatedAt).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => onOpenDetails(t.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyTickets;