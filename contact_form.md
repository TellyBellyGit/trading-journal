# Contact Form & Support Ticket System Design

## **DO NOT USE ANY ICONS IN THIS DEVELOPMENT AT ALL WHATSOEVER**

## Database Schema Design

### **Tickets Table:**
```sql
Ticket {
  id: String (UUID)
  subject: String
  description: Text
  type: Enum (query, feature_request, bug, billing, account, other)
  priority: Enum (low, medium, high, urgent)
  severity: Enum (minor, moderate, major, critical)
  status: Enum (submitted, opened, in_progress, waiting_customer, resolved, closed)
  
  // User relationships
  userId: Int (who submitted - customer)
  assignedToId: Int? (admin assigned to)
  
  // Timestamps
  createdAt: DateTime
  updatedAt: DateTime
  resolvedAt: DateTime?
  closedAt: DateTime?
}
```

### **Ticket History Table (Full Audit Trail):**
```sql
TicketHistory {
  id: String (UUID)
  ticketId: String
  changedById: Int (admin who made change)
  action: String (status_change, assignment, priority_change, etc.)
  field: String (status, assignedTo, priority, severity)
  oldValue: String?
  newValue: String
  description: String? ("Assigned to John Doe", "Changed from Open to In Progress")
  createdAt: DateTime
}
```

### **Ticket Comments/Replies:**
```sql
TicketComment {
  id: String (UUID)
  ticketId: String
  userId: Int (could be customer or admin)
  content: Text
  isInternal: Boolean (admin-only notes)
  createdAt: DateTime
}
```

## Frontend Components

### **Customer Side:**
- **Contact Form** - Submit new tickets with type/priority selection
- **My Tickets Dashboard** - Overview with status counts
- **Ticket List** - All their tickets with filters (status, type)
- **Ticket Detail** - Full conversation + **complete audit trail visible**
  - Shows all status changes, assignments, priority changes
  - Timeline view of all activity

### **Admin Side:**
- **Ticket Dashboard** - Stats by status, type, priority, severity
- **Ticket List** - Advanced filtering (assignee, type, priority, severity, status)
- **Ticket Detail** - Full management interface with:
  - **Manual "Send Email Notification" button** for each status change
  - Quick actions (assign, change status, set priority/severity)
  - Internal notes section
  - Full audit trail

## Enhanced Status Workflow

```
submitted → opened → in_progress → waiting_customer → resolved → closed
                  ↗ can skip directly to resolved
```

**With Manual Email Control:**
- Admin changes status → **"Notify Customer?" button appears**
- Admin can choose to send notification or work silently
- Button shows preview: *"Send email: Status changed from 'In Progress' to 'Resolved'"*

## Ticket Types & Priority Matrix

### **Types:**
- `query` - General questions, how-to
- `feature_request` - New feature suggestions
- `bug` - Software issues, errors
- `billing` - Payment, subscription issues
- `account` - Login, profile, access issues
- `other` - Miscellaneous

### **Priority vs Severity:**
- **Priority**: Business impact (low, medium, high, urgent)
- **Severity**: Technical impact (minor, moderate, major, critical)

Example: A cosmetic bug might be `severity: minor` but `priority: high` if it affects many users.

## Updated Key Features

1. **Manual Assignment Only** - Dropdown of admin users
2. **Discretionary Email Notifications** - Admin controls when to notify
3. **Full Customer Audit Visibility** - They see all changes made to their ticket
4. **Type-based Filtering** - Filter tickets by type for better organization
5. **Priority + Severity Tracking** - Better categorization for triage

## Email Notification System

### **Manual Email Triggers:**
- **"Send Update Email"** button on status changes
- **"Send Assignment Email"** when assigning ticket
- **"Send Resolution Email"** when marking resolved

### **Email Templates:**
- Status change: *"Your ticket #ABC123 status changed from 'Open' to 'In Progress'"*
- Assignment: *"Your ticket #ABC123 has been assigned to [Admin Name]"*
- Resolution: *"Your ticket #ABC123 has been resolved. Please review the solution."*

## Enhanced Admin Interface

### **Ticket Detail Page Actions:**
```
┌─ Ticket Actions ─────────────────────────┐
│ Status: [Dropdown] [Update & Notify]     │
│ Assign: [Admin Dropdown] [Assign]        │
│ Priority: [Dropdown] [Update]            │
│ Severity: [Dropdown] [Update]            │
└──────────────────────────────────────────┘
```

### **Audit Trail (Visible to Customer):**
```
Jan 15, 2:30 PM - Ticket submitted by John Doe
Jan 15, 3:45 PM - Status changed to 'Opened' by Admin
Jan 16, 9:15 AM - Assigned to Jane Smith by Admin  
Jan 16, 2:20 PM - Status changed to 'In Progress' by Jane Smith
Jan 17, 4:10 PM - Priority changed from 'Medium' to 'High' by Jane Smith
```

## Admin Dashboard Stats

```
┌─ Ticket Overview ────────────────────────┐
│ Total Open: 23      Urgent: 3           │
│ In Progress: 8      High: 7             │
│ Queries: 12         Bugs: 6             │
│ Features: 5         Billing: 3          │
└──────────────────────────────────────────┘
```

