# API Input Validation & Security Implementation

This document outlines the comprehensive input validation and security measures implemented for the Helio-Hoof API endpoints.

## Overview

The implementation includes:
- **Zod-based input validation** for all API endpoints
- **Comprehensive error handling** with standardized responses
- **File upload validation** with size and type restrictions
- **Rate limiting** to prevent abuse
- **CORS configuration** for secure cross-origin requests
- **Security headers** to prevent common attacks
- **Environment variable validation** for configuration safety

## Features Implemented

### 1. Input Validation Schemas (`/src/lib/validation/schemas.ts`)

#### Image Analysis Validation
- **Single Image Schema**: Validates base64 data, MIME types, file sizes (50MB max)
- **Multiple Images Schema**: Supports up to 10 images with individual validation
- **File Type Restrictions**: Only allows `jpeg`, `jpg`, `png`, `gif`, `webp`, `bmp`
- **Base64 Validation**: Ensures proper encoding format

#### Analysis History Validation
- **Query Parameters**: Pagination, filtering, and search validation
- **UUID Validation**: Ensures proper ID format for database operations
- **Metadata Validation**: Structured validation for analysis metadata

#### Environment Variables
- **Required Variables**: Validates presence of critical environment variables
- **Type Safety**: Ensures correct data types and formats
- **URL Validation**: Validates database URLs and API endpoints

### 2. Security Utilities (`/src/lib/validation/utils.ts`)

#### Error Handling
- **Standardized Error Responses**: Consistent error format across all endpoints
- **Error Codes**: Categorized error types for better debugging
- **Safe Error Messages**: Prevents information leakage

#### Rate Limiting
- **Per-Endpoint Limits**: Different limits for different operations
- **IP-based Tracking**: Prevents abuse from individual IPs
- **Configurable Windows**: Customizable time windows and request limits

#### Sanitization
- **XSS Prevention**: Removes dangerous HTML/JavaScript content
- **SQL Injection Protection**: Input sanitization for database operations
- **Deep Object Sanitization**: Recursive cleaning of nested objects

### 3. Environment Validation (`/src/lib/validation/env.ts`)

#### Features
- **Runtime Validation**: Validates environment variables at application startup
- **Caching**: Caches validated environment for performance
- **Health Checks**: Provides environment health status
- **Type Safety**: TypeScript integration for environment variables

### 4. Middleware Security (`/src/middleware.ts`)

#### Security Headers
- **Content Security Policy**: Prevents XSS and code injection
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **Referrer Policy**: Controls referrer information
- **Permissions Policy**: Restricts browser features

#### CORS Configuration
- **Origin Validation**: Whitelist of allowed origins
- **Credential Support**: Secure credential handling
- **Preflight Handling**: Proper OPTIONS request handling

#### Rate Limiting
- **Global Limits**: 1000 requests per minute per IP
- **Endpoint-Specific Limits**: Tailored limits per operation type
- **Automatic Cleanup**: Removes expired rate limit entries

## API Endpoints Security

### Image Analysis Endpoints

#### `/api/analyze-image` (POST)
- **Rate Limit**: 50 requests/minute per user
- **Validation**: Single image schema with size/type checks
- **Authentication**: Required via Clerk
- **File Size**: Maximum 50MB per image

#### `/api/analyze-images` (POST)
- **Rate Limit**: 20 requests/minute per user (stricter for multiple images)
- **Validation**: Multiple images schema (max 10 images)
- **Authentication**: Required via Clerk
- **Total Size**: Combined size limit enforcement

### Analysis History Endpoints

#### `/api/analysis-history` (GET/POST)
- **Rate Limit**: 100 requests/minute for GET, 30 for POST
- **Validation**: Query parameters and request body validation
- **Authentication**: User-scoped data access
- **Pagination**: Secure pagination with limits

#### `/api/analysis-history/[id]` (GET/DELETE)
- **Rate Limit**: 200 requests/minute for GET, 50 for DELETE
- **Validation**: UUID format validation
- **Authorization**: User can only access their own data
- **Soft Deletion**: Secure deletion with audit trail

### Health Check Endpoint

#### `/api/health` (GET)
- **Public Access**: No authentication required
- **Environment Status**: Shows configuration health
- **No Sensitive Data**: Safe for monitoring systems
- **Cache Headers**: Prevents caching of health status

## Error Handling

