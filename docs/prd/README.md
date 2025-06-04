# 📘 Product Requirements Document (PRD)  
*HelioHoof – AI-Powered Equestrian Training Platform*

---

## 📑 Table of Contents
1. [Project Overview](#project-overview)  
2. [Goals & Success Metrics](#goals--success-metrics)  
3. [User Roles & Permissions](#user-roles--permissions)  
4. [Scope](#scope)  
   - 4.1 [Functional Requirements](#functional-requirements)  
   - 4.2 [Non-Functional Requirements](#non-functional-requirements)  
   - 4.3 [Out of Scope (v1)](#out-of-scope-v1)  
5. [User Experience & Design](#user-experience--design)  
6. [Technical Architecture](#technical-architecture)  
7. [Milestones & Release Plan](#milestones--release-plan)  
8. [Dependencies](#dependencies)  
9. [Risks & Mitigations](#risks--mitigations)  
10. [Appendix & Cross-References](#appendix--cross-references)

---

## Project Overview
**HelioHoof** is a mobile-first, multi-tenant, AI-native platform that enables riders, trainers, parents, and administrators to log, review, and analyse equestrian training sessions—initially focusing on **show-jumping**.

Key differentiators:
- Real-time **voice-first** logging (speech-to-text)  
- Instant **video capture & upload** for performance review  
- **LLM-driven analytics** generating actionable insights  
- Strict **role-based access** within isolated tenants  

---

## Goals & Success Metrics
| Category   | Goal                               | KPI / Metric                         | Target v1 |
|------------|------------------------------------|--------------------------------------|-----------|
| Adoption   | Seamless onboarding                | Avg. time to first logged session    | < 5 min   |
| Engagement | Routine usage                      | Weekly active riders                 | ≥ 70 %    |
| Accuracy   | Reliable data capture              | Transcription WER                    | ≤ 10 %    |
| Performance| Fast interactions                  | P95 page load on 4 G                 | < 3 s     |
| Business   | Monetisation                       | Paying tenants after 90 days         | ≥ 20 %    |

---

## User Roles & Permissions
| Role        | Responsibilities                                                                                 | Access Level         |
|-------------|--------------------------------------------------------------------------------------------------|----------------------|
| **Admin**   | Tenant creation, user invites, horse registry, role management, plan templates                  | Full tenant CRUD     |
| **Trainer** | Create training plans, review sessions, add feedback media, view analytics                       | Write (sessions), Read all |
| **Rider**   | Execute plans, log sessions, upload media, view personal analytics                               | Write own, Read own  |
| **Parent**  | Monitor child progress, receive milestone alerts                                                 | Read-only            |
| **System**  | AI services (Whisper, GPT)                                                                       | Service tokens       |

Detailed stories live in `/docs/user-stories/*.md` – e.g. Trainer stories.

---

## Scope

### Functional Requirements
ID | Epic | Description
---|------|------------
FR-01 | Authentication & RBAC | Email/password auth, social sign-in TBD. Convex Auth enforces tenant & role scopes.
FR-02 | Tenant Management | CRUD tenants, seed demo tenant, soft deletion (retention 30 d).
FR-03 | Horse & User Registry | Link horses ↔ riders ↔ trainers; import via CSV.
FR-04 | Session Logging | Jumping drill template: height (cm), refusals, drops, notes, tags.
FR-05 | Media Capture | In-app audio (MediaRecorder + Whisper), 60 s video clips, progress preview.
FR-06 | Analytics & Insights | Weekly stats, trend charts, GPT performance summary per rider & horse.
FR-07 | Notifications | Email/push: missed logs, milestone achievements.
FR-08 | Dashboard | Role-specific overview (KPIs, upcoming plans).
FR-09 | Settings | Units, dark/light theme, notification prefs.

> Acceptance criteria for each epic are specified alongside the user stories.

### Non-Functional Requirements
- **Mobile-first** (min breakpoint 360 px)  
- **Offline tolerance**: queue session logs until connection restored  
- **Scalability**: 1 k tenants, 50 k users, burst 100 concurrent uploads  
- **Security**: SOC-2 alignment; encrypted media at rest (Convex file storage)  
- **Accessibility**: WCAG 2.1 AA  
- **Internationalisation** ready (EN baseline)

### Out of Scope (v1)
- Dressage & cross-country drill templates  
- Payment / subscription management  
- Public video sharing & social feed  
- Native apps (PWA only in v1)

---

## User Experience & Design
Requirement | Detail
------------|-------
Navigation  | Bottom tab bar on mobile; sidebar on desktop
Dark Mode   | Default; auto-switch via `prefers-color-scheme`
Input Flow  | 3-tap log: Select horse → Start voice record → Save
Visuals     | Large tap targets (44 dp), Shadcn UI “New York” theme
Prototype   | Figma link (TBD in `/docs/design/`)

---

## Technical Architecture
Layer | Technology | Responsibility
------|------------|--------------
Frontend | Next.js (App Router), TypeScript, Tailwind, Shadcn UI | UI, media capture, offline queue
Backend  | Convex (data, auth, functions) | Multi-tenant persistence, subscriptions
AI Layer | Whisper, GPT-4o via LangChain  | Speech-to-text, analytics summarisation
Media    | MediaRecorder API → Convex files | Audio/video storage & delivery
CI/CD    | GitHub Actions → Vercel         | Lint, test, deploy
Observability | Sentry, Vercel Analytics   | Errors & performance metrics

Full diagrams & schema live in `/docs/technical/`.

---

## Milestones & Release Plan
Phase | Duration | Key Deliverables
------|----------|-----------------
M0 – Foundations | 2 w | Convex schema, auth, tenant CRUD, CI/CD
M1 – Core Logging | 3 w | Mobile log flow, horse registry, voice capture
M2 – Media & Analytics | 4 w | Video upload, GPT summaries, trainer dashboard
M3 – Beta | 2 w | Demo tenant, polished UI, bug bash
M4 – GA | 1 w | Docs, SOC-2 paperwork, marketing site

Progress tracked in `/TASKS.md`.

---

## Dependencies
- Convex ≥ 1.5  
- OpenAI Whisper & GPT APIs (rate-limit 10 RPS)  
- Vercel Pro plan  
- Figma design license  

---

## Risks & Mitigations
Risk | Impact | Probability | Mitigation
-----|--------|-------------|-----------
API rate limits | Delayed AI summaries | Medium | Queue & back-off, cache results
Spotty field connectivity | Data loss | High | Local queue w/ retry
Media storage costs | Cost overruns | Low | 100 MB cap + auto prune 90 d
Voice transcription errors | Insight accuracy | Medium | Manual edit option in log UI

---

## Appendix & Cross-References
Doc | Purpose
----|---------
User Stories | ../user-stories/README.md
Technical Specs | ../technical/README.md
Task Tracker | ../../TASKS.md
Design System | ../design/ (TBD)

*Document version: 1.0 • Last updated: 2025-06-04*