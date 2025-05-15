#!/usr/bin/env node

/**
 * Server setup script for itcallinfo
 * Prepares a remote server for deployment
 */

const { execSync } = require('child_process');
const readline = require('readline');

// Configuration
const config = {
  ssh: {
    user: 'root',
    host: '31.220.90.171',
    remoteDir: '/itcallinfo'
  },
  app: {
    name: 'itcallinfo',
    port: 5000
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

// Helper to log with colors
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Execute a command and return its output
function exec(command, options = {}) {
  try {
    return execSync(command, { stdio: 'inherit', ...options });
  } catch (error) {
    log(`Error executing command: ${command}`, colors.red);
    log(error.message, colors.red);
    process.exit(1);
  }
}

// Ask a question and get user input
async function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

// Main setup function
async function setupServer() {
  try {
    log('Preparing SSH server for deployment...', colors.blue);
    
    // Confirm before setup
    const confirmation = await askQuestion(`Setup server ${config.ssh.user}@${config.ssh.host}? (y/n): `);
    if (confirmation.toLowerCase() !== 'y') {
      log('Server setup cancelled', colors.yellow);
      return;
    }
    
    // SSH commands for server setup
    const sshCommands = `
      # Update package repositories
      echo "Updating package repositories..."
      sudo apt-get update

      # Install Node.js and npm if not already installed
      if ! command -v node &> /dev/null; then
        echo "Installing Node.js and npm..."
        # Install Node.js 18.x (or your preferred version)
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
      fi

      # Check Node.js and npm versions
      echo "Installed Node.js version:"
      node -v
      echo "Installed npm version:"
      npm -v

      # Install PM2 globally if not already installed
      if ! command -v pm2 &> /dev/null; then
        echo "Installing PM2 globally..."
        sudo npm install -g pm2
      fi

      # Create application directory if it doesn't exist
      if [ ! -d "${config.ssh.remoteDir}" ]; then
        echo "Creating application directory..."
        sudo mkdir -p ${config.ssh.remoteDir}
        sudo chown ${config.ssh.user}:${config.ssh.user} ${config.ssh.remoteDir}
      fi

      # Configure firewall to allow traffic on the application port
      echo "Configuring firewall..."
      if command -v ufw &> /dev/null; then
        sudo ufw status | grep -q "Status: active" && {
          sudo ufw allow ${config.app.port}/tcp
          echo "Firewall configured to allow traffic on port ${config.app.port}/tcp"
        } || {
          echo "Firewall is not active, skipping firewall configuration"
        }
      else
        echo "UFW firewall not found, skipping firewall configuration"
      fi

      # Set up Nginx reverse proxy (optional but recommended)
      if command -v nginx &> /dev/null; then
        echo "Setting up Nginx reverse proxy..."
        
        # Create Nginx configuration file
        sudo bash -c 'cat > /tmp/nginx-${config.app.name}.conf << NGINX
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:${config.app.port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \\$host;
        proxy_cache_bypass \\$http_upgrade;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
    }
}
NGINX'
        
        sudo mv /tmp/nginx-${config.app.name}.conf /etc/nginx/sites-available/${config.app.name}
        
        # Enable the site
        if [ ! -f /etc/nginx/sites-enabled/${config.app.name} ]; then
          sudo ln -s /etc/nginx/sites-available/${config.app.name} /etc/nginx/sites-enabled/
        fi
        
        # Test Nginx configuration
        sudo nginx -t && sudo systemctl reload nginx
        echo "Nginx configured as reverse proxy"
      else
        echo "Nginx not installed, skipping reverse proxy setup"
      fi

      # Setup PM2 to start on system boot
      echo "Setting up PM2 to start on system boot..."
      sudo env PATH=\\$PATH:/usr/bin pm2 startup systemd -u ${config.ssh.user} --hp /home/${config.ssh.user}
      
      echo "Server setup complete!"
    `;

    // Execute SSH commands
    exec(`ssh ${config.ssh.user}@${config.ssh.host} "${sshCommands}"`);
    
    log('SSH server prepared for deployment!', colors.green);
    log('Next steps:', colors.blue);
    log('1. Run the deployment script: node scripts/deploy.js');
    log('2. If using Nginx, configure SSL with Certbot: sudo certbot --nginx -d yourdomain.com');
    
  } catch (error) {
    log('Server setup failed!', colors.red);
    log(error.message, colors.red);
    process.exit(1);
  }
}

// Run the server setup
setupServer();