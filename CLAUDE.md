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
- **Trade**: Complete trade lifecycle with entry/exit data, P&L calculations, rich journaling fields, and assessment system

**Key Relationships:**
- Trades belong to Brokers (foreign key relationship)
- Each trade includes comprehensive metadata (strategy, notes, risk/reward, tags, assessment)

**Assessment System:**
- Brief trade assessments editable in TradeDetails with auto-save
- Assessment display in AllTrades with truncated view and hover tooltips
- Dedicated API endpoints: `PATCH /api/trades/:id/assessment`

## Frontend Architecture

**Main Components:**
- `App.tsx` - Multi-view dashboard with state-based navigation and unified Add Trade workflow
- `AppShell.tsx` - Layout wrapper with sidebar navigation and "+ Add Trade" header button
- `AllTrades.tsx` - Trade listing with filtering, search, and assessment display
- `TradeDetails.tsx` - Rich text editor for notes, assessment input, and trade analysis
- `EditTrade.tsx` - Trade editing with smart content detection for rich vs plain text
- `AnalyticsDashboard.tsx` - Comprehensive analytics with collapsible sections
- `TradingCalendar.tsx` - Calendar-based trade visualization

**State Management:**
- Component-level state with React hooks
- No global state management system
- API calls centralized in `/api/trades.ts`

**Key Features:**
- **Assessment System**: Brief trade evaluations with auto-save and display integration
- **Smart Content Handling**: EditTrade detects rich content (images/HTML) and provides appropriate editing experience
- **Unified Add Trade**: Single "+ Add Trade" button in header that works across all pages
- **Collapsible Analytics**: Trading Analytics Dashboard with grouped expand/collapse controls
- **Rich Text Editor**: Tiptap-based editor for detailed trade notes with image support
- **CSV Import System**: Sophisticated duplicate detection and trade import capabilities
- **Multi-broker Support**: Complete broker management with commission tracking

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
- `PATCH /api/trades/:id/notes` - Update trade notes (auto-save)
- `PATCH /api/trades/:id/assessment` - Update trade assessment (auto-save)

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

## User Workflow

**Adding Trades:**
- Click "+ Add Trade" button in header (available on all pages)
- Automatically navigates to AllTrades view and opens EditTrade form
- Complete trade entry with all required fields

**Trade Analysis:**
- Click any symbol in AllTrades to open TradeDetails view
- Add detailed notes using rich text editor (supports images, formatting)
- Add brief assessment in header input box with auto-save
- Assessment appears in AllTrades with hover tooltips for full text

**Analytics Review:**
- Navigate to Trading Analytics Dashboard
- Use Expand/Collapse button (next to Refresh) to show/hide all metric sections
- Collapsible sections: Key Performance Indicators, Detailed Analytics, Capital & Trading Volume

## Important Notes

- The application uses SQLite for simplicity - no external database setup required
- Multiple App.tsx variants exist (App_Wed.tsx, App_backup.tsx) indicating active development
- Archive components contain previous implementations for reference
- No authentication system currently implemented
- **Rich Content Detection**: EditTrade automatically detects notes with images/HTML and provides appropriate editing guidance
- **Auto-save Functionality**: Notes and assessments save automatically with debounced API calls