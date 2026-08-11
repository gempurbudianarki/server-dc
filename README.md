# Cybersecurity Community of Aceh (CCA) - Discord Server & Bot

Official Discord Bot & Automated Server Builder for **CYBERSECURITY COMMUNITY OF ACEH (CCA)**.

## 🛡️ Features
- **Automated 1-Click Server Builder (`npm run setup`):** Generates 10 categories, 35+ channels, and 5 roles with high-tech cyberpunk aesthetics and fancy Unicode headers.
- **Dynamic Captcha Verification (`src/features/verification.js`):** Anti-bot captcha math verification with duplicate verification safeguards.
- **Private Thread Ticket Helpdesk (`src/features/tickets.js`):** Scalable support ticket system using Private Threads.
- **RSS Cyber Threat Feed (`src/features/newsFeed.js`):** Auto-fetches cybersecurity news with SQLite deduplication.
- **XP Leveling & Hacker Reputation System (`src/features/leveling.js`):** Earn XP on messages, rank cards (`/rank`), leaderboards (`/leaderboard`), and automatic role rewards.
- **Anti-Nuke Security Safeguard (`src/events/antiNuke.js`):** Detects burst channel deletions and strips moderator roles automatically.

## 🚀 Quick Start
```bash
# Install dependencies
npm install

# Run 1-click server builder
npm run setup

# Start bot service
npm start
```
