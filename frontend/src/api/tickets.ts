import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import type { NewTicketPayload, Ticket } from '../types/Ticket';

export const ticketsApi = {
  async createTicket(payload: NewTicketPayload, token: string): Promise<Ticket> {
    const url = `${API_BASE_URL}/tickets`;
    const res = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  },

  async listMyTickets(token: string): Promise<Ticket[]> {
    const url = `${API_BASE_URL}/tickets`;
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  },

  async getTicket(id: string, token: string): Promise<any> {
    const url = `${API_BASE_URL}/tickets/${id}`;
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  },

  // ----- Admin endpoints -----
  async listAllTicketsAdmin(token: string): Promise<Ticket[]> {
    const url = `${API_BASE_URL}/tickets/admin`;
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  },

  async getTicketAdmin(id: string, token: string): Promise<any> {
    const url = `${API_BASE_URL}/tickets/admin/${id}`;
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  },

  async updateTicketAdmin(
    id: string,
    payload: { status?: string; severity?: string; priority?: string; comment?: string; internal?: boolean },
    token: string
  ): Promise<Ticket> {
    const url = `${API_BASE_URL}/tickets/admin/${id}`;
    const res = await axios.patch(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  },
};

export default ticketsApi;