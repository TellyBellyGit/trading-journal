# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Starting the application:**
```bash
npm run dev  # Starts both frontend (port 5173) and backend (port 3002) concurrently
```

**Frontend development (from /frontend/):**
```bash
npm run dev      # Vite development server
npm run build    # TypeScript compilation + production build
npm run preview  # Preview production build
```

**Backend development (from /backend/):**
```bash
npm run dev         # Development server with nodemon
npm run build       # TypeScript compilation to dist/
npm run start       # Run production build
npm run db:generate # Generate Prisma client after schema changes
npm run db:push     # Push schema changes to database
```

## Architecture Overview

This is a **production-ready multi-user SaaS trading journal application**:

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS (dark theme)
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL with comprehensive indexing and performance optimization
- **Authentication**: Full JWT-based auth with email verification, password reset, account security
- **Subscriptions**: Stripe integration with usage tracking and tier management
- **Email Service**: Resend integration for transactional emails
- **Port Configuration**: Frontend (5173), Backend (3002)

## Key Project Structure

```
trading-journal/
├── frontend/               # React TypeScript frontend with dark theme
│   ├── src/components/    # UI components (Dashboard, AllTrades, auth components)
│   ├── src/components/auth/ # Complete authentication system
│   ├── src/pages/         # Page components (Admin, Dashboard, etc.)
│   ├── src/api/           # API communication layer
│   ├── src/contexts/      # React contexts (Auth, Settings, Stripe, etc.)
│   └── src/types/         # TypeScript type definitions
├── backend/               # Express API server
│   ├── src/routes/        # API route handlers (auth, trades, admin, etc.)
│   ├── src/utils/         # Business logic (auth security, duplicate detection)
│   ├── src/middleware/    # Auth middleware, rate limiting
│   ├── src/services/      # Email service, subscription service
│   ├── src/lib/           # Database singleton, utilities
│   ├── prisma/           # Database schema and migrations
│   └── scripts/          # Database seeding and migration scripts
```

## Database Architecture

**Database**: PostgreSQL with sophisticated schema and performance optimization

**Core Models:**
- **User**: Multi-user system with email verification, security features, admin roles
- **Broker**: Trading broker accounts with commission structures (user-scoped)
- **Trade**: Complete trade lifecycle with rich journaling and assessment system (user-scoped)
- **Note**: Rich text note-taking system (user-scoped)
- **Subscription**: Stripe-based subscription management with usage tracking
- **LoginHistory**: Comprehensive security audit trail

**Key Relationships:**
- All data is user-scoped for multi-tenant isolation
- Trades belong to Brokers and Users (foreign key relationships)
- Comprehensive indexing for performance (email, dates, user queries)

**Performance Features:**
- Database connection pool with warmup system
- Optimized queries with proper indexing
- Singleton Prisma client pattern
- Connection pool warming on server startup

## Authentication & Security System

**Authentication Flow:**
- JWT-based authentication with refresh tokens
- Email verification required for new accounts
- Password reset with secure token generation
- Account lockout after failed attempts
- Rate limiting on auth endpoints

**Security Features:**
- Account lockout (5 failed attempts = 15 minute lockout)
- Login history tracking with IP addresses
- Secure password hashing (bcrypt)
- Email verification tokens with expiration
- Password reset tokens with short expiration (15 minutes)
- Rate limiting on sensitive endpoints

**Key Auth Components:**
- `AuthContext`: React context for authentication state
- `AuthWrapper`: Route protection and auth flow management
- `EnhancedLogin`: Feature-rich login with security feedback
- `ForgotPassword`: Complete password reset flow
- `ResetPassword`: Token-based password reset

## Subscription System

**Stripe Integration:**
- Complete subscription lifecycle management
- Usage tracking per billing period
- Plan upgrades/downgrades
- Webhook handling for payment events
- Customer portal integration

**Subscription Tiers:**
- Free tier: Limited trades per month
- Pro tier: Unlimited trades + advanced features
- Usage tracking and enforcement

## Frontend Architecture

**Main Components:**
- `App.tsx` - Root component with authentication wrapper
- `TradingApp.tsx` - Main dashboard with multi-view navigation
- `AuthWrapper.tsx` - Authentication flow and route protection
- `AllTrades.tsx` - Trade listing with filtering, search, and assessment display
- `TradeDetails.tsx` - Rich text editor for notes, assessment input, and trade analysis
- `Dashboard.tsx` - Main dashboard with metrics and recent trades
- `Admin.tsx` - Administrative interface for user management

**State Management:**
- React Context for authentication, settings, and Stripe
- Component-level state with React hooks
- API calls centralized in respective API modules

