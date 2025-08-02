#!/bin/bash

# Backend Deployment Script
# This script deploys the backend build to the remote server using environment variables

set -e

# Load environment variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/../.env" ]]; then
    # Load environment variables from .env file
    set -a
    source "$SCRIPT_DIR/../.env"
    set +a
else
    print_error ".env file not found!"
    print_warning "Please create a .env file based on .env.example and fill in your values:"
    echo "  cp .env.example .env"
    echo "  # Then edit .env with your actual values"
    exit 1
fi

# Default values
DEPLOYMENT_HOST=${DEPLOYMENT_HOST:-"your-deployment-server-host"}
DEPLOYMENT_USER=${DEPLOYMENT_USER:-"your-deployment-user"}
DEPLOYMENT_PATH=${DEPLOYMENT_PATH:-"/var/www/html/itcallinfo-api"}

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment variables
validate_env() {
    local missing_vars=()
    
    if [[ -z "$DEPLOYMENT_HOST" ]]; then
        missing_vars+=("DEPLOYMENT_HOST")
    fi
    
    if [[ -z "$DEPLOYMENT_USER" ]]; then
        missing_vars+=("DEPLOYMENT_USER")
    fi
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        print_error "Missing required environment variables:"
        printf '  - %s\n' "${missing_vars[@]}"
        echo ""
        print_warning "Please check your .env file and ensure these variables are set with actual values"
        exit 1
    fi
}

# Main deployment function
deploy() {
    print_status "🚀 Starting backend deployment..."
    print_status "Server: $DEPLOYMENT_USER@$DEPLOYMENT_HOST"
    print_status "Path: $DEPLOYMENT_PATH"
    echo ""
    
    # Check if build file exists
    if [[ ! -f "itcallinfo-backend-build.tar.gz" ]]; then
        print_error "Build file 'itcallinfo-backend-build.tar.gz' not found!"
        print_warning "Make sure to run 'npm run build' and 'npm run deploy:compress' first"
        exit 1
    fi
    
    # Deploy to remote server
    print_status "📤 Uploading files to remote server..."
    
    # Clean remote directory and upload
    ssh "$DEPLOYMENT_USER@$DEPLOYMENT_HOST" "rm -rf $DEPLOYMENT_PATH/*"
    scp itcallinfo-backend-build.tar.gz "$DEPLOYMENT_USER@$DEPLOYMENT_HOST:$DEPLOYMENT_PATH/"
    
    # Extract, install dependencies, and restart on remote server
    print_status "🔧 Setting up application on remote server..."
    ssh "$DEPLOYMENT_USER@$DEPLOYMENT_HOST" "cd $DEPLOYMENT_PATH && tar -xzf itcallinfo-backend-build.tar.gz && rm itcallinfo-backend-build.tar.gz && npm install --production && NODE_ENV=production npm run setup:admin && pm2 restart itcallinfo-api || pm2 start server/index.js --name itcallinfo-api"
    
    # Cleanup local build file
    rm -f itcallinfo-backend-build.tar.gz
    
    print_success "✅ Backend deployment completed successfully!"
    print_status "🌐 Your API should be available at: http://$DEPLOYMENT_HOST:5000"
    print_status "📊 PM2 status: ssh $DEPLOYMENT_USER@$DEPLOYMENT_HOST 'pm2 status'"
}

# Show help
show_help() {
    echo "Backend Deployment Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  --validate     Validate environment variables only"
    echo ""
    echo "Environment Variables:"
    echo "  DEPLOYMENT_HOST     Remote server hostname/IP"
    echo "  DEPLOYMENT_USER     Remote server username"
    echo "  DEPLOYMENT_PATH     Remote deployment path"
    echo ""
    echo "Example:"
    echo "  DEPLOYMENT_HOST=your-server.com DEPLOYMENT_USER=deploy ./scripts/deploy.sh"
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    --validate)
        validate_env
        print_success "✅ Environment variables are valid"
        exit 0
        ;;
    "")
        # No arguments, proceed with deployment
        ;;
    *)
        print_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac

# Validate environment and deploy
validate_env
deploy 