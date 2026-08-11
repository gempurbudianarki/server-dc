# Design Spec: Cybersecurity Community of Aceh (CCA) Discord Server & Bot

## Executive Summary
This design specification defines the complete architecture for the **Cybersecurity Community of Aceh (CCA)** Discord server, alongside an elite, secure custom Node.js (Discord.js v14) bot. The bot features an automated 1-click server builder script (`npm run setup`) that instantly generates all roles, categories, channels, and permissions, as well as a 24/7 running service with SQLite persistence for dynamic verification, scalable private-thread tickets, RSS cyber news deduplication feeds, self-assignable role pickers, anti-nuke moderation listeners, and security audit logging.

---

## 1. Security & Best Practices Enforcement

1. **Principle of Least Privilege (Bot Permissions):**
   - The bot does **not** request `Administrator` permission at the Guild level.
   - Bot permissions requested: `Manage Roles`, `Manage Channels`, `Manage Threads`, `Manage Messages`, `View Audit Log`, `Send Messages`, `Embed Links`, `Read Message History`.
2. **Secrets & Single Source of Truth:**
   - `.env` is the **only** source of truth for runtime configuration (`config.js`). No `token.md` fallback.
   - Initial setup migrates `BOT_TOKEN` & `GUILD_ID` from `token.md` into `.env`.
   - `.gitignore` strictly covers `.env`, `token.md`, `node_modules`, and `data/*.db`. `.env.example` is provided.
3. **Dynamic Math Verification (Anti-Bot Captcha):**
   - Modal captcha generates random math challenges dynamically per session (e.g., `Random(10..99) + Random(1..9)`). Answers are stored in transient cache with a 3-minute expiration.
4. **Anti-Nuke & Rate-Limit Layer:**
   - **Interaction Cooldown:** 5-second per-user memory rate-limit on ticket & role picker buttons to prevent interaction spam.
   - **Anti-Nuke Safeguard:** Listens to `channelDelete` and `guildBanAdd`. If a moderator performs >3 channel deletions or bans within 10 seconds, the bot automatically strips their moderation roles and logs an emergency alert to `#audit-and-security-logs` and alerts `[CCA] Root Admin`.
5. **Persistence Layer (SQLite Database):**
   - Uses SQLite (`sqlite3` / `better-sqlite3`) stored at `data/cca_bot.db`.
   - Tables: `tickets` (persistent counter & thread IDs), `rss_posted` (posted article GUIDs), `verifications` (user verification timestamp).
6. **Modern Discord API & Guild Command Scope:**
   - 100% Slash Commands registered to target `GUILD_ID` for instant deployment.
   - Explicit Intents: `GatewayIntentBits.Guilds`, `GatewayIntentBits.GuildMembers` *(Requires enabling "Server Members Intent" in Discord Developer Portal)*, `GatewayIntentBits.GuildMessages`.
7. **Scalable Ticket Architecture (Private Threads):**
   - Tickets use **Private Threads** under `#create-ticket` instead of creating new text channels. Prevents hitting Discord's 500-channel limit while maintaining privacy per ticket.

---

## 2. Discord Server Hierarchy & Channel Blueprint

