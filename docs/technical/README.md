# 🛠️ HelioHoof Technical Specification  
*(docs/technical/README.md)*  

---

## 📑 Table of Contents
1. [High-Level Architecture](#high-level-architecture)  
2. [Database Schema](#database-schema)  
3. [API Design](#api-design)  
4. [AI Integration](#ai-integration)  
5. [Security Considerations](#security-considerations)  
6. [Development Guidelines](#development-guidelines)  
7. [Cross-References](#cross-references)  

---

## High-Level Architecture

Layer | Technology | Responsibility
------|------------|---------------
Client | **Next.js (App Router)** · TypeScript · Tailwind · Shadcn UI | UI rendering, media capture (MediaRecorder), optimistic updates, offline queue
API Gateway | **Convex Functions** | Single entry-point for data ops & auth
Backend | **Convex Database & File Storage** | Multi-tenant persistence, real-time subscriptions, media blobs
AI Services | **OpenAI Whisper** · **GPT-4o via LangChain** | Speech-to-text, analytics summarisation, goal suggestions
CDN | Vercel Edge · Cloudflare (media) | Static asset & video delivery
Auth | **Convex Auth** | Email/password login, role-based JWT, tenant scoping
Observability | Sentry · Convex logs · Vercel Analytics | Error tracking, performance metrics
CI/CD | GitHub Actions → Vercel preview/main | Lint, test, type-check, e2e, deploy

Data Flow (happy path):
1. Rider records voice → **Client** streams blob to **Convex file**.
2. Convex mutation stores `session` row referencing `fileId`.
3. Background job triggers Whisper → transcript saved back to row.
4. `session_subscribe` query pushes live update to Trainer UI.
5. Nightly cron summarises sessions via GPT-4o → cached in `analyticsSummary`.

---

## Database Schema (Convex)

> Canonical source lives in `convex/schema.ts` and auto-generates `dataModel.d.ts`.

Table | Key Fields | Notes
------|------------|------
`users` | `_id`, `authId`, `email`, `name`, `roles`[] | Roles: `{tenantId, role}`
`tenants` | `_id`, `name`, `logoUrl`, `isDemo`, `deletedAt?` | Soft delete
`horses` | `_id`, `tenantId`, `name`, `dob`, `breed`, `status`, `avatarUrl?`
`trainingPlans` | `_id`, `tenantId`, `title`, `drills`[], `archived`
`sessions` | `_id`, `tenantId`, `horseId`, `riderId`, `trainerId?`, `metrics`{height, refusals, drops}, `notes`, `location`, `tags`[], `media`[], `needsRevision`, `deletedAt?`
`media` | `_id`, `ownerId`, `sessionId?`, `type`("audio"/"video"), `fileId`, `thumbnailUrl?`, `transcript?`
`analyticsSummary` | `_id`, `tenantId`, `subjectType`, `subjectId`, `weekISO`, `gptSummary`, `cachedAt`
`notifications` | `_id`, `userId`, `type`, `payload`, `read`
`auditLogs` | `_id`, `tenantId`, `action`, `actorId`, `details`, `ts`

Index strategy: compound (`tenantId`, `createdAt`) on high-volume tables (`sessions`, `media`) for feed queries.

Soft-delete policy: purge job removes records >30 days where `deletedAt` IS NOT NULL.

---

## API Design

HelioHoof relies on **Convex Functions** (TypeScript) for RPC-style calls.

### Naming Convention
`<noun>_<verb>` (e.g., `session_create`, `media_upload`, `analytics_getWeekly`).

### Example Mutation
```ts
export const session_create = mutation({
  args: {
    horseId: v.id("horses"),
    metrics: v.object({
      height: v.float64(),
      refusals: v.int32(),
      drops: v.int32()
    }),
    notes: v.string(),
    location: v.string(),
    mediaIds: v.array(v.id("media"))
  },
  handler: async (ctx, args) => {
    assertRole(ctx, args.tenantId, ["rider", "trainer"]);
    await ctx.db.insert("sessions", { ...args, tenantId: ctx.tenantId });
  }
});
```

### HTTP Routes
Purpose | Method | Path | Notes
--------|--------|------|------
Auth callbacks | POST | `/api/convex/auth/*` | Auto-generated
Webhook (future payments) | POST | `/api/webhooks/stripe` | v2 roadmap

_All other traffic uses Convex WebSocket; no REST layer required._

---

## AI Integration

Component | Service | Trigger | Output Storage
----------|---------|---------|---------------
Voice → Text | OpenAI Whisper large-v3 | On audio upload | `media.transcript`
Session Summary | GPT-4o via LangChain | Nightly cron / on-demand | `analyticsSummary.gptSummary`
Goal Suggestion | GPT-4o | Goal creation / weekly digest | UI cache (`suggestions` query)

Guidelines:
- **Idempotency** via `jobKey = subjectId + period`.
- Exponential back-off on 429; errors logged in `aiErrorLog`.
- Token budget: truncate transcripts to ≤3 k tokens before prompt.

---

## Security Considerations

Area | Measure
-----|--------
Authentication | Convex Auth JWT; refresh 7 d; 2FA roadmap
Authorization | Helper `assertRole(ctx, tenantId, roles[])` in every function
Data Isolation | Server-side filter on `tenantId`; verified in queries/mutations
Transport | HTTPS enforced; WebSocket upgrade via TLS
At-Rest Encryption | Convex file storage AES-256; DB encryption managed by Convex
Media Access | Signed URLs (1 h) with tenant ACL
OWASP | `npm audit` + Snyk in CI pipeline
GDPR | Data export `/exports` & delete endpoints; DPA with OpenAI
Logging | PII scrubbed; `auditLogs` immutable

---

## Development Guidelines

Topic | Convention
------|-----------
Language | **100 % TypeScript**; `strict` mode ON
Package Manager | `pnpm`
Linting | ESLint (Airbnb + Prettier)
Testing | Jest (unit) · Playwright (e2e) — 80 % coverage target
Commits | Conventional Commits (feat/fix/chore) + semantic-release
Branching | Trunk-based → `feat/<ticket>` branches, PR review required
Env Mgmt | `.env.example` tracked; secrets via GitHub Actions
Feature Flags | `lib/flags.ts` toggles per tenant
CI/CD | GitHub Actions → `pnpm lint test type-check build` → Vercel
Observability | Sentry DSN & release injected at build; Grafana dashboard for Convex logs
Performance Budgets | P95 TTI < 3 s; bundle ≤ 250 kB gzipped

---

## Cross-References

Doc | Purpose
----|---------
Product Requirements | ../prd/README.md
User Stories | ../user-stories/README.md
Convex Schema | ../../convex/schema.ts
Task Tracker | ../../TASKS.md

---

_Last updated: 2025-06-04_
