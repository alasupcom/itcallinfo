# ITCallInfo Backend API

This is the backend API server for the ITCallInfo application.

## Features

- User authentication and authorization
- SIP configuration management
- Admin dashboard API
- Database management with Drizzle ORM
- Session management with Express Session

## Quick Start

### Development

```bash
npm install
npm run dev
```

The server will start on port 5000.

### Production

```bash
npm install
npm run build
npm start
```

### Deployment

```bash
npm run deploy
```

This will build and deploy to the production server.

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/user` - Get current user
- `PATCH /api/user` - Update user profile
- `GET /api/sip/config` - Get SIP configuration
- `PATCH /api/sip/config` - Update SIP configuration

### Admin Endpoints

- `POST /api/admin/login` - Admin login
- `GET /api/admin/users` - Get all users
- `GET /api/admin/sip-configs` - Get SIP configurations
- `POST /api/admin/sip-configs/:id/assign` - Assign SIP config to user
- `POST /api/admin/sip-configs/:id/unassign` - Unassign SIP config

## Environment Variables

Create a `.env` file with:

```env
NODE_ENV=development
DATABASE_URL=your_database_url
SESSION_SECRET=your_session_secret
SIP_GATEWAY_URL=http://localhost:3000/api/sip-config
```

## Database

The project uses Drizzle ORM with MySQL/Neon database.

```bash
npm run db:push
```

## PM2

The production deployment uses PM2 for process management:

```bash
pm2 start server/index.js --name itcallinfo-api
pm2 restart itcallinfo-api
```
