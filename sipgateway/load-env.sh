#!/bin/bash

# Load environment variables from .env file
# This script should be sourced, not executed directly

# Default values
DEPLOY_SERVER_HOST=""
DEPLOY_SERVER_USER=""
DEPLOY_SERVER_PATH=""
DEPLOY_SSH_KEY_PATH=""
DEPLOY_SSH_PORT="22"
APP_PORT="3000"
NODE_ENV="production"
LOG_LEVEL="info"

# Function to load .env file
load_env_file() {
    local env_file="$1"
    
    if [[ -f "$env_file" ]]; then
        echo "📄 Loading environment variables from $env_file"
        
        # Read .env file and export variables
        while IFS= read -r line || [[ -n "$line" ]]; do
            # Skip comments and empty lines
            if [[ "$line" =~ ^[[:space:]]*# ]] || [[ -z "${line// }" ]]; then
                continue
            fi
            
            # Export the variable
            export "$line"
        done < "$env_file"
        
        echo "✅ Environment variables loaded successfully"
    else
        echo "⚠️  Environment file $env_file not found"
        return 1
    fi
}

# Function to validate required environment variables
validate_env_vars() {
    local missing_vars=()
    
    # Check required variables
    if [[ -z "$DEPLOY_SERVER_HOST" ]]; then
        missing_vars+=("DEPLOY_SERVER_HOST")
    fi
    
    if [[ -z "$DEPLOY_SERVER_USER" ]]; then
        missing_vars+=("DEPLOY_SERVER_USER")
    fi
    
    if [[ -z "$DEPLOY_SERVER_PATH" ]]; then
        missing_vars+=("DEPLOY_SERVER_PATH")
    fi
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        echo "❌ Missing required environment variables:"
        printf '  - %s\n' "${missing_vars[@]}"
        echo ""
        echo "Please check your .env file or set these variables manually."
        return 1
    fi
    
    echo "✅ All required environment variables are set"
    return 0
}

# Function to display current configuration
show_config() {
    echo "🔧 Current Deployment Configuration:"
    echo "  Server: $DEPLOY_SERVER_USER@$DEPLOY_SERVER_HOST"
    echo "  Path: $DEPLOY_SERVER_PATH"
    echo "  SSH Port: ${DEPLOY_SSH_PORT:-22}"
    echo "  App Port: $APP_PORT"
    echo "  Environment: $NODE_ENV"
    echo ""
}

# Main execution
main() {
    local env_file="${1:-.env}"
    
    # Load environment file
    if load_env_file "$env_file"; then
        # Validate required variables
        if validate_env_vars; then
            show_config
            return 0
        else
            return 1
        fi
    else
        return 1
    fi
}

# If script is executed directly, run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 