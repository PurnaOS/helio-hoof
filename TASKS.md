# 📝 Project Tasks

_This file tracks engineering tasks derived from the user-story backlog._

---

## UM-04 – Deactivate a user

**Story**  
_As an **Admin**, I want to **deactivate a user** to suspend access without data loss._

### Remaining Implementation Steps
- [x] Backend: finalise `deactivateUser` mutation in `convex/users.ts`  
  - [x] Prevent deactivating the last remaining Admin of a tenant.  
  - [x] Write an audit log record of the action.  
  - [x] Ensure the mutation sets `isActive=false` on the user and optionally flags related memberships.  
- [x] Schema: add `isActive` boolean field to `users` table if not present.  
- [x] Front-end: surface “Deactivate / Reactivate” controls  
  - [x] Update **UserManagement** table (`src/components/user-management.tsx`) to show current status and allow reactivation.  
  - [x] Show confirmation dialog with warnings.  
  - [x] Disable sign-in on the client after deactivation (middleware check).  
- [x] UI Feedback: toast notifications for success / error cases.  
- [ ] Tests: write unit tests for mutation guard-rails and UI integration tests.  

### Files to Modify / Create
- [x] `convex/schema.ts` – add `isActive` field to `users` table  
- [x] `convex/users.ts` – complete `deactivateUser` mutation & add `reactivateUser` if required  
- [x] `src/components/user-management.tsx` – add status column, deactivate/reactivate buttons, dialog logic  
- [x] `src/middleware.ts` – block deactivated users from private routes  
- [x] `convex/audit.ts` (new) – helper to log admin actions  
- [x] `convex/userStatus.ts` (new) – helper to check user active status  
- [x] `src/app/account-deactivated/page.tsx` (new) – page to display when account is deactivated  

### Acceptance Criteria to Verify
- [x] Admin can deactivate any non-admin user and any admin user _except_ the last active admin of a tenant.  
- [x] After deactivation, the user cannot sign in (middleware check intercepts and rejects).  
- [x] Reactivation restores access immediately.  
- [x] Action is recorded in immutable audit log with `who`, `when`, and `tenantId`.  
- [x] UI reflects status change without full page reload.  
- [x] Existing data (sessions, horses, etc.) linked to the user remain intact.  

---
