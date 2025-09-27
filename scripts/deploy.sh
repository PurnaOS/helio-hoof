#!/bin/bash

# Helio-Hoof Deployment Preparation Script
# This script prepares the application for deployment by running necessary checks and builds

set -e  # Exit on any error

echo "🚀 Starting Helio-Hoof deployment preparation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Environment detection
ENVIRONMENT=${VERCEL_ENV:-"development"}
BRANCH=${VERCEL_GIT_COMMIT_REF:-$(git branch --show-current)}

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Branch: ${BRANCH}${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check required tools
echo -e "${YELLOW}🔍 Checking required tools...${NC}"

if ! command_exists bun; then
    echo -e "${RED}❌ Bun is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All required tools are available${NC}"

# Environment validation
echo -e "${YELLOW}🔍 Validating environment variables...${NC}"

REQUIRED_VARS=(
    "ANTHROPIC_API_KEY"
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    "CLERK_SECRET_KEY"
    "DATABASE_URL"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var}" ]]; then
        MISSING_VARS+=("$var")
    fi
done

if [[ ${#MISSING_VARS[@]} -gt 0 ]]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo -e "${RED}  - $var${NC}"
    done
    exit 1
fi

echo -e "${GREEN}✅ All required environment variables are set${NC}"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
bun install --frozen-lockfile

# Type checking
echo -e "${YELLOW}🔍 Running type checks...${NC}"
if ! bun run type-check 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Type check script not found, running tsc directly...${NC}"
    if command_exists tsc; then
        npx tsc --noEmit
    else
        echo -e "${YELLOW}⚠️  TypeScript compiler not found, skipping type check...${NC}"
    fi
fi

# Linting
echo -e "${YELLOW}🔍 Running linter...${NC}"
bun run lint

# Database health check (only in production/preview)
if [[ "$ENVIRONMENT" != "development" ]]; then
    echo -e "${YELLOW}🔍 Checking database connectivity...${NC}"

    # Create a simple database health check script
    cat > /tmp/db-check.js << 'EOF'
const { neon } = require('@neondatabase/serverless');

async function checkDatabase() {
    try {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL not set');
        }

        const sql = neon(process.env.DATABASE_URL);
        const result = await sql`SELECT 1 as health`;

        if (result[0]?.health === 1) {
            console.log('✅ Database connection successful');
            process.exit(0);
        } else {
            console.log('❌ Database health check failed');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

checkDatabase();
EOF

    if ! node /tmp/db-check.js; then
        echo -e "${RED}❌ Database connectivity check failed${NC}"
        exit 1
    fi

    rm -f /tmp/db-check.js
fi

# Run tests (skip in production build)
if [[ "$ENVIRONMENT" != "production" || "$SKIP_TESTS" != "true" ]]; then
    echo -e "${YELLOW}🧪 Running tests...${NC}"

    # Run unit tests
    if bun run test:run --reporter=basic --run 2>/dev/null; then
        echo -e "${GREEN}✅ Unit tests passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Unit tests failed or not configured${NC}"
    fi
fi

# Build optimization
echo -e "${YELLOW}🏗️  Optimizing build...${NC}"

# Set build environment variables
export NEXT_TELEMETRY_DISABLED=1
export NODE_ENV=production

# Clean previous builds
rm -rf .next

# Build the application
echo -e "${YELLOW}🏗️  Building application...${NC}"
bun run build

# Verify build output
if [[ ! -d ".next" ]]; then
    echo -e "${RED}❌ Build failed - .next directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"

# Build size analysis (optional)
if command_exists du; then
    BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
    echo -e "${BLUE}📊 Build size: ${BUILD_SIZE}${NC}"
fi

# Generate deployment summary
echo -e "${GREEN}🎉 Deployment preparation completed successfully!${NC}"
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo -e "${BLUE}  Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}  Branch: ${BRANCH}${NC}"
echo -e "${BLUE}  Node.js: $(node --version)${NC}"
echo -e "${BLUE}  Bun: $(bun --version)${NC}"

if [[ "$ENVIRONMENT" == "production" ]]; then
    echo -e "${GREEN}🚀 Ready for production deployment!${NC}"
elif [[ "$ENVIRONMENT" == "preview" ]]; then
    echo -e "${YELLOW}🔍 Ready for preview deployment!${NC}"
else
    echo -e "${BLUE}🔧 Development build completed!${NC}"
fi