# CCA Discord Server & Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an automated 1-click Discord server generator and a secure Node.js (Discord.js v14) bot with SQLite persistence, dynamic captcha verification, private thread helpdesk tickets, RSS cyber news deduplication, and anti-nuke safeguards for the Cybersecurity Community of Aceh (CCA).

**Architecture:** A modular Node.js bot utilizing `discord.js` v14 with Slash commands and Interaction handlers. Data persistence (ticket counter, RSS posted GUIDs, verification log) is managed via SQLite (`sqlite3`). A standalone builder script (`npm run setup`) generates all 30+ channels, 9 categories, and 6 roles on the target Guild.

**Tech Stack:** Node.js (v18+), `discord.js` (v14), `sqlite3`, `rss-parser`, `dotenv`.

## Global Constraints
- `BOT_TOKEN` and `GUILD_ID` must be strictly loaded from `.env` via `dotenv` (no `token.md` fallback at runtime).
- Bot must use Principle of Least Privilege (no `Administrator` permission for the bot itself).
- Role hex colors must be valid (`[CCA] CTF Operator` uses `#9933FF`).
- Ticket system must use Private Threads under `#create-ticket`.

---

### Task 1: Environment & Secrets Setup

**Files:**
- Create: `e:\laragon\www\diskot\package.json`
- Create: `e:\laragon\www\diskot\.env`
- Create: `e:\laragon\www\diskot\.env.example`
- Create: `e:\laragon\www\diskot\.gitignore`
- Create: `e:\laragon\www\diskot\src\config.js`

**Interfaces:**
- Produces: `config` object `{ BOT_TOKEN, GUILD_ID, CLIENT_ID }` loaded from `.env`.

- [ ] **Step 1: Create `.gitignore`**

```gitignore
node_modules/
.env
token.md
data/*.db
*.log
```

- [ ] **Step 2: Create `.env.example` and `.env`**

`.env.example`:
```env
BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE
GUILD_ID=YOUR_TARGET_GUILD_ID_HERE
CLIENT_ID=YOUR_BOT_APPLICATION_ID_HERE
```

`.env` (Migrate from `token.md`):
```env
BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE
GUILD_ID=1536438328679866428
CLIENT_ID=1536450213525459024
```

- [ ] **Step 3: Create `package.json`**

```json
{
  "name": "cca-diskot-bot",
  "version": "1.0.0",
  "description": "Cybersecurity Community of Aceh Discord Bot & Server Builder",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "setup": "node src/setup/serverBuilder.js"
  },
  "dependencies": {
    "discord.js": "^14.14.1",
    "dotenv": "^16.4.5",
    "rss-parser": "^3.13.0",
    "sqlite3": "^5.1.7"
  }
}
```

- [ ] **Step 4: Create `src/config.js`**

```javascript
require('dotenv').config();

if (!process.env.BOT_TOKEN || !process.env.GUILD_ID) {
  console.error("❌ ERROR: BOT_TOKEN and GUILD_ID must be set in .env!");
  process.exit(1);
}

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  GUILD_ID: process.env.GUILD_ID,
  CLIENT_ID: process.env.CLIENT_ID || ""
};
```

---

### Task 2: Database Initialization Module (`src/db/database.js`)

**Files:**
- Create: `e:\laragon\www\diskot\src\db\database.js`

**Interfaces:**
- Produces: `db` (sqlite3 Database instance), `initDatabase()` function returning a Promise.

- [ ] **Step 1: Create `src/db/database.js`**

```javascript
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'cca_bot.db');
const db = new sqlite3.Database(dbPath);

function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Table for tickets
      db.run(`
        CREATE TABLE IF NOT EXISTS tickets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ticket_number INTEGER NOT NULL,
          thread_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          status TEXT DEFAULT 'OPEN',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => { if (err) reject(err); });

      // Table for RSS deduplication
      db.run(`
        CREATE TABLE IF NOT EXISTS rss_posted (
          guid TEXT PRIMARY KEY,
          source TEXT NOT NULL,
          posted_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => { if (err) reject(err); });

      // Table for member verifications
      db.run(`
        CREATE TABLE IF NOT EXISTS verifications (
          user_id TEXT PRIMARY KEY,
          verified_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else {
          console.log("✅ SQLite database initialized successfully at data/cca_bot.db");
          resolve(db);
        }
      });
    });
  });
}

