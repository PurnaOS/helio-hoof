# Helio-Hoof Deployment Guide

This guide provides step-by-step instructions for setting up and managing the CI/CD pipeline for the Helio-Hoof application.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Neon Database**: Create a database at [neon.tech](https://neon.tech)
3. **Clerk Account**: Set up authentication at [clerk.com](https://clerk.com)
4. **GitHub Repository**: Connected to Vercel for automatic deployments

## Quick Start

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Link Your Project

```bash
vercel link
```

### 3. Set Up Environment Variables

Use the automated script:

```bash
bun run env:setup
```

Or manually set them in the Vercel dashboard using `.env.production.example` as a reference.

### 4. Deploy

```bash
# Preview deployment
bun run deploy:preview

# Production deployment
bun run deploy:vercel
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Claude AI API key | `sk-ant-api03-...` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | `pk_live_...` |
| `CLERK_SECRET_KEY` | Clerk secret key | `sk_live_...` |
| `DATABASE_URL` | Neon database connection | `postgresql://...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_QUERY_TIMEOUT` | Query timeout in ms | `30000` |
| `RATE_LIMIT_MAX_REQUESTS` | Rate limit per minute | `1000` |
| `MOCK_LLM_MODE` | Enable mock AI responses | `false` |

## Database Setup

### 1. Create Neon Database

1. Visit [console.neon.tech](https://console.neon.tech)
2. Create a new project
3. Copy the connection string

### 2. Configure Database Branching (Optional)

For preview deployments:

```bash
# Create a branch for preview
neon branches create --name preview

# Get branch connection string
neon connection-string --branch preview
```

### 3. Run Migrations

```bash
# Generate migration files
bun run db:generate

# Push to database
bun run db:push
```

## Clerk Authentication Setup

### 1. Create Clerk Application

1. Visit [dashboard.clerk.com](https://dashboard.clerk.com)
2. Create a new application
3. Choose your authentication methods

### 2. Configure Domains

In Clerk dashboard, add your domains:

- **Development**: `http://localhost:3000`
- **Preview**: `https://your-app-git-branch.vercel.app`
- **Production**: `https://your-domain.com`

### 3. Set Up Webhooks (Optional)

For user synchronization:

1. Go to Webhooks in Clerk dashboard
2. Add endpoint: `https://your-domain.com/api/webhooks/clerk`
3. Select events: `user.created`, `user.updated`, `user.deleted`

## Vercel Configuration

### Project Settings

1. **Framework Preset**: Next.js
2. **Build Command**: `bun run build`
3. **Install Command**: `bun install`
4. **Dev Command**: `bun run dev`

### Domain Configuration

#### Custom Domain

1. Go to Vercel project settings
2. Add your custom domain
3. Configure DNS records as instructed

#### Preview Deployments

Automatic preview URLs for each branch:
- `https://your-app-git-branch-user.vercel.app`

## CI/CD Pipeline

### GitHub Actions (Recommended)

The project includes a GitHub Actions workflow for:

- Type checking
- Linting
- Testing
- Preview deployments on PR
- Production deployment on main branch

### Manual Deployment

```bash
# Prepare deployment
bun run deploy:prepare

# Deploy to production
vercel --prod

# Deploy preview
vercel
```

## Performance Optimization

### Bundle Analysis

```bash
# Analyze bundle size
ANALYZE=true bun run build
```

### Database Optimization

- Connection pooling is automatically configured
- Query timeout set to 30 seconds for serverless
- Health checks monitor database performance

### Caching Strategy

- Static assets cached for 1 year
- API responses use appropriate cache headers
- Images optimized with WebP/AVIF formats

## Monitoring

### Health Checks

Monitor application health at:
- `https://your-domain.com/api/health`

### Vercel Analytics

Enable in Vercel dashboard for:
- Page views
- Performance metrics
- User analytics

### Error Monitoring

Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- PostHog for product analytics

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear cache and rebuild
bun run clean:install
bun run build
```

#### Database Connection Issues

1. Check `DATABASE_URL` format
2. Verify Neon database is active
3. Check connection timeout settings

#### Authentication Issues

1. Verify Clerk keys are correct
2. Check domain configuration
3. Ensure middleware is properly configured

### Debug Mode

```bash
# Enable debug mode
DEBUG=* bun run dev

# Check environment variables
bun run env:pull
```

## Security Considerations

### Environment Variables

- Never commit production secrets
- Use different keys for preview/production
- Rotate keys regularly

### HTTPS

- Always use HTTPS in production
- Configure security headers in middleware
- Enable HSTS for production domains

### CORS

- Configure allowed origins
- Restrict API access appropriately
- Monitor for unusual traffic patterns

## Scaling Considerations

### Database

- Neon automatically scales compute
- Consider read replicas for high traffic
- Monitor connection pool usage

### Serverless Functions

- Each API route auto-scales
- Monitor cold start times
- Consider edge runtime for static content

### CDN

- Vercel Edge Network handles global distribution
- Configure appropriate cache headers
- Use image optimization features

## Backup and Recovery

### Database Backups

Neon provides:
- Automatic daily backups
- Point-in-time recovery
- Branch-based backups

### Code Backups

- GitHub repository is primary backup
- Vercel maintains deployment history
- Consider additional backup strategies for critical data

## Cost Optimization

### Vercel

- Monitor function execution time
- Use static generation where possible
- Optimize bundle size

### Neon

- Monitor compute time usage
- Use connection pooling
- Consider data retention policies

### Clerk

- Monitor monthly active users
- Optimize authentication flows
- Consider self-hosted options for scale

## Support

For deployment issues:

1. Check Vercel deployment logs
2. Monitor health check endpoint
3. Review error tracking services
4. Contact platform support teams

---

**Next Steps**: After successful deployment, consider setting up monitoring, analytics, and backup strategies for production use.