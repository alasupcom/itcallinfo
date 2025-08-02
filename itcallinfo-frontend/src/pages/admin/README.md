# Admin Dashboard

## Overview
The itCallInfo Admin Dashboard provides comprehensive system management capabilities for administrators to monitor and control the itCallInfo platform.

## Features

### 🔐 Authentication
- **Default Credentials**: admin / 123456
- Secure login with session management
- Admin-only access control

### 📊 Dashboard Overview
- **User Statistics**: Total users, active/inactive counts, online/offline status
- **SIP Configuration Usage**: Real-time usage statistics for the 2400-2500 username range
- **System Information**: Uptime, memory usage, Node.js version
- **Visual Analytics**: Progress bars and status indicators

### 👥 User Management
- **User List**: View all registered users with search and filter capabilities
- **User Details**: Comprehensive user information including:
  - Profile data (username, email, full name, phone)
  - Account status (active/inactive, online/offline, verified/unverified)
  - SIP configuration assignment
  - Account creation date
- **User Actions**:
  - Activate/Deactivate users
  - View detailed user information
  - Edit user profile data

### 📞 SIP Configuration Management
- **Available Configurations**: View all unassigned SIP configurations in the 2400-2500 range
- **Assigned Configurations**: Monitor currently assigned SIP configurations
- **Configuration Actions**:
  - Unassign SIP configurations from users
  - Reassign configurations to different users
  - Release configurations back to the pool

### 🗄️ Database Management
- **Table Overview**: View data from all database tables
- **User Records**: Complete user database information
- **SIP Configuration Records**: All SIP configuration assignments
- **Statistics**: Record counts and usage metrics

### ⚙️ System Administration
- **System Information**: Real-time system metrics
- **Quick Actions**: Refresh data, export/import functionality
- **Performance Monitoring**: Memory usage, uptime tracking

## API Endpoints

### Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/auth/logout` - Logout

### Dashboard Data
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - All users
- `GET /api/admin/users/:id` - User details
- `GET /api/admin/sip-configs` - SIP configurations
- `GET /api/admin/database/:table` - Database table data

### User Management
- `POST /api/admin/users/:id/activate` - Activate user
- `POST /api/admin/users/:id/deactivate` - Deactivate user

### SIP Configuration Management
- `POST /api/admin/sip-configs/:id/unassign` - Unassign SIP configuration
- `POST /api/admin/sip-configs/assign` - Assign SIP configuration to user

## Security Features

- **Admin-only Access**: Routes protected by admin authentication middleware
- **Session Management**: Secure session handling with credentials
- **Input Validation**: All inputs validated and sanitized
- **Error Handling**: Comprehensive error handling and user feedback

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Node.js with Express, TypeScript
- **Database**: Drizzle ORM with SQLite/PostgreSQL
- **UI Components**: Custom components with Lucide icons
- **State Management**: React hooks and context

## Usage Instructions

1. **Access**: Navigate to `/admin/login`
2. **Login**: Use credentials admin / 123456
3. **Dashboard**: Access the main dashboard at `/admin/dashboard`
4. **Navigation**: Use the tab navigation to switch between different sections
5. **Actions**: Use the action buttons to perform administrative tasks
6. **Logout**: Click the logout button to end the session

## Configuration

The admin dashboard respects the following environment variables:
- `TEST_SIP_RANGE`: Enable/disable username range filtering (2400-2500)
- `SIP_GATEWAY_URL`: SIP gateway API endpoint
- `SIP_GATEWAY_TIMEOUT`: API timeout configuration

## Future Enhancements

- User activity logs and audit trails
- Advanced analytics and reporting
- Bulk user operations
- Email notifications for system events
- Advanced SIP configuration management
- System backup and restore functionality 