module.exports = { db, initDatabase };
```

---

### Task 3: Automated 1-Click Server Generator (`src/setup/serverBuilder.js`)

**Files:**
- Create: `e:\laragon\www\diskot\src\setup\serverBuilder.js`

**Interfaces:**
- Consumes: `src/config.js`
- Produces: Command line script `npm run setup` that builds all roles, categories, channels, permissions, and embed components on Guild.

- [ ] **Step 1: Create `src/setup/serverBuilder.js`**

```javascript
const { Client, GatewayIntentBits, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { BOT_TOKEN, GUILD_ID } = require('../config');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const ROLES_SPEC = [
  { name: '[CCA] Root Admin', color: '#990000', hoist: true, mentionable: true, permissions: [PermissionFlagsBits.Administrator] },
  { name: '[CCA] Cyber Sentinel', color: '#0066CC', hoist: true, mentionable: true, permissions: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers, PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.ManageThreads, PermissionFlagsBits.ViewAuditLog] },
  { name: '[CCA] Senior Researcher', color: '#009966', hoist: true, mentionable: true, permissions: [PermissionFlagsBits.PrioritySpeaker, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ManageEvents] },
  { name: '[CCA] CTF Operator', color: '#9933FF', hoist: true, mentionable: true, permissions: [] },
  { name: '[CCA] Verified Member', color: '#00CCCC', hoist: true, mentionable: true, permissions: [] }
];

const CATEGORIES_SPEC = [
  {
    name: '📌 1. WELCOME & GATEWAY',
    channels: [
      { name: '📜-rules-and-guidelines', type: ChannelType.GuildText, readonly: true },
      { name: '📢-announcements', type: ChannelType.GuildText, readonly: true },
      { name: '🔒-verification', type: ChannelType.GuildText, readonly: true, special: 'verification' },
      { name: '👋-welcome-lobby', type: ChannelType.GuildText, readonly: true }
    ]
  },
  {
    name: '🚨 2. INTELLIGENCE & CYBER NEWS',
    channels: [
      { name: '🗞️-cyber-news', type: ChannelType.GuildText, readonly: true },
      { name: '⚠️-threat-alerts', type: ChannelType.GuildText, readonly: true },
      { name: '📆-events-and-webinars', type: ChannelType.GuildText, readonly: true }
    ]
  },
  {
    name: '💬 3. COMMUNITY LOUNGE',
    channels: [
      { name: '💭-general-chat', type: ChannelType.GuildText },
      { name: '❓-ask-for-help', type: ChannelType.GuildText },
      { name: '💡-showcase-and-research', type: ChannelType.GuildText },
      { name: '🤖-bot-commands', type: ChannelType.GuildText, special: 'rolepicker' }
    ]
  },
  {
    name: '🛡️ 4. CYBERSECURITY DOMAINS',
    channels: [
      { name: '🌐-web-application-security', type: ChannelType.GuildText },
      { name: '🛰️-network-and-cloud-sec', type: ChannelType.GuildText },
      { name: '🔍-forensics-and-dfir', type: ChannelType.GuildText },
      { name: '🧩-reversing-and-pwn', type: ChannelType.GuildText },
      { name: '🔴-red-team-ops', type: ChannelType.GuildText },
      { name: '🔵-blue-team-soc', type: ChannelType.GuildText }
    ]
  },
  {
    name: '⚔️ 5. CYBER LABS & CTF',
    channels: [
      { name: '🚩-ctf-info', type: ChannelType.GuildText },
      { name: '🤝-team-recruitment', type: ChannelType.GuildText },
      { name: '📝-writeups-and-notes', type: ChannelType.GuildText },
      { name: '🧪-labs-discussion', type: ChannelType.GuildText }
    ]
  },
  {
    name: '🎯 6. BUG BOUNTY & DISCLOSURES',
    channels: [
      { name: '🎯-bug-bounty-lounge', type: ChannelType.GuildText },
      { name: '🏆-bounty-hall-of-fame', type: ChannelType.GuildText },
      { name: '📜-responsible-disclosure', type: ChannelType.GuildText }
    ]
  },
  {
    name: '📚 6. KNOWLEDGE & RESOURCES',
    channels: [
      { name: '🗺️-learning-roadmaps', type: ChannelType.GuildText },
      { name: '🛠️-tools-sharing', type: ChannelType.GuildText },
      { name: '📄-cheatsheets', type: ChannelType.GuildText },
      { name: '💼-jobs-and-internships', type: ChannelType.GuildText }
    ]
  },
  {
    name: '🎫 7. HELPDESK & SUPPORT',
    channels: [
      { name: '🎟️-create-ticket', type: ChannelType.GuildText, readonly: true, special: 'ticket' }
    ]
  },
  {
    name: '🛡️ 8. INTERNAL STAFF & AUDIT',
    staffOnly: true,
    channels: [
      { name: '💬-staff-lounge', type: ChannelType.GuildText },
      { name: '🚨-audit-and-security-logs', type: ChannelType.GuildText },
      { name: '📂-ticket-transcripts', type: ChannelType.GuildText }
    ]
  },
  {
    name: '🎧 9. VOICE CHANNELS',
    channels: [
      { name: '🔊 Lounge Voice', type: ChannelType.GuildVoice },
      { name: '🎙️ Workshop Room', type: ChannelType.GuildVoice },
      { name: '⚔️ CTF War Room 1', type: ChannelType.GuildVoice },
      { name: '⚔️ CTF War Room 2', type: ChannelType.GuildVoice }
    ]
  }
];