**Key Features:**
- **Dark Theme**: Consistent dark UI throughout the application
- **Assessment System**: Brief trade evaluations with auto-save and display integration
- **Rich Text Editor**: Tiptap-based editor for detailed trade notes with image support
- **CSV Import System**: Sophisticated duplicate detection and trade import capabilities
- **Multi-broker Support**: Complete broker management with commission tracking
- **Responsive Design**: Mobile-friendly interface
- **Admin Dashboard**: User management, subscription oversight

## Backend Architecture

**API Design:**
- RESTful endpoints with resource-based structure
- Modular routing with separate route files
- Comprehensive error handling with proper HTTP status codes
- JWT middleware for protected routes
- Rate limiting for security

**Key Endpoints:**

**Authentication:**
- `POST /api/auth/login` - User login with security features
- `POST /api/auth/register` - User registration with email verification
- `POST /api/auth/forgot-password` - Password reset initiation
- `POST /api/auth/reset-password` - Password reset completion
- `GET /api/auth/me` - Current user information
- `GET /api/auth/initial-data` - Combined user + subscription + stats for fast loading

**Trading:**
- `GET /api/trades` - List trades with filtering and pagination
- `POST /api/trades` - Create new trade
- `GET /api/trades/dashboard` - Dashboard statistics and recent trades
- `POST /api/trades/import/*` - CSV import with duplicate detection
- `PATCH /api/trades/:id/notes` - Update trade notes (auto-save)
- `PATCH /api/trades/:id/assessment` - Update trade assessment (auto-save)

**Administration:**
- `GET /api/admin/users` - User management (admin only)
- `PATCH /api/admin/users/:id` - User account management
- `GET /api/admin/stats` - System-wide statistics

**Subscriptions:**
- `GET /api/subscriptions/status` - Current subscription status
- `POST /api/subscriptions/create-checkout` - Stripe checkout creation
- `POST /api/webhooks/stripe` - Stripe webhook handling

**Utility Classes:**
- `AuthSecurity` - Account lockout, login history, security monitoring
- `DuplicateDetection` - Sophisticated duplicate trade detection algorithms
- `SubscriptionService` - Stripe integration and usage tracking
- `EmailService` - Transactional email handling (Resend)

## Performance & Reliability

**Database Performance:**
- PostgreSQL connection pooling with singleton pattern
- Database warmup system that initializes both read and write paths
- Comprehensive indexing strategy
- Query optimization for user-scoped data

**Security & Monitoring:**
- Rate limiting on authentication endpoints
- Login history and security audit trails
- Account lockout mechanisms
- Email notifications for security events

**Error Handling:**
- Comprehensive error handling throughout the application
- Structured error responses
- Logging and monitoring capabilities

## Development Workflow

**Hot Reloading:**
- Frontend: Vite HMR for instant updates
- Backend: Nodemon with TypeScript compilation
- Database: Prisma client auto-generation on schema changes

**Database Operations:**
- Schema changes require `npm run db:generate` and `npm run db:push`
- Seeding scripts available in `backend/scripts/`
- PostgreSQL database configured via DATABASE_URL environment variable

**Environment Configuration:**
- Backend requires `.env` file with database, JWT, email, and Stripe configuration
- Frontend connects to backend API automatically

## User Workflow

**Authentication:**
- User registration with email verification required
- Secure login with account lockout protection
- Password reset via email with secure tokens
- Admin users have additional management capabilities

**Trading Journal:**
- Add trades via comprehensive trade form
- Rich text note-taking with image support
- Trade assessment system with auto-save
- CSV import with intelligent duplicate detection
- Multi-broker account management

**Analytics & Reporting:**
- Comprehensive dashboard with key metrics
- Advanced filtering and search capabilities
- Calendar view of trading activity
- Performance analytics and insights

**Subscription Management:**
- Usage tracking and limits enforcement
- Stripe-powered subscription management
- Plan upgrades and billing portal access

## Important Technical Notes

- **Multi-User Architecture**: All data is properly scoped to individual users
- **PostgreSQL Database**: Production-ready with proper indexing and performance optimization
- **Authentication Required**: All main features require user authentication
- **Subscription Enforcement**: Usage limits enforced based on subscription tier
- **Dark Theme**: Consistent dark UI design throughout the application
- **Performance Optimized**: Database warmup, connection pooling, and query optimization
- **Security First**: Comprehensive security features including rate limiting, account lockout, and audit trails
- **Email Integration**: Transactional emails for verification, password reset, and security notifications

## Environment Variables Required

Backend requires the following environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT token signing secret
- `JWT_REFRESH_SECRET` - Refresh token secret
- `RESEND_API_KEY` - Email service API key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `FRONTEND_URL` - Frontend URL for CORS and redirects

This is a production-ready, multi-user SaaS application with comprehensive authentication, subscription management, and security features.