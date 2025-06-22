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

This is a **full-stack monorepo** trading journal application:

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: SQLite with Prisma schema at `backend/prisma/schema.prisma`
- **Port Configuration**: Frontend (5173), Backend (3002)

## Key Project Structure

```
trading-journal/
├── frontend/               # React TypeScript frontend
│   ├── src/components/    # UI components (Dashboard, AllTrades, etc.)
│   ├── src/pages/         # Page components
│   ├── src/api/           # API communication layer
│   └── src/types/         # TypeScript type definitions
├── backend/               # Express API server
│   ├── src/routes/        # API route handlers
│   ├── src/utils/         # Business logic classes
│   ├── prisma/           # Database schema and migrations
│   └── scripts/          # Database seeding scripts
```

## Database Schema

**Core Models:**
- **Broker**: Trading broker accounts with commission structures
- **Trade**: Complete trade lifecycle with entry/exit data, P&L calculations, and rich journaling fields

**Key Relationships:**
- Trades belong to Brokers (foreign key relationship)
- Each trade includes comprehensive metadata (strategy, notes, risk/reward, tags)

## Frontend Architecture

**Main Components:**
- `App.tsx` - Multi-view dashboard with state-based navigation
- `AppShell.tsx` - Layout wrapper with sidebar navigation
- `AllTrades.tsx` - Trade listing with filtering and search
- `Dashboard.tsx` - Original metrics and overview
- `TradingCalendar.tsx` - Calendar-based trade visualization

**State Management:**
- Component-level state with React hooks
- No global state management system
- API calls centralized in `/api/trades.ts`

**Key Features:**
- CSV import system with duplicate detection
- Rich text editor (Tiptap) for trade notes
- Multiple dashboard views with comprehensive analytics
- Multi-broker support with commission tracking

## Backend Architecture

**API Design:**
- RESTful endpoints with resource-based structure
- Modular routing with separate route files
- Comprehensive error handling with proper HTTP status codes

**Key Endpoints:**
- `GET /api/trades` - List trades with broker information
- `POST /api/trades` - Create new trade
- `GET /api/trades/stats` - Trading statistics and metrics
- `POST /api/trades/import/*` - CSV import and processing

**Utility Classes:**
- `DuplicateDetection` - Sophisticated duplicate trade detection algorithms
- `TradeAnalyzer` - Trade matching and analysis business logic
- CSV processing utilities for file parsing and validation

## Development Workflow

**Hot Reloading:**
- Frontend: Vite HMR for instant updates
- Backend: Nodemon with TypeScript compilation
- Database: Prisma client auto-generation on schema changes

**Database Operations:**
- Schema changes require `npm run db:generate` and `npm run db:push`
- Seeding scripts available in `backend/scripts/`
- SQLite database file located at `backend/dev.db`

## Important Notes

- The application uses SQLite for simplicity - no external database setup required
- Multiple App.tsx variants exist (App_Wed.tsx, App_backup.tsx) indicating active development
- Archive components contain previous implementations for reference
- No authentication system currently implemented
- Rich journaling capabilities with strategy notes, risk/reward analysis, and tagging system