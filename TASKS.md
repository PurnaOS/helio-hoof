# 📝 Project Tasks

_This file tracks engineering tasks derived from the user-story backlog._

---

## UM-04 – Deactivate a user

**Story**  
_As an **Admin**, I want to **deactivate a user** to suspend access without data loss._

### Remaining Implementation Steps
- [ ] Backend: finalise `deactivateUser` mutation in `convex/users.ts`  
  - Prevent deactivating the last remaining Admin of a tenant.  
  - Write an audit log record of the action.  
  - Ensure the mutation sets `isActive=false` on the user and optionally flags related memberships.  
- [ ] Schema: add `isActive` boolean field to `users` table if not present.  
- [ ] Front-end: surface “Deactivate / Reactivate” controls  
  - Update **UserManagement** table (`src/components/user-management.tsx`) to show current status and allow reactivation.  
  - Show confirmation dialog with warnings.  
  - Disable sign-in on the client after deactivation (middleware check).  
- [ ] UI Feedback: toast notifications for success / error cases.  
- [ ] Tests: write unit tests for mutation guard-rails and UI integration tests.  

### Files to Modify / Create
- `convex/schema.ts` – add `isActive` field to `users` table  
- `convex/users.ts` – complete `deactivateUser` mutation & add `reactivateUser` if required  
- `src/components/user-management.tsx` – add status column, deactivate/reactivate buttons, dialog logic  
- `src/middleware.ts` – block deactivated users from private routes  
- `convex/audit.ts` (new) – helper to log admin actions  

### Acceptance Criteria to Verify
- [ ] Admin can deactivate any non-admin user and any admin user _except_ the last active admin of a tenant.  
- [ ] After deactivation, the user cannot sign in (middleware check intercepts and rejects).  
- [ ] Reactivation restores access immediately.  
- [ ] Action is recorded in immutable audit log with `who`, `when`, and `tenantId`.  
- [ ] UI reflects status change without full page reload.  
- [ ] Existing data (sessions, horses, etc.) linked to the user remain intact.  

---
