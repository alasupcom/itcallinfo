const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { spawn } = require('child_process');
require('dotenv').config();

async function setupWithSSH() {
  console.log('🔍 Setting up SSH tunnel...');
  
  const deploymentHost = process.env.DEPLOYMENT_HOST;
  if (!deploymentHost) {
    throw new Error('DEPLOYMENT_HOST environment variable is required for SSH setup');
  }
  
  const sshProcess = spawn('ssh', [
    '-L', '3307:localhost:3306',
    '-o', 'StrictHostKeyChecking=no',
    `root@${deploymentHost}`
  ]);

  // Wait for SSH tunnel to establish
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3307,
      user: process.env.DB_USER || '',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || '',
    });

    console.log('🔍 Checking if admin user exists...');
    const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [process.env.ADMIN_USERNAME || 'admin']);

    if (rows.length === 0) {
      console.log('📝 Creating admin user...');
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || '', 10);
      await connection.execute(
        'INSERT INTO users (username, email, password, full_name, status, is_verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [process.env.ADMIN_USERNAME || 'admin', process.env.ADMIN_EMAIL || '', hashedPassword, 'System Administrator', 'active', true, new Date()]
      );
      console.log('✅ Admin user created successfully!');
      console.log('📋 Admin credentials:');
      console.log(`   Username: ${process.env.ADMIN_USERNAME || ''}`);
      console.log(`   Password: ${process.env.ADMIN_PASSWORD || ''}`);
      console.log(`   Email: ${process.env.ADMIN_EMAIL || ''}`);
    } else {
      console.log('✅ Admin user already exists');
      console.log('📋 Admin credentials:');
      console.log(`   Username: ${process.env.ADMIN_USERNAME || ''}`);
      console.log(`   Password: ${process.env.ADMIN_PASSWORD || ''}`);
      console.log(`   Email: ${process.env.ADMIN_EMAIL || ''}`);
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
    throw error;
  } finally {
    // Kill SSH tunnel
    sshProcess.kill();
  }
}

// Alternative: Direct connection for server deployment
async function setupDirect() {
  console.log('🔍 Connecting to MySQL directly (server deployment)...');
  
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || '',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || '',
    });

    console.log('🔍 Checking if admin user exists...');
    const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [process.env.ADMIN_USERNAME || '']);

    if (rows.length === 0) {
      console.log('📝 Creating admin user...');
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || '', 10);
      await connection.execute(
        'INSERT INTO users (username, email, password, full_name, status, is_verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [process.env.ADMIN_USERNAME || 'admin', process.env.ADMIN_EMAIL || '', hashedPassword, 'System Administrator', 'active', true, new Date()]
      );
      console.log('✅ Admin user created successfully!');
      console.log('📋 Admin credentials:');
      console.log(`   Username: ${process.env.ADMIN_USERNAME || ''}`);
      console.log(`   Password: ${process.env.ADMIN_PASSWORD || ''}`);
      console.log(`   Email: ${process.env.ADMIN_EMAIL || ''}`);
    } else {
      console.log('✅ Admin user already exists');
      console.log('📋 Admin credentials:');
      console.log(`   Username: ${process.env.ADMIN_USERNAME || ''}`);
      console.log(`   Password: ${process.env.ADMIN_PASSWORD || ''}`);
      console.log(`   Email: ${process.env.ADMIN_EMAIL || ''}`);
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Check if we're on the server (localhost connection should work)
    if (process.env.NODE_ENV === 'production' || process.argv.includes('--server')) {
      await setupDirect();
    } else {
      await setupWithSSH();
    }
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n📋 Manual SSH Tunnel Setup:');
    console.log('1. Open a new terminal and run:');
    const deploymentHost = process.env.DEPLOYMENT_HOST || 'your-deployment-host';
    console.log(`   ssh -L 3307:localhost:3306 root@${deploymentHost}`);
    console.log('2. Keep that terminal open, then run:');
    console.log('   DB_HOST=127.0.0.1 DB_PORT=3307 node scripts/setup-admin.js');
    console.log('\n📋 Required Environment Variables:');
    console.log('   DEPLOYMENT_HOST - Your deployment server hostname/IP');
    console.log('   DB_USER - Database username');
    console.log('   DB_PASSWORD - Database password');
    console.log('   DB_NAME - Database name');
    console.log('   ADMIN_USERNAME - Admin username to create');
    console.log('   ADMIN_PASSWORD - Admin password to create');
    console.log('   ADMIN_EMAIL - Admin email address');
    process.exit(1);
  }
}

main();