# 👨‍👩‍👧 Parent User Stories – HelioHoof  
*(Role-based backlog for the Parent persona — **read-only oversight & milestone tracking**)*  

---

## 📑 Index
1. [Progress Monitoring](#progress-monitoring)  
2. [Trainer Feedback Access](#trainer-feedback-access)  
3. [Summary Reports](#summary-reports)  
4. [Notifications](#notifications)  
5. [Parent Dashboard](#parent-dashboard)  

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

## 📈 Progress Monitoring
| ID | Story | Acceptance Criteria | Prio | SP |
|----|-------|---------------------|------|----|
| PM-01 | As a **Parent**, I want to **view my child's recent training sessions** so that I can stay informed about their activity. | • List last 10 sessions with date, horse, drill, key metrics.<br/>• Loads <700 ms on 4 G.<br/>• Tap opens read-only detail view. | P0 | 3 |
| PM-02 | As a Parent, I want to **filter sessions by horse or date range** so that I can focus on specific periods. | • Multi-select horse filter.<br/>• Date picker 7/30/90 custom.<br/>• Filter state persists on navigation. | P1 | 2 |
| PM-03 | As a Parent, I want to **see visual progress charts** (jump height, refusals) so that I can understand improvement trends. | • Line/column chart per metric.<br/>• Tooltip shows exact values.<br/>• Mobile pinch-zoom enabled. | P0 | 5 |
| PM-04 | As a Parent, I want to **compare current week metrics against previous weeks** to gauge consistency. | • Delta arrows ↑↓ with % change.<br/>• Color-coded (green/red). | P2 | 3 |

---

## 🗣 Trainer Feedback Access
| ID | Story | Acceptance Criteria | Prio | SP |
|----|-------|---------------------|------|----|
| TF-01 | As a **Parent**, I want to **read trainer textual feedback** for each session so that I understand coaching points. | • Feedback section visible in session detail.<br/>• Read-only (no edit).<br/>• Shows timestamp & trainer avatar. | P0 | 2 |
| TF-02 | As a Parent, I want to **play trainer audio feedback** directly in the app so that I can hear nuances. | • Audio player with play/pause, seek.<br/>• Streaming starts <2 s.<br/>• Subtitle from transcription toggle. | P1 | 5 |
| TF-03 | As a Parent, I want to **view annotated video highlights** provided by trainer so I can see specific improvements. | • Inline video player with markers.<br/>• Full-screen toggle.<br/>• Read-only controls. | P2 | 8 |

---

## 📄 Summary Reports
| ID | Story | Acceptance Criteria | Prio | SP |
|----|-------|---------------------|------|----|
| SR-01 | As a **Parent**, I want a **monthly summary report** of my child's progress so that I can review performance at a glance. | • PDF generated on 1st of month.<br/>• Includes KPI tables & charts.<br/>• Email attachment & in-app download. | P0 | 5 |
| SR-02 | As a Parent, I want an **AI-generated milestone summary** when goals are achieved so that I can celebrate successes. | • GPT summary ≤120 words.<br/>• Triggered on 100 % goal completion.<br/>• Share option via email. | P1 | 3 |
| SR-03 | As a Parent, I want to **export all session data to CSV** for personal records. | • Exports selected date range.<br/>• File downloads <5 s.<br/>• Columns documented in modal. | P2 | 3 |

---

## 🔔 Notifications
| ID | Story | Acceptance Criteria | Prio | SP |
|----|-------|---------------------|------|----|
| NT-01 | As a **Parent**, I want to **receive push/email alerts when trainer posts new feedback** so that I stay updated. | • Sent instantly after feedback.<br/>• Includes session link.<br/>• Preference toggles (email/push). | P0 | 3 |
| NT-02 | As a Parent, I want a **weekly digest notification** summarizing sessions and progress so that I have regular oversight. | • Sent every Sunday 18:00 local.<br/>• Highlights KPIs & upcoming drills.<br/>• Opt-out available. | P0 | 3 |
| NT-03 | As a Parent, I want **milestone celebration notifications** (e.g., cleared 120 cm jump) so I can encourage my child. | • Trigger thresholds set by trainer.<br/>• Confetti animation in-app.<br/>• Share button (copy link). | P1 | 5 |
| NT-04 | As a Parent, I want **alerts for missed scheduled sessions** so I can follow up with my child. | • Trigger 24 h after missed log.<br/>• Includes plan name & due date.<br/>• Respects rider’s notification privacy settings. | P1 | 3 |

---

## 🏠 Parent Dashboard
| ID | Story | Acceptance Criteria | Prio | SP |
|----|-------|---------------------|------|----|
| PD-01 | As a **Parent**, I want a **dashboard overview** with key KPIs (sessions logged, avg jump height, refusals) for the current week so that I have a quick snapshot. | • KPI cards refresh real-time.<br/>• Tap card → detailed chart. | P0 | 3 |
| PD-02 | As a Parent, I want to **view upcoming scheduled drills** for the week so I can plan support logistics. | • List sorted by due date.<br/>• Color-coded by completion status.<br/>• Read-only. | P0 | 2 |
| PD-03 | As a Parent, I want to **bookmark important sessions** (e.g., competitions) so I can revisit them easily. | • Star icon on session.<br/>• Bookmarked tab in dashboard.<br/>• Max 50 bookmarks. | P2 | 3 |
| PD-04 | As a Parent, I want to **toggle dark/light theme** from dashboard to match my preference. | • Theme toggle in header.<br/>• Persists in local storage. | P2 | 1 |
| PD-05 | As a Parent, I want a **streak counter** showing consecutive weeks of full session completion so I can encourage consistency. | • Week considered complete if all planned sessions logged.<br/>• Counter resets after incomplete week.<br/>• Tooltip explains logic. | P2 | 5 |

---

### 📌 Notes
* Parents possess **read-only** permissions — all stories avoid create/update actions.  
* Story points estimate UI & API work; backend data already exists from Rider/Trainer flows.  
* Cross-references to Functional Requirements:  
  • FR-06 Analytics & Insights → PM, SR, PD  
  • FR-07 Notifications → NT  
  • FR-08 Dashboards → PD  
  • Trainer feedback flows connect to Rider/Trainer sessions (FR-04 / FR-05).

_Last updated: 2025-06-04_