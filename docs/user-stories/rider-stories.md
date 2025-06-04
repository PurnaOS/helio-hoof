# 🏇 Rider User Stories – HelioHoof  
*(Role-based backlog for the Rider persona)*  

---

## 📑 Index
1. [Session Logging](#session-logging)  
2. [Media Capture](#media-capture)  
3. [Training Plan & Goals](#training-plan--goals)  
4. [Personal Analytics](#personal-analytics)  
5. [Notifications](#notifications)  
6. [Rider Dashboard](#rider-dashboard)  

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

## 📝 Session Logging
| ID | Story | Acceptance Criteria | Prio | SP |
|----|-------|---------------------|------|----|
| SL-01 | As a **Rider**, I want to **start a new session in three taps** so that I can log drills quickly during training. | • Flow: Select horse → Record voice → Save.<br/>• Default drill = Jumping.<br/>• UI responsive on ≤5" screens. | P0 | 5 |
| SL-02 | As a Rider, I want to **enter jump metrics manually** when voice capture fails so that data is not lost. | • Fields: height (cm), refusals, drops.<br/>• Validation on numeric range.<br/>• Autosave drafts offline. | P0 | 3 |
| SL-03 | As a Rider, I want to **tag session location** to contextualize performance. | • GPS autofill with fallback manual text.<br/>• Location stored in session record. | P1 | 2 |
| SL-04 | As a Rider, I want **Markdown notes** for each session so that I can add rich context. | • Supports bold, lists, links.<br/>• Preview toggle.<br/>• Persist across edits. | P1 | 5 |
| SL-05 | As a Rider, I want to **edit or delete my session within 12 h** in case of mistakes. | • Edit restriction timer.<br/>• Delete sets `deletedAt` timestamp (soft). | P2 | 3 |

---

## 🎙️ Media Capture
| ID | Story | Acceptance Criteria | Prio | SP |
|----|-------|---------------------|------|----|
| MC-01 | As a **Rider**, I want to **record a voice note** and have it auto-transcribed so I don’t type while riding. | • One-tap record (max 60 s).<br/>• Whisper transcription attached.<br/>• Playback + text edit before save. | P0 | 5 |
| MC-02 | As a Rider, I want to **capture a short video** of my jump and attach it to the session for trainer review. | • Supports front/back camera.<br/>• Max 90 s or 100 MB.<br/>• Thumbnail preview generated. | P0 | 8 |
| MC-03 | As a Rider, I want to **upload existing media from gallery** when offline capture isn’t possible. | • Accepts MP4, MOV, JPG.<br/>• Progress bar with cancel option.<br/>• Background upload persists on app switch. | P1 | 5 |
| MC-04 | As a Rider, I want to **delete my media within 24 h** if mis-uploaded. | • Delete button visible to owner.<br/>• Hard delete after 24 h grace.<br/>• Trainer media unaffected. | P2 | 3 |

---

## 📋 Training Plan & Goals
| ID | Story | Acceptance Criteria | Prio | SP |
|----|-------|---------------------|------|----|
| TG-01 | As a **Rider**, I want to **view my assigned training plans** so I know upcoming drills. | • List grouped by active / completed.<br/>• Drills sorted by due date.<br/>• Offline cached. | P0 | 3 |
| TG-02 | As a Rider, I want to **mark a drill as completed** to update my trainer. | • Checkbox per drill.<br/>• Timestamp recorded.<br/>• Trainer notified. | P0 | 2 |
| TG-03 | As a Rider, I want to **set personal goals** (e.g., jump 110 cm) so I stay motivated. | • Goal title, metric, target value, deadline.<br/>• Progress bar auto-updates from sessions.<br/>• Edit / archive options. | P1 | 5 |
| TG-04 | As a Rider, I want to **receive suggestions** from AI to adjust goals based on trends. | • GPT suggestion banner.<br/>• Accept → goal pre-filled.<br/>• Dismiss hides banner 7 d. | P2 | 8 |

---

## 📈 Personal Analytics
| ID | Story | Acceptance Criteria | Prio | SP |
|----|-------|---------------------|------|----|
| PA-01 | As a **Rider**, I want to **see weekly charts** of my jump height progress so I can track improvement. | • Line chart with average & max.<br/>• Date range picker (7/30/90 d). | P0 | 5 |
| PA-02 | As a Rider, I want **AI-generated summaries** of my performance so I get quick insights. | • ≤120 words summary.<br/>• Regenerate button (quota 3/day).<br/>• Shows last generated time. | P0 | 8 |
| PA-03 | As a Rider, I want to **compare my stats to stable averages** to understand standing. | • Bars: rider vs tenant average.<br/>• Tooltip with percentile. | P1 | 5 |
| PA-04 | As a Rider, I want to **export my data to CSV** for personal records. | • Exports selected date range.<br/>• File emailed & downloaded. | P2 | 3 |

---

## 🔔 Notifications
| ID | Story | Acceptance Criteria | Prio | SP |
|----|-------|---------------------|------|----|
| NO-01 | As a **Rider**, I want to **get a reminder if I forget to log a scheduled session** so I stay on track. | • Push at 20:00 local.<br/>• Skips if session logged.<br/>• Snooze 1 d option. | P0 | 5 |
| NO-02 | As a Rider, I want to **be alerted when a trainer leaves feedback** so I can review it promptly. | • Real-time push & in-app badge.<br/>• Deep-link opens session. | P0 | 3 |
| NO-03 | As a Rider, I want to **customize which notifications I get** (email vs push) so they’re not overwhelming. | • Toggle matrix for type & channel.<br/>• Saves to `userPrefs`. | P1 | 3 |
| NO-04 | As a Rider, I want **goal milestone notifications** (e.g., 80% target) to celebrate progress. | • Thresholds 50 % / 80 % / 100 %.<br/>• Congratulatory message with share option. | P2 | 3 |

---

## 📊 Rider Dashboard
| ID | Story | Acceptance Criteria | Prio | SP |
|----|-------|---------------------|------|----|
| RD-01 | As a **Rider**, I want a **dashboard showing today’s drills & status** so I know what to do next. | • Card per drill (due, completed).<br/>• “Log Now” button.<br/>• Loads <1 s on 4G. | P0 | 3 |
| RD-02 | As a Rider, I want **quick access to my last session** for reference. | • “Last Session” card with metrics summary.<br/>• Tap opens detail. | P0 | 2 |
| RD-03 | As a Rider, I want to **see goal progress bars** on the dashboard to stay motivated. | • Shows up to 3 active goals.<br/>• Color coded by progress. | P1 | 2 |
| RD-04 | As a Rider, I want a **streak counter** for consecutive days logged to gamify practice. | • Counter resets after missed day.<br/>• Celebratory animation at milestones (7, 30). | P2 | 5 |
| RD-05 | As a Rider, I want **theme selection** (dark/light) accessible from dashboard for comfort. | • Toggle in header.<br/>• Respects system default on first load. | P2 | 2 |

---

### 📌 Notes
* Story points assume 2-week sprint velocity ≈ 40 SP.  
* Priorities emphasize MVP (P0) to enable riders to log sessions and receive trainer feedback from day one.  
* Cross-references to Functional Requirements:  
  • FR-04 Session Logging → SL & MC  
  • FR-05 Media Capture → MC  
  • FR-06 Analytics & Insights → PA  
  • FR-07 Notifications → NO  
  • FR-08 Dashboards → RD  
  • FR-03 Plans & Goals → TG  

_Last updated: 2025-06-04_