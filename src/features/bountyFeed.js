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
  { name: 'Bug Bounty Writeups', url: 'https://medium.com/feed/tag/bug-bounty' },
  { name: 'Full Disclosure Vulnerabilities', url: 'https://seclists.org/rss/fulldisclosure.rss' }
];

const FEATURED_BOUNTIES = [
  {
    guid: 'featured_google_vrp_v2',
    title: 'GOOGLE VULNERABILITY REWARD PROGRAM (VRP)',
    company: 'Google LLC / Android / Chromium',
    scope: '`*.google.com` • `*.youtube.com` • `Android OS` • `Chrome`',
    payout: '💰 **$500 – $31,337+ USD** *(Hingga Rp 500 Juta+ per Bug!)*',
    severity: '🔴 **CRITICAL / HIGH**',
    link: 'https://bughunters.google.com/',
    desc: 'Program resmi Google untuk peretasan etis (*White-Hat*). Hadiah uang tunai diberikan untuk temuan RCE, SQLi, Sandbox Escape, dan Auth Bypass.'
  },
  {
    guid: 'featured_meta_bounty_v2',
    title: 'META WHITEHAT BUG BOUNTY PROGRAM',
    company: 'Meta (Facebook / Instagram / WhatsApp)',
    scope: '`*.facebook.com` • `*.instagram.com` • `WhatsApp` • `Oculus`',
    payout: '💰 **$500 – $50,000+ USD** *(Tanpa Batas Maksimum!)*',
    severity: '🔴 **CRITICAL / HIGH**',
    link: 'https://www.facebook.com/whitehat',
    desc: 'Bounty reward tertinggi untuk penemuan celah Account Takeover (ATO), Zero-Day IDOR, Remote Code Execution, dan kebocoran data sensitif.'
  },
  {
    guid: 'featured_github_bounty_v2',
    title: 'GITHUB SECURITY BUG BOUNTY',
    company: 'GitHub / Microsoft Corp.',
    scope: '`github.com` • `GitHub Enterprise` • `Actions API`',
    payout: '💰 **$617 – $30,000+ USD** / Valid Report',
    severity: '🟣 **HIGH / MEDIUM**',
    link: 'https://bounty.github.com/',
    desc: 'Lakukan pengujian keamanan pada platform pengembangan perangkat lunak terbesar di dunia dan dapatkan reward bayaran tunai.'
  }
];

async function seedUltraModernBounties(bountyCh) {
  for (const prog of FEATURED_BOUNTIES) {
    db.get('SELECT guid FROM bounty_posted WHERE guid = ?', [prog.guid], async (err, row) => {
      if (err || row) return;

      const embed = new EmbedBuilder()
        .setTitle(`⚡ 𝖡𝖴𝖦 𝖡𝖮𝖴𝖭𝖳𝖸 𝖨𝖭𝖳𝖤𝖫 // ${prog.title}`)
        .setURL(prog.link)
        .setDescription(
          `\`\`\`text\n[+] PROGRAM IDENTITY : ${prog.company}\n[+] SECURITY BOUNTY   : ACTIVE & CONFIRMED\n\`\`\`\n` +
          `**📌 Deskripsi Program:**\n${prog.desc}`
        )
        .addFields(
          { name: '💵 EKSPEKTASI PAYOUT / REWARD', value: `> ${prog.payout}`, inline: false },
          { name: '🌐 TARGET SCOPE', value: `> ${prog.scope}`, inline: false },
          { name: '🚨 TINGKAT SEVERITY', value: `> ${prog.severity}`, inline: true },
          { name: '🔗 RESOURCE ACCESS', value: `👉 [**KLIK DI SINI UNTUK BUKA DIREKTORI ${prog.title}**](${prog.link})`, inline: false }
        )
        .setColor(0xFFD700)
        .setFooter({ text: 'CCA Cyber Intel Matrix v2.0 • Premium Bounty Feed' })
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

    await seedUltraModernBounties(bountyCh);

    for (const feedConfig of BOUNTY_FEEDS) {
      try {
        const feed = await parser.parseURL(feedConfig.url);
        for (const item of (feed.items || []).slice(0, 3)) {
          const guid = item.guid || item.link;

          db.get('SELECT guid FROM bounty_posted WHERE guid = ?', [guid], async (err, row) => {
            if (err || row) return;

            const titleText = item.title || 'Informasi Vulnerability & Writeup Bug Bounty';
            const snippet = item.contentSnippet ? item.contentSnippet.substring(0, 220).replace(/\n/g, ' ') : 'Klik tautan untuk membaca analisis eksploitasi selengkapnya.';

            const embed = new EmbedBuilder()
              .setTitle(`🚨 𝖢𝖸𝖡𝖤𝖱 𝖨𝖭𝖳𝖤𝖫 // ${titleText.toUpperCase()}`)
              .setURL(item.link)
              .setDescription(
                `\`\`\`text\n[+] TYPE   : VULNERABILITY DISCLOSURE / WRITEUP\n[+] SOURCE : ${feedConfig.name.toUpperCase()}\n\`\`\`\n` +
                `**📝 Ringkasan Analisis Teknis:**\n> ${snippet}...`
              )
              .addFields(
                { name: '📡 KATEGORI FEED', value: `\`${feedConfig.name}\``, inline: true },
                { name: '⚡ STATUS EXPLOIT', value: `\`DISCLOSED / PROOF OF CONCEPT\``, inline: true },
                { name: '🔗 ACCESS PROTOCOL', value: `👉 [**BACA METODE EKSPLOIT & TEKNIK SELENGKAPNYA**](${item.link})`, inline: false }
              )
              .setColor(0x00F0FF)
              .setFooter({ text: 'CCA Cyber Intel Matrix v2.0 • Encrypted Feed' })
              .setTimestamp(new Date(item.pubDate || Date.now()));

            await bountyCh.send({ embeds: [embed] }).catch(() => {});
            db.run('INSERT INTO bounty_posted (guid, title) VALUES (?, ?)', [guid, titleText]);
          });
        }
      } catch (feedErr) {
        console.error(`⚠️ Bounty RSS error (${feedConfig.name}):`, feedErr.message);
      }
    }
  } catch (err) {
    console.error('❌ Error fetching Bug Bounty feed:', err.message);
  }
}

function startBountyFeedService(client, guildId) {
  setTimeout(() => checkBountyFeed(client, guildId), 2000);
  setInterval(() => checkBountyFeed(client, guildId), 3600000);
}

module.exports = { startBountyFeedService };
