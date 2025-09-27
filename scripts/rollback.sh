#!/bin/bash

# Helio-Hoof Rollback Script
# This script handles emergency rollbacks and deployment safeguards

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

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI is not installed. Please install it first."
        exit 1
    fi

    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install it first."
        exit 1
    fi

    if ! vercel whoami &> /dev/null; then
        print_error "You are not logged in to Vercel. Please run 'vercel login' first."
        exit 1
    fi

    print_success "Prerequisites check passed"
}

# Get deployment information
get_deployment_info() {
    local environment=$1

    print_status "Getting deployment information for $environment..."

    # Get current deployment
    CURRENT_DEPLOYMENT=$(vercel ls --environment=$environment --limit=1 --format=plain | head -n1 | awk '{print $1}')

    if [[ -z "$CURRENT_DEPLOYMENT" ]]; then
        print_error "No current deployment found for $environment"
        exit 1
    fi

    # Get previous deployments
    PREVIOUS_DEPLOYMENTS=$(vercel ls --environment=$environment --limit=10 --format=plain | tail -n +2)

    print_success "Current deployment: $CURRENT_DEPLOYMENT"
}

# List available rollback targets
list_rollback_targets() {
    local environment=$1

    print_status "Available rollback targets for $environment:"
    echo ""
    echo "Current deployment:"
    vercel ls --environment=$environment --limit=1

    echo ""
    echo "Previous deployments (rollback candidates):"
    vercel ls --environment=$environment --limit=10 | tail -n +2

    echo ""
}

# Validate rollback target
validate_rollback_target() {
    local deployment_id=$1
    local environment=$2

    print_status "Validating rollback target: $deployment_id"

    # Check if deployment exists
    if ! vercel inspect "$deployment_id" &> /dev/null; then
        print_error "Deployment $deployment_id not found"
        return 1
    fi

    # Get deployment details
    local deployment_info=$(vercel inspect "$deployment_id" --format=json)
    local deployment_env=$(echo "$deployment_info" | jq -r '.target // "unknown"')
    local deployment_state=$(echo "$deployment_info" | jq -r '.readyState // "unknown"')

    print_status "Deployment environment: $deployment_env"
    print_status "Deployment state: $deployment_state"

    # Validate environment matches
    if [[ "$deployment_env" != "$environment" ]]; then
        print_error "Deployment environment ($deployment_env) doesn't match target ($environment)"
        return 1
    fi

    # Validate deployment is ready
    if [[ "$deployment_state" != "READY" ]]; then
        print_error "Deployment is not in READY state: $deployment_state"
        return 1
    fi

    print_success "Rollback target validation passed"
    return 0
}

# Perform health check on deployment
health_check() {
    local deployment_url=$1

    print_status "Performing health check on $deployment_url"

    # Wait for deployment to be ready
    sleep 30

    # Check health endpoint
    local health_response=$(curl -s -o /dev/null -w "%{http_code}" "$deployment_url/api/health" || echo "000")

    if [[ "$health_response" == "200" ]]; then
        print_success "Health check passed"
        return 0
    else
        print_error "Health check failed with status: $health_response"
        return 1
    fi
}

# Create deployment snapshot
create_deployment_snapshot() {
    local environment=$1

    print_status "Creating deployment snapshot for $environment..."

    local snapshot_file="deployment-snapshot-$(date +%Y%m%d-%H%M%S).json"

    # Get current deployment info
    vercel ls --environment=$environment --limit=1 --format=json > "$snapshot_file"

    print_success "Deployment snapshot saved to $snapshot_file"
}

# Rollback to previous deployment
rollback_deployment() {
    local target_deployment=$1
    local environment=$2
    local confirm=${3:-false}

    print_status "Preparing to rollback $environment to deployment: $target_deployment"

    # Validate target
    if ! validate_rollback_target "$target_deployment" "$environment"; then
        print_error "Rollback target validation failed"
        exit 1
    fi

    # Create snapshot of current state
    create_deployment_snapshot "$environment"

    # Confirm rollback unless already confirmed
    if [[ "$confirm" != "true" ]]; then
        echo ""
        print_warning "This will rollback $environment environment to deployment: $target_deployment"
        read -p "Are you sure you want to proceed? (yes/no): " confirmation

        if [[ "$confirmation" != "yes" ]]; then
            print_status "Rollback cancelled by user"
            exit 0
        fi
    fi

    print_status "Executing rollback..."

    # Promote the target deployment
    if vercel promote "$target_deployment" --environment="$environment"; then
        print_success "Rollback completed successfully"

        # Get the new deployment URL
        local deployment_url=$(vercel inspect "$target_deployment" --format=json | jq -r '.url // "unknown"')

        if [[ "$deployment_url" != "unknown" ]]; then
            deployment_url="https://$deployment_url"

            # Perform health check
            if health_check "$deployment_url"; then
                print_success "Rollback health check passed"
            else
                print_warning "Rollback completed but health check failed"
                print_warning "Please verify the deployment manually: $deployment_url"
            fi
        fi

        # Send notification
        send_rollback_notification "$environment" "$target_deployment" "success"
    else
        print_error "Rollback failed"
        send_rollback_notification "$environment" "$target_deployment" "failed"
        exit 1
    fi
}