client.once('ready', async () => {
  console.log(`🤖 Builder logged in as ${client.user.tag}`);
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    console.log(`🔨 Building server architecture for: ${guild.name} (${guild.id})`);

    // 1. Build Roles
    const createdRoles = {};
    for (const rSpec of ROLES_SPEC) {
      let role = guild.roles.cache.find(r => r.name === rSpec.name);
      if (!role) {
        role = await guild.roles.create({
          name: rSpec.name,
          color: rSpec.color,
          hoist: rSpec.hoist,
          mentionable: rSpec.mentionable,
          permissions: rSpec.permissions || []
        });
        console.log(`  ➕ Role created: ${role.name}`);
      } else {
        console.log(`  ✔️ Role exists: ${role.name}`);
      }
      createdRoles[rSpec.name] = role;
    }

    const everyoneRole = guild.roles.everyone;
    const verifiedRole = createdRoles['[CCA] Verified Member'];
    const sentinelRole = createdRoles['[CCA] Cyber Sentinel'];
    const adminRole = createdRoles['[CCA] Root Admin'];

    // 2. Build Categories & Channels
    for (const catSpec of CATEGORIES_SPEC) {
      let category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === catSpec.name);
      if (!category) {
        category = await guild.channels.create({
          name: catSpec.name,
          type: ChannelType.GuildCategory
        });
        console.log(`📂 Category created: ${category.name}`);
      }

      for (const chSpec of catSpec.channels) {
        let channel = guild.channels.cache.find(c => c.name === chSpec.name && c.parentId === category.id);
        if (!channel) {
          const permissionOverwrites = [];

          if (catSpec.staffOnly) {
            permissionOverwrites.push(
              { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
              { id: sentinelRole.id, allow: [PermissionFlagsBits.ViewChannel] },
              { id: adminRole.id, allow: [PermissionFlagsBits.ViewChannel] }
            );
          } else if (chSpec.name === '🔒-verification' || chSpec.name === '📜-rules-and-guidelines') {
            permissionOverwrites.push(
              { id: everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] }
            );
          } else {
            // General community channel permissions
            permissionOverwrites.push(
              { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
              { id: verifiedRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
            );
            if (chSpec.readonly) {
              permissionOverwrites.push(
                { id: verifiedRole.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] }
              );
            }
          }

          channel = await guild.channels.create({
            name: chSpec.name,
            type: chSpec.type,
            parent: category.id,
            permissionOverwrites
          });
          console.log(`  📜 Channel created: ${channel.name}`);
        }

        // Setup Interactive Embeds
        if (chSpec.special === 'verification') {
          const embed = new EmbedBuilder()
            .setTitle('🔒 Verification Gateway - CYBERSECURITY COMMUNITY OF ACEH')
            .setDescription('Selamat datang di server resmi CCA!\n\nUntuk mendapatkan akses penuh ke seluruh channel & resource komunitas, silakan selesaikan tantangan verifikasi anti-bot dengan mengklik tombol di bawah ini.')
            .setColor(0x00CCCC);
          const btn = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('btn_verify')
              .setLabel('🛡️ Verifikasi Anggota CCA')
              .setStyle(ButtonStyle.Success)
          );
          await channel.send({ embeds: [embed], components: [btn] });
        } else if (chSpec.special === 'ticket') {
          const embed = new EmbedBuilder()
            .setTitle('🎟️ CCA Helpdesk & Support Ticket')
            .setDescription('Butuh bantuan teknis, bermaksud membuat laporan, atau ingin berkonsultasi dengan pengurus CCA?\n\nKlik tombol **Buka Tiket** di bawah untuk membuka Private Thread diskusi bersama Tim Moderator.')
            .setColor(0x0066CC);
          const btn = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('btn_open_ticket')
              .setLabel('🎟️ Buka Tiket Bantuan')
              .setStyle(ButtonStyle.Primary)
          );
          await channel.send({ embeds: [embed], components: [btn] });
        }
      }
    }

    console.log('✅ Server architecture successfully created!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error building server:', err);
    process.exit(1);
  }
});

