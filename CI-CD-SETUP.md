# CI/CD Setup Guide for Helio-Hoof

## Overview

This guide provides a comprehensive implementation plan for setting up the CI/CD pipeline for the Helio-Hoof application, including:

- Automated testing and deployment
- Multi-environment configuration
- Security best practices
- Monitoring and rollback strategies

## Step-by-Step Implementation

### Phase 1: Repository Setup (30 minutes)

#### 1.1 GitHub Repository Configuration

```bash
# Ensure you're on the dev branch
git checkout dev

# Create necessary directories if they don't exist
mkdir -p .github/workflows
mkdir -p scripts
mkdir -p config
```

#### 1.2 Required Secrets Configuration

Navigate to GitHub repository → Settings → Secrets and variables → Actions

**Repository Secrets:**

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `VERCEL_TOKEN` | Vercel deployment token | `vercel_xxxxx` |
| `VERCEL_ORG_ID` | Vercel organization ID | `team_xxxxx` |
| `VERCEL_PROJECT_ID` | Vercel project ID | `prj_xxxxx` |
| `ANTHROPIC_API_KEY` | Claude AI API key | `sk-ant-api03-xxxxx` |
| `CLERK_PUBLISHABLE_KEY_PROD` | Clerk production public key | `pk_live_xxxxx` |
| `CLERK_SECRET_KEY_PROD` | Clerk production secret | `sk_live_xxxxx` |
| `CLERK_WEBHOOK_SECRET_PROD` | Clerk production webhook secret | `whsec_xxxxx` |
| `CLERK_PUBLISHABLE_KEY_STAGING` | Clerk staging public key | `pk_test_xxxxx` |
| `CLERK_SECRET_KEY_STAGING` | Clerk staging secret | `sk_test_xxxxx` |
| `CLERK_WEBHOOK_SECRET_STAGING` | Clerk staging webhook secret | `whsec_xxxxx` |
| `CLERK_PUBLISHABLE_KEY_TEST` | Clerk test public key | `pk_test_xxxxx` |
| `CLERK_SECRET_KEY_TEST` | Clerk test secret | `sk_test_xxxxx` |
| `DATABASE_URL_PROD` | Neon production database | `postgresql://xxxxx` |
| `DATABASE_URL_STAGING` | Neon staging database | `postgresql://xxxxx` |
| `DIRECT_URL_PROD` | Neon production direct URL | `postgresql://xxxxx` |
| `DIRECT_URL_STAGING` | Neon staging direct URL | `postgresql://xxxxx` |
| `TEST_USER_EMAIL` | E2E test user email | `test@example.com` |
| `TEST_USER_PASSWORD` | E2E test user password | `test-password` |
| `SLACK_WEBHOOK_URL` | Slack notifications | `https://hooks.slack.com/xxxxx` |

#### 1.3 Environment Setup

```bash
# Copy environment examples
cp .env.local.example .env.production
cp .env.local.example .env.staging

# Update environment files with appropriate values
vim .env.production
vim .env.staging
```

### Phase 2: Vercel Configuration (20 minutes)

#### 2.1 Install and Configure Vercel CLI

```bash
# Install Vercel CLI
bun add -g vercel

# Login to Vercel
vercel login

# Link the project
vercel link
```

#### 2.2 Set Up Environment Variables in Vercel

```bash
# Make the script executable
chmod +x scripts/vercel-env.sh

# Run environment setup (interactive)
./scripts/vercel-env.sh

# Or use command line options
./scripts/vercel-env.sh setup-prod
./scripts/vercel-env.sh setup-staging
```

#### 2.3 Configure Vercel Project Settings

In Vercel Dashboard:

1. **Build & Development Settings:**
   - Framework Preset: Next.js
   - Build Command: `bun run build`
   - Install Command: `bun install`
   - Development Command: `bun run dev`

2. **Environment Variables:**
   - Production: Use production secrets
   - Preview: Use staging secrets
   - Development: Use development values

3. **Custom Domains:**
   - Production: `helio-hoof.com`
   - Staging: `staging.helio-hoof.com`

