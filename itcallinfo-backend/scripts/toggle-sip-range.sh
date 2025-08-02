#!/bin/bash

# Script to toggle TEST_SIP_RANGE environment variable
# This script helps you easily switch between using all SIP configurations or just the 2400-2500 range

set -e

# Load environment variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/../.env" ]]; then
    source "$SCRIPT_DIR/../.env"
fi

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_warning ".env.production file not found. Creating it..."
    cat > .env.production << EOF
# Production Environment Configuration
NODE_ENV=production

# Database Configuration
DB_HOST=${DB_HOST:-your-database-host}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-your-database-user}
DB_PASSWORD=${DB_PASSWORD:-your-database-password}
DB_NAME=${DB_NAME:-your-database-name}

# SIP Gateway Configuration
SIP_GATEWAY_URL=${SIP_GATEWAY_URL:-http://your-sip-gateway-host:3000/api/sip-config}
SIP_GATEWAY_TIMEOUT=${SIP_GATEWAY_TIMEOUT:-10000}

# SIP Username Range Configuration
TEST_SIP_RANGE=true

# Server Configuration
PORT=${PORT:-5000}
HOST=${HOST:-0.0.0.0}

# CORS Configuration
ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-https://yourdomain.com,https://www.yourdomain.com}

# Session Configuration
SESSION_SECRET=${SESSION_SECRET:-your-production-session-secret-key-here}
SESSION_COOKIE_SECURE=${SESSION_COOKIE_SECURE:-true}
SESSION_COOKIE_HTTPONLY=${SESSION_COOKIE_HTTPONLY:-true}
SESSION_COOKIE_SAMESITE=${SESSION_COOKIE_SAMESITE:-strict}

# Storage Configuration
STORAGE_TYPE=${STORAGE_TYPE:-database}

# Security Configuration
HELMET_ENABLED=${HELMET_ENABLED:-true}
RATE_LIMIT_ENABLED=${RATE_LIMIT_ENABLED:-true}

# Logging Configuration
LOG_LEVEL=${LOG_LEVEL:-info}
LOG_FORMAT=${LOG_FORMAT:-json}

# Client Configuration
CLIENT_URL=${CLIENT_URL:-https://yourdomain.com}
API_BASE_URL=${API_BASE_URL:-https://yourdomain.com/api}
EOF
    print_success ".env.production file created"
    print_warning "Please update the .env.production file with your actual values"
fi

# Get current TEST_SIP_RANGE value
current_value=$(grep "^TEST_SIP_RANGE=" .env.production | cut -d'=' -f2 || echo "not_set")

print_status "Current TEST_SIP_RANGE value: $current_value"

# Toggle the value
if [ "$current_value" = "true" ]; then
    new_value="false"
    print_status "Disabling TEST_SIP_RANGE (will use all available SIP configurations)"
else
    new_value="true"
    print_status "Enabling TEST_SIP_RANGE (will only use usernames 2400-2500)"
fi

# Update the .env.production file
if [ "$current_value" = "not_set" ]; then
    # Add the variable if it doesn't exist
    echo "" >> .env.production
    echo "# SIP Username Range Configuration" >> .env.production
    echo "TEST_SIP_RANGE=$new_value" >> .env.production
else
    # Update existing value
    sed -i "s/^TEST_SIP_RANGE=.*/TEST_SIP_RANGE=$new_value/" .env.production
fi

print_success "TEST_SIP_RANGE set to: $new_value"

# Show what this means
if [ "$new_value" = "true" ]; then
    print_status "✅ TEST_SIP_RANGE=true: Only SIP configurations with usernames 2400-2500 will be used"
    print_status "   This is useful for testing with a limited range of usernames"
else
    print_status "✅ TEST_SIP_RANGE=false: All available SIP configurations will be used"
    print_status "   This is the normal production behavior"
fi

echo ""
print_status "To apply changes, you need to restart your application:"
print_status "  - For development: restart your dev server"
print_status "  - For production: run 'npm run deploy' to redeploy" 