## Implementation Notes

- All data is user-scoped for multi-tenant isolation
- Customers can only see their own tickets
- Admins can see all tickets and make changes
- All status changes are logged with user and timestamp
- Email notifications are sent only when admin chooses to notify
- Full audit trail is visible to both customers and admins
- Manual assignment system with dropdown of admin users
- Type and priority/severity filtering for better organization

## DEVELOPMENT PLAN - PHASED APPROACH

### **Phase 1: Database Foundation** (1-2 hours)
**Goal:** Get the data structure in place
- Create Prisma schema for Tickets, TicketHistory, TicketComment tables
- Run database migration
- Create basic seed data for testing
- Test database relationships

**Deliverable:** Working database schema with test data

### **Phase 2: Basic Customer Contact Form** (2-3 hours)
**Goal:** Customers can submit tickets
- Create contact form component (subject, description, type, priority)
- Backend API endpoint to create tickets
- Basic form validation
- Success confirmation after submission

**Deliverable:** Customers can submit support tickets

### **Phase 3: Customer Ticket Viewing** (2-3 hours)
**Goal:** Customers can see their tickets
- "My Tickets" page with list of submitted tickets
- Basic ticket detail view (read-only for now)
- Simple status display
- Filter by status/type

**Deliverable:** Customers can view their ticket history

### **Phase 4: Admin Ticket Management** (3-4 hours)
**Goal:** Admins can manage tickets
- Add tickets section to admin dashboard
- Admin ticket list with all tickets
- Basic ticket detail view for admins
- Change status functionality
- Manual assignment dropdown

**Deliverable:** Admins can view and manage all tickets

### **Phase 5: Audit Trail & History** (2-3 hours)
**Goal:** Track all changes
- Implement TicketHistory logging for all changes
- Display audit trail on ticket detail pages
- Show "Changed by" and timestamps
- Make audit trail visible to customers

**Deliverable:** Complete change tracking and visibility

### **Phase 6: Comments & Communication** (2-3 hours)
**Goal:** Two-way conversation
- Add comment/reply system to tickets
- Internal notes for admins
- Comment history on ticket detail
- Basic comment threading

**Deliverable:** Full conversation functionality

### **Phase 7: Email Notifications** (2-3 hours)
**Goal:** Optional email notifications
- Email templates for ticket updates
- "Send Email" buttons for admins
- Integration with existing Resend email service  
- Email on ticket creation, status changes, assignments

**Deliverable:** Complete email notification system

### **Phase 8: Enhanced UI & Polish** (2-3 hours)
**Goal:** Better user experience
- Improved styling and layout
- Better filtering and search
- Dashboard statistics and counts
- Performance optimizations
- Mobile responsiveness

**Deliverable:** Production-ready ticket system

## DEVELOPMENT STRATEGY & CONTEXT FOR RESTART

### **Current Application Architecture:**
- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS (dark theme)
- **Backend:** Node.js + Express + TypeScript + Prisma ORM
- **Database:** PostgreSQL with comprehensive indexing
- **Authentication:** JWT-based auth with email verification
- **Email Service:** Resend integration (working - domain verified)
- **Deployment:** Frontend and Backend on Render
- **Ports:** Frontend (5173), Backend (3002)

### **Existing File Structure:**
```
backend/
├── src/routes/
│   ├── auth.ts (working - forgot password fixed)
│   ├── admin.ts (existing admin system)
│   ├── trades.ts
│   └── [other routes]
├── src/services/
│   └── emailService.ts (working with Resend)
├── prisma/schema.prisma (existing User, Trade, Subscription models)

frontend/
├── src/components/
│   ├── admin/ (existing admin dashboard)
│   ├── auth/ (working auth system)
│   └── [other components]
├── src/api/ (existing API service files)
├── src/config/api.ts (API_BASE_URL configuration)
```

### **Recent Fixes Completed:**
- ✅ Email verification working (Resend domain verified)
- ✅ Forgot password working end-to-end
- ✅ CORS configuration fixed for frontend-backend communication
- ✅ API configuration using environment variables properly

### **Development Strategy:**
- **Test after each phase** - Make sure everything works before moving on
- **Keep existing functionality intact** - No breaking changes to current app
- **Use existing patterns** - Follow current auth, admin, and API patterns
- **Start simple** - Add complexity gradually
- **Follow existing dark theme** and TailwindCSS styling
- **Integrate with existing admin system** in `/src/components/admin/`

### **Recommended Starting Point:**
**Phase 1 (Database Foundation)** - Create Prisma schema and migrations first

### **Key Technical Notes:**
- All ticket data must be user-scoped (userId foreign key)
- Use existing `authenticateToken` middleware for protected routes
- Follow existing API patterns in `/src/api/` directory
- Use existing `adminAPI` class pattern for admin endpoints
- Integrate with existing admin dashboard components
- Use existing email service for notifications
- Follow existing error handling and validation patterns

### **Current Status:** 
Ready to begin Phase 1 - Database schema creation. No code has been changed yet for the ticket system.