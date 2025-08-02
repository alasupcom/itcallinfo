# SIP Gateway API - Deployment Guide

## Prerequisites

- Node.js 18+ installed
- MySQL database server
- Environment variables configured

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=mysql://username:password@host:port/database_name

# Server Configuration
PORT=3000
NODE_ENV=production

# Optional: Logging
LOG_LEVEL=info
```

## Local Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Production Deployment Options

### 1. Traditional VPS/Server Deployment

#### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Build the application
npm run build

# Start with PM2
pm2 start dist/server.js --name "sipgateway"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### Using Systemd

Create `/etc/systemd/system/sipgateway.service`:

```ini
[Unit]
Description=SIP Gateway API
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/sipgateway
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=DATABASE_URL=mysql://username:password@host:port/database_name

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable sipgateway
sudo systemctl start sipgateway
sudo systemctl status sipgateway
```

### 2. Docker Deployment

#### Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

#### Create docker-compose.yml

```yaml
version: '3.8'

services:
  sipgateway:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - mysql
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

volumes:
  mysql_data:
```

#### Deploy with Docker

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f sipgateway

# Stop services
docker-compose down
```

### 3. Cloud Platform Deployment

#### Heroku

```bash
# Install Heroku CLI
# Create Procfile
echo "web: npm start" > Procfile

# Deploy
heroku create your-app-name
heroku config:set DATABASE_URL=your-database-url
git push heroku main
```

#### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### DigitalOcean App Platform

1. Connect your GitHub repository
2. Configure environment variables
3. Set build command: `npm run build`
4. Set run command: `npm start`

### 4. Reverse Proxy Setup (Nginx)

Create `/etc/nginx/sites-available/sipgateway`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/sipgateway /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Database Setup

### 1. Create Database

```sql
CREATE DATABASE sipgateway;
CREATE USER 'sipgateway_user'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON sipgateway.* TO 'sipgateway_user'@'%';
FLUSH PRIVILEGES;
```

### 2. Run Database Migrations

```bash
# Push schema to database
npm run db:push

# Or use Drizzle Studio to manage migrations
npm run db:studio
```

## SSL/HTTPS Setup

### Using Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Logging

### 1. Application Logs

```bash
# PM2 logs
pm2 logs sipgateway

# Systemd logs
sudo journalctl -u sipgateway -f

# Docker logs
docker-compose logs -f sipgateway
```

### 2. Health Check Endpoint

Add to your application:

```typescript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

### 3. Process Monitoring

```bash
# PM2 monitoring
pm2 monit

# System monitoring
htop
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **Database Security**: Use strong passwords and limit access
3. **Firewall**: Configure firewall rules
4. **Updates**: Keep dependencies updated
5. **Backups**: Regular database backups

## Troubleshooting

### Common Issues

1. **Port already in use**: Change port in environment variables
2. **Database connection failed**: Check DATABASE_URL and network connectivity
3. **Permission denied**: Check file permissions and user access
4. **Memory issues**: Monitor memory usage and optimize if needed

### Debug Commands

```bash
# Check if port is in use
netstat -tulpn | grep :3000

# Check process status
ps aux | grep node

# Check disk space
df -h

# Check memory usage
free -h
```

## Performance Optimization

1. **Database Indexing**: Add indexes to frequently queried columns
2. **Connection Pooling**: Configure database connection pool
3. **Caching**: Implement Redis for caching if needed
4. **Load Balancing**: Use multiple instances behind a load balancer 