# Emergency rollback (no confirmation)
emergency_rollback() {
    local environment=$1

    print_warning "EMERGENCY ROLLBACK INITIATED for $environment"

    # Get the most recent successful deployment (skip current)
    local target_deployment=$(vercel ls --environment="$environment" --limit=5 --format=plain | tail -n +2 | head -n1 | awk '{print $1}')

    if [[ -z "$target_deployment" ]]; then
        print_error "No previous deployment found for emergency rollback"
        exit 1
    fi

    print_status "Emergency rollback target: $target_deployment"

    # Execute rollback without confirmation
    rollback_deployment "$target_deployment" "$environment" "true"
}

# Send rollback notification
send_rollback_notification() {
    local environment=$1
    local deployment_id=$2
    local status=$3

    print_status "Sending rollback notification..."

    local message=""
    local emoji=""

    if [[ "$status" == "success" ]]; then
        emoji="✅"
        message="Rollback completed successfully"
    else
        emoji="❌"
        message="Rollback failed"
    fi

    # Send Slack notification if webhook is configured
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"text\": \"$emoji Helio-Hoof Rollback\",
                \"blocks\": [
                    {
                        \"type\": \"section\",
                        \"text\": {
                            \"type\": \"mrkdwn\",
                            \"text\": \"*$message*\\n\\n*Environment:* $environment\\n*Target Deployment:* $deployment_id\\n*Timestamp:* $(date)\"
                        }
                    }
                ]
            }" \
            "$SLACK_WEBHOOK_URL"
    fi

    print_success "Notification sent"
}

# Automated rollback based on health checks
automated_rollback() {
    local environment=$1
    local max_attempts=${2:-3}

    print_status "Starting automated rollback monitoring for $environment"

    local current_deployment=$(vercel ls --environment="$environment" --limit=1 --format=plain | head -n1 | awk '{print $1}')
    local deployment_url="https://$(vercel inspect "$current_deployment" --format=json | jq -r '.url')"

    print_status "Monitoring deployment: $current_deployment"
    print_status "Deployment URL: $deployment_url"

    local failed_checks=0

    for i in $(seq 1 $max_attempts); do
        print_status "Health check attempt $i/$max_attempts"

        if health_check "$deployment_url"; then
            print_success "Health check passed on attempt $i"
            failed_checks=0
        else
            failed_checks=$((failed_checks + 1))
            print_warning "Health check failed (attempt $i). Failed checks: $failed_checks"

            if [[ $failed_checks -ge 3 ]]; then
                print_error "Multiple health check failures detected. Initiating automatic rollback..."
                emergency_rollback "$environment"
                return
            fi
        fi

        sleep 60 # Wait 1 minute between checks
    done

    print_success "Automated monitoring completed successfully"
}

# Show deployment status and metrics
show_deployment_status() {
    local environment=$1

    print_status "Deployment status for $environment:"

    # Current deployment
    echo ""
    echo "Current deployment:"
    vercel ls --environment="$environment" --limit=1

    # Recent deployments
    echo ""
    echo "Recent deployments:"
    vercel ls --environment="$environment" --limit=5

    # Get current deployment details
    local current_deployment=$(vercel ls --environment="$environment" --limit=1 --format=plain | head -n1 | awk '{print $1}')

    if [[ -n "$current_deployment" ]]; then
        echo ""
        echo "Current deployment details:"
        vercel inspect "$current_deployment"

        # Health check
        local deployment_url="https://$(vercel inspect "$current_deployment" --format=json | jq -r '.url')"
        echo ""
        print_status "Performing health check..."
        if health_check "$deployment_url"; then
            print_success "Current deployment is healthy"
        else
            print_error "Current deployment health check failed"
        fi
    fi
}

# Main menu
show_menu() {
    echo ""
    echo -e "${BLUE}Helio-Hoof Rollback & Deployment Management${NC}"
    echo "=============================================="
    echo "1. Show deployment status"
    echo "2. List rollback targets"
    echo "3. Rollback to specific deployment"
    echo "4. Emergency rollback (latest previous)"
    echo "5. Automated rollback monitoring"
    echo "6. Health check current deployment"
    echo "7. Exit"
    echo ""
}

