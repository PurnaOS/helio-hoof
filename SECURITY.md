# Security Best Practices for Helio-Hoof

This document outlines security best practices for the Helio-Hoof application deployment and development.

## Environment Variables Security

### Sensitive Variable Classification

**CRITICAL (Must be secured)**:
- `ANTHROPIC_API_KEY` - AI service access
- `CLERK_SECRET_KEY` - Authentication backend key
- `DATABASE_URL` - Database connection string
- `NEXTAUTH_SECRET` - Session encryption key
- `CLERK_WEBHOOK_SECRET` - Webhook signature verification

**SENSITIVE (Should be secured)**:
- `SENTRY_DSN` - Error tracking endpoint
- `SMTP_PASSWORD` - Email service authentication
- `REDIS_URL` - Cache connection string

**PUBLIC (Safe to expose)**:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Client-side authentication
- `NEXT_PUBLIC_APP_URL` - Application URL
- `NEXT_PUBLIC_ENVIRONMENT` - Environment identifier

### Environment Variable Management

1. **Never commit sensitive variables** to version control
2. **Use Vercel's environment variables** for production secrets
3. **Set sensitive flag** for all critical variables in Vercel
4. **Rotate secrets regularly** (quarterly for production)
5. **Use different secrets** for each environment

### Secret Rotation Schedule

- **Production**: Every 3 months
- **Staging**: Every 6 months
- **Development**: As needed

## Database Security

### Neon PostgreSQL Configuration

1. **Use dedicated databases** for each environment
2. **Enable connection pooling** to prevent exhaustion
3. **Use read-only replicas** where possible
4. **Regular backups** (daily for production)
5. **Monitor connection logs** for suspicious activity

### Database Access Control

```typescript
// Example: Secure database connection with validation
export function createSecureConnection() {
  const config = getDatabaseEnvironmentConfig();

  // Validate connection string format
  if (!config.connectionString.startsWith('postgresql://')) {
    throw new Error('Invalid database URL format');
  }

  // Enable SSL in production
  if (isProduction() && !config.ssl) {
    throw new Error('SSL required in production');
  }

  return createDatabaseConnection();
}
```

## Authentication Security (Clerk)

### Multi-Environment Setup

1. **Separate Clerk applications** for each environment
2. **Different webhook secrets** for each environment
3. **Environment-specific redirect URLs**
4. **Enable MFA** for production admin accounts

### Webhook Security

```typescript
// Validate webhook signatures
export function validateClerkWebhook(payload: string, signature: string) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error('Webhook secret not configured');
  }

  // Implement proper signature validation
  return svix.verify(payload, headers, secret);
}
```

## API Security

### Rate Limiting

Implement rate limiting for all API endpoints:

```typescript
// Example middleware for API protection
export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Input Validation

Always validate and sanitize inputs:

```typescript
import { z } from 'zod';

const createHorseSchema = z.object({
  name: z.string().min(1).max(100),
  breed: z.string().min(1).max(50),
  age: z.number().int().min(0).max(50),
});

export function validateCreateHorse(data: unknown) {
  return createHorseSchema.parse(data);
}
```

## Deployment Security

### GitHub Actions Security

1. **Use repository secrets** for sensitive variables
2. **Limit workflow permissions** to minimum required
3. **Use specific action versions** (not @main or @latest)
4. **Enable branch protection** for main/dev branches
5. **Require review** for production deployments

### Environment Isolation

```yaml
# Example: Secure environment configuration
environments:
  production:
    protection_rules:
      - type: required_reviewers
        required_reviewers:
          users: ["admin-user"]
      - type: wait_timer
        wait_timer: 5 # minutes
```

### Secret Management in CI/CD

```yaml
# Use repository secrets for sensitive data
env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY_PROD }}
  DATABASE_URL: ${{ secrets.DATABASE_URL_PROD }}
```

## Monitoring and Incident Response

### Security Monitoring

1. **Monitor failed authentication attempts**
2. **Track unusual API usage patterns**
3. **Alert on database connection failures**
4. **Log all admin actions**

### Incident Response Plan

1. **Immediate Actions**:
   - Rotate compromised secrets
   - Revoke affected sessions
   - Block suspicious IPs

2. **Investigation**:
   - Review access logs
   - Check database queries
   - Analyze API usage patterns

3. **Recovery**:
   - Update security measures
   - Notify affected users
   - Document lessons learned

## Security Checklist

### Before Deployment

- [ ] All sensitive variables are secured
- [ ] Database connections use SSL
- [ ] Webhook signatures are validated
- [ ] Rate limiting is enabled
- [ ] Input validation is implemented
- [ ] Security headers are configured
- [ ] Dependencies are up to date
- [ ] Security audit passes

### Regular Maintenance

- [ ] Rotate secrets quarterly
- [ ] Update dependencies monthly
- [ ] Review access logs weekly
- [ ] Test backup recovery
- [ ] Validate security configurations

### Emergency Procedures

1. **Suspected Breach**:
   ```bash
   # Immediately rotate all secrets
   ./scripts/emergency-rotation.sh

   # Revoke all active sessions
   vercel env add FORCE_LOGOUT true production
   ```

2. **Database Compromise**:
   ```bash
   # Switch to backup database
   vercel env add DATABASE_URL $BACKUP_DB_URL production

   # Invalidate all sessions
   vercel env add SESSION_SECRET $(openssl rand -base64 32) production
   ```

## Security Tools and Resources

### Recommended Tools

- **Dependabot**: Automated dependency updates
- **Snyk**: Vulnerability scanning
- **Sentry**: Error monitoring
- **Vercel Security**: Built-in protection
- **GitHub Advanced Security**: Code scanning

### Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/going-to-production#security)
- [Vercel Security](https://vercel.com/docs/concepts/deployments/security)
- [Clerk Security](https://clerk.com/docs/security)

## Contact Information

For security concerns or to report vulnerabilities:

- **Security Team**: security@helio-hoof.com
- **Emergency Contact**: +1-XXX-XXX-XXXX
- **Public Key**: [GPG Key ID]

---

**Last Updated**: December 2024
**Next Review**: March 2025