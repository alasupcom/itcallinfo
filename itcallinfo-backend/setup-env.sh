#!/bin/bash

# Setup environment variables for itcallinfo-backend
echo "Setting up environment variables for itcallinfo-backend..."

# Check if .env file already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Creating backup as .env.backup"
    cp .env .env.backup
fi

# Create .env file from example
if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo ""
    echo "📝 Please edit the .env file with your actual values:"
    echo "   - Database credentials"
    echo "   - Email configuration"
    echo "   - Twilio credentials"
    echo "   - Session secret"
    echo ""
    echo "🔐 IMPORTANT: Change the default passwords and secrets!"
else
    echo "❌ .env.example file not found. Please create it first."
    exit 1
fi

echo "✅ Environment setup complete!"
echo "📋 Next steps:"
echo "   1. Edit .env file with your actual values"
echo "   2. Run 'npm install' to install dependencies"
echo "   3. Run 'npm run dev' to start development server"