# Main execution
main() {
    print_status "Helio-Hoof Rollback Script"
    echo ""

    check_prerequisites

    if [[ $# -eq 0 ]]; then
        # Interactive mode
        while true; do
            show_menu
            read -p "Choose an option (1-7): " choice

            case $choice in
                1)
                    echo "Choose environment:"
                    echo "1. Production"
                    echo "2. Preview/Staging"
                    read -p "Choose (1-2): " env_choice
                    case $env_choice in
                        1) show_deployment_status "production" ;;
                        2) show_deployment_status "preview" ;;
                        *) print_error "Invalid choice" ;;
                    esac
                    ;;
                2)
                    echo "Choose environment:"
                    echo "1. Production"
                    echo "2. Preview/Staging"
                    read -p "Choose (1-2): " env_choice
                    case $env_choice in
                        1) list_rollback_targets "production" ;;
                        2) list_rollback_targets "preview" ;;
                        *) print_error "Invalid choice" ;;
                    esac
                    ;;
                3)
                    echo "Choose environment:"
                    echo "1. Production"
                    echo "2. Preview/Staging"
                    read -p "Choose (1-2): " env_choice

                    local target_env=""
                    case $env_choice in
                        1) target_env="production" ;;
                        2) target_env="preview" ;;
                        *) print_error "Invalid choice"; continue ;;
                    esac

                    list_rollback_targets "$target_env"
                    read -p "Enter deployment ID to rollback to: " deployment_id
                    rollback_deployment "$deployment_id" "$target_env"
                    ;;
                4)
                    echo "Choose environment:"
                    echo "1. Production"
                    echo "2. Preview/Staging"
                    read -p "Choose (1-2): " env_choice
                    case $env_choice in
                        1) emergency_rollback "production" ;;
                        2) emergency_rollback "preview" ;;
                        *) print_error "Invalid choice" ;;
                    esac
                    ;;
                5)
                    echo "Choose environment:"
                    echo "1. Production"
                    echo "2. Preview/Staging"
                    read -p "Choose (1-2): " env_choice
                    read -p "Enter max monitoring attempts (default 10): " attempts
                    attempts=${attempts:-10}
                    case $env_choice in
                        1) automated_rollback "production" "$attempts" ;;
                        2) automated_rollback "preview" "$attempts" ;;
                        *) print_error "Invalid choice" ;;
                    esac
                    ;;
                6)
                    echo "Choose environment:"
                    echo "1. Production"
                    echo "2. Preview/Staging"
                    read -p "Choose (1-2): " env_choice
                    case $env_choice in
                        1)
                            local current_deployment=$(vercel ls --environment="production" --limit=1 --format=plain | head -n1 | awk '{print $1}')
                            local deployment_url="https://$(vercel inspect "$current_deployment" --format=json | jq -r '.url')"
                            health_check "$deployment_url"
                            ;;
                        2)
                            local current_deployment=$(vercel ls --environment="preview" --limit=1 --format=plain | head -n1 | awk '{print $1}')
                            local deployment_url="https://$(vercel inspect "$current_deployment" --format=json | jq -r '.url')"
                            health_check "$deployment_url"
                            ;;
                        *) print_error "Invalid choice" ;;
                    esac
                    ;;
                7)
                    print_success "Goodbye!"
                    exit 0
                    ;;
                *)
                    print_error "Invalid option. Please choose 1-7."
                    ;;
            esac

            echo ""
            read -p "Press Enter to continue..."
        done
    else
        # Command line mode
        case $1 in
            "status")
                show_deployment_status "${2:-production}"
                ;;
            "list")
                list_rollback_targets "${2:-production}"
                ;;
            "rollback")
                if [[ -z "$2" || -z "$3" ]]; then
                    print_error "Usage: $0 rollback <deployment_id> <environment>"
                    exit 1
                fi
                rollback_deployment "$2" "$3"
                ;;
            "emergency")
                emergency_rollback "${2:-production}"
                ;;
            "monitor")
                automated_rollback "${2:-production}" "${3:-10}"
                ;;
            "health")
                local current_deployment=$(vercel ls --environment="${2:-production}" --limit=1 --format=plain | head -n1 | awk '{print $1}')
                local deployment_url="https://$(vercel inspect "$current_deployment" --format=json | jq -r '.url')"
                health_check "$deployment_url"
                ;;
            *)
                echo "Usage: $0 [status|list|rollback|emergency|monitor|health] [environment] [additional_args]"
                echo ""
                echo "Commands:"
                echo "  status [env]              - Show deployment status"
                echo "  list [env]                - List rollback targets"
                echo "  rollback <id> <env>       - Rollback to specific deployment"
                echo "  emergency [env]           - Emergency rollback to previous"
                echo "  monitor [env] [attempts]  - Automated rollback monitoring"
                echo "  health [env]              - Health check current deployment"
                echo ""
                echo "Environments: production, preview"
                exit 1
                ;;
        esac
    fi
}

# Run main function
main "$@"