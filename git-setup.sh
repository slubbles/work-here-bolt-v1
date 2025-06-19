#!/bin/bash

# Git Setup Script for Snarbles Token Platform
echo "🚀 Setting up Git for Snarbles Token Platform..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
else
    echo "✅ Git repository already initialized"
fi

# Add all files
echo "📝 Adding all files to Git..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit"
else
    echo "💾 Creating initial commit..."
    git commit -m "Initial commit: Snarbles Token Platform

Features included:
- Complete token creation platform
- Mobile-optimized responsive design  
- Dashboard with analytics
- Tokenomics simulator
- Token verification system
- Solana wallet integration
- Dark/light theme support
- Production-ready code"
fi

echo "✨ Git setup complete!"
echo ""
echo "🔗 Next steps:"
echo "1. Create a repository on GitHub"
echo "2. Run: git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git"
echo "3. Run: git branch -M main"
echo "4. Run: git push -u origin main"
echo ""
echo "🌟 Your Snarbles Token Platform is ready for GitHub!"