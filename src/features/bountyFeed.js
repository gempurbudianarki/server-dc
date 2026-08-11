const Parser = require('rss-parser');
const { EmbedBuilder } = require('discord.js');
const { db } = require('../db/database');

const parser = new Parser();
const BOUNTY_FEEDS = [
  { name: 'HackerOne Hacktivity', url: 'https://hackerone.com/hacktivity.rss' }
];

async function checkBountyFeed(client, guildId) {
  try {
    const guild = await client.guilds.fetch(guildId);
    const bountyCh = guild.channels.cache.find(c => c.name.includes('info-bug-bounty'));
    if (!bountyCh) return;

    for (const feedConfig of BOUNTY_FEEDS) {
      const feed = await parser.parseURL(feedConfig.url);
      for (const item of feed.items.slice(0, 5)) { // Check top 5 bounty items
        const guid = item.guid || item.link;

        // Check if posted in DB
        db.get('SELECT guid FROM bounty_posted WHERE guid = ?', [guid], async (err, row) => {
          if (err || row) return; // Skip if already posted or error

          // Extract title, bounty amount if present, or severity
          const titleText = item.title || 'Laporan Bug Bounty Disclosed';
          const contentText = item.contentSnippet ? item.contentSnippet.substring(0, 300) : 'Klik tautan di bawah untuk membaca detail rincian bug dan besaran bayaran.';

          const embed = new EmbedBuilder()
            .setTitle(`🎯 [${feedConfig.name}] ${titleText}`)
            .setURL(item.link)
            .setDescription(
              `\`\`\`text\n[+] NEW BOUNTY REPORT DISCLOSED\n[+] STATUS: VERIFIED & AWARDED\n\`\`\`\n` +
              `**Detail Laporan & Celah Keamanan:**\n${contentText}...`
            )
            .addFields(
              { name: '💰 PAYOUT & INFO', value: `> **Platform:** \`${feedConfig.name}\`\n> **Status:** \`DISCLOSED / PUBLISHED\``, inline: false },
              { name: '🔗 RESOURCE LINK', value: `[Buka Laporan Bug Resmi di HackerOne](${item.link})`, inline: false }
            )
            .setColor(0xFFD700) // Gold Color for Bounty Rewards
            .setFooter({ text: 'CCA Bug Bounty Feed • Selalu Update Info Bounty Terbaru' })
            .setTimestamp(new Date(item.pubDate || Date.now()));

          await bountyCh.send({ embeds: [embed] });

          // Insert into DB to deduplicate
          db.run('INSERT INTO bounty_posted (guid, title) VALUES (?, ?)', [guid, titleText]);
        });
      }
    }
  } catch (err) {
    console.error('❌ Error fetching Bug Bounty feed:', err.message);
  }
}

function startBountyFeedService(client, guildId) {
  // Initial check on startup after 15s delay
  setTimeout(() => checkBountyFeed(client, guildId), 15000);
  // Schedule check every 60 minutes
  setInterval(() => checkBountyFeed(client, guildId), 3600000);
}

module.exports = { startBountyFeedService };
