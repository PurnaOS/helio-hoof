# 🎟️ HelioHoof — User Stories Index  

Welcome to the central index for all **HelioHoof** user stories.  
This page provides a bird’s-eye view of every epic & feature planned for the platform, organized by user role with quick links to the full story sets.

---

## 📂 Story Collections by Role

| Role | Description | File |
|------|-------------|------|
| 🛡 **Admin** | Tenant, user, and horse management; system configuration | [admin-stories.md](./admin-stories.md) |
| 🧑‍🏫 **Trainer** | Designing plans, reviewing sessions, delivering feedback & analytics | [trainer-stories.md](./trainer-stories.md) |
| 🏇 **Rider** | Logging sessions, uploading media, tracking personal progress | [rider-stories.md](./rider-stories.md) |
| 👨‍👩‍👧 **Parent** | Monitoring child activity, receiving milestone updates | [parent-stories.md](./parent-stories.md) |

> Each file contains detailed stories written in the “As a \<role>, I want \<goal> so that \<benefit>” format, acceptance criteria, and priority tags.

---

## 🔖 Epic & Feature Summary

| Epic ID | Epic / Feature | Primary Roles | Detailed Stories |
|---------|----------------|---------------|------------------|
| **FR-01** | Authentication & RBAC | Admin, Trainer, Rider, Parent | All role files |
| **FR-02** | Tenant Management | Admin | [Admin Stories](./admin-stories.md#tenant-management) |
| **FR-03** | Horse & User Registry | Admin, Trainer | [Admin Stories](./admin-stories.md#horse-registry) |
| **FR-04** | Session Logging | Rider, Trainer | [Rider: Session Logging](./rider-stories.md#session-logging)<br/>[Trainer: Session Review](./trainer-stories.md#session-review--feedback) |
| **FR-05** | Media Capture & Upload | Rider, Trainer | [Rider: Media Capture](./rider-stories.md#media-capture)<br/>[Trainer: Media Management](./trainer-stories.md#media-management) |
| **FR-06** | Analytics & Insights | Trainer, Rider, Parent | [Trainer: Analytics](./trainer-stories.md#analytics--insights)<br/>[Rider: Personal Analytics](./rider-stories.md#personal-analytics)<br/>[Parent: Progress Monitoring](./parent-stories.md#progress-monitoring) |
| **FR-07** | Notifications | Trainer, Rider, Parent | Role-specific notification sections in each file |
| **FR-08** | Role Dashboards | All roles | Dashboard sections in each file |
| **FR-09** | Settings & Preferences | All roles | Settings subsections in each file |

---

## 🗺 Navigating the Stories

Stories are grouped by **epic** inside each role file, sorted by priority (P0 critical → P2 nice-to-have).  
Use the inline anchors (`#anchor`) in the summary table above for quick jumps.

---

## 🤝 Contributing & Updates

1. Add or modify stories in the appropriate `*-stories.md` file.  
2. Update the summary table here if you introduce a new epic or link.  
3. Keep acceptance criteria **clear and testable**.  
4. When merging, reference the corresponding issue/Jira ticket.

_Last updated: 2025-06-04_