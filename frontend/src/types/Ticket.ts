export type TicketType = 'query' | 'feature_request' | 'bug' | 'billing' | 'account' | 'other';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketSeverity = 'minor' | 'moderate' | 'major' | 'critical';
export type TicketStatus = 'submitted' | 'opened' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  type: TicketType;
  priority: TicketPriority;
  severity: TicketSeverity;
  status: TicketStatus;
  // Present in admin listings; optional for user-facing lists
  userId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewTicketPayload {
  subject: string;
  description: string;
  type: TicketType;
  priority: TicketPriority;
}

export interface TicketComment {
  id: string;
  userId: number;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface TicketHistory {
  id: string;
  changedById: number;
  action: string;
  field: string;
  oldValue?: string | null;
  newValue: string;
  description?: string | null;
  createdAt: string;
}