client.login(BOT_TOKEN);
```

---

### Task 4: Main Bot Engine & Interaction Handler (`src/index.js`, `src/events/interactionCreate.js`)

**Files:**
- Create: `e:\laragon\www\diskot\src\index.js`
- Create: `e:\laragon\www\diskot\src\events\interactionCreate.js`
- Create: `e:\laragon\www\diskot\src\features\verification.js`
- Create: `e:\laragon\www\diskot\src\features\tickets.js`

**Interfaces:**
- Consumes: `src/db/database.js`, `src/config.js`
- Handles: Button clicks, modal submits, rate-limiting (5s per user per button).

- [ ] **Step 1: Create `src/features/verification.js`**

```javascript
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../db/database');

const activeChallenges = new Map();

function generateChallenge(userId) {
  const num1 = Math.floor(Math.random() * 80) + 10;
  const num2 = Math.floor(Math.random() * 9) + 1;
  const answer = (num1 + num2).toString();
  activeChallenges.set(userId, { answer, expires: Date.now() + 180000 });
  return { num1, num2 };
}

async function handleVerificationButton(interaction) {
  const challenge = generateChallenge(interaction.user.id);
  const modal = new ModalBuilder()
    .setCustomId('modal_verify_captcha')
    .setTitle('🛡️ Captcha Verification');

  const input = new TextInputBuilder()
    .setCustomId('captcha_answer')
    .setLabel(`Berapa hasil dari ${challenge.num1} + ${challenge.num2}?`)
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Masukkan angka jawaban di sini')
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(input));
  await interaction.showModal(modal);
}

