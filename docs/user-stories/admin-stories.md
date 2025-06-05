# 🛡 Admin User Stories – HelioHoof  
*(Role-based backlog for the Administrator persona)*  

---

## 📑 Index
1. [Tenant Management](#tenant-management)  
2. [User Management](#user-management)  
3. [Horse Registry](#horse-registry)  
4. [System Configuration](#system-configuration)  
5. [Admin Dashboard & Reporting](#admin-dashboard--reporting)  

---

### Legend
Column | Description
-------|------------
ID | Unique story identifier
Story | “As a … I want … so that …” statement
Acceptance Criteria | Bullet list of testable conditions
Prio | Priority (P0 = Blocker, P1 = High, P2 = Normal)
SP | Estimated effort in Story Points (Fibonacci)

---

## 🏢 Tenant Management
| ID | Story | Acceptance Criteria | Prio | SP |
|----|-------|---------------------|------|----|
| TM-01 | As an **Admin**, I want to **create a new tenant** so that I can onboard a new organization. | • Form validates required fields (name, industry).<br/>• New `tenantId` generated in Convex.<br/>• Creator auto-assigned Admin role.<br/>• Success toast and redirect to tenant settings page. | P0 | 5 |
| TM-02 | As an Admin, I want to **view a paginated list of all tenants** so that I can quickly access any tenant record. | • List sortable by name & created date.<br/>• Search filter returns results in <300 ms.<br/>• Each row links to detail page. | P1 | 3 |
| TM-03 | As an Admin, I want to **edit tenant details** (logo, contact info) so that data remains current. | • Inline image upload (≤1 MB).<br/>• Validation on email/URL fields.<br/>• Changes persist without page reload. | P1 | 5 |
| TM-04 | As an Admin, I want to **soft-delete a tenant** so that we can disable but recover it within 30 days. | • Delete sets `deletedAt` timestamp.<br/>• Tenant hidden from default lists.<br/>• “Restore” action available until purge job runs. | P0 | 3 |
| TM-05 | As an Admin, I want to **seed a demo tenant with sample data** so that prospects can explore the app. | • Button generates riders, horses, sessions.<br/>• Flagged `isDemo=true` in DB.<br/>• Demo expires after 14 days auto. | P2 | 8 |

---

## 👤 User Management
| ID | Story | Acceptance Criteria | Prio | SP |
|----|-------|---------------------|------|----|
| UM-01 | As an Admin, I want to **invite a user via email** with a selected role so that they can access the platform. | • Email format validation.<br/>• Invitation token valid 48 h.<br/>• Role set on accept.<br/>• “Pending” status shown until activation. | P0 | 5 |
| UM-03 | As an Admin, I want to **change a user’s role** after creation so that permissions stay accurate. | • Dropdown lists allowed roles.<br/>• Change takes effect immediately.<br/>• Audit log records updater & timestamp. | P0 | 3 |
| UM-04 | As an Admin, I want to **deactivate a user** to suspend access without data loss. | • Toggle sets `isActive=false`.<br/>• User cannot sign-in thereafter.<br/>• Reactivation possible. | P1 | 3 |
| UM-05 | As an Admin, I want to **see login and activity stats** per user to monitor engagement. | • Last login date, sessions logged count.<br/>• Exportable to CSV. | P2 | 5 |

---

## 🐎 Horse Registry
| ID | Story | Acceptance Criteria | Prio | SP |
|----|-------|---------------------|------|----|
| HR-01 | As an Admin, I want to **add a new horse profile** so that riders can log sessions against it. | • Required: name, DOB, breed.<br/>• Optionally assign primary rider & trainer.<br/>• Avatar upload ≤1 MB. | P0 | 3 |
| HR-02 | As an Admin, I want to **view and filter all horses** by rider/trainer for quick lookup. | • Multi-select filters.<br/>• Table returns ≤500 ms.<br/>• Responsive on mobile. | P1 | 3 |
| HR-03 | As an Admin, I want to **import horses from CSV** to reduce manual entry. | • Same validation rules as HR-01.<br/>• Duplicate names flagged.<br/>• Summary report after import. | P2 | 8 |
| HR-04 | As an Admin, I want to **retire a horse** so that it becomes unavailable for new sessions while history is preserved. | • Status drop-down (Active, Retired).<br/>• Retired horses hidden from new-session dropdown.<br/>• Badge shown in registry list. | P1 | 2 |

---

## ⚙️ System Configuration
| ID | Story | Acceptance Criteria | Prio | SP |
|----|-------|---------------------|------|----|
| SC-01 | As an Admin, I want to **configure default role scopes** for new tenants so that permissions are consistent. | • UI to toggle feature flags per role.<br/>• Defaults applied on user invite.<br/>• Stored in `tenantSettings`. | P1 | 5 |
| SC-02 | As an Admin, I want to **manage notification templates** to tailor system emails. | • Markdown editor with live preview.<br/>• Variables (`{{riderName}}`).<br/>• Test send function. | P2 | 8 |
| SC-03 | As an Admin, I want to **set organisation branding** (logo, primary color) to white-label the app. | • Color picker saves hex.<br/>• Logo displayed in nav bar.<br/>• Changes propagate without reload. | P1 | 5 |
| SC-04 | As an Admin, I want to **audit all admin actions** for compliance. | • Table of events (who, what, when).<br/>• Export to CSV.<br/>• Immutable records. | P0 | 8 |

---

## 📊 Admin Dashboard & Reporting
| ID | Story | Acceptance Criteria | Prio | SP |
|----|-------|---------------------|------|----|
| AD-01 | As an Admin, I want a **dashboard overview** with KPIs (active users, sessions this week, horses) so that I can monitor tenant health at a glance. | • Metrics update in real-time (Convex subscription).<br/>• Drill-down links to respective lists. | P0 | 5 |
| AD-02 | As an Admin, I want to **filter dashboard metrics by date range** so that I can analyze trends. | • Pre-sets (7 d, 30 d) + custom picker.<br/>• Charts update ≤1 s. | P1 | 3 |
| AD-03 | As an Admin, I want to **export analytics reports** (PDF/CSV) for stakeholder meetings. | • Select period & metrics.<br/>• PDF includes tenant logo.<br/>• Generation time <15 s. | P2 | 8 |
| AD-04 | As an Admin, I want to **receive weekly summary emails** of tenant activity to stay informed without logging in. | • Cron job sends every Monday 08:00 tenant local time.<br/>• Can toggle on/off per tenant. | P2 | 5 |

---

### 📌 Notes
* Story points are relative estimates assuming a stable scrum team of 5.  
* Priorities may shift post-alpha based on user feedback.  
* Cross-references to Functional Requirement IDs (e.g., FR-02) are noted implicitly via epic grouping.

_Last updated: 2025-06-04_