### 2.1 Roles & Permission Matrix
1. **`[CCA] Root Admin`**
   - **Color:** Dark Red (#990000)
   - **Permissions:** Administrator (Human Admins)
2. **`[CCA] Cyber Sentinel`** (Moderators & SOC Team)
   - **Color:** Shield Blue (#0066CC)
   - **Permissions:** Manage Messages, Kick/Ban, Mute, View Audit Logs, Manage Threads
3. **`[CCA] Senior Researcher`** (Mentors & Practitioners)
   - **Color:** Emerald Green (#009966)
   - **Permissions:** Priority Speaker, Attach Files, Embed Links, Manage Events
4. **`[CCA] CTF Operator`** (CTF Players)
   - **Color:** Electric Purple (#9933FF)
   - **Permissions:** Access to `#ctf-war-room`, `#writeups-and-notes`
5. **`[CCA] Verified Member`** (Regular Community Members)
   - **Color:** Cyan / Neon Green (#00CCCC)
   - **Permissions:** View & send messages in all public lounge/domain/resource channels
6. **`@everyone`** (Unverified Guests)
   - **Permissions:** Read-only access to `#rules-and-guidelines` and `#verification`

---

### 2.2 Categories & Channel Structure

```
📌 1. WELCOME & GATEWAY
├── 📜 #rules-and-guidelines  (Rules & ethics)
├── 📢 #announcements          (Official announcements)
├── 🔒 #verification           (Dynamic Captcha Verification)
└── 👋 #welcome-lobby          (Member join greetings)

🚨 2. INTELLIGENCE & CYBER NEWS
├── 🗞️ #cyber-news             (Auto-feed from RSS with SQLite deduplication)
├── ⚠️ #threat-alerts          (CVEs, Zero-days, Security Advisories)
└── 📆 #events-and-webinars    (CCA meetups & workshops)

💬 3. COMMUNITY LOUNGE
├── 💭 #general-chat           (General discussions)
├── ❓ #ask-for-help           (Technical assistance & Q&A)
├── 💡 #showcase-and-research  (Projects, tools, research sharing)
└── 🤖 #bot-commands           (Slash command triggers & role picker)

🛡️ 4. CYBERSECURITY DOMAINS
├── 🌐 #web-application-security
├── 🛰️ #network-and-cloud-sec
├── 🔍 #forensics-and-dfir
├── 🧩 #reversing-and-pwn
├── 🔴 #red-team-ops
└── 🔵 #blue-team-soc

⚔️ 5. CYBER LABS & CTF
├── 🚩 #ctf-info               (Upcoming CTF events)
├── 🤝 #team-recruitment       (CTF team formation)
├── 📝 #writeups-and-notes     (Writeups & challenge solutions)
└── 🧪 #labs-discussion        (TryHackMe, HTB, PicoCTF, PortSwigger)

🎯 6. BUG BOUNTY & DISCLOSURES
├── 🎯 #bug-bounty-lounge       (HackerOne, Bugcrowd, Intigriti & BSSN program discussions)
├── 🏆 #bounty-hall-of-fame     (Pamer bounty rewards, Hall of Fame certificates, & PoCs)
└── 📜 #responsible-disclosure  (Etika pelaporan celah keamanan & advisory)

📚 6. KNOWLEDGE & RESOURCES
├── 🗺️ #learning-roadmaps      (Career roadmaps)
├── 🛠️ #tools-sharing          (Open-source tools & scripts)
├── 📄 #cheatsheets            (Command reference & payloads)
└── 💼 #jobs-and-internships   (Career opportunities)

🎫 7. HELPDESK & SUPPORT
└── 🎟️ #create-ticket          (Private-Thread Ticket Creation Embed)

🛡️ 8. INTERNAL STAFF & AUDIT (Staff Only)
├── 💬 #staff-lounge           (Internal team communication)
├── 🚨 #audit-and-security-logs(Security, anti-nuke & audit logs)
└── 📂 #ticket-transcripts     (Archived ticket transcripts)

🎧 9. VOICE CHANNELS
├── 🔊 Lounge Voice
├── 🎙️ Workshop Room
├── ⚔️ CTF War Room 1
└── ⚔️ CTF War Room 2
```

---

## 3. Bot Architecture & Component Design

### 3.1 File System & Project Layout
Location: `e:\laragon\www\diskot`

```
diskot/
├── token.md                  # Legacy token source (migrated to .env)
├── .env                      # Environment config (BOT_TOKEN, GUILD_ID, CLIENT_ID)
├── .env.example              # Template for environment variables
├── .gitignore                # Ignores .env, token.md, node_modules, data/*.db
├── package.json              # Node.js dependencies
├── data/
│   └── cca_bot.db            # SQLite database file for state persistence
├── src/
│   ├── index.js              # Main bot entry point & client setup
│   ├── config.js             # Strictly loads from .env
│   ├── db/
│   │   └── database.js       # SQLite connection & schema initialization
│   ├── setup/
│   │   └── serverBuilder.js  # Automated 1-click server generator script
│   ├── events/
│   │   ├── ready.js          # Guild Slash command registration
│   │   ├── interactionCreate.js # Handler for Slash commands, buttons, modals with rate-limiting
│   │   ├── channelDelete.js  # Anti-nuke listener for mass channel deletion
│   │   └── guildBanAdd.js    # Anti-nuke listener for mass bans
│   ├── features/
│   │   ├── verification.js   # Dynamic captcha math generator & verification logic
│   │   ├── tickets.js        # Private Thread ticket system with persistent counter
│   │   ├── newsFeed.js       # RSS fetcher with SQLite deduplication
│   │   └── rolePicker.js     # Dropdown menu role assigner logic
│   └── utils/
│       ├── logger.js         # Security & audit logger helper
│       └── embedBuilder.js   # Pre-styled Discord embeds helper
```

---

## 4. Verification & Testing Strategy
1. **Developer Portal Setup:** Ensure "Server Members Intent" is enabled in Developer Portal.
2. **Environment Isolation:** Verify `.env` is loaded exclusively and `.gitignore` ignores secret files.
3. **Database Initialization Test:** SQLite DB creates `tickets`, `rss_posted`, and `verifications` tables cleanly.
4. **Automated Server Generation Test:** Run `node src/setup/serverBuilder.js` on target Guild.
5. **Anti-Nuke & Rate Limit Tests:** Verify button cooldowns and test burst deletion triggering safety alerts.
