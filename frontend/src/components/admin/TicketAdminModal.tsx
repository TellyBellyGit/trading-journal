import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ticketsApi } from '../../api/tickets';
import type { Ticket, TicketPriority, TicketSeverity, TicketStatus, TicketComment, TicketHistory } from '../../types/Ticket';

interface TicketAdminModalProps {
  ticketId: string;
  onClose: () => void;
  onUpdated: () => void;
}

const statusOptions: TicketStatus[] = ['submitted', 'opened', 'in_progress', 'waiting_customer', 'resolved', 'closed'];
const severityOptions: TicketSeverity[] = ['minor', 'moderate', 'major', 'critical'];
const priorityOptions: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];

const TicketAdminModal: React.FC<TicketAdminModalProps> = ({ ticketId, onClose, onUpdated }) => {
  const { token } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [history, setHistory] = useState<TicketHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<TicketStatus>('submitted');
  const [severity, setSeverity] = useState<TicketSeverity>('minor');
  const [priority, setPriority] = useState<TicketPriority>('low');
  const [comment, setComment] = useState<string>('');
  const [internal, setInternal] = useState<boolean>(false);

  const loadTicket = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await ticketsApi.getTicketAdmin(ticketId, token);
      setTicket(data as Ticket);
      setComments((data.comments || []) as TicketComment[]);
      setHistory((data.history || []) as TicketHistory[]);
      setStatus(data.status as TicketStatus);
      setSeverity(data.severity as TicketSeverity);
      setPriority(data.priority as TicketPriority);
    } catch (err: any) {
      setError(err?.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, token]);

  const handleSave = async () => {
    if (!token || !ticket) return;
    try {
      setLoading(true);
      await ticketsApi.updateTicketAdmin(
        ticket.id,
        { status, severity, priority, comment: comment.trim(), internal },
        token
      );
      await loadTicket();
      onUpdated();
    } catch (err: any) {
      setError(err?.message || 'Failed to update ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Manage Ticket</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-white">✕</button>
        </div>

        {loading && <div className="text-gray-300">Loading…</div>}
        {error && <div className="mb-3 p-3 bg-red-900 border border-red-700 rounded-md text-red-200">{error}</div>}

        {ticket && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-md p-4">
              <div className="text-gray-200 font-semibold mb-1">{ticket.subject}</div>
              <div className="text-gray-400 mb-2">{ticket.description}</div>
              <div className="flex space-x-3 text-sm text-gray-300">
                <span>Type: {ticket.type}</span>
                <span>Priority: {ticket.priority}</span>
                <span>Severity: {ticket.severity}</span>
                <span>Status: {ticket.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Status</label>
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-200"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TicketStatus)}
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Severity</label>
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-200"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as TicketSeverity)}
                >
                  {severityOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Priority</label>
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-200"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                >
                  {priorityOptions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Admin Comment</label>
              <textarea
                className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-200"
                rows={3}
                placeholder="Add a note for the user or internal note"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <label className="inline-flex items-center mt-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={internal}
                  onChange={(e) => setInternal(e.target.checked)}
                  className="mr-2"
                />
                Mark as internal (not visible to user)
              </label>
            </div>

            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={onClose}
                className="px-3 py-2 rounded-md bg-gray-700 text-gray-200 hover:bg-gray-600"
              >
                Close
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500"
              >
                Save Changes
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-md p-4">
                <h4 className="text-gray-200 font-semibold mb-2">Comments</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {comments.length === 0 && (
                    <div className="text-gray-400">No comments</div>
                  )}
                  {[...comments]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((c) => (
                    <div key={c.id} className="border border-gray-700 rounded-md p-2">
                      <div className="text-gray-300 text-sm">By {c.userId} • {new Date(c.createdAt).toLocaleString()}</div>
                      {c.isInternal && (
                        <div className="text-xs text-yellow-400">Internal</div>
                      )}
                      <div className="text-gray-200 mt-1">{c.content}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-800 rounded-md p-4">
                <h4 className="text-gray-200 font-semibold mb-2">History</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {history.length === 0 && (
                    <div className="text-gray-400">No history</div>
                  )}
                  {[...history]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((h) => (
                    <div key={h.id} className="border border-gray-700 rounded-md p-2 text-sm text-gray-300">
                      <div>
                        <span className="font-mono">{new Date(h.createdAt).toLocaleString()}</span> • {h.action}
                        {h.field && (
                          <span> {h.field}: {h.oldValue ?? ''} → {h.newValue}</span>
                        )}
                      </div>
                      {h.description && (
                        <div className="text-gray-400 mt-1">{h.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketAdminModal;