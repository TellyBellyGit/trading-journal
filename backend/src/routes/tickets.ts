import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

// All ticket routes require authentication
router.use(authenticateToken);

// Create a new ticket
router.post('/', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { subject, description, type, priority } = req.body || {};

    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required.' });
    }

    const ticket = await prisma.ticket.create({
      data: {
        subject,
        description,
        type,
        priority,
        // severity defaults to minor, status defaults to submitted (per schema)
        userId,
      },
    });

    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        changedById: userId,
        action: 'created',
        field: 'status',
        oldValue: null,
        newValue: 'submitted',
        description: 'Ticket submitted by user',
      },
    });

    return res.status(201).json(ticket);
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return res.status(500).json({ error: 'Failed to create ticket.' });
  }
});

// List tickets for the current user
router.get('/', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const tickets = await prisma.ticket.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        subject: true,
        type: true,
        priority: true,
        severity: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json(tickets);
  } catch (error: any) {
    console.error('Error listing tickets:', error);
    return res.status(500).json({ error: 'Failed to list tickets.' });
  }
});

// Get single ticket details (with comments and history)
// ----- Admin ticket management -----
// List all tickets (admin only) — must come BEFORE the generic '/:id' route
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        subject: true,
        type: true,
        priority: true,
        severity: true,
        status: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json(tickets);
  } catch (error: any) {
    console.error('Error listing all tickets (admin):', error);
    return res.status(500).json({ error: 'Failed to list tickets.' });
  }
});

// Get ticket details (admin bypasses owner check)
router.get('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            userId: true,
            content: true,
            isInternal: true,
            createdAt: true,
          },
        },
        history: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            changedById: true,
            action: true,
            field: true,
            oldValue: true,
            newValue: true,
            description: true,
            createdAt: true,
          },
        },
      },
    });

    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
    return res.json(ticket);
  } catch (error: any) {
    console.error('Error fetching ticket (admin):', error);
    return res.status(500).json({ error: 'Failed to fetch ticket.' });
  }
});

// Update ticket fields and optionally add a comment (admin only)
router.patch('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const adminId = req.user!.userId;
    const { id } = req.params;
    const { status, severity, priority, comment, internal } = req.body || {};

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        severity: true,
        priority: true,
      },
    });

    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });

    const updates: any = {};
    const historyEntries: Array<{
      ticketId: string;
      changedById: number;
      action: string;
      field: string | null;
      oldValue: string | null;
      newValue: string | null;
      description: string;
    }> = [];

    if (typeof status === 'string' && status !== ticket.status) {
      updates.status = status;
      historyEntries.push({
        ticketId: id,
        changedById: adminId,
        action: 'updated',
        field: 'status',
        oldValue: ticket.status,
        newValue: status,
        description: `Status updated to ${status}`,
      });
    }

    if (typeof severity === 'string' && severity !== ticket.severity) {
      updates.severity = severity;
      historyEntries.push({
        ticketId: id,
        changedById: adminId,
        action: 'updated',
        field: 'severity',
        oldValue: ticket.severity,
        newValue: severity,
        description: `Severity updated to ${severity}`,
      });
    }

    if (typeof priority === 'string' && priority !== ticket.priority) {
      updates.priority = priority;
      historyEntries.push({
        ticketId: id,
        changedById: adminId,
        action: 'updated',
        field: 'priority',
        oldValue: ticket.priority,
        newValue: priority,
        description: `Priority updated to ${priority}`,
      });
    }

    // Apply ticket updates if any
    let updatedTicket = null;
    if (Object.keys(updates).length > 0) {
      updatedTicket = await prisma.ticket.update({
        where: { id },
        data: updates,
      });

      // Write all history entries
      await prisma.$transaction(
        historyEntries.map((entry) => prisma.ticketHistory.create({ data: entry }))
      );
    }

    // Optionally add a comment
    if (typeof comment === 'string' && comment.trim().length > 0) {
      await prisma.ticketComment.create({
        data: {
          ticketId: id,
          userId: adminId,
          content: comment.trim(),
          isInternal: !!internal,
        },
      });

      await prisma.ticketHistory.create({
        data: {
          ticketId: id,
          changedById: adminId,
          action: 'commented',
          field: 'comment',
          oldValue: null,
          newValue: internal ? 'internal' : 'public',
          description: `Admin added ${internal ? 'internal' : 'public'} comment`,
        },
      });
    }

    // Return the updated ticket view
    const result = await prisma.ticket.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            userId: true,
            content: true,
            isInternal: true,
            createdAt: true,
          },
        },
        history: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            changedById: true,
            action: true,
            field: true,
            oldValue: true,
            newValue: true,
            description: true,
            createdAt: true,
          },
        },
      },
    });

    return res.json(result);
  } catch (error: any) {
    console.error('Error updating ticket (admin):', error);
    return res.status(500).json({ error: 'Failed to update ticket.' });
  }
});

// Generic route for fetching a single ticket must come AFTER admin routes
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true, userId: true, content: true, isInternal: true, createdAt: true,
          },
        },
        history: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true, changedById: true, action: true, field: true, oldValue: true, newValue: true, description: true, createdAt: true,
          },
        },
      },
    });

    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
    if (ticket.userId !== userId) return res.status(403).json({ error: 'Access denied.' });

    return res.json(ticket);
  } catch (error: any) {
    console.error('Error fetching ticket:', error);
    return res.status(500).json({ error: 'Failed to fetch ticket.' });
  }
});

export default router;