import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ticketsApi } from '../api/tickets';
import type { Ticket, TicketComment, TicketHistory } from '../types/Ticket';

interface TicketDetailsModalProps {
  ticketId: string | null;
  onClose: () => void;
}

const badgeColor: Record<string, string> = {
  minor: 'bg-green-600',
  moderate: 'bg-yellow-600',
  major: 'bg-orange-600',
  critical: 'bg-red-600',
};

const statusColor: Record<string, string> = {
  submitted: 'bg-blue-600',
  opened: 'bg-indigo-600',
  in_progress: 'bg-yellow-600',
  waiting_customer: 'bg-orange-600',
  resolved: 'bg-green-600',
  closed: 'bg-gray-600',
};

const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({ ticketId, onClose }) => {
  const { token } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [history, setHistory] = useState<TicketHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!ticketId) return;
      setLoading(true);
      setError(null);
      try {
        if (!token) {
          setError('You must be logged in to view ticket details.');
          setLoading(false);
          return;
        }
        const data = await ticketsApi.getTicket(ticketId, token);
        setTicket({
          id: data.id,
          subject: data.subject,
          description: data.description,
          type: data.type,
          priority: data.priority,
          severity: data.severity,
          status: data.status,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
        setComments(data.comments || []);
        setHistory(data.history || []);
      } catch (err: any) {
        const message = err?.response?.data?.error || err?.message || 'Failed to load ticket details.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ticketId, token]);

  if (!ticketId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-white text-xl font-semibold">Ticket Details</h3>
              {ticket && (
                <p className="text-gray-400 text-xs mt-1">ID: {ticket.id}</p>
              )}
            </div>
            <button onClick={onClose} className="text-gray-300 hover:text-white">✕</button>
          </div>

          {loading && (
            <div className="text-gray-300 text-sm mt-4">Loading…</div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-red-700/30 border border-red-600 rounded text-red-200 text-sm">{error}</div>
          )}
          {ticket && (
            <div className="mt-4 space-y-4">
              <div className="bg-gray-800 border border-gray-700 rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-semibold">{ticket.subject}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-white text-xs capitalize ${statusColor[ticket.status]}`}>{ticket.status.replace('_', ' ')}</span>
                    <span className={`px-2 py-1 rounded text-white text-xs capitalize ${badgeColor[ticket.severity]}`}>{ticket.severity}</span>
                  </div>
                </div>
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{ticket.description}</p>
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <div className="text-gray-400">
                    <span className="text-gray-300">Type:</span> <span className="capitalize">{ticket.type.replace('_', ' ')}</span>
                  </div>
                  <div className="text-gray-400">
                    <span className="text-gray-300">Priority:</span> <span className="capitalize">{ticket.priority}</span>
                  </div>
                  <div className="text-gray-400">
                    <span className="text-gray-300">Created:</span> {new Date(ticket.createdAt).toLocaleString()}
                  </div>
                  <div className="text-gray-400">
                    <span className="text-gray-300">Updated:</span> {new Date(ticket.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800 border border-gray-700 rounded p-4">
                  <h5 className="text-white font-semibold mb-2">Comments</h5>
                  {comments.length === 0 ? (
                    <p className="text-gray-400 text-sm">No comments yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {[...comments]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((c) => (
                        <li key={c.id} className="border border-gray-700 rounded p-3">
                          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                            <span>User #{c.userId}</span>
                            <span>{new Date(c.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-gray-300 text-sm whitespace-pre-wrap">{c.content}</p>
                          {c.isInternal && (
                            <span className="mt-2 inline-block px-2 py-0.5 bg-yellow-700 text-yellow-200 text-xs rounded">Internal</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded p-4">
                  <h5 className="text-white font-semibold mb-2">History</h5>
                  {history.length === 0 ? (
                    <p className="text-gray-400 text-sm">No history yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {[...history]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((h) => (
                        <li key={h.id} className="border border-gray-700 rounded p-3">
                          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                            <span>By User #{h.changedById}</span>
                            <span>{new Date(h.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-gray-300 text-sm">
                            <span className="capitalize">{h.action}</span> {h.field} from <span className="font-mono">{h.oldValue ?? '—'}</span> to <span className="font-mono">{h.newValue}</span>
                          </p>
                          {h.description && (
                            <p className="text-gray-400 text-xs mt-1">{h.description}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetailsModal;