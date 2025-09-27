# Test Suite - Security & Setup

## Overview
This directory contains end-to-end tests for the Helio-Hoof application using Playwright. All test credentials have been secured and moved to environment variables.

## Security Improvements ✅

### 🚨 Critical Security Fix Applied
- **Removed hardcoded credentials** from all test files
- **Eliminated** exposed email addresses and passwords from version control
- **Implemented** environment variable-based credential management
- **Created** secure authentication helper functions

### Before (❌ INSECURE)
```typescript
// NEVER DO THIS - credentials exposed in version control
await page.getByLabel("Email address").fill("real-email@example.com");
await page.getByLabel("Password").fill("real-password-123");
```

### After (✅ SECURE)
```typescript
// Secure approach using environment variables
import { authenticateUser } from "./test-helpers/auth";
await authenticateUser(page);
```

## Environment Setup

### Required Environment Variables
Create a `.env.test` or `.env.local` file with:

```env
# Test User Credentials for E2E Testing
# These should be test accounts only, never production credentials
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=test-password-123
```

### Configuration Files
- **`.env.test`**: Test-specific environment variables (preferred)
- **`.env.local`**: Local development variables (fallback)
- **`.env.local.example`**: Template with secure patterns

## Test Authentication

### Secure Helper Functions
Located in `./test-helpers/auth.ts`:

1. **`authenticateUser(page)`**: Standard authentication flow
2. **`authenticateUserWithRedirect(page)`**: For pages that redirect to sign-in

### Usage
```typescript
import { authenticateUser } from "./test-helpers/auth";

test.beforeEach(async ({ page }) => {
  await authenticateUser(page);
});
```

## Security Best Practices

### ✅ DO
- Use environment variables for all credentials
- Create dedicated test accounts
- Validate environment variables in helper functions
- Document security requirements

### ❌ DON'T
- Hardcode credentials in test files
- Use production credentials in tests
- Commit .env files with real credentials
- Skip environment variable validation

## Running Tests

```bash
# Install dependencies including dotenv
bun install

# Run tests (will load environment variables automatically)
bun test

# Run specific test file
bunx playwright test tests/name-description-storage.spec.ts
```

## Error Handling

If environment variables are missing, tests will fail with a clear error:
```
TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables must be set for E2E tests.
Please check your .env.local file and ensure test credentials are configured.
```

## Security Audit Results

- ✅ No hardcoded credentials in test files
- ✅ Environment variable-based credential management
- ✅ Secure authentication helper functions
- ✅ Clear error messages for missing credentials
- ✅ Documentation for secure test setup
- ✅ .gitignore properly configured for .env files