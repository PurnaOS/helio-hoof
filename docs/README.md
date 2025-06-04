# 📚 HelioHoof Documentation Hub

Welcome to the HelioHoof documentation workspace.  
This hub provides a single starting point to explore **all** product, design, and engineering docs for the HelioHoof platform.

---

## 🌐 Quick Links

| Area | Description | Link |
|------|-------------|------|
| 📝 Product Requirements Document | Vision, goals, scope, and functional specs | [PRD Overview](./prd/README.md) |
| 🎟️ User Stories | Detailed, role-based user stories broken down for iteration planning | [User Stories Index](./user-stories/README.md) |
| 🛠 Technical Specs | Architecture, data models, API contracts, and dev guidelines | [Technical Specs](./technical/README.md) |
| ✅ Task Tracker | Living checklist of in-flight and upcoming work items | [TASKS.md](../TASKS.md) |

---

## 🗺 Table of Contents

1. [Project Overview](#project-overview)  
2. [Documentation Structure](#documentation-structure)  
3. [How to Contribute](#how-to-contribute)  
4. [Changelog](#changelog)

---

## Project Overview

**HelioHoof** is a mobile-first, multi-tenant, AI-powered equestrian training platform that streamlines training session logging and delivers intelligent analytics for riders, trainers, parents, and administrators.

Key pillars:  
- Real-time voice & video capture  
- Role-specific dashboards  
- LLM-driven performance insights  
- Scalable multi-tenant architecture  

For the detailed product vision and functional requirements, head over to the [PRD](./prd/README.md).

---

## Documentation Structure

```
docs/
├── README.md                ← You are here
├── prd/                     ← Product requirements
│   └── README.md
├── user-stories/            ← Agile stories split by role
│   ├── README.md
│   ├── admin-stories.md
│   ├── trainer-stories.md
│   ├── rider-stories.md
│   └── parent-stories.md
├── technical/               ← Architecture, schema, API docs
│   └── README.md
└── design/ (optional)       ← Wireframes & design system
```

Each sub-folder contains its own `README.md` as an entry point, enabling deep-linking while keeping the hierarchy clear.

---

## How to Contribute

1. **Create a branch** named `docs/<topic>`  
2. **Edit or add files** in the appropriate folder.  
3. **Open a Pull Request**—include a brief summary and link back to the relevant Jira/issue.  
4. **Tag reviewers**:  
   - Product: `@product-owner`  
   - Engineering: `@tech-lead`  
   - Design: `@ux-lead`  
5. Merged PRs automatically generate an entry in the **Changelog** below.

> Tip: Use the `/TASKS.md` checklist to claim documentation tasks or propose new sections.

---

## Changelog

| Date | Author | Description |
|------|--------|-------------|
| 2025-06-04 | Initial commit | Created master documentation hub |
