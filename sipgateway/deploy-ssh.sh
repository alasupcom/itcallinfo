#!/bin/bash

set -e

# Load environment variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/load-env.sh"

# Load .env file if it exists
if [[ -f "$SCRIPT_DIR/.env" ]]; then
    source "$SCRIPT_DIR/load-env.sh" "$SCRIPT_DIR/.env"
else
    echo "⚠️  .env file not found. Please create one based on .env.example"
    echo "📄 Copy .env.example to .env and fill in your values:"
    echo "   cp .env.example .env"
    echo ""
    echo "Required variables:"
    echo "  DEPLOY_SERVER_HOST=your-server-ip-or-domain"
    echo "  DEPLOY_SERVER_USER=your-username"
    echo "  DEPLOY_SERVER_PATH=/path/to/deploy/directory"
    echo ""
    exit 1
fi

# Validate environment variables
if ! validate_env_vars; then
    exit 1
fi

echo "🚀 SIP Gateway API SSH Server Deployment"
echo "========================================"
echo "Server: $DEPLOY_SERVER_USER@$DEPLOY_SERVER_HOST"
echo "Path: $DEPLOY_SERVER_PATH"
echo ""

read -p "Continue with deployment? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo "🔨 Building application locally..."
npm run build

echo "📦 Preparing files for deployment..."

TEMP_DIR=$(mktemp -d)
DEPLOY_DIR="$TEMP_DIR/sipgateway"

mkdir -p "$DEPLOY_DIR"
cp -r dist/* "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp package-lock.json "$DEPLOY_DIR/" 2>/dev/null || echo "⚠️  package-lock.json not found"
cp .env "$DEPLOY_DIR/" 2>/dev/null || echo "⚠️  .env file not found, will need to create on server"

# Create PM2 ecosystem file with environment variables
cat > "$DEPLOY_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: 'sipgateway',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: '${NODE_ENV:-production}',
      PORT: ${APP_PORT:-3000}
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: ${APP_PORT:-3000}
    }
  }]
};
EOF

# Create deployment script for remote server
cat > "$DEPLOY_DIR/deploy-remote.sh" << 'EOF'
#!/bin/bash
set -e

echo "🚀 Deploying SIP Gateway API on remote server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "⚠️  Creating .env template..."
    cat > .env << ENVEOF
# Database Configuration
DATABASE_URL=mysql://username:password@host:port/database_name

# Server Configuration
PORT=3000
NODE_ENV=production

# Optional: Logging
LOG_LEVEL=info
ENVEOF
    echo "📝 Please edit .env file with your database configuration"
    echo "📝 Then restart the application with: pm2 restart sipgateway"
fi

# Stop existing process if running
pm2 stop sipgateway 2>/dev/null || true
pm2 delete sipgateway 2>/dev/null || true

# Start with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup 2>/dev/null || true

echo "✅ Deployment completed!"
echo "📊 Monitor with: pm2 monit"
echo "📋 Logs: pm2 logs sipgateway"
echo "🔄 Restart: pm2 restart sipgateway"
echo "🛑 Stop: pm2 stop sipgateway"
EOF

chmod +x "$DEPLOY_DIR/deploy-remote.sh"

echo "📤 Uploading files to remote server..."

# Build SSH command with optional key and port
SSH_CMD="ssh"
if [[ -n "$DEPLOY_SSH_KEY_PATH" ]]; then
    SSH_CMD="$SSH_CMD -i $DEPLOY_SSH_KEY_PATH"
fi
if [[ -n "$DEPLOY_SSH_PORT" && "$DEPLOY_SSH_PORT" != "22" ]]; then
    SSH_CMD="$SSH_CMD -p $DEPLOY_SSH_PORT"
fi

# Create remote directory
$SSH_CMD $DEPLOY_SERVER_USER@$DEPLOY_SERVER_HOST "mkdir -p $DEPLOY_SERVER_PATH"

# Upload files
scp -r "$DEPLOY_DIR"/* $DEPLOY_SERVER_USER@$DEPLOY_SERVER_HOST:$DEPLOY_SERVER_PATH/

echo "🔧 Running deployment on remote server..."
$SSH_CMD $DEPLOY_SERVER_USER@$DEPLOY_SERVER_HOST "cd $DEPLOY_SERVER_PATH && chmod +x deploy-remote.sh && ./deploy-remote.sh"

echo ""
echo "🎉 Deployment completed successfully!"
echo "📡 API is available at: http://$DEPLOY_SERVER_HOST:${APP_PORT:-3000}"
echo "🏥 Health check: http://$DEPLOY_SERVER_HOST:${APP_PORT:-3000}/health"
echo "📚 API docs: http://$DEPLOY_SERVER_HOST:${APP_PORT:-3000}/api/sip-config"
echo ""
echo "📋 Remote server commands:"
echo "  Monitor: $SSH_CMD $DEPLOY_SERVER_USER@$DEPLOY_SERVER_HOST 'pm2 monit'"
echo "  Logs: $SSH_CMD $DEPLOY_SERVER_USER@$DEPLOY_SERVER_HOST 'pm2 logs sipgateway'"
echo "  Restart: $SSH_CMD $DEPLOY_SERVER_USER@$DEPLOY_SERVER_HOST 'pm2 restart sipgateway'"
echo "  Stop: $SSH_CMD $DEPLOY_SERVER_USER@$DEPLOY_SERVER_HOST 'pm2 stop sipgateway'"
echo "  Status: $SSH_CMD $DEPLOY_SERVER_USER@$DEPLOY_SERVER_HOST 'pm2 status'"

# Cleanup
rm -rf "$TEMP_DIR" 