### Error Response Format
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": ["field.name: validation message"],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Codes
- `VALIDATION_ERROR`: Input validation failures
- `AUTHENTICATION_ERROR`: Authentication required
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `FILE_TOO_LARGE`: File size exceeds limits
- `INVALID_FILE_TYPE`: Unsupported file format
- `NOT_FOUND`: Resource not found
- `DATABASE_ERROR`: Database operation failures
- `EXTERNAL_API_ERROR`: Third-party service errors
- `INTERNAL_SERVER_ERROR`: Unexpected server errors

## Rate Limiting Configuration

### Per-Endpoint Limits
| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/analyze-image` | 50 req/min | Per user + IP |
| `/api/analyze-images` | 20 req/min | Per user + IP |
| `/api/analysis-history` (GET) | 100 req/min | Per user + IP |
| `/api/analysis-history` (POST) | 30 req/min | Per user + IP |
| `/api/analysis-history/[id]` (GET) | 200 req/min | Per user + IP |
| `/api/analysis-history/[id]` (DELETE) | 50 req/min | Per user + IP |
| Global (all endpoints) | 1000 req/min | Per IP |

### Rate Limit Headers
All responses include rate limit information:
- `X-RateLimit-Limit`: Request limit for the endpoint
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Unix timestamp when the limit resets

## File Upload Security

### Validation Rules
- **File Size**: Maximum 50MB per file
- **File Types**: Only image formats (JPEG, PNG, GIF, WebP, BMP)
- **MIME Type Validation**: Server-side MIME type verification
- **Base64 Validation**: Ensures proper encoding format
- **Content Scanning**: Basic content validation

### Security Measures
- **Virus Scanning**: Recommended for production (not implemented)
- **Content Type Validation**: Multiple validation layers
- **Size Limits**: Enforced at multiple levels
- **Temporary Storage**: Secure handling of uploaded files

## Security Headers

### Implemented Headers
- **Content-Security-Policy**: Restricts resource loading
- **X-Frame-Options**: Prevents embedding in frames
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-XSS-Protection**: Enables XSS filtering
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features
- **Strict-Transport-Security**: Enforces HTTPS (production only)

### CORS Configuration
- **Allowed Origins**: Configured for development and production
- **Credentials**: Enabled for authenticated requests
- **Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Headers**: Standard headers plus authentication headers

## Environment Variables

### Required Variables
- `ANTHROPIC_API_KEY`: API key for Anthropic Claude
- `CLERK_SECRET_KEY`: Secret key for Clerk authentication
- `NEON_DATABASE_URL`: Database connection string

### Optional Variables
- `MOCK_LLM_MODE`: Enable mock mode for development
- `HELIO_ADMIN_USER_ID`: Admin user identifier
- `NODE_ENV`: Environment setting (development/production/test)

### Validation
Environment variables are validated at startup with detailed error messages for missing or invalid values.

## Testing the Implementation

### Health Check
```bash
curl -X GET http://localhost:3000/api/health
```

### Rate Limit Testing
```bash
# Test rate limiting
for i in {1..60}; do
  curl -X POST http://localhost:3000/api/analyze-image \
    -H "Content-Type: application/json" \
    -d '{"imageBase64":"test","mimeType":"image/jpeg"}'
done
```

### CORS Testing
```bash
curl -X OPTIONS http://localhost:3000/api/analyze-image \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST"
```

## Production Considerations

### Additional Security Measures
1. **Web Application Firewall (WAF)**: Implement at CDN/proxy level
2. **DDoS Protection**: Use services like Cloudflare
3. **API Gateway**: Consider using managed API gateway
4. **Logging**: Implement comprehensive request logging
5. **Monitoring**: Set up alerts for rate limit breaches
6. **Backup**: Regular backup of rate limit data

### Performance Optimizations
1. **Caching**: Implement response caching where appropriate
2. **Connection Pooling**: Database connection optimization
3. **CDN**: Use CDN for static assets
4. **Compression**: Enable response compression

### Compliance
1. **GDPR**: Ensure user data handling compliance
2. **Privacy**: Implement data retention policies
3. **Audit Logging**: Comprehensive audit trails
4. **Data Encryption**: Encrypt sensitive data at rest

## Maintenance

### Regular Tasks
1. **Update Dependencies**: Keep Zod and other packages updated
2. **Review Logs**: Monitor for security incidents
3. **Adjust Limits**: Tune rate limits based on usage patterns
4. **Security Audit**: Regular security assessment

### Monitoring
1. **Error Rates**: Track validation failures
2. **Rate Limit Hits**: Monitor rate limiting effectiveness
3. **Response Times**: Track API performance
4. **Security Events**: Monitor for potential attacks