const mysql = require('mysql2/promise');
require('dotenv').config();

async function addRoleColumn() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
  });

  try {
    console.log('Adding role column to users table...');
    
    // Check if role column already exists
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM users LIKE 'role'"
    );
    
    if (columns.length === 0) {
      // Add the role column
      await connection.execute(
        "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'"
      );
      console.log('✅ Role column added successfully!');
      
      // Update existing admin user to have role = 'admin'
      await connection.execute(
        "UPDATE users SET role = 'admin' WHERE username = 'admin' OR email = 'admin@itcallinfo.com'"
      );
      console.log('✅ Admin user role updated!');
    } else {
      console.log('✅ Role column already exists!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

addRoleColumn(); 