import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ticketsApi } from '../api/tickets';
import type { TicketType, TicketPriority } from '../types/Ticket';
import MyTickets from './MyTickets';
import TicketDetailsModal from './TicketDetailsModal';

const SupportContact: React.FC = () => {
  const { token } = useAuth();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TicketType>('query');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [successTicketId, setSuccessTicketId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessTicketId(null);
    setErrorMessage(null);

    try {
      if (!token) {
        setErrorMessage('You must be logged in to submit a ticket.');
        setSubmitting(false);
        return;
      }

      const ticket = await ticketsApi.createTicket({ subject, description, type, priority }, token);
      setSuccessTicketId(ticket.id);
      setSubject('');
      setDescription('');
      setType('query');
      setPriority('medium');
    } catch (err: any) {
      const generic = 'Failed to submit ticket. Please try again later.';
      const message = err?.response?.data?.error || err?.message || generic;
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-white text-xl font-semibold mb-2">Support</h2>
        <p className="text-gray-300 text-sm mb-6">Submit a support request to our team and view your ticket history.</p>

        {successTicketId && (
          <div className="mb-4 p-3 bg-green-700/30 border border-green-600 rounded text-green-200 text-sm">
            Ticket submitted successfully. Reference ID: {successTicketId}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-700/30 border border-red-600 rounded text-red-200 text-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Brief summary of your request"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
              className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Provide details so we can help effectively"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TicketType)}
                className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="query">General Question</option>
                <option value="feature_request">Feature Request</option>
                <option value="bug">Bug Report</option>
                <option value="billing">Billing</option>
                <option value="account">Account</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit Ticket'}
            </button>
          </div>
        </form>

        {/* Tickets List */}
        <MyTickets onOpenDetails={(id) => setOpenTicketId(id)} />
      </div>

      {/* Details Modal */}
      {openTicketId && (
        <TicketDetailsModal ticketId={openTicketId} onClose={() => setOpenTicketId(null)} />
      )}
    </div>
  );
};

export default SupportContact;