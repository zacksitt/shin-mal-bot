# Shin Mal - Telegram Bill Split Bot

A Telegram bot for splitting bills and calculating payments in Burmese language.

## 🚀 Production Deployment

### Prerequisites

1. **Node.js 18+** installed on your server
2. **PM2** for process management: `npm install -g pm2`
3. **MongoDB** database (local or cloud)
4. **Telegram Bot Token** from @BotFather

### Quick Start

1. **Clone and setup:**
```bash
git clone <your-repo>
cd shin-mal
```

2. **Configure environment:**
```bash
cp env.example .env
# Edit .env with your settings
```

3. **Deploy:**
```bash
./deploy.sh
```

### Manual Deployment

1. **Install dependencies:**
```bash
npm ci --only=production
```

2. **Build the application:**
```bash
npm run build
```

3. **Start with PM2:**
```bash
pm2 start ecosystem.config.js --env production
```

### Environment Variables

Create a `.env` file with:

```env
# Required
BOT_TOKEN=your_telegram_bot_token_here
MONGODB_URI=mongodb://localhost:27017/shin-mal

# Optional
NODE_ENV=production
LOG_LEVEL=info
```

### PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs shin-mal-bot

# Restart bot
pm2 restart shin-mal-bot

# Stop bot
pm2 stop shin-mal-bot

# Monitor
pm2 monit
```

### Development

```bash
# Install all dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run build

# Run built version
npm run build:start
```

## 📋 Features

- ✅ Bill creation and splitting
- ✅ Multiple payment support
- ✅ Burmese language interface
- ✅ MongoDB data persistence
- ✅ Finish button for early completion
- ✅ Proportional payment distribution

## 🛠️ Commands

- `/start` - Start the bot
- `/single` - One person paid the full amount
- `/multi` - Multiple people paid different amounts
- `/menu` - Show main menu

## 📁 Project Structure

```
shin-mal/
├── src/
│   ├── bot.ts              # Main bot file
│   ├── db.ts               # Database connection
│   ├── commands/
│   │   └── newbill.ts      # Bill creation logic
│   ├── languages/
│   │   └── burmese.ts      # Burmese messages
│   └── models/
│       └── index.ts        # Database models
├── ecosystem.config.js      # PM2 configuration
├── deploy.sh               # Deployment script
└── package.json
``` 