# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Helio-Hoof is a Next.js 15 application focused on equestrian analysis using AI-powered image analysis. The application provides detailed analysis of horse and rider performance through uploaded images, with features for analysis history, PDF export, and multi-image comparisons. It uses modern React patterns with TypeScript and follows a server-first architecture.

## Technology Stack

- **Runtime**: Next.js 15 with App Router (Node.js, not Bun)
- **Language**: TypeScript (strict mode)
- **UI Library**: ShadCN/UI with Tailwind CSS v4
- **Styling**: Tailwind CSS v4 with CVA for variants
- **Icons**: Lucide React
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Clerk
- **AI Integration**: Anthropic API with Claude
- **PDF Generation**: React-PDF and jsPDF
- **Code Quality**: Biome (linting and formatting)
- **Testing**: Playwright for E2E tests

## Development Commands

**Important**: This project uses npm/Node.js, not Bun (despite the CLAUDE.md mentioning Bun):

```bash
# Install dependencies
npm install

# Development server (with Turbopack)
npm run dev

# Build for production
npm run build

# Production server
npm start

# Lint and format with Biome
npm run lint
npm run format

# Database commands
npm run db:generate    # Generate migrations
npm run db:push       # Push schema to database
npm run db:studio     # Open Drizzle Studio

# E2E Testing
npm run test:e2e      # Run Playwright tests
npm run test:e2e:ui   # Run with UI

# Development setup
npm run setup:dev     # Initial development setup
```

## Project Architecture

### Directory Structure
```
/src              # Main source directory
  /app            # Next.js 15 App Router - pages, layouts, API routes
    /api          # API route handlers for image analysis and history
    /history      # Analysis history pages
    /sign-in      # Clerk authentication pages
    /sign-up      # Clerk authentication pages
  /components     # Reusable UI components
    /ui           # ShadCN/UI base components
    /auth         # Authentication-related components
  /lib            # Utility functions and configurations
    /db           # Database schema and connection (Drizzle)
  /middleware.ts  # Next.js middleware for auth
```

### Key Architectural Patterns

**Server-First Approach**: Leverage React Server Components for initial data loads and use client components only when necessary for interactivity.

**Data Fetching Strategy**:
- Server Components for initial data
- Parallel data fetching with Promise.all
- Streaming with Suspense boundaries
- Optimistic UI updates with proper rollback

**State Management**:
- Server state via React Server Components
- Client state via useState/useReducer for local state
- Context API for cross-component communication
- Consider Zustand for complex global state

**Component Design**:
- Build on ShadCN/UI components as base
- Use CVA (Class Variance Authority) for component variants
- Implement proper TypeScript interfaces for all props
- Follow accessibility best practices (WCAG AA compliance)

### Equestrian Analysis Domain

This application provides:
- **AI-Powered Image Analysis**: Upload images of horses and riders for detailed performance analysis using Anthropic's Claude API
- **Single & Multi-Image Analysis**: Analyze individual images or compare multiple images for progression tracking
- **Analysis History**: Store and retrieve past analyses with full details
- **PDF Export**: Generate detailed PDF reports with analysis results, scores, and recommendations
- **Mock Development Mode**: Development-friendly mock API responses to avoid costs during development
- **Authentication**: User management via Clerk with protected routes

### Theme System

The application supports:
- Dark/Light/System theme modes
- CSS variables for dynamic theming
- Theme persistence across sessions
- Smooth theme transitions

### Performance Requirements

Target Core Web Vitals:
- LCP < 2.0s
- FID < 100ms
- CLS < 0.05
- TTFB < 600ms

Optimization strategies:
- Route-based code splitting
- Image optimization with Next.js Image component
- Font optimization with next/font
- Static page caching and API response caching

## Key Features Implementation

### Mock Development Mode
The application includes a sophisticated mock system for development:
- Set `USE_MOCK_LLM=true` in `.env.local` to avoid API costs
- Mock responses in `src/lib/mock-anthropic.ts` provide realistic analysis data
- Development configuration utilities in `src/lib/dev-config.ts`
- See `DEVELOPMENT.md` for detailed setup instructions

### API Routes
- `/api/analyze-image` - Single image analysis
- `/api/analyze-images` - Multi-image analysis with comparison
- `/api/analysis-history` - CRUD operations for analysis history
- `/api/analysis-history/[id]` - Individual analysis retrieval

### Database Schema
- PostgreSQL with Drizzle ORM
- Schema defined in `src/lib/db/schema.ts`
- Connection handling in `src/lib/db/index.ts`

## Code Quality Standards

**Formatting & Linting**:
- Biome for code formatting and linting (replaces ESLint/Prettier)
- Configuration in `biome.json`
- Run `npm run lint` for checking, `npm run format` for auto-formatting

**TypeScript**:
- Strict mode enabled in `tsconfig.json`
- Path aliases configured (`@/*` maps to `./src/*`)
- Proper type definitions for all API responses and component props

## Environment Configuration

### Required Environment Variables
```bash
# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Database
DATABASE_URL=

# AI Integration
ANTHROPIC_API_KEY=              # Required for production
USE_MOCK_LLM=true               # Set to false for production

# Next.js
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### Development Setup
1. Copy `.env.development` to `.env.local` for mock mode
2. Set up Clerk authentication keys
3. Configure PostgreSQL database URL
4. Run `npm run setup:dev` for initial setup
5. Use `npm run db:push` to sync database schema

## Security Considerations

- Clerk handles authentication and user management
- Server-side validation for all API inputs
- Environment variables for sensitive data
- Protected API routes with authentication middleware
- Secure image upload handling