async function handleVerificationModal(interaction) {
  const userId = interaction.user.id;
  const userAnswer = interaction.fields.getTextInputValue('captcha_answer').trim();
  const challenge = activeChallenges.get(userId);

  if (!challenge || Date.now() > challenge.expires) {
    return interaction.reply({ content: '❌ Sesi verifikasi expired. Silakan klik tombol verifikasi lagi.', ephemeral: true });
  }

  if (userAnswer !== challenge.answer) {
    return interaction.reply({ content: `❌ Jawaban salah! (${challenge.num1} + ${challenge.num2} bukan ${userAnswer}). Coba lagi.`, ephemeral: true });
  }

  activeChallenges.delete(userId);

  const guild = interaction.guild;
  const verifiedRole = guild.roles.cache.find(r => r.name === '[CCA] Verified Member');
  if (verifiedRole) {
    await interaction.member.roles.add(verifiedRole);
  }

  // Save to DB
  db.run('INSERT OR REPLACE INTO verifications (user_id) VALUES (?)', [userId]);

  // Send greeting to welcome lobby
  const welcomeCh = guild.channels.cache.find(c => c.name === '👋-welcome-lobby');
  if (welcomeCh) {
    const embed = new EmbedBuilder()
      .setTitle('🎉 Anggota Baru Terverifikasi!')
      .setDescription(`Selamat datang <@${userId}> di **CYBERSECURITY COMMUNITY OF ACEH (CCA)**! 🛡️\nSilakan baca aturan di `#📜-rules-and-guidelines` dan mulai berdiskusi.`)
      .setColor(0x00CCCC)
      .setTimestamp();
    await welcomeCh.send({ embeds: [embed] });
  }

  await interaction.reply({ content: '✅ Verifikasi sukses! Anda telah diberikan akses sebagai `[CCA] Verified Member`.', ephemeral: true });
}

module.exports = { handleVerificationButton, handleVerificationModal };
```

- [ ] **Step 2: Create `src/features/tickets.js`**

```javascript
const { ChannelType, ThreadAutoArchiveDuration, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../db/database');

async function handleOpenTicketButton(interaction) {
  const guild = interaction.guild;
  const userId = interaction.user.id;

  // Fetch ticket counter from DB
  db.get('SELECT MAX(ticket_number) as max_num FROM tickets', async (err, row) => {
    const nextNum = (row && row.max_num) ? row.max_num + 1 : 1;
    const ticketName = `ticket-${String(nextNum).padStart(4, '0')}`;

    const ticketChannel = interaction.channel; // #create-ticket
    const thread = await ticketChannel.threads.create({
      name: ticketName,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
      type: ChannelType.PrivateThread,
      reason: `Ticket created by ${interaction.user.tag}`
    });

    await thread.members.add(userId);

    // Save ticket to DB
    db.run('INSERT INTO tickets (ticket_number, thread_id, user_id) VALUES (?, ?, ?)', [nextNum, thread.id, userId]);

    const embed = new EmbedBuilder()
      .setTitle(`🎟️ Helpdesk Ticket #${String(nextNum).padStart(4, '0')}`)
      .setDescription(`Halo <@${userId}>,\nTerima kasih telah menghubungi Helpdesk CCA! Tim Moderator (`[CCA] Cyber Sentinel`) akan segera membantu kendala Anda.\n\nKlik **Tutup Tiket** di bawah jika masalah sudah selesai.`)
      .setColor(0x0066CC);

    const btn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_close_ticket')
        .setLabel('🔒 Tutup Tiket')
        .setStyle(ButtonStyle.Danger)
    );

    await thread.send({ embeds: [embed], components: [btn] });
    await interaction.reply({ content: `✅ Tiket berhasil dibuat: <#${thread.id}>`, ephemeral: true });
  });
}

async function handleCloseTicketButton(interaction) {
  const thread = interaction.channel;
  if (!thread.isThread()) return;

  await interaction.reply({ content: '🔒 Tiket akan ditutup dan diarsipkan dalam 5 detik...' });

  setTimeout(async () => {
    db.run('UPDATE tickets SET status = ? WHERE thread_id = ?', ['CLOSED', thread.id]);
    
    // Log to transcript channel
    const transcriptCh = interaction.guild.channels.cache.find(c => c.name === '📂-ticket-transcripts');
    if (transcriptCh) {
      const embed = new EmbedBuilder()
        .setTitle(`📂 Ticket Transcript Archived: ${thread.name}`)
        .setDescription(`Tiket <#${thread.id}> telah ditutup oleh <@${interaction.user.id}>.`)
        .setColor(0x990000)
        .setTimestamp();
      await transcriptCh.send({ embeds: [embed] });
    }

    await thread.setArchived(true);
  }, 5000);
}

module.exports = { handleOpenTicketButton, handleCloseTicketButton };
```

- [ ] **Step 3: Create `src/events/interactionCreate.js`**

```javascript
const { handleVerificationButton, handleVerificationModal } = require('../features/verification');
const { handleOpenTicketButton, handleCloseTicketButton } = require('../features/tickets');

const cooldowns = new Map();

module.exports = async (interaction) => {
  if (interaction.isButton()) {
    // 5-second per user rate limiting
    const cooldownKey = `${interaction.user.id}_${interaction.customId}`;
    if (cooldowns.has(cooldownKey) && Date.now() < cooldowns.get(cooldownKey)) {
      return interaction.reply({ content: '⚠️ Harap tunggu beberapa detik sebelum mengklik tombol lagi.', ephemeral: true });
    }
    cooldowns.set(cooldownKey, Date.now() + 5000);

    if (interaction.customId === 'btn_verify') {
      await handleVerificationButton(interaction);
    } else if (interaction.customId === 'btn_open_ticket') {
      await handleOpenTicketButton(interaction);
    } else if (interaction.customId === 'btn_close_ticket') {
      await handleCloseTicketButton(interaction);
    }
  } else if (interaction.isModalSubmit()) {
    if (interaction.customId === 'modal_verify_captcha') {
      await handleVerificationModal(interaction);
    }
  }
};
```

- [ ] **Step 4: Create `src/index.js`**

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const { BOT_TOKEN } = require('./config');
const { initDatabase } = require('./db/database');
const interactionCreate = require('./events/interactionCreate');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

client.once('ready', () => {
  console.log(`⚡ CCA Discord Bot is online as ${client.user.tag}`);
});

client.on('interactionCreate', interactionCreate);

initDatabase().then(() => {
  client.login(BOT_TOKEN);
}).catch(err => {
  console.error("❌ Database initialization error:", err);
});
```

---

### Task 5: Automated Cyber News Feed with RSS Deduplication (`src/features/newsFeed.js`)

**Files:**
- Create: `e:\laragon\www\diskot\src\features\newsFeed.js`
- Modify: `e:\laragon\www\diskot\src\index.js`

**Interfaces:**
- Consumes: `rss-parser`, `src/db/database.js`
- Posts RSS items to `#cyber-news` every 60 minutes without duplicate postings across bot restarts.

- [ ] **Step 1: Create `src/features/newsFeed.js`**

```javascript
const Parser = require('rss-parser');
const { EmbedBuilder } = require('discord.js');
const { db } = require('../db/database');

const parser = new Parser();
const FEEDS = [
  { name: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews' },
  { name: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/feed/' }
];

async function checkCyberNewsFeed(client, guildId) {
  try {
    const guild = await client.guilds.fetch(guildId);
    const newsCh = guild.channels.cache.find(c => c.name === '🗞️-cyber-news');
    if (!newsCh) return;

    for (const feedConfig of FEEDS) {
      const feed = await parser.parseURL(feedConfig.url);
      for (const item of feed.items.slice(0, 3)) { // Check top 3 items
        const guid = item.guid || item.link;

        // Check if posted in DB
        db.get('SELECT guid FROM rss_posted WHERE guid = ?', [guid], async (err, row) => {
          if (err || row) return; // Skip if error or already posted

          const embed = new EmbedBuilder()
            .setTitle(`🗞️ [${feedConfig.name}] ${item.title}`)
            .setURL(item.link)
            .setDescription(item.contentSnippet ? item.contentSnippet.substring(0, 250) + '...' : 'Klik tautan untuk membaca berita lengkap.')
            .setColor(0x00CCCC)
            .setTimestamp(new Date(item.pubDate || Date.now()));

          await newsCh.send({ embeds: [embed] });

          // Insert into DB to deduplicate
          db.run('INSERT INTO rss_posted (guid, source) VALUES (?, ?)', [guid, feedConfig.name]);
        });
      }
    }
  } catch (err) {
    console.error('❌ Error fetching RSS cyber news feed:', err.message);
  }
}

function startNewsFeedService(client, guildId) {
  // Initial check on startup after 10s delay
  setTimeout(() => checkCyberNewsFeed(client, guildId), 10000);
  // Schedule every 60 minutes
  setInterval(() => checkCyberNewsFeed(client, guildId), 3600000);
}

module.exports = { startNewsFeedService };
```

- [ ] **Step 2: Modify `src/index.js` to register news feed service**

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const { BOT_TOKEN, GUILD_ID } = require('./config');
const { initDatabase } = require('./db/database');
const interactionCreate = require('./events/interactionCreate');
const { startNewsFeedService } = require('./features/newsFeed');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

client.once('ready', () => {
  console.log(`⚡ CCA Discord Bot is online as ${client.user.tag}`);
  startNewsFeedService(client, GUILD_ID);
});

client.on('interactionCreate', interactionCreate);

initDatabase().then(() => {
  client.login(BOT_TOKEN);
}).catch(err => {
  console.error("❌ Database initialization error:", err);
});
```

---

### Task 6: Anti-Nuke Security Listener (`src/events/antiNuke.js`)

**Files:**
- Create: `e:\laragon\www\diskot\src\events\antiNuke.js`
- Modify: `e:\laragon\www\diskot\src\index.js`

**Interfaces:**
- Listens to `channelDelete` events. If >3 channels deleted within 10s by same user, revokes moderation roles and logs emergency alert.

- [ ] **Step 1: Create `src/events/antiNuke.js`**

```javascript
const { AuditLogEvent, EmbedBuilder } = require('discord.js');

const deleteTracker = new Map();

async function handleChannelDelete(channel) {
  try {
    const guild = channel.guild;
    const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete });
    const entry = auditLogs.entries.first();
    if (!entry) return;

    const executor = entry.executor;
    if (executor.bot) return; // Skip bot actions

    const userId = executor.id;
    const now = Date.now();

    if (!deleteTracker.has(userId)) {
      deleteTracker.set(userId, []);
    }

    const timestamps = deleteTracker.get(userId).filter(t => now - t < 10000); // 10s window
    timestamps.push(now);
    deleteTracker.set(userId, timestamps);

    if (timestamps.length >= 3) {
      console.warn(`🚨 ANTI-NUKE TRIGGERED: ${executor.tag} deleted ${timestamps.length} channels in 10s!`);

      const member = await guild.members.fetch(userId);
      const sentinelRole = guild.roles.cache.find(r => r.name === '[CCA] Cyber Sentinel');
      if (sentinelRole && member.roles.cache.has(sentinelRole.id)) {
        await member.roles.remove(sentinelRole, 'Anti-nuke triggered: Mass channel deletion');
      }

      const auditCh = guild.channels.cache.find(c => c.name === '🚨-audit-and-security-logs');
      if (auditCh) {
        const embed = new EmbedBuilder()
          .setTitle('🚨 EMERGENCY: ANTI-NUKE SAFEGUARD TRIGGERED')
          .setDescription(`Pengguna <@${userId}> (\`${executor.tag}\`) terdeteksi menghapus ${timestamps.length} channel dalam 10 detik!\n\n**Tindakan Otomatis:** Role Moderasi (\`[CCA] Cyber Sentinel\`) telah dicabut otomatis demi keamanan server.`)
          .setColor(0x990000)
          .setTimestamp();
        await auditCh.send({ embeds: [embed] });
      }
    }
  } catch (err) {
    console.error('Error in anti-nuke handler:', err);
  }
}

module.exports = { handleChannelDelete };
```

- [ ] **Step 2: Modify `src/index.js` to hook `channelDelete`**

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const { BOT_TOKEN, GUILD_ID } = require('./config');
const { initDatabase } = require('./db/database');
const interactionCreate = require('./events/interactionCreate');
const { startNewsFeedService } = require('./features/newsFeed');
const { handleChannelDelete } = require('./events/antiNuke');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

client.once('ready', () => {
  console.log(`⚡ CCA Discord Bot is online as ${client.user.tag}`);
  startNewsFeedService(client, GUILD_ID);
});

client.on('interactionCreate', interactionCreate);
client.on('channelDelete', handleChannelDelete);

initDatabase().then(() => {
  client.login(BOT_TOKEN);
}).catch(err => {
  console.error("❌ Database initialization error:", err);
});
```

---

## Plan Review & Handoff
Plan complete and saved to `docs/superpowers/plans/2026-08-11-cca-discord-bot.md`.
