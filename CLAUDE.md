# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Helio-Hoof is a Next.js 15 application with Bun runtime, focused on horse management and tracking. The application uses ShadCN/UI for the component library and follows modern React patterns with TypeScript.

## Technology Stack

- **Runtime**: Bun (latest stable)
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **UI Library**: ShadCN/UI with Tailwind CSS
- **Styling**: Tailwind CSS v3.4+ with CVA for variants
- **Icons**: Lucide React
- **State Management**: React Server Components + Context API/Zustand for client state

## Development Commands

Since this is a Bun-based project, use these commands:

```bash
# Install dependencies
bun install

# Development server
bun run dev

# Build for production
bun run build

# Run tests
bun test

# Lint code
bun run lint

# Type checking
bun run type-check

# Format code
bun run format
```

## Project Architecture

### Directory Structure
```
/app              # Next.js 15 App Router - pages, layouts, route handlers
/components       # Reusable UI components organized by feature/domain
  /ui             # ShadCN/UI base components
  /forms          # Form-specific components
  /layout         # Layout-related components
/lib              # Utility functions, constants, configurations
/hooks            # Custom React hooks for shared logic
/services         # External service integrations and API layers
/types            # Global TypeScript definitions and interfaces
/styles           # Global styles and Tailwind configuration
/public           # Static assets
/config           # Application configuration files
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

### Horse Management Domain

Based on git history, this application handles:
- Horse profile management with CRUD operations
- Tenant management and multi-tenancy
- User account management with role-based access
- Admin dashboard with activity stats and metrics
- Account deactivation with reason tracking

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

## Code Quality Standards

**TypeScript**:
- Strict mode enabled
- Proper type definitions for all props and functions
- No `any` types without justification
- Use type-safe environment variables

**Component Standards**:
- Use forwardRef for components that need DOM refs
- Implement proper prop interfaces
- Follow ShadCN/UI patterns for styling
- Use compound component patterns where appropriate

**API Routes**:
- RESTful endpoint structure
- Proper HTTP method usage
- Standardized error responses
- Input validation on all endpoints

## Testing Strategy

**Bun Test Runner**: Use Bun's native test runner for fast execution
- Unit tests for utility functions and hooks
- Component testing with React Testing Library patterns
- API route testing for backend functionality
- Integration tests for user workflows

**Coverage Targets**:
- 80% line coverage for business logic
- 70% coverage for UI components
- 90% coverage for utility functions

## Security Considerations

- Server-side validation for all inputs
- Proper sanitization to prevent XSS
- Role-based access control (RBAC)
- Secure session management
- Regular dependency audits with Bun

## Deployment

Primary deployment target is Vercel with optimization for:
- Serverless functions compatibility
- Edge runtime where appropriate
- Environment variable management
- Preview deployments for PRs

The application is designed to be stateless and horizontally scalable with proper session management and caching strategies.