### Phase 3: Database Configuration (15 minutes)

#### 3.1 Neon Database Setup

**Production Database:**
1. Create Neon project for production
2. Copy connection string
3. Set `DATABASE_URL_PROD` in GitHub Secrets

**Staging Database:**
1. Create branch or separate database for staging
2. Copy connection string
3. Set `DATABASE_URL_STAGING` in GitHub Secrets

#### 3.2 Database Migration Setup

```bash
# Generate initial migration
bun run db:generate

# Test migration on development
bun run db:push

# Migrations will be automatically applied in CI/CD
```

### Phase 4: Clerk Authentication Setup (20 minutes)

#### 4.1 Create Clerk Applications

**Production Environment:**
1. Create Clerk application for production
2. Configure allowed domains: `helio-hoof.com`
3. Copy API keys to GitHub Secrets

**Staging Environment:**
1. Create separate Clerk application for staging
2. Configure allowed domains: `staging.helio-hoof.com`
3. Copy API keys to GitHub Secrets

**Test Environment:**
1. Create Clerk application for testing
2. Configure allowed domains: `localhost:3000`
3. Create test user account
4. Copy credentials to GitHub Secrets

#### 4.2 Configure Webhooks

For each Clerk application:

1. **Production:** `https://helio-hoof.com/api/webhooks/clerk`
2. **Staging:** `https://staging.helio-hoof.com/api/webhooks/clerk`
3. **Test:** `http://localhost:3000/api/webhooks/clerk`

**Webhook Events:**
- `user.created`
- `user.updated`
- `user.deleted`
- `session.created`
- `session.ended`

### Phase 5: Testing Configuration (25 minutes)

#### 5.1 Unit Tests Setup

```bash
# Verify test configuration
cat vitest.config.ts

# Run tests to ensure they work
bun run test:run

# Check coverage
bun run test:coverage
```

#### 5.2 E2E Tests Setup

```bash
# Install Playwright browsers
bun x playwright install

# Create test user in Clerk test environment
# Update TEST_USER_EMAIL and TEST_USER_PASSWORD in GitHub Secrets

# Run E2E tests locally
bun run test:e2e
```

#### 5.3 Test Environment Variables

Create `.env.test` file:

```bash
NODE_ENV=test
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${CLERK_PUBLISHABLE_KEY_TEST}
CLERK_SECRET_KEY=${CLERK_SECRET_KEY_TEST}
TEST_USER_EMAIL=${TEST_USER_EMAIL}
TEST_USER_PASSWORD=${TEST_USER_PASSWORD}
```

### Phase 6: CI/CD Pipeline Activation (10 minutes)

#### 6.1 Workflow Validation

```bash
# Validate workflow syntax
# Use GitHub's workflow validator or local tools

# Check file permissions
ls -la .github/workflows/
ls -la scripts/
```

#### 6.2 First Deployment Test

```bash
# Create a test commit to trigger CI/CD
git add .
git commit -m "feat: implement CI/CD pipeline"
git push origin dev

# Monitor GitHub Actions for first run
# Check deployment in Vercel dashboard
```

### Phase 7: Monitoring Setup (15 minutes)

#### 7.1 Slack Integration

1. Create Slack webhook URL
2. Add `SLACK_WEBHOOK_URL` to GitHub Secrets
3. Test notification with manual workflow run

#### 7.2 Health Check Configuration

```bash
# Test health endpoint locally
curl http://localhost:3000/api/health

# Verify health checks work in staging
curl https://staging.helio-hoof.com/api/health
```

#### 7.3 Error Tracking (Optional)

If using Sentry:

1. Create Sentry project
2. Add Sentry DSN to environment variables
3. Configure error reporting in `config/monitoring.ts`

### Phase 8: Security Validation (10 minutes)

#### 8.1 Secret Scanning

```bash
# Run TruffleHog locally (if available)
# This is also run in CI/CD pipeline

# Verify no secrets in code
git log --patch | grep -i "api_key\|secret\|password"
```

#### 8.2 Security Audit

```bash
# Run security audit
bun audit

# Check for known vulnerabilities
# Review dependency security alerts
```

