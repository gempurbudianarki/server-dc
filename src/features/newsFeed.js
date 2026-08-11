const Parser = require('rss-parser');
const { EmbedBuilder } = require('discord.js');
const { db } = require('../db/database');

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  }
});

const FEEDS = [
  { name: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews', badge: '🗞️ THE HACKER NEWS' },
  { name: 'CISA Cyber Advisories', url: 'https://www.cisa.gov/cybersecurity-advisories/all.xml', badge: '🚨 CISA GLOBAL INTEL' },
  { name: 'SecurityWeek', url: 'https://www.securityweek.com/feed/', badge: '🌐 SECURITY WEEK' }
];

async function checkCyberNewsFeed(client, guildId) {
  try {
    const guild = await client.guilds.fetch(guildId);
    const newsCh = guild.channels.cache.find(c => c.name.includes('feed-berita-cyber') || c.name.includes('threat'));
    if (!newsCh) return;

    for (const feedConfig of FEEDS) {
      try {
        const feed = await parser.parseURL(feedConfig.url);
        for (const item of (feed.items || []).slice(0, 3)) {
          const guid = item.guid || item.link;

          db.get('SELECT guid FROM rss_posted WHERE guid = ?', [guid], async (err, row) => {
            if (err || row) return; // Skip if already posted

            const titleText = item.title || 'Cyber Security Threat Update';
            const snippet = item.contentSnippet ? item.contentSnippet.substring(0, 260).replace(/\n/g, ' ') : 'Klik tautan di bawah untuk membaca analisis intelijen keamanan selengkapnya.';

            const embed = new EmbedBuilder()
              .setTitle(`🚨 𝖢𝖸𝖡𝖤𝖱 𝖨𝖭𝖳𝖤𝖫 // ${titleText.toUpperCase()}`)
              .setURL(item.link)
              .setDescription(
                `\`\`\`text\n[+] THREAT INTEL FEED : ${feedConfig.badge}\n[+] STATUS READOUT     : VERIFIED THREAT / NEWS ALERT\n\`\`\`\n` +
                `**📌 Ringkasan Berita & Dampak Keamanan:**\n> ${snippet}...`
              )
              .addFields(
                { name: '📡 SUMBER INTEL', value: `\`${feedConfig.name}\``, inline: true },
                { name: '🛡️ KATEGORI', value: `\`Cyber Threat & Zero-Day Alert\``, inline: true },
                { name: '🔗 RESOURCE LINK', value: `👉 [**KLIK DI SINI UNTUK BACA ARTIKEL INTEL LENGKAPNYA**](${item.link})`, inline: false }
              )
              .setColor(0x00F0FF)
              .setFooter({ text: 'CCA Cyber Threat Intel System v2.0 • Encrypted News Feed' })
              .setTimestamp(new Date(item.pubDate || Date.now()));

            await newsCh.send({ embeds: [embed] }).catch(() => {});
            db.run('INSERT INTO rss_posted (guid, source) VALUES (?, ?)', [guid, feedConfig.name]);
          });
        }
      } catch (feedErr) {
        console.error(`⚠️ News RSS error (${feedConfig.name}):`, feedErr.message);
      }
    }
  } catch (err) {
    console.error('❌ Error fetching RSS cyber news feed:', err.message);
  }
}

function startNewsFeedService(client, guildId) {
  setTimeout(() => checkCyberNewsFeed(client, guildId), 2000);
  setInterval(() => checkCyberNewsFeed(client, guildId), 3600000);
}

module.exports = { startNewsFeedService };
