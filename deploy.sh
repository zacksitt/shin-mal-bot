#!/bin/bash

# Production Deployment Script for Shin Mal Bot

echo "🚀 Starting production deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy env.example to .env and configure your settings"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Build the application
echo "🔨 Building application..."
npm run build

# Create logs directory
mkdir -p logs

# Start with PM2
echo "🚀 Starting bot with PM2..."
pm2 start ecosystem.config.cjs --env production

echo "✅ Deployment complete!"
echo "📊 Check status: pm2 status"
echo "📋 View logs: pm2 logs shin-mal-bot" 