import React, { useEffect, useState } from 'react';
import { ticketsApi } from '../../api/tickets';
import { useAuth } from '../../contexts/AuthContext';
import type { Ticket } from '../../types/Ticket';
import TicketAdminModal from './TicketAdminModal';

const TicketsAdmin: React.FC = () => {
  const { user, token } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const loadTickets = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await ticketsApi.listAllTicketsAdmin(token);
      setTickets(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.isAdmin) {
      loadTickets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.isAdmin, token]);

  const onManaged = async () => {
    // Keep the modal open; just refresh the tickets list in the background
    await loadTickets();
  };

  if (!user?.isAdmin) {
    return (
      <div className="p-4 bg-red-900 border border-red-700 rounded-md text-red-200">
        Admin access required.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Support Tickets</h2>
        <button
          onClick={loadTickets}
          className="px-3 py-1 rounded-md bg-gray-700 text-gray-200 hover:bg-gray-600"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="text-gray-300">Loading tickets…</div>
      )}
      {error && (
        <div className="mb-3 p-3 bg-red-900 border border-red-700 rounded-md text-red-200">{error}</div>
      )}

      {!loading && tickets.length === 0 && (
        <div className="text-gray-400">No tickets found.</div>
      )}

      {!loading && tickets.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-800 rounded-lg">
            <thead>
              <tr className="text-left text-gray-300">
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Subject</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Priority</th>
                <th className="px-4 py-2">Severity</th>
                <th className="px-4 py-2">Updated</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-t border-gray-700">
                  <td className="px-4 py-2 text-gray-200 font-mono">{t.id.slice(0, 8)}</td>
                  <td className="px-4 py-2 text-gray-300">{t.userId}</td>
                  <td className="px-4 py-2 text-gray-100">{t.subject}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-1 rounded bg-gray-700 text-gray-200">{t.status}</span>
                  </td>
                  <td className="px-4 py-2 text-gray-300">{t.priority}</td>
                  <td className="px-4 py-2 text-gray-300">{t.severity}</td>
                  <td className="px-4 py-2 text-gray-400">{new Date(t.updatedAt).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => setSelectedTicketId(t.id)}
                      className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-500"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedTicketId && (
        <TicketAdminModal
          ticketId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          onUpdated={onManaged}
        />
      )}
    </div>
  );
};

export default TicketsAdmin;