# 🧑‍🏫 Trainer User Stories – HelioHoof  
*(Role-based backlog for the Trainer persona)*  

---

## 📑 Index
1. [Training Plan Creation](#training-plan-creation)  
2. [Session Review & Feedback](#session-review--feedback)  
3. [Media Management](#media-management)  
4. [Analytics & Insights](#analytics--insights)  
5. [Notifications](#notifications)  
6. [Trainer Dashboard](#trainer-dashboard)  

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

## 📝 Training Plan Creation
| ID | Story | Acceptance Criteria | Prio | SP |
|----|-------|---------------------|------|----|
| TP-01 | As a **Trainer**, I want to **create a new training plan template** so that I can reuse standard exercise sets. | • Required fields: title, description, target role (rider/horse).<br/>• Supports markdown formatting.<br/>• Template saved in Convex and appears in “My Templates”. | P0 | 5 |
| TP-02 | As a Trainer, I want to **assign a training plan to multiple riders at once** so that I save time. | • Multi-select riders.<br/>• Plan start/end dates required.<br/>• Confirmation dialog shows rider count.<br/>• Success toast lists first 3 riders. | P0 | 3 |
| TP-03 | As a Trainer, I want to **set recurring drills** (e.g., 3× week) inside a plan so that schedules are clear. | • Recurrence rule picker (daily/weekly, days).<br/>• Preview calendar before save.<br/>• Sessions auto-generated. | P1 | 8 |
| TP-04 | As a Trainer, I want to **duplicate an existing plan** to iterate quickly. | • “Duplicate” action copies all drills but not rider assignments.<br/>• New plan opens in edit mode. | P1 | 2 |
| TP-05 | As a Trainer, I want to **archive old plans** so my active list stays uncluttered. | • Archive moves plan to separate tab.<br/>• Archived plans are read-only. | P2 | 2 |

---

## 🔍 Session Review & Feedback
| ID | Story | Acceptance Criteria | Prio | SP |
|----|-------|---------------------|------|----|
| SR-01 | As a Trainer, I want to **view a rider’s submitted session log** so that I can evaluate performance. | • Opens detail drawer with metrics, notes, media thumbnails.<br/>• Loads in <500 ms on 4G. | P0 | 3 |
| SR-02 | As a Trainer, I want to **leave text feedback** on a session so the rider gets actionable advice. | • Rich-text area ≤2 000 chars.<br/>• Auto-saves as draft.<br/>• Rider receives notification. | P0 | 5 |
| SR-03 | As a Trainer, I want to **record an audio feedback clip** and attach it to the session so that context is richer. | • In-browser recorder (≤90 s).<br/>• Playback preview before upload.<br/>• Whisper transcription generated. | P1 | 8 |
| SR-04 | As a Trainer, I want to **flag sessions that need rider revision** so that issues are addressed. | • “Needs Revision” status toggle.<br/>• Rider sees banner in log.<br/>• Badge visible in session list filter. | P1 | 3 |
| SR-05 | As a Trainer, I want to **compare current session metrics to previous averages** directly in the review view. | • Inline chart with last 5 sessions.<br/>• Delta indicators (↑/↓). | P2 | 5 |

---

## 🎞 Media Management
| ID | Story | Acceptance Criteria | Prio | SP |
|----|-------|---------------------|------|----|
| MM-01 | As a Trainer, I want to **upload slow-motion video clips** as examples for riders so they can emulate form. | • Accepts <100 MB MP4.<br/>• Generates 3 preview thumbnails.<br/>• Video stored with `trainerId` tag. | P1 | 5 |
| MM-02 | As a Trainer, I want to **organize media into folders by horse or drill** so assets are easy to find. | • Create/rename/delete folders.<br/>• Drag-and-drop move.<br/>• Path shown in breadcrumb. | P2 | 8 |
| MM-03 | As a Trainer, I want **inline playback** of rider-submitted videos during review so I don’t switch context. | • Player loads in review drawer.<br/>• Seek & playback controls.<br/>• Handles portrait & landscape. | P0 | 3 |
| MM-04 | As a Trainer, I want to **delete my mistakenly uploaded media** while ensuring rider media stays intact. | • Delete only if `ownerId` matches.<br/>• Confirmation modal.<br/>• Hard delete after 24 h grace. | P2 | 3 |

---

## 📈 Analytics & Insights
| ID | Story | Acceptance Criteria | Prio | SP |
|----|-------|---------------------|------|----|
| AI-01 | As a Trainer, I want to **view weekly performance charts** per rider so I can track progress. | • Chart types: height, refusals, drops.<br/>• Date range picker.<br/>• Data loads <1 s. | P0 | 5 |
| AI-02 | As a Trainer, I want **AI-generated summaries** of each rider’s trends so I spend less time analyzing. | • GPT summary ≤150 words.<br/>• Regenerable on demand.<br/>• Cached for 24 h. | P0 | 8 |
| AI-03 | As a Trainer, I want to **compare two horses side-by-side** to spot training needs. | • Dual metric charts.<br/>• Horse selector dropdown. | P1 | 5 |
| AI-04 | As a Trainer, I want a **heatmap of refusal locations** (if GPS is enabled) to detect pattern issues. | • Displays arena grid heatmap.<br/>• Toggle GPS on/off. | P2 | 8 |
| AI-05 | As a Trainer, I want to **export analytics to CSV** for offline analysis. | • Export respects date range.<br/>• File downloads <5 s.<br/>• Column headers documented. | P2 | 3 |

---

## 🔔 Notifications
| ID | Story | Acceptance Criteria | Prio | SP |
|----|-------|---------------------|------|----|
| NT-01 | As a Trainer, I want to **receive an alert when a rider misses a scheduled session** so I can follow up. | • Trigger at 20:00 local if no log.<br/>• Daily digest email.<br/>• Can disable per rider. | P0 | 5 |
| NT-02 | As a Trainer, I want to **be notified when a rider uploads new media** so I can review promptly. | • Push + in-app badge.<br/>• Aggregated per session. | P1 | 3 |
| NT-03 | As a Trainer, I want to **set custom thresholds** (e.g., refusals > 3) for alerting. | • Threshold config screen.<br/>• Real-time evaluation.<br/>• Alerts respect rider timezone. | P2 | 8 |
| NT-04 | As a Trainer, I want **weekly digest summaries** of all assigned riders so I stay informed. | • Sent Monday 08:00.<br/>• Includes KPIs & AI highlights.<br/>• Opt-out toggle. | P1 | 3 |

---

## 📊 Trainer Dashboard
| ID | Story | Acceptance Criteria | Prio | SP |
|----|-------|---------------------|------|----|
| TD-01 | As a Trainer, I want a **dashboard showing today’s scheduled sessions** so I can plan my day. | • List grouped by rider.<br/>• Status icons (logged / pending). | P0 | 3 |
| TD-02 | As a Trainer, I want **quick filters** (rider, horse, status) on the dashboard so I find data fast. | • Filter chips with count badges.<br/>• Persist last selected filters. | P1 | 2 |
| TD-03 | As a Trainer, I want to **see KPIs** (avg jump height, refusals) across my riders for the week. | • KPI cards refresh live.<br/>• Clicking card opens analytics view. | P0 | 5 |
| TD-04 | As a Trainer, I want to **pin favorite riders** to the top of the dashboard for rapid access. | • Star icon toggle.<br/>• Pinned list limited to 5. | P2 | 2 |
| TD-05 | As a Trainer, I want a **calendar view** of all upcoming plans and sessions so I can visualize workload. | • Month & week toggles.<br/>• Color-coded by rider.<br/>• Responsive drag-scroll. | P2 | 8 |

---

### 📌 Notes
* Story points assume 2-week sprints with capacity ≈ 40 SP.  
* Priorities reflect v1 MVP targets; P2 items may shift to v1.1+.  
* Cross-references to Functional Requirements:  
  • FR-04 Session Logging / Review → SR & MM  
  • FR-05 Media Capture → MM  
  • FR-06 Analytics & Insights → AI  
  • FR-07 Notifications → NT  
  • FR-08 Dashboards → TD  
  • FR-03 Plans → TP  

_Last updated: 2025-06-04_
