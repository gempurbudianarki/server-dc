const Parser = require('rss-parser');
const { EmbedBuilder } = require('discord.js');
const { db } = require('../db/database');

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
  }
});

const BOUNTY_FEEDS = [
  { name: 'Bug Bounty Writeups & Writeups', url: 'https://medium.com/feed/tag/bug-bounty' },
  { name: 'Full Disclosure Vulnerabilities', url: 'https://seclists.org/rss/fulldisclosure.rss' }
];

const STARTER_BOUNTY_PROGRAMS = [
  {
    guid: 'starter_google_vrp',
    title: '🌐 GOOGLE VULNERABILITY REWARD PROGRAM (VRP)',
    company: 'Google / Android / Chromium',
    scope: '*.google.com, *.youtube.com, Android OS, Chrome',
    payout: '💰 $500 - $31,337+ USD (Hingga Rp 500 Juta!)',
    severity: 'CRITICAL / HIGH / MEDIUM',
    link: 'https://bughunters.google.com/',
    desc: 'Program bug bounty resmi Google untuk menemukan kerentanan RCE, SQLi, Sandbox Escape, dan Authentication Bypass pada seluruh ekosistem layanan Google.'
  },
  {
    guid: 'starter_meta_bounty',
    title: '🌐 META BUG BOUNTY PROGRAM',
    company: 'Meta (Facebook / Instagram / WhatsApp)',
    scope: '*.facebook.com, *.instagram.com, WhatsApp, Oculus',
    payout: '💰 $500 - $50,000+ USD (Tanpa Batas Atas!)',
    severity: 'CRITICAL / HIGH',
    link: 'https://www.facebook.com/whitehat',
    desc: 'Program Bug Bounty Meta memberikan apresiasi finansial bagi peneliti yang melaporkan kerentanan Account Takeover, IDOR, RCE, dan Data Leak.'
  },
  {
    guid: 'starter_github_bounty',
    title: '🌐 GITHUB SECURITY BUG BOUNTY',
    company: 'GitHub / Microsoft',
    scope: 'github.com, GitHub Enterprise, Actions, API',
    payout: '💰 $617 - $30,000+ USD / Bug',
    severity: 'CRITICAL / HIGH',
    link: 'https://bounty.github.com/',
    desc: 'Temukan kerentanan pada platform GitHub Actions, Enterprise Server, dan API resmi GitHub untuk memenangkan reward uang tunai.'
  }
];

async function seedInitialBountyPosts(guild, bountyCh) {
  for (const prog of STARTER_BOUNTY_PROGRAMS) {
    db.get('SELECT guid FROM bounty_posted WHERE guid = ?', [prog.guid], async (err, row) => {
      if (err || row) return; // Skip if already posted

      const embed = new EmbedBuilder()
        .setTitle(`🎯 [FEATURED BUG BOUNTY] ${prog.title}`)
        .setURL(prog.link)
        .setDescription(
          `\`\`\`text\n[+] OFFICIAL BOUNTY PROGRAM INFO\n[+] PAYOUT REWARD: ACTIVE\n\`\`\`\n` +
          `${prog.desc}`
        )
        .addFields(
          { name: '🏢 PERUSAHAAN TARGET', value: `> \`${prog.company}\``, inline: true },
          { name: '🎯 REKAP PAYOUT / REWARD', value: `> **${prog.payout}**`, inline: false },
          { name: '🌐 TARGET SCOPE', value: `\`${prog.scope}\``, inline: false },
          { name: '🔗 RESOURCE & DIRECTORY', value: `[Buka Deskripsi & Daftarkan Diri di ${prog.company}](${prog.link})`, inline: false }
        )
        .setColor(0xFFD700)
        .setFooter({ text: 'CCA Bug Bounty Feed System • Verified Payout Info' })
        .setTimestamp();

      await bountyCh.send({ embeds: [embed] }).catch(() => {});
      db.run('INSERT INTO bounty_posted (guid, title) VALUES (?, ?)', [prog.guid, prog.title]);
    });
  }
}

async function checkBountyFeed(client, guildId) {
  try {
    const guild = await client.guilds.fetch(guildId);
    const bountyCh = guild.channels.cache.find(c => c.name.includes('info-bug-bounty'));
    if (!bountyCh) return;

    // First seed featured starter programs
    await seedInitialBountyPosts(guild, bountyCh);

    // Fetch RSS updates
    for (const feedConfig of BOUNTY_FEEDS) {
      try {
        const feed = await parser.parseURL(feedConfig.url);
        for (const item of (feed.items || []).slice(0, 3)) {
          const guid = item.guid || item.link;

          db.get('SELECT guid FROM bounty_posted WHERE guid = ?', [guid], async (err, row) => {
            if (err || row) return;

            const titleText = item.title || 'Informasi Celah Security & Bounty';
            const snippet = item.contentSnippet ? item.contentSnippet.substring(0, 250) : 'Tinjau analisis riset dan informasi pembayaran celah keamanan terbaru.';

            const embed = new EmbedBuilder()
              .setTitle(`🎯 [${feedConfig.name}] ${titleText}`)
              .setURL(item.link)
              .setDescription(
                `\`\`\`text\n[+] NEW BUG DISCLOSURE / WRITEUP DETECTED\n\`\`\`\n` +
                `${snippet}...`
              )
              .addFields(
                { name: '💰 CATEGORY & SOURCE', value: `> **Source:** \`${feedConfig.name}\`\n> **Type:** \`Writeup / Disclosure\``, inline: false },
                { name: '🔗 DETAIL LINK', value: `[Baca Rincian Riset & Penjelasannya](${item.link})`, inline: false }
              )
              .setColor(0x00F0FF)
              .setFooter({ text: 'CCA Bug Bounty Feed • Keep Learning & Hacking' })
              .setTimestamp(new Date(item.pubDate || Date.now()));

            await bountyCh.send({ embeds: [embed] }).catch(() => {});
            db.run('INSERT INTO bounty_posted (guid, title) VALUES (?, ?)', [guid, titleText]);
          });
        }
      } catch (feedErr) {
        console.error(`⚠️ Bounty RSS fetch error (${feedConfig.name}):`, feedErr.message);
      }
    }
  } catch (err) {
    console.error('❌ Error fetching Bug Bounty feed:', err.message);
  }
}

function startBountyFeedService(client, guildId) {
  // Initial check on startup after 3s delay
  setTimeout(() => checkBountyFeed(client, guildId), 3000);
  // Schedule check every 60 minutes
  setInterval(() => checkBountyFeed(client, guildId), 3600000);
}

module.exports = { startBountyFeedService };
