#!/usr/bin/env node

/**
 * Deployment script for itcallinfo
 * This script handles the build and deployment process
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
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

// Main deployment function
async function deploy() {
  try {
    // 1. Clean previous builds
    log('Cleaning previous builds...', colors.blue);
    exec('rm -rf dist');

    // 2. Install dependencies
    log('Installing dependencies...', colors.blue);
    exec('npm ci');

    // 3. Build the application
    log('Building application...', colors.blue);
    exec('npm run build');
    log('Build complete!', colors.green);

    // 4. Create deployment package
    log('Creating deployment package...', colors.blue);
    exec('mkdir -p deploy');
    exec('cp -r dist deploy/');
    exec('cp package.json deploy/');
    exec('cp package-lock.json deploy/');

    // Handle environment file
    if (fs.existsSync('.env.production')) {
      exec('cp .env.production deploy/.env');
      log('Using .env.production file', colors.yellow);
    } else if (fs.existsSync('.env')) {
      exec('cp .env deploy/');
      log('Using .env file', colors.yellow);
    } else {
      log('No .env file found, creating basic production .env', colors.yellow);
      fs.writeFileSync('deploy/.env', `NODE_ENV=production\nPORT=${config.app.port}\nALLOWED_ORIGINS=https://yourdomain.com\n`);
    }

    // Create archive
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const filename = `${config.app.name}-${timestamp}.tar.gz`;
    exec(`tar -czf ${filename} -C deploy .`);
    exec('rm -rf deploy');

    // 5. Deploy to server
    log('Deploying to server...', colors.blue);
    
    // Confirm before deployment
    const confirmation = await askQuestion(`Deploy to ${config.ssh.user}@${config.ssh.host}? (y/n): `);
    if (confirmation.toLowerCase() !== 'y') {
      log('Deployment cancelled', colors.yellow);
      exec(`rm ${filename}`);
      return;
    }

    // Upload to server
    exec(`scp ${filename} ${config.ssh.user}@${config.ssh.host}:${config.ssh.remoteDir}/`);

    // SSH commands for deployment
    const sshCommands = [
      `cd ${config.ssh.remoteDir}`,
      `mkdir -p temp`,
      `tar -xzf ${filename} -C temp`,
      `pm2 stop ${config.app.name} || true`,
      `if [ -d "${config.app.name}" ]; then`,
      `  echo "Creating backup of previous deployment"`,
      `  mv ${config.app.name} ${config.app.name}_backup_$(date +%Y%m%d%H%M%S)`,
      `  ls -td ${config.app.name}_backup_* | tail -n +4 | xargs -I {} rm -rf {}`,
      `fi`,
      `mv temp ${config.app.name}`,
      `cd ${config.app.name}`,
      `npm ci --only=production`,
      `pm2 start dist/server/index.js --name ${config.app.name} --env production`,
      `pm2 save`,
      `rm -f ../${filename}`,
      `pm2 ls`
    ].join('; ');

    exec(`ssh ${config.ssh.user}@${config.ssh.host} "${sshCommands}"`);
    
    // Cleanup local archive
    exec(`rm ${filename}`);
    log('Deployment complete!', colors.green);
    
  } catch (error) {
    log('Deployment failed!', colors.red);
    log(error.message, colors.red);
    process.exit(1);
  }
}

// Run the deployment
deploy();