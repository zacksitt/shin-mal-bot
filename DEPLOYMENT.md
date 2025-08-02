# Production Deployment Guide

## Quick Setup

### 1. Server Requirements
- Node.js 18+
- MongoDB
- PM2 (for process management)

### 2. Install PM2
```bash
npm install -g pm2
```

### 3. Setup Environment
```bash
cp env.example .env
# Edit .env with your BOT_TOKEN and MONGODB_URI
```

### 4. Deploy
```bash
# Install dependencies
npm ci --only=production

# Build
npm run build

# Start with PM2
pm2 start ecosystem.config.cjs --env production
```

### 5. Monitor
```bash
pm2 status
pm2 logs shin-mal-bot
```

## Environment Variables
- `BOT_TOKEN`: Your Telegram bot token
- `MONGODB_URI`: MongoDB connection string
- `NODE_ENV`: production

## PM2 Commands
- `pm2 restart shin-mal-bot` - Restart
- `pm2 stop shin-mal-bot` - Stop
- `pm2 delete shin-mal-bot` - Remove 