### Phase 9: Production Deployment (20 minutes)

#### 9.1 Staging Validation

```bash
# Deploy to staging first
git checkout dev
git push origin dev

# Wait for automatic staging deployment
# Test staging environment thoroughly
# https://staging.helio-hoof.com
```

#### 9.2 Production Deployment

```bash
# Create production release
git checkout main
git merge dev
git push origin main

# Monitor production deployment
# Verify health checks pass
# Test critical user flows
```

#### 9.3 Post-Deployment Verification

```bash
# Run health checks
curl https://helio-hoof.com/api/health

# Test authentication flow
# Verify database connectivity
# Check monitoring dashboards
```

### Phase 10: Rollback Testing (15 minutes)

#### 10.1 Manual Rollback Test

```bash
# Test rollback script
./scripts/rollback.sh status production
./scripts/rollback.sh list production

# Test emergency procedures (in staging)
./scripts/rollback.sh emergency preview
```

#### 10.2 Automated Rollback Test

1. Trigger rollback workflow in GitHub Actions
2. Use staging environment for testing
3. Verify rollback completes successfully
4. Confirm health checks pass after rollback

## Validation Checklist

### Environment Setup ✅
- [ ] GitHub repository configured
- [ ] All secrets added to GitHub
- [ ] Vercel project linked and configured
- [ ] Environment variables set in Vercel
- [ ] Custom domains configured

### Database & Authentication ✅
- [ ] Neon databases created (prod/staging)
- [ ] Database migrations working
- [ ] Clerk applications configured
- [ ] Webhooks set up and tested
- [ ] Test users created

### Testing ✅
- [ ] Unit tests passing locally
- [ ] E2E tests configured and passing
- [ ] Test environments isolated
- [ ] Coverage reporting working

### CI/CD Pipeline ✅
- [ ] GitHub Actions workflows active
- [ ] Automatic deployments working
- [ ] Security scanning enabled
- [ ] Build artifacts stored
- [ ] Slack notifications working

### Monitoring & Security ✅
- [ ] Health checks responding
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Security scans passing
- [ ] Secrets properly secured

### Rollback Procedures ✅
- [ ] Manual rollback tested
- [ ] Automated rollback configured
- [ ] Emergency procedures documented
- [ ] Health check monitoring active

## Troubleshooting Common Issues

### GitHub Actions Failures

**Build Failures:**
```bash
# Check Node.js version compatibility
# Verify Bun installation in workflow
# Check TypeScript compilation errors
```

**Test Failures:**
```bash
# Verify test environment variables
# Check test database connectivity
# Ensure Clerk test application configured
```

### Deployment Issues

**Vercel Deployment Failures:**
```bash
# Check build logs in Vercel dashboard
# Verify environment variables set correctly
# Ensure build command is correct
```

**Database Connection Errors:**
```bash
# Verify DATABASE_URL format
# Check Neon database status
# Test connection string locally
```

### Authentication Problems

**Clerk Integration Issues:**
```bash
# Verify API keys are correct
# Check domain configuration
# Ensure webhook endpoints accessible
```

## Maintenance Tasks

### Daily
- Monitor deployment status
- Check error rates
- Review security alerts

### Weekly
- Update dependencies
- Review performance metrics
- Test rollback procedures

### Monthly
- Rotate non-critical secrets
- Review and update documentation
- Conduct security audit

### Quarterly
- Rotate all production secrets
- Full security review
- Disaster recovery testing

## Next Steps

After completing the CI/CD setup:

1. **Monitor** the pipeline for the first few deployments
2. **Document** any custom procedures or configurations
3. **Train** team members on deployment and rollback procedures
4. **Set up** additional monitoring tools if needed
5. **Schedule** regular maintenance and security reviews

## Support Resources

- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **Vercel Documentation**: https://vercel.com/docs
- **Neon Documentation**: https://neon.tech/docs
- **Clerk Documentation**: https://clerk.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment

---

**Estimated Total Setup Time:** 3-4 hours
**Recommended Team Size:** 1-2 developers
**Prerequisites:** GitHub admin access, Vercel account, domain access