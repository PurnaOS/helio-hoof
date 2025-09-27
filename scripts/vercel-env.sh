#!/bin/bash

# Vercel Environment Variables Management Script
# This script helps manage environment variables across different Vercel environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if vercel CLI is installed
if ! command -v vercel >/dev/null 2>&1; then
    print_error "Vercel CLI is not installed. Please install it first:"
    echo "npm i -g vercel"
    exit 1
fi

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    print_error "You are not logged in to Vercel. Please run 'vercel login' first."
    exit 1
fi

# Function to set environment variable
set_env_var() {
    local key=$1
    local value=$2
    local environment=$3
    local sensitive=${4:-"false"}

    if [[ -z "$value" ]]; then
        echo -e "${YELLOW}⚠️  Skipping $key (empty value)${NC}"
        return
    fi

    local cmd="vercel env add $key $environment"
    if [[ "$sensitive" == "true" ]]; then
        cmd="$cmd --sensitive"
    fi

    echo -e "${BLUE}Setting $key for $environment...${NC}"
    echo "$value" | $cmd > /dev/null 2>&1

    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ $key set successfully${NC}"
    else
        echo -e "${RED}❌ Failed to set $key${NC}"
    fi
}

# Function to load environment file
load_env_file() {
    local env_file=$1

    if [[ ! -f "$env_file" ]]; then
        echo -e "${RED}❌ Environment file not found: $env_file${NC}"
        return 1
    fi

    echo -e "${BLUE}📂 Loading environment variables from $env_file${NC}"

    # Source the file and extract variables
    while IFS= read -r line; do
        # Skip comments and empty lines
        if [[ "$line" =~ ^#.*$ ]] || [[ -z "$line" ]]; then
            continue
        fi

        # Extract key=value pairs
        if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
            local key="${BASH_REMATCH[1]}"
            local value="${BASH_REMATCH[2]}"

            # Remove quotes if present
            value=$(echo "$value" | sed 's/^"//;s/"$//')

            # Export for later use
            export "$key=$value"
            ENV_VARS["$key"]="$value"
        fi
    done < "$env_file"
}

# Main function
main() {
    echo -e "${GREEN}🔧 Vercel Environment Variables Setup${NC}"
    echo -e "${BLUE}=====================================${NC}"

    # Check if we're in a Vercel project
    if [[ ! -f ".vercel/project.json" ]]; then
        echo -e "${YELLOW}⚠️  No Vercel project found. Running 'vercel link'...${NC}"
        vercel link
    fi

    # Declare associative array for environment variables
    declare -A ENV_VARS

    # Determine which environment file to use
    local env_file=""
    if [[ -f ".env.production.example" ]]; then
        env_file=".env.production.example"
    elif [[ -f ".env.local.example" ]]; then
        env_file=".env.local.example"
    elif [[ -f ".env.example" ]]; then
        env_file=".env.example"
    else
        echo -e "${RED}❌ No environment example file found${NC}"
        echo -e "${YELLOW}Please create .env.production.example or .env.example${NC}"
        exit 1
    fi

    # Load environment variables
    load_env_file "$env_file"

    # Ask user for deployment environment
    echo -e "${YELLOW}🌍 Select deployment environment:${NC}"
    echo "1) Development"
    echo "2) Preview"
    echo "3) Production"
    echo "4) All environments"
    read -p "Enter choice (1-4): " env_choice

    case $env_choice in
        1) TARGET_ENV="development" ;;
        2) TARGET_ENV="preview" ;;
        3) TARGET_ENV="production" ;;
        4) TARGET_ENV="all" ;;
        *) echo -e "${RED}❌ Invalid choice${NC}"; exit 1 ;;
    esac

    # Define sensitive variables
    SENSITIVE_VARS=(
        "ANTHROPIC_API_KEY"
        "CLERK_SECRET_KEY"
        "DATABASE_URL"
        "NEXTAUTH_SECRET"
        "CLERK_WEBHOOK_SECRET"
        "SMTP_PASS"
        "TEST_USER_PASSWORD"
    )

    # Set environment variables
    echo -e "${YELLOW}🔄 Setting environment variables...${NC}"

    for key in "${!ENV_VARS[@]}"; do
        local value="${ENV_VARS[$key]}"
        local is_sensitive="false"

        # Check if variable is sensitive
        for sensitive_var in "${SENSITIVE_VARS[@]}"; do
            if [[ "$key" == "$sensitive_var" ]]; then
                is_sensitive="true"
                break
            fi
        done

        # Skip placeholder values
        if [[ "$value" =~ ^(your_|pk_test_|sk_test_|postgresql://username|whsec_xxx) ]]; then
            echo -e "${YELLOW}⚠️  Skipping $key (placeholder value detected)${NC}"
            continue
        fi

        if [[ "$TARGET_ENV" == "all" ]]; then
            set_env_var "$key" "$value" "development" "$is_sensitive"
            set_env_var "$key" "$value" "preview" "$is_sensitive"
            set_env_var "$key" "$value" "production" "$is_sensitive"
        else
            set_env_var "$key" "$value" "$TARGET_ENV" "$is_sensitive"
        fi
    done

    echo -e "${GREEN}🎉 Environment variables setup completed!${NC}"
    echo -e "${BLUE}💡 Tips:${NC}"
    echo -e "${BLUE}  - Update placeholder values in Vercel dashboard${NC}"
    echo -e "${BLUE}  - Test your deployment with 'vercel dev'${NC}"
    echo -e "${BLUE}  - Deploy with 'vercel --prod' for production${NC}"
}

# Run